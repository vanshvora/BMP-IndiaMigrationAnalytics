import { useMemo } from 'react';
import './Sidebar.css';
import './DistrictSidebar.css';

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
}) {
    const sortedStates = useMemo(function () {
        return [...stateOptions].sort(function (a, b) { return a.localeCompare(b); });
    }, [stateOptions]);

    return (
        <div className="control-panel district-control-panel">
            <div className="panel-head">
                <div>
                    <p className="panel-heading">District Flows</p>
                    <h2 className="selected-state">{selectedDistrict || 'Pick a district'}</h2>
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
                <p className="district-note">
                    Select a state first from the India map or dropdown. Then choose a district to see all interstate inflow corridors above the current migration threshold.
                </p>
            </section>
        </div>
    );
}
