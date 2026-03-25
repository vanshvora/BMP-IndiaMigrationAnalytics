import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import DistrictMapView from './DistrictMapView';
import DistrictDataSection from './DistrictDataSection';
import DistrictSidebar from './DistrictSidebar';
import DistrictMapPopup from './DistrictMapPopup';
import { normalizeDistrictName } from '../utils/coordinates';
import { loadCsv } from '../utils/loadCsv';

const DATA_URL = '/district_interstate_flows.csv';

export default function DistrictDashboardPage() {
    const [records, setRecords] = useState([]);
    const [districtsByState, setDistrictsByState] = useState({});
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [threshold, setThreshold] = useState(100);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mapAction, setMapAction] = useState(null);
    const [loading, setLoading] = useState(true);

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
        const active = Boolean(selectedDistrict);
        window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active } }));

        return function cleanupSelectionEvent() {
            window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active: false } }));
        };
    }, [selectedDistrict]);

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
                                setMapAction({ type: 'reset-view', timestamp: Date.now() });
                            }}
                            title="Clear state and district"
                            aria-label="Clear state and district"
                            disabled={!selectedState && !selectedDistrict}
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="map-overlay-btn"
                            onClick={() => setMapAction({ type: 'focus-selected', timestamp: Date.now() })}
                            title="Focus selected district"
                            aria-label="Focus selected district"
                            disabled={!selectedDistrict}
                        >
                            <i className="pi pi-map-marker" aria-hidden="true" />
                        </button>
                    </div>

                    <DistrictMapView
                        selectedState={selectedState}
                        onStateClick={(stateName) => {
                            setSelectedState(stateName);
                            setSelectedDistrict(null);
                        }}
                        selectedDistrict={selectedDistrict}
                        onDistrictClick={setSelectedDistrict}
                        flows={stateDistrictRecords}
                        threshold={threshold}
                        mapAction={mapAction}
                    />

                    {/* District map preview popup — right side, vertically centered */}
                    <DistrictMapPopup
                        selectedState={selectedState}
                        selectedDistrict={selectedDistrict}
                    />
                </main>
            </div>

            <div className="data-area">
                <DistrictDataSection
                    selectedState={selectedState}
                    selectedDistrict={selectedDistrict}
                    districtFlows={districtFlows}
                    threshold={threshold}
                />
            </div>
        </div>
    );
}
