export function getShare(part, total) {
    if (!total) return 0;
    return (Number(part) / Number(total)) * 100;
}

export function formatPercent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
}

export function getTopN(items, n) {
    return [...items].sort(function (a, b) { return b.value - a.value; }).slice(0, n);
}
