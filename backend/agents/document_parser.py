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
        if result.documents:
            invoice = result.documents[0]
            
            # Extract total amount
            if hasattr(invoice.fields, "InvoiceTotal") and invoice.fields.get("InvoiceTotal"):
                total = invoice.fields.get("InvoiceTotal")
                if total.value:
                    extracted_data["TotalAmount"] = float(total.value)
            
            # Extract due date
            if hasattr(invoice.fields, "DueDate") and invoice.fields.get("DueDate"):
                due_date = invoice.fields.get("DueDate")
                if due_date.value:
                    extracted_data["DueDate"] = due_date.value.strftime("%Y-%m-%d")
            
            # Extract vendor name (University)
            if hasattr(invoice.fields, "VendorName") and invoice.fields.get("VendorName"):
                vendor = invoice.fields.get("VendorName")
                if vendor.value:
                    extracted_data["VendorName"] = vendor.value
            
            # Extract invoice ID
            if hasattr(invoice.fields, "InvoiceId") and invoice.fields.get("InvoiceId"):
                invoice_id = invoice.fields.get("InvoiceId")
                if invoice_id.value:
                    extracted_data["InvoiceId"] = invoice_id.value
        
        return extracted_data
        
    except Exception as e:
        logger.error(f"Error analyzing tuition bill: {str(e)}")
        raise ValueError(f"Failed to analyze document: {str(e)}")


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

