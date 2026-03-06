import { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Papa from 'papaparse';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';
import './DataSection.css';

// register chart.js components we need
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// horizontal bar chart for showing top/bottom states
function HorizontalBarChart({ data, maxValue, color, showHighest, onToggle }) {
    if (data.length === 0) {
        return <p className="no-data">No data available</p>;
    }

    return (
        <div>
            {/* toggle between highest and lowest */}
            <div className="sort-row">
                <div className="sort-btns">
                    <button
                        onClick={() => onToggle(false)}
                        className={'sort-btn ' + (!showHighest ? 'sort-active' : '')}
                    >
                        lowest
                    </button>
                    <button
                        onClick={() => onToggle(true)}
                        className={'sort-btn ' + (showHighest ? 'sort-active' : '')}
                    >
                        highest
                    </button>
                </div>
            </div>

            {/* the actual bars */}
            <div>
                {data.map((item, i) => (
                    <div key={i}>
                        <div className="label-row">
                            <span className="label-name">{item.name}</span>
                            <span className="label-num">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="progress-bg">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${Math.max(8, (item.value / maxValue) * 100)}%`,
                                    backgroundColor: color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// pie chart for showing male/female or urban/rural split
function BreakdownPie({ labels, values, colors }) {
    const total = values[0] + values[1];

    // chart.js data format
    const chartData = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 2,
            hoverOffset: 8,
        }]
    };

    // chart.js options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 12, weight: '500' },
                    // custom labels to show count and percentage
                    generateLabels: function (chart) {
                        const ds = chart.data.datasets[0];
                        return chart.data.labels.map(function (label, i) {
                            const val = ds.data[i];
                            let pct = 0;
                            if (total > 0) {
                                pct = ((val / total) * 100).toFixed(1);
                            }
                            return {
                                text: `${label}: ${val.toLocaleString()} (${pct}%)`,
                                fillStyle: ds.backgroundColor[i],
                                strokeStyle: ds.borderColor[i],
                                lineWidth: ds.borderWidth,
                                pointStyle: 'circle',
                                hidden: false,
                                index: i,
                            };
                        });
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const val = ctx.parsed;
                        let pct = 0;
                        if (total > 0) {
                            pct = ((val / total) * 100).toFixed(1);
                        }
                        return ` ${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            duration: 600,
        }
    };

    return (
        <div className="pie-box">
            <div className="pie-content">
                <Pie data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}

// main data section component - shows all the charts and tables
export default function DataSection({ flows, flowType, selectedState, threshold }) {
    const [showHighest, setShowHighest] = useState(true);
    const [showMigrationList, setShowMigrationList] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [ageRankMetric, setAgeRankMetric] = useState('youth');
    const [d02Data, setD02Data] = useState([]);
    const [d03Data, setD03Data] = useState([]);
    const [d12Data, setD12Data] = useState([]);

    // load D02 (duration data) and D03 (reasons data) csv files
    useEffect(() => {
        // load duration of stay data
        fetch('/D02_cleaned.csv')
            .then(function (r) { return r.text(); })
            .then(function (txt) {
                const result = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
                // normalize the state names so they match
                const rows = [];
                for (let i = 0; i < result.data.length; i++) {
                    const row = result.data[i];
                    rows.push({
                        ...row,
                        AreaName: normalizeName(row.AreaName),
                        Origin: normalizeName(row.Origin || row.LastResidence)
                    });
                }
                console.log('D02 data loaded:', rows.length);
                setD02Data(rows);
            })
            .catch(function (err) {
                console.error('D02 fetch error:', err);
                setD02Data([]);
            });

        // load reasons for migration data
        fetch('/D03_cleaned.csv')
            .then(function (r) { return r.text(); })
            .then(function (txt) {
                const result = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
                const rows = [];
                for (let i = 0; i < result.data.length; i++) {
                    const row = result.data[i];
                    rows.push({
                        ...row,
                        AreaName: normalizeName(row.AreaName),
                        Origin: normalizeName(row.Origin || row.LastResidence)
                    });
                }
                console.log('D03 cleaned data loaded:', rows.length);
                setD03Data(rows);
            })
            .catch(function (err) {
                console.error('D03 cleaned fetch error:', err);
                setD03Data([]);
            });

        // load age-wise migration data
        fetch('/D12_cleaned.csv')
            .then(function (r) { return r.text(); })
            .then(function (txt) {
                const result = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
                const rows = [];
                for (let i = 0; i < result.data.length; i++) {
                    const row = result.data[i];
                    const area = normalizeName(row.AreaName);
                    const origin = normalizeName(row.Origin || row.LastResidence);

                    // D12 guardrail: keep only domestic state-to-state rows
                    if (!INDIAN_STATES_NORM.includes(area)) continue;
                    if (!INDIAN_STATES_NORM.includes(origin)) continue;

                    rows.push({
                        ...row,
                        AreaName: area,
                        Origin: origin
                    });
                }
                console.log('D12 age data loaded:', rows.length);
                setD12Data(rows);
            })
            .catch(function (err) {
                console.error('D12 fetch error:', err);
                setD12Data([]);
            });
    }, []);

    // filter flows for the selected state and threshold
    const relevantFlows = [];
    for (let i = 0; i < flows.length; i++) {
        const f = flows[i];
        if (f.count < threshold) continue;
        if (flowType === 'inflow' && f.destination === selectedState) {
            relevantFlows.push(f);
        } else if (flowType === 'outflow' && f.origin === selectedState) {
            relevantFlows.push(f);
        }
    }

    // calculate totals
    let totalFlow = 0;
    let totalMale = 0;
    let totalFemale = 0;
    let totalRural = 0;
    let totalUrban = 0;
    for (let i = 0; i < relevantFlows.length; i++) {
        totalFlow += relevantFlows[i].count;
        totalMale += relevantFlows[i].male;
        totalFemale += relevantFlows[i].female;
        totalRural += relevantFlows[i].rural;
        totalUrban += relevantFlows[i].urban;
    }

    // sort flows for the bar chart
    const sortedByHighest = [...relevantFlows].sort((a, b) => b.count - a.count);
    const sortedByLowest = [...relevantFlows].sort((a, b) => a.count - b.count);

    const sortedFlows = showHighest ? sortedByHighest : sortedByLowest;

    // get top 5 states for the bar chart
    const top5 = [];
    for (let i = 0; i < Math.min(5, sortedFlows.length); i++) {
        const f = sortedFlows[i];
        top5.push({
            name: flowType === 'inflow' ? f.origin : f.destination,
            value: f.count
        });
    }

    // find the max value for scaling the bars
    let maxValue = 1;
    for (let i = 0; i < top5.length; i++) {
        if (top5[i].value > maxValue) {
            maxValue = top5[i].value;
        }
    }

    const chartTitle = `${showHighest ? 'Top' : 'Bottom'} State Origins`;
    const accent = flowType === 'inflow' ? '#3b82f6' : 'rgba(249, 115, 22, 0.78)';

    // check if a D02/D03 row matches the selected state
    function rowMatchesState(row) {
        if (!row) return false;
        if (flowType === 'inflow') {
            return row.AreaName === selectedState;
        } else {
            return row.Origin === selectedState;
        }
    }

    // helper to sum multiple numeric columns from one row
    function sumColumns(row, keys) {
        let sum = 0;
        for (let i = 0; i < keys.length; i++) {
            sum += Number(row[keys[i]]) || 0;
        }
        return sum;
    }

    // D12 should align with interstate logic used by map flows
    function rowMatchesStateD12(row) {
        if (!row) return false;
        if (row.AreaName === row.Origin) return false;
        if (flowType === 'inflow') {
            return row.AreaName === selectedState;
        } else {
            return row.Origin === selectedState;
        }
    }

    // ---- Duration of Stay data (D02) ----
    const durationKeys = ['Persons_LT1yr', 'Persons_1to4yr', 'Persons_5to9yr', 'Persons_10to19yr', 'Persons_20plusyr', 'Persons_DurNS'];
    const durationLabels = ['<1 yr', '1-4 yr', '5-9 yr', '10-19 yr', '20+ yr', 'Not stated'];

    // sum up duration values for the selected state
    const durationTotals = [];
    for (let k = 0; k < durationKeys.length; k++) {
        let sum = 0;
        for (let i = 0; i < d02Data.length; i++) {
            if (rowMatchesState(d02Data[i])) {
                sum += Number(d02Data[i][durationKeys[k]]) || 0;
            }
        }
        durationTotals.push(sum);
    }

    // ---- Reasons for Migration data (D03) ----
    const reasonLabels = ['Work', 'Business', 'Education', 'Marriage', 'Post-birth', 'With household', 'Other'];
    const reasonKeys = ['Persons_Work', 'Persons_Business', 'Persons_Education', 'Persons_Marriage', 'Persons_MoveAfterBirth', 'Persons_MoveWithHH', 'Persons_Other'];

    // total reasons
    const reasonTotals = [];
    for (let k = 0; k < reasonKeys.length; k++) {
        let sum = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) {
                sum += Number(d03Data[i][reasonKeys[k]]) || 0;
            }
        }
        reasonTotals.push(sum);
    }

    // male reasons
    const maleReasonKeys = ['Males_Work', 'Males_Business', 'Males_Education', 'Males_Marriage', 'Males_MoveAfterBirth', 'Males_MoveWithHH', 'Males_Other'];
    const maleReasonTotals = [];
    for (let k = 0; k < maleReasonKeys.length; k++) {
        let sum = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) {
                sum += Number(d03Data[i][maleReasonKeys[k]]) || 0;
            }
        }
        maleReasonTotals.push(sum);
    }

    // female reasons
    const femaleReasonKeys = ['Females_Work', 'Females_Business', 'Females_Education', 'Females_Marriage', 'Females_MoveAfterBirth', 'Females_MoveWithHH', 'Females_Other'];
    const femaleReasonTotals = [];
    for (let k = 0; k < femaleReasonKeys.length; k++) {
        let sum = 0;
        for (let i = 0; i < d03Data.length; i++) {
            if (rowMatchesState(d03Data[i])) {
                sum += Number(d03Data[i][femaleReasonKeys[k]]) || 0;
            }
        }
        femaleReasonTotals.push(sum);
    }

    // ---- Age Profile data (D12) ----
    const childrenAgeKeys = ['Persons_0to4', 'Persons_5to9', 'Persons_10to14'];
    const youthAgeKeys = ['Persons_15to19', 'Persons_20to24', 'Persons_25to29'];
    const workingAgeKeys = ['Persons_30to34', 'Persons_35to39', 'Persons_40to44', 'Persons_45to49', 'Persons_50to54', 'Persons_55to59'];
    const elderlyAgeKeys = ['Persons_60to64', 'Persons_65to69', 'Persons_70to74', 'Persons_75to79', 'Persons_80plus'];
    const ageNotStatedKeys = ['Persons_AgeNS'];

    const ageSegmentLabels = ['Children (0-14)', 'Youth (15-29)', 'Working Age (30-59)', 'Elderly (60+)', 'Not stated'];
    const ageSegmentTotals = [0, 0, 0, 0, 0];

    const counterpartAgeMap = {};
    for (let i = 0; i < d12Data.length; i++) {
        const row = d12Data[i];
        if (!rowMatchesStateD12(row)) continue;

        const children = sumColumns(row, childrenAgeKeys);
        const youth = sumColumns(row, youthAgeKeys);
        const working = sumColumns(row, workingAgeKeys);
        const elderly = sumColumns(row, elderlyAgeKeys);
        const ageNS = sumColumns(row, ageNotStatedKeys);

        ageSegmentTotals[0] += children;
        ageSegmentTotals[1] += youth;
        ageSegmentTotals[2] += working;
        ageSegmentTotals[3] += elderly;
        ageSegmentTotals[4] += ageNS;

        const counterpartState = flowType === 'inflow' ? row.Origin : row.AreaName;
        if (!counterpartAgeMap[counterpartState]) {
            counterpartAgeMap[counterpartState] = { youth: 0, elderly: 0 };
        }
        counterpartAgeMap[counterpartState].youth += youth;
        counterpartAgeMap[counterpartState].elderly += elderly;
    }

    const counterpartAgeRows = Object.entries(counterpartAgeMap).map(function ([state, metrics]) {
        return {
            state: state,
            youth: metrics.youth,
            elderly: metrics.elderly
        };
    });

    const topAgeCounterparts = counterpartAgeRows
        .sort(function (a, b) { return b[ageRankMetric] - a[ageRankMetric]; })
        .slice(0, 10);

    // if no state is selected, show a message
    if (!selectedState) {
        return (
            <div className="no-selection">
                <h2 className="no-sel-title">Select a State</h2>
                <p className="no-sel-text">Click on any state on the map to view detailed migration data.</p>
            </div>
        );
    }

    // telangana didnt exist in 2011 census
    if (selectedState === 'TELANGANA') {
        return (
            <div className="warning">
                <h2 className="warning-title">TELANGANA</h2>
                <div className="warning-box">
                    <p className="warning-bold">Data Not Available</p>
                    <p className="warning-msg">
                        Telangana was formed in June 2014. This data is from Census 2011.
                    </p>
                </div>
            </div>
        );
    }

    console.log('Selected state:', selectedState, 'flowType:', flowType);
    console.log('Duration totals:', durationTotals);
    console.log('Reason totals:', reasonTotals);

    // calculate some totals for the footer text
    let durationTotal = 0;
    for (let i = 0; i < durationTotals.length; i++) durationTotal += durationTotals[i];

    let reasonTotal = 0;
    for (let i = 0; i < reasonTotals.length; i++) reasonTotal += reasonTotals[i];

    let maleReasonTotal = 0;
    for (let i = 0; i < maleReasonTotals.length; i++) maleReasonTotal += maleReasonTotals[i];

    let femaleReasonTotal = 0;
    for (let i = 0; i < femaleReasonTotals.length; i++) femaleReasonTotal += femaleReasonTotals[i];

    let ageGrandTotal = 0;
    for (let i = 0; i < ageSegmentTotals.length; i++) ageGrandTotal += ageSegmentTotals[i];

    let topMetricTotal = 0;
    for (let i = 0; i < topAgeCounterparts.length; i++) {
        topMetricTotal += topAgeCounterparts[i][ageRankMetric];
    }

    const topMetricLabel = ageRankMetric === 'youth' ? 'Youth (15-29)' : 'Elderly (60+)';

    // calculate urban share percentage
    let urbanShare = 0;
    if ((totalUrban + totalRural) > 0) {
        urbanShare = ((totalUrban / (totalUrban + totalRural)) * 100).toFixed(1);
    }

    return (
        <div className="wrapper">
            <div className="header">
                <h2 className="state-name">{selectedState}</h2>
                <p className="subtitle">
                    Domestic {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} - Census 2011
                </p>
            </div>

            {/* total migration count */}
            <div className="total-box">
                <span className="total-tag">
                    Total {flowType === 'inflow' ? 'Inflow' : 'Outflow'}
                </span>
                <div className="total-num">
                    {totalFlow.toLocaleString()}
                </div>
            </div>

            {/* top row - bar chart, gender pie, urban/rural pie */}
            <div className="top-row">
                {/* bar chart with flip to migration list */}
                <div className="card tall-card">
                    <div className="flip-box">
                        <div className={'flip-inner ' + (showMigrationList ? 'flipped' : '')}>
                            {/* front side - bar chart */}
                            <div className="side">
                                <h3 className="card-title">{chartTitle}</h3>
                                <HorizontalBarChart
                                    data={top5}
                                    maxValue={maxValue}
                                    color={accent}
                                    showHighest={showHighest}
                                    onToggle={setShowHighest}
                                />
                                <div className="footer">
                                    <span>Total: {totalFlow.toLocaleString()}</span>
                                    <button className="link-btn" onClick={() => setShowMigrationList(true)}>
                                        See migration list
                                    </button>
                                </div>
                            </div>

                            {/* back side - full migration table */}
                            <div className="side back-side">
                                <h3 className="card-title">
                                    State Migration ({flowType === 'inflow' ? 'From' : 'To'})
                                </h3>
                                <div className="table-wrap table-area">
                                    <table className="table">
                                        <thead className="thead">
                                            <tr>
                                                <th className="th">State</th>
                                                <th className="th th-right">Migrants</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedByHighest.map((f, i) => (
                                                <tr key={i} className="tr">
                                                    <td className="td">
                                                        {flowType === 'inflow' ? f.origin : f.destination}
                                                    </td>
                                                    <td className="td td-right">
                                                        {f.count.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {sortedByHighest.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="empty-row">
                                                        No data above threshold
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="footer">
                                    <span>Rows: {sortedByHighest.length.toLocaleString()}</span>
                                    <button className="link-btn" onClick={() => setShowMigrationList(false)}>
                                        Back to top states
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* gender breakdown pie chart */}
                <div className="card tall-card">
                    <h3 className="card-title">Gender Breakdown</h3>
                    <BreakdownPie
                        labels={['Male', 'Female']}
                        values={[totalMale, totalFemale]}
                        colors={['#3b82f6', '#ec4899']}
                    />
                    <div className="footer">
                        <span>Total: {totalFlow.toLocaleString()}</span>
                        <span>M:F Ratio = {totalFemale > 0 ? (totalMale / totalFemale).toFixed(2) : 'N/A'}</span>
                    </div>
                </div>

                {/* urban vs rural pie chart */}
                <div className="card tall-card">
                    <h3 className="card-title">Urban / Rural Breakdown</h3>
                    <BreakdownPie
                        labels={['Urban', 'Rural']}
                        values={[totalUrban, totalRural]}
                        colors={['#8b5cf6', '#22c55e']}
                    />
                    <div className="footer">
                        <span>Total: {(totalUrban + totalRural).toLocaleString()}</span>
                        <span>Urban share: {urbanShare}%</span>
                    </div>
                </div>
            </div>

            {/* bottom row - duration bar chart and reasons pie/bar */}
            <div className="bottom-row">
                {/* duration of stay bar chart */}
                <div className="card short-card">
                    <h3 className="card-title">Duration of Stay</h3>
                    <div className="chart-box">
                        <Bar
                            data={{
                                labels: durationLabels,
                                datasets: [{
                                    label: 'Persons',
                                    data: durationTotals,
                                    backgroundColor: '#fb923c',
                                    maxBarThickness: 42,
                                    borderRadius: 6,
                                    categoryPercentage: 0.82,
                                    barPercentage: 0.95
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true } }
                            }}
                        />
                    </div>
                    <div className="footer">
                        <span>Total: {durationTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* reasons for migration - flips between total pie and male/female bar */}
                <div className="card short-card">
                    <div className="flip-box2">
                        <div className={'flip-inner2 ' + (showDetails ? 'flipped2' : '')}>
                            {/* front - total reasons pie chart */}
                            <div className="side2">
                                <h3 className="card-title">Reasons of Migration (Total)</h3>
                                <div className="chart-box">
                                    <Pie
                                        data={{
                                            labels: reasonLabels,
                                            datasets: [{
                                                data: reasonTotals,
                                                backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b']
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: 'bottom' } },
                                            animation: false
                                        }}
                                    />
                                </div>
                                <div className="footer">
                                    <span>Total: {reasonTotal.toLocaleString()}</span>
                                    <button className="link-btn" onClick={() => setShowDetails(true)}>
                                        See detailed breakdown
                                    </button>
                                </div>
                            </div>

                            {/* back - male vs female stacked bar chart */}
                            <div className="side2 back-side2">
                                <h3 className="card-title">Reasons of Migration (Male vs Female)</h3>
                                <div className="chart-box-tall">
                                    <Bar
                                        data={{
                                            labels: reasonLabels,
                                            datasets: [{
                                                label: 'Males',
                                                data: maleReasonTotals,
                                                backgroundColor: '#3b82f6',
                                                maxBarThickness: 32,
                                                borderRadius: 4,
                                                categoryPercentage: 0.82,
                                                barPercentage: 0.9
                                            }, {
                                                label: 'Females',
                                                data: femaleReasonTotals,
                                                backgroundColor: '#ec4899',
                                                maxBarThickness: 32,
                                                borderRadius: 4,
                                                categoryPercentage: 0.82,
                                                barPercentage: 0.9
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: true } },
                                            scales: {
                                                x: { stacked: true },
                                                y: { stacked: true, beginAtZero: true }
                                            },
                                            animation: false
                                        }}
                                    />
                                </div>
                                <div className="footer">
                                    <span>Total Males: {maleReasonTotal.toLocaleString()}</span>
                                    <span>Total Females: {femaleReasonTotal.toLocaleString()}</span>
                                    <button className="link-btn" onClick={() => setShowDetails(false)}>
                                        Back to total
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* third row - age profile from D12 */}
            <div className="age-row">
                <div className="card short-card">
                    <h3 className="card-title">Age Profile of Migrants (D12)</h3>
                    <div className="chart-box">
                        {ageGrandTotal > 0 ? (
                            <Pie
                                data={{
                                    labels: ageSegmentLabels,
                                    datasets: [{
                                        data: ageSegmentTotals,
                                        backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#f97316', '#64748b']
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } },
                                    animation: false
                                }}
                            />
                        ) : (
                            <p className="no-data">No age data available</p>
                        )}
                    </div>
                    <div className="footer">
                        <span>Total: {ageGrandTotal.toLocaleString()}</span>
                    </div>
                </div>

                <div className="card short-card">
                    <h3 className="card-title">Top 10 Counterpart States (Youth vs Elderly)</h3>
                    <div className="age-sort-row">
                        <div className="sort-btns">
                            <button
                                onClick={() => setAgeRankMetric('youth')}
                                className={'sort-btn ' + (ageRankMetric === 'youth' ? 'sort-active' : '')}
                            >
                                Youth
                            </button>
                            <button
                                onClick={() => setAgeRankMetric('elderly')}
                                className={'sort-btn ' + (ageRankMetric === 'elderly' ? 'sort-active' : '')}
                            >
                                Elderly
                            </button>
                        </div>
                    </div>
                    <div className="chart-box-tall">
                        {topAgeCounterparts.length > 0 ? (
                            <Bar
                                data={{
                                    labels: topAgeCounterparts.map((item) => item.state),
                                    datasets: [{
                                        label: 'Youth (15-29)',
                                        data: topAgeCounterparts.map((item) => item.youth),
                                        backgroundColor: '#3b82f6'
                                    }, {
                                        label: 'Elderly (60+)',
                                        data: topAgeCounterparts.map((item) => item.elderly),
                                        backgroundColor: '#f97316'
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y',
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: true } },
                                    scales: {
                                        x: { beginAtZero: true }
                                    },
                                    animation: false
                                }}
                            />
                        ) : (
                            <p className="no-data">No age comparison data available</p>
                        )}
                    </div>
                    <div className="footer">
                        <span>Ranked by: {topMetricLabel}</span>
                        <span>Top-10 total: {topMetricTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

