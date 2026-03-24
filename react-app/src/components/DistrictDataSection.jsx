import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { BreakdownPie } from './dashboardWidgets';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import './DataSection.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, chartValueLabelPlugin);

function SourceTag({ tableName }) {
    return <p className="source-tag">Table: {tableName}</p>;
}

export default function DistrictDataSection({ selectedState, selectedDistrict, districtFlows, threshold }) {
    const [counterpartMode, setCounterpartMode] = useState('top');

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
            </div>
        </div>
    );
}
