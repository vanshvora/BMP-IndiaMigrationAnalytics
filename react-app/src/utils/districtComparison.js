import { normalizeDistrictName } from './coordinates.js';

export const DISTRICT_DURATION_LABELS = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];
export const DISTRICT_DURATION_KEYS = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
export const DISTRICT_REASON_LABELS = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
export const DISTRICT_REASON_KEYS = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];
export const DISTRICT_EDUCATION_LABELS = ['Below Matric', 'Matric to < Graduate', 'Technical Diploma', 'Graduate+', 'Technical Degree'];
export const DISTRICT_EDUCATION_KEYS = ['BelowMatric_Persons', 'MatricToGrad_Persons', 'TechDiploma_Persons', 'Graduate_Persons', 'TechDegree_Persons'];
export const DISTRICT_ACTIVITY_LABELS = ['Main Workers', 'Marginal Workers', 'Non-workers'];
export const DISTRICT_ACTIVITY_KEYS = ['MainWorkers_Persons', 'MarginalWorkers_Persons', 'NonWorkers_Persons'];
export const DISTRICT_MARITAL_LABELS = ['Never Married', 'Currently Married', 'Widowed', 'Separated', 'Divorced'];
export const DISTRICT_MARITAL_KEYS = ['NeverMarried_Persons', 'CurrMarried_Persons', 'Widowed_Persons', 'Separated_Persons', 'Divorced_Persons'];

export function districtKey(district) {
    if (!district) return '';
    return `${district.state || ''}::${normalizeDistrictName(district.district || '')}::${Number(district.districtCode) || 0}`;
}

export function districtsEqual(left, right) {
    if (!left || !right) return false;
    if ((Number(left.districtCode) || 0) > 0 && (Number(right.districtCode) || 0) > 0) {
        return left.state === right.state && Number(left.districtCode) === Number(right.districtCode);
    }
    return left.state === right.state && normalizeDistrictName(left.district) === normalizeDistrictName(right.district);
}

export function selectDistrictForComparison(current, nextDistrict, slot) {
    const districtA = current?.districtA || null;
    const districtB = current?.districtB || null;
    const next = nextDistrict || null;

    if (slot === 'A') {
        if (!next) return { districtA: districtB, districtB: null };
        return { districtA: next, districtB: districtsEqual(next, districtB) ? null : districtB };
    }

    if (slot === 'B') {
        if (!next || districtsEqual(next, districtA)) return { districtA, districtB: null };
        return { districtA, districtB: next };
    }

    if (!next) return { districtA, districtB };
    if (!districtA) return { districtA: next, districtB };
    if (districtsEqual(districtA, next)) return { districtA, districtB };
    if (!districtB) return { districtA, districtB: next };
    if (districtsEqual(districtB, next)) return { districtA, districtB };
    return { districtA: districtB, districtB: next };
}

function rowMatchesDistrict(row, district) {
    if (!row || !district) return false;
    if (row.state !== district.state) return false;
    const rowCode = Number(row.districtCode) || 0;
    const districtCode = Number(district.districtCode) || 0;
    if (rowCode > 0 && districtCode > 0) return rowCode === districtCode;
    return normalizeDistrictName(row.district) === normalizeDistrictName(district.district);
}

function sumKeys(rows, keys) {
    return keys.map(function (key) {
        let total = 0;
        for (let i = 0; i < rows.length; i++) total += Number(rows[i][key]) || 0;
        return total;
    });
}

function findDistrictRow(rows, district) {
    for (let i = 0; i < rows.length; i++) {
        if (rowMatchesDistrict(rows[i], district)) return rows[i];
    }
    return {};
}

export function computeDistrictMetrics({
    district,
    records,
    threshold,
    durationRows,
    reasonRows,
    educationRows,
    activityRows,
    maritalRows,
}) {
    const relevantFlows = [];
    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        if ((Number(row.count) || 0) < threshold) continue;
        if (rowMatchesDistrict(row, district)) relevantFlows.push(row);
    }

    const totalFlow = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.count) || 0); }, 0);
    const totalMale = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.male) || 0); }, 0);
    const totalFemale = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.female) || 0); }, 0);
    const totalRural = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.rural) || 0); }, 0);
    const totalUrban = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.urban) || 0); }, 0);

    const counterpartRows = relevantFlows
        .map(function (row) {
            return { name: row.origin, value: Number(row.count) || 0 };
        })
        .sort(function (a, b) { return b.value - a.value; });

    const matchingDurationRows = durationRows.filter(function (row) { return rowMatchesDistrict(row, district); });
    const matchingReasonRows = reasonRows.filter(function (row) { return rowMatchesDistrict(row, district); });
    const educationRow = findDistrictRow(educationRows, district);
    const activityRow = findDistrictRow(activityRows, district);
    const maritalRow = findDistrictRow(maritalRows, district);

    const literatePersons = Number(educationRow.Literate_Persons) || 0;
    const illiteratePersons = Number(educationRow.Illiterate_Persons) || 0;
    const literacyDenominator = literatePersons + illiteratePersons;

    return {
        district,
        label: district ? `${district.district}, ${district.state}` : 'No district',
        totalFlow,
        totalMale,
        totalFemale,
        totalRural,
        totalUrban,
        femaleShare: totalFlow > 0 ? (totalFemale / totalFlow) * 100 : 0,
        urbanShare: (totalUrban + totalRural) > 0 ? (totalUrban / (totalUrban + totalRural)) * 100 : 0,
        counterpartRows,
        durationTotals: sumKeys(matchingDurationRows, DISTRICT_DURATION_KEYS),
        reasonValues: sumKeys(matchingReasonRows, DISTRICT_REASON_KEYS),
        literatePersons,
        illiteratePersons,
        literacyRate: literacyDenominator > 0 ? (literatePersons / literacyDenominator) * 100 : 0,
        educationValues: DISTRICT_EDUCATION_KEYS.map(function (key) { return Number(educationRow[key]) || 0; }),
        activityValues: DISTRICT_ACTIVITY_KEYS.map(function (key) { return Number(activityRow[key]) || 0; }),
        maritalValues: DISTRICT_MARITAL_KEYS.map(function (key) { return Number(maritalRow[key]) || 0; }),
    };
}
