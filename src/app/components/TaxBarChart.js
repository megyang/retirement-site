import React from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const TaxBarChart = ({ data, options }) => {
    const chartData = {
        labels: data.map(item => item.year),
        datasets: data[0].data.map((bracket, index) => ({
            label: bracket.label,
            data: data.map(item => item.data[index].filled),
            backgroundColor: bracket.color,
        })),
    };


    return <Bar data={chartData} options={options} />;
};

export default TaxBarChart;
