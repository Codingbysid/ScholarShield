#!/usr/bin/env python3
"""
Script to upload university handbook to Azure AI Search index.
"""
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

# Load environment variables from root .env file (scripts/ is one level down)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Get Azure Search credentials
search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
search_key = os.getenv("AZURE_SEARCH_KEY")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "university-policies")

if not search_endpoint or not search_key:
    print("❌ Error: Azure Search credentials not found in .env file")
    print("Please make sure AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY are set")
    exit(1)

def parse_handbook(file_path: str) -> list:
    """
    Parse the handbook file into chunks with metadata.
    Returns a list of dictionaries with content, source, section, and page.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    chunks = []
    lines = content.split('\n')
    
    current_section = None
    current_subsection = None
    current_chunk = []
    chunk_id = 0
    
    for i, line in enumerate(lines, start=1):
        line = line.strip()
        
        # Detect section headers (e.g., "SECTION 4:", "BYLAW 8:")
        section_match = re.match(r'^(SECTION|BYLAW)\s+(\d+):\s*(.+)', line, re.IGNORECASE)
        if section_match:
            # Save previous chunk if exists
            if current_chunk:
                chunks.append({
                    'id': str(chunk_id),
                    'content': '\n'.join(current_chunk).strip(),
                    'source': f"University Handbook 2024-2025, {current_section or 'Introduction'}",
                    'section': current_subsection or current_section or 'Introduction',
                    'page': str((i // 50) + 1)  # Approximate page number
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
                    'source': f"University Handbook 2024-2025, {current_section or 'Introduction'}",
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
                    'source': f"University Handbook 2024-2025, {current_section or 'Introduction'}",
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
            'source': f"University Handbook 2024-2025, {current_section or 'Introduction'}",
            'section': current_subsection or current_section or 'Introduction',
            'page': str((len(lines) // 50) + 1)
        })
    
    return chunks

def upload_to_azure_search(chunks: list):
    """
    Upload chunks to Azure AI Search index.
    """
    print(f"🔗 Connecting to Azure AI Search...")
    print(f"   Endpoint: {search_endpoint}")
    print(f"   Index: {index_name}\n")
    
    client = SearchClient(
        endpoint=search_endpoint,
        index_name=index_name,
        credential=AzureKeyCredential(search_key)
    )
    
    print(f"📤 Uploading {len(chunks)} document chunks...\n")
    
    # Upload in batches of 1000 (Azure limit)
    batch_size = 1000
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        try:
            result = client.upload_documents(documents=batch)
            
            # Check for errors
            failed = [r for r in result if not r.succeeded]
            if failed:
                print(f"⚠️  Warning: {len(failed)} documents failed to upload")
                for f in failed:
                    print(f"   Error: {f.error_message}")
            else:
                print(f"✅ Successfully uploaded batch {i//batch_size + 1} ({len(batch)} documents)")
        except Exception as e:
            print(f"❌ Error uploading batch: {e}")
            raise
    
    print(f"\n✅ Successfully uploaded {len(chunks)} document chunks to Azure AI Search!")
    print(f"🎉 Your university handbook is now searchable!")

def main():
    handbook_path = Path(__file__).parent.parent / "docs" / "university-handbook-sample.txt"
    
    if not handbook_path.exists():
        print(f"❌ Error: Handbook file not found at {handbook_path}")
        print("Please make sure university-handbook-sample.txt exists in the project root")
        exit(1)
    
    print("📖 Parsing university handbook...")
    chunks = parse_handbook(str(handbook_path))
    print(f"✅ Parsed into {len(chunks)} searchable chunks\n")
    
    # Show sample chunk
    if chunks:
        print("📄 Sample chunk:")
        print(f"   Section: {chunks[0]['section']}")
        print(f"   Content preview: {chunks[0]['content'][:100]}...\n")
    
    upload_to_azure_search(chunks)

if __name__ == "__main__":
    main()

