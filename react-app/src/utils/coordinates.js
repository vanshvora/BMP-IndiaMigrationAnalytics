// coordinates for all Indian states - used for map markers and flow lines
// got these from google maps

export const INDIAN_STATES_NORM = [
    "JAMMU & KASHMIR", "HIMACHAL PRADESH", "PUNJAB", "CHANDIGARH", "UTTARAKHAND",
    "HARYANA", "NCT OF DELHI", "RAJASTHAN", "UTTAR PRADESH", "BIHAR", "SIKKIM",
    "ARUNACHAL PRADESH", "NAGALAND", "MANIPUR", "MIZORAM", "TRIPURA", "MEGHALAYA",
    "ASSAM", "WEST BENGAL", "JHARKHAND", "ODISHA", "CHHATTISGARH", "MADHYA PRADESH",
    "GUJARAT", "DAMAN & DIU", "DADRA & NAGAR HAVELI", "MAHARASHTRA", "ANDHRA PRADESH",
    "KARNATAKA", "GOA", "LAKSHADWEEP", "KERALA", "TAMIL NADU", "PUDUCHERRY",
    "ANDAMAN & NICOBAR ISLANDS", "TELANGANA"
];

// lat, lng for each state
export const COORDINATES = {
    "JAMMU & KASHMIR": [33.7782, 76.5762],
    "LADAKH": [34.2996, 78.2932],
    "HIMACHAL PRADESH": [31.9272, 77.1828],
    "PUNJAB": [31.1471, 75.3412],
    "CHANDIGARH": [30.7333, 76.7794],
    "UTTARAKHAND": [30.0668, 79.0193],
    "HARYANA": [29.0588, 76.0856],
    "NCT OF DELHI": [28.7041, 77.1025],
    "RAJASTHAN": [27.0238, 74.2179],
    "UTTAR PRADESH": [26.8467, 80.9462],
    "BIHAR": [25.0961, 85.3131],
    "SIKKIM": [27.5330, 88.5122],
    "ARUNACHAL PRADESH": [28.2180, 94.7278],
    "NAGALAND": [26.1584, 94.5624],
    "MANIPUR": [24.6637, 93.9063],
    "MIZORAM": [23.1645, 92.9376],
    "TRIPURA": [23.9408, 91.9882],
    "MEGHALAYA": [25.4670, 91.3662],
    "ASSAM": [26.2006, 92.9376],
    "WEST BENGAL": [22.9868, 87.8550],
    "JHARKHAND": [23.6102, 85.2799],
    "ODISHA": [20.9517, 85.0985],
    "CHHATTISGARH": [21.2787, 81.8661],
    "MADHYA PRADESH": [22.9734, 78.6569],
    "GUJARAT": [22.2587, 71.1924],
    "DADRA & NAGAR HAVELI AND DAMAN & DIU": [20.1809, 73.0169],
    "MAHARASHTRA": [19.7515, 75.7139],
    "GOA": [15.2993, 74.1240],
    "ANDHRA PRADESH": [15.9129, 79.7400],
    "KARNATAKA": [15.3173, 75.7139],
    "LAKSHADWEEP": [10.0000, 73.0000],
    "KERALA": [10.8505, 76.2711],
    "TAMIL NADU": [11.1271, 78.6569],
    "PUDUCHERRY": [11.9416, 79.8083],
    "ANDAMAN & NICOBAR ISLANDS": [11.7401, 92.6586],
    "TELANGANA": [18.1124, 79.0193]
};

// international country coordinates
export const INTERNATIONAL_COORDINATES = {
    "NEPAL": [28.3949, 84.1240],
    "BANGLADESH": [23.6850, 90.3563],
    "PAKISTAN": [30.3753, 69.3451],
    "SRI LANKA": [7.8731, 80.7718],
    "BHUTAN": [27.5142, 90.4336],
    "AFGANISTAN": [33.9391, 67.7100],
    "MAYANMAR": [19.7633, 96.0785],
    "MALDIVES": [3.2028, 73.2207],
    "CHINA": [35.8617, 104.1954],
    "JAPAN": [36.2048, 138.2529],
    "INDONESIA": [-0.7893, 113.9213],
    "MALAYSIA": [4.2105, 101.9758],
    "SINGAPORE": [1.3521, 103.8198],
    "VIETNAM": [14.0583, 108.2772],
    "IRAN": [32.4279, 53.6880],
    "IRAQ": [33.2232, 43.6793],
    "SAUDI ARABIA": [23.8859, 45.0792],
    "UNITED ARAB EMIRATES": [23.4241, 53.8478],
    "KUWAIT": [29.3117, 47.4818],
    "TURKEY": [38.9637, 35.2433],
    "KAZAKSTAN": [48.0196, 66.9237],
    "UK": [55.3781, -3.4360],
    "FRANCE": [46.6034, 1.8883],
    "GERMANY": [51.1657, 10.4515],
    "PORTUGAL": [39.3999, -8.2245],
    "KENYA": [-0.0236, 37.9062],
    "MAURITIUS": [-20.3484, 57.5522],
    "NIGERIA": [9.0820, 8.6753],
    "UGANDA": [1.3733, 32.2903],
    "ZAMBIA": [-13.1339, 27.8493],
    "CANADA": [56.1304, -106.3468],
    "U.S.A.": [37.0902, -95.7129],
    "AUSTRALIA": [-25.2744, 133.7751],
    "FIJI": [-17.7134, 178.0650]
};

// this function normalizes the state names so they match between csv and geojson
// because the names are written differently in different files
export function normalizeName(name) {
    if (!name) return "";
    let n = name.toUpperCase().trim();

    // remove stuff like (01), (02) etc at the end
    n = n.replace(/\s*\(\d+\)$/, "");

    // remove prefixes like "State - " and "UT - "
    n = n.replace(/^STATE\s*-\s*/, "");
    n = n.replace(/^UT\s*-\s*/, "");
    n = n.trim();

    // some names are written differently in the csv vs geojson
    // this maps them to one standard name
    const mapping = {
        "DELHI": "NCT OF DELHI",
        "NCT OF DELHI": "NCT OF DELHI",
        "ORISSA": "ODISHA",
        "TELENGANA": "TELANGANA",
        "UTTARANCHAL": "UTTARAKHAND",
        "JAMMU AND KASHMIR": "JAMMU & KASHMIR",
        "ANDAMAN AND NICOBAR": "ANDAMAN & NICOBAR ISLANDS",
        "ANDAMAN AND NICOBAR ISLANDS": "ANDAMAN & NICOBAR ISLANDS",
        "ANDAMAN & NICOBAR": "ANDAMAN & NICOBAR ISLANDS",
        "DADRA AND NAGAR HAVELI": "DADRA & NAGAR HAVELI",
        "DAMAN AND DIU": "DAMAN & DIU",
    };

    if (mapping[n]) {
        return mapping[n];
    }
    return n;
}

// this calculates a curved control point for drawing flow lines on the map
// using bezier curves so the lines look nice and dont overlap
export function getBezierPoints(start, end) {
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));

    // offset the control point a little bit so the curve looks good
    const controlPoint = [midLat + (dist * 0.2), midLng + (dist * 0.2)];

    return { control: controlPoint };
}
