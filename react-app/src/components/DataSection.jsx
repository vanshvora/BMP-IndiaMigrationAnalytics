import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Papa from 'papaparse';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';
import {
    getTopN,
    getShare,
    formatPercent,
    getOverviewMetrics,
    getDemographicMetrics,
    getMigrationDriverMetrics,
    getOverviewInsights,
    getDemographicInsights,
    getMigrationDriverInsights,
    getCounterpartDrilldown,
    getReasonDrilldown,
    getAgeDrilldown,
    getActivityDrilldown
} from './dashboardInsights';
import { BreakdownPie, InsightCard, KeyTakeawaysCard, DrilldownPanel, loadCsv } from './dashboardWidgets';
import './DataSection.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DataSection({ flows, flowType, selectedState, threshold }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [ageAltView, setAgeAltView] = useState(false);
    const [literacyAltView, setLiteracyAltView] = useState(false);
    const [reasonsAltView, setReasonsAltView] = useState(false);
    const [counterpartAltView, setCounterpartAltView] = useState(false);

    const [selectedCounterpartIndex, setSelectedCounterpartIndex] = useState(0);
    const [selectedReasonIndex, setSelectedReasonIndex] = useState(0);
    const [selectedAgeIndex, setSelectedAgeIndex] = useState(0);
    const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);

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

    useEffect(function () {
        setActiveTab('overview');
        setAgeAltView(false);
        setLiteracyAltView(false);
        setReasonsAltView(false);
        setCounterpartAltView(false);
        setSelectedCounterpartIndex(0);
        setSelectedReasonIndex(0);
        setSelectedAgeIndex(0);
        setSelectedActivityIndex(0);
    }, [selectedState, flowType, threshold]);

    const relevantFlows = useMemo(function () {
        const rows = [];
        for (let i = 0; i < flows.length; i++) {
            const f = flows[i];
            if (f.count < threshold) continue;
            if (flowType === 'inflow' && f.destination !== selectedState) continue;
            if (flowType === 'outflow' && f.origin !== selectedState) continue;
            rows.push(f);
        }
        return rows;
    }, [flows, flowType, selectedState, threshold]);

    const counterpartRows = useMemo(function () {
        const map = {};
        for (let i = 0; i < relevantFlows.length; i++) {
            const row = relevantFlows[i];
            const key = flowType === 'inflow' ? row.origin : row.destination;
            map[key] = (map[key] || 0) + (Number(row.count) || 0);
        }
        return Object.entries(map).map(function (entry) {
            return { name: entry[0], value: entry[1] };
        }).sort(function (a, b) { return b.value - a.value; });
    }, [relevantFlows, flowType]);

    const stateTotalsRows = useMemo(function () {
        const map = {};
        for (let i = 0; i < flows.length; i++) {
            if (flows[i].count < threshold) continue;
            const key = flowType === 'inflow' ? flows[i].destination : flows[i].origin;
            map[key] = (map[key] || 0) + (Number(flows[i].count) || 0);
        }
        return Object.entries(map).map(function (entry) {
            return { state: entry[0], value: entry[1] };
        }).sort(function (a, b) { return b.value - a.value; });
    }, [flows, flowType, threshold]);

    function sumFlowField(key) {
        let s = 0;
        for (let i = 0; i < relevantFlows.length; i++) s += Number(relevantFlows[i][key]) || 0;
        return s;
    }

    const totalFlow = sumFlowField('count');
    const totalMale = sumFlowField('male');
    const totalFemale = sumFlowField('female');
    const totalUrban = sumFlowField('urban');
    const totalRural = sumFlowField('rural');

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
        let s = 0;
        for (let i = 0; i < keys.length; i++) s += Number(row[keys[i]]) || 0;
        return s;
    }

    const durationLabels = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];
    const durationKeys = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
    const durationTotals = durationKeys.map(function (key) {
        let s = 0;
        for (let i = 0; i < d02Data.length; i++) if (rowMatchesState(d02Data[i])) s += Number(d02Data[i][key]) || 0;
        return s;
    });
    let durationTotal = 0;
    for (let i = 0; i < durationTotals.length; i++) durationTotal += durationTotals[i];

    const reasonLabels = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
    const reasonKeys = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];
    const reasonTotals = reasonKeys.map(function (key) {
        let s = 0;
        for (let i = 0; i < d03Data.length; i++) if (rowMatchesState(d03Data[i])) s += Number(d03Data[i][key]) || 0;
        return s;
    });
    const reasonRows = reasonLabels.map(function (label, i) { return { label: label, value: reasonTotals[i] }; });
    let reasonTotal = 0;
    for (let i = 0; i < reasonTotals.length; i++) reasonTotal += reasonTotals[i];

    const ageLabels = ['Children (0-14)', 'Youth (15-29)', 'Working Age (30-59)', 'Elderly (60+)', 'Not stated'];
    const ageTotals = [0, 0, 0, 0, 0];
    const childrenAgeKeys = ['Persons_0to4', 'Persons_5to9', 'Persons_10to14'];
    const youthAgeKeys = ['Persons_15to19', 'Persons_20to24', 'Persons_25to29'];
    const workingAgeKeys = ['Persons_30to34', 'Persons_35to39', 'Persons_40to44', 'Persons_45to49', 'Persons_50to54', 'Persons_55to59'];
    const elderlyAgeKeys = ['Persons_60to64', 'Persons_65to69', 'Persons_70to74', 'Persons_75to79', 'Persons_80plus'];
    for (let i = 0; i < d12Data.length; i++) {
        if (!rowMatchesStateD12(d12Data[i])) continue;
        ageTotals[0] += sumColumns(d12Data[i], childrenAgeKeys);
        ageTotals[1] += sumColumns(d12Data[i], youthAgeKeys);
        ageTotals[2] += sumColumns(d12Data[i], workingAgeKeys);
        ageTotals[3] += sumColumns(d12Data[i], elderlyAgeKeys);
        ageTotals[4] += Number(d12Data[i].Persons_AgeNS) || 0;
    }
    const ageRows = ageLabels.map(function (label, i) { return { label: label, value: ageTotals[i] }; });
    let ageTotal = 0;
    for (let i = 0; i < ageTotals.length; i++) ageTotal += ageTotals[i];

    const educationRow = d04Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const illiteratePersons = Number(educationRow.Illiterate_Persons) || 0;
    const literatePersons = Number(educationRow.Literate_Persons) || 0;
    const educationRows = [
        { label: 'Below Matric', value: Number(educationRow.BelowMatric_Persons) || 0 },
        { label: 'Matric to < Graduate', value: Number(educationRow.MatricToGrad_Persons) || 0 },
        { label: 'Technical Diploma', value: Number(educationRow.TechDiploma_Persons) || 0 },
        { label: 'Graduate+', value: Number(educationRow.Graduate_Persons) || 0 },
        { label: 'Technical Degree', value: Number(educationRow.TechDegree_Persons) || 0 }
    ];
    const educationMaleValues = [Number(educationRow.BelowMatric_Males) || 0, Number(educationRow.MatricToGrad_Males) || 0, Number(educationRow.TechDiploma_Males) || 0, Number(educationRow.Graduate_Males) || 0, Number(educationRow.TechDegree_Males) || 0];
    const educationFemaleValues = [Number(educationRow.BelowMatric_Females) || 0, Number(educationRow.MatricToGrad_Females) || 0, Number(educationRow.TechDiploma_Females) || 0, Number(educationRow.Graduate_Females) || 0, Number(educationRow.TechDegree_Females) || 0];

    const activityRow = d06Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const activityRows = [
        { label: 'Main Workers', value: Number(activityRow.MainWorkers_Persons) || 0 },
        { label: 'Marginal Workers', value: Number(activityRow.MarginalWorkers_Persons) || 0 },
        { label: 'Non-workers', value: Number(activityRow.NonWorkers_Persons) || 0 }
    ];
    const activityOtherValues = [activityRows[0].value, Math.max(0, activityRows[1].value - (Number(activityRow.MarginalSeeking_Persons) || 0)), Math.max(0, activityRows[2].value - (Number(activityRow.NonWorkersSeeking_Persons) || 0))];
    const activitySeekingValues = [0, Number(activityRow.MarginalSeeking_Persons) || 0, Number(activityRow.NonWorkersSeeking_Persons) || 0];

    const maritalRow = d10Data.find(function (row) { return row.AreaName === selectedState; }) || {};
    const maritalLabels = ['Never Married', 'Currently Married', 'Widowed', 'Separated', 'Divorced'];
    const maritalMaleValues = [Number(maritalRow.NeverMarried_Males) || 0, Number(maritalRow.CurrMarried_Males) || 0, Number(maritalRow.Widowed_Males) || 0, Number(maritalRow.Separated_Males) || 0, Number(maritalRow.Divorced_Males) || 0];
    const maritalFemaleValues = [Number(maritalRow.NeverMarried_Females) || 0, Number(maritalRow.CurrMarried_Females) || 0, Number(maritalRow.Widowed_Females) || 0, Number(maritalRow.Separated_Females) || 0, Number(maritalRow.Divorced_Females) || 0];
    const maritalRows = [
        { label: 'Never Married', value: Number(maritalRow.NeverMarried_Persons) || 0 },
        { label: 'Currently Married', value: Number(maritalRow.CurrMarried_Persons) || 0 },
        { label: 'Widowed', value: Number(maritalRow.Widowed_Persons) || 0 },
        { label: 'Separated', value: Number(maritalRow.Separated_Persons) || 0 },
        { label: 'Divorced', value: Number(maritalRow.Divorced_Persons) || 0 }
    ];

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

    const overviewInsights = getOverviewInsights(getOverviewMetrics({ stateName: selectedState, flowType, totalFlow, totalMale, totalFemale, totalUrban, totalRural, counterpartRows, durationLabels, durationTotals, stateTotalsRows }));
    const demographicInsights = getDemographicInsights(getDemographicMetrics({ ageRows, literatePersons, illiteratePersons, educationRows, activityRows, maritalRows }));
    const driverMetrics = getMigrationDriverMetrics({ reasonRows, counterpartRows });
    const driverInsights = getMigrationDriverInsights(driverMetrics);

    const top5Counterparts = getTopN(counterpartRows, 5);
    const top10Counterparts = getTopN(counterpartRows, 10);
    const counterpartDrilldown = getCounterpartDrilldown(top5Counterparts, selectedCounterpartIndex, totalFlow, flowType);
    const reasonDrilldown = getReasonDrilldown(reasonRows, selectedReasonIndex);
    const ageDrilldown = getAgeDrilldown(ageRows, selectedAgeIndex);
    const activityDrilldown = getActivityDrilldown(activityRows, selectedActivityIndex);

    const tabs = [
        { id: 'overview', label: 'Overview', subtitle: 'High-level migration summary' },
        { id: 'demographics', label: 'Demographics & Social Profile', subtitle: 'Who the migrants are' },
        { id: 'drivers', label: 'Migration Drivers', subtitle: 'Why migration happens' }
    ];

    return (
        <div className="wrapper tabbed-dashboard">
            <div className="header">
                <h2 className="state-name">{selectedState}</h2>
                <p className="subtitle">Domestic {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} - Census 2011</p>
            </div>

            <div className="total-box"><span className="total-tag">Total {flowType === 'inflow' ? 'Inflow' : 'Outflow'}</span><div className="total-num">{totalFlow.toLocaleString()}</div></div>

            <div className="tab-header">{tabs.map(function (tab) { return <button key={tab.id} type="button" className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>; })}</div>

            <section className="tab-panel">
                <div className="tab-intro"><div className="tab-intro-text"><h3>{tabs.find(function (t) { return t.id === activeTab; })?.label}</h3><p>{tabs.find(function (t) { return t.id === activeTab; })?.subtitle}</p></div><KeyTakeawaysCard points={(activeTab === 'overview' ? overviewInsights : activeTab === 'demographics' ? demographicInsights : driverInsights).takeaways} /></div>
                <div className="insight-grid">{(activeTab === 'overview' ? overviewInsights.cards : activeTab === 'demographics' ? demographicInsights.cards : driverInsights.cards).map(function (insight) { return <InsightCard key={insight.id} insight={insight} />; })}</div>

                {activeTab === 'overview' && (
                    <div className="overview-grid">
                        <div className="card tall-card"><h3 className="card-title">Top State {flowType === 'inflow' ? 'Origins' : 'Destinations'}</h3><div className="chart-box-tall">{top5Counterparts.length > 0 ? <Bar data={{ labels: top5Counterparts.map(function (r) { return r.name; }), datasets: [{ data: top5Counterparts.map(function (r) { return r.value; }), backgroundColor: flowType === 'inflow' ? '#3b82f6' : '#f97316', borderRadius: 6, maxBarThickness: 28 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } }, animation: false }} onClick={function (_e, els) { if (els.length > 0) setSelectedCounterpartIndex(els[0].index); }} /> : <p className="no-data">No counterpart data available</p>}</div><div className="footer"><span>Click a bar for drilldown.</span></div></div>
                        <DrilldownPanel title="Counterpart Drilldown" detail={counterpartDrilldown} />
                        <div className="card short-card"><h3 className="card-title">Gender Breakdown</h3><BreakdownPie labels={['Male', 'Female']} values={[totalMale, totalFemale]} colors={['#3b82f6', '#ec4899']} /><div className="footer"><span>Male: {formatPercent(getShare(totalMale, totalFlow))}</span><span>Female: {formatPercent(getShare(totalFemale, totalFlow))}</span></div></div>
                        <div className="card short-card"><h3 className="card-title">Urban / Rural Breakdown</h3><BreakdownPie labels={['Urban', 'Rural']} values={[totalUrban, totalRural]} colors={['#8b5cf6', '#22c55e']} /><div className="footer"><span>Urban: {formatPercent(getShare(totalUrban, totalUrban + totalRural))}</span><span>Rural: {formatPercent(getShare(totalRural, totalUrban + totalRural))}</span></div></div>
                        <div className="card short-card span-2"><h3 className="card-title">Duration of Stay</h3><div className="chart-box"><Bar data={{ labels: durationLabels, datasets: [{ label: 'Persons', data: durationTotals, backgroundColor: '#fb923c', borderRadius: 6, maxBarThickness: 42 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, animation: false }} /></div><div className="footer"><span>Total duration records: {durationTotal.toLocaleString()}</span></div></div>
                    </div>
                )}

                {activeTab === 'demographics' && (
                    <div className="demographic-grid">
                        <div className="card tall-card"><h3 className="card-title">Age Profile of Migrants</h3>{!ageAltView ? <div className="chart-with-detail"><BreakdownPie labels={ageLabels} values={ageTotals} colors={['#06b6d4', '#3b82f6', '#8b5cf6', '#f97316', '#64748b']} onClick={function (_e, els) { if (els.length > 0) setSelectedAgeIndex(els[0].index); }} /><div className="inline-detail"><p className="inline-detail-title">Age Drilldown</p>{ageDrilldown ? <><p className="inline-detail-main">{ageDrilldown.title}</p><p className="inline-detail-text">{ageDrilldown.description}</p><p className="inline-detail-text">{ageDrilldown.value} ({ageDrilldown.share})</p></> : <p className="inline-detail-text">Click an age segment.</p>}</div></div> : <div className="alt-view-block"><p className="alt-view-title">Age Insight Summary</p><ul className="takeaway-list compact-list">{getTopN(ageRows, 3).map(function (row, i) { return <li key={row.label}>#{i + 1} {row.label}: {row.value.toLocaleString()} ({formatPercent(getShare(row.value, ageTotal))})</li>; })}</ul></div>}<div className="footer"><span>Total age records: {ageTotal.toLocaleString()}</span><button type="button" className="link-btn" onClick={() => setAgeAltView(!ageAltView)}>{ageAltView ? 'Back to chart' : 'View age insights'}</button></div></div>
                        <div className="card tall-card"><h3 className="card-title">Literacy / Education</h3>{!literacyAltView ? <BreakdownPie labels={['Literate', 'Illiterate']} values={[literatePersons, illiteratePersons]} colors={['#22c55e', '#ef4444']} /> : <div className="chart-box-tall"><Bar data={{ labels: ['Below Matric', 'Matric to < Graduate', 'Technical Diploma', 'Graduate+', 'Technical Degree'], datasets: [{ label: 'Males', data: educationMaleValues, backgroundColor: '#3b82f6', borderRadius: 5, maxBarThickness: 28 }, { label: 'Females', data: educationFemaleValues, backgroundColor: '#ec4899', borderRadius: 5, maxBarThickness: 28 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { beginAtZero: true } }, animation: false }} /></div>}<div className="footer"><span>Literate share: {formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))}</span><button type="button" className="link-btn" onClick={() => setLiteracyAltView(!literacyAltView)}>{literacyAltView ? 'Back to literacy split' : 'View education split'}</button></div></div>
                        <div className="card short-card"><h3 className="card-title">Economic Activity Profile</h3><div className="chart-box"><Bar data={{ labels: activityRows.map(function (row) { return row.label; }), datasets: [{ label: 'Other in category', data: activityOtherValues, backgroundColor: '#3b82f6', borderRadius: 5, maxBarThickness: 60 }, { label: 'Seeking for work', data: activitySeekingValues, backgroundColor: '#f97316', borderRadius: 5, maxBarThickness: 60 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }, animation: false }} onClick={function (_e, els) { if (els.length > 0) setSelectedActivityIndex(els[0].index); }} /></div><div className="inline-detail"><p className="inline-detail-title">Economic Drilldown</p>{activityDrilldown ? <><p className="inline-detail-main">{activityDrilldown.title}</p><p className="inline-detail-text">{activityDrilldown.description}</p></> : <p className="inline-detail-text">Click an activity category.</p>}</div></div>
                        <div className="card short-card"><h3 className="card-title">Marital Status Profile</h3><div className="chart-box"><Bar data={{ labels: maritalLabels, datasets: [{ label: 'Males', data: maritalMaleValues, backgroundColor: '#3b82f6', borderRadius: 5, maxBarThickness: 24 }, { label: 'Females', data: maritalFemaleValues, backgroundColor: '#ec4899', borderRadius: 5, maxBarThickness: 24 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }, animation: false }} /></div></div>
                    </div>
                )}

                {activeTab === 'drivers' && (
                    <div className="driver-grid">
                        <div className="card tall-card"><h3 className="card-title">Reasons of Migration</h3>{!reasonsAltView ? <div className="chart-with-detail"><BreakdownPie labels={reasonLabels} values={reasonTotals} colors={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b']} onClick={function (_e, els) { if (els.length > 0) setSelectedReasonIndex(els[0].index); }} /><div className="inline-detail"><p className="inline-detail-title">Reason Drilldown</p>{reasonDrilldown ? <><p className="inline-detail-main">{reasonDrilldown.title}</p><p className="inline-detail-text">{reasonDrilldown.description}</p><p className="inline-detail-text">{reasonDrilldown.value} ({reasonDrilldown.share})</p></> : <p className="inline-detail-text">Click a reason segment.</p>}</div></div> : <div className="alt-view-block"><p className="alt-view-title">Top Reasons</p><ul className="takeaway-list compact-list">{getTopN(reasonRows, 5).map(function (row, i) { return <li key={row.label}>#{i + 1} {row.label}: {row.value.toLocaleString()} ({formatPercent(getShare(row.value, reasonTotal))})</li>; })}</ul></div>}<div className="footer"><span>Total reason records: {reasonTotal.toLocaleString()}</span><button type="button" className="link-btn" onClick={() => setReasonsAltView(!reasonsAltView)}>{reasonsAltView ? 'Back to chart' : 'View ranked reasons'}</button></div></div>
                        <DrilldownPanel title="Detailed Reason Insight Panel" detail={reasonDrilldown} />
                        <div className="card short-card span-2"><h3 className="card-title">Top 10 Counterpart States</h3>{!counterpartAltView ? <div className="chart-box-tall">{top10Counterparts.length > 0 ? <Bar data={{ labels: top10Counterparts.map(function (r) { return r.name; }), datasets: [{ data: top10Counterparts.map(function (r) { return r.value; }), backgroundColor: flowType === 'inflow' ? '#3b82f6' : '#f97316', borderRadius: 6, maxBarThickness: 24 }] }} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } }, animation: false }} /> : <p className="no-data">No counterpart data available</p>}</div> : <div className="alt-view-block"><p className="alt-view-title">Corridor Concentration</p><ul className="takeaway-list compact-list"><li>Top 1 share: {formatPercent(getShare(driverMetrics.topCounterpart?.value || 0, totalFlow))}</li><li>Top 3 share: {formatPercent(driverMetrics.top3Share)}</li><li>Concentration level: {driverMetrics.concentrationLevel}</li></ul></div>}<div className="footer"><span>Driver summary: {driverMetrics.driverType}</span><button type="button" className="link-btn" onClick={() => setCounterpartAltView(!counterpartAltView)}>{counterpartAltView ? 'Back to chart' : 'View concentration insights'}</button></div></div>
                    </div>
                )}
            </section>
        </div>
    );
}

