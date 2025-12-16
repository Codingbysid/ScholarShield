# ScholarShield

**Automating the bureaucracy of survival for FGLI (First-Generation, Low-Income) students.**

ScholarShield is an intelligent agentic system that helps students navigate financial challenges by:
- Analyzing tuition bills automatically
- Finding relevant university policies and bylaws
- Generating grant application essays
- Providing actionable recommendations

## Architecture

### Backend (FastAPI)
- **ScholarShield Orchestrator**: The "Brain" that coordinates all agents and processes complete student cases
- **Docu-Extract Agent**: Analyzes PDF tuition bills using Azure Document Intelligence
- **Policy Lawyer Agent**: Searches university handbooks using RAG (Azure AI Search + OpenAI)
- **Grant Hunter Agent**: Writes financial aid essays using Azure OpenAI
- **Negotiator Agent**: Drafts professional emails to university bursars

### Frontend (Next.js)
- Accessible dashboard with calm color palette
- Drag-and-drop bill upload
- Risk assessment meter
- Actionable recommendations

## Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Azure account with:
  - Azure OpenAI Service (GPT-4o deployment)
  - Azure AI Search
  - Azure AI Document Intelligence

### Installation

1. **Clone and navigate to the project**
```bash
cd Microsfot
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Environment Variables**
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

Fill in your Azure credentials:
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT_NAME` (default: "gpt-4o")
- `AZURE_SEARCH_ENDPOINT`
- `AZURE_SEARCH_KEY`
- `AZURE_SEARCH_INDEX_NAME` (default: "university-policies")
- `AZURE_FORM_RECOGNIZER_ENDPOINT`
- `AZURE_FORM_RECOGNIZER_KEY`

**Note**: The system runs in mock mode by default (set `MOCK_MODE=false` in `.env` to use real Azure services).

### Running the Application

**Option 1: Docker Compose (Recommended)**
```bash
docker-compose up
```

**Option 2: Manual**
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Demo Mode

To load demo data for presentations:
- Click the "Demo" button in the dashboard header (top-right)
- Or press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)

This loads:
- A sample $1,200 tuition bill due tomorrow
- Policy advice citing Bylaw 4.2 (Hardship Extension)
- A pre-written grant essay

## API Endpoints

- `POST /api/assess-financial-health` - Main orchestrator endpoint that processes a complete student case (analyzes bill, calculates risk, searches policies, generates advice, and drafts emails)
- `GET /health` - Health check

## Azure Setup Instructions

### Quick Setup with Azure CLI

1. **Login to Azure**
```bash
az login
```

2. **Create Resource Group**
```bash
az group create --name ScholarShield-RG --location eastus
```

3. **Create Azure OpenAI Service**
```bash
az cognitiveservices account create \
  --name ScholarShield-OpenAI \
  --resource-group ScholarShield-RG \
  --location eastus \
  --kind OpenAI \
  --sku s0
```

**Note**: You may need to request access to Azure OpenAI first. Visit the Azure Portal to request access if needed.

After creating the resource, deploy models:
- `gpt-4o` for reasoning and text generation
- `text-embedding-3-small` for search (if using embeddings)

4. **Create Azure AI Document Intelligence**
```bash
az cognitiveservices account create \
  --name ScholarShield-DocIntel \
  --resource-group ScholarShield-RG \
  --location eastus \
  --kind FormRecognizer \
  --sku s0
```

This service uses the prebuilt-invoice model for bill analysis.

5. **Create Azure AI Search**
```bash
az search service create \
  --name scholarshield-search \
  --resource-group ScholarShield-RG \
  --location eastus \
  --sku basic
```

After creation:
- Enable Semantic Ranker (critical for RAG quality)
- Create an index named `university-policies`
- Index your university handbook documents

### Manual Setup via Azure Portal

If you prefer using the Azure Portal:

1. **Azure OpenAI Service**
   - Navigate to Azure Portal → Create Resource → Azure OpenAI
   - Deploy `gpt-4o` model
   - Copy the endpoint and key to your `.env` file

2. **Azure AI Document Intelligence**
   - Navigate to Azure Portal → Create Resource → Form Recognizer
   - Copy the endpoint and key to your `.env` file

3. **Azure AI Search**
   - Navigate to Azure Portal → Create Resource → Azure AI Search
   - Enable Semantic Ranker
   - Create index `university-policies`
   - Copy the endpoint and admin key to your `.env` file

## Project Structure

```
ScholarShield/
├── backend/
│   ├── agents/
│   │   ├── orchestrator.py       # Main orchestrator (coordinates all agents)
│   │   ├── document_parser.py    # Docu-Extract agent
│   │   ├── policy_rag.py         # Policy Lawyer agent
│   │   ├── grant_writer.py       # Grant Hunter agent
│   │   └── negotiator.py         # Email negotiation agent
│   ├── main.py                   # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── dashboard/            # Main dashboard page
│   │   └── page.tsx              # Home page
│   ├── components/
│   │   ├── BillUpload.tsx        # File upload component
│   │   ├── RiskMeter.tsx         # Risk assessment gauge
│   │   ├── ActionCards.tsx       # Action recommendations
│   │   └── ProcessingStatus.tsx  # Progress stepper component
│   └── public/
│       └── demo_mode.json        # Demo data
├── docker-compose.yml
├── env.example                   # Environment variable template
└── README.md
```

## Development

### Testing
The system includes mock implementations for all agents, allowing testing without Azure credentials. Set `MOCK_MODE=true` in your `.env` file.

### Code Style
- Python: Follow PEP 8
- TypeScript/React: Use ESLint and Prettier
- Always handle errors gracefully
- Include type hints/TypeScript types

## License

This project is developed for the Microsoft Imagine Cup.

