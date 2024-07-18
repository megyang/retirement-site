import React from 'react';
import { calculateTaxesForBrackets } from "@/app/utils/calculations";

const OrdinaryIncomeTaxTable = ({ staticFields, editableFields, calculateTotalIncomeForYear, calculateStandardDeductionForYear }) => {
    const taxableIncomes = Object.keys(staticFields).reduce((acc, year) => {
        const totalIncomeForYear = calculateTotalIncomeForYear(year);
        const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
        acc[year] = totalIncomeForYear - standardDeductionForYear;
        return acc;
    }, {});

    return (
        <div>
            Ordinary Income Tax Brackets Table
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Year</th>
                    {bracketTitles.map((title) => (
                        <th key={title} className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">{title}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Total Income Tax</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(taxableIncomes).map((year) => {
                    const taxesForBrackets = calculateTaxesForBrackets(taxableIncomes[year]);
                    const totalTax = Object.values(taxesForBrackets).reduce((sum, tax) => sum + tax, 0);

                    return (
                        <tr key={year}>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                            {bracketTitles.map((title) => (
                                <td key={`${year}-${title}`} className="px-3 py-2 text-center whitespace-nowrap">
                                    ${taxesForBrackets[title].toFixed(2)}
                                </td>
                            ))}
                            <td className="px-3 py-2 text-center whitespace-nowrap">${totalTax.toFixed(2)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default OrdinaryIncomeTaxTable;
