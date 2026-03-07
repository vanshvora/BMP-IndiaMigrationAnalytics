// Threshold rules for deterministic insight classification.
// - "balanced" if gap is < 5 percentage points.
// - reason dominance is "strong" if top reason beats second by >= 10 percentage points.
// - corridor concentration: high >= 60%, medium >= 40%, low otherwise.
const BALANCE_GAP_PERCENT = 5;
const STRONG_DOMINANCE_GAP_PERCENT = 10;
const HIGH_CONCENTRATION_TOP3_PERCENT = 60;
const MEDIUM_CONCENTRATION_TOP3_PERCENT = 40;

function sum(values) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;
    return total;
}

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

export function getDominantCategory(items) {
    if (!items || items.length === 0) return null;
    let top = items[0];
    for (let i = 1; i < items.length; i++) {
        if (items[i].value > top.value) top = items[i];
    }
    return top;
}

export function classifyBalance(aShare, bShare, aLabel, bLabel) {
    const diff = Math.abs(aShare - bShare);
    if (diff < BALANCE_GAP_PERCENT) {
        return {
            label: 'Balanced',
            description: `${aLabel} and ${bLabel} shares are near-balanced.`
        };
    }

    if (aShare > bShare) {
        return {
            label: `${aLabel}-dominant`,
            description: `${aLabel} share is higher than ${bLabel}.`
        };
    }

    return {
        label: `${bLabel}-dominant`,
        description: `${bLabel} share is higher than ${aLabel}.`
    };
}

export function getConcentrationLevel(top3Share) {
    if (top3Share >= HIGH_CONCENTRATION_TOP3_PERCENT) return 'High';
    if (top3Share >= MEDIUM_CONCENTRATION_TOP3_PERCENT) return 'Medium';
    return 'Low';
}

export function getStateRankInfo(stateTotalsRows, stateName) {
    if (!stateTotalsRows || stateTotalsRows.length === 0) return null;

    let rank = -1;
    for (let i = 0; i < stateTotalsRows.length; i++) {
        if (stateTotalsRows[i].state === stateName) {
            rank = i + 1;
            break;
        }
    }
    if (rank === -1) return null;

    const totalStates = stateTotalsRows.length;
    const percentile = totalStates === 1
        ? 100
        : ((totalStates - rank) / (totalStates - 1)) * 100;

    let intensity = 'Low';
    if (percentile >= 66) intensity = 'High';
    else if (percentile >= 33) intensity = 'Medium';

    return { rank, totalStates, percentile, intensity };
}

export function getOverviewMetrics({
    stateName,
    flowType,
    totalFlow,
    totalMale,
    totalFemale,
    totalUrban,
    totalRural,
    counterpartRows,
    durationLabels,
    durationTotals,
    stateTotalsRows
}) {
    const topCounterpart = counterpartRows[0] || null;
    const top3 = getTopN(counterpartRows, 3);
    const top3Total = sum(top3.map(function (row) { return row.value; }));
    const top3Share = getShare(top3Total, totalFlow);

    const maleShare = getShare(totalMale, totalFlow);
    const femaleShare = getShare(totalFemale, totalFlow);
    const genderBalance = classifyBalance(maleShare, femaleShare, 'Male', 'Female');

    const urbanRuralTotal = totalUrban + totalRural;
    const urbanShare = getShare(totalUrban, urbanRuralTotal);
    const ruralShare = getShare(totalRural, urbanRuralTotal);
    const urbanBalance = classifyBalance(urbanShare, ruralShare, 'Urban', 'Rural');

    const durationRows = durationLabels.map(function (label, i) {
        return { label: label, value: Number(durationTotals[i]) || 0 };
    });
    const dominantDuration = getDominantCategory(durationRows);

    const rankInfo = getStateRankInfo(stateTotalsRows, stateName);

    return {
        flowType,
        totalFlow,
        topCounterpart,
        top3Share,
        concentrationLevel: getConcentrationLevel(top3Share),
        maleShare,
        femaleShare,
        genderBalance,
        urbanShare,
        ruralShare,
        urbanBalance,
        dominantDuration,
        rankInfo
    };
}

