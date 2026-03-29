import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Papa from 'papaparse';
import { BreakdownPie } from './dashboardWidgets';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import { normalizeDistrictName, normalizeName } from '../utils/coordinates';
import { loadCsv } from '../utils/loadCsv';
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
        plugins: { legend: { position: 'bottom' } },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true }
        },
        animation: false
    };
}

function SourceTag({ tableName }) {
    return <p className="source-tag">Table: {tableName}</p>;
}

export default function DistrictDataSection({ selectedState, selectedDistrict, districtFlows, threshold }) {
    const [counterpartMode, setCounterpartMode] = useState('top');
    const [durationFlipped, setDurationFlipped] = useState(false);
    const [educationFlipped, setEducationFlipped] = useState(false);
    const [reasonFlipped, setReasonFlipped] = useState(false);
    const [activityFlipped, setActivityFlipped] = useState(false);
    const [districtD02Rows, setDistrictD02Rows] = useState([]);
    const [districtD03Rows, setDistrictD03Rows] = useState([]);
    const [districtD04Rows, setDistrictD04Rows] = useState([]);
    const [districtD06Rows, setDistrictD06Rows] = useState([]);

    useEffect(function () {
        loadCsv('/district_duration_residence_flows.csv', function (row) {
            return {
                state: normalizeName(row.state),
                district: row.district,
                districtCode: Number(row.districtCode) || 0,
                origin: normalizeName(row.origin),
                Persons_Total: Number(row.Persons_Total) || 0,
                Males_Total: Number(row.Males_Total) || 0,
                Females_Total: Number(row.Females_Total) || 0,
                Persons_LT1yr: Number(row.Persons_LT1yr) || 0,
                Males_LT1yr: Number(row.Males_LT1yr) || 0,
                Females_LT1yr: Number(row.Females_LT1yr) || 0,
                Persons_1to4yr: Number(row.Persons_1to4yr) || 0,
                Males_1to4yr: Number(row.Males_1to4yr) || 0,
                Females_1to4yr: Number(row.Females_1to4yr) || 0,
                Persons_5to9yr: Number(row.Persons_5to9yr) || 0,
                Males_5to9yr: Number(row.Males_5to9yr) || 0,
                Females_5to9yr: Number(row.Females_5to9yr) || 0,
                Persons_10to19yr: Number(row.Persons_10to19yr) || 0,
                Males_10to19yr: Number(row.Males_10to19yr) || 0,
                Females_10to19yr: Number(row.Females_10to19yr) || 0,
                Persons_20plusyr: Number(row.Persons_20plusyr) || 0,
                Males_20plusyr: Number(row.Males_20plusyr) || 0,
                Females_20plusyr: Number(row.Females_20plusyr) || 0,
                Persons_DurNS: Number(row.Persons_DurNS) || 0,
                Males_DurNS: Number(row.Males_DurNS) || 0,
                Females_DurNS: Number(row.Females_DurNS) || 0,
            };
        }, setDistrictD02Rows, function (err) { console.error('District D02 fetch error:', err); }, Papa);

        loadCsv('/district_education_levels.csv', function (row) {
            return {
                state: normalizeName(row.state),
                district: row.district,
                districtCode: Number(row.districtCode) || 0,
                Illiterate_Persons: Number(row.Illiterate_Persons) || 0,
                Illiterate_Males: Number(row.Illiterate_Males) || 0,
                Illiterate_Females: Number(row.Illiterate_Females) || 0,
                Literate_Persons: Number(row.Literate_Persons) || 0,
                Literate_Males: Number(row.Literate_Males) || 0,
                Literate_Females: Number(row.Literate_Females) || 0,
                BelowMatric_Persons: Number(row.BelowMatric_Persons) || 0,
                BelowMatric_Males: Number(row.BelowMatric_Males) || 0,
                BelowMatric_Females: Number(row.BelowMatric_Females) || 0,
                MatricToGrad_Persons: Number(row.MatricToGrad_Persons) || 0,
                MatricToGrad_Males: Number(row.MatricToGrad_Males) || 0,
                MatricToGrad_Females: Number(row.MatricToGrad_Females) || 0,
                TechDiploma_Persons: Number(row.TechDiploma_Persons) || 0,
                TechDiploma_Males: Number(row.TechDiploma_Males) || 0,
                TechDiploma_Females: Number(row.TechDiploma_Females) || 0,
                Graduate_Persons: Number(row.Graduate_Persons) || 0,
                Graduate_Males: Number(row.Graduate_Males) || 0,
                Graduate_Females: Number(row.Graduate_Females) || 0,
                TechDegree_Persons: Number(row.TechDegree_Persons) || 0,
                TechDegree_Males: Number(row.TechDegree_Males) || 0,
                TechDegree_Females: Number(row.TechDegree_Females) || 0,
            };
        }, setDistrictD04Rows, function (err) { console.error('District D04 fetch error:', err); }, Papa);

        loadCsv('/district_reason_migration_flows.csv', function (row) {
            return {
                state: normalizeName(row.state),
                district: row.district,
                districtCode: Number(row.districtCode) || 0,
                origin: normalizeName(row.origin),
                Persons_Total: Number(row.Persons_Total) || 0,
                Males_Total: Number(row.Males_Total) || 0,
                Females_Total: Number(row.Females_Total) || 0,
                Persons_Work: Number(row.Persons_Work) || 0,
                Males_Work: Number(row.Males_Work) || 0,
                Females_Work: Number(row.Females_Work) || 0,
                Persons_Business: Number(row.Persons_Business) || 0,
                Males_Business: Number(row.Males_Business) || 0,
                Females_Business: Number(row.Females_Business) || 0,
                Persons_Education: Number(row.Persons_Education) || 0,
                Males_Education: Number(row.Males_Education) || 0,
                Females_Education: Number(row.Females_Education) || 0,
                Persons_Marriage: Number(row.Persons_Marriage) || 0,
                Males_Marriage: Number(row.Males_Marriage) || 0,
                Females_Marriage: Number(row.Females_Marriage) || 0,
                Persons_MoveAfterBirth: Number(row.Persons_MoveAfterBirth) || 0,
                Males_MoveAfterBirth: Number(row.Males_MoveAfterBirth) || 0,
                Females_MoveAfterBirth: Number(row.Females_MoveAfterBirth) || 0,
                Persons_MoveWithHH: Number(row.Persons_MoveWithHH) || 0,
                Males_MoveWithHH: Number(row.Males_MoveWithHH) || 0,
                Females_MoveWithHH: Number(row.Females_MoveWithHH) || 0,
                Persons_Other: Number(row.Persons_Other) || 0,
                Males_Other: Number(row.Males_Other) || 0,
                Females_Other: Number(row.Females_Other) || 0,
            };
        }, setDistrictD03Rows, function (err) { console.error('District D03 fetch error:', err); }, Papa);

        loadCsv('/district_economic_activity.csv', function (row) {
            return {
                state: normalizeName(row.state),
                district: row.district,
                districtCode: Number(row.districtCode) || 0,
                MainWorkers_Persons: Number(row.MainWorkers_Persons) || 0,
                MainWorkers_Males: Number(row.MainWorkers_Males) || 0,
                MainWorkers_Females: Number(row.MainWorkers_Females) || 0,
                MarginalWorkers_Persons: Number(row.MarginalWorkers_Persons) || 0,
                MarginalWorkers_Males: Number(row.MarginalWorkers_Males) || 0,
                MarginalWorkers_Females: Number(row.MarginalWorkers_Females) || 0,
                MarginalSeeking_Persons: Number(row.MarginalSeeking_Persons) || 0,
                MarginalSeeking_Males: Number(row.MarginalSeeking_Males) || 0,
                MarginalSeeking_Females: Number(row.MarginalSeeking_Females) || 0,
                NonWorkers_Persons: Number(row.NonWorkers_Persons) || 0,
                NonWorkers_Males: Number(row.NonWorkers_Males) || 0,
                NonWorkers_Females: Number(row.NonWorkers_Females) || 0,
                NonWorkersSeeking_Persons: Number(row.NonWorkersSeeking_Persons) || 0,
                NonWorkersSeeking_Males: Number(row.NonWorkersSeeking_Males) || 0,
                NonWorkersSeeking_Females: Number(row.NonWorkersSeeking_Females) || 0,
            };
        }, setDistrictD06Rows, function (err) { console.error('District D06 fetch error:', err); }, Papa);
    }, []);

    const relevantFlows = useMemo(function () {
        return districtFlows.filter(function (row) {
            return Number(row.count) >= threshold;
        });
    }, [districtFlows, threshold]);

    const counterpartRows = useMemo(function () {
        return relevantFlows
            .map(function (row) {
                return { name: row.origin, value: Number(row.count) || 0 };
            })
            .sort(function (a, b) { return b.value - a.value; });
    }, [relevantFlows]);

    const totalFlow = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.count) || 0); }, 0);
    const totalMale = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.male) || 0); }, 0);
    const totalFemale = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.female) || 0); }, 0);
    const totalUrban = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.urban) || 0); }, 0);
    const totalRural = relevantFlows.reduce(function (sum, row) { return sum + (Number(row.rural) || 0); }, 0);
    const selectedDistrictCode = districtFlows.length > 0 ? (Number(districtFlows[0].districtCode) || 0) : 0;

    const matchingDistrictD02Rows = useMemo(function () {
        if (!selectedState || !selectedDistrict) return [];
        return districtD02Rows.filter(function (row) {
            if (row.state !== selectedState) return false;
            if (selectedDistrictCode > 0) return row.districtCode === selectedDistrictCode;
            return normalizeDistrictName(row.district) === normalizeDistrictName(selectedDistrict);
        });
    }, [districtD02Rows, selectedDistrict, selectedDistrictCode, selectedState]);

    const durationLabels = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];
    const durationKeys = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
    const durationMaleKeys = ['Males_LT1yr', 'Males_1to4yr', 'Males_5to9yr', 'Males_10to19yr', 'Males_20plusyr', 'Males_DurNS'];
    const durationFemaleKeys = ['Females_LT1yr', 'Females_1to4yr', 'Females_5to9yr', 'Females_10to19yr', 'Females_20plusyr', 'Females_DurNS'];

    const durationTotals = durationKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD02Rows.length; i++) total += Number(matchingDistrictD02Rows[i][key]) || 0;
        return total;
    });
    const durationMaleTotals = durationMaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD02Rows.length; i++) total += Number(matchingDistrictD02Rows[i][key]) || 0;
        return total;
    });
    const durationFemaleTotals = durationFemaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD02Rows.length; i++) total += Number(matchingDistrictD02Rows[i][key]) || 0;
        return total;
    });
    const durationTotal = sumValues(durationTotals);

    const matchingDistrictD04Row = useMemo(function () {
        if (!selectedState || !selectedDistrict) return null;
        for (let i = 0; i < districtD04Rows.length; i++) {
            const row = districtD04Rows[i];
            if (row.state !== selectedState) continue;
            if (selectedDistrictCode > 0 && row.districtCode === selectedDistrictCode) return row;
            if (selectedDistrictCode === 0 && normalizeDistrictName(row.district) === normalizeDistrictName(selectedDistrict)) return row;
        }
        return null;
    }, [districtD04Rows, selectedDistrict, selectedDistrictCode, selectedState]);

    const educationRow = matchingDistrictD04Row || {};
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
    const hasDurationData = durationTotal > 0;
    const educationTotal = sumValues(educationValues);
    const hasEducationData = educationTotal > 0 || literatePersons > 0 || illiteratePersons > 0;

    const matchingDistrictD03Rows = useMemo(function () {
        if (!selectedState || !selectedDistrict) return [];
        return districtD03Rows.filter(function (row) {
            if (row.state !== selectedState) return false;
            if (selectedDistrictCode > 0) return row.districtCode === selectedDistrictCode;
            return normalizeDistrictName(row.district) === normalizeDistrictName(selectedDistrict);
        });
    }, [districtD03Rows, selectedDistrict, selectedDistrictCode, selectedState]);

    const reasonLabels = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
    const reasonPersonKeys = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];
    const reasonMaleKeys = ['Males_Work', 'Males_Business', 'Males_Education', 'Males_Marriage', 'Males_MoveAfterBirth', 'Males_MoveWithHH', 'Males_Other'];
    const reasonFemaleKeys = ['Females_Work', 'Females_Business', 'Females_Education', 'Females_Marriage', 'Females_MoveAfterBirth', 'Females_MoveWithHH', 'Females_Other'];
    const reasonTotals = reasonPersonKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD03Rows.length; i++) total += Number(matchingDistrictD03Rows[i][key]) || 0;
        return total;
    });
    const reasonMaleTotals = reasonMaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD03Rows.length; i++) total += Number(matchingDistrictD03Rows[i][key]) || 0;
        return total;
    });
    const reasonFemaleTotals = reasonFemaleKeys.map(function (key) {
        let total = 0;
        for (let i = 0; i < matchingDistrictD03Rows.length; i++) total += Number(matchingDistrictD03Rows[i][key]) || 0;
        return total;
    });
    const reasonTotal = sumValues(reasonTotals);
    const hasReasonData = reasonTotal > 0;

    const matchingDistrictD06Row = useMemo(function () {
        if (!selectedState || !selectedDistrict) return null;
        for (let i = 0; i < districtD06Rows.length; i++) {
            const row = districtD06Rows[i];
            if (row.state !== selectedState) continue;
            if (selectedDistrictCode > 0 && row.districtCode === selectedDistrictCode) return row;
            if (selectedDistrictCode === 0 && normalizeDistrictName(row.district) === normalizeDistrictName(selectedDistrict)) return row;
        }
        return null;
    }, [districtD06Rows, selectedDistrict, selectedDistrictCode, selectedState]);

    const activityRow = matchingDistrictD06Row || {};
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
    const activityTotal = sumValues(activityValues);
    const hasActivityData = activityTotal > 0;

    const counterpartDisplayRows = counterpartMode === 'top'
        ? getTopN(counterpartRows, 5)
        : [...counterpartRows].slice(-5).reverse();

    if (!selectedState) {
        return (
            <div className="wrapper">
                <section className="no-selection">
                    <h2 className="no-sel-title">Select a State</h2>
                    <p className="no-sel-text">Choose a state from the India map first, then pick a district to inspect its interstate inflow profile.</p>
                </section>
            </div>
        );
    }

    if (!selectedDistrict) {
        return (
            <div className="wrapper">
                <section className="no-selection">
                    <h2 className="no-sel-title">Select a District</h2>
                    <p className="no-sel-text">Now choose a district in {selectedState} from the map or dropdown to show its origin-state corridors.</p>
                </section>
            </div>
        );
    }

    return (
        <div className="wrapper">
            <div className="single-dashboard">
            <section className="header-row">
                <div>
                    <h2 className="state-name">{selectedDistrict}</h2>
                    <p className="subtitle">District interstate in-migration in {selectedState} - Census 2011</p>
                </div>

                <div className="total-box">
                    <span className="total-tag">Total Inflow</span>
                    <div className="total-num">{totalFlow.toLocaleString()}</div>
                </div>
            </section>

            <section className="card counterpart-card">
                <div className="counterpart-head">
                    <div>
                        <h3 className="card-title">Top / Bottom 5 Origin States</h3>
                        <SourceTag tableName="D01 District Flows" />
                        <p className="counterpart-subtitle">Where migrants into {selectedDistrict} are coming from</p>
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
                                            backgroundColor: '#0f766e',
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
                                <p className="no-data">No origin-state corridors meet the current threshold.</p>
                            )}
                        </div>
                    </div>

                    <div className="counterpart-list">
                        {counterpartRows.map(function (row, index) {
                            return (
                                <div className={`list-row ${counterpartDisplayRows.some(function (item) { return item.name === row.name; }) ? 'is-highlighted' : ''}`} key={row.name}>
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

            <section className="profile-grid two-up">
                <div className="card compact-card">
                    <h3 className="card-title">Male / Female</h3>
                    <SourceTag tableName="D01 District Flows" />
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
                    <SourceTag tableName="D01 District Flows" />
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
            </section>

            <section className="charts-grid">
                <div className="card compact-card duration-card">
                    <h3 className="card-title">Duration of Stay</h3>
                    <SourceTag tableName="D02 District" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${durationFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    {hasDurationData ? (
                                        <Bar
                                            data={{
                                                labels: durationLabels,
                                                datasets: [{
                                                    label: 'Persons',
                                                    data: durationTotals,
                                                    backgroundColor: '#f59e0b',
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
                                    ) : (
                                        <p className="no-data">No district duration data found for this selection.</p>
                                    )}
                                </div>
                            </div>

                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    {hasDurationData ? (
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
                                    ) : (
                                        <p className="no-data">No district duration data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>{durationFlipped ? 'Gender split by duration' : `Total duration records: ${durationTotal.toLocaleString()}`}</span>
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => setDurationFlipped(function (value) { return !value; })}
                            disabled={!hasDurationData}
                        >
                            {durationFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Education Levels</h3>
                    <SourceTag tableName="D04 District" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${educationFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    {hasEducationData ? (
                                        <Bar
                                            data={{
                                                labels: educationLabels,
                                                datasets: [{
                                                    label: 'Persons',
                                                    data: educationValues,
                                                    backgroundColor: '#16a34a',
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
                                    ) : (
                                        <p className="no-data">No district education data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    {hasEducationData ? (
                                        <Bar
                                            data={{
                                                labels: educationLabels,
                                                datasets: [
                                                    { label: 'Male', data: educationMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 54 },
                                                    { label: 'Female', data: educationFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 54 }
                                                ]
                                            }}
                                            options={buildHorizontalStackedOptions()}
                                        />
                                    ) : (
                                        <p className="no-data">No district education data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>
                            {hasEducationData
                                ? `Total records: ${educationTotal.toLocaleString()} | Literacy: ${formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))}`
                                : 'No education totals for this district'}
                        </span>
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => setEducationFlipped(function (value) { return !value; })}
                            disabled={!hasEducationData}
                        >
                            {educationFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>
            </section>

            <section className="three-chart-row">
                <div className="card compact-card">
                    <h3 className="card-title">Reason for Migration</h3>
                    <SourceTag tableName="D03 District" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${reasonFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                {hasReasonData ? (
                                    <BreakdownPie
                                        labels={reasonLabels}
                                        values={reasonTotals}
                                        colors={['#0f766e', '#d97706', '#7c3aed', '#b45309', '#ea580c', '#65a30d', '#6b7280']}
                                    />
                                ) : (
                                    <p className="no-data">No district reason data found for this selection.</p>
                                )}
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    {hasReasonData ? (
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
                                    ) : (
                                        <p className="no-data">No district reason data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>{reasonFlipped ? 'Gender split by reason' : `Total reason records: ${reasonTotal.toLocaleString()}`}</span>
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => setReasonFlipped(function (value) { return !value; })}
                            disabled={!hasReasonData}
                        >
                            {reasonFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Economic Activity</h3>
                    <SourceTag tableName="D06 District" />
                    <div className="flip-box social-flip-box">
                        <div className={`flip-inner ${activityFlipped ? 'flipped' : ''}`}>
                            <div className="side">
                                <div className="chart-box social-chart">
                                    {hasActivityData ? (
                                        <Bar
                                            data={{
                                                labels: activityLabels,
                                                datasets: [{
                                                    label: 'Persons',
                                                    data: activityValues,
                                                    backgroundColor: '#14b8a6',
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
                                    ) : (
                                        <p className="no-data">No district activity data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                            <div className="side back-side">
                                <div className="chart-box social-chart">
                                    {hasActivityData ? (
                                        <Bar
                                            data={{
                                                labels: activityLabels,
                                                datasets: [
                                                    { label: 'Male', data: activityMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 72 },
                                                    { label: 'Female', data: activityFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 72 }
                                                ]
                                            }}
                                            options={buildHorizontalStackedOptions()}
                                        />
                                    ) : (
                                        <p className="no-data">No district activity data found for this selection.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <span>{hasActivityData ? `Total records: ${activityTotal.toLocaleString()}` : 'No activity totals for this district'}</span>
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => setActivityFlipped(function (value) { return !value; })}
                            disabled={!hasActivityData}
                        >
                            {activityFlipped ? 'Show main chart' : 'Show gender split'}
                        </button>
                    </div>
                </div>

                <div className="card compact-card">
                    <h3 className="card-title">Literate / Illiterate</h3>
                    <SourceTag tableName="D04 District" />
                    {hasEducationData ? (
                        <>
                            <BreakdownPie
                                labels={['Literate', 'Illiterate']}
                                values={[literatePersons, illiteratePersons]}
                                colors={['#16a34a', '#ef4444']}
                            />
                            <div className="footer">
                                <span>Literate: {formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))}</span>
                                <span>Illiterate: {formatPercent(getShare(illiteratePersons, literatePersons + illiteratePersons))}</span>
                            </div>
                        </>
                    ) : (
                        <p className="no-data">No district education data found for this selection.</p>
                    )}
                </div>
            </section>
            </div>
        </div>
    );
}
