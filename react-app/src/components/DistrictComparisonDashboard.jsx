import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import { loadCsv } from '../utils/loadCsv';
import { normalizeName } from '../utils/coordinates';
import { ChartInfoPopover, buildComparisonInsights, sumNumericValues } from './chartInfoUtils';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import ComparisonHeader from './ComparisonHeader';
import {
    DISTRICT_ACTIVITY_LABELS,
    DISTRICT_DURATION_LABELS,
    DISTRICT_EDUCATION_LABELS,
    DISTRICT_MARITAL_LABELS,
    DISTRICT_REASON_LABELS,
    computeDistrictMetrics,
} from '../utils/districtComparison';
import './DataSection.css';
import './ComparisonDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, chartValueLabelPlugin);
ChartJS.defaults.datasets.bar.categoryPercentage = 1.0;
ChartJS.defaults.datasets.bar.barPercentage = 1.0;

const COUNTERPART_COLORS = ['#0f766e', '#f97316'];
const DURATION_COLORS = ['#f59e0b', '#fb7185'];
const EDUCATION_COLORS = ['#16a34a', '#b45309'];
const ACTIVITY_COLORS = ['#0891b2', '#f59e0b'];
const MARITAL_COLORS = ['#7c3aed', '#d97706'];
const REASON_COLORS = ['#0f766e', '#d97706'];
const COUNTERPART_LIMIT = 6;

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

function ComparisonSummaryCard({ title, value, detail }) {
    return (
        <div className="card comparison-summary-card">
            <p className="summary-label">{title}</p>
            <p className="summary-value">{value}</p>
            <p className="summary-detail">{detail}</p>
        </div>
    );
}

