import './Sidebar.css';

// sidebar component with controls for the map
export default function Sidebar({
    flows,
    flowType,
    setFlowType,
    selectedState,
    threshold,
    setThreshold,
    onCollapse
}) {
    return (
        <div className="wrapper">
            <div className="top">
                <h1 className="heading">Controls</h1>
                <button
                    onClick={onCollapse}
                    className="hide-btn"
                    title="Collapse sidebar"
                >
                    <span className="arrow">{"<<"}</span>
                </button>
            </div>

            {/* toggle between inflow and outflow */}
            <div className="group">
                <label className="label">View Context</label>
                <div className="tabs">
                    <button
                        onClick={() => setFlowType('inflow')}
                        className={`tab ${flowType === 'inflow' ? 'active' : ''}`}
                    >
                        Inflow
                    </button>
                    <button
                        onClick={() => setFlowType('outflow')}
                        className={`tab ${flowType === 'outflow' ? 'active' : ''}`}
                    >
                        Outflow
                    </button>
                </div>
            </div>

            {/* slider to set minimum migrant threshold */}
            <div className="group">
                <label className="label">Filter</label>
                <div>
                    <div className="row">
                        <span className="row-label">Min. Migrants</span>
                        <span className="row-num">{threshold.toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        className="slider"
                    />
                </div>
            </div>

            <hr className="line" />

            {/* show which state is currently selected */}
            <div className="body">
                {selectedState ? (
                    <div>
                        <h2 className="state-name">{selectedState}</h2>
                    </div>
                ) : (
                    <div className="hint">
                        Click on a state on the map to view flows.
                    </div>
                )}
            </div>
        </div>
    );
}

