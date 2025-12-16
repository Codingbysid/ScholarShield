from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
from dotenv import load_dotenv
from agents.orchestrator import ScholarShieldOrchestrator
from agents.grant_writer import write_grant_essay
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="ScholarShield API", version="2.0.0")

# Initialize orchestrator
orchestrator = ScholarShieldOrchestrator()

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        # Read file into memory
        file_contents = await file.read()
        file_stream = BytesIO(file_contents)
        
        # Process through orchestrator
        assessment = await orchestrator.process_student_case(file_stream)
        
        return {
            "success": assessment.get("status") == "completed",
            "assessment": assessment
        }
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Internal server error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class GrantEssayRequest(BaseModel):
    student_profile: dict
    grant_requirements: str
    policy_context: list = []


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
        logger.error(f"Error writing grant essay: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

