import { Pie } from 'react-chartjs-2';

export function BreakdownPie({ labels, values, colors, onClick }) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;

    const data = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: Array(values.length).fill('#ffffff'),
            borderWidth: 2,
            hoverOffset: 8
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
            },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        const val = Number(ctx.parsed) || 0;
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                        return ` ${ctx.label}: ${val.toLocaleString()} (${pct}%)`;
                    }
                }
            }
        },
        animation: false
    };

    return (
        <div className="pie-box">
            <div className="pie-content">
                <Pie data={data} options={options} onClick={onClick} />
            </div>
        </div>
    );
}

export function InsightCard({ insight }) {
    const tone = insight.tone || 'neutral';
    return (
        <div className={`insight-card tone-${tone}`}>
            <p className="insight-title">{insight.title}</p>
            <p className="insight-value">{insight.value}</p>
            <p className="insight-desc">{insight.description}</p>
        </div>
    );
}

export function KeyTakeawaysCard({ points }) {
    return (
        <div className="card takeaways-card">
            <h3 className="card-title">Key Takeaways</h3>
            {points.length > 0 ? (
                <ul className="takeaway-list">
                    {points.map(function (point, i) {
                        return <li key={i}>{point}</li>;
                    })}
                </ul>
            ) : (
                <p className="no-data">No computed takeaways available.</p>
            )}
        </div>
    );
}

export function DrilldownPanel({ title, detail }) {
    return (
        <div className="card drilldown-card">
            <h3 className="card-title">{title}</h3>
            {detail ? (
                <div className="drilldown-body">
                    <p className="drilldown-main">{detail.title}</p>
                    <p className="drilldown-sub">{detail.description}</p>
                    <div className="drilldown-kv">
                        <span>Value: {detail.value}</span>
                        {detail.rank ? <span>Rank: #{detail.rank}</span> : null}
                        {detail.share ? <span>Share: {detail.share}</span> : null}
                    </div>
                </div>
            ) : (
                <p className="no-data">Click a chart segment to inspect details.</p>
            )}
        </div>
    );
}

export function loadCsv(path, transformRow, onData, onError, Papa) {
    fetch(path)
        .then(function (r) { return r.text(); })
        .then(function (txt) {
            const result = Papa.parse(txt, { header: true, dynamicTyping: true, skipEmptyLines: true });
            const rows = [];
            for (let i = 0; i < result.data.length; i++) {
                const row = transformRow(result.data[i]);
                if (row) rows.push(row);
            }
            onData(rows);
        })
        .catch(function (err) {
            onError(err);
            onData([]);
        });
}

