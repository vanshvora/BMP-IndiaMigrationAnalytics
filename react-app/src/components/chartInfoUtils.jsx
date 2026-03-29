import { formatPercent, getShare } from './dashboardInsights';

export function ChartInfoPopover({ infoId, openInfoId, setOpenInfoId, items }) {
    const isOpen = openInfoId === infoId;

    return (
        <>
            <button
                type="button"
                className="chart-info-btn"
                aria-label="Show chart insights"
                onClick={() => setOpenInfoId(isOpen ? null : infoId)}
            >
                <i className="pi pi-info-circle" aria-hidden="true" />
            </button>
            {isOpen ? (
                <div className="chart-info-popover">
                    <div className="chart-info-head">
                        <span>Chart Insights</span>
                        <button type="button" className="chart-info-close" aria-label="Close chart insights" onClick={() => setOpenInfoId(null)}>
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                    </div>
                    <ul className="chart-info-list">
                        {items.map(function (item) {
                            return <li key={item}>{item}</li>;
                        })}
                    </ul>
                </div>
            ) : null}
        </>
    );
}

export function sumNumericValues(values) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;
    return total;
}

function getTopEntries(labels, values, count = 2) {
    return labels
        .map(function (label, index) {
            return { label: label, value: Number(values[index]) || 0 };
        })
        .sort(function (a, b) { return b.value - a.value; })
        .slice(0, count);
}

function formatInsightShare(value, total) {
    return formatPercent(getShare(value, total));
}

function describeConcentration(topShare) {
    if (topShare >= 0.55) return 'highly concentrated';
    if (topShare >= 0.35) return 'moderately concentrated';
    return 'fairly balanced';
}

export function buildDistributionInsights(labels, values, maleValues, femaleValues, noun) {
    const total = sumNumericValues(values);
    if (!total) return ['No chart data is available for the current selection.'];

    const topTwo = getTopEntries(labels, values, 2);
    const leader = topTwo[0];
    const runnerUp = topTwo[1];
    const leaderShare = getShare(leader.value, total);
    const insights = [`${leader.label} leads this ${noun} profile with ${formatInsightShare(leader.value, total)} of records.`];

    if (runnerUp && runnerUp.value > 0 && Math.abs(getShare(leader.value - runnerUp.value, total)) >= 0.04) {
        insights.push(`${runnerUp.label} follows at ${formatInsightShare(runnerUp.value, total)}, ${formatInsightShare(leader.value - runnerUp.value, total)} behind the leader.`);
    }

    if (leaderShare >= 0.38 || leaderShare <= 0.26) {
        insights.push(`${noun.charAt(0).toUpperCase() + noun.slice(1)} is ${describeConcentration(leaderShare)} overall.`);
    }

    if (maleValues && femaleValues) {
        const topMale = getTopEntries(labels, maleValues, 1)[0];
        const topFemale = getTopEntries(labels, femaleValues, 1)[0];
        if (topMale && topFemale) {
            if (topMale.label === topFemale.label && topMale.label !== leader.label) {
                insights.push(`${topMale.label} is the top segment for both men and women.`);
            } else if (topMale.label !== topFemale.label) {
                insights.push(`Men peak in ${topMale.label}, while women peak in ${topFemale.label}.`);
            }
        }
    }

    return insights.slice(0, 4);
}

export function buildComparisonInsights(labels, valuesA, valuesB, noun, stateA, stateB) {
    const totalA = sumNumericValues(valuesA);
    const totalB = sumNumericValues(valuesB);
    if (!totalA && !totalB) return ['No chart data is available for this comparison.'];

    const topA = getTopEntries(labels, valuesA, 1)[0];
    const topB = getTopEntries(labels, valuesB, 1)[0];
    const insights = [];

    if (topA && totalA) {
        insights.push(`${stateA} is led by ${topA.label} at ${formatPercent(getShare(topA.value, totalA))} of its ${noun} profile.`);
    }

    if (topB && totalB) {
        insights.push(`${stateB} is led by ${topB.label} at ${formatPercent(getShare(topB.value, totalB))} of its ${noun} profile.`);
    }

    if (topA && topB && topA.label === topB.label) {
        insights.push(`Both states peak in ${topA.label}, though the overall split can still differ.`);
    } else if (topA && topB) {
        insights.push(`${stateA} and ${stateB} peak in different ${noun} segments.`);
    }

    const leadShareA = topA && totalA ? getShare(topA.value, totalA) : 0;
    const leadShareB = topB && totalB ? getShare(topB.value, totalB) : 0;
    if (Math.abs(leadShareA - leadShareB) >= 0.08) {
        const moreConcentratedState = leadShareA > leadShareB ? stateA : stateB;
        const moreConcentratedShare = leadShareA > leadShareB ? leadShareA : leadShareB;
        insights.push(`${moreConcentratedState} is more ${describeConcentration(moreConcentratedShare)} in this chart.`);
    }

    return insights.slice(0, 4);
}
