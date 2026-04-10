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

const STATE_ALIASES = {
    'ANDAMANANDNICOBARISLANDS': ['ANDAMAN & NICOBAR'],
};

const DISTRICT_ALIASES = {
    'NICOBARS': ['NICOBAR ISLANDS'],
    'SRIPOTTISRIRAMULUNELLORE': ['NELLORE'],
    'KAIMURBHABUA': ['KAIMUR'],
    'DAKSHINBASTARDANTEWADA': ['DANTEWADA'],
    'DOHAD': ['DAHOD'],
    'BARAMULA': ['BARAMULLA'],
    'LEHLADAKH': ['LEH'],
    'PUNCH': ['POONCH'],
    'BANGALORE': ['BENGALURU'],
    'CHAMARAJANAGAR': ['CHAMRAJNAGAR'],
    'CHIKKABALLAPURA': ['CHIKBALLAPURA'],
    'KHANDWAEASTNIMAR': ['EAST NIMAR'],
    'KHARGONEWESTNIMAR': ['WEST NIMAR'],
    'GADCHIROLI': ['GARHCHIROLI'],
    'MUMBAI': ['MUMBAI CITY'],
    'LAWNGTLAI': ['LAWANGTLAI'],
    'BAUDH': ['BAUDA'],
    'EASTDISTRICT': ['EAST SIKKIM'],
    'NORTHDISTRICT': ['NORTH SIKKIM'],
    'SOUTHDISTRICT': ['SOUTH SIKKIM'],
    'WESTDISTRICT': ['WEST SIKKIM'],
    'NAGAPATTINAM': ['NAGAPPATTINAM'],
    'VIRUDHUNAGAR': ['VIRUDUNAGAR'],
    'JYOTIBAPHULENAGAR': ['AMROHA'],
    'KANSHIRAMNAGAR': ['KASGANJ'],
    'KHERI': ['LAKHIMPUR KHERI'],
    'MAHAMAYANAGAR': ['HATHRAS'],
    'MAHRAJGANJ': ['MAHARAJGANJ'],
    'SANTRAVIDASNAGARBHADOHI': ['SANT RAVIDAS NAGAR'],
    'SHRAWASTI': ['SHRAVASTI'],
    'NORTHTWENTYFOURPARGANAS': ['NORTH 24 PARGANAS'],
    'PASCHIMMEDINIPUR': ['PASHCHIM MEDINIPUR'],
    'SOUTHTWENTYFOURPARGANAS': ['SOUTH 24 PARGANAS'],
};

function withAliases(name, aliasesByCompactKey) {
    const names = [name];
    const aliases = aliasesByCompactKey[sanitizeSegment(name)] || [];
    for (let i = 0; i < aliases.length; i++) names.push(aliases[i]);
    return names;
}

export function getStateMapCandidates(stateName) {
    const stateNames = withAliases(stateName, STATE_ALIASES);
    const candidates = [];

    for (let i = 0; i < stateNames.length; i++) {
        const compact = sanitizeSegment(stateNames[i]);
        const underscored = underscoreSegment(stateNames[i]);
        candidates.push(`/maps/states/${compact}.png`);
        candidates.push(`/maps/states/${underscored}.png`);
    }

    return candidates.filter(function (value, index, array) {
        return value && array.indexOf(value) === index;
    });
}

export function getDistrictMapCandidates(stateName, districtName) {
    const stateNames = withAliases(stateName, STATE_ALIASES);
    const districtNames = withAliases(districtName, DISTRICT_ALIASES);
    const candidates = [];

    for (let i = 0; i < stateNames.length; i++) {
        const compactState = sanitizeSegment(stateNames[i]);
        const underscoredState = underscoreSegment(stateNames[i]);
        for (let j = 0; j < districtNames.length; j++) {
            const compactDistrict = sanitizeSegment(districtNames[j]);
            const underscoredDistrict = underscoreSegment(districtNames[j]);
            candidates.push(`/maps/districts/${compactState}_${compactDistrict}.png`);
            candidates.push(`/maps/districts/${compactState}_${underscoredDistrict}.png`);
            candidates.push(`/maps/districts/${underscoredState}_${underscoredDistrict}.png`);
        }
    }

    const stateFallbacks = getStateMapCandidates(stateName);
    for (let i = 0; i < stateFallbacks.length; i++) candidates.push(stateFallbacks[i]);

    return candidates.filter(function (value, index, array) {
        return value && array.indexOf(value) === index;
    });
}
