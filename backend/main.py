from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from agents.document_parser import analyze_tuition_bill
from agents.policy_rag import search_handbook, generate_advice
from agents.grant_writer import write_grant_essay
from io import BytesIO

load_dotenv()

app = FastAPI(title="ScholarShield API", version="1.0.0")

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


@app.post("/api/analyze-bill")
async def analyze_bill_endpoint(file: UploadFile = File(...)):
    """
    Endpoint to analyze a uploaded tuition bill PDF.
    """
    try:
        # Read file into memory
        file_contents = await file.read()
        file_stream = BytesIO(file_contents)
        
        # Analyze the bill
        result = await analyze_tuition_bill(file_stream)
        
        return {
            "success": True,
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class PolicyCheckRequest(BaseModel):
    query: str


@app.post("/api/policy-check")
async def policy_check_endpoint(request: PolicyCheckRequest):
    """
    Endpoint to check university policies using RAG.
    """
    try:
        # Search the handbook
        search_results = await search_handbook(request.query)
        
        # Generate advice based on search results
        advice = await generate_advice(search_results, request.query)
        
        return {
            "success": True,
            "search_results": search_results,
            "advice": advice
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


class GrantEssayRequest(BaseModel):
    student_profile: dict
    grant_requirements: str


@app.post("/api/write-grant")
async def write_grant_endpoint(request: GrantEssayRequest):
    """
    Endpoint to generate a grant application essay.
    """
    try:
        essay = await write_grant_essay(
            student_profile=request.student_profile,
            grant_requirements=request.grant_requirements
        )
        
        return {
            "success": True,
            "essay": essay
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

