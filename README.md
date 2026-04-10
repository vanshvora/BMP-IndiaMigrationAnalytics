# India Migration Analytics Platform

A comprehensive interactive web platform for analyzing domestic migration patterns in India using Census 2011 data. This platform enables researchers, policymakers, and citizens to understand migration trends across states and districts with rich visualizations, interactive maps, and AI-powered insights.

The platform transforms raw census migration data into actionable intelligence through multi-level geographic analysis, demographic breakdowns, and comparative analytics. Users can explore migration corridors (routes between states/districts), identify key migration patterns, and query the data using natural language through an AI assistant.

## About This Project

This platform was built to make census migration data accessible and understandable to a broader audience. Rather than working with spreadsheets, users can:
- Visualize migration corridors on interactive maps showing inflows and outflows
- Analyze demographic patterns (gender, urban/rural splits)
- Compare migration trends between different regions
- Ask natural language questions about migration patterns via an AI chat assistant
- Explore district-level details alongside state-level overviews

## 🛠️ Technology Stack

**Frontend:** React, Vite, Leaflet, Chart.js, PapaParse

**Backend:** FastAPI, Uvicorn, DuckDB, LangChain, SQLGlot

**Data Processing:** Pandas, Python

## 🌟 Features

- **Interactive Maps:** Visual representation of migration corridors with directional flow indicators between regions
- **State & District Analysis:** Explore migration patterns at both state and district administrative levels
- **Inflow/Outflow Toggle:** Switch between incoming and outgoing migration views for any region
- **AI Chat Assistant:** Ask natural language questions about migration data and receive contextual insights powered by LLMs
- **Demographic Breakdowns:** Analyze migration by gender (Male/Female) and area type (Urban/Rural)
- **Comparative Analytics:** Side-by-side comparison of migration patterns between two states or two districts
- **Customizable Filters:** Adjust minimum migrant thresholds and filter by various parameters
- **Statistical Summaries:** View top/bottom migration corridors, aggregate statistics, and detailed data tables

## 🏗️ Project Structure

```
bmp-cursor/
├── react-app/          # Frontend application
├── backend/            # FastAPI backend
├── data-cleaning/      # Data processing scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for React app)
- Python 3.9+ (for backend and data cleaning)
- Git

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd bmp-cursor
```

#### 2. Frontend Setup
```bash
cd react-app
npm install
npm run dev
```
Available at `http://localhost:5173`

#### 3. Backend Setup (Optional)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` with your LLM API key (Google Gemini or Groq).

#### 4. Run Backend
```bash
python -m app
```
Available at `http://127.0.0.1:8000`

## 📊 Data Source

Census of India 2011 - D-Series Tables (state and district-level migration data)
---
