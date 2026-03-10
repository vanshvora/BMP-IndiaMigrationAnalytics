import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import { loadCsv } from './dashboardWidgets';
import ComparisonHeader from './ComparisonHeader';
import ComparisonInsights from './ComparisonInsights';
import './DataSection.css';
import './ComparisonDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STATE_A_COLOR = '#2563eb';
const STATE_B_COLOR = '#f97316';

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
const COUNTERPART_LIMIT_DRIVERS = 8;

const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    animation: false
};

const horizontalBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { beginAtZero: true } },
    animation: false
};

function sum(values) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;
    return total;
}

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

function buildTopComparison(rowsA, rowsB, limit) {
    const topA = getTopN(rowsA, limit);
    const topB = getTopN(rowsB, limit);
    const map = {};

    for (let i = 0; i < topA.length; i++) {
        map[topA[i].name] = { a: topA[i].value, b: 0 };
    }
    for (let i = 0; i < topB.length; i++) {
        const row = map[topB[i].name] || { a: 0, b: 0 };
        row.b = topB[i].value;
        map[topB[i].name] = row;
    }

    const merged = Object.entries(map).map(function (entry) {
        return { label: entry[0], a: entry[1].a, b: entry[1].b, peak: Math.max(entry[1].a, entry[1].b) };
    }).sort(function (x, y) { return y.peak - x.peak; }).slice(0, limit);

    return {
        labels: merged.map(function (row) { return row.label; }),
        valuesA: merged.map(function (row) { return row.a; }),
        valuesB: merged.map(function (row) { return row.b; })
    };
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

export default function ComparisonDashboard({ flows, flowType, threshold, stateA, stateB }) {
    const [d03Data, setD03Data] = useState([]);
    const [d12Data, setD12Data] = useState([]);
    const [d04Data, setD04Data] = useState([]);
    const [d06Data, setD06Data] = useState([]);
    const [d10Data, setD10Data] = useState([]);

    useEffect(function () {
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

        const totalFlow = sum(relevantFlows.map(function (row) { return row.count; }));
        const totalMale = sum(relevantFlows.map(function (row) { return row.male; }));
        const totalFemale = sum(relevantFlows.map(function (row) { return row.female; }));
        const femaleShare = getShare(totalFemale, totalFlow);

        const counterpartRows = toCounterpartRows(relevantFlows, flowType);

        const reasonTotals = REASON_KEYS.map(function (key) {
            let total = 0;
            for (let i = 0; i < d03Data.length; i++) {
                if (!rowMatchesFlowState(d03Data[i], stateName)) continue;
                total += Number(d03Data[i][key]) || 0;
            }
            return total;
        });
        const reasonTotal = sum(reasonTotals);
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
            femaleShare,
            counterpartRows,
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

    const stateAMetrics = computeStateMetrics(stateA);
    const stateBMetrics = computeStateMetrics(stateB);

    const topCounterpartsVolume = buildTopComparison(stateAMetrics.counterpartRows, stateBMetrics.counterpartRows, COUNTERPART_LIMIT_VOLUME);

    const topCounterpartsDrivers = buildTopComparison(stateAMetrics.counterpartRows, stateBMetrics.counterpartRows, COUNTERPART_LIMIT_DRIVERS);

    const insights = [
        getComparisonSentence(
            'Higher migration volume',
            stateA,
            stateAMetrics.totalFlow,
            stateB,
            stateBMetrics.totalFlow,
            function (value) { return Number(value).toLocaleString(); },
            0
        ),
        getComparisonSentence(
            'Higher female share',
            stateA,
            stateAMetrics.femaleShare,
            stateB,
            stateBMetrics.femaleShare,
            formatPercent,
            0.1
        ),
        getComparisonSentence(
            'Stronger work-driven migration',
            stateA,
            stateAMetrics.reasonShares.Work || 0,
            stateB,
            stateBMetrics.reasonShares.Work || 0,
            formatPercent,
            0.1
        ),
        getComparisonSentence(
            'Stronger marriage migration',
            stateA,
            stateAMetrics.reasonShares.Marriage || 0,
            stateB,
            stateBMetrics.reasonShares.Marriage || 0,
            formatPercent,
            0.1
        )
    ];

    const counterpartAxisTitle = flowType === 'inflow' ? 'Top Origin States' : 'Top Destination States';

    return (
        <div className="wrapper comparison-dashboard">
            <ComparisonHeader stateA={stateA} stateB={stateB} flowType={flowType} />
            <ComparisonInsights insights={insights} />

            <section className="comparison-section">
                <h3 className="comparison-section-title">SECTION 1 - Migration Volume</h3>
                <div className="comparison-grid comparison-grid-2">
                    <div className="card">
                        <h3 className="card-title">Total Migrants</h3>
                        <div className="comparison-kpi-row">
                            <div className="comparison-kpi-tile state-a-tile">
                                <p className="comparison-kpi-label">State A: {stateA}</p>
                                <p className="comparison-kpi-value">{stateAMetrics.totalFlow.toLocaleString()}</p>
                            </div>
                            <div className="comparison-kpi-tile state-b-tile">
                                <p className="comparison-kpi-label">State B: {stateB}</p>
                                <p className="comparison-kpi-value">{stateBMetrics.totalFlow.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">{counterpartAxisTitle}</h3>
                        <div className="chart-box-tall">
                            {topCounterpartsVolume.labels.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: topCounterpartsVolume.labels,
                                        datasets: [
                                            { label: stateA, data: topCounterpartsVolume.valuesA, backgroundColor: STATE_A_COLOR, borderRadius: 6 },
                                            { label: stateB, data: topCounterpartsVolume.valuesB, backgroundColor: STATE_B_COLOR, borderRadius: 6 }
                                        ]
                                    }}
                                    options={horizontalBarOptions}
                                />
                            ) : (
                                <p className="no-data">No counterpart data above threshold.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <h3 className="comparison-section-title">SECTION 2 - Demographics</h3>
                <div className="comparison-grid comparison-grid-2">
                    <div className="card">
                        <h3 className="card-title">Age Distribution</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: AGE_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.ageTotals, backgroundColor: STATE_A_COLOR, borderRadius: 5 },
                                        { label: stateB, data: stateBMetrics.ageTotals, backgroundColor: STATE_B_COLOR, borderRadius: 5 }
                                    ]
                                }}
                                options={groupedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Gender Distribution</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: ['Male', 'Female'],
                                    datasets: [
                                        { label: stateA, data: [stateAMetrics.totalMale, stateAMetrics.totalFemale], backgroundColor: STATE_A_COLOR, borderRadius: 5 },
                                        { label: stateB, data: [stateBMetrics.totalMale, stateBMetrics.totalFemale], backgroundColor: STATE_B_COLOR, borderRadius: 5 }
                                    ]
                                }}
                                options={groupedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Literacy Rate Comparison</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: [stateA, stateB],
                                    datasets: [
                                        {
                                            label: 'Literate %',
                                            data: [stateAMetrics.literacyRate, stateBMetrics.literacyRate],
                                            backgroundColor: '#22c55e',
                                            borderRadius: 5
                                        },
                                        {
                                            label: 'Illiterate %',
                                            data: [100 - stateAMetrics.literacyRate, 100 - stateBMetrics.literacyRate],
                                            backgroundColor: '#ef4444',
                                            borderRadius: 5
                                        }
                                    ]
                                }}
                                options={{
                                    ...groupedBarOptions,
                                    scales: {
                                        ...groupedBarOptions.scales,
                                        y: { beginAtZero: true, max: 100 }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Education Levels</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: EDUCATION_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.educationValues, backgroundColor: STATE_A_COLOR, borderRadius: 5 },
                                        { label: stateB, data: stateBMetrics.educationValues, backgroundColor: STATE_B_COLOR, borderRadius: 5 }
                                    ]
                                }}
                                options={horizontalBarOptions}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <h3 className="comparison-section-title">SECTION 3 - Social Profile</h3>
                <div className="comparison-grid comparison-grid-2">
                    <div className="card">
                        <h3 className="card-title">Economic Activity Profile</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: ACTIVITY_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.activityValues, backgroundColor: STATE_A_COLOR, borderRadius: 5 },
                                        { label: stateB, data: stateBMetrics.activityValues, backgroundColor: STATE_B_COLOR, borderRadius: 5 }
                                    ]
                                }}
                                options={groupedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Marital Status Profile</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: MARITAL_LABELS,
                                    datasets: [
                                        { label: stateA, data: stateAMetrics.maritalValues, backgroundColor: STATE_A_COLOR, borderRadius: 5 },
                                        { label: stateB, data: stateBMetrics.maritalValues, backgroundColor: STATE_B_COLOR, borderRadius: 5 }
                                    ]
                                }}
                                options={horizontalBarOptions}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <h3 className="comparison-section-title">SECTION 4 - Migration Drivers</h3>
                <div className="comparison-grid comparison-grid-2">
                    <div className="card">
                        <h3 className="card-title">Reasons for Migration</h3>
                        <div className="chart-box">
                            <Bar
                                data={{
                                    labels: REASON_LABELS,
                                    datasets: [
                                        {
                                            label: stateA,
                                            data: stateAMetrics.reasonRows.map(function (row) { return row.value; }),
                                            backgroundColor: STATE_A_COLOR,
                                            borderRadius: 5
                                        },
                                        {
                                            label: stateB,
                                            data: stateBMetrics.reasonRows.map(function (row) { return row.value; }),
                                            backgroundColor: STATE_B_COLOR,
                                            borderRadius: 5
                                        }
                                    ]
                                }}
                                options={groupedBarOptions}
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Top Counterpart States</h3>
                        <div className="chart-box">
                            {topCounterpartsDrivers.labels.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: topCounterpartsDrivers.labels,
                                        datasets: [
                                            { label: stateA, data: topCounterpartsDrivers.valuesA, backgroundColor: STATE_A_COLOR, borderRadius: 6 },
                                            { label: stateB, data: topCounterpartsDrivers.valuesB, backgroundColor: STATE_B_COLOR, borderRadius: 6 }
                                        ]
                                    }}
                                    options={horizontalBarOptions}
                                />
                            ) : (
                                <p className="no-data">No counterpart data above threshold.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
