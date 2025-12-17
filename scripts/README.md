# Scripts

This directory contains utility scripts for managing the ScholarShield application.

## upload_handbook.py

Uploads university handbook documents to Azure AI Search index.

**Usage:**
```bash
python3 scripts/upload_handbook.py
```

**Requirements:**
- Azure AI Search service configured in `.env`
- `university-handbook-sample.txt` in `docs/` directory
- Python packages: `azure-search-documents`, `azure-core`, `python-dotenv`

**What it does:**
1. Parses the handbook text file into searchable chunks
2. Extracts metadata (sections, subsections, page numbers)
3. Uploads chunks to the `university-policies` Azure AI Search index
4. Makes policies searchable by the Policy Lawyer Agent

