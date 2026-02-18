import { useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from './DataSection.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

// bar chart component
function HorizontalBarChart({ data, maxValue, color, showHighest, onToggle }) {
    if (data.length === 0) {
        return <p className={styles.barNoData}>No data available</p>;
    }

    return (
        <div>
            <div className={styles.barToggleRow}>
                <div className={styles.barToggleGroup}>
                    <button
                        onClick={() => onToggle(false)}
                        className={`${styles.barToggleBtn} ${!showHighest ? styles.barToggleBtnActive : ''}`}
                    >
                        lowest
                    </button>
                    <button
                        onClick={() => onToggle(true)}
                        className={`${styles.barToggleBtn} ${showHighest ? styles.barToggleBtnActive : ''}`}
                    >
                        highest
                    </button>
                </div>
            </div>
            <div>
                {data.map((item, i) => (
                    <div key={i}>
                        <div className={styles.barRow}>
                            <span className={styles.barName}>{item.name}</span>
                            <span className={styles.barValue}>{item.value.toLocaleString()}</span>
                        </div>
                        <div className={styles.barTrack}>
                            <div
                                className={styles.barFill}
                                style={{
                                    width: `${Math.max(2, (item.value / maxValue) * 100)}%`,
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

// pie chart component for two-value breakdowns
function BreakdownPie({ labels, values, colors }) {
    const total = values[0] + values[1];
    const data = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 2,
            hoverOffset: 8,
        }]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: { size: 12, weight: '500' },
                    generateLabels: (chart) => {
                        const ds = chart.data.datasets[0];
                        return chart.data.labels.map((label, i) => {
                            const val = ds.data[i];
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
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
                    label: (ctx) => {
                        const val = ctx.parsed;
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 260, margin: '0 auto' }}>
            <Pie data={data} options={options} />
        </div>
    );
}

export default function DataSection({ flows, flowType, selectedState, threshold }) {
    const [showHighest, setShowHighest] = useState(true);

    if (!selectedState) {
        return (
            <div className={styles.emptyState}>
                <h2 className={styles.emptyTitle}>Select a State</h2>
                <p className={styles.emptyText}>Click on any state on the map to view detailed migration data.</p>
            </div>
        );
    }

    // telangana wasnt a state in 2011
    if (selectedState === 'TELANGANA') {
        return (
            <div className={styles.noticeWrap}>
                <h2 className={styles.noticeTitle}>TELANGANA</h2>
                <div className={styles.noticeCard}>
                    <p className={styles.noticeStrong}>Data Not Available</p>
                    <p className={styles.noticeBody}>
                        Telangana was formed in June 2014. This data is from Census 2011.
                    </p>
                </div>
            </div>
        );
    }

    // filter flows for selected state
    const relevantFlows = flows.filter(f => {
        if (f.count < threshold) return false;
        return flowType === 'inflow' ? f.destination === selectedState : f.origin === selectedState;
    });

    const totalFlow = relevantFlows.reduce((sum, f) => sum + f.count, 0);
    const totalMale = relevantFlows.reduce((sum, f) => sum + f.male, 0);
    const totalFemale = relevantFlows.reduce((sum, f) => sum + f.female, 0);
    const totalRural = relevantFlows.reduce((sum, f) => sum + f.rural, 0);
    const totalUrban = relevantFlows.reduce((sum, f) => sum + f.urban, 0);

    const sortedByHighest = [...relevantFlows].sort((a, b) => b.count - a.count);
    const sortedByLowest = [...relevantFlows].sort((a, b) => a.count - b.count);

    const sortedFlows = showHighest ? sortedByHighest : sortedByLowest;
    const top5 = sortedFlows.slice(0, 5).map(f => ({
        name: flowType === 'inflow' ? f.origin : f.destination,
        value: f.count
    }));
    const maxValue = top5.length > 0 ? Math.max(...top5.map(d => d.value)) : 1;

    const chartTitle = `${showHighest ? 'Top' : 'Bottom'} State Origins`;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.stateTitle}>{selectedState}</h2>
                <p className={styles.subtitle}>
                    Domestic {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} • Census 2011
                </p>
            </div>

            {/* Total count card */}
            <div className={styles.totalCard}>
                <span className={styles.totalLabel}>
                    Total {flowType === 'inflow' ? 'Inflow' : 'Outflow'}
                </span>
                <div className={styles.totalValue}>
                    {totalFlow.toLocaleString()}
                </div>
            </div>

            <div className={styles.grid2}>
                {/* Bar Chart */}
                <div className={styles.panel}>
                    <h3 className={styles.panelTitle}>{chartTitle}</h3>
                    <HorizontalBarChart
                        data={top5}
                        maxValue={maxValue}
                        color="#2dd4bf"
                        showHighest={showHighest}
                        onToggle={setShowHighest}
                    />
                </div>

                {/* Data Table */}
                <div className={styles.tablePanel}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableHeaderTitle}>
                            State Migration ({flowType === 'inflow' ? 'From' : 'To'})
                        </h3>
                    </div>
                    <div className={styles.tableScroll}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th className={styles.th}>State</th>
                                    <th className={`${styles.th} ${styles.thRight}`}>Migrants</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedByHighest.map((f, i) => (
                                    <tr key={i} className={styles.tr}>
                                        <td className={styles.td}>
                                            {flowType === 'inflow' ? f.origin : f.destination}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdRight}`}>
                                            {f.count.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {sortedByHighest.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className={styles.noData}>
                                            No data above threshold
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Gender and Area Breakdown - Pie Charts */}
            <div className={styles.breakdownGrid}>
                {/* Male vs Female */}
                <div className={styles.panel}>
                    <h3 className={styles.panelTitle}>Gender Breakdown</h3>
                    <BreakdownPie
                        labels={['Male', 'Female']}
                        values={[totalMale, totalFemale]}
                        colors={['#3b82f6', '#ec4899']}
                    />
                    <div className={styles.breakdownFooter}>
                        <span>Total: {totalFlow.toLocaleString()}</span>
                        <span>M:F Ratio = {totalFemale > 0 ? (totalMale / totalFemale).toFixed(2) : 'N/A'}</span>
                    </div>
                </div>

                {/* Urban vs Rural */}
                <div className={styles.panel}>
                    <h3 className={styles.panelTitle}>Urban / Rural Breakdown</h3>
                    <BreakdownPie
                        labels={['Urban', 'Rural']}
                        values={[totalUrban, totalRural]}
                        colors={['#8b5cf6', '#22c55e']}
                    />
                    <div className={styles.breakdownFooter}>
                        <span>Total: {(totalUrban + totalRural).toLocaleString()}</span>
                        <span>Urban share: {(totalUrban + totalRural) > 0 ? ((totalUrban / (totalUrban + totalRural)) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
