# India Migration Analytics Platform

A comprehensive interactive web platform for analyzing domestic migration patterns in India using Census 2011 data. This platform enables researchers, policymakers, and citizens to understand migration trends across states and districts with rich visualizations, interactive maps, and AI-powered natural language insights.

The platform transforms raw census migration data into actionable intelligence through multi-level geographic analysis, demographic breakdowns, and comparative analytics. Users can explore migration corridors (routes between states and districts), identify key migration patterns, view cultural context for each state, and query the data conversationally through an AI assistant.

---

## 🌟 Features

### Interactive Maps & Explorers
- **State Explorer** — Visualize inter-state migration corridors on an interactive Leaflet map with directional flow arcs. Toggle between inflow and outflow views, filter by minimum migrant threshold, and view ranked corridor tables.
- **District Explorer** — Drill down to district-level migration flows across India. Same interactive map experience at a finer geographic granularity.

### Comparative Analytics
- **Compare States** — Side-by-side comparison of migration patterns between any two states, with synchronized charts covering demographics, reasons for migration, duration of residence, and more.
- **Compare Districts** — Two-district comparative view with the same rich analytics.

### AI Chat Assistant
- **Natural Language Queries** — Ask questions about migration data in plain English (e.g., *"Which state has the highest female outflow?"*) and receive contextual, data-backed answers.
- Powered by LangChain + LLM (Groq / OpenAI-compatible) with SQL generation over a DuckDB database.

### Rich Data Visualizations
- **Demographic Breakdowns** — Analyze migration by gender (Male / Female) and area type (Urban / Rural) with interactive Chart.js charts.
- **Reason for Migration** — Understand why people migrate (employment, education, marriage, etc.) with donut and bar charts.
- **Duration of Residence** — See how long migrants have lived in their destination.
- **Economic Activity & Education** — Explore migrant workforce participation and educational attainment.
- **Marital Status** — View marital composition of migrant populations.

### Cultural Landscape
- **State Cultural Modal** — Click any state to view a curated cultural overview including cuisine, festivals, landmarks, and representative imagery for each region.

### Information Pages
- **Home** — Guided onboarding with feature highlights and quick-start navigation.
- **Methodology** — Detailed explanation of data sources, cleaning pipeline, and analytical methods.
- **FAQ** — Common questions about the platform and migration data.
- **About** — Background on the project, team, and data attribution.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, Leaflet / React-Leaflet 5, Chart.js 4 / react-chartjs-2, PapaParse, PrimeIcons |
| **Backend** | FastAPI 0.116, Uvicorn 0.35, DuckDB 1.3, LangChain 0.3, LangChain-OpenAI, SQLGlot 27, Pydantic Settings |
| **Data Processing** | Python, Pandas, Jupyter Notebooks |
| **Data Source** | Census of India 2011 — D-Series Migration Tables |

---

## 🏗️ Project Structure

