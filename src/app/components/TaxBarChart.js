import React from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const TaxBarChart = ({ data }) => {
    const chartData = {
        labels: data.map(item => item.year),
        datasets: data[0].data.map((bracket, index) => ({
            label: bracket.label,
            data: data.map(item => item.data[index].filled),
            backgroundColor: bracket.color,
        })),
    };

    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const item = data[context.dataIndex].data[context.datasetIndex];
                        const filled = item.filled.toLocaleString();
                        const remaining = item.remaining === Infinity ? "Infinity" : item.remaining.toLocaleString();
                        return `${context.dataset.label}: Filled: ${filled}, Remaining: ${remaining}`;
                    },
                },
            },
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                beginAtZero: true,
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default TaxBarChart;