export function getDemographicMetrics({
    ageRows,
    literatePersons,
    illiteratePersons,
    educationRows,
    activityRows,
    maritalRows
}) {
    const ageTotal = sum(ageRows.map(function (row) { return row.value; }));
    const dominantAge = getDominantCategory(ageRows);
    const secondAge = getTopN(ageRows, 2)[1] || null;

    const literacyTotal = literatePersons + illiteratePersons;
    const literateShare = getShare(literatePersons, literacyTotal);
    const illiterateShare = getShare(illiteratePersons, literacyTotal);
    const literacyBalance = classifyBalance(literateShare, illiterateShare, 'Literate', 'Illiterate');

    const dominantEducation = getDominantCategory(educationRows);
    const dominantActivity = getDominantCategory(activityRows);
    const dominantMarital = getDominantCategory(maritalRows);

    return {
        ageTotal,
        dominantAge,
        secondAge,
        literacyTotal,
        literateShare,
        illiterateShare,
        literacyBalance,
        dominantEducation,
        dominantActivity,
        dominantMarital
    };
}

export function getMigrationDriverMetrics({
    reasonRows,
    counterpartRows
}) {
    const sortedReasons = getTopN(reasonRows, reasonRows.length);
    const primaryReason = sortedReasons[0] || null;
    const secondaryReason = sortedReasons[1] || null;
    const reasonTotal = sum(reasonRows.map(function (row) { return row.value; }));

    const primaryShare = getShare(primaryReason?.value || 0, reasonTotal);
    const secondaryShare = getShare(secondaryReason?.value || 0, reasonTotal);
    const reasonGap = primaryShare - secondaryShare;
    const dominanceStrength = reasonGap >= STRONG_DOMINANCE_GAP_PERCENT ? 'Strong' : 'Moderate';

    const topCounterpart = counterpartRows[0] || null;
    const top3Counterparts = getTopN(counterpartRows, 3);
    const corridorTotal = sum(counterpartRows.map(function (row) { return row.value; }));
    const top3Share = getShare(sum(top3Counterparts.map(function (row) { return row.value; })), corridorTotal);
    const concentrationLevel = getConcentrationLevel(top3Share);

    let driverType = 'Mixed-driver migration';
    const primaryLabel = primaryReason?.label || '';
    if (primaryLabel === 'Work' || primaryLabel === 'Business') driverType = 'Work-led migration';
    else if (primaryLabel === 'Marriage') driverType = 'Marriage-led migration';
    else if (primaryLabel === 'Education') driverType = 'Education-led migration';
    else if (primaryLabel === 'With household' || primaryLabel === 'Post-birth') driverType = 'Household-led migration';

    return {
        primaryReason,
        secondaryReason,
        reasonTotal,
        primaryShare,
        secondaryShare,
        reasonGap,
        dominanceStrength,
        topCounterpart,
        top3Share,
        concentrationLevel,
        driverType
    };
}

