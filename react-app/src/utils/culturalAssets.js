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
    { id: 'dance', title: 'Dance' },
    { id: 'dress', title: 'Dress' },
    { id: 'festival', title: 'Festival' },
    { id: 'food', title: 'Food' },
    { id: 'heritage', title: 'Heritage' },
];

function toTitleCase(value) {
    if (!value) return '';
    return String(value)
        .split(/\s+/)
        .filter(Boolean)
        .map(function (token) {
            if (token === '&') return '&';
            return token
                .split('-')
                .map(function (word) {
                    const lower = word.toLowerCase();
                    return lower.charAt(0).toUpperCase() + lower.slice(1);
                })
                .join('-');
        })
        .join(' ');
}

function getCulturalStateFolder(stateName) {
    if (!stateName) return null;
    if (STATE_FOLDER_ALIASES[stateName]) return STATE_FOLDER_ALIASES[stateName];
    return toTitleCase(stateName);
}

function toPublicAssetPath(folderName, fileName) {
    return `/cultural_photos/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;
}

export function getCulturalImageCandidates(stateName, categoryId, preferredImageFile = null) {
    const folderName = getCulturalStateFolder(stateName);
    if (!folderName || !categoryId) return [];

    const candidates = [];

    if (preferredImageFile) {
        candidates.push(toPublicAssetPath(folderName, preferredImageFile));
    }

    for (let i = 0; i < CULTURAL_IMAGE_EXTENSIONS.length; i++) {
        const extension = CULTURAL_IMAGE_EXTENSIONS[i];
        candidates.push(toPublicAssetPath(folderName, `${categoryId}.${extension}`));
    }

    return candidates.filter(function dedupe(value, index, array) {
        return value && array.indexOf(value) === index;
    });
}
