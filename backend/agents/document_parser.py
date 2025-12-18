"""
Docu-Extract Agent: Analyzes tuition bills using Azure Document Intelligence
"""
import os
import json
from typing import Dict, Optional
from io import BytesIO
import logging

# Mock mode flag - set to False when Azure credentials are available
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

logger = logging.getLogger(__name__)


async def analyze_tuition_bill(file_stream: BytesIO) -> Dict:
    """
    Analyzes a tuition bill PDF using Azure AI Document Intelligence.
    
    Uses the prebuilt-invoice model to extract:
    - TotalAmount
    - DueDate
    - VendorName (University Name)
    - InvoiceId
    
    Args:
        file_stream: Binary stream of the PDF file
        
    Returns:
        JSON object with extracted fields
        
    Raises:
        ValueError: If file is not a valid PDF or parsing fails
    """
    try:
        # Validate file is PDF-like by checking first bytes
        file_stream.seek(0)
        header = file_stream.read(4)
        file_stream.seek(0)
        
        if header[:4] != b'%PDF':
            raise ValueError("File does not appear to be a valid PDF")
        
        if MOCK_MODE:
            logger.info("Using mock mode for document analysis")
            return _mock_analyze_tuition_bill()
        
        # Real Azure Document Intelligence implementation
        from azure.core.credentials import AzureKeyCredential
        from azure.ai.formrecognizer import DocumentAnalysisClient
        
        endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
        key = os.getenv("AZURE_FORM_RECOGNIZER_KEY")
        
        if not endpoint or not key:
            raise ValueError("Azure Form Recognizer credentials not configured")
        
        client = DocumentAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key)
        )
        
        # Use prebuilt-invoice model
        poller = client.begin_analyze_document(
            model_id="prebuilt-invoice",
            document=file_stream
        )
        result = poller.result()
        
        # Extract fields from the invoice
        extracted_data = {
            "TotalAmount": None,
            "DueDate": None,
            "VendorName": None,
            "InvoiceId": None
        }
        
        # Parse invoice fields
        if result.documents and len(result.documents) > 0:
            invoice = result.documents[0]
            fields = invoice.fields if hasattr(invoice, 'fields') else {}
            
            # Extract total amount
            if "InvoiceTotal" in fields:
                total = fields["InvoiceTotal"]
                if hasattr(total, 'value') and total.value:
                    extracted_data["TotalAmount"] = float(total.value)
            
            # Extract due date
            if "DueDate" in fields:
                due_date = fields["DueDate"]
                if hasattr(due_date, 'value') and due_date.value:
                    if hasattr(due_date.value, 'strftime'):
                        extracted_data["DueDate"] = due_date.value.strftime("%Y-%m-%d")
                    else:
                        extracted_data["DueDate"] = str(due_date.value)
            
            # Extract vendor name (University)
            if "VendorName" in fields:
                vendor = fields["VendorName"]
                if hasattr(vendor, 'value') and vendor.value:
                    extracted_data["VendorName"] = str(vendor.value)
            
            # Extract invoice ID
            if "InvoiceId" in fields:
                invoice_id = fields["InvoiceId"]
                if hasattr(invoice_id, 'value') and invoice_id.value:
                    extracted_data["InvoiceId"] = str(invoice_id.value)
        
        # Fallback: If structured extraction failed, try extracting from raw text
        if not all([extracted_data["TotalAmount"], extracted_data["DueDate"], extracted_data["VendorName"]]):
            logger.info("Structured extraction incomplete, attempting fallback text extraction")
            extracted_data = _extract_from_text(result, extracted_data)
        
        logger.info(f"Extracted bill data: {extracted_data}")
        return extracted_data
        
    except Exception as e:
        logger.error(f"Error analyzing tuition bill: {str(e)}")
        raise ValueError(f"Failed to analyze document: {str(e)}")


