"""
Policy Lawyer Agent: Searches university handbooks using RAG (Azure AI Search + OpenAI)
"""
import os
import logging
from typing import List, Dict, Optional
from openai import AzureOpenAI

# Mock mode flag
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"

logger = logging.getLogger(__name__)


async def search_handbook(query: str) -> List[Dict]:
    """
    Searches the university handbook using Azure AI Search.
    
    Args:
        query: The search query (e.g., "hardship extension", "emergency grant")
        
    Returns:
        List of top 3 document chunks with their content and metadata
    """
    if MOCK_MODE:
        logger.info("Using mock mode for policy search")
        return _mock_search_handbook(query)
    
    try:
        from azure.search.documents import SearchClient
        from azure.core.credentials import AzureKeyCredential
        
        search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        search_key = os.getenv("AZURE_SEARCH_KEY")
        index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "university-policies")
        
        if not search_endpoint or not search_key:
            raise ValueError("Azure Search credentials not configured")
        
        client = SearchClient(
            endpoint=search_endpoint,
            index_name=index_name,
            credential=AzureKeyCredential(search_key)
        )
        
        # Perform semantic search
        results = client.search(
            search_text=query,
            top=3,
            include_total_count=True,
            query_type="semantic",
            semantic_configuration_name="default"  # Assuming semantic config exists
        )
        
        chunks = []
        for result in results:
            chunk = {
                "content": result.get("content", ""),
                "source": result.get("source", ""),
                "score": result.get("@search.score", 0),
                "metadata": {
                    "section": result.get("section", ""),
                    "page": result.get("page", "")
                }
            }
            chunks.append(chunk)
        
        return chunks
        
    except Exception as e:
        logger.error(f"Error searching handbook: {str(e)}")
        # Fallback to mock in case of error
        return _mock_search_handbook(query)


async def generate_advice(context: List[Dict], query: str) -> Dict:
    """
    Generates advice using Azure OpenAI based on the provided context.
    
    Args:
        context: List of document chunks from the handbook search
        query: The original student query
        
    Returns:
        Dictionary with advice text and citations
    """
    if MOCK_MODE:
        logger.info("Using mock mode for advice generation")
        return _mock_generate_advice(context, query)
    
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
        
        # Build context string from search results
        context_text = "\n\n".join([
            f"[Source: {chunk.get('source', 'Unknown')}, Section: {chunk.get('metadata', {}).get('section', 'N/A')}]\n{chunk.get('content', '')}"
            for chunk in context
        ])
        
        system_prompt = """You are a helpful financial aid advisor for FGLI (First-Generation, Low-Income) students.
You provide advice based STRICTLY on the provided university handbook context.
Always cite the specific section or bylaw you reference.
Be empathetic, clear, and actionable in your responses."""
        
        user_prompt = f"""Based on the following university handbook excerpts, answer the student's question:

{context_text}

Student Question: {query}

Provide your answer with specific citations from the handbook."""
        
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        advice_text = response.choices[0].message.content
        
        # Extract citations
        citations = [chunk.get('source', '') for chunk in context]
        
        return {
            "advice": advice_text,
            "citations": citations,
            "confidence": "high" if len(context) > 0 else "low"
        }
        
    except Exception as e:
        logger.error(f"Error generating advice: {str(e)}")
        return _mock_generate_advice(context, query)


def _mock_search_handbook(query: str) -> List[Dict]:
    """Mock search results for testing"""
    return [
        {
            "content": "Bylaw 4.2: Hardship Extension - Students facing financial hardship may request an extension of up to 30 days for tuition payment deadlines. Requests must be submitted in writing to the Bursar's Office with documentation of hardship.",
            "source": "University Handbook 2024, Section 4.2",
            "score": 0.95,
            "metadata": {
                "section": "4.2",
                "page": "42"
            }
        },
        {
            "content": "Emergency Grant Program: Available to FGLI students who demonstrate urgent financial need. Grants range from $200-$1000 and are awarded within 48 hours of application submission.",
            "source": "Financial Aid Handbook, Emergency Grants Section",
            "score": 0.88,
            "metadata": {
                "section": "Emergency Grants",
                "page": "15"
            }
        },
        {
            "content": "Late Payment Fees: Standard late payment fee is $50. However, students with approved hardship extensions are exempt from late fees if payment is made within the extension period.",
            "source": "University Handbook 2024, Section 4.3",
            "score": 0.82,
            "metadata": {
                "section": "4.3",
                "page": "43"
            }
        }
    ]


def _mock_generate_advice(context: List[Dict], query: str) -> Dict:
    """Mock advice generation for testing"""
    if context:
        advice = f"""Based on the university handbook, I found relevant information for your question about "{query}".

{context[0].get('content', '')}

**Recommended Action:**
You should submit a written request to the Bursar's Office citing Bylaw 4.2 (Hardship Extension). This allows for up to 30 days extension with proper documentation.

**Citations:**
- {context[0].get('source', 'Unknown source')}
"""
        citations = [chunk.get('source', '') for chunk in context]
    else:
        advice = "I couldn't find specific information in the handbook, but I recommend contacting the Financial Aid Office directly."
        citations = []
    
    return {
        "advice": advice,
        "citations": citations,
        "confidence": "high" if context else "low"
    }

