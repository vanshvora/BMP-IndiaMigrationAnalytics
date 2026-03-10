import { useMemo } from 'react';
import { INDIAN_STATES_NORM } from '../utils/coordinates';
import './Sidebar.css';

// sidebar component with controls for the map
export default function Sidebar({
    flows,
    flowType,
    setFlowType,
    selectedState,
    threshold,
    setThreshold,
    onCollapse,
    onClearSelection,
    onMapAction,
    topFlowLimit,
    setTopFlowLimit,
    highlightTopCorridors,
    setHighlightTopCorridors,
    compareMode,
    onToggleCompareMode,
    stateA,
    stateB,
    onCompareStateSelect
}) {
    const stateOptions = useMemo(function () {
        return [...INDIAN_STATES_NORM].sort(function (a, b) { return a.localeCompare(b); });
    }, []);

    const relevantFlows = useMemo(function () {
        if (!selectedState) return [];

        const list = [];
        for (let i = 0; i < flows.length; i++) {
            const f = flows[i];
            if (f.count < threshold) continue;
            if (flowType === 'inflow' && f.destination === selectedState) {
                list.push(f);
            } else if (flowType === 'outflow' && f.origin === selectedState) {
                list.push(f);
            }
        }
        return list;
    }, [flows, flowType, selectedState, threshold]);

    const totalFlow = useMemo(function () {
        let total = 0;
        for (let i = 0; i < relevantFlows.length; i++) {
            total += Number(relevantFlows[i].count) || 0;
        }
        return total;
    }, [relevantFlows]);

    const topCounterpart = useMemo(function () {
        if (relevantFlows.length === 0) return null;

        let topFlow = relevantFlows[0];
        for (let i = 1; i < relevantFlows.length; i++) {
            if (relevantFlows[i].count > topFlow.count) {
                topFlow = relevantFlows[i];
            }
        }

        return {
            name: flowType === 'inflow' ? topFlow.origin : topFlow.destination,
            count: Number(topFlow.count) || 0
        };
    }, [relevantFlows, flowType]);

    const totalLabel = flowType === 'inflow' ? 'Total Inflow' : 'Total Outflow';
    const topCounterpartLabel = flowType === 'inflow' ? 'Top Source State' : 'Top Destination State';

    // TODO: Wire these values from D12 and D03 summaries when shared aggregates are available outside DataSection.
    const dominantAgeBand = selectedState ? 'Not wired yet' : '--';
    const dominantReason = selectedState ? 'Not wired yet' : '--';

    function handleTopFlowsChange(value) {
        setTopFlowLimit(value);
    }

    function handleResetMapView() {
        onMapAction?.('reset-view');
    }

    function handleFocusSelectedState() {
        if (!selectedState) return;
        onMapAction?.('focus-selected');
    }

    function handleHighlightTopCorridors() {
        setHighlightTopCorridors(function (prev) { return !prev; });
    }

    return (
        <div className="control-panel">
            <div className="panel-head">
                <h1 className="panel-heading">Control Panel</h1>
                <button
                    onClick={onCollapse}
                    className="collapse-btn"
                    title="Collapse sidebar"
                    type="button"
                >
                    <span className="arrow">{"<<"}</span>
                </button>
            </div>

            <section className="panel-card selected-context-card">
                <p className="section-label">Selected Context</p>
                <h2 className="selected-state">{selectedState || 'No state selected'}</h2>

                <div className="pill-group" role="tablist" aria-label="Flow type">
                    <button
                        onClick={() => setFlowType('inflow')}
                        className={`pill-btn ${flowType === 'inflow' ? 'is-active' : ''}`}
                        type="button"
                        role="tab"
                        aria-selected={flowType === 'inflow'}
                    >
                        Inflow
                    </button>
                    <button
                        onClick={() => setFlowType('outflow')}
                        className={`pill-btn ${flowType === 'outflow' ? 'is-active' : ''}`}
                        type="button"
                        role="tab"
                        aria-selected={flowType === 'outflow'}
                    >
                        Outflow
                    </button>
                </div>

                <p className="helper-text">
                    {compareMode
                        ? 'Select two states from map clicks or dropdowns'
                        : (selectedState
                            ? 'Click another state on the map to update'
                            : 'Select a state to explore migration flows')}
                </p>

                {compareMode && (
                    <div className="compare-picker-grid">
                        <div className="compare-picker-block">
                            <label className="compare-picker-label" htmlFor="state-a-picker">State A</label>
                            <select
                                id="state-a-picker"
                                className="compare-picker"
                                value={stateA || ''}
                                onChange={(e) => onCompareStateSelect?.(e.target.value || null, 'A')}
                            >
                                <option value="">Select State A</option>
                                {stateOptions.map(function (stateName) {
                                    return <option key={`state-a-${stateName}`} value={stateName}>{stateName}</option>;
                                })}
                            </select>
                        </div>
                        <div className="compare-picker-block">
                            <label className="compare-picker-label" htmlFor="state-b-picker">State B</label>
                            <select
                                id="state-b-picker"
                                className="compare-picker"
                                value={stateB || ''}
                                onChange={(e) => onCompareStateSelect?.(e.target.value || null, 'B')}
                            >
                                <option value="">Select State B</option>
                                {stateOptions.map(function (stateName) {
                                    return <option key={`state-b-${stateName}`} value={stateName}>{stateName}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                )}
            </section>

            <section className="panel-card">
                <p className="section-label">Quick Filters</p>

                <div className="filter-block">
                    <div className="filter-head">
                        <span className="filter-name">Minimum Migrants</span>
                        <span className="filter-value">{threshold.toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                        className="slider"
                        aria-label="Minimum migrants threshold"
                    />
                </div>

                <div className="filter-block">
                    <span className="filter-name">Top Flows</span>
                    <div className="segment-group" aria-label="Top flow limit">
                        <button
                            type="button"
                            className={`segment-btn ${topFlowLimit === '5' ? 'is-active' : ''}`}
                            onClick={() => handleTopFlowsChange('5')}
                        >
                            5
                        </button>
                        <button
                            type="button"
                            className={`segment-btn ${topFlowLimit === '10' ? 'is-active' : ''}`}
                            onClick={() => handleTopFlowsChange('10')}
                        >
                            10
                        </button>
                        <button
                            type="button"
                            className={`segment-btn ${topFlowLimit === 'all' ? 'is-active' : ''}`}
                            onClick={() => handleTopFlowsChange('all')}
                        >
                            All
                        </button>
                    </div>
                </div>
            </section>

            <section className="panel-card">
                <p className="section-label">Map Actions</p>
                <div className="action-grid">
                    <button
                        type="button"
                        className={`utility-btn span-two ${compareMode ? 'is-compare-active' : ''}`}
                        onClick={onToggleCompareMode}
                    >
                        {compareMode ? 'Exit Compare States' : 'Compare States'}
                    </button>
                    <button type="button" className="utility-btn" onClick={handleResetMapView}>
                        Reset Map View
                    </button>
                    <button
                        type="button"
                        className="utility-btn"
                        onClick={onClearSelection}
                        disabled={compareMode ? (!stateA && !stateB) : !selectedState}
                    >
                        Clear Selection
                    </button>
                    <button
                        type="button"
                        className="utility-btn"
                        onClick={handleFocusSelectedState}
                        disabled={!selectedState}
                    >
                        Focus Selected State
                    </button>
                    <button
                        type="button"
                        className={`utility-btn ${highlightTopCorridors ? 'is-highlighted' : ''}`}
                        onClick={handleHighlightTopCorridors}
                        disabled={!selectedState}
                    >
                        {highlightTopCorridors ? 'Highlight Mode On' : 'Highlight Top Corridors'}
                    </button>
                </div>
            </section>

            <section className="panel-card snapshot-card">
                <p className="section-label">Snapshot</p>

                <div className="snapshot-row">
                    <span>{totalLabel}</span>
                    <strong>{selectedState ? totalFlow.toLocaleString() : '--'}</strong>
                </div>

                <div className="snapshot-row">
                    <span>{topCounterpartLabel}</span>
                    <strong>
                        {topCounterpart
                            ? `${topCounterpart.name} (${topCounterpart.count.toLocaleString()})`
                            : (selectedState ? 'No flows above threshold' : '--')}
                    </strong>
                </div>

                <div className="snapshot-row">
                    <span>Dominant Age Band</span>
                    <strong>{dominantAgeBand}</strong>
                </div>

                <div className="snapshot-row">
                    <span>Dominant Migration Reason</span>
                    <strong>{dominantReason}</strong>
                </div>
            </section>
        </div>
    );
}

