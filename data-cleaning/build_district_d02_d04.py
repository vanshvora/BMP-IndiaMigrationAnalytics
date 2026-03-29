from __future__ import annotations

import csv
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


MAIN_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_ID_KEY = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

ROOT = Path(__file__).resolve().parent
D02_DIR = ROOT / "D-02-ALL"
D03_DIR = ROOT / "D-03-ALL"
D04_DIR = ROOT / "D-04-ALL"
D06_DIR = ROOT / "D-06-ALL"

OUT_D02_CLEAN = ROOT / "district_duration_residence_flows.csv"
OUT_D02_PUBLIC = ROOT.parent / "react-app" / "public" / "district_duration_residence_flows.csv"
OUT_D03_CLEAN = ROOT / "district_reason_migration_flows.csv"
OUT_D03_PUBLIC = ROOT.parent / "react-app" / "public" / "district_reason_migration_flows.csv"
OUT_D04_CLEAN = ROOT / "district_education_levels.csv"
OUT_D04_PUBLIC = ROOT.parent / "react-app" / "public" / "district_education_levels.csv"
OUT_D06_CLEAN = ROOT / "district_economic_activity.csv"
OUT_D06_PUBLIC = ROOT.parent / "react-app" / "public" / "district_economic_activity.csv"

STATE_NAMES = {
    "JAMMU & KASHMIR",
    "HIMACHAL PRADESH",
    "PUNJAB",
    "CHANDIGARH",
    "UTTARAKHAND",
    "HARYANA",
    "NCT OF DELHI",
    "RAJASTHAN",
    "UTTAR PRADESH",
    "BIHAR",
    "SIKKIM",
    "ARUNACHAL PRADESH",
    "NAGALAND",
    "MANIPUR",
    "MIZORAM",
    "TRIPURA",
    "MEGHALAYA",
    "ASSAM",
    "WEST BENGAL",
    "JHARKHAND",
    "ODISHA",
    "CHHATTISGARH",
    "MADHYA PRADESH",
    "GUJARAT",
    "DAMAN & DIU",
    "DADRA & NAGAR HAVELI",
    "MAHARASHTRA",
    "ANDHRA PRADESH",
    "KARNATAKA",
    "GOA",
    "LAKSHADWEEP",
    "KERALA",
    "TAMIL NADU",
    "PUDUCHERRY",
    "ANDAMAN & NICOBAR ISLANDS",
    "TELANGANA",
}

TELANGANA_DISTRICTS = {
    "ADILABAD",
    "NIZAMABAD",
    "KARIMNAGAR",
    "MEDAK",
    "WARANGAL",
    "RANGAREDDI",
    "RANGAREDDY",
    "HYDERABAD",
    "NALGONDA",
    "KHAMMAM",
    "MAHBUBNAGAR",
}

D02_HEADERS = [
    "state",
    "district",
    "districtCode",
    "origin",
    "Persons_Total",
    "Males_Total",
    "Females_Total",
    "Persons_LT1yr",
    "Males_LT1yr",
    "Females_LT1yr",
    "Persons_1to4yr",
    "Males_1to4yr",
    "Females_1to4yr",
    "Persons_5to9yr",
    "Males_5to9yr",
    "Females_5to9yr",
    "Persons_10to19yr",
    "Males_10to19yr",
    "Females_10to19yr",
    "Persons_20plusyr",
    "Males_20plusyr",
    "Females_20plusyr",
    "Persons_DurNS",
    "Males_DurNS",
    "Females_DurNS",
]

D04_HEADERS = [
    "state",
    "district",
    "districtCode",
    "Illiterate_Persons",
    "Illiterate_Males",
    "Illiterate_Females",
    "Literate_Persons",
    "Literate_Males",
    "Literate_Females",
    "BelowMatric_Persons",
    "BelowMatric_Males",
    "BelowMatric_Females",
    "MatricToGrad_Persons",
    "MatricToGrad_Males",
    "MatricToGrad_Females",
    "TechDiploma_Persons",
    "TechDiploma_Males",
    "TechDiploma_Females",
    "Graduate_Persons",
    "Graduate_Males",
    "Graduate_Females",
    "TechDegree_Persons",
    "TechDegree_Males",
    "TechDegree_Females",
]

