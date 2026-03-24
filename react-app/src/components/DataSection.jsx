import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Papa from 'papaparse';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import { loadCsv } from '../utils/loadCsv';
import { BreakdownPie } from './dashboardWidgets';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import './DataSection.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, chartValueLabelPlugin);
ChartJS.defaults.datasets.bar.categoryPercentage = 1.0;
ChartJS.defaults.datasets.bar.barPercentage = 1.0;

function sumValues(values) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;
    return total;
}

function buildHorizontalStackedOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' }
        },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true }
        },
        animation: false
    };
}

function SummaryStatCard({ title, value, detail }) {
    return (
        <div className="card summary-card">
            <p className="summary-label">{title}</p>
            <p className="summary-value">{value}</p>
            <p className="summary-detail">{detail}</p>
        </div>
    );
}

function SourceTag({ tableName }) {
    return <p className="source-tag">Table: {tableName}</p>;
}

function NarrativeInsightCard({ title, accent, badge, heroValue, heroLabel, summary, items }) {
    return (
        <div className="card feature-card narrative-card" style={{ '--narrative-accent': accent }}>
            <h3 className="card-title">{title}</h3>
            <div className="narrative-badge">{badge}</div>
            <div className="narrative-hero">
                <p className="narrative-value">{heroValue}</p>
                <p className="narrative-label">{heroLabel}</p>
            </div>
            <p className="narrative-detail">{summary}</p>
            <div className="narrative-grid">
                {items.map(function (item) {
                    return (
                        <div className="narrative-stat" key={item.label}>
                            <span className="narrative-stat-label">{item.label}</span>
                            <strong className="narrative-stat-value">{item.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FlipChartCard({
    title,
    tableName,
    front,
    back,
    flipped,
    onToggle,
    footerNote,
    frontLabel,
    backLabel
}) {
    return (
        <div className="card feature-card">
            <h3 className="card-title">{title}</h3>
            <SourceTag tableName={tableName} />
            <div className="flip-box">
                <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
                    <div className="side">
                        {front}
                    </div>
                    <div className="side back-side">
                        {back}
                    </div>
                </div>
            </div>
            <div className="footer">
                <span>{flipped ? backLabel : frontLabel}</span>
                <button type="button" className="link-btn" onClick={onToggle}>
                    {flipped ? 'Show main chart' : 'Show gender split'}
                </button>
            </div>
            {footerNote ? <p className="chart-note">{footerNote}</p> : null}
        </div>
    );
}

export default function DataSection({ flows, flowType, selectedState, threshold }) {
    const [durationFlipped, setDurationFlipped] = useState(false);
    const [reasonsFlipped, setReasonsFlipped] = useState(false);
    const [ageFlipped, setAgeFlipped] = useState(false);
    const [educationFlipped, setEducationFlipped] = useState(false);
    const [activityFlipped, setActivityFlipped] = useState(false);
    const [maritalFlipped, setMaritalFlipped] = useState(false);
    const [counterpartMode, setCounterpartMode] = useState('top');

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

    const relevantFlows = useMemo(function () {
        const rows = [];
        for (let i = 0; i < flows.length; i++) {
            const flow = flows[i];
            if (flow.count < threshold) continue;
            if (flowType === 'inflow' && flow.destination !== selectedState) continue;
            if (flowType === 'outflow' && flow.origin !== selectedState) continue;
            rows.push(flow);
        }
        return rows;
    }, [flows, flowType, selectedState, threshold]);

    const counterpartRows = useMemo(function () {
        const grouped = {};
        for (let i = 0; i < relevantFlows.length; i++) {
            const row = relevantFlows[i];
            const key = flowType === 'inflow' ? row.origin : row.destination;
            grouped[key] = (grouped[key] || 0) + (Number(row.count) || 0);
        }

        return Object.entries(grouped)
            .map(function (entry) {
                return { name: entry[0], value: entry[1] };
            })
            .sort(function (a, b) { return b.value - a.value; });
    }, [relevantFlows, flowType]);

    function rowMatchesState(row) {
        if (!row) return false;
        return flowType === 'inflow' ? row.AreaName === selectedState : row.Origin === selectedState;
    }

    function rowMatchesStateD12(row) {
        if (!row) return false;
        if (row.AreaName === row.Origin) return false;
        return flowType === 'inflow' ? row.AreaName === selectedState : row.Origin === selectedState;
    }

    function sumColumns(row, keys) {
        let total = 0;
        for (let i = 0; i < keys.length; i++) total += Number(row[keys[i]]) || 0;
        return total;
    }

    const totalFlow = sumValues(relevantFlows.map(function (row) { return row.count; }));
    const totalMale = sumValues(relevantFlows.map(function (row) { return row.male; }));
    const totalFemale = sumValues(relevantFlows.map(function (row) { return row.female; }));
    const totalUrban = sumValues(relevantFlows.map(function (row) { return row.urban; }));
    const totalRural = sumValues(relevantFlows.map(function (row) { return row.rural; }));

    const topCounterpart = counterpartRows[0] || null;

    const durationLabels = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];
    const durationKeys = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
    const durationMaleKeys = ['Males_LT1yr', 'Males_1to4yr', 'Males_5to9yr', 'Males_10to19yr', 'Males_20plusyr', 'Males_DurNS'];
    const durationFemaleKeys = ['Females_LT1yr', 'Females_1to4yr', 'Females_5to9yr', 'Females_10to19yr', 'Females_20plusyr', 'Females_DurNS'];
    const durationTotals = durationKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d02Data.length; i++) {
            if (rowMatchesState(d02Data[i])) total += Number(d02Data[i][key]) || 0;
        }
        return total;
    });
    const durationMaleTotals = durationMaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d02Data.length; i++) {
            if (rowMatchesState(d02Data[i])) total += Number(d02Data[i][key]) || 0;
        }
        return total;
    });
    const durationFemaleTotals = durationFemaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d02Data.length; i++) {
            if (rowMatchesState(d02Data[i])) total += Number(d02Data[i][key]) || 0;
        }
        return total;
    });
    const durationTotal = sumValues(durationTotals);

    const reasonLabels = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
    const reasonPersonKeys = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];
    const reasonMaleKeys = ['Males_Work', 'Males_Business', 'Males_Education', 'Males_Marriage', 'Males_MoveAfterBirth', 'Males_MoveWithHH', 'Males_Other'];
    const reasonFemaleKeys = ['Females_Work', 'Females_Business', 'Females_Education', 'Females_Marriage', 'Females_MoveAfterBirth', 'Females_MoveWithHH', 'Females_Other'];
    const reasonTotals = reasonPersonKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) total += Number(d03Data[i][key]) || 0;
        }
        return total;
    });
    const reasonMaleTotals = reasonMaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) total += Number(d03Data[i][key]) || 0;
        }
        return total;
    });
    const reasonFemaleTotals = reasonFemaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) total += Number(d03Data[i][key]) || 0;
        }
        return total;
    });
    const reasonRows = reasonLabels.map(function (label, index) {
        return { label: label, value: reasonTotals[index] };
    });
    const reasonTotal = sumValues(reasonTotals);
    const leadingReason = getTopN(reasonRows, 1)[0] || null;

    const ageLabels = ['Children', 'Youth', 'Working Age', 'Elderly', 'Not stated'];
    const childrenPersonKeys = ['Persons_0to4', 'Persons_5to9', 'Persons_10to14'];
    const youthPersonKeys = ['Persons_15to19', 'Persons_20to24', 'Persons_25to29'];
    const workingPersonKeys = ['Persons_30to34', 'Persons_35to39', 'Persons_40to44', 'Persons_45to49', 'Persons_50to54', 'Persons_55to59'];
    const elderlyPersonKeys = ['Persons_60to64', 'Persons_65to69', 'Persons_70to74', 'Persons_75to79', 'Persons_80plus'];
    const childrenMaleKeys = ['Males_0to4', 'Males_5to9', 'Males_10to14'];
    const youthMaleKeys = ['Males_15to19', 'Males_20to24', 'Males_25to29'];
    const workingMaleKeys = ['Males_30to34', 'Males_35to39', 'Males_40to44', 'Males_45to49', 'Males_50to54', 'Males_55to59'];
    const elderlyMaleKeys = ['Males_60to64', 'Males_65to69', 'Males_70to74', 'Males_75to79', 'Males_80plus'];
    const childrenFemaleKeys = ['Females_0to4', 'Females_5to9', 'Females_10to14'];
    const youthFemaleKeys = ['Females_15to19', 'Females_20to24', 'Females_25to29'];
    const workingFemaleKeys = ['Females_30to34', 'Females_35to39', 'Females_40to44', 'Females_45to49', 'Females_50to54', 'Females_55to59'];
    const elderlyFemaleKeys = ['Females_60to64', 'Females_65to69', 'Females_70to74', 'Females_75to79', 'Females_80plus'];

    const ageTotals = [0, 0, 0, 0, 0];
    const ageMaleTotals = [0, 0, 0, 0, 0];
    const ageFemaleTotals = [0, 0, 0, 0, 0];
    for (let i = 0; i < d12Data.length; i++) {
        if (!rowMatchesStateD12(d12Data[i])) continue;
        ageTotals[0] += sumColumns(d12Data[i], childrenPersonKeys);
        ageTotals[1] += sumColumns(d12Data[i], youthPersonKeys);
        ageTotals[2] += sumColumns(d12Data[i], workingPersonKeys);
        ageTotals[3] += sumColumns(d12Data[i], elderlyPersonKeys);
        ageTotals[4] += Number(d12Data[i].Persons_AgeNS) || 0;

        ageMaleTotals[0] += sumColumns(d12Data[i], childrenMaleKeys);
        ageMaleTotals[1] += sumColumns(d12Data[i], youthMaleKeys);
        ageMaleTotals[2] += sumColumns(d12Data[i], workingMaleKeys);
        ageMaleTotals[3] += sumColumns(d12Data[i], elderlyMaleKeys);
        ageMaleTotals[4] += Number(d12Data[i].Males_AgeNS) || 0;

        ageFemaleTotals[0] += sumColumns(d12Data[i], childrenFemaleKeys);
        ageFemaleTotals[1] += sumColumns(d12Data[i], youthFemaleKeys);
        ageFemaleTotals[2] += sumColumns(d12Data[i], workingFemaleKeys);
        ageFemaleTotals[3] += sumColumns(d12Data[i], elderlyFemaleKeys);
        ageFemaleTotals[4] += Number(d12Data[i].Females_AgeNS) || 0;
    }
    const ageRows = ageLabels.map(function (label, index) {
        return { label: label, value: ageTotals[index] };
    });
    const ageTotal = sumValues(ageTotals);
    const leadingAge = getTopN(ageRows, 1)[0] || null;

    const educationRow = d04Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const literatePersons = Number(educationRow.Literate_Persons) || 0;
    const illiteratePersons = Number(educationRow.Illiterate_Persons) || 0;
    const educationLabels = ['Below Matric', 'Matric to < Graduate', 'Technical Diploma', 'Graduate+', 'Technical Degree'];
    const educationValues = [
        Number(educationRow.BelowMatric_Persons) || 0,
        Number(educationRow.MatricToGrad_Persons) || 0,
        Number(educationRow.TechDiploma_Persons) || 0,
        Number(educationRow.Graduate_Persons) || 0,
        Number(educationRow.TechDegree_Persons) || 0
    ];
    const educationMaleValues = [
        Number(educationRow.BelowMatric_Males) || 0,
        Number(educationRow.MatricToGrad_Males) || 0,
        Number(educationRow.TechDiploma_Males) || 0,
        Number(educationRow.Graduate_Males) || 0,
        Number(educationRow.TechDegree_Males) || 0
    ];
    const educationFemaleValues = [
        Number(educationRow.BelowMatric_Females) || 0,
        Number(educationRow.MatricToGrad_Females) || 0,
        Number(educationRow.TechDiploma_Females) || 0,
        Number(educationRow.Graduate_Females) || 0,
        Number(educationRow.TechDegree_Females) || 0
    ];
    const activityRow = d06Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const activityLabels = ['Main Workers', 'Marginal Workers', 'Non-workers'];
    const activityValues = [
        Number(activityRow.MainWorkers_Persons) || 0,
        Number(activityRow.MarginalWorkers_Persons) || 0,
        Number(activityRow.NonWorkers_Persons) || 0
    ];
    const activityMaleValues = [
        Number(activityRow.MainWorkers_Males) || 0,
        Number(activityRow.MarginalWorkers_Males) || 0,
        Number(activityRow.NonWorkers_Males) || 0
    ];
    const activityFemaleValues = [
        Number(activityRow.MainWorkers_Females) || 0,
        Number(activityRow.MarginalWorkers_Females) || 0,
        Number(activityRow.NonWorkers_Females) || 0
    ];
    const maritalRow = d10Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const maritalLabels = ['Never Married', 'Currently Married', 'Widowed', 'Separated', 'Divorced'];
    const maritalValues = [
        Number(maritalRow.NeverMarried_Persons) || 0,
        Number(maritalRow.CurrMarried_Persons) || 0,
        Number(maritalRow.Widowed_Persons) || 0,
        Number(maritalRow.Separated_Persons) || 0,
        Number(maritalRow.Divorced_Persons) || 0
    ];
    const maritalMaleValues = [
        Number(maritalRow.NeverMarried_Males) || 0,
        Number(maritalRow.CurrMarried_Males) || 0,
        Number(maritalRow.Widowed_Males) || 0,
        Number(maritalRow.Separated_Males) || 0,
        Number(maritalRow.Divorced_Males) || 0
    ];
    const maritalFemaleValues = [
        Number(maritalRow.NeverMarried_Females) || 0,
        Number(maritalRow.CurrMarried_Females) || 0,
        Number(maritalRow.Widowed_Females) || 0,
        Number(maritalRow.Separated_Females) || 0,
        Number(maritalRow.Divorced_Females) || 0
    ];

    const counterpartDisplayRows = counterpartMode === 'top'
        ? getTopN(counterpartRows, 5)
        : [...counterpartRows].slice(-5).reverse();

    const chartColors = {
        flow: flowType === 'inflow' ? '#2563eb' : '#f97316',
        duration: '#f59e0b',
        education: '#16a34a',
        activity: '#14b8a6',
        marital: '#8b5cf6'
    };
    const leadingDuration = getTopN(durationLabels.map(function (label, index) {
        return { label: label, value: durationTotals[index] };
    }), 1)[0] || null;
    const topAgeShare = formatPercent(getShare(leadingAge?.value || 0, ageTotal));
    const topReasonShare = formatPercent(getShare(leadingReason?.value || 0, reasonTotal));
    const femaleShare = formatPercent(getShare(totalFemale, totalFlow));
    const urbanShare = formatPercent(getShare(totalUrban, totalUrban + totalRural));
    const literacyShare = formatPercent(getShare(literatePersons, literatePersons + illiteratePersons));
    const durationShare = formatPercent(getShare(leadingDuration?.value || 0, durationTotal));

    const counterpartTitle = flowType === 'inflow' ? 'Origins' : 'Destinations';

    if (!selectedState) {
        return (
            <div className="no-selection">
                <h2 className="no-sel-title">Select a State</h2>
                <p className="no-sel-text">Click on any state on the map to view detailed migration data.</p>
            </div>
        );
    }

    if (selectedState === 'TELANGANA') {
        return (
            <div className="warning">
                <h2 className="warning-title">TELANGANA</h2>
                <div className="warning-box">
                    <p className="warning-bold">Data Not Available</p>
                    <p className="warning-msg">Telangana was formed in June 2014. This dashboard uses Census 2011 datasets.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wrapper single-dashboard">
            <div className="header header-row">
                <div>
                    <h2 className="state-name">{selectedState}</h2>
                    <p className="subtitle">Domestic {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} - Census 2011</p>
                </div>

                <div className="total-box">
                    <span className="total-tag">Total {flowType === 'inflow' ? 'Inflow' : 'Outflow'}</span>
                    <div className="total-num">{totalFlow.toLocaleString()}</div>
                </div>
            </div>

            <section className="summary-grid">
                <SummaryStatCard
                    title="Top counterpart"
                    value={topCounterpart ? topCounterpart.name : 'No data'}
                    detail={topCounterpart ? `${topCounterpart.value.toLocaleString()} migrants` : 'No flows above threshold'}
                />
                <SummaryStatCard
                    title="Leading reason"
                    value={leadingReason ? leadingReason.label : 'No data'}
                    detail={leadingReason ? formatPercent(getShare(leadingReason.value, reasonTotal)) : 'No reason records'}
                />
                <SummaryStatCard
                    title="Dominant age"
                    value={leadingAge ? leadingAge.label : 'No data'}
                    detail={leadingAge ? formatPercent(getShare(leadingAge.value, ageTotal)) : 'No age records'}
                />
                <SummaryStatCard
                    title="Literacy split"
                    value={`${formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))} literate`}
                    detail={`${illiteratePersons.toLocaleString()} illiterate migrants`}
                />
            </section>

            <section className="card counterpart-card">
                <div className="counterpart-head">
                    <div>
                        <h3 className="card-title">Top / Bottom 5 {counterpartTitle}</h3>
                        <SourceTag tableName="D01" />
                        <p className="counterpart-subtitle">{flowType === 'inflow' ? 'Where migrants are coming from' : 'Where migrants are going to'}</p>
                    </div>

                    <div className="toggle-group">
                        <button
                            type="button"
                            className={`toggle-btn ${counterpartMode === 'top' ? 'is-active' : ''}`}
                            onClick={() => setCounterpartMode('top')}
                        >
                            Top 5
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${counterpartMode === 'bottom' ? 'is-active' : ''}`}
                            onClick={() => setCounterpartMode('bottom')}
                        >
                            Bottom 5
                        </button>
                    </div>
                </div>

                <div className="counterpart-layout">
                    <div className="counterpart-main-column">
                        <div className="chart-box counterpart-chart">
                            {counterpartDisplayRows.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: counterpartDisplayRows.map(function (row) { return row.name; }),
                                        datasets: [{
                                            label: 'Migrants',
                                            data: counterpartDisplayRows.map(function (row) { return row.value; }),
                                            backgroundColor: chartColors.flow,
                                            borderRadius: 8,
                                            maxBarThickness: 42
                                        }]
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
                                <p className="no-data">No counterpart data available.</p>
                            )}
                        </div>
                    </div>

                    <div className="counterpart-list">
                        {counterpartRows.map(function (row, index) {
                            return (
                                <div className={`list-row ${counterpartDisplayRows.some(function (item) { return item.name === row.name; }) ? 'is-highlighted' : ''}`} key={`full-${row.name}`}>
                                    <span className="list-rank">{index + 1}</span>
                                    <div className="list-copy">
                                        <span className="list-name">{row.name}</span>
                                        <span className="list-share">{formatPercent(getShare(row.value, totalFlow))}</span>
                                    </div>
                                    <strong className="list-value">{row.value.toLocaleString()}</strong>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="profile-grid">
                <div className="card compact-card duration-card">
                    <h3 className="card-title">Male / Female</h3>
                    <SourceTag tableName="D01" />
                    <BreakdownPie
                        labels={['Male', 'Female']}
                        values={[totalMale, totalFemale]}
                        colors={['#2563eb', '#ec4899']}
                    />
                    <div className="footer">
                        <span>Male: {formatPercent(getShare(totalMale, totalFlow))}</span>
                        <span>Female: {formatPercent(getShare(totalFemale, totalFlow))}</span>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Urban / Rural</h3>
                    <SourceTag tableName="D01" />
                    <BreakdownPie
                        labels={['Urban', 'Rural']}
                        values={[totalUrban, totalRural]}
                        colors={['#7c3aed', '#16a34a']}
                    />
                    <div className="footer">
                        <span>Urban: {formatPercent(getShare(totalUrban, totalUrban + totalRural))}</span>
                        <span>Rural: {formatPercent(getShare(totalRural, totalUrban + totalRural))}</span>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Literate / Illiterate</h3>
                    <SourceTag tableName="D04" />
                    <BreakdownPie
                        labels={['Literate', 'Illiterate']}
                        values={[literatePersons, illiteratePersons]}
                        colors={['#16a34a', '#ef4444']}
                    />
                    <div className="footer">
                        <span>Literate: {formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))}</span>
                        <span>Illiterate: {formatPercent(getShare(illiteratePersons, literatePersons + illiteratePersons))}</span>
                    </div>
                </div>
            </section>

            <section className="charts-grid">
                <div className="card compact-card">
                    <h3 className="card-title">Duration of Stay</h3>
                    <SourceTag tableName="D02" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${durationFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: durationLabels,
                                            datasets: [{
                                                label: 'Persons',
                                                data: durationTotals,
                                                backgroundColor: chartColors.duration,
                                                borderRadius: 8,
                                                maxBarThickness: 52
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: durationLabels,
                                            datasets: [
                                                { label: 'Male', data: durationMaleTotals, backgroundColor: '#2563eb', borderRadius: 6, maxBarThickness: 40 },
                                                { label: 'Female', data: durationFemaleTotals, backgroundColor: '#ec4899', borderRadius: 6, maxBarThickness: 40 }
                                            ]
                                        }}
                                        options={buildHorizontalStackedOptions()}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>{durationFlipped ? 'Gender split by duration' : `Total duration records: ${durationTotal.toLocaleString()}`}</span>
                        <button type="button" className="link-btn" onClick={() => setDurationFlipped(function (value) { return !value; })}>
                            {durationFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <NarrativeInsightCard
                    title="General Migration Insight"
                    accent="#0f766e"
                    badge="State overview"
                    heroValue={totalFlow.toLocaleString()}
                    heroLabel={`total ${flowType === 'inflow' ? 'in-migrants' : 'out-migrants'}`}
                    summary={topCounterpart
                        ? `${topCounterpart.name} is the strongest ${flowType === 'inflow' ? 'origin' : 'destination'} corridor. ${leadingReason ? `${leadingReason.label} leads migration reasons at ${topReasonShare}` : ''}${leadingAge ? `, while ${leadingAge.label.toLowerCase()} remains the biggest age band at ${topAgeShare}` : ''}.`
                        : 'No strong corridor is available above the current threshold.'}
                    items={[
                        { label: flowType === 'inflow' ? 'Top origin share' : 'Top destination share', value: topCounterpart ? formatPercent(getShare(topCounterpart.value, totalFlow)) : '0.0%' },
                        { label: 'Leading duration', value: leadingDuration ? `${leadingDuration.label} | ${durationShare}` : 'No data' },
                        { label: 'Female share', value: femaleShare },
                        { label: 'Urban share', value: urbanShare },
                        { label: 'Literacy rate', value: literacyShare }
                    ]}
                />
            </section>

            <section className="two-column-grid">
                <FlipChartCard
                    title="Age Profile"
                    tableName="D12"
                    flipped={ageFlipped}
                    onToggle={() => setAgeFlipped(function (value) { return !value; })}
                    frontLabel="Age share"
                    backLabel="Gender split by age"
                    front={(
                        <BreakdownPie
                            labels={ageLabels}
                            values={ageTotals}
                            colors={['#0f766e', '#65a30d', '#7c3aed', '#f97316', '#64748b']}
                        />
                    )}
                    back={(
                        <div className="chart-box feature-chart">
                            <Bar
                                data={{
                                    labels: ageLabels,
                                    datasets: [
                                        { label: 'Male', data: ageMaleTotals, backgroundColor: '#2563eb', borderRadius: 6, maxBarThickness: 40 },
                                        { label: 'Female', data: ageFemaleTotals, backgroundColor: '#ec4899', borderRadius: 6, maxBarThickness: 40 }
                                    ]
                                }}
                                options={buildHorizontalStackedOptions()}
                            />
                        </div>
                    )}
                    footerNote={`Total age records: ${ageTotal.toLocaleString()}`}
                />

                <FlipChartCard
                    title="Reason for Migration"
                    tableName="D03"
                    flipped={reasonsFlipped}
                    onToggle={() => setReasonsFlipped(function (value) { return !value; })}
                    frontLabel="Reason share"
                    backLabel="Gender split by reason"
                    front={(
                        <BreakdownPie
                            labels={reasonLabels}
                            values={reasonTotals}
                            colors={['#0f766e', '#d97706', '#7c3aed', '#b45309', '#ea580c', '#65a30d', '#6b7280']}
                        />
                    )}
                    back={(
                        <div className="chart-box feature-chart">
                            <Bar
                                data={{
                                    labels: reasonLabels,
                                    datasets: [
                                        { label: 'Male', data: reasonMaleTotals, backgroundColor: '#2563eb', borderRadius: 6, maxBarThickness: 40 },
                                        { label: 'Female', data: reasonFemaleTotals, backgroundColor: '#ec4899', borderRadius: 6, maxBarThickness: 40 }
                                    ]
                                }}
                                options={buildHorizontalStackedOptions()}
                            />
                        </div>
                    )}
                    footerNote={`Total reason records: ${reasonTotal.toLocaleString()}`}
                />
            </section>

            <section className="three-chart-row">
                <div className="card compact-card">
                    <h3 className="card-title">Education Levels</h3>
                    <SourceTag tableName="D04" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${educationFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: educationLabels,
                                            datasets: [{
                                                label: 'Persons',
                                                data: educationValues,
                                                backgroundColor: chartColors.education,
                                                borderRadius: 8,
                                                maxBarThickness: 54
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: educationLabels,
                                            datasets: [
                                                { label: 'Male', data: educationMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 54 },
                                                { label: 'Female', data: educationFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 54 }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>Total: {sumValues(educationValues).toLocaleString()}</span>
                        <button type="button" className="link-btn" onClick={() => setEducationFlipped(function (value) { return !value; })}>
                            {educationFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Economic Activity</h3>
                    <SourceTag tableName="D06" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${activityFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: activityLabels,
                                            datasets: [{
                                                label: 'Persons',
                                                data: activityValues,
                                                backgroundColor: chartColors.activity,
                                                borderRadius: 8,
                                                maxBarThickness: 72
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: activityLabels,
                                            datasets: [
                                                { label: 'Male', data: activityMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 72 },
                                                { label: 'Female', data: activityFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 72 }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>Total: {sumValues(activityValues).toLocaleString()}</span>
                        <button type="button" className="link-btn" onClick={() => setActivityFlipped(function (value) { return !value; })}>
                            {activityFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Marital Status</h3>
                    <SourceTag tableName="D10" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${maritalFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: maritalLabels,
                                            datasets: [{
                                                label: 'Persons',
                                                data: maritalValues,
                                                backgroundColor: chartColors.marital,
                                                borderRadius: 8,
                                                maxBarThickness: 54
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    <Bar
                                        data={{
                                            labels: maritalLabels,
                                            datasets: [
                                                { label: 'Male', data: maritalMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 54 },
                                                { label: 'Female', data: maritalFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 54 }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } },
                                            animation: false
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>Total: {sumValues(maritalValues).toLocaleString()}</span>
                        <button type="button" className="link-btn" onClick={() => setMaritalFlipped(function (value) { return !value; })}>
                            {maritalFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
