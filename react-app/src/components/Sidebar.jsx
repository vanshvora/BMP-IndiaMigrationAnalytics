import styles from './Sidebar.module.css';

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
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Controls</h1>
                <button
                    onClick={onCollapse}
                    className={styles.collapseBtn}
                    title="Collapse sidebar"
                >
                    <span className={styles.collapseIcon}>«</span>
                </button>
            </div>

            {/* Flow direction toggle */}
            <div className={styles.section}>
                <label className={styles.label}>View Context</label>
                <div className={styles.toggleGroup}>
                    <button
                        onClick={() => setFlowType('inflow')}
                        className={`${styles.toggleBtn} ${flowType === 'inflow' ? styles.toggleBtnActive : ''}`}
                    >
                        Inflow
                    </button>
                    <button
                        onClick={() => setFlowType('outflow')}
                        className={`${styles.toggleBtn} ${flowType === 'outflow' ? styles.toggleBtnActive : ''}`}
                    >
                        Outflow
                    </button>
                </div>
            </div>

            {/* Threshold slider */}
            <div className={styles.section}>
                <label className={styles.label}>Filter</label>
                <div>
                    <div className={styles.rowBetween}>
                        <span className={styles.rowText}>Min. Migrants</span>
                        <span className={styles.rowValue}>{threshold.toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        className={styles.range}
                    />
                </div>
            </div>

            <hr className={styles.divider} />

            {/* Show selected state */}
            <div className={styles.body}>
                {selectedState ? (
                    <div>
                        <h2 className={styles.selectedTitle}>{selectedState}</h2>
                    </div>
                ) : (
                    <div className={styles.emptyHint}>
                        Click on a state on the map to view flows.
                    </div>
                )}
            </div>
        </div>
    );
}
