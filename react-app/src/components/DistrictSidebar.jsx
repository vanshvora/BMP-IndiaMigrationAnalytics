import { useMemo } from 'react';
import './Sidebar.css';
import './DistrictSidebar.css';

function CompareDistrictPicker({ slot, value, sortedStates, districtsByState, onCompareDistrictSelect }) {
    const slotState = value?.state || '';
    const slotDistricts = (districtsByState?.[slotState] || [])
        .map(function (item) { return item.district; })
        .sort(function (a, b) { return a.localeCompare(b); });

    function buildDistrictEntry(stateName, districtName) {
        if (!stateName) return null;
        if (!districtName) return { state: stateName, district: null, districtCode: 0 };
        const match = (districtsByState?.[stateName] || []).find(function (item) {
            return item.district === districtName;
        });
        return { state: stateName, district: districtName, districtCode: Number(match?.districtCode) || 0 };
    }

    return (
        <div className="compare-picker-block">
            <label className="compare-picker-label" htmlFor={`district-${slot.toLowerCase()}-state-picker`}>District {slot} State</label>
            <select
                id={`district-${slot.toLowerCase()}-state-picker`}
                className="compare-picker"
                value={slotState}
                onChange={(event) => onCompareDistrictSelect?.(buildDistrictEntry(event.target.value || null, ''), slot)}
            >
                <option value="">Select state</option>
                {sortedStates.map(function (stateName) {
                    return <option key={`${slot}-state-${stateName}`} value={stateName}>{stateName}</option>;
                })}
            </select>

            <label className="compare-picker-label" htmlFor={`district-${slot.toLowerCase()}-picker`}>District {slot}</label>
            <select
                id={`district-${slot.toLowerCase()}-picker`}
                className="compare-picker"
                value={value?.district || ''}
                onChange={(event) => onCompareDistrictSelect?.(buildDistrictEntry(slotState, event.target.value || null), slot)}
                disabled={!slotState}
            >
                <option value="">{slotState ? `Select District ${slot}` : 'Select state first'}</option>
                {slotDistricts.map(function (districtName) {
                    return <option key={`${slot}-district-${districtName}`} value={districtName}>{districtName}</option>;
                })}
            </select>
        </div>
    );
}

export default function DistrictSidebar({
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    threshold,
    setThreshold,
    onCollapse,
    stateOptions,
    districtOptions,
    districtsByState,
    compareMode,
    onToggleCompareMode,
    districtA,
    districtB,
    onCompareDistrictSelect,
}) {
    const sortedStates = useMemo(function () {
        return [...stateOptions].sort(function (a, b) { return a.localeCompare(b); });
    }, [stateOptions]);

    return (
        <div className={`control-panel district-control-panel ${compareMode ? 'district-control-panel--compare' : ''}`}>
            <div className="panel-head">
                <div>
                    <p className="panel-heading">{compareMode ? 'Compare District' : 'District Flows'}</p>
                    <h2 className="selected-state">{compareMode ? (districtA?.district || districtB?.district || 'Pick districts') : (selectedDistrict || 'Pick a district')}</h2>
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
                {!compareMode ? (
                    <>
                        <div className="district-filter-block">
                            <label className="district-label" htmlFor="district-state-picker">State</label>
                            <select
                                id="district-state-picker"
                                className="district-picker"
                                value={selectedState || ''}
                                onChange={(e) => {
                                    setSelectedState(e.target.value || null);
                                    setSelectedDistrict(null);
                                }}
                            >
                                <option value="">Select a state from map or dropdown</option>
                                {sortedStates.map(function (stateName) {
                                    return <option key={stateName} value={stateName}>{stateName}</option>;
                                })}
                            </select>
                        </div>

                        <div className="district-filter-block">
                            <label className="district-label" htmlFor="district-picker">District</label>
                            <select
                                id="district-picker"
                                className="district-picker"
                                value={selectedDistrict || ''}
                                onChange={(e) => setSelectedDistrict(e.target.value || null)}
                                disabled={!selectedState}
                            >
                                <option value="">{selectedState ? 'Select a district from map or dropdown' : 'Select state first'}</option>
                                {districtOptions.map(function (districtName) {
                                    return <option key={districtName} value={districtName}>{districtName}</option>;
                                })}
                            </select>
                            <div className="district-inline-head">
                                <span className="district-label">Available Districts</span>
                                <span className="district-chip">{districtOptions.length}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="compare-picker-grid">
                        <CompareDistrictPicker slot="A" value={districtA} sortedStates={sortedStates} districtsByState={districtsByState} onCompareDistrictSelect={onCompareDistrictSelect} />
                        <CompareDistrictPicker slot="B" value={districtB} sortedStates={sortedStates} districtsByState={districtsByState} onCompareDistrictSelect={onCompareDistrictSelect} />
                    </div>
                )}

                <div className="filter-block">
                    <div className="filter-head">
                        <span className="filter-name">Minimum Migration</span>
                        <span className="filter-value">{threshold.toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50000"
                        step="250"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                        className="slider"
                        aria-label="Minimum migrants threshold"
                    />
                </div>
            </section>

            <section className="panel-card">
                <div className="compare-row">
                    <p className="section-label">Compare District</p>
                </div>

                <div className="compare-mode-toggle" role="tablist" aria-label="District compare mode">
                    <button
                        type="button"
                        className={`compare-mode-btn ${!compareMode ? 'is-active' : ''}`}
                        onClick={() => {
                            if (compareMode) onToggleCompareMode?.();
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
                            if (!compareMode) onToggleCompareMode?.();
                        }}
                        role="tab"
                        aria-selected={compareMode}
                    >
                        Compare
                    </button>
                </div>

                {!compareMode ? (
                    <p className="district-note">
                        Select a state first from the India map or dropdown. Then choose a district to see all interstate inflow corridors above the current migration threshold.
                    </p>
                ) : null}
            </section>
        </div>
    );
}
