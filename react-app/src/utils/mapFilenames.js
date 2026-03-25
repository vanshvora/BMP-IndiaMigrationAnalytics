function sanitizeSegment(name) {
    if (!name) return '';
    return String(name)
        .toUpperCase()
        .replace(/&/g, 'AND')
        .replace(/[^A-Z0-9]+/g, '');
}

function underscoreSegment(name) {
    if (!name) return '';
    return String(name)
        .toUpperCase()
        .replace(/&/g, 'AND')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export function getStateMapCandidates(stateName) {
    const compact = sanitizeSegment(stateName);
    const underscored = underscoreSegment(stateName);

    return [
        `/maps/states/${compact}.png`,
        `/maps/states/${underscored}.png`
    ].filter(function (value, index, array) {
        return value && array.indexOf(value) === index;
    });
}

export function getDistrictMapCandidates(stateName, districtName) {
    const compactState = sanitizeSegment(stateName);
    const compactDistrict = sanitizeSegment(districtName);
    const underscoredState = underscoreSegment(stateName);
    const underscoredDistrict = underscoreSegment(districtName);

    return [
        `/maps/districts/${compactState}_${compactDistrict}.png`,
        `/maps/districts/${compactState}_${underscoredDistrict}.png`,
        `/maps/districts/${underscoredState}_${underscoredDistrict}.png`
    ].filter(function (value, index, array) {
        return value && array.indexOf(value) === index;
    });
}
