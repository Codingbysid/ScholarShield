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
- **Multi-Step Workflow**: Handbook Selection → Profile Form → Bill Upload
- **Handbook Selection**: Choose from preset universities or upload custom handbooks
- **Student Profile**: Customizable profile (name, major, year, GPA, hardship reason) for personalized grant essays
- Accessible dashboard with calm color palette
- Drag-and-drop bill upload
- Risk assessment meter
- Actionable recommendations
- **Accessibility Mode**: Dyslexia-friendly font toggle
- **Azure Status Bar**: Real-time service status indicator
- **PDF Export**: Download grant essays and negotiation emails as PDFs
- **Enhanced Scanning**: Real-time bill data extraction visualization
- **Security**: Input validation, sanitization, and secure API routing

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
- `AZURE_OPENAI_KEY` (Required)
- `AZURE_OPENAI_ENDPOINT` (Required)
- `AZURE_OPENAI_DEPLOYMENT_NAME` (default: "gpt-4o")
- `AZURE_SEARCH_ENDPOINT` (Required)
- `AZURE_SEARCH_KEY` (Required)
- `AZURE_SEARCH_INDEX_NAME` (default: "university-policies")
- `AZURE_FORM_RECOGNIZER_ENDPOINT` (Required)
- `AZURE_FORM_RECOGNIZER_KEY` (Required)
- `AZURE_TRANSLATOR_KEY` (Optional - for parent communication)
- `AZURE_TRANSLATOR_REGION` (Optional - default: "eastus")
- `AZURE_SPEECH_KEY` (Optional - for parent communication)
- `AZURE_SPEECH_REGION` (Optional - default: "eastus")

**Note**: The system runs in mock mode by default (set `MOCK_MODE=false` in `.env` to use real Azure services). Optional services (Translator, Speech) will use mock data if not configured.

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

## Features

### Accessibility
- **Dyslexia-Friendly Mode**: Toggle accessible fonts with the Eye icon in the navbar
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: ARIA labels and semantic HTML throughout
- **High Contrast**: WCAG AA compliant color schemes

### User Experience
- **Multi-Step Workflow**: 
  1. **Select University Handbook**: Choose from preset universities or upload your own
  2. **Complete Profile**: Enter your details (name, major, year, GPA, hardship reason)
  3. **Upload Bill**: Upload your tuition bill for analysis
  4. **Get Personalized Advice**: Receive policy recommendations and grant essays tailored to your situation
- **Real-Time Processing**: Visual scanning animation showing data extraction in real-time
- **Azure Status Indicator**: Bottom-right status bar showing all Azure services (hover to expand)
- **PDF Export**: Download grant essays and negotiation emails as professional PDFs
- **Personalized Grant Essays**: AI uses your actual hardship reason and profile data
- **Demo Mode**: Load sample data for presentations (requires handbook selection first)

### User Workflow

1. **Login**: Sign in with your university email or Microsoft account
2. **Select Handbook**: Choose your university from presets or upload a custom handbook
3. **Complete Profile**: Fill in your student profile (name, major, year, GPA, hardship reason)
4. **Upload Bill**: Upload your tuition bill PDF
5. **Review Results**: Get personalized policy advice, risk assessment, and action recommendations
6. **Generate Grant Essay**: Create a personalized grant application essay using your profile data

### Demo Mode

To load demo data for presentations:
- **First**: Select a university handbook
- **Then**: Click the "Demo" button in the dashboard header (top-right)
- **Or**: Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)

This loads:
- A sample $1,200 tuition bill due tomorrow
- Policy advice citing Bylaw 4.2 (Hardship Extension)
- A pre-written grant essay

## API Endpoints

### Backend (FastAPI)
- `POST /api/assess-financial-health?university_index=<index>` - Main orchestrator endpoint that processes a complete student case (analyzes bill, calculates risk, searches policies, generates advice, and drafts emails). Accepts optional `university_index` parameter for custom handbook searches.
- `POST /api/write-grant` - Generate grant application essay using student profile data
- `POST /api/explain-to-parent` - Translate and convert financial situation to audio for parents
- `POST /api/upload-handbook` - Upload and process custom university handbook (creates new Azure AI Search index)
- `GET /health` - Health check endpoint

