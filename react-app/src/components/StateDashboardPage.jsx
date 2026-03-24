import { useEffect, useState } from 'react';
import MapView from './MapView';
import Sidebar from './Sidebar';
import DataSection from './DataSection';
import ComparisonDashboard from './ComparisonDashboard';
import { normalizeName, INDIAN_STATES_NORM } from '../utils/coordinates';

const DATA_URL = '/D01_cleaned.csv';

function processData(rawData) {
    const csvData = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const destRaw = row['AreaName'] || row['Area Name'] || '';
        const originRaw = row['BirthPlace'] || row['Birth place'] || '';

        const dest = normalizeName(destRaw);
        const origin = normalizeName(originRaw);

        const count = Number(row['Total_Persons'] || row['Total'] || 0) || 0;
        const male = Number(row['Total_Males'] || row['Male'] || 0) || 0;
        const female = Number(row['Total_Females'] || row['Female'] || 0) || 0;

        let rural = Number(row['Rural_Persons'] || row['Rural_Total'] || 0) || 0;
        if (rural === 0) {
            rural = (Number(row['Rural_Males'] || 0) || 0) + (Number(row['Rural_Females'] || 0) || 0);
        }

        let urban = Number(row['Urban_Persons'] || row['Urban_Total'] || 0) || 0;
        if (urban === 0) {
            urban = (Number(row['Urban_Males'] || 0) || 0) + (Number(row['Urban_Females'] || 0) || 0);
        }

        if (count <= 0) continue;
        if (origin === dest) continue;
        if (!INDIAN_STATES_NORM.includes(origin)) continue;
        if (!INDIAN_STATES_NORM.includes(dest)) continue;

        csvData.push({ origin, destination: dest, count, male, female, rural, urban });
    }

    return csvData;
}

export default function StateDashboardPage() {
    const [flows, setFlows] = useState([]);
    const [flowType, setFlowType] = useState('inflow');
    const [selectedState, setSelectedState] = useState(null);
    const [threshold, setThreshold] = useState(1000);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mapAction, setMapAction] = useState(null);
    const [topFlowLimit, setTopFlowLimit] = useState('10');
    const [highlightTopCorridors, setHighlightTopCorridors] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [stateA, setStateA] = useState(null);
    const [stateB, setStateB] = useState(null);

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch(DATA_URL);
                const csvText = await response.text();
                const Papa = await import('papaparse');
                Papa.default.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setFlows(processData(results.data));
                        setLoading(false);
                    }
                });
            } catch (err) {
                console.error('Error loading state migration data:', err);
                setLoading(false);
            }
        }

        loadData();
    }, []);

    useEffect(() => {
        const active = compareMode ? Boolean(stateA || stateB) : Boolean(selectedState);
        window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active } }));

        return function cleanupSelectionEvent() {
            window.dispatchEvent(new CustomEvent('selection-active-change', { detail: { active: false } }));
        };
    }, [compareMode, selectedState, stateA, stateB]);

    const handleCompareStateSelect = (state, slot) => {
        const nextState = state || null;

        if (slot === 'A') {
            if (!nextState) {
                if (stateB) {
                    setStateA(stateB);
                    setStateB(null);
                    return;
                }
                setStateA(null);
                return;
            }
            setStateA(nextState);
            if (nextState === stateB) setStateB(null);
            return;
        }

        if (slot === 'B') {
            if (!nextState || nextState === stateA) {
                setStateB(null);
                return;
            }
            setStateB(nextState);
            return;
        }

        if (!nextState) return;
        if (!stateA) {
            setStateA(nextState);
            return;
        }
        if (stateA === nextState) return;
        if (!stateB) {
            setStateB(nextState);
            return;
        }
        if (stateB === nextState) return;

        setStateA(stateB);
        setStateB(nextState);
    };

    const handleStateClick = (state) => {
        if (compareMode) {
            handleCompareStateSelect(state);
            return;
        }
        setSelectedState(state);
    };

    const handleClearSelection = () => {
        if (compareMode) {
            setStateA(null);
            setStateB(null);
            return;
        }
        setSelectedState(null);
    };

    const handleToggleCompareMode = () => {
        if (!compareMode) {
            setCompareMode(true);
            setStateA(null);
            setStateB(null);
            setSelectedState(null);
            return;
        }

        setCompareMode(false);
        setStateA(null);
        setStateB(null);
        setSelectedState(null);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-box">
                    <div className="spinner" />
                    <p className="loading-msg">Loading state migration data...</p>
                </div>
            </div>
        );
    }

    const accent = flowType === 'inflow' ? '#3b82f6' : 'rgba(249, 115, 22, 0.78)';
    const activeSelectedState = compareMode ? (stateA || stateB || null) : selectedState;
    const showComparisonDashboard = compareMode && Boolean(stateA) && Boolean(stateB);

    return (
        <div className="content" style={{ '--flow-accent': accent }}>
            <div className="map-section">
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    {sidebarOpen ? (
                        <div className="scroll-area">
                            <Sidebar
                                flows={flows}
                                flowType={flowType}
                                setFlowType={setFlowType}
                                selectedState={activeSelectedState}
                                threshold={threshold}
                                setThreshold={setThreshold}
                                onCollapse={() => setSidebarOpen(false)}
                                topFlowLimit={topFlowLimit}
                                setTopFlowLimit={setTopFlowLimit}
                                highlightTopCorridors={highlightTopCorridors}
                                setHighlightTopCorridors={setHighlightTopCorridors}
                                compareMode={compareMode}
                                onToggleCompareMode={handleToggleCompareMode}
                                stateA={stateA}
                                stateB={stateB}
                                onCompareStateSelect={handleCompareStateSelect}
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
                            onClick={handleClearSelection}
                            title="Clear selection"
                            aria-label="Clear selection"
                            disabled={compareMode ? (!stateA && !stateB) : !selectedState}
                        >
                            <i className="pi pi-times" aria-hidden="true" />
                        </button>
                    </div>

                    <MapView
                        flows={flows}
                        flowType={flowType}
                        selectedState={activeSelectedState}
                        onStateClick={handleStateClick}
                        threshold={threshold}
                        mapAction={mapAction}
                        topFlowLimit={topFlowLimit}
                        highlightTopCorridors={highlightTopCorridors}
                        compareMode={compareMode}
                        stateA={stateA}
                        stateB={stateB}
                    />
                </main>
            </div>

            <div id="data-section" className="data-area">
                {showComparisonDashboard ? (
                    <ComparisonDashboard
                        flows={flows}
                        flowType={flowType}
                        threshold={threshold}
                        stateA={stateA}
                        stateB={stateB}
                    />
                ) : (
                    <DataSection
                        key={`${activeSelectedState || 'none'}-${flowType}-${threshold}`}
                        flows={flows}
                        flowType={flowType}
                        selectedState={activeSelectedState}
                        threshold={threshold}
                    />
                )}
            </div>
        </div>
    );
}
