export default function ComparisonInsights({ insights }) {
    return (
        <section className="comparison-insight-box">
            <h3 className="comparison-insight-title">Comparison Insights</h3>
            <ul className="comparison-insight-list">
                {insights.map(function (item, index) {
                    return <li key={`insight-${index}`}>{item}</li>;
                })}
            </ul>
        </section>
    );
}