export function getOverviewInsights(metrics) {
    const counterpartDirection = metrics.flowType === 'inflow' ? 'origin' : 'destination';
    const takeaways = [];
    if (metrics.topCounterpart) {
        takeaways.push(
            `${metrics.topCounterpart.name} is the largest ${counterpartDirection} with ${metrics.topCounterpart.value.toLocaleString()} migrants.`
        );
    }
    takeaways.push(
        `${metrics.genderBalance.label} profile (${formatPercent(metrics.maleShare)} male, ${formatPercent(metrics.femaleShare)} female).`
    );
    if (metrics.dominantDuration) {
        takeaways.push(`Most migrants fall in ${metrics.dominantDuration.label} duration.`);
    }

    const cards = [
        {
            id: 'overview-top-counterpart',
            title: `Top ${counterpartDirection}`,
            tone: 'neutral',
            value: metrics.topCounterpart ? metrics.topCounterpart.name : 'N/A',
            description: metrics.topCounterpart
                ? `${metrics.topCounterpart.value.toLocaleString()} migrants`
                : 'No counterpart data available.'
        },
        {
            id: 'overview-concentration',
            title: 'Top-3 concentration',
            tone: metrics.concentrationLevel === 'High' ? 'warning' : 'neutral',
            value: formatPercent(metrics.top3Share),
            description: `${metrics.concentrationLevel} corridor concentration.`
        },
        {
            id: 'overview-gender',
            title: 'Gender profile',
            tone: 'neutral',
            value: metrics.genderBalance.label,
            description: `${formatPercent(metrics.femaleShare)} female vs ${formatPercent(metrics.maleShare)} male.`
        },
        {
            id: 'overview-rank',
            title: 'Migration intensity',
            tone: metrics.rankInfo?.intensity === 'High' ? 'positive' : 'neutral',
            value: metrics.rankInfo ? metrics.rankInfo.intensity : 'N/A',
            description: metrics.rankInfo
                ? `Rank ${metrics.rankInfo.rank}/${metrics.rankInfo.totalStates} in current mode.`
                : 'Rank unavailable.'
        }
    ];

    return { takeaways, cards };
}

export function getDemographicInsights(metrics) {
    const takeaways = [];
    if (metrics.dominantAge) {
        takeaways.push(`${metrics.dominantAge.label} is the dominant age band.`);
    }
    takeaways.push(`${metrics.literacyBalance.label} profile among migrants.`);
    if (metrics.dominantActivity) {
        takeaways.push(`${metrics.dominantActivity.label} is the leading economic category.`);
    }

    const typicalProfile = {
        age: metrics.dominantAge?.label || 'N/A',
        literacy: metrics.literacyBalance.label,
        education: metrics.dominantEducation?.label || 'N/A',
        activity: metrics.dominantActivity?.label || 'N/A',
        marital: metrics.dominantMarital?.label || 'N/A'
    };

    const cards = [
        {
            id: 'demo-typical-profile',
            title: 'Typical migrant profile',
            tone: 'neutral',
            value: `${typicalProfile.age}, ${typicalProfile.marital}`,
            description: `${typicalProfile.literacy}; education leans ${typicalProfile.education}.`
        },
        {
            id: 'demo-age',
            title: 'Dominant age',
            tone: 'neutral',
            value: metrics.dominantAge ? metrics.dominantAge.label : 'N/A',
            description: metrics.dominantAge
                ? `${formatPercent(getShare(metrics.dominantAge.value, metrics.ageTotal))} of total age records.`
                : 'Age data unavailable.'
        },
        {
            id: 'demo-literacy',
            title: 'Literacy split',
            tone: 'neutral',
            value: metrics.literacyBalance.label,
            description: `${formatPercent(metrics.literateShare)} literate; ${formatPercent(metrics.illiterateShare)} illiterate.`
        },
        {
            id: 'demo-activity',
            title: 'Economic activity',
            tone: 'neutral',
            value: metrics.dominantActivity ? metrics.dominantActivity.label : 'N/A',
            description: metrics.dominantActivity
                ? `Largest share in ${metrics.dominantActivity.label}.`
                : 'Economic activity data unavailable.'
        }
    ];

    return { takeaways, cards, typicalProfile };
}

