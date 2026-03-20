export const chartValueLabelPlugin = {
    id: 'chartValueLabelPlugin',
    afterDatasetsDraw(chart) {
        const { ctx, data } = chart;
        const chartType = chart.config.type;

        ctx.save();

        if (chartType === 'pie' || chartType === 'doughnut') {
            const values = data.datasets[0]?.data || [];
            let total = 0;
            for (let i = 0; i < values.length; i++) total += Number(values[i]) || 0;

            const meta = chart.getDatasetMeta(0);
            for (let i = 0; i < meta.data.length; i++) {
                const value = Number(values[i]) || 0;
                if (!value || !total) continue;

                const percent = ((value / total) * 100).toFixed(1) + '%';
                const point = meta.data[i].tooltipPosition();

                ctx.font = '700 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
                ctx.fillStyle = '#ffffff';
                ctx.strokeText(percent, point.x, point.y);
                ctx.fillText(percent, point.x, point.y);
            }
        }

        if (chartType === 'bar') {
            for (let datasetIndex = 0; datasetIndex < data.datasets.length; datasetIndex++) {
                const dataset = data.datasets[datasetIndex];
                const meta = chart.getDatasetMeta(datasetIndex);

                for (let i = 0; i < meta.data.length; i++) {
                    const value = Number(dataset.data[i]) || 0;
                    if (!value) continue;

                    const bar = meta.data[i];
                    const props = bar.getProps(['x', 'y', 'base'], true);
                    const height = Math.abs(props.base - props.y);
                    const label = value.toLocaleString();

                    ctx.font = '700 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.lineWidth = 3;

                    if (height > 24) {
                        ctx.textBaseline = 'middle';
                        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
                        ctx.fillStyle = '#ffffff';
                        const centerY = props.y + ((props.base - props.y) / 2);
                        ctx.strokeText(label, props.x, centerY);
                        ctx.fillText(label, props.x, centerY);
                    } else {
                        ctx.textBaseline = 'bottom';
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.fillStyle = '#0f172a';
                        ctx.strokeText(label, props.x, props.y - 4);
                        ctx.fillText(label, props.x, props.y - 4);
                    }
                }
            }
        }

        ctx.restore();
    }
};