def _extract_from_text(result, extracted_data: Dict) -> Dict:
    """
    Fallback extraction from raw text if structured fields aren't found.
    Uses regex patterns to find amounts, dates, and other fields.
    """
    import re
    from datetime import datetime
    
    try:
        # Get all text content from Azure Document Intelligence result
        full_text = ""
        if hasattr(result, "content"):
            full_text = result.content
        elif hasattr(result, "pages"):
            for page in result.pages:
                if hasattr(page, "lines"):
                    for line in page.lines:
                        if hasattr(line, "content"):
                            full_text += line.content + " "
                elif hasattr(page, "content"):
                    full_text += page.content + " "
        
        if not full_text:
            logger.warning("No text content found in document")
            return extracted_data
        
        logger.info(f"Extracting from text (first 500 chars): {full_text[:500]}...")
        
        # Extract amount (look for patterns like $4,000.00 or 4000.00)
        if not extracted_data["TotalAmount"]:
            amount_patterns = [
                r'Invoice Total[:\s]*\$?([\d,]+\.?\d*)',
                r'TOTAL AMOUNT DUE[:\s]*\$?([\d,]+\.?\d*)',
                r'Total[:\s]*\$?([\d,]+\.?\d*)',
                r'\$([\d,]+\.?\d{2})',  # Match $4,000.00 format
            ]
            for pattern in amount_patterns:
                matches = re.findall(pattern, full_text, re.IGNORECASE)
                if matches:
                    # Take the largest amount found (likely the total)
                    amounts = [float(m.replace(',', '')) for m in matches]
                    if amounts:
                        extracted_data["TotalAmount"] = max(amounts)
                        logger.info(f"Extracted amount: {extracted_data['TotalAmount']}")
                        break
        
        # Extract due date (look for "Due Date: December 20, 2024" or "2024-12-20")
        if not extracted_data["DueDate"]:
            date_patterns = [
                r'Due Date[:\s]*(\d{4}-\d{2}-\d{2})',
                r'DUE DATE[:\s]*(\d{4}-\d{2}-\d{2})',
                r'Due Date[:\s]*([A-Za-z]+ \d{1,2}, \d{4})',
                r'DUE DATE[:\s]*([A-Za-z]+ \d{1,2}, \d{4})',
            ]
            for pattern in date_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    date_str = match.group(1)
                    try:
                        # Try parsing different date formats
                        if '-' in date_str and len(date_str) == 10:
                            # Already in YYYY-MM-DD format
                            extracted_data["DueDate"] = date_str
                        else:
                            # Parse "December 20, 2024" format
                            date_obj = datetime.strptime(date_str, "%B %d, %Y")
                            extracted_data["DueDate"] = date_obj.strftime("%Y-%m-%d")
                        logger.info(f"Extracted due date: {extracted_data['DueDate']}")
                        break
                    except (ValueError, AttributeError) as e:
                        logger.warning(f"Could not parse date '{date_str}': {e}")
                        continue
        
        # Extract vendor name (look for "STATE UNIVERSITY" or university name)
        if not extracted_data["VendorName"]:
            vendor_patterns = [
                r'(STATE UNIVERSITY)',
                r'(State University)',
                r'([A-Z][a-z]+ University)',
            ]
            for pattern in vendor_patterns:
                match = re.search(pattern, full_text)
                if match:
                    extracted_data["VendorName"] = match.group(1) if match.lastindex else match.group(0)
                    logger.info(f"Extracted vendor: {extracted_data['VendorName']}")
                    break
        
        # Extract invoice ID (look for "INV-2024-001234" pattern)
        if not extracted_data["InvoiceId"]:
            invoice_patterns = [
                r'Invoice ID[:\s]*(INV-\d{4}-\d+)',
                r'Invoice Number[:\s]*(INV-\d{4}-\d+)',
                r'Invoice[:\s]*#?[:\s]*(INV-\d{4}-\d+)',
                r'(INV-\d{4}-\d+)',
            ]
            for pattern in invoice_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    extracted_data["InvoiceId"] = match.group(1).upper()
                    logger.info(f"Extracted invoice ID: {extracted_data['InvoiceId']}")
                    break
        
    except Exception as e:
        logger.warning(f"Error in fallback text extraction: {e}")
    
    return extracted_data


def _mock_analyze_tuition_bill() -> Dict:
    """
    Mock response for testing without Azure credentials.
    Returns a realistic sample tuition bill data.
    """
    import datetime
    
    # Mock data for demo
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    
    return {
        "TotalAmount": 1200.00,
        "DueDate": tomorrow.strftime("%Y-%m-%d"),
        "VendorName": "State University",
        "InvoiceId": "INV-2024-001234"
    }

