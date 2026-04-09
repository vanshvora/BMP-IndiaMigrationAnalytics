import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Papa from 'papaparse';
import { BreakdownPie } from './dashboardWidgets';
import { formatPercent, getShare, getTopN } from './dashboardInsights';
import { buildDistributionInsights, ChartInfoPopover } from './chartInfoUtils';
import { chartValueLabelPlugin } from '../utils/chartLabels';
import { normalizeDistrictName, normalizeName } from '../utils/coordinates';
import { loadCsv } from '../utils/loadCsv';
import MigrationInsightCard from './MigrationInsightCard';
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

function ChartPair({ pairIndex, mainTitle, splitTitle, tableName, mainContent, splitContent, mainFooter, splitFooter, footerNote, infoId, infoItems, openInfoId, setOpenInfoId }) {
    const reversed = pairIndex % 2 !== 0;
    return (
        <div className={`chart-pair-row ${reversed ? 'reversed' : ''}`}>
            <div className="chart-pair-main card-with-info">
                {infoId ? <ChartInfoPopover infoId={infoId} openInfoId={openInfoId} setOpenInfoId={setOpenInfoId} items={infoItems} /> : null}
                <h3 className="card-title">{mainTitle}</h3>
                <SourceTag tableName={tableName} />
                {mainContent}
                <div className="chart-pair-footer">{mainFooter}</div>
            </div>
            <div className="chart-pair-split">
                <h3 className="card-title">{splitTitle}</h3>
                <SourceTag tableName={tableName} />
                {splitContent}
                <div className="chart-pair-footer">{splitFooter}</div>
            </div>
        </div>
    );
}

