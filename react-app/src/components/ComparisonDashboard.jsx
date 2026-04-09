import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import { loadCsv } from '../utils/loadCsv';
import { buildComparisonInsights, ChartInfoPopover, sumNumericValues } from './chartInfoUtils';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import ComparisonHeader from './ComparisonHeader';
import './DataSection.css';
import './ComparisonDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, chartValueLabelPlugin);
ChartJS.defaults.datasets.bar.categoryPercentage = 1.0;
ChartJS.defaults.datasets.bar.barPercentage = 1.0;

const COUNTERPART_COLORS = ['#2563eb', '#f97316'];
const AGE_COLORS = ['#0f766e', '#7c3aed'];
const EDUCATION_COLORS = ['#16a34a', '#b45309'];
const ACTIVITY_COLORS = ['#0891b2', '#f59e0b'];
const MARITAL_COLORS = ['#7c3aed', '#d97706'];
const REASON_COLORS = ['#0f766e', '#d97706'];

const REASON_LABELS = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
const REASON_KEYS = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];

const AGE_LABELS = ['Children (0-14)', 'Youth (15-29)', 'Working Age (30-59)', 'Elderly (60+)', 'Not stated'];
const CHILDREN_AGE_KEYS = ['Persons_0to4', 'Persons_5to9', 'Persons_10to14'];
const YOUTH_AGE_KEYS = ['Persons_15to19', 'Persons_20to24', 'Persons_25to29'];
const WORKING_AGE_KEYS = ['Persons_30to34', 'Persons_35to39', 'Persons_40to44', 'Persons_45to49', 'Persons_50to54', 'Persons_55to59'];
const ELDERLY_AGE_KEYS = ['Persons_60to64', 'Persons_65to69', 'Persons_70to74', 'Persons_75to79', 'Persons_80plus'];

const EDUCATION_LABELS = ['Below Matric', 'Matric to < Graduate', 'Technical Diploma', 'Graduate+', 'Technical Degree'];
const EDUCATION_KEYS = ['BelowMatric_Persons', 'MatricToGrad_Persons', 'TechDiploma_Persons', 'Graduate_Persons', 'TechDegree_Persons'];

const ACTIVITY_LABELS = ['Main Workers', 'Marginal Workers', 'Non-workers'];
const ACTIVITY_KEYS = ['MainWorkers_Persons', 'MarginalWorkers_Persons', 'NonWorkers_Persons'];

const MARITAL_LABELS = ['Never Married', 'Currently Married', 'Widowed', 'Separated', 'Divorced'];
const MARITAL_KEYS = ['NeverMarried_Persons', 'CurrMarried_Persons', 'Widowed_Persons', 'Separated_Persons', 'Divorced_Persons'];

const COUNTERPART_LIMIT_VOLUME = 6;
const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true }
    },
    animation: false
};

function sumColumns(row, keys) {
    let total = 0;
    for (let i = 0; i < keys.length; i++) total += Number(row[keys[i]]) || 0;
    return total;
}

function toCounterpartRows(flows, flowType) {
    const map = {};
    for (let i = 0; i < flows.length; i++) {
        const key = flowType === 'inflow' ? flows[i].origin : flows[i].destination;
        map[key] = (map[key] || 0) + (Number(flows[i].count) || 0);
    }

    return Object.entries(map).map(function (entry) {
        return { name: entry[0], value: entry[1] };
    }).sort(function (a, b) { return b.value - a.value; });
}

function getComparisonSentence(metricLabel, stateA, valueA, stateB, valueB, formatter, tieTolerance) {
    const diff = Math.abs(valueA - valueB);
    if (diff <= tieTolerance) {
        return `${metricLabel}: ${stateA} and ${stateB} are nearly tied.`;
    }

    if (valueA > valueB) {
        return `${metricLabel}: ${stateA} leads (${formatter(valueA)} vs ${formatter(valueB)}).`;
    }

    return `${metricLabel}: ${stateB} leads (${formatter(valueB)} vs ${formatter(valueA)}).`;
}