export function getMigrationDriverInsights(metrics) {
    const takeaways = [];
    if (metrics.primaryReason) {
        takeaways.push(`${metrics.primaryReason.label} is the leading migration reason.`);
    }
    if (metrics.secondaryReason) {
        takeaways.push(`${metrics.secondaryReason.label} is the second-largest reason.`);
    }
    takeaways.push(`Top 3 corridors contribute ${formatPercent(metrics.top3Share)} of tracked flows.`);

    const cards = [
        {
            id: 'driver-primary',
            title: 'Primary driver',
            tone: 'neutral',
            value: metrics.primaryReason ? metrics.primaryReason.label : 'N/A',
            description: metrics.primaryReason
                ? `${formatPercent(metrics.primaryShare)} share of total recorded reasons.`
                : 'Reason data unavailable.'
        },
        {
            id: 'driver-secondary',
            title: 'Secondary driver',
            tone: 'neutral',
            value: metrics.secondaryReason ? metrics.secondaryReason.label : 'N/A',
            description: metrics.secondaryReason
                ? `${formatPercent(metrics.secondaryShare)} share.`
                : 'Secondary reason unavailable.'
        },
        {
            id: 'driver-type',
            title: 'Driver pattern',
            tone: 'neutral',
            value: metrics.driverType,
            description: `${metrics.dominanceStrength} dominance gap between top 2 reasons.`
        },
        {
            id: 'driver-corridor',
            title: 'Corridor concentration',
            tone: metrics.concentrationLevel === 'High' ? 'warning' : 'neutral',
            value: metrics.concentrationLevel,
            description: `Top-3 corridors at ${formatPercent(metrics.top3Share)}.`
        }
    ];

    return { takeaways, cards };
}

export function getCounterpartDrilldown(counterpartRows, selectedIndex, totalFlow, flowType) {
    if (!counterpartRows || counterpartRows.length === 0) return null;
    const safeIndex = Math.min(Math.max(selectedIndex, 0), counterpartRows.length - 1);
    const item = counterpartRows[safeIndex];
    const share = getShare(item.value, totalFlow);
    const direction = flowType === 'inflow' ? 'origin to the selected state' : 'destination from the selected state';
    return {
        title: item.name,
        value: item.value.toLocaleString(),
        rank: safeIndex + 1,
        share: formatPercent(share),
        description: `${item.name} ranks #${safeIndex + 1} and contributes ${formatPercent(share)} of tracked ${direction}.`
    };
}

export function getReasonDrilldown(reasonRows, selectedIndex) {
    if (!reasonRows || reasonRows.length === 0) return null;
    const total = sum(reasonRows.map(function (row) { return row.value; }));
    const safeIndex = Math.min(Math.max(selectedIndex, 0), reasonRows.length - 1);
    const current = reasonRows[safeIndex];
    const sorted = getTopN(reasonRows, reasonRows.length);

    let rank = sorted.findIndex(function (row) { return row.label === current.label; }) + 1;
    if (rank <= 0) rank = sorted.length;
    let tier = 'Minor';
    if (rank === 1) tier = 'Primary';
    else if (rank === 2) tier = 'Secondary';

    return {
        title: current.label,
        value: current.value.toLocaleString(),
        rank: rank,
        share: formatPercent(getShare(current.value, total)),
        description: `${current.label} is a ${tier.toLowerCase()} migration driver in this profile.`
    };
}

export function getAgeDrilldown(ageRows, selectedIndex) {
    if (!ageRows || ageRows.length === 0) return null;
    const total = sum(ageRows.map(function (row) { return row.value; }));
    const safeIndex = Math.min(Math.max(selectedIndex, 0), ageRows.length - 1);
    const current = ageRows[safeIndex];
    const dominant = getDominantCategory(ageRows);
    const isDominant = dominant && dominant.label === current.label;

    return {
        title: current.label,
        value: current.value.toLocaleString(),
        share: formatPercent(getShare(current.value, total)),
        rank: isDominant ? 1 : null,
        description: isDominant
            ? `${current.label} is the dominant age segment in this selected profile.`
            : `${current.label} is a secondary age segment in this selected profile.`
    };
}

export function getActivityDrilldown(activityRows, selectedIndex) {
    if (!activityRows || activityRows.length === 0) return null;
    const total = sum(activityRows.map(function (row) { return row.value; }));
    const safeIndex = Math.min(Math.max(selectedIndex, 0), activityRows.length - 1);
    const current = activityRows[safeIndex];

    return {
        title: current.label,
        value: current.value.toLocaleString(),
        share: formatPercent(getShare(current.value, total)),
        rank: safeIndex + 1,
        description: `${current.label} contributes ${formatPercent(getShare(current.value, total))} of the classified economic activity mix.`
    };
}