export default function DistrictDataSection({ selectedState, selectedDistrict, districtFlows, threshold }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [openInfoId, setOpenInfoId] = useState(null);
    const [counterpartMode, setCounterpartMode] = useState('top');
    const [districtD02Rows, setDistrictD02Rows] = useState([]);
    const [districtD03Rows, setDistrictD03Rows] = useState([]);
    const [districtD04Rows, setDistrictD04Rows] = useState([]);
    const [districtD06Rows, setDistrictD06Rows] = useState([]);
    const [districtD10Rows, setDistrictD10Rows] = useState([]);

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

        loadCsv('/district_marital_status.csv', function (row) {
            return {
                state: normalizeName(row.state),
                district: row.district,
                districtCode: Number(row.districtCode) || 0,
                NeverMarried_Persons: Number(row.NeverMarried_Persons) || 0,
                NeverMarried_Males: Number(row.NeverMarried_Males) || 0,
                NeverMarried_Females: Number(row.NeverMarried_Females) || 0,
                CurrMarried_Persons: Number(row.CurrMarried_Persons) || 0,
                CurrMarried_Males: Number(row.CurrMarried_Males) || 0,
                CurrMarried_Females: Number(row.CurrMarried_Females) || 0,
                Widowed_Persons: Number(row.Widowed_Persons) || 0,
                Widowed_Males: Number(row.Widowed_Males) || 0,
                Widowed_Females: Number(row.Widowed_Females) || 0,
                Separated_Persons: Number(row.Separated_Persons) || 0,
                Separated_Males: Number(row.Separated_Males) || 0,
                Separated_Females: Number(row.Separated_Females) || 0,
                Divorced_Persons: Number(row.Divorced_Persons) || 0,
                Divorced_Males: Number(row.Divorced_Males) || 0,
                Divorced_Females: Number(row.Divorced_Females) || 0,
                Unspecified_Persons: Number(row.Unspecified_Persons) || 0,
                Unspecified_Males: Number(row.Unspecified_Males) || 0,
                Unspecified_Females: Number(row.Unspecified_Females) || 0,
            };
        }, setDistrictD10Rows, function (err) { console.error('District D10 fetch error:', err); }, Papa);
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
    const hasDurationData = durationTotal > 0;

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

    const matchingDistrictD10Row = useMemo(function () {
        if (!selectedState || !selectedDistrict) return null;
        for (let i = 0; i < districtD10Rows.length; i++) {
            const row = districtD10Rows[i];
            if (row.state !== selectedState) continue;
            if (selectedDistrictCode > 0 && row.districtCode === selectedDistrictCode) return row;
            if (selectedDistrictCode === 0 && normalizeDistrictName(row.district) === normalizeDistrictName(selectedDistrict)) return row;
        }
        return null;
    }, [districtD10Rows, selectedDistrict, selectedDistrictCode, selectedState]);

    const maritalRow = matchingDistrictD10Row || {};
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
    const maritalTotal = sumValues(maritalValues);
    const hasMaritalData = maritalTotal > 0;
    const sectionTabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'demographics', label: 'Demographics & Social Profile' },
        { key: 'drivers', label: 'Migration Drivers' }
    ];

    const durationInfoItems = buildDistributionInsights(durationLabels, durationTotals, durationMaleTotals, durationFemaleTotals, 'duration');
    const reasonInfoItems = buildDistributionInsights(reasonLabels, reasonTotals, reasonMaleTotals, reasonFemaleTotals, 'migration reason');
    const educationInfoItems = buildDistributionInsights(educationLabels, educationValues, educationMaleValues, educationFemaleValues, 'education');
    const activityInfoItems = buildDistributionInsights(activityLabels, activityValues, activityMaleValues, activityFemaleValues, 'economic activity');
    const maritalInfoItems = buildDistributionInsights(maritalLabels, maritalValues, maritalMaleValues, maritalFemaleValues, 'marital status');

    const counterpartDisplayRows = counterpartMode === 'top'
        ? getTopN(counterpartRows, 5)
        : [...counterpartRows].slice(-5).reverse();

    const topCounterpart = counterpartRows.length > 0 ? counterpartRows[0] : null;
    const femaleShare = formatPercent(getShare(totalFemale, totalFlow));
    const urbanShare = formatPercent(getShare(totalUrban, totalUrban + totalRural));
    const literacyShare = formatPercent(getShare(literatePersons, literatePersons + illiteratePersons));

    const leadingReason = getTopN(reasonLabels.map(function (label, index) { return { label: label, value: reasonTotals[index] }; }), 1)[0] || null;
    const topReasonShare = formatPercent(getShare(leadingReason?.value || 0, reasonTotal));

    const leadingDuration = getTopN(durationLabels.map(function (label, index) { return { label: label, value: durationTotals[index] }; }), 1)[0] || null;
    const durationShare = formatPercent(getShare(leadingDuration?.value || 0, durationTotal));

    // DistrictDataSection doesn't have age data (D12) yet, so we define these as null
    const leadingAge = null;
    const topAgeShare = null;

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

                <div className="section-tabs" role="tablist" aria-label="District dashboard sections">
                    {sectionTabs.map(function (tab) {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`section-tab ${isActive ? 'is-active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setOpenInfoId(null);
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'overview' ? (
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
                        </div>
                    </section>
                ) : null}

                {activeTab === 'overview' ? (
                    <section className="profile-grid">
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
                ) : null}

                {activeTab === 'overview' ? (
                    <section>
                        <MigrationInsightCard
                            title="General Migration Insight"
                            accent="#0f766e"
                            badge="District overview"
                            heroValue={totalFlow.toLocaleString()}
                            heroLabel={`total in-migrants`}
                            summary={topCounterpart
                                ? `${topCounterpart.name} is the strongest origin corridor with ${formatPercent(getShare(topCounterpart.value, totalFlow))} of all migrants. ${leadingReason ? `${leadingReason.label} leads migration reasons at ${topReasonShare}` : ''}${leadingAge ? `, while ${leadingAge.label.toLowerCase()} remains the biggest age band at ${topAgeShare}` : ''}. ${leadingDuration ? `Most migrants have stayed ${leadingDuration.label.toLowerCase()}, accounting for ${durationShare} of duration records.` : ''} The literacy rate among migrants is ${literacyShare}.`
                                : 'No strong corridor is available above the current threshold.'}
                            items={[
                                { label: 'Top origin share', value: topCounterpart ? `${topCounterpart.name} · ${formatPercent(getShare(topCounterpart.value, totalFlow))}` : '—' },
                                { label: '2nd counterpart', value: counterpartRows[1] ? `${counterpartRows[1].name} · ${formatPercent(getShare(counterpartRows[1].value, totalFlow))}` : '—' },
                                { label: 'Leading reason', value: leadingReason ? `${leadingReason.label} · ${topReasonShare}` : '—' },
                                { label: 'Leading duration', value: leadingDuration ? `${leadingDuration.label} · ${durationShare}` : '—' },
                                { label: 'Male migrants', value: totalMale.toLocaleString() },
                                { label: 'Female migrants', value: totalFemale.toLocaleString() },
                                { label: 'Female share', value: femaleShare },
                                { label: 'Urban share', value: urbanShare },
                                { label: 'Literacy rate', value: literacyShare },
                                { label: 'Total corridors', value: relevantFlows.length.toLocaleString() }
                            ]}
                        />
                    </section>
                ) : null}

                {(activeTab === 'drivers' || activeTab === 'demographics') ? (
                    <section className="charts-grid">
                        {activeTab === 'drivers' ? (
                            <ChartPair
                                pairIndex={0}
                                mainTitle="Duration of Stay"
                                splitTitle="Duration — Gender Split"
                                tableName="D02 District"
                                infoId="district-duration"
                                infoItems={durationInfoItems}
                                openInfoId={openInfoId}
                                setOpenInfoId={setOpenInfoId}
                                mainContent={
                                    <div className="chart-box">
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
                                }
                                splitContent={
                                    <div className="chart-box">
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
                                }
                                mainFooter={`Total duration records: ${durationTotal.toLocaleString()}`}
                                splitFooter="Gender split by duration"
                            />
                        ) : null}

                        {activeTab === 'demographics' ? (
                            <ChartPair
                                pairIndex={0}
                                mainTitle="Education Levels"
                                splitTitle="Education — Gender Split"
                                tableName="D04 District"
                                infoId="district-education-levels"
                                infoItems={educationInfoItems}
                                openInfoId={openInfoId}
                                setOpenInfoId={setOpenInfoId}
                                mainContent={
                                    <div className="chart-box">
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
                                }
                                splitContent={
                                    <div className="chart-box">
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
                                }
                                mainFooter={hasEducationData
                                    ? `Total records: ${educationTotal.toLocaleString()} | Literacy: ${formatPercent(getShare(literatePersons, literatePersons + illiteratePersons))}`
                                    : 'No education totals for this district'}
                                splitFooter="Gender split by education"
                            />
                        ) : null}
                    </section>
                ) : null}

                {(activeTab === 'drivers' || activeTab === 'demographics') ? (
                    <section className="three-chart-row">
                        {activeTab === 'drivers' ? (
                            <ChartPair
                                pairIndex={1}
                                mainTitle="Reason for Migration"
                                splitTitle="Reason — Gender Split"
                                tableName="D03 District"
                                infoId="district-migration-reason"
                                infoItems={reasonInfoItems}
                                openInfoId={openInfoId}
                                setOpenInfoId={setOpenInfoId}
                                mainContent={
                                    hasReasonData ? (
                                        <BreakdownPie
                                            labels={reasonLabels}
                                            values={reasonTotals}
                                            colors={['#0f766e', '#d97706', '#7c3aed', '#b45309', '#ea580c', '#65a30d', '#6b7280']}
                                        />
                                    ) : (
                                        <p className="no-data">No district reason data found for this selection.</p>
                                    )
                                }
                                splitContent={
                                    <div className="chart-box">
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
                                }
                                mainFooter={`Total reason records: ${reasonTotal.toLocaleString()}`}
                                splitFooter="Gender split by reason"
                            />
                        ) : null}

                        {activeTab === 'drivers' ? (
                            <ChartPair
                                pairIndex={2}
                                mainTitle="Economic Activity"
                                splitTitle="Activity — Gender Split"
                                tableName="D06 District"
                                infoId="district-economic-activity"
                                infoItems={activityInfoItems}
                                openInfoId={openInfoId}
                                setOpenInfoId={setOpenInfoId}
                                mainContent={
                                    <div className="chart-box">
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
                                }
                                splitContent={
                                    <div className="chart-box">
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
                                }
                                mainFooter={hasActivityData ? `Total records: ${activityTotal.toLocaleString()}` : 'No activity totals for this district'}
                                splitFooter="Gender split by activity"
                            />
                        ) : null}



                        {activeTab === 'demographics' ? (
                            <ChartPair
                                pairIndex={1}
                                mainTitle="Marital Status"
                                splitTitle="Marital — Gender Split"
                                tableName="D10 District"
                                infoId="district-marital-status"
                                infoItems={maritalInfoItems}
                                openInfoId={openInfoId}
                                setOpenInfoId={setOpenInfoId}
                                mainContent={
                                    <div className="chart-box">
                                        {hasMaritalData ? (
                                            <Bar
                                                data={{
                                                    labels: maritalLabels,
                                                    datasets: [{
                                                        label: 'Persons',
                                                        data: maritalValues,
                                                        backgroundColor: '#8b5cf6',
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
                                            <p className="no-data">No district marital-status data found for this selection.</p>
                                        )}
                                    </div>
                                }
                                splitContent={
                                    <div className="chart-box">
                                        {hasMaritalData ? (
                                            <Bar
                                                data={{
                                                    labels: maritalLabels,
                                                    datasets: [
                                                        { label: 'Male', data: maritalMaleValues, backgroundColor: '#2563eb', borderRadius: 8, maxBarThickness: 54 },
                                                        { label: 'Female', data: maritalFemaleValues, backgroundColor: '#ec4899', borderRadius: 8, maxBarThickness: 54 }
                                                    ]
                                                }}
                                                options={buildHorizontalStackedOptions()}
                                            />
                                        ) : (
                                            <p className="no-data">No district marital-status data found for this selection.</p>
                                        )}
                                    </div>
                                }
                                mainFooter={hasMaritalData ? `Total records: ${maritalTotal.toLocaleString()}` : 'No marital-status totals for this district'}
                                splitFooter="Gender split by marital status"
                            />
                        ) : null}
                    </section>
                ) : null}
            </div>
        </div>
    );
}
