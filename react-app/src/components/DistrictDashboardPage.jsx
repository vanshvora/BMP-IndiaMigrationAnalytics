import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import DistrictMapView from './DistrictMapView';
import DistrictDataSection from './DistrictDataSection';
import DistrictSidebar from './DistrictSidebar';
import DistrictMapPopup from './DistrictMapPopup';
import DistrictComparisonDashboard from './DistrictComparisonDashboard';
import { normalizeDistrictName } from '../utils/coordinates';
import { selectDistrictForComparison } from '../utils/districtComparison';
import { loadCsv } from '../utils/loadCsv';

const DATA_URL = '/district_interstate_flows.csv';

export default function DistrictDashboardPage({ initialCompareMode = false }) {
    const [records, setRecords] = useState([]);
    const [districtsByState, setDistrictsByState] = useState({});
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [threshold, setThreshold] = useState(100);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mapAction, setMapAction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [compareMode, setCompareMode] = useState(Boolean(initialCompareMode));
    const [districtA, setDistrictA] = useState(null);
    const [districtB, setDistrictB] = useState(null);

    useEffect(() => {
        loadCsv(
            DATA_URL,
            function (row) {
                return {
                    state: row.state,
                    district: row.district,
                    districtCode: Number(row.districtCode) || 0,
                    origin: row.origin,
                    count: Number(row.count) || 0,
                    male: Number(row.male) || 0,
                    female: Number(row.female) || 0,
                    rural: Number(row.rural) || 0,
                    urban: Number(row.urban) || 0,
                };
            },
            function (rows) {
                setRecords(rows);

                const grouped = {};
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    grouped[row.state] = grouped[row.state] || [];
                    const districtEntry = { district: row.district, districtCode: row.districtCode };
                    if (!grouped[row.state].some(function (item) { return item.district === districtEntry.district; })) {
                        grouped[row.state].push(districtEntry);
                    }
                }

                for (const stateName in grouped) {
                    grouped[stateName].sort(function (a, b) { return a.district.localeCompare(b.district); });
                }

                setDistrictsByState(grouped);
                setLoading(false);
            },
            function (err) {
                console.error('Error loading district migration data:', err);
                setLoading(false);
            },
            Papa
        );
    }, []);

    useEffect(() => {
        const active = compareMode ? Boolean(districtA?.district || districtB?.district) : Boolean(selectedDistrict);
        window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active } }));

        return function cleanupSelectionEvent() {
            window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active: false } }));
        };
    }, [compareMode, districtA, districtB, selectedDistrict]);

    const stateOptions = useMemo(function () {
        return Object.keys(districtsByState || {});
    }, [districtsByState]);

    const districtOptions = useMemo(function () {
        return (districtsByState[selectedState] || [])
            .map(function (item) { return item.district; })
            .sort(function (a, b) { return a.localeCompare(b); });
    }, [districtsByState, selectedState]);

    useEffect(() => {
        if (!selectedDistrict) return;
        if (districtOptions.includes(selectedDistrict)) return;
        setSelectedDistrict(null);
    }, [districtOptions, selectedDistrict]);

    const stateDistrictRecords = useMemo(function () {
        return records.filter(function (record) {
            return record.state === selectedState;
        });
    }, [records, selectedState]);

    const districtFlows = useMemo(function () {
        if (!selectedDistrict) return [];
        return stateDistrictRecords
            .filter(function (record) {
                return normalizeDistrictName(record.district) === normalizeDistrictName(selectedDistrict);
            })
            .sort(function (a, b) { return b.count - a.count; });
    }, [selectedDistrict, stateDistrictRecords]);

    const activeComparisonDistrict = compareMode
        ? (districtB?.district ? districtB : (districtA?.district ? districtA : null))
        : null;
    const activeDistrict = compareMode ? (activeComparisonDistrict?.district || selectedDistrict) : selectedDistrict;
    const activeState = compareMode ? (activeComparisonDistrict?.state || selectedState) : selectedState;
    const activeMapStates = useMemo(function () {
        if (!compareMode) return selectedState ? [selectedState] : [];
        return Array.from(new Set([districtA?.state, districtB?.state, selectedState].filter(Boolean)));
    }, [compareMode, districtA, districtB, selectedState]);
    const activeMapRecords = compareMode ? records : stateDistrictRecords;
    const activeDistrictFlows = useMemo(function () {
        if (!activeState || !activeDistrict) return [];
        return records
            .filter(function (record) {
                return record.state === activeState && normalizeDistrictName(record.district) === normalizeDistrictName(activeDistrict);
            })
            .sort(function (a, b) { return b.count - a.count; });
    }, [activeDistrict, activeState, records]);

    function getDistrictEntry(stateName, districtName) {
        if (!stateName || !districtName) return null;
        const match = (districtsByState[stateName] || []).find(function (item) {
            return normalizeDistrictName(item.district) === normalizeDistrictName(districtName);
        });
        return { state: stateName, district: districtName, districtCode: Number(match?.districtCode) || 0 };
    }

    function handleCompareDistrictSelect(nextDistrict, slot) {
        const next = selectDistrictForComparison({ districtA, districtB }, nextDistrict, slot);
        setDistrictA(next.districtA);
        setDistrictB(next.districtB);
        if (nextDistrict?.state) setSelectedState(nextDistrict.state);
        if (nextDistrict?.district) setSelectedDistrict(nextDistrict.district);
    }

    function handleDistrictClick(districtName, stateName = selectedState) {
        if (compareMode) {
            handleCompareDistrictSelect(getDistrictEntry(stateName, districtName));
            return;
        }
        setSelectedDistrict(districtName);
    }

    function handleToggleCompareMode() {
        if (!compareMode) {
            setCompareMode(true);
            setDistrictA(null);
            setDistrictB(null);
            setSelectedDistrict(null);
            return;
        }

        setCompareMode(false);
        setDistrictA(null);
        setDistrictB(null);
        setSelectedDistrict(null);
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-box">
                    <div className="spinner" />
                    <p className="loading-msg">Loading district migration data...</p>
                </div>
            </div>
        );
    }

    const showComparisonDashboard = compareMode && Boolean(districtA?.district) && Boolean(districtB?.district);

    return (
        <div className="content" style={{ '--flow-accent': '#0f766e' }}>
            <div className="map-section">
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    {sidebarOpen ? (
                        <div className="scroll-area">
                            <DistrictSidebar
                                selectedState={selectedState}
                                setSelectedState={setSelectedState}
                                selectedDistrict={selectedDistrict}
                                setSelectedDistrict={setSelectedDistrict}
                                threshold={threshold}
                                setThreshold={setThreshold}
                                onCollapse={() => setSidebarOpen(false)}
                                stateOptions={stateOptions}
                                districtOptions={districtOptions}
                                districtsByState={districtsByState}
                                compareMode={compareMode}
                                onToggleCompareMode={handleToggleCompareMode}
                                districtA={districtA}
                                districtB={districtB}
                                onCompareDistrictSelect={handleCompareDistrictSelect}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="expand-btn"
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <i className="pi pi-chevron-right chevron-icon" aria-hidden="true" />
                        </button>
                    )}
                </aside>

                <main className="map-area">
                    <div className="map-overlay-actions">
                        <button
                            type="button"
                            className="map-overlay-btn"
                            onClick={() => setMapAction({ type: 'reset-view', timestamp: Date.now() })}
                            title="Reset map view"
                            aria-label="Reset map view"
                        >
                            <i className="pi pi-compass" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="map-overlay-btn"
                            onClick={() => {
                                setSelectedState(null);
                                setSelectedDistrict(null);
                                setDistrictA(null);
                                setDistrictB(null);
                                setMapAction({ type: 'reset-view', timestamp: Date.now() });
                            }}
                            title="Clear state and district"
                            aria-label="Clear state and district"
                            disabled={!selectedState && !selectedDistrict && !districtA && !districtB}
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="map-overlay-btn"
                            onClick={() => setMapAction({ type: 'focus-selected', timestamp: Date.now() })}
                            title="Focus selected district"
                            aria-label="Focus selected district"
                            disabled={!activeDistrict}
                        >
                            <i className="pi pi-map-marker" aria-hidden="true" />
                        </button>
                    </div>

                    <DistrictMapView
                        selectedState={activeState}
                        selectedStates={activeMapStates}
                        onStateClick={(stateName) => {
                            setSelectedState(stateName);
                            if (!compareMode) setSelectedDistrict(null);
                        }}
                        selectedDistrict={activeDistrict}
                        onDistrictClick={handleDistrictClick}
                        flows={activeMapRecords}
                        threshold={threshold}
                        mapAction={mapAction}
                        compareMode={compareMode}
                        districtA={districtA}
                        districtB={districtB}
                    />

                    {/* District map preview popup — right side, vertically centered */}
                    <DistrictMapPopup
                        selectedState={activeState}
                        selectedDistrict={activeDistrict}
                        compareMode={compareMode}
                        districtA={districtA}
                        districtB={districtB}
                    />
                </main>
            </div>

            <div className="data-area">
                {showComparisonDashboard ? (
                    <DistrictComparisonDashboard
                        records={records}
                        threshold={threshold}
                        districtA={districtA}
                        districtB={districtB}
                    />
                ) : (
                    <DistrictDataSection
                        selectedState={activeState}
                        selectedDistrict={activeDistrict}
                        districtFlows={compareMode ? activeDistrictFlows : districtFlows}
                        threshold={threshold}
                    />
                )}
            </div>
        </div>
    );
}
