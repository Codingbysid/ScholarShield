"""
ScholarShield API: Main FastAPI application

This module provides the REST API endpoints for the ScholarShield application,
handling file uploads, orchestrating agent workflows, and serving responses.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import os
from dotenv import load_dotenv
from io import BytesIO
from pathlib import Path
from agents.orchestrator import ScholarShieldOrchestrator
from agents.grant_writer import write_grant_essay
from agents.parent_explainer import explain_to_parent
from agents.constants import ASSESSMENT_STATUS_COMPLETED

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from root directory (parent of backend/)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="ScholarShield API",
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

# Initialize orchestrator
orchestrator = ScholarShieldOrchestrator()

# CORS configuration - secure for production
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    # Production: use environment variable (comma-separated)
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",")]
else:
    # Development: default to localhost
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
    max_age=3600,
)

# Security: Trusted Host Middleware (only in production)
if os.getenv("ENVIRONMENT") == "production":
    trusted_hosts = os.getenv("TRUSTED_HOSTS", "").split(",")
    if trusted_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.get("/")
async def root():
    return {"message": "ScholarShield API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/assess-financial-health")
async def assess_financial_health(file: UploadFile = File(...)):
    """
    Main orchestrator endpoint that processes a complete student financial case.
    
    This endpoint:
    1. Analyzes the uploaded tuition bill
    2. Calculates financial risk level
    3. Searches university policies if risk is elevated
    4. Generates policy advice
    5. Drafts negotiation email if risk is CRITICAL
    6. Returns comprehensive assessment with recommended actions
    """
    try:
        # Validate file type
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )
        
        # Validate file size (max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file_contents = await file.read()
        if len(file_contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024):.0f}MB limit"
            )
        
        file_stream = BytesIO(file_contents)
        
        # Process through orchestrator
        assessment = await orchestrator.process_student_case(file_stream)
        
        return {
            "success": assessment.get("status") == ASSESSMENT_STATUS_COMPLETED,
            "assessment": assessment,
        }
    except ValueError as e:
        logger.error(f"Validation error in financial health assessment: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error processing financial health assessment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again."
        )


class GrantEssayRequest(BaseModel):
    """Request model for grant essay generation."""
    student_profile: Dict[str, Any] = Field(..., description="Student profile information")
    grant_requirements: str = Field(..., description="Requirements for the grant application")
    policy_context: List[str] = Field(default_factory=list, description="Optional policy citations to include")


@app.post("/api/write-grant")
async def write_grant_endpoint(request: GrantEssayRequest):
    """
    Endpoint to generate a grant application essay (standalone).
    Can be called independently or used by the orchestrator.
    """
    try:
        essay = await write_grant_essay(
            student_profile=request.student_profile,
            grant_requirements=request.grant_requirements,
            policy_context=request.policy_context if request.policy_context else None
        )
        
        return {
            "success": True,
            "essay": essay
        }
    except Exception as e:
        logger.error(f"Error generating grant essay: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate grant essay. Please try again."
        )


class ParentExplanationRequest(BaseModel):
    """Request model for parent explanation in their native language."""
    risk_summary: str = Field(
        ..., 
        description="Summary of financial situation (e.g., 'Risk CRITICAL. $1200 due on 2024-12-16')"
    )
    language: str = Field(
        default="es", 
        description="Language code for translation (es=Spanish, hi=Hindi, zh-Hans=Mandarin, ar=Arabic)"
    )


@app.post("/api/explain-to-parent")
async def explain_to_parent_endpoint(request: ParentExplanationRequest):
    """
    Endpoint to explain the financial situation to parents in their native language.
    
    This endpoint:
    1. Summarizes the risk_summary into a calm, reassuring script
    2. Translates it to the target language
    3. Converts it to speech audio
    4. Returns translated text and audio base64
    """
    try:
        result = await explain_to_parent(
            risk_summary=request.risk_summary,
            target_language=request.language
        )
        
        return {
            "success": True,
            "translated_text": result["translated_text"],
            "audio_base64": result["audio_base64"]
        }
    except Exception as e:
        logger.error(f"Error generating parent explanation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate parent explanation. Please try again."
        )

