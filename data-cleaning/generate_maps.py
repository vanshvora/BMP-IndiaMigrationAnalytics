"""
Map PNG Generator for India Migration Analytics
===============================================
Run this from the project root:
    python generate_maps.py

It will:
1. Download GADM India level-1 (states), level-2 (districts), level-3 (talukas) GeoJSON
2. Generate one PNG per state -> react-app/public/maps/states/STATE_NAME.png
3. Generate one PNG per district -> react-app/public/maps/districts/STATE_NAME_DISTRICT_NAME.png

Install dependencies first:
    pip install geopandas matplotlib shapely requests
"""

import json
import os
import re

import geopandas as gpd
import matplotlib
import matplotlib.patheffects as pe
import matplotlib.pyplot as plt
import requests
from shapely.ops import unary_union

matplotlib.use('Agg')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC_DIR = os.path.join(BASE_DIR, 'react-app', 'public')
STATES_OUT = os.path.join(PUBLIC_DIR, 'maps', 'states')
DISTRICTS_OUT = os.path.join(PUBLIC_DIR, 'maps', 'districts')
CACHE_DIR = os.path.join(BASE_DIR, '.map_cache')

os.makedirs(STATES_OUT, exist_ok=True)
os.makedirs(DISTRICTS_OUT, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

GADM_L1_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IND_1.json'
GADM_L2_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IND_2.json'
GADM_L3_URL = 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IND_3.json'

FORCE_REGENERATE = True

NAME_MAP = {
    'JAMMU AND KASHMIR': 'JAMMU & KASHMIR',
    'DELHI': 'NCT OF DELHI',
    'ORISSA': 'ODISHA',
    'TELENGANA': 'TELANGANA',
    'UTTARANCHAL': 'UTTARAKHAND',
    'ANDAMAN AND NICOBAR': 'ANDAMAN & NICOBAR ISLANDS',
    'ANDAMAN AND NICOBAR ISLANDS': 'ANDAMAN & NICOBAR ISLANDS',
    'DADRA AND NAGAR HAVELI': 'DADRA & NAGAR HAVELI',
    'DAMAN AND DIU': 'DAMAN & DIU',
    'ARUNACHAL': 'ARUNACHAL PRADESH',
}

DISTRICT_NAME_MAP = {
    'BANGALORE': 'BENGALURU',
    'BANGALORE RURAL': 'BENGALURU RURAL',
    'THE DANGS': 'DANG',
}

BOUNDARY_COLOR = '#334155'
FILL_COLOR = '#f0f9ff'
INNER_BOUNDARY_COLOR = '#94a3b8'
LABEL_COLOR = '#1e293b'
BG_COLOR = 'none'


def normalize_state(name):
    if not name:
        return ''
    value = str(name).upper().strip()
    value = re.sub(r'\s*\(\d+\)$', '', value)
    value = re.sub(r'^STATE\s*-\s*', '', value)
    value = re.sub(r'^UT\s*-\s*', '', value).strip()
    return NAME_MAP.get(value, value)


def normalize_district(name):
    if not name:
        return ''
    value = str(name).upper().strip()
    value = re.sub(r'\s+', ' ', value)
    value = value.replace('.', '').replace("'", '').replace('`', '')
    value = value.replace('&', 'AND')
    value = re.sub(r'\(.*?\)', ' ', value)
    value = value.replace('-', ' ')
    value = re.sub(r'\bDISTRICT\b', '', value)
    value = re.sub(r'\bTHE\b', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return DISTRICT_NAME_MAP.get(value, value)


def normalize_taluka(name):
    if not name:
        return ''
    value = str(name).upper().strip()
    value = re.sub(r'\s+', ' ', value)
    value = value.replace('.', '').replace("'", '').replace('`', '')
    value = value.replace('&', 'AND')
    value = re.sub(r'\(.*?\)', ' ', value)
    value = value.replace('-', ' ')
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def to_filename(name):
    value = str(name).upper().replace('&', 'AND')
    return re.sub(r'[^A-Z0-9]+', '', value)


def download_geojson(url, cache_name):
    cache_path = os.path.join(CACHE_DIR, cache_name)
    if os.path.exists(cache_path):
        print(f'  Using cached {cache_name}')
        with open(cache_path, 'r', encoding='utf-8') as handle:
            return json.load(handle)

    print(f'  Downloading {cache_name}...')
    response = requests.get(url, timeout=120)
    response.raise_for_status()
    data = response.json()

    with open(cache_path, 'w', encoding='utf-8') as handle:
        json.dump(data, handle)

    return data


def get_taluka_rows(l3_gdf, gid2, state_norm, district_norm):
    if 'GID_2' in l3_gdf.columns and gid2:
        rows = l3_gdf[l3_gdf['GID_2'] == gid2].copy()
        if len(rows) > 0:
            return rows, 'gid2'

    rows = l3_gdf[
        (l3_gdf['state_norm'] == state_norm) &
        (l3_gdf['district_norm'] == district_norm)
    ].copy()
    if len(rows) > 0:
        return rows, 'normalized-name'

    return rows, 'none'


def make_state_png(state_norm, state_geom, district_gdf_state, out_path):
    fig, ax = plt.subplots(1, 1, figsize=(5, 5))
    fig.patch.set_alpha(0)
    ax.set_facecolor('none')
    ax.set_aspect('equal')
    ax.axis('off')

    state_gdf = gpd.GeoDataFrame(geometry=[state_geom], crs='EPSG:4326')
    state_gdf.plot(ax=ax, color=FILL_COLOR, edgecolor=BOUNDARY_COLOR, linewidth=1.2)

    if district_gdf_state is not None and len(district_gdf_state) > 0:
        district_gdf_state.plot(ax=ax, color='none', edgecolor=INNER_BOUNDARY_COLOR, linewidth=0.5)

        for _, row in district_gdf_state.iterrows():
            try:
                centroid = row.geometry.centroid
                label = normalize_district(row.get('NAME_2', ''))
                if len(label) > 14:
                    label = label[:13] + '.'
                ax.text(
                    centroid.x,
                    centroid.y,
                    label,
                    fontsize=4.5,
                    ha='center',
                    va='center',
                    color=LABEL_COLOR,
                    fontweight='bold',
                    path_effects=[pe.withStroke(linewidth=1.5, foreground='white')]
                )
            except Exception:
                pass

    plt.tight_layout(pad=0.1)
    plt.savefig(out_path, dpi=150, bbox_inches='tight', transparent=True, edgecolor='none', format='png')
    plt.close(fig)


def make_district_png(district_norm, district_geom, taluka_gdf_district, out_path):
    fig, ax = plt.subplots(1, 1, figsize=(5, 5))
    fig.patch.set_alpha(0)
    ax.set_facecolor('none')
    ax.set_aspect('equal')
    ax.axis('off')

    district_gdf = gpd.GeoDataFrame(geometry=[district_geom], crs='EPSG:4326')
    district_gdf.plot(ax=ax, color=FILL_COLOR, edgecolor=BOUNDARY_COLOR, linewidth=1.2)

    if taluka_gdf_district is not None and len(taluka_gdf_district) > 0:
        taluka_gdf_district.plot(ax=ax, color='none', edgecolor=INNER_BOUNDARY_COLOR, linewidth=0.5)

        for _, row in taluka_gdf_district.iterrows():
            try:
                centroid = row.geometry.centroid
                label = normalize_taluka(row.get('NAME_3', ''))
                if len(label) > 14:
                    label = label[:13] + '.'
                ax.text(
                    centroid.x,
                    centroid.y,
                    label,
                    fontsize=4.5,
                    ha='center',
                    va='center',
                    color=LABEL_COLOR,
                    fontweight='bold',
                    path_effects=[pe.withStroke(linewidth=1.5, foreground='white')]
                )
            except Exception:
                pass
    else:
        try:
            centroid = district_geom.centroid
            ax.text(
                centroid.x,
                centroid.y,
                district_norm,
                fontsize=7,
                ha='center',
                va='center',
                color=LABEL_COLOR,
                fontweight='bold',
                path_effects=[pe.withStroke(linewidth=2, foreground='white')]
            )
        except Exception:
            pass

    plt.tight_layout(pad=0.1)
    plt.savefig(out_path, dpi=150, bbox_inches='tight', transparent=True, edgecolor='none', format='png')
    plt.close(fig)


def main():
    print('\n=== India Migration Analytics - Map PNG Generator ===\n')

    print('Step 1: Downloading GeoJSON data...')
    l1_data = download_geojson(GADM_L1_URL, 'gadm41_IND_1.json')
    l2_data = download_geojson(GADM_L2_URL, 'gadm41_IND_2.json')
    l3_data = download_geojson(GADM_L3_URL, 'gadm41_IND_3.json')

    print('\nStep 2: Loading into GeoDataFrames...')
    l1_gdf = gpd.GeoDataFrame.from_features(l1_data['features'], crs='EPSG:4326')
    l2_gdf = gpd.GeoDataFrame.from_features(l2_data['features'], crs='EPSG:4326')
    l3_gdf = gpd.GeoDataFrame.from_features(l3_data['features'], crs='EPSG:4326')

    l1_gdf['state_norm'] = l1_gdf['NAME_1'].apply(normalize_state)
    l2_gdf['state_norm'] = l2_gdf['NAME_1'].apply(normalize_state)
    l2_gdf['district_norm'] = l2_gdf['NAME_2'].apply(normalize_district)
    l3_gdf['state_norm'] = l3_gdf['NAME_1'].apply(normalize_state)
    l3_gdf['district_norm'] = l3_gdf['NAME_2'].apply(normalize_district)

    print('\nStep 3: Generating state PNGs...')
    states = l1_gdf['state_norm'].unique()
    total_states = len(states)

    for index, state_norm in enumerate(sorted(states), start=1):
        out_filename = to_filename(state_norm) + '.png'
        out_path = os.path.join(STATES_OUT, out_filename)

        if os.path.exists(out_path) and not FORCE_REGENERATE:
            print(f'  [{index}/{total_states}] {state_norm} - skipped (exists)')
            continue

        print(f'  [{index}/{total_states}] {state_norm}...')
        state_rows = l1_gdf[l1_gdf['state_norm'] == state_norm]
        if len(state_rows) == 0:
            print(f'    WARNING: No geometry found for {state_norm}')
            continue

        state_geom = unary_union(state_rows.geometry.values)
        district_rows = l2_gdf[l2_gdf['state_norm'] == state_norm].copy()

        try:
            make_state_png(state_norm, state_geom, district_rows if len(district_rows) > 0 else None, out_path)
        except Exception as exc:
            print(f'    ERROR generating {state_norm}: {exc}')

    print('\nStep 4: Generating district PNGs...')
    district_columns = ['state_norm', 'district_norm']
    if 'GID_2' in l2_gdf.columns:
        district_columns.append('GID_2')
    districts = l2_gdf[district_columns].drop_duplicates()
    total_districts = len(districts)

    missing_taluka_matches = []
    fallback_taluka_matches = []

    for index, (_, row) in enumerate(districts.iterrows(), start=1):
        state_norm = row['state_norm']
        district_norm = row['district_norm']
        gid2 = row['GID_2'] if 'GID_2' in districts.columns else None

        out_filename = to_filename(state_norm) + '_' + to_filename(district_norm) + '.png'
        out_path = os.path.join(DISTRICTS_OUT, out_filename)

        if os.path.exists(out_path) and not FORCE_REGENERATE:
            print(f'  [{index}/{total_districts}] {state_norm} / {district_norm} - skipped (exists)')
            continue

        print(f'  [{index}/{total_districts}] {state_norm} / {district_norm}...')

        district_rows = l2_gdf[
            (l2_gdf['state_norm'] == state_norm) &
            (l2_gdf['district_norm'] == district_norm)
        ]
        if len(district_rows) == 0:
            print(f'    WARNING: No geometry for {district_norm}')
            continue

        district_geom = unary_union(district_rows.geometry.values)
        taluka_rows, taluka_match_mode = get_taluka_rows(l3_gdf, gid2, state_norm, district_norm)

        if taluka_match_mode == 'normalized-name':
            fallback_taluka_matches.append(f'{state_norm} / {district_norm}')
        elif taluka_match_mode == 'none':
            missing_taluka_matches.append(f'{state_norm} / {district_norm}')
            print(f'    WARNING: No taluka rows matched for {state_norm} / {district_norm}')

        try:
            make_district_png(
                district_norm,
                district_geom,
                taluka_rows if len(taluka_rows) > 0 else None,
                out_path
            )
        except Exception as exc:
            print(f'    ERROR generating {district_norm}: {exc}')

    print('\n=== Done! ===')
    print(f'State maps -> {STATES_OUT}')
    print(f'District maps -> {DISTRICTS_OUT}')
    if fallback_taluka_matches:
        print(f'Name-fallback taluka matches: {len(fallback_taluka_matches)}')
    if missing_taluka_matches:
        print(f'Districts with no taluka matches: {len(missing_taluka_matches)}')
        for item in missing_taluka_matches[:20]:
            print(f'  - {item}')
        if len(missing_taluka_matches) > 20:
            print('  - ...')
    print('\nTip: set FORCE_REGENERATE = True before rerunning if old PNGs already exist.')


if __name__ == '__main__':
    main()