D03_HEADERS = [
    "state",
    "district",
    "districtCode",
    "origin",
    "Persons_Total",
    "Males_Total",
    "Females_Total",
    "Persons_Work",
    "Males_Work",
    "Females_Work",
    "Persons_Business",
    "Males_Business",
    "Females_Business",
    "Persons_Education",
    "Males_Education",
    "Females_Education",
    "Persons_Marriage",
    "Males_Marriage",
    "Females_Marriage",
    "Persons_MoveAfterBirth",
    "Males_MoveAfterBirth",
    "Females_MoveAfterBirth",
    "Persons_MoveWithHH",
    "Males_MoveWithHH",
    "Females_MoveWithHH",
    "Persons_Other",
    "Males_Other",
    "Females_Other",
]

D06_HEADERS = [
    "state",
    "district",
    "districtCode",
    "MainWorkers_Persons",
    "MainWorkers_Males",
    "MainWorkers_Females",
    "MarginalWorkers_Persons",
    "MarginalWorkers_Males",
    "MarginalWorkers_Females",
    "MarginalSeeking_Persons",
    "MarginalSeeking_Males",
    "MarginalSeeking_Females",
    "NonWorkers_Persons",
    "NonWorkers_Males",
    "NonWorkers_Females",
    "NonWorkersSeeking_Persons",
    "NonWorkersSeeking_Males",
    "NonWorkersSeeking_Females",
]


def to_int(value: str | int | float | None) -> int:
    if value is None:
        return 0
    text = str(value).strip()
    if not text:
        return 0
    try:
        return int(float(text))
    except (TypeError, ValueError):
        return 0


def normalize_name(name: str | None) -> str:
    if name is None:
        return ""
    value = str(name).upper().strip()
    value = value.replace("UNION TERRITORY - ", "")
    value = value.replace("STATE - ", "")
    value = value.replace("UT - ", "")
    mapping = {
        "DELHI": "NCT OF DELHI",
        "ORISSA": "ODISHA",
        "TELENGANA": "TELANGANA",
        "UTTARANCHAL": "UTTARAKHAND",
        "JAMMU AND KASHMIR": "JAMMU & KASHMIR",
        "ANDAMAN AND NICOBAR": "ANDAMAN & NICOBAR ISLANDS",
        "ANDAMAN AND NICOBAR ISLANDS": "ANDAMAN & NICOBAR ISLANDS",
        "ANDAMAN & NICOBAR": "ANDAMAN & NICOBAR ISLANDS",
        "DADRA AND NAGAR HAVELI": "DADRA & NAGAR HAVELI",
        "DAMAN AND DIU": "DAMAN & DIU",
    }
    return mapping.get(value, value)


def parse_relationships(xml_bytes: bytes) -> dict[str, str]:
    root = ET.fromstring(xml_bytes)
    relation_map: dict[str, str] = {}
    for rel in root:
        relation_map[rel.attrib.get("Id", "")] = rel.attrib.get("Target", "")
    return relation_map


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for si in root.findall(f"{MAIN_NS}si"):
        parts = [t.text or "" for t in si.findall(f".//{MAIN_NS}t")]
        values.append("".join(parts))
    return values


def get_sheet_path(zf: zipfile.ZipFile, preferred_sheet_name: str) -> str:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    relation_map = parse_relationships(zf.read("xl/_rels/workbook.xml.rels"))

    chosen = None
    fallback = None
    for sheet in wb.findall(f".//{MAIN_NS}sheet"):
        rid = sheet.attrib.get(REL_ID_KEY, "")
        target = relation_map.get(rid, "")
        if not target:
            continue
        if target.startswith("/"):
            path = target[1:]
        else:
            path = f"xl/{target}"
        if fallback is None:
            fallback = path
        if str(sheet.attrib.get("name", "")).strip().upper() == preferred_sheet_name.upper():
            chosen = path
            break

    if chosen:
        return chosen
    if fallback:
        return fallback
    raise ValueError("No worksheet found in workbook")


def column_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    index = 0
    for ch in letters:
        index = (index * 26) + (ord(ch) - 64)
    return index - 1


def read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t", "")
    if cell_type == "inlineStr":
        is_node = cell.find(f"{MAIN_NS}is")
        if is_node is None:
            return ""
        parts = [t.text or "" for t in is_node.findall(f".//{MAIN_NS}t")]
        return "".join(parts).strip()

    value_node = cell.find(f"{MAIN_NS}v")
    if value_node is None:
        return ""
    raw = (value_node.text or "").strip()
    if cell_type == "s":
        try:
            return shared_strings[int(raw)].strip()
        except (ValueError, IndexError):
            return raw
    return raw