function ComparisonSummaryCard({ title, value, detail }) {
    return (
        <div className="card comparison-summary-card">
            <p className="summary-label">{title}</p>
            <p className="summary-value">{value}</p>
            <p className="summary-detail">{detail}</p>
        </div>
    );
}

function ComparisonInsightCard({ title, accentClass, lead, items }) {
    return (
        <div className={`card comparison-insight-card ${accentClass}`}>
            <h3 className="card-title">{title}</h3>
            <p className="comparison-insight-lead">{lead}</p>
            <div className="comparison-insight-grid">
                {items.map(function (item) {
                    return (
                        <div className="comparison-insight-stat" key={item.label}>
                            <span className="comparison-insight-stat-label">{item.label}</span>
                            <strong className="comparison-insight-stat-value">{item.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ComparisonDashboard({ flows, flowType, threshold, stateA, stateB }) {
    const [openInfoId, setOpenInfoId] = useState(null);
    const [d02Data, setD02Data] = useState([]);
    const [d03Data, setD03Data] = useState([]);
    const [d12Data, setD12Data] = useState([]);
    const [d04Data, setD04Data] = useState([]);
    const [d06Data, setD06Data] = useState([]);
    const [d10Data, setD10Data] = useState([]);

    useEffect(function () {
        loadCsv('/D02_cleaned.csv', function (row) {
            return { ...row, AreaName: normalizeName(row.AreaName), Origin: normalizeName(row.Origin || row.LastResidence) };
        }, setD02Data, function (err) { console.error('D02 fetch error:', err); }, Papa);

        loadCsv('/D03_cleaned.csv', function (row) {
            return { ...row, AreaName: normalizeName(row.AreaName), Origin: normalizeName(row.Origin || row.LastResidence) };
        }, setD03Data, function (err) { console.error('D03 fetch error:', err); }, Papa);

        loadCsv('/D12_cleaned.csv', function (row) {
            const area = normalizeName(row.AreaName);
            const origin = normalizeName(row.Origin || row.LastResidence);
            if (!INDIAN_STATES_NORM.includes(area)) return null;
            if (!INDIAN_STATES_NORM.includes(origin)) return null;
            return { ...row, AreaName: area, Origin: origin };
        }, setD12Data, function (err) { console.error('D12 fetch error:', err); }, Papa);

        loadCsv('/D04_cleaned.csv', function (row) {
            const area = normalizeName(row.AreaName);
            if (area === 'INDIA') return null;
            if (!INDIAN_STATES_NORM.includes(area)) return null;
            return { ...row, AreaName: area };
        }, setD04Data, function (err) { console.error('D04 fetch error:', err); }, Papa);

        loadCsv('/D06_cleaned.csv', function (row) {
            const area = normalizeName(row.AreaName);
            if (!INDIAN_STATES_NORM.includes(area)) return null;
            return { ...row, AreaName: area };
        }, setD06Data, function (err) { console.error('D06 fetch error:', err); }, Papa);

        loadCsv('/D10_cleaned.csv', function (row) {
            const area = normalizeName(row.AreaName);
            if (!INDIAN_STATES_NORM.includes(area)) return null;
            return { ...row, AreaName: area };
        }, setD10Data, function (err) { console.error('D10 fetch error:', err); }, Papa);
    }, []);

    function rowMatchesFlowState(row, stateName) {
        if (!row) return false;
        return flowType === 'inflow' ? row.AreaName === stateName : row.Origin === stateName;
    }

    function rowMatchesFlowStateD12(row, stateName) {
        if (!row) return false;
        if (row.AreaName === row.Origin) return false;
        return flowType === 'inflow' ? row.AreaName === stateName : row.Origin === stateName;
    }

    function computeStateMetrics(stateName) {
        const relevantFlows = [];
        for (let i = 0; i < flows.length; i++) {
            const row = flows[i];
            if (row.count < threshold) continue;
            if (flowType === 'inflow' && row.destination !== stateName) continue;
            if (flowType === 'outflow' && row.origin !== stateName) continue;
            relevantFlows.push(row);
        }

        const totalFlow = sumNumericValues(relevantFlows.map(function (row) { return row.count; }));
        const totalMale = sumNumericValues(relevantFlows.map(function (row) { return row.male; }));
        const totalFemale = sumNumericValues(relevantFlows.map(function (row) { return row.female; }));
        const totalUrban = sumNumericValues(relevantFlows.map(function (row) { return row.urban; }));
        const totalRural = sumNumericValues(relevantFlows.map(function (row) { return row.rural; }));
        const femaleShare = getShare(totalFemale, totalFlow);
        const urbanShare = getShare(totalUrban, totalUrban + totalRural);

        const counterpartRows = toCounterpartRows(relevantFlows, flowType);
        const durationLabels = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];
        const durationKeys = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
        const durationTotals = durationKeys.map(function (key) {
            let total = 0;
            for (let i = 0; i < d02Data.length; i++) {
                if (!rowMatchesFlowState(d02Data[i], stateName)) continue;
                total += Number(d02Data[i][key]) || 0;
            }
            return total;
        });

        const reasonTotals = REASON_KEYS.map(function (key) {
            let total = 0;
            for (let i = 0; i < d03Data.length; i++) {
                if (!rowMatchesFlowState(d03Data[i], stateName)) continue;
                total += Number(d03Data[i][key]) || 0;
            }
            return total;
        });
        const reasonTotal = sumNumericValues(reasonTotals);
        const reasonRows = REASON_LABELS.map(function (label, i) {
            return { label: label, value: reasonTotals[i] };
        });
        const reasonShares = {};
        for (let i = 0; i < REASON_LABELS.length; i++) {
            reasonShares[REASON_LABELS[i]] = getShare(reasonTotals[i], reasonTotal);
        }

        const ageTotals = [0, 0, 0, 0, 0];
        for (let i = 0; i < d12Data.length; i++) {
            if (!rowMatchesFlowStateD12(d12Data[i], stateName)) continue;
            ageTotals[0] += sumColumns(d12Data[i], CHILDREN_AGE_KEYS);
            ageTotals[1] += sumColumns(d12Data[i], YOUTH_AGE_KEYS);
            ageTotals[2] += sumColumns(d12Data[i], WORKING_AGE_KEYS);
            ageTotals[3] += sumColumns(d12Data[i], ELDERLY_AGE_KEYS);
            ageTotals[4] += Number(d12Data[i].Persons_AgeNS) || 0;
        }

        const educationRow = d04Data.find(function (row) { return row.AreaName === stateName; }) || {};
        const literatePersons = Number(educationRow.Literate_Persons) || 0;
        const illiteratePersons = Number(educationRow.Illiterate_Persons) || 0;
        const educationValues = EDUCATION_KEYS.map(function (key) { return Number(educationRow[key]) || 0; });

        const activityRow = d06Data.find(function (row) { return row.AreaName === stateName; }) || {};
        const activityValues = ACTIVITY_KEYS.map(function (key) { return Number(activityRow[key]) || 0; });

        const maritalRow = d10Data.find(function (row) { return row.AreaName === stateName; }) || {};
        const maritalValues = MARITAL_KEYS.map(function (key) { return Number(maritalRow[key]) || 0; });

        return {
            stateName,
            totalFlow,
            totalMale,
            totalFemale,
            totalUrban,
            totalRural,
            femaleShare,
            urbanShare,
            counterpartRows,
            durationLabels,
            durationTotals,
            reasonRows,
            reasonShares,
            ageTotals,
            literatePersons,
            illiteratePersons,
            literacyRate: getShare(literatePersons, literatePersons + illiteratePersons),
            educationValues,
            activityValues,
            maritalValues
        };
    }

    if (stateA === 'TELANGANA' || stateB === 'TELANGANA') {
        return (
            <div className="warning">
                <h2 className="warning-title">Cannot Compare with TELANGANA</h2>
                <div className="warning-box">
                    <p className="warning-bold">Comparison Not Available</p>
                    <p className="warning-msg">Telangana was formed in June 2014. This dashboard uses Census 2011 datasets, so Telangana cannot be used in comparison mode.</p>
                </div>
            </div>
        );
    }

    const stateAMetrics = useMemo(function () {
        return computeStateMetrics(stateA);
    }, [stateA, flows, flowType, threshold, d02Data, d03Data, d12Data, d04Data, d06Data, d10Data]);
    const stateBMetrics = useMemo(function () {
        return computeStateMetrics(stateB);
    }, [stateB, flows, flowType, threshold, d02Data, d03Data, d12Data, d04Data, d06Data, d10Data]);

    const counterpartAxisTitle = flowType === 'inflow' ? 'Top Origins' : 'Top Destinations';
    const stateATopCounterparts = getTopN(stateAMetrics.counterpartRows, COUNTERPART_LIMIT_VOLUME);
    const stateBTopCounterparts = getTopN(stateBMetrics.counterpartRows, COUNTERPART_LIMIT_VOLUME);
    const mergedCounterpartLabels = Array.from(new Set(
        stateATopCounterparts.concat(stateBTopCounterparts).map(function (row) { return row.name; })
    ));
    const stateATopCounterpart = stateAMetrics.counterpartRows[0] || null;
    const stateBTopCounterpart = stateBMetrics.counterpartRows[0] || null;
    const stateALeadingReason = getTopN(stateAMetrics.reasonRows, 1)[0] || null;
    const stateBLeadingReason = getTopN(stateBMetrics.reasonRows, 1)[0] || null;
    const stateAReasonTotal = sumNumericValues(stateAMetrics.reasonRows.map(function (row) { return row.value; }));
    const stateBReasonTotal = sumNumericValues(stateBMetrics.reasonRows.map(function (row) { return row.value; }));
    const flowLeader = stateAMetrics.totalFlow >= stateBMetrics.totalFlow ? stateA : stateB;
    const flowLeaderValue = stateAMetrics.totalFlow >= stateBMetrics.totalFlow ? stateAMetrics.totalFlow : stateBMetrics.totalFlow;
    const flowGap = Math.abs(stateAMetrics.totalFlow - stateBMetrics.totalFlow);
    const literacyLeader = stateAMetrics.literacyRate >= stateBMetrics.literacyRate ? stateA : stateB;
    const literacyLeaderValue = stateAMetrics.literacyRate >= stateBMetrics.literacyRate ? stateAMetrics.literacyRate : stateBMetrics.literacyRate;
    const urbanLeader = stateAMetrics.urbanShare >= stateBMetrics.urbanShare ? stateA : stateB;
    const urbanLeaderValue = stateAMetrics.urbanShare >= stateBMetrics.urbanShare ? stateAMetrics.urbanShare : stateBMetrics.urbanShare;
    const femaleLeader = stateAMetrics.femaleShare >= stateBMetrics.femaleShare ? stateA : stateB;
    const femaleLeaderValue = stateAMetrics.femaleShare >= stateBMetrics.femaleShare ? stateAMetrics.femaleShare : stateBMetrics.femaleShare;
    const ageInfoItems = buildComparisonInsights(AGE_LABELS, stateAMetrics.ageTotals, stateBMetrics.ageTotals, 'age', stateA, stateB);
    const durationInfoItems = buildComparisonInsights(stateAMetrics.durationLabels, stateAMetrics.durationTotals, stateBMetrics.durationTotals, 'duration', stateA, stateB);
    const educationInfoItems = buildComparisonInsights(EDUCATION_LABELS, stateAMetrics.educationValues, stateBMetrics.educationValues, 'education', stateA, stateB);
    const activityInfoItems = buildComparisonInsights(ACTIVITY_LABELS, stateAMetrics.activityValues, stateBMetrics.activityValues, 'economic activity', stateA, stateB);
    const reasonInfoItems = buildComparisonInsights(REASON_LABELS, stateAMetrics.reasonRows.map(function (row) { return row.value; }), stateBMetrics.reasonRows.map(function (row) { return row.value; }), 'migration reason', stateA, stateB);
    const maritalInfoItems = buildComparisonInsights(MARITAL_LABELS, stateAMetrics.maritalValues, stateBMetrics.maritalValues, 'marital status', stateA, stateB);

    return (
        <div className="wrapper comparison-dashboard">
            <ComparisonHeader
                stateA={stateA}
                stateB={stateB}
                flowType={flowType}
                totalFlowA={stateAMetrics.totalFlow}
                totalFlowB={stateBMetrics.totalFlow}
            />

            <section className="comparison-grid comparison-summary-grid">
                <ComparisonSummaryCard
                    title="Higher migration volume"
                    value={flowLeader}
                    detail={`${flowLeaderValue.toLocaleString()} migrants, gap of ${flowGap.toLocaleString()}`}
                />
                <ComparisonSummaryCard
                    title="Stronger literacy profile"
                    value={literacyLeader}
                    detail={`${formatPercent(literacyLeaderValue)} literate migrants`}
                />
                <ComparisonSummaryCard
                    title="More urban profile"
                    value={urbanLeader}
                    detail={`${formatPercent(urbanLeaderValue)} urban share`}
                />
                <ComparisonSummaryCard
                    title="Higher female share"
                    value={femaleLeader}
                    detail={`${formatPercent(femaleLeaderValue)} female share`}
                />
            </section>

            <section className="comparison-section">
                <ComparisonInsightCard
                    title="Insights"
                    accentClass="comparison-insight-primary"
                    lead={getComparisonSentence(
                        'Migration volume',
                        stateA,
                        stateAMetrics.totalFlow,
                        stateB,
                        stateBMetrics.totalFlow,
                        function (value) { return Number(value).toLocaleString(); },
                        0
                    )}
                    items={[
                        { label: `${stateA} top ${flowType === 'inflow' ? 'origin' : 'destination'}`, value: stateATopCounterpart ? stateATopCounterpart.name : 'No data' },
                        { label: `${stateB} top ${flowType === 'inflow' ? 'origin' : 'destination'}`, value: stateBTopCounterpart ? stateBTopCounterpart.name : 'No data' },
                        { label: `${stateA} leading reason`, value: stateALeadingReason ? `${stateALeadingReason.label} | ${formatPercent(getShare(stateALeadingReason.value, stateAReasonTotal))}` : 'No data' },
                        { label: `${stateB} leading reason`, value: stateBLeadingReason ? `${stateBLeadingReason.label} | ${formatPercent(getShare(stateBLeadingReason.value, stateBReasonTotal))}` : 'No data' },
                        { label: 'Stronger literacy profile', value: `${literacyLeader} | ${formatPercent(literacyLeaderValue)}` },
                        { label: 'Higher female share', value: `${femaleLeader} | ${formatPercent(femaleLeaderValue)}` }
                    ]}
                />
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-3 comparison-grid-counterparts">
                    <div className="card">
                        <h3 className="card-title">{stateA} {counterpartAxisTitle}</h3>
                        <div className="chart-box-tall">
                            {stateATopCounterparts.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: stateATopCounterparts.map(function (row) { return row.name; }),
                                        datasets: [
                                            { label: stateA, data: stateATopCounterparts.map(function (row) { return row.value; }), backgroundColor: COUNTERPART_COLORS[0], borderRadius: 6, maxBarThickness: 34 }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true },
                                            x: { grid: { display: false } }
                                        },
                                        animation: false
                                    }}
                                />
                            ) : (
                                <p className="no-data">No counterpart data above threshold.</p>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">{counterpartAxisTitle} Comparison</h3>
                        <div className="chart-box">
                            {stateATopCounterparts.length > 0 || stateBTopCounterparts.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: mergedCounterpartLabels,
                                        datasets: [
                                            {
                                                label: stateA,
                                                data: mergedCounterpartLabels.map(function (label) {
                                                    const match = stateATopCounterparts.find(function (row) { return row.name === label; });
                                                    return match ? match.value : 0;
                                                }),
                                                backgroundColor: COUNTERPART_COLORS[0],
                                                borderRadius: 6,
                                                maxBarThickness: 30
                                            },
                                            {
                                                label: stateB,
                                                data: mergedCounterpartLabels.map(function (label) {
                                                    const match = stateBTopCounterparts.find(function (row) { return row.name === label; });
                                                    return match ? match.value : 0;
                                                }),
                                                backgroundColor: COUNTERPART_COLORS[1],
                                                borderRadius: 6,
                                                maxBarThickness: 30
                                            }
                                        ]
                                    }}
                                    options={stackedBarOptions}
                                />
                            ) : (
                                <p className="no-data">No counterpart data above threshold.</p>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">{stateB} {counterpartAxisTitle}</h3>
                        <div className="chart-box-tall">
                            {stateBTopCounterparts.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: stateBTopCounterparts.map(function (row) { return row.name; }),
                                        datasets: [
                                            { label: stateB, data: stateBTopCounterparts.map(function (row) { return row.value; }), backgroundColor: COUNTERPART_COLORS[1], borderRadius: 6, maxBarThickness: 34 }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true },
                                            x: { grid: { display: false } }
                                        },
                                        animation: false
                                    }}
                                />
                            ) : (
                                <p className="no-data">No counterpart data above threshold.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-2">
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-age" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={ageInfoItems} />
                        <h3 className="card-title">Age Distribution</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: AGE_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.ageTotals, backgroundColor: AGE_COLORS[0], borderRadius: 5, maxBarThickness: 52 },
                                        { label: stateB, data: stateBMetrics.ageTotals, backgroundColor: AGE_COLORS[1], borderRadius: 5, maxBarThickness: 52 }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-duration" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={durationInfoItems} />
                        <h3 className="card-title">Duration of Stay</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: stateAMetrics.durationLabels,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.durationTotals, backgroundColor: '#f97316', borderRadius: 5, maxBarThickness: 52 },
                                        { label: stateB, data: stateBMetrics.durationTotals, backgroundColor: '#fb7185', borderRadius: 5, maxBarThickness: 52 }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-2">
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-education" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={educationInfoItems} />
                        <h3 className="card-title">Education Levels</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: EDUCATION_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.educationValues, backgroundColor: EDUCATION_COLORS[0], borderRadius: 5, maxBarThickness: 52 },
                                        { label: stateB, data: stateBMetrics.educationValues, backgroundColor: EDUCATION_COLORS[1], borderRadius: 5, maxBarThickness: 52 }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-activity" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={activityInfoItems} />
                        <h3 className="card-title">Economic Activity Profile</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: ACTIVITY_LABELS,
                                    datasets: [
                                        {
                                            label: stateA,
                                            data: stateAMetrics.activityValues,
                                            backgroundColor: ACTIVITY_COLORS[0],
                                            borderRadius: 5,
                                            maxBarThickness: 64
                                        },
                                        {
                                            label: stateB,
                                            data: stateBMetrics.activityValues,
                                            backgroundColor: ACTIVITY_COLORS[1],
                                            borderRadius: 5,
                                            maxBarThickness: 64
                                        }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-2">

                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-reason" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={reasonInfoItems} />
                        <h3 className="card-title">Reasons for Migration</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: REASON_LABELS,
                                    datasets: [
                                        {
                                            label: stateA,
                                            data: stateAMetrics.reasonRows.map(function (row) { return row.value; }),
                                            backgroundColor: REASON_COLORS[0],
                                            borderRadius: 5,
                                            maxBarThickness: 52
                                        },
                                        {
                                            label: stateB,
                                            data: stateBMetrics.reasonRows.map(function (row) { return row.value; }),
                                            backgroundColor: REASON_COLORS[1],
                                            borderRadius: 5,
                                            maxBarThickness: 52
                                        }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="compare-marital" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={maritalInfoItems} />
                        <h3 className="card-title">Marital Status Profile</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: MARITAL_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.maritalValues, backgroundColor: MARITAL_COLORS[0], borderRadius: 5, maxBarThickness: 52 },
                                        { label: stateB, data: stateBMetrics.maritalValues, backgroundColor: MARITAL_COLORS[1], borderRadius: 5, maxBarThickness: 52 }
                                    ]
                                }}
                                options={stackedBarOptions}
                            />
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
