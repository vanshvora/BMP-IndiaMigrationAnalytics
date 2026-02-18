# Script to clean the raw census migration data
# Reads DS-0000-D01-MDDS.XLSX and outputs cleaned CSV with gender and area breakdowns

import pandas as pd
import os

INPUT_FILE = "DS-0000-D01-MDDS.XLSX"
OUTPUT_FILE = "react-app/public/Final_Cleaned_Data.csv"

# these are summary rows we dont want
SUMMARY_PATTERNS = [
    "Countries in Asia beyond India",
    "Countries in Europe",
    "Countries in Africa",
    "Countries in the Americas",
    "Countries in Oceania"
]

# Column layout in the Excel (after skipping 4 header rows):
# 0: Table name, 1: State, 2: District, 3: Area Name, 4: Birth place
# 5: Total, 6: Male, 7: Female
# 8: Rural Total, 9: Rural Male, 10: Rural Female
# 11: Urban Total, 12: Urban Male, 13: Urban Female
COLUMN_NAMES = [
    'TableName', 'State', 'District', 'Area Name', 'Birth place',
    'Total', 'Male', 'Female',
    'Rural_Total', 'Rural_Male', 'Rural_Female',
    'Urban_Total', 'Urban_Male', 'Urban_Female'
]

def clean_migration_data():
    print("Starting data cleaning...")
    
    # skip 4 header rows (title + merged headers + sub-headers)
    df = pd.read_excel(INPUT_FILE, skiprows=4, header=None)
    df.columns = COLUMN_NAMES[:len(df.columns)]
    
    initial_rows = len(df)
    print(f"Read {initial_rows} rows")
    
    # drop rows with missing Area Name or Birth place
    df = df.dropna(subset=['Area Name', 'Birth place'])
    
    # drop rows where Birth place is just a number (leftover sub-header)
    df = df[~df['Birth place'].astype(str).str.match(r'^\d+$')]
    
    # remove rows where Area Name is INDIA (national totals)
    india_mask = df['Area Name'].astype(str).str.upper().str.strip() == 'INDIA'
    df = df[~india_mask]
    print(f"Removed {india_mask.sum()} national summary rows")
    
    # convert numeric columns
    for col in ['Total', 'Male', 'Female', 'Rural_Total', 'Urban_Total']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    
    # remove zero total rows
    zero_count = (df['Total'] == 0).sum()
    df = df[df['Total'] != 0]
    print(f"Removed {zero_count} zero rows")
    
    # remove the continental summary rows
    for pattern in SUMMARY_PATTERNS:
        mask = df['Birth place'].astype(str).str.contains(pattern, case=False, na=False)
        if mask.sum() > 0:
            df = df[~mask]
    
    # remove elsewhere entries
    elsewhere_mask = df['Birth place'].astype(str).str.upper().str.strip() == 'ELSEWHERE'
    df = df[~elsewhere_mask]
    
    # remove unclassifiable
    unclass_mask = df['Birth place'].astype(str).str.contains('Unclassifiable', case=False, na=False)
    df = df[~unclass_mask]
    
    # remove other summary type rows
    total_mask = df['Birth place'].astype(str).str.contains(
        'Total|Born in|place of enumeration|Born within|Born outside|'
        'state of enumeration|district of enumeration|States in India beyond|Residence', 
        case=False, regex=True, na=False
    )
    df = df[~total_mask]
    
    # keep only the columns we need and save
    keep_cols = ['Area Name', 'Birth place', 'Total', 'Male', 'Female', 'Rural_Total', 'Urban_Total']
    df = df[[c for c in keep_cols if c in df.columns]]
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"Done! Saved {len(df)} rows to {OUTPUT_FILE}")
    print(f"Columns: {df.columns.tolist()}")

if __name__ == "__main__":
    clean_migration_data()