def iter_sheet_rows(workbook_path: Path, sheet_name: str):
    with zipfile.ZipFile(workbook_path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet_path = get_sheet_path(zf, sheet_name)
        worksheet = ET.fromstring(zf.read(sheet_path))
        rows = worksheet.findall(f".//{MAIN_NS}sheetData/{MAIN_NS}row")
        for row in rows:
            cells = {}
            for cell in row.findall(f"{MAIN_NS}c"):
                ref = cell.attrib.get("r", "")
                if not ref:
                    continue
                cells[column_index(ref)] = read_cell_value(cell, shared_strings)
            yield cells


def looks_like_state_area_name(value: str) -> bool:
    text = value.upper().strip()
    return text.startswith("STATE -") or text.startswith("UNION TERRITORY -") or text.startswith("UT -")


def normalize_flag(value: str) -> str:
    return str(value or "").strip().upper()


def extract_d02_rows() -> list[dict[str, str | int]]:
    output: list[dict[str, str | int]] = []

    for workbook in sorted(D02_DIR.glob("*.XLSX")):
        workbook_state = ""

        for row in iter_sheet_rows(workbook, "D-02"):
            area_name = str(row.get(3, "")).strip()
            if not workbook_state and looks_like_state_area_name(area_name):
                workbook_state = normalize_name(area_name)

            district_code = to_int(row.get(2))
            if district_code == 0:
                continue

            if not area_name or looks_like_state_area_name(area_name):
                continue

            origin_tru = normalize_flag(row.get(5, ""))
            dest_tru = normalize_flag(row.get(6, ""))
            if origin_tru != "TOTAL" or dest_tru != "TOTAL":
                continue

            origin_state = normalize_name(row.get(4, ""))
            if origin_state not in STATE_NAMES:
                continue

            persons_total = to_int(row.get(7))
            if persons_total <= 0:
                continue

            display_state = (
                "TELANGANA"
                if area_name.upper() in TELANGANA_DISTRICTS
                else workbook_state
            )
            if display_state not in STATE_NAMES:
                continue

            output.append(
                {
                    "state": display_state,
                    "district": area_name,
                    "districtCode": district_code,
                    "origin": origin_state,
                    "Persons_Total": persons_total,
                    "Males_Total": to_int(row.get(8)),
                    "Females_Total": to_int(row.get(9)),
                    "Persons_LT1yr": to_int(row.get(10)),
                    "Males_LT1yr": to_int(row.get(11)),
                    "Females_LT1yr": to_int(row.get(12)),
                    "Persons_1to4yr": to_int(row.get(13)),
                    "Males_1to4yr": to_int(row.get(14)),
                    "Females_1to4yr": to_int(row.get(15)),
                    "Persons_5to9yr": to_int(row.get(16)),
                    "Males_5to9yr": to_int(row.get(17)),
                    "Females_5to9yr": to_int(row.get(18)),
                    "Persons_10to19yr": to_int(row.get(19)),
                    "Males_10to19yr": to_int(row.get(20)),
                    "Females_10to19yr": to_int(row.get(21)),
                    "Persons_20plusyr": to_int(row.get(22)),
                    "Males_20plusyr": to_int(row.get(23)),
                    "Females_20plusyr": to_int(row.get(24)),
                    "Persons_DurNS": to_int(row.get(25)),
                    "Males_DurNS": to_int(row.get(26)),
                    "Females_DurNS": to_int(row.get(27)),
                }
            )

    output.sort(key=lambda item: (item["state"], item["district"], -int(item["Persons_Total"])))
    return output


def extract_d04_rows() -> list[dict[str, str | int]]:
    by_district: dict[tuple[str, str, int], dict[str, str | int]] = {}

    for workbook in sorted(D04_DIR.glob("*.XLSX")):
        workbook_state = ""

        for row in iter_sheet_rows(workbook, "D-04"):
            area_name = str(row.get(3, "")).strip()
            if not workbook_state and looks_like_state_area_name(area_name):
                workbook_state = normalize_name(area_name)

            district_code = to_int(row.get(2))
            if district_code == 0:
                continue

            if not area_name or looks_like_state_area_name(area_name):
                continue

            if normalize_flag(row.get(4, "")) != "TOTAL":
                continue
            if normalize_flag(row.get(5, "")) != "ALL DURATIONS OF RESIDENCE":
                continue
            if normalize_flag(row.get(6, "")) != "ALL AGES":
                continue
            if normalize_flag(row.get(7, "")) != "TOTAL":
                continue

            display_state = (
                "TELANGANA"
                if area_name.upper() in TELANGANA_DISTRICTS
                else workbook_state
            )
            if display_state not in STATE_NAMES:
                continue

            key = (display_state, area_name, district_code)
            if key in by_district:
                continue

            by_district[key] = {
                "state": display_state,
                "district": area_name,
                "districtCode": district_code,
                "Illiterate_Persons": to_int(row.get(11)),
                "Illiterate_Males": to_int(row.get(12)),
                "Illiterate_Females": to_int(row.get(13)),
                "Literate_Persons": to_int(row.get(14)),
                "Literate_Males": to_int(row.get(15)),
                "Literate_Females": to_int(row.get(16)),
                "BelowMatric_Persons": to_int(row.get(17)),
                "BelowMatric_Males": to_int(row.get(18)),
                "BelowMatric_Females": to_int(row.get(19)),
                "MatricToGrad_Persons": to_int(row.get(20)),
                "MatricToGrad_Males": to_int(row.get(21)),
                "MatricToGrad_Females": to_int(row.get(22)),
                "TechDiploma_Persons": to_int(row.get(23)),
                "TechDiploma_Males": to_int(row.get(24)),
                "TechDiploma_Females": to_int(row.get(25)),
                "Graduate_Persons": to_int(row.get(26)),
                "Graduate_Males": to_int(row.get(27)),
                "Graduate_Females": to_int(row.get(28)),
                "TechDegree_Persons": to_int(row.get(29)),
                "TechDegree_Males": to_int(row.get(30)),
                "TechDegree_Females": to_int(row.get(31)),
            }

    output = list(by_district.values())
    output.sort(key=lambda item: (item["state"], item["district"]))
    return output


def extract_d03_rows() -> list[dict[str, str | int]]:
    output: list[dict[str, str | int]] = []

    for workbook in sorted(D03_DIR.glob("*.XLSX")):
        workbook_state = ""

        for row in iter_sheet_rows(workbook, "D-03"):
            area_name = str(row.get(3, "")).strip()
            if not workbook_state and looks_like_state_area_name(area_name):
                workbook_state = normalize_name(area_name)

            district_code = to_int(row.get(2))
            if district_code == 0:
                continue

            if not area_name or looks_like_state_area_name(area_name):
                continue

            if normalize_flag(row.get(4, "")) != "TOTAL":
                continue
            if normalize_flag(row.get(5, "")) != "ALL DURATIONS OF RESIDENCE":
                continue
            if normalize_flag(row.get(7, "")) != "TOTAL":
                continue

            origin_state = normalize_name(row.get(6, ""))
            if origin_state not in STATE_NAMES:
                continue

            persons_total = to_int(row.get(8))
            if persons_total <= 0:
                continue

            display_state = (
                "TELANGANA"
                if area_name.upper() in TELANGANA_DISTRICTS
                else workbook_state
            )
            if display_state not in STATE_NAMES:
                continue

            output.append(
                {
                    "state": display_state,
                    "district": area_name,
                    "districtCode": district_code,
                    "origin": origin_state,
                    "Persons_Total": persons_total,
                    "Males_Total": to_int(row.get(9)),
                    "Females_Total": to_int(row.get(10)),
                    "Persons_Work": to_int(row.get(11)),
                    "Males_Work": to_int(row.get(12)),
                    "Females_Work": to_int(row.get(13)),
                    "Persons_Business": to_int(row.get(14)),
                    "Males_Business": to_int(row.get(15)),
                    "Females_Business": to_int(row.get(16)),
                    "Persons_Education": to_int(row.get(17)),
                    "Males_Education": to_int(row.get(18)),
                    "Females_Education": to_int(row.get(19)),
                    "Persons_Marriage": to_int(row.get(20)),
                    "Males_Marriage": to_int(row.get(21)),
                    "Females_Marriage": to_int(row.get(22)),
                    "Persons_MoveAfterBirth": to_int(row.get(23)),
                    "Males_MoveAfterBirth": to_int(row.get(24)),
                    "Females_MoveAfterBirth": to_int(row.get(25)),
                    "Persons_MoveWithHH": to_int(row.get(26)),
                    "Males_MoveWithHH": to_int(row.get(27)),
                    "Females_MoveWithHH": to_int(row.get(28)),
                    "Persons_Other": to_int(row.get(29)),
                    "Males_Other": to_int(row.get(30)),
                    "Females_Other": to_int(row.get(31)),
                }
            )

    output.sort(key=lambda item: (item["state"], item["district"], -int(item["Persons_Total"])))
    return output


def extract_d06_rows() -> list[dict[str, str | int]]:
    by_district: dict[tuple[str, str, int], dict[str, str | int]] = {}

    for workbook in sorted(D06_DIR.glob("*.XLSX")):
        workbook_state = ""

        for row in iter_sheet_rows(workbook, "D-06"):
            area_name = str(row.get(3, "")).strip()
            if not workbook_state and looks_like_state_area_name(area_name):
                workbook_state = normalize_name(area_name)

            district_code = to_int(row.get(2))
            if district_code == 0:
                continue

            if not area_name or looks_like_state_area_name(area_name):
                continue

            if normalize_flag(row.get(4, "")) != "TOTAL":
                continue
            if normalize_flag(row.get(5, "")) != "ALL DURATIONS OF RESIDENCE":
                continue
            if normalize_flag(row.get(6, "")) != "ALL AGES":
                continue
            if normalize_flag(row.get(7, "")) != "TOTAL":
                continue

            display_state = (
                "TELANGANA"
                if area_name.upper() in TELANGANA_DISTRICTS
                else workbook_state
            )
            if display_state not in STATE_NAMES:
                continue

            key = (display_state, area_name, district_code)
            if key in by_district:
                continue

            by_district[key] = {
                "state": display_state,
                "district": area_name,
                "districtCode": district_code,
                "MainWorkers_Persons": to_int(row.get(11)),
                "MainWorkers_Males": to_int(row.get(12)),
                "MainWorkers_Females": to_int(row.get(13)),
                "MarginalWorkers_Persons": to_int(row.get(14)),
                "MarginalWorkers_Males": to_int(row.get(15)),
                "MarginalWorkers_Females": to_int(row.get(16)),
                "MarginalSeeking_Persons": to_int(row.get(17)),
                "MarginalSeeking_Males": to_int(row.get(18)),
                "MarginalSeeking_Females": to_int(row.get(19)),
                "NonWorkers_Persons": to_int(row.get(20)),
                "NonWorkers_Males": to_int(row.get(21)),
                "NonWorkers_Females": to_int(row.get(22)),
                "NonWorkersSeeking_Persons": to_int(row.get(23)),
                "NonWorkersSeeking_Males": to_int(row.get(24)),
                "NonWorkersSeeking_Females": to_int(row.get(25)),
            }

    output = list(by_district.values())
    output.sort(key=lambda item: (item["state"], item["district"]))
    return output


def write_csv(path: Path, rows: list[dict[str, str | int]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fp:
        writer = csv.DictWriter(fp, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def safe_write_csv(path: Path, rows: list[dict[str, str | int]], headers: list[str]) -> tuple[bool, str]:
    try:
        write_csv(path, rows, headers)
        return True, f"Saved: {path}"
    except PermissionError as err:
        return False, f"Skipped (locked): {path} ({err})"


def main() -> None:
    d02_rows = extract_d02_rows()
    d03_rows = extract_d03_rows()
    d04_rows = extract_d04_rows()
    d06_rows = extract_d06_rows()

    write_results = [
        safe_write_csv(OUT_D02_CLEAN, d02_rows, D02_HEADERS),
        safe_write_csv(OUT_D02_PUBLIC, d02_rows, D02_HEADERS),
        safe_write_csv(OUT_D03_CLEAN, d03_rows, D03_HEADERS),
        safe_write_csv(OUT_D03_PUBLIC, d03_rows, D03_HEADERS),
        safe_write_csv(OUT_D04_CLEAN, d04_rows, D04_HEADERS),
        safe_write_csv(OUT_D04_PUBLIC, d04_rows, D04_HEADERS),
        safe_write_csv(OUT_D06_CLEAN, d06_rows, D06_HEADERS),
        safe_write_csv(OUT_D06_PUBLIC, d06_rows, D06_HEADERS),
    ]

    unique_d02_districts = {(row["state"], row["district"]) for row in d02_rows}
    unique_d03_districts = {(row["state"], row["district"]) for row in d03_rows}
    unique_d04_districts = {(row["state"], row["district"]) for row in d04_rows}
    unique_d06_districts = {(row["state"], row["district"]) for row in d06_rows}
    print(f"D02 rows: {len(d02_rows):,}")
    print(f"D02 states: {len({row['state'] for row in d02_rows}):,}")
    print(f"D02 districts: {len(unique_d02_districts):,}")
    print(f"D03 rows: {len(d03_rows):,}")
    print(f"D03 states: {len({row['state'] for row in d03_rows}):,}")
    print(f"D03 districts: {len(unique_d03_districts):,}")
    print(f"D04 rows: {len(d04_rows):,}")
    print(f"D04 states: {len({row['state'] for row in d04_rows}):,}")
    print(f"D04 districts: {len(unique_d04_districts):,}")
    print(f"D06 rows: {len(d06_rows):,}")
    print(f"D06 states: {len({row['state'] for row in d06_rows}):,}")
    print(f"D06 districts: {len(unique_d06_districts):,}")
    for _, message in write_results:
        print(message)


if __name__ == "__main__":
    main()
