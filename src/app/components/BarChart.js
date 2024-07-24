import React from "react";
import { Bar } from "react-chartjs-2";

import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js/auto";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function BarChart({ chartData, chartOptions }) {
    return (
        <div className="bg-white p-4 rounded h-auto w-full">
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
}

export default BarChart;
