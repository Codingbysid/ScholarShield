"""
Grant Hunter Agent: Writes financial aid essays using Azure OpenAI
"""
import os
import logging
from typing import Dict
from openai import AzureOpenAI

# Mock mode flag
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an empathetic financial advocate for FGLI (First-Generation, Low-Income) students.
Your role is to write persuasive, formal essays for grant applications that highlight the student's resilience
and specific financial barriers.

Guidelines:
- Write approximately 300 words
- Focus on resilience and overcoming challenges
- Be specific about financial barriers
- Use a formal, respectful tone
- Highlight the student's achievements despite obstacles
- Emphasize how the grant would make a meaningful difference
- Do not include placeholders or bracketed text"""


async def write_grant_essay(student_profile: Dict, grant_requirements: str) -> str:
    """
    Writes a financial aid essay using Azure OpenAI.
    
    Args:
        student_profile: Dictionary containing:
            - major: Student's major/field of study
            - hardship_reason: Reason for financial hardship
            - gpa: Student's GPA
            - year: Academic year (optional)
        grant_requirements: String describing the grant requirements
        
    Returns:
        Essay text (string)
    """
    if MOCK_MODE:
        logger.info("Using mock mode for grant essay writing")
        return _mock_write_grant_essay(student_profile, grant_requirements)
    
    try:
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        key = os.getenv("AZURE_OPENAI_KEY")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
        
        if not endpoint or not key:
            raise ValueError("Azure OpenAI credentials not configured")
        
        client = AzureOpenAI(
            api_key=key,
            api_version="2024-02-15-preview",
            azure_endpoint=endpoint
        )
        
        # Build user prompt with student profile
        user_prompt = f"""Write a grant application essay for the following student:

Student Profile:
- Major: {student_profile.get('major', 'Not specified')}
- GPA: {student_profile.get('gpa', 'Not specified')}
- Hardship Reason: {student_profile.get('hardship_reason', 'Not specified')}
- Academic Year: {student_profile.get('year', 'Not specified')}

Grant Requirements:
{grant_requirements}

Write a compelling 300-word essay that demonstrates the student's need and merit."""
        
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        essay = response.choices[0].message.content.strip()
        return essay
        
    except Exception as e:
        logger.error(f"Error writing grant essay: {str(e)}")
        return _mock_write_grant_essay(student_profile, grant_requirements)


def _mock_write_grant_essay(student_profile: Dict, grant_requirements: str) -> str:
    """Mock essay generation for testing"""
    major = student_profile.get('major', 'Computer Science')
    hardship = student_profile.get('hardship_reason', 'Family financial difficulties')
    gpa = student_profile.get('gpa', '3.5')
    
    mock_essay = f"""As a {major} student with a GPA of {gpa}, I am writing to respectfully request consideration for emergency financial assistance. My academic journey has been marked by determination and resilience, but I now face significant financial barriers that threaten my ability to continue my education.

{hardship} has created an urgent situation that requires immediate attention. Despite these challenges, I have maintained my academic performance and remain committed to my educational goals. I understand the value of education as a pathway to a better future, not only for myself but for my family.

The requested grant would provide crucial support during this difficult period, allowing me to focus on my studies without the constant stress of financial insecurity. I am grateful for any consideration and remain committed to excelling academically and contributing meaningfully to my community upon graduation.

I respectfully request your assistance in helping me overcome these obstacles and continue my pursuit of higher education."""
    
    return mock_essay

