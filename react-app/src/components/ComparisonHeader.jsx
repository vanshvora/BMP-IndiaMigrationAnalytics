export default function ComparisonHeader({ title = 'State Migration Comparison', stateA, stateB, flowType, totalFlowA, totalFlowB }) {
    return (
        <div className="comparison-header">
            <div className="comparison-header-row">
                <div className="comparison-header-copy">
                    <h2 className="comparison-title">{title}</h2>
                    <p className="comparison-pair">{stateA} vs {stateB}</p>
                    <p className="comparison-mode">
                        Comparing {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} using Census 2011 datasets
                    </p>
                </div>

                <div className="comparison-header-totals">
                    <p className="comparison-totals-label">Total Migrants</p>
                    <p className="comparison-totals">
                        {stateA} {Number(totalFlowA || 0).toLocaleString()}
                    </p>
                    <p className="comparison-totals">
                        {stateB} {Number(totalFlowB || 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
