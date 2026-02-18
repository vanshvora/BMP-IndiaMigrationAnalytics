// Coordinates for Indian states
export const INDIAN_STATES_NORM = [
    "JAMMU & KASHMIR", "HIMACHAL PRADESH", "PUNJAB", "CHANDIGARH", "UTTARAKHAND",
    "HARYANA", "NCT OF DELHI", "RAJASTHAN", "UTTAR PRADESH", "BIHAR", "SIKKIM",
    "ARUNACHAL PRADESH", "NAGALAND", "MANIPUR", "MIZORAM", "TRIPURA", "MEGHALAYA",
    "ASSAM", "WEST BENGAL", "JHARKHAND", "ODISHA", "CHHATTISGARH", "MADHYA PRADESH",
    "GUJARAT", "DAMAN & DIU", "DADRA & NAGAR HAVELI", "MAHARASHTRA", "ANDHRA PRADESH",
    "KARNATAKA", "GOA", "LAKSHADWEEP", "KERALA", "TAMIL NADU", "PUDUCHERRY",
    "ANDAMAN & NICOBAR ISLANDS", "TELANGANA"
];

export const COORDINATES = {
    "JAMMU & KASHMIR": [34.0837, 74.7973],
    "HIMACHAL PRADESH": [31.1048, 77.1734],
    "PUNJAB": [30.7333, 76.7794],
    "CHANDIGARH": [30.7333, 76.7794],
    "UTTARAKHAND": [30.3165, 78.0322],
    "HARYANA": [29.0588, 76.0856],
    "NCT OF DELHI": [28.6139, 77.2090],
    "RAJASTHAN": [26.9124, 75.7873],
    "UTTAR PRADESH": [26.8467, 80.9462],
    "BIHAR": [25.5941, 85.1376],
    "SIKKIM": [27.3314, 88.6138],
    "ARUNACHAL PRADESH": [27.0844, 93.6053],
    "NAGALAND": [25.6701, 94.1077],
    "MANIPUR": [24.8170, 93.9368],
    "MIZORAM": [23.7271, 92.7176],
    "TRIPURA": [23.8315, 91.2868],
    "MEGHALAYA": [25.5788, 91.8933],
    "ASSAM": [26.1158, 91.7086],
    "WEST BENGAL": [22.5726, 88.3639],
    "JHARKHAND": [23.3441, 85.3096],
    "ODISHA": [20.2961, 85.8245],
    "CHHATTISGARH": [21.2514, 81.6296],
    "MADHYA PRADESH": [23.2599, 77.4126],
    "GUJARAT": [23.0225, 72.5714],
    "DAMAN & DIU": [20.4283, 72.8397],
    "DADRA & NAGAR HAVELI": [20.2762, 73.0083],
    "MAHARASHTRA": [19.7515, 75.7139],
    "GOA": [15.4909, 73.8278],
    "ANDHRA PRADESH": [15.9129, 79.7400],
    "KARNATAKA": [15.3173, 75.7139],
    "LAKSHADWEEP": [10.5667, 72.6417],
    "KERALA": [10.8505, 76.2711],
    "TAMIL NADU": [11.1271, 78.6569],
    "PUDUCHERRY": [11.9416, 79.8083],
    "ANDAMAN & NICOBAR ISLANDS": [11.6234, 92.7265],
    "TELANGANA": [18.1124, 79.0193]
};

// international countries - got these from google maps
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

// normalize state names to match between csv and geojson
export function normalizeName(name) {
    if (!name) return "";
    let n = name.toUpperCase().trim();
    n = n.replace(/\s*\(\d+\)$/, ""); // remove codes like (01)
    n = n.replace(/^STATE\s*-\s*/, ""); // remove "State - " prefix
    n = n.replace(/^UT\s*-\s*/, ""); // remove "UT - " prefix
    n = n.trim();

    // mapping for different name formats
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

    return mapping[n] || n;
}

// calculate bezier curve control point for flow lines
export function getBezierPoints(start, end) {
    const midLat = (start[0] + end[0]) / 2;
    const midLng = (start[1] + end[1]) / 2;
    const dist = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    return {
        control: [midLat + (dist * 0.2), midLng + (dist * 0.2)]
    };
}
