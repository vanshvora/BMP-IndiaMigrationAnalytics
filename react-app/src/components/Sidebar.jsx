import { useMemo } from 'react';
import { INDIAN_STATES_NORM } from '../utils/coordinates';
import './Sidebar.css';

export default function Sidebar({
    flowType,
    setFlowType,
    selectedState,
    threshold,
    setThreshold,
    onCollapse,
    compareMode,
    onToggleCompareMode,
    stateA,
    stateB,
    onCompareStateSelect
}) {
    const stateOptions = useMemo(function () {
        return [...INDIAN_STATES_NORM].sort(function (a, b) { return a.localeCompare(b); });
    }, []);

    return (
        <div className="control-panel">
            <div className="panel-head">
                <div>
                    <p className="panel-heading">Compare State</p>
                    <h2 className="selected-state">{selectedState || 'No state selected'}</h2>
                </div>

                <div className="panel-head-actions">
                    <button
                        onClick={onCollapse}
                        className="icon-btn collapse-btn"
                        title="Collapse sidebar"
                        aria-label="Collapse sidebar"
                        type="button"
                    >
                        <i className="pi pi-chevron-left" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <section className="panel-card selected-context-card">
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

                <div className="filter-block">
                    <div className="filter-head">
                        <span className="filter-name">Minimum Migration</span>
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
            </section>

            <section className="panel-card">
                <div className="compare-row">
                    <p className="section-label">Compare State</p>
                </div>

                <div className="compare-mode-toggle" role="tablist" aria-label="Compare mode">
                    <button
                        type="button"
                        className={`compare-mode-btn ${!compareMode ? 'is-active' : ''}`}
                        onClick={() => {
                            if (compareMode) onToggleCompareMode();
                        }}
                        role="tab"
                        aria-selected={!compareMode}
                    >
                        Single
                    </button>
                    <button
                        type="button"
                        className={`compare-mode-btn ${compareMode ? 'is-active' : ''}`}
                        onClick={() => {
                            if (!compareMode) onToggleCompareMode();
                        }}
                        role="tab"
                        aria-selected={compareMode}
                    >
                        Compare
                    </button>
                </div>

                {compareMode ? (
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
                ) : (
                    <p className="compare-hint">Turn this on to pick two states from the map or dropdowns.</p>
                )}
            </section>
        </div>
    );
}
