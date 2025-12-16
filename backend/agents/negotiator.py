"""
Negotiator Agent: Drafts professional emails to university bursars
"""
import os
import logging
from typing import Dict
from datetime import datetime, timedelta
from openai import AzureOpenAI

# Mock mode flag
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a professional financial advocate representing FGLI (First-Generation, Low-Income) students.
Write a polite but firm email to the University Bursar requesting a payment extension.

Guidelines:
- Use formal, respectful tone
- Reference specific invoice details (Invoice ID, Amount)
- Quote specific bylaws and policy sections
- Propose a concrete payment date (2 weeks after current due date)
- Emphasize the student's commitment to payment
- Keep the email concise (2-3 paragraphs)
- End with a professional closing"""


async def draft_negotiation_email(bill_data: Dict, policy_advice: Dict) -> str:
    """
    Drafts a professional negotiation email to the university bursar.
    
    Args:
        bill_data: Dictionary containing invoice information
        policy_advice: Dictionary containing policy findings and advice
        
    Returns:
        Complete email text ready to send
    """
    if MOCK_MODE:
        logger.info("Using mock mode for negotiation email")
        return _mock_draft_negotiation_email(bill_data, policy_advice)
    
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
        
        # Extract policy citations
        citations = []
        if policy_advice and policy_advice.get("citations"):
            citations = policy_advice["citations"]
        
        # Calculate proposed payment date (2 weeks after due date)
        due_date_str = bill_data.get("DueDate", "")
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            proposed_date = (due_date + timedelta(days=14)).strftime("%B %d, %Y")
        except (ValueError, TypeError):
            proposed_date = "two weeks from the original due date"
        
        # Build user prompt
        invoice_id = bill_data.get("InvoiceId", "N/A")
        amount = bill_data.get("TotalAmount", 0)
        vendor = bill_data.get("VendorName", "University")
        
        user_prompt = f"""Write an email to the Bursar's Office requesting a payment extension.

Invoice Details:
- Invoice ID: {invoice_id}
- Amount: ${amount:,.2f}
- Vendor: {vendor}
- Original Due Date: {due_date_str}
- Proposed New Due Date: {proposed_date}

University Policies Found:
{citations[0] if citations else "Please refer to university hardship extension policies"}

Policy Summary:
{policy_advice.get("summary", "") if policy_advice else ""}

Write a professional email that:
1. Clearly states the request for an extension
2. References the invoice ID and amount
3. Cites the specific university policies/bylaws
4. Proposes the new payment date ({proposed_date})
5. Assures the bursar of the student's intent to pay"""
        
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=600
        )
        
        email = response.choices[0].message.content.strip()
        return email
        
    except Exception as e:
        logger.error(f"Error drafting negotiation email: {str(e)}")
        return _mock_draft_negotiation_email(bill_data, policy_advice)


def _mock_draft_negotiation_email(bill_data: Dict, policy_advice: Dict) -> str:
    """Mock email generation for testing"""
    invoice_id = bill_data.get("InvoiceId", "INV-2024-001234")
    amount = bill_data.get("TotalAmount", 1200.00)
    due_date_str = bill_data.get("DueDate", "")
    
    try:
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        proposed_date = (due_date + timedelta(days=14)).strftime("%B %d, %Y")
    except (ValueError, TypeError):
        proposed_date = "two weeks from the original due date"
    
    citations = policy_advice.get("citations", []) if policy_advice else []
    citation_text = citations[0] if citations else "University Handbook Section 4.2"
    
    mock_email = f"""Subject: Request for Tuition Payment Extension - Invoice {invoice_id}

Dear Bursar's Office,

I am writing to respectfully request an extension for tuition payment for Invoice {invoice_id} in the amount of ${amount:,.2f}, which is currently due on {due_date_str}.

Per {citation_text} regarding hardship extensions, I am requesting a payment extension due to unforeseen financial circumstances. I am committed to fulfilling this financial obligation and propose a new payment date of {proposed_date}.

I understand the importance of meeting financial commitments to the university and assure you of my intent to submit payment by the proposed date. I am happy to provide any additional documentation if required.

Thank you for your understanding and consideration of this request.

Respectfully,
[Student Name]
[Student ID]"""
    
    return mock_email

