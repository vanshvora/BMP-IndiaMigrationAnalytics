import { Pie } from 'react-chartjs-2';

export function BreakdownPie({ labels, values, colors, onClick, donut }) {
    let total = 0;
    for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;

    const data = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: Array(values.length).fill('#ffffff'),
            borderWidth: 2,
            hoverOffset: 8,
            cutout: donut ? '55%' : 0
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
