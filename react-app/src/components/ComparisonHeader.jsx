export default function ComparisonHeader({ stateA, stateB, flowType }) {
    return (
        <div className="comparison-header">
            <h2 className="comparison-title">State Migration Comparison</h2>
            <p className="comparison-subtitle">State A vs State B</p>
            <p className="comparison-pair">{stateA} vs {stateB}</p>
            <p className="comparison-mode">
                Comparing {flowType === 'inflow' ? 'In-Migration' : 'Out-Migration'} using Census 2011 datasets
            </p>
        </div>
    );
}
