# India Migration Analytics

Interactive dashboard to visualize domestic migration data from Census 2011 D-01 series.

## How to Run

### Data Cleaning (Python)
```bash
cd data-cleaning
pip install pandas openpyxl
python clean_data.py
```
This reads `DS-0000-D01-MDDS.XLSX` and outputs a cleaned CSV with Total, Male, Female, Rural, and Urban counts.

### React App
```bash
cd react-app
npm install
npm run dev
```

### AI Chatbot Backend (Local)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m app
```
Set `VITE_AI_API_BASE_URL=http://127.0.0.1:8000` in `react-app/.env`.

## Features
- Map visualization using Leaflet with flow lines between states
- Inflow/outflow view toggle
- Adjustable minimum migrant threshold filter
- State-wise breakdown with top/bottom bar charts and data table
- Gender breakdown (Male vs Female)
- Urban vs Rural breakdown
- AI Chat page backed by FastAPI + DuckDB + LangChain routing

## Data Source
Census of India 2011, D-Series (Migration Tables)