```
bmp-cursor/
├── react-app/                  # Frontend application (Vite + React)
│   ├── public/
│   │   ├── *.csv               # Cleaned census data files served to the frontend
│   │   ├── cultural_photos/    # State cultural imagery
│   │   └── maps/               # GeoJSON map boundaries
│   └── src/
│       ├── App.jsx             # Root component with hash-based routing & nav
│       ├── components/
│       │   ├── HomePage.jsx              # Landing page with feature cards
│       │   ├── StateDashboardPage.jsx    # State explorer (map + sidebar + data)
│       │   ├── DistrictDashboardPage.jsx # District explorer
│       │   ├── ComparisonDashboard.jsx   # State comparison view
│       │   ├── DistrictComparisonDashboard.jsx
│       │   ├── AIChatPage.jsx            # AI chat assistant UI
│       │   ├── MapView.jsx               # Leaflet map for states
│       │   ├── DistrictMapView.jsx       # Leaflet map for districts
│       │   ├── DataSection.jsx           # State-level charts & tables
│       │   ├── DistrictDataSection.jsx   # District-level charts & tables
│       │   ├── CulturalMapModal.jsx      # Cultural landscape overlay
│       │   ├── Sidebar.jsx / DistrictSidebar.jsx
│       │   ├── MethodologyPage.jsx / FAQPage.jsx / AboutPage.jsx
│       │   └── ...                       # Popups, utilities, widgets
│       ├── data/
│       │   └── culturalContent.js        # Curated cultural data per state
│       └── utils/
│           ├── coordinates.js            # State/district lat-lng mappings
│           ├── leafletCurve.js           # Custom arc rendering for Leaflet
│           ├── loadCsv.js               # CSV fetch + parse helper
│           ├── chartLabels.js           # Shared chart label configs
│           └── ...
│
├── backend/                    # FastAPI backend (AI chat service)
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, /api/chat endpoint
│   │   ├── sql_agent.py        # LangChain chat orchestrator & SQL generation
│   │   ├── prompting.py        # System prompts & few-shot examples
│   │   ├── retrieval.py        # Lexical retrieval for schema context
│   │   ├── db.py               # DuckDB database manager
│   │   ├── llm_provider.py     # LLM factory (Groq / OpenAI-compatible)
│   │   ├── config.py           # Pydantic Settings configuration
│   │   └── schemas.py          # Request/response models
│   ├── data/
│   │   └── migration.duckdb    # Pre-built DuckDB database
│   └── requirements.txt
│
├── data-cleaning/              # Data processing pipeline
│   ├── D01_EDA.ipynb           # Exploratory data analysis notebooks
│   ├── D02_EDA.ipynb
│   ├── D03_EDA.ipynb
│   ├── D04_Preprocessing.ipynb
│   ├── D12_Preprocessing.ipynb
│   ├── build_district_d02_d04.py   # District-level flow builder script
│   ├── *_cleaned.csv           # Cleaned output datasets
│   ├── district_*.csv          # District-level derived datasets
│   └── D-0*-ALL/               # Raw census source data directories
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| **Node.js** | 18+ |
| **Python** | 3.10+ |
| **Git** | Any recent version |

### 1. Clone the Repository

```bash
git clone https://github.com/vanshvora/BMP-IndiaMigrationAnalytics.git
cd BMP-IndiaMigrationAnalytics
```

### 2. Frontend Setup

```bash
cd react-app
npm install
npm run dev
```

The development server starts at **http://localhost:5173**.

### 3. Backend Setup (required for AI Chat)

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
.venv\Scripts\activate        # Windows (cmd)
.venv\Scripts\Activate.ps1    # Windows (PowerShell)
source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory (or copy from `.env.example` if available):

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

> **Note:** The backend uses an OpenAI-compatible interface, so any provider that exposes an OpenAI-style API can be configured here.

#### Run the Backend

```bash
python -m app
```

The API server starts at **http://127.0.0.1:8000**. The chat endpoint is available at `POST /api/chat`.

---

## 🗂️ Data Sources

All migration data is sourced from the **Census of India 2011 — D-Series Tables**, which provide detailed statistics on internal migration by last residence at both state and district levels.

| Dataset | Description |
|---|---|
| `D01` | Migrants by place of last residence — state-level |
| `D02` | Migrants by place of last residence and duration — state-level |
| `D03` | Migrants by place of last residence and reason — state-level |
| `D04` | Migrants by educational level — state-level |
| `D06` | Migrants by marital status — state-level |
| `D10` | Migrants by economic activity — state-level |
| `D12` | Migrants by place of last residence — district-level |
| `district_*` | Derived district-level datasets (flows, reasons, duration, education, etc.) |

The raw Excel files are processed through Jupyter notebooks and Python scripts in the `data-cleaning/` directory to produce the cleaned CSVs consumed by the frontend and the DuckDB database used by the backend.

---

## 📸 Pages Overview

| Page | Route | Description |
|---|---|---|
| Home | `#home` | Landing page with feature highlights and onboarding |
| State Explorer | `#state` | Interactive state-level migration map and analytics |
| District Explorer | `#district` | Interactive district-level migration map and analytics |
| Compare States | `#compare` | Side-by-side state comparison dashboard |
| Compare Districts | `#compare-district` | Side-by-side district comparison dashboard |
| AI Chat | `#ai` | Natural language migration data assistant |
| Methodology | `#methodology` | Data sources and analytical methods |
| FAQ | `#faq` | Frequently asked questions |
| About | `#about` | Project background and attribution |

---

## 🧑‍💻 Development

### Frontend Dev Server

```bash
cd react-app
npm run dev          # Start Vite dev server (hot reload)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Dev Server

```bash
cd backend
python -m app        # Starts Uvicorn on port 8000
```

---

## 📄 License

This project uses Census of India 2011 data, which is publicly available for research and educational purposes.
