const TITLE_WORD_OVERRIDES = {
    nct: 'NCT',
};

const STATE_DISPLAY_ALIASES = {
    'NCT OF DELHI': 'Delhi',
    'JAMMU & KASHMIR': 'Jammu and Kashmir',
    'ANDAMAN & NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
    'DADRA & NAGAR HAVELI': 'Dadra and Nagar Haveli',
    'DAMAN & DIU': 'Daman and Diu',
    'DADRA & NAGAR HAVELI AND DAMAN & DIU': 'Dadra and Nagar Haveli and Daman and Diu',
};

const STATE_FOLDER_ALIASES = {
    'NCT OF DELHI': 'Delhi',
    'JAMMU & KASHMIR': 'Jammu and Kashmir',
    'ANDAMAN & NICOBAR ISLANDS': 'Andaman and Nicobar',
    'DADRA & NAGAR HAVELI': 'Dadra and Nagar Haveli and Daman and Diu',
    'DAMAN & DIU': 'Dadra and Nagar Haveli and Daman and Diu',
    'DADRA & NAGAR HAVELI AND DAMAN & DIU': 'Dadra and Nagar Haveli and Daman and Diu',
};

const CULTURAL_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const CULTURAL_CATEGORIES = [
    {
        id: 'dance',
        title: 'Dance',
        noteLabel: 'Signature Form',
    },
    {
        id: 'dress',
        title: 'Dress',
        noteLabel: 'Key Garment',
    },
    {
        id: 'festival',
        title: 'Festival',
        noteLabel: 'Celebration Context',
    },
    {
        id: 'food',
        title: 'Food',
        noteLabel: 'Dish Note',
    },
    {
        id: 'heritage',
        title: 'Heritage',
        noteLabel: 'Heritage Note',
    },
];

function titleCaseWord(word) {
    const normalized = word.toLowerCase();
    if (TITLE_WORD_OVERRIDES[normalized]) return TITLE_WORD_OVERRIDES[normalized];
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toTitleCase(value) {
    if (!value) return '';
    return String(value)
        .split(/\s+/)
        .filter(Boolean)
        .map(function formatToken(token) {
            if (token === '&') return '&';
            return token
                .split('-')
                .map(titleCaseWord)
                .join('-');
        })
        .join(' ');
}

export function getCulturalStateDisplayName(stateName) {
    if (!stateName) return '';
    if (STATE_DISPLAY_ALIASES[stateName]) return STATE_DISPLAY_ALIASES[stateName];
    return toTitleCase(stateName);
}

export function getCulturalStateFolder(stateName) {
    if (!stateName) return null;
    if (STATE_FOLDER_ALIASES[stateName]) return STATE_FOLDER_ALIASES[stateName];
    return toTitleCase(stateName);
}

function toPublicAssetPath(folderName, fileName) {
    return `/cultural_photos/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;
}

export function getCulturalImageCandidates(stateName, categoryId) {
    const folderName = getCulturalStateFolder(stateName);
    if (!folderName || !categoryId) return [];

    return CULTURAL_IMAGE_EXTENSIONS.map(function toCandidate(extension) {
        return toPublicAssetPath(folderName, `${categoryId}.${extension}`);
    });
}
