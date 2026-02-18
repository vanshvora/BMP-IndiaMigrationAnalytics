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

## Features
- Map visualization using Leaflet with flow lines between states
- Inflow/outflow view toggle
- Adjustable minimum migrant threshold filter
- State-wise breakdown with top/bottom bar charts and data table
- Gender breakdown (Male vs Female)
- Urban vs Rural breakdown

## Data Source
Census of India 2011, D-Series (Migration Tables)
