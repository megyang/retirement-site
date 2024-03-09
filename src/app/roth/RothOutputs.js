"use client"
import React, { useEffect, useState } from 'react';
import Decimal from 'decimal.js';

const RothOutputs = ({ inputs, inputs1 }) => {
    //RMD calculations
    // Destructure inputs for easy access
    const { age1, age2, le1, le2, ira1, ira2, roi } = inputs1;

    // State to hold the IRA calculation results
    const [iraDetails, setIraDetails] = useState({
        spouse1: [],
        spouse2: []
    });

    // RMD Distribution Period by Age table as an object for quick lookup
    const rmdDistributionTable = {
        75: 24.6,
        76: 23.7,
        77: 22.9,
        78: 22.0,
        79: 21.1,
        80: 20.2,
        81: 19.4,
        82: 18.5,
        83: 17.7,
        84: 16.8,
        85: 16.0,
        86: 15.2,
        87: 14.4,
        88: 13.7,
        89: 12.9,
        90: 12.2,
        91: 11.5,
        92: 10.8,
        93: 10.1,
        94: 9.5,
        95: 8.9,
        96: 8.4,
        97: 7.8,
        98: 7.3,
        99: 6.8,
        100: 6.4,
        101: 6.0,
        102: 5.6,
        103: 5.2,
        104: 4.9,
        105: 4.6,
        106: 4.3,
        107: 4.1,
        108: 3.9,
        109: 3.7,
        110: 3.5,
        111: 3.4,
        112: 3.3,
        113: 3.1,
        114: 3.0,
        115: 2.9,
        116: 2.8,
        117: 2.7,
        118: 2.5,
        119: 2.3,
        120: 2.0
    };

    // Function to calculate RMD
    const calculateRMD = (age, startingValue) => {
        if (age < 75) return new Decimal(0); // RMD is 0 for ages below 75
        const distributionPeriod = rmdDistributionTable[age];
        return distributionPeriod ? new Decimal(startingValue).dividedBy(distributionPeriod) : new Decimal(0);
    };

    useEffect(() => {
        const calculateIraDetails = (startingAge, lifeExpectancy, currentIraValue) => {
            let year = new Date().getFullYear();
            let age = startingAge;
            let startingValue = new Decimal(currentIraValue);
            const details = [];

            while (age <= lifeExpectancy) {
                const investmentReturns = startingValue.times(Decimal(roi).dividedBy(100));
                const rmd = calculateRMD(age, startingValue);
                const endingValue = startingValue.plus(investmentReturns).minus(rmd); // Assuming Roth conversion is 0

                details.push({
                    year,
                    age,
                    startingValue: startingValue.toFixed(2),
                    investmentReturns: investmentReturns.toFixed(2),
                    rmd: rmd.toFixed(2),
                    endingValue: endingValue.toFixed(2)
                });

                // Prepare for next iteration
                startingValue = endingValue;
                age++;
                year++;
            }

            return details;
        };

        // Calculate IRA details for both spouses
        const spouse1Details = calculateIraDetails(age1, le1, ira1);
        const spouse2Details = calculateIraDetails(age2, le2, ira2);

        // Update state
        setIraDetails({
            spouse1: spouse1Details,
            spouse2: spouse2Details
        });

    }, [age1, age2, le1, le2, ira1, ira2, roi]); // Recalculate when inputs change


    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">Spouse 1 IRA Details</h2>
            <table className="min-w-full table-auto border-collapse border border-slate-400">
                <thead>
                <tr>
                    <th className="border border-slate-300">Year</th>
                    <th className="border border-slate-300">Age</th>
                    <th className="border border-slate-300">Starting Value</th>
                    <th className="border border-slate-300">Investment Returns</th>
                    <th className="border border-slate-300">RMD</th>
                    <th className="border border-slate-300">Ending Value</th>
                </tr>
                </thead>
                <tbody>
                {iraDetails.spouse1.map((detail, index) => (
                    <tr key={index}>
                        <td className="border border-slate-300 text-center">{detail.year}</td>
                        <td className="border border-slate-300 text-center">{detail.age}</td>
                        <td className="border border-slate-300 text-right">${detail.startingValue}</td>
                        <td className="border border-slate-300 text-right">${detail.investmentReturns}</td>
                        <td className="border border-slate-300 text-right">${detail.rmd}</td>
                        <td className="border border-slate-300 text-right">${detail.endingValue}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h2 className="text-xl font-semibold mb-3 mt-5">Spouse 2 IRA Details</h2>
            <table className="min-w-full table-auto border-collapse border border-slate-400">
                <thead>
                <tr>
                    <th className="border border-slate-300">Year</th>
                    <th className="border border-slate-300">Age</th>
                    <th className="border border-slate-300">Starting Value</th>
                    <th className="border border-slate-300">Investment Returns</th>
                    <th className="border border-slate-300">RMD</th>
                    <th className="border border-slate-300">Ending Value</th>
                </tr>
                </thead>
                <tbody>
                {iraDetails.spouse2.map((detail, index) => (
                    <tr key={index}>
                        <td className="border border-slate-300 text-center">{detail.year}</td>
                        <td className="border border-slate-300 text-center">{detail.age}</td>
                        <td className="border border-slate-300 text-right">${detail.startingValue}</td>
                        <td className="border border-slate-300 text-right">${detail.investmentReturns}</td>
                        <td className="border border-slate-300 text-right">${detail.rmd}</td>
                        <td className="border border-slate-300 text-right">${detail.endingValue}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

};

export default RothOutputs;
