"""
Handbook Uploader: Processes and uploads university handbooks to Azure AI Search
"""
import os
import re
import logging
import uuid
from typing import List, Dict
from io import BytesIO
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential as DocIntelCredential

logger = logging.getLogger(__name__)


def parse_handbook_text(content: str, university_name: str = "Custom University") -> List[Dict]:
    """
    Parse handbook text into searchable chunks.
    
    Args:
        content: Raw text content of the handbook
        university_name: Name of the university for source attribution
        
    Returns:
        List of document chunks with id, content, source, section, and page
    """
    chunks = []
    lines = content.split('\n')
    
    current_section = None
    current_subsection = None
    current_chunk = []
    chunk_id = 0
    
    for i, line in enumerate(lines, start=1):
        line = line.strip()
        
        # Detect section headers (e.g., "SECTION 4:", "BYLAW 8:")
        section_match = re.match(r'^(SECTION|BYLAW|CHAPTER)\s+(\d+):\s*(.+)', line, re.IGNORECASE)
        if section_match:
            # Save previous chunk if exists
            if current_chunk:
                chunks.append({
                    'id': str(chunk_id),
                    'content': '\n'.join(current_chunk).strip(),
                    'source': f"{university_name} Handbook, {current_section or 'Introduction'}",
                    'section': current_subsection or current_section or 'Introduction',
                    'page': str((i // 50) + 1)
                })
                chunk_id += 1
                current_chunk = []
            
            current_section = f"{section_match.group(1)} {section_match.group(2)}: {section_match.group(3)}"
            current_chunk.append(line)
            continue
        
        # Detect subsections (e.g., "4.1", "4.2", "5.1")
        subsection_match = re.match(r'^(\d+\.\d+)\s+(.+)', line)
        if subsection_match:
            # Save previous chunk if exists
            if current_chunk:
                chunks.append({
                    'id': str(chunk_id),
                    'content': '\n'.join(current_chunk).strip(),
                    'source': f"{university_name} Handbook, {current_section or 'Introduction'}",
                    'section': current_subsection or current_section or 'Introduction',
                    'page': str((i // 50) + 1)
                })
                chunk_id += 1
                current_chunk = []
            
            current_subsection = f"{subsection_match.group(1)} {subsection_match.group(2)}"
            current_chunk.append(line)
            continue
        
        # Regular content line
        if line:
            current_chunk.append(line)
        elif current_chunk:  # Empty line, but we have content
            # If chunk is getting long (>500 chars), split it
            if len('\n'.join(current_chunk)) > 500:
                chunks.append({
                    'id': str(chunk_id),
                    'content': '\n'.join(current_chunk).strip(),
                    'source': f"{university_name} Handbook, {current_section or 'Introduction'}",
                    'section': current_subsection or current_section or 'Introduction',
                    'page': str((i // 50) + 1)
                })
                chunk_id += 1
                current_chunk = []
    
    # Add final chunk
    if current_chunk:
        chunks.append({
            'id': str(chunk_id),
            'content': '\n'.join(current_chunk).strip(),
            'source': f"{university_name} Handbook, {current_section or 'Introduction'}",
            'section': current_subsection or current_section or 'Introduction',
            'page': str((len(lines) // 50) + 1)
        })
    
    # If no structured sections found, create simple chunks
    if not chunks:
        content_text = content.strip()
        chunk_size = 1000
        for i in range(0, len(content_text), chunk_size):
            chunk_content = content_text[i:i + chunk_size]
            chunks.append({
                'id': str(i // chunk_size),
                'content': chunk_content,
                'source': f"{university_name} Handbook",
                'section': 'General',
                'page': str((i // chunk_size) + 1)
            })
    
    return chunks


async def extract_text_from_pdf(file_stream: BytesIO) -> str:
    """
    Extract text from PDF using Azure Document Intelligence.
    
    Args:
        file_stream: Binary stream of the PDF file
        
    Returns:
        Extracted text content
    """
    try:
        endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
        key = os.getenv("AZURE_FORM_RECOGNIZER_KEY")
        
        if not endpoint or not key:
            raise ValueError("Azure Document Intelligence credentials not configured")
        
        client = DocumentAnalysisClient(
            endpoint=endpoint,
            credential=DocIntelCredential(key)
        )
        
        file_stream.seek(0)
        poller = client.begin_analyze_document(
            model_id="prebuilt-read",
            document=file_stream.read()
        )
        
        result = poller.result()
        
        # Extract text from all pages
        text_parts = []
        if hasattr(result, 'pages') and result.pages:
            for page in result.pages:
                if hasattr(page, 'lines'):
                    for line in page.lines:
                        if hasattr(line, 'content'):
                            text_parts.append(line.content)
        elif hasattr(result, 'content'):
            # Some SDK versions return content directly
            text_parts.append(result.content)
        
        return '\n'.join(text_parts)
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise


async def upload_handbook_to_search(
    file_stream: BytesIO,
    file_type: str,
    university_name: str = "Custom University"
) -> str:
    """
    Process and upload a handbook to Azure AI Search.
    Creates a new index for the custom handbook.
    
    Args:
        file_stream: Binary stream of the handbook file (PDF or text)
        file_type: MIME type of the file (application/pdf or text/plain)
        university_name: Name of the university
        
    Returns:
        Index name where the handbook was uploaded
    """
    try:
        search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        search_key = os.getenv("AZURE_SEARCH_KEY")
        base_index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "university-policies")
        
        if not search_endpoint or not search_key:
            raise ValueError("Azure Search credentials not configured")
        
        # Generate unique index name for custom handbook
        index_suffix = str(uuid.uuid4())[:8]
        index_name = f"{base_index_name}-{index_suffix}"
        
        # Extract text content
        if file_type == "application/pdf":
            text_content = await extract_text_from_pdf(file_stream)
        else:
            file_stream.seek(0)
            text_content = file_stream.read().decode('utf-8')
        
        # Parse into chunks
        chunks = parse_handbook_text(text_content, university_name)
        
        if not chunks:
            raise ValueError("No content extracted from handbook")
        
        # Create search client
        client = SearchClient(
            endpoint=search_endpoint,
            index_name=index_name,
            credential=AzureKeyCredential(search_key)
        )
        
        # Check if index exists, create if not
        try:
            # Try to get index info
            from azure.search.documents.indexes import SearchIndexClient
            index_client = SearchIndexClient(
                endpoint=search_endpoint,
                credential=AzureKeyCredential(search_key)
            )
            
            # Check if index exists
            try:
                index_client.get_index(index_name)
                logger.info(f"Index {index_name} already exists, will add documents")
            except Exception:
                # Index doesn't exist, create it
                from azure.search.documents.indexes.models import (
                    SearchIndex,
                    SimpleField,
                    SearchFieldDataType
                )
                
                fields = [
                    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                    SimpleField(name="content", type=SearchFieldDataType.String, searchable=True),
                    SimpleField(name="source", type=SearchFieldDataType.String, filterable=True),
                    SimpleField(name="section", type=SearchFieldDataType.String, filterable=True),
                    SimpleField(name="page", type=SearchFieldDataType.String)
                ]
                
                index = SearchIndex(name=index_name, fields=fields)
                index_client.create_index(index)
                logger.info(f"Created new index: {index_name}")
        
        except Exception as e:
            logger.warning(f"Could not create index automatically: {e}")
            # Continue anyway - might already exist
        
        # Upload documents in batches
        batch_size = 1000
        total_uploaded = 0
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            try:
                result = client.upload_documents(documents=batch)
                
                failed = [r for r in result if not r.succeeded]
                if failed:
                    logger.warning(f"Warning: {len(failed)} documents failed to upload")
                else:
                    total_uploaded += len(batch)
                    logger.info(f"Uploaded batch {i//batch_size + 1} ({len(batch)} documents)")
            except Exception as e:
                logger.error(f"Error uploading batch: {e}")
                raise
        
        logger.info(f"Successfully uploaded {total_uploaded} chunks to index: {index_name}")
        return index_name
        
    except Exception as e:
        logger.error(f"Error uploading handbook: {e}")
        raise