### Frontend (Next.js API Routes)
All frontend API calls go through Next.js API routes to keep backend URL secure:
- `POST /api/assess-financial-health` - Proxy to backend (with university_index parameter)
- `POST /api/write-grant` - Proxy to backend (with input sanitization)
- `POST /api/explain-to-parent` - Proxy to backend (with input validation)
- `POST /api/upload-handbook` - Proxy to backend (with file validation)

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
│   │   ├── policy_rag.py         # Policy Lawyer agent (supports custom indexes)
│   │   ├── grant_writer.py       # Grant Hunter agent
│   │   ├── negotiator.py         # Email negotiation agent
│   │   ├── parent_explainer.py   # Parent communication agent
│   │   └── handbook_uploader.py  # Handbook processing and Azure Search upload
│   ├── main.py                   # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── api/                  # Next.js API routes (proxies to backend)
│   │   ├── dashboard/            # Main dashboard page
│   │   ├── login/                # Login page
│   │   ├── layout.tsx            # Root layout with providers
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── AzureStatus.tsx       # Azure services status indicator
│   │   ├── BillUpload.tsx        # File upload component
│   │   ├── RiskMeter.tsx         # Risk assessment gauge
│   │   ├── ActionCards.tsx       # Action recommendations
│   │   ├── ProcessingStatus.tsx  # Progress stepper with scanning animation
│   │   ├── Navbar.tsx            # Navigation with accessibility toggle
│   │   ├── HandbookSelector.tsx  # University handbook selection/upload
│   │   └── ProfileForm.tsx       # Student profile form (view/edit mode)
│   ├── contexts/
│   │   └── AccessibilityContext.tsx  # Accessibility state management
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── pdfUtils.ts           # PDF generation utilities
│   │   └── security.ts           # Security utilities (input validation, sanitization)
│   └── public/
│       └── demo_mode.json        # Demo data
├── docs/
│   └── university-handbook-sample.txt  # Sample handbook for testing
├── scripts/
│   ├── upload_handbook.py        # Upload handbook to Azure Search
│   └── update_translator_speech_keys.sh  # Helper for updating keys
├── docker-compose.yml
├── env.example                   # Environment variable template
└── README.md
```

## Key Features

### Multi-Step Workflow
- **Step 1: Handbook Selection**: Choose from preset universities (State University, Tech Institute, Liberal Arts College, Community College) or upload your own PDF/text handbook
- **Step 2: Student Profile**: Enter your details (name, major, academic year, GPA, financial hardship reason) - view/edit mode with clean UI
- **Step 3: Bill Upload**: Upload your tuition bill for analysis
- **Step 4: Results**: Get personalized policy advice, risk assessment, and grant essays

### Handbook Management
- **Preset Universities**: Quick selection from common university types
- **Custom Upload**: Upload your own university handbook (PDF or text)
- **Automatic Processing**: Handbooks are parsed, chunked, and indexed in Azure AI Search
- **Dynamic Indexing**: Each custom handbook gets its own search index
- **Policy Search**: System searches the selected handbook for relevant policies

### Personalized Grant Essays
- **Real Hardship Reasons**: AI uses your actual hardship reason (e.g., "My parents lost their jobs") instead of generic templates
- **Profile Integration**: Essays include your name, major, year, and GPA
- **Context-Aware**: References specific university policies from your selected handbook

### Accessibility
- **Dyslexia-Friendly Font Toggle**: Click the Eye icon in the navbar to enable accessible fonts
- **Persistent Preferences**: Accessibility settings saved in localStorage
- **WCAG 2.1 AA Compliant**: Full keyboard navigation and screen reader support

### Azure Integration
- **Status Indicator**: Bottom-right status bar shows all Azure services
- **Real-Time Monitoring**: Hover to see detailed service status
- **Visual Feedback**: Pulsing green dot indicates system operational

### Document Export
- **PDF Downloads**: Export grant essays and negotiation emails as PDFs
- **Professional Formatting**: Includes "Generated by ScholarShield" header
- **One-Click Export**: Download buttons next to copy buttons

### Enhanced Processing
- **Real-Time Scanning**: Visual feedback during bill analysis
- **Data Extraction Animation**: Shows detected invoice details as they're extracted
- **Smooth Transitions**: Framer Motion animations throughout

### Security
- **Input Validation**: All user inputs validated and sanitized
- **File Upload Security**: File type, size, and name validation
- **Parameter Validation**: University index names validated to prevent injection
- **Error Handling**: Generic error messages prevent information leakage
- **Security Headers**: CSP, XSS protection, clickjacking prevention
- **Secure API Routing**: All backend calls go through Next.js API routes

## Development

### Testing
The system includes mock implementations for all agents, allowing testing without Azure credentials. Set `MOCK_MODE=true` in your `.env` file.

### Code Style
- Python: Follow PEP 8
- TypeScript/React: Use ESLint and Prettier
- Always handle errors gracefully
- Include type hints/TypeScript types

### Frontend Dependencies
- **Next.js 14.2.35**: React framework with App Router (security patched)
- **Framer Motion**: Smooth animations
- **jsPDF**: Client-side PDF generation (latest version, XSS patched)
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety throughout

### Backend Dependencies
- **FastAPI**: Modern Python web framework
- **Gunicorn**: Production WSGI server
- **Azure SDKs**: OpenAI, Document Intelligence, AI Search, Translator, Speech
- **Pydantic**: Data validation

### Frontend Dependencies
- **Next.js 14**: React framework with App Router
- **Framer Motion**: Smooth animations
- **jsPDF**: Client-side PDF generation
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling

## License

This project is developed for the Microsoft Imagine Cup.

