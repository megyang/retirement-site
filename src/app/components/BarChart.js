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
            <h3 className=" text-left text-2xl mt-[-4px] mb-4">Total Taxes Paid</h3>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
}

export default BarChart;