function ComparisonInsightCard({ title, lead, items }) {
    return (
        <div className="card comparison-insight-card comparison-insight-primary">
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

function loadDistrictMetricCsv(url, setter, errorLabel) {
    loadCsv(url, function (row) {
        const parsed = { ...row, state: normalizeName(row.state), districtCode: Number(row.districtCode) || 0 };
        for (const key in parsed) {
            if (key === 'state' || key === 'district' || key === 'origin') continue;
            if (key === 'districtCode') continue;
            parsed[key] = Number(parsed[key]) || 0;
        }
        if (parsed.origin) parsed.origin = normalizeName(parsed.origin);
        return parsed;
    }, setter, function (err) { console.error(`${errorLabel} fetch error:`, err); }, Papa);
}

function getComparisonSentence(metricLabel, labelA, valueA, labelB, valueB, formatter, tieTolerance) {
    const diff = Math.abs(valueA - valueB);
    if (diff <= tieTolerance) return `${metricLabel}: ${labelA} and ${labelB} are nearly tied.`;
    if (valueA > valueB) return `${metricLabel}: ${labelA} leads (${formatter(valueA)} vs ${formatter(valueB)}).`;
    return `${metricLabel}: ${labelB} leads (${formatter(valueB)} vs ${formatter(valueA)}).`;
}

export default function DistrictComparisonDashboard({ records, threshold, districtA, districtB }) {
    const [openInfoId, setOpenInfoId] = useState(null);
    const [durationRows, setDurationRows] = useState([]);
    const [reasonRows, setReasonRows] = useState([]);
    const [educationRows, setEducationRows] = useState([]);
    const [activityRows, setActivityRows] = useState([]);
    const [maritalRows, setMaritalRows] = useState([]);

    useEffect(function () {
        loadDistrictMetricCsv('/district_duration_residence_flows.csv', setDurationRows, 'District D02');
        loadDistrictMetricCsv('/district_reason_migration_flows.csv', setReasonRows, 'District D03');
        loadDistrictMetricCsv('/district_education_levels.csv', setEducationRows, 'District D04');
        loadDistrictMetricCsv('/district_economic_activity.csv', setActivityRows, 'District D06');
        loadDistrictMetricCsv('/district_marital_status.csv', setMaritalRows, 'District D10');
    }, []);

    const districtAMetrics = useMemo(function () {
        return computeDistrictMetrics({ district: districtA, records, threshold, durationRows, reasonRows, educationRows, activityRows, maritalRows });
    }, [activityRows, districtA, durationRows, educationRows, maritalRows, reasonRows, records, threshold]);

    const districtBMetrics = useMemo(function () {
        return computeDistrictMetrics({ district: districtB, records, threshold, durationRows, reasonRows, educationRows, activityRows, maritalRows });
    }, [activityRows, districtB, durationRows, educationRows, maritalRows, reasonRows, records, threshold]);

    const labelA = districtAMetrics.label;
    const labelB = districtBMetrics.label;
    const shortA = districtA?.district || 'District A';
    const shortB = districtB?.district || 'District B';
    const topA = getTopN(districtAMetrics.counterpartRows, COUNTERPART_LIMIT);
    const topB = getTopN(districtBMetrics.counterpartRows, COUNTERPART_LIMIT);
    const mergedCounterpartLabels = Array.from(new Set(topA.concat(topB).map(function (row) { return row.name; })));
    const topCounterpartA = districtAMetrics.counterpartRows[0] || null;
    const topCounterpartB = districtBMetrics.counterpartRows[0] || null;
    const reasonRowsA = DISTRICT_REASON_LABELS.map(function (label, index) { return { label, value: districtAMetrics.reasonValues[index] || 0 }; });
    const reasonRowsB = DISTRICT_REASON_LABELS.map(function (label, index) { return { label, value: districtBMetrics.reasonValues[index] || 0 }; });
    const leadingReasonA = getTopN(reasonRowsA, 1)[0] || null;
    const leadingReasonB = getTopN(reasonRowsB, 1)[0] || null;
    const reasonTotalA = sumNumericValues(districtAMetrics.reasonValues);
    const reasonTotalB = sumNumericValues(districtBMetrics.reasonValues);
    const flowLeader = districtAMetrics.totalFlow >= districtBMetrics.totalFlow ? shortA : shortB;
    const flowLeaderValue = districtAMetrics.totalFlow >= districtBMetrics.totalFlow ? districtAMetrics.totalFlow : districtBMetrics.totalFlow;
    const flowGap = Math.abs(districtAMetrics.totalFlow - districtBMetrics.totalFlow);
    const literacyLeader = districtAMetrics.literacyRate >= districtBMetrics.literacyRate ? shortA : shortB;
    const literacyLeaderValue = districtAMetrics.literacyRate >= districtBMetrics.literacyRate ? districtAMetrics.literacyRate : districtBMetrics.literacyRate;
    const urbanLeader = districtAMetrics.urbanShare >= districtBMetrics.urbanShare ? shortA : shortB;
    const urbanLeaderValue = districtAMetrics.urbanShare >= districtBMetrics.urbanShare ? districtAMetrics.urbanShare : districtBMetrics.urbanShare;
    const femaleLeader = districtAMetrics.femaleShare >= districtBMetrics.femaleShare ? shortA : shortB;
    const femaleLeaderValue = districtAMetrics.femaleShare >= districtBMetrics.femaleShare ? districtAMetrics.femaleShare : districtBMetrics.femaleShare;
    const durationInfoItems = buildComparisonInsights(DISTRICT_DURATION_LABELS, districtAMetrics.durationTotals, districtBMetrics.durationTotals, 'duration', shortA, shortB);
    const educationInfoItems = buildComparisonInsights(DISTRICT_EDUCATION_LABELS, districtAMetrics.educationValues, districtBMetrics.educationValues, 'education', shortA, shortB);
    const activityInfoItems = buildComparisonInsights(DISTRICT_ACTIVITY_LABELS, districtAMetrics.activityValues, districtBMetrics.activityValues, 'economic activity', shortA, shortB);
    const reasonInfoItems = buildComparisonInsights(DISTRICT_REASON_LABELS, districtAMetrics.reasonValues, districtBMetrics.reasonValues, 'migration reason', shortA, shortB);
    const maritalInfoItems = buildComparisonInsights(DISTRICT_MARITAL_LABELS, districtAMetrics.maritalValues, districtBMetrics.maritalValues, 'marital status', shortA, shortB);

    return (
        <div className="wrapper comparison-dashboard">
            <ComparisonHeader
                title="District Migration Comparison"
                stateA={labelA}
                stateB={labelB}
                flowType="inflow"
                totalFlowA={districtAMetrics.totalFlow}
                totalFlowB={districtBMetrics.totalFlow}
            />

            <section className="comparison-grid comparison-summary-grid">
                <ComparisonSummaryCard title="Higher migration volume" value={flowLeader} detail={`${flowLeaderValue.toLocaleString()} migrants, gap of ${flowGap.toLocaleString()}`} />
                <ComparisonSummaryCard title="Stronger literacy profile" value={literacyLeader} detail={`${formatPercent(literacyLeaderValue)} literate migrants`} />
                <ComparisonSummaryCard title="More urban profile" value={urbanLeader} detail={`${formatPercent(urbanLeaderValue)} urban share`} />
                <ComparisonSummaryCard title="Higher female share" value={femaleLeader} detail={`${formatPercent(femaleLeaderValue)} female share`} />
            </section>

            <section className="comparison-section">
                <ComparisonInsightCard
                    title="Insights"
                    lead={getComparisonSentence('Migration volume', shortA, districtAMetrics.totalFlow, shortB, districtBMetrics.totalFlow, function (value) { return Number(value).toLocaleString(); }, 0)}
                    items={[
                        { label: `${shortA} top origin`, value: topCounterpartA ? topCounterpartA.name : 'No data' },
                        { label: `${shortB} top origin`, value: topCounterpartB ? topCounterpartB.name : 'No data' },
                        { label: `${shortA} leading reason`, value: leadingReasonA ? `${leadingReasonA.label} | ${formatPercent(getShare(leadingReasonA.value, reasonTotalA))}` : 'No data' },
                        { label: `${shortB} leading reason`, value: leadingReasonB ? `${leadingReasonB.label} | ${formatPercent(getShare(leadingReasonB.value, reasonTotalB))}` : 'No data' },
                        { label: 'Stronger literacy profile', value: `${literacyLeader} | ${formatPercent(literacyLeaderValue)}` },
                        { label: 'Higher female share', value: `${femaleLeader} | ${formatPercent(femaleLeaderValue)}` }
                    ]}
                />
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-3 comparison-grid-counterparts">
                    <div className="card">
                        <h3 className="card-title">{shortA} Top Origins</h3>
                        <div className="chart-box-tall">
                            {topA.length > 0 ? (
                                <Bar data={{ labels: topA.map(function (row) { return row.name; }), datasets: [{ label: shortA, data: topA.map(function (row) { return row.value; }), backgroundColor: COUNTERPART_COLORS[0], borderRadius: 6, maxBarThickness: 34 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }, animation: false }} />
                            ) : <p className="no-data">No origin data above threshold.</p>}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">Top Origins Comparison</h3>
                        <div className="chart-box">
                            {topA.length > 0 || topB.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: mergedCounterpartLabels,
                                        datasets: [
                                            { label: shortA, data: mergedCounterpartLabels.map(function (label) { const match = topA.find(function (row) { return row.name === label; }); return match ? match.value : 0; }), backgroundColor: COUNTERPART_COLORS[0], borderRadius: 6, maxBarThickness: 30 },
                                            { label: shortB, data: mergedCounterpartLabels.map(function (label) { const match = topB.find(function (row) { return row.name === label; }); return match ? match.value : 0; }), backgroundColor: COUNTERPART_COLORS[1], borderRadius: 6, maxBarThickness: 30 }
                                        ]
                                    }}
                                    options={stackedBarOptions}
                                />
                            ) : <p className="no-data">No origin data above threshold.</p>}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title">{shortB} Top Origins</h3>
                        <div className="chart-box-tall">
                            {topB.length > 0 ? (
                                <Bar data={{ labels: topB.map(function (row) { return row.name; }), datasets: [{ label: shortB, data: topB.map(function (row) { return row.value; }), backgroundColor: COUNTERPART_COLORS[1], borderRadius: 6, maxBarThickness: 34 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }, animation: false }} />
                            ) : <p className="no-data">No origin data above threshold.</p>}
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-2">
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="district-compare-duration" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={durationInfoItems} />
                        <h3 className="card-title">Duration of Stay</h3>
                        <div className="chart-box">
                            <Bar data={{ labels: DISTRICT_DURATION_LABELS, datasets: [{ label: shortA, data: districtAMetrics.durationTotals, backgroundColor: DURATION_COLORS[0], borderRadius: 5, maxBarThickness: 52 }, { label: shortB, data: districtBMetrics.durationTotals, backgroundColor: DURATION_COLORS[1], borderRadius: 5, maxBarThickness: 52 }] }} options={stackedBarOptions} />
                        </div>
                    </div>
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="district-compare-reason" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={reasonInfoItems} />
                        <h3 className="card-title">Reasons for Migration</h3>
                        <div className="chart-box">
                            <Bar data={{ labels: DISTRICT_REASON_LABELS, datasets: [{ label: shortA, data: districtAMetrics.reasonValues, backgroundColor: REASON_COLORS[0], borderRadius: 5, maxBarThickness: 52 }, { label: shortB, data: districtBMetrics.reasonValues, backgroundColor: REASON_COLORS[1], borderRadius: 5, maxBarThickness: 52 }] }} options={stackedBarOptions} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="comparison-section">
                <div className="comparison-grid comparison-grid-3">
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="district-compare-education" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={educationInfoItems} />
                        <h3 className="card-title">Education Levels</h3>
                        <div className="chart-box">
                            <Bar data={{ labels: DISTRICT_EDUCATION_LABELS, datasets: [{ label: shortA, data: districtAMetrics.educationValues, backgroundColor: EDUCATION_COLORS[0], borderRadius: 5, maxBarThickness: 52 }, { label: shortB, data: districtBMetrics.educationValues, backgroundColor: EDUCATION_COLORS[1], borderRadius: 5, maxBarThickness: 52 }] }} options={stackedBarOptions} />
                        </div>
                    </div>
                                        <div className="card card-with-info">
                        <ChartInfoPopover infoId="district-compare-activity" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={activityInfoItems} />
                        <h3 className="card-title">Economic Activity Profile</h3>
                        <div className="chart-box">
                            <Bar data={{ labels: DISTRICT_ACTIVITY_LABELS, datasets: [{ label: shortA, data: districtAMetrics.activityValues, backgroundColor: ACTIVITY_COLORS[0], borderRadius: 5, maxBarThickness: 64 }, { label: shortB, data: districtBMetrics.activityValues, backgroundColor: ACTIVITY_COLORS[1], borderRadius: 5, maxBarThickness: 64 }] }} options={stackedBarOptions} />
                        </div>
                    </div>
                    <div className="card card-with-info">
                        <ChartInfoPopover infoId="district-compare-marital" openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={maritalInfoItems} />
                        <h3 className="card-title">Marital Status Profile</h3>
                        <div className="chart-box">
                            <Bar data={{ labels: DISTRICT_MARITAL_LABELS, datasets: [{ label: shortA, data: districtAMetrics.maritalValues, backgroundColor: MARITAL_COLORS[0], borderRadius: 5, maxBarThickness: 52 }, { label: shortB, data: districtBMetrics.maritalValues, backgroundColor: MARITAL_COLORS[1], borderRadius: 5, maxBarThickness: 52 }] }} options={stackedBarOptions} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
