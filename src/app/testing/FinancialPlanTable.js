import React, { useEffect, useState } from 'react';
import Decimal from 'decimal.js';
import { calculateBenefitForYear, findRmdByYear, findSsBenefitsByYear } from "@/app/utils/calculations";

const FinancialPlanTable = ({
                                inputs, inputs1, staticFields, editableFields,
                                setEditableFields, benefitsBasedOnAge
                            }) => {
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);

    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const yearsToCover = maxLifeExpectancy - Math.min(inputs1.age1, inputs1.age2) + 1;

        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear + i;
            const husbandAge = inputs1.age1 + i;
            const wifeAge = inputs1.age2 + i;

            const husbandBenefit = calculateBenefitForYear({
                age: husbandAge,
                spouseAge: wifeAge,
                lifeExpectancy: inputs.hLE,
                spouseLifeExpectancy: inputs.wLE,
                startAge: inputs.hSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.husbandYearly,
                lastYearBenefit: lastYearHusbandBenefit,
                lastYearSpouseBenefit: lastYearWifeBenefit
            });

            const wifeBenefit = calculateBenefitForYear({
                age: wifeAge,
                spouseAge: husbandAge,
                lifeExpectancy: inputs.wLE,
                spouseLifeExpectancy: inputs.hLE,
                startAge: inputs.wSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.wifeYearly,
                lastYearBenefit: lastYearWifeBenefit,
                lastYearSpouseBenefit: lastYearHusbandBenefit
            });

            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return { year, husbandAge, wifeAge, husbandBenefit: husbandBenefit.toFixed(2), wifeBenefit: wifeBenefit.toFixed(2) };
        });

        setTableData(newTableData);
    }, [inputs, inputs1, benefitsBasedOnAge]);

    const [annualInflationRate, setAnnualInflationRate] = useState(inputs1.inflation / 100);
    const startingStandardDeduction = 29200;

    const calculateStandardDeductionForYear = (year) => {
        const yearsDifference = year - currentYear;
        return startingStandardDeduction * Math.pow(1 + annualInflationRate, yearsDifference);
    };

    const calculateTotalIncomeForYear = (year) => {
        const ssBenefits = findSsBenefitsByYear(parseInt(year));
        const editableFieldsForYear = editableFields[year] || {
            rothSpouse1: 0,
            rothSpouse2: 0,
            salary1: 0,
            salary2: 0,
            rentalIncome: 0,
            interest: 0,
            capitalGains: 0,
            pension: 0
        };

        const rmdSpouse1 = findRmdByYear(iraDetails.spouse1, parseInt(year));
        const rmdSpouse2 = findRmdByYear(iraDetails.spouse2, parseInt(year));

        const totalIncome = new Decimal(editableFieldsForYear.rothSpouse1)
            .plus(editableFieldsForYear.rothSpouse2)
            .plus(editableFieldsForYear.salary1)
            .plus(editableFieldsForYear.salary2)
            .plus(editableFieldsForYear.rentalIncome)
            .plus(editableFieldsForYear.interest)
            .plus(editableFieldsForYear.capitalGains)
            .plus(editableFieldsForYear.pension)
            .plus(rmdSpouse1)
            .plus(rmdSpouse2)
            .plus(ssBenefits.spouse1Benefit)
            .plus(ssBenefits.spouse2Benefit);

        return totalIncome.toFixed(2);
    };

    return (
        <div className="scrollable-container mt-4 bg-white overflow-x-auto p-4 rounded">
            <h2 className="text-xl font-semi-bold mb-3">Financial Plan Details</h2>
            <table className="border-collapse border border-slate-400">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Field</th>
                    {Object.keys(staticFields).map((year) => (
                        <th key={year} className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">{year}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Age Spouse 1</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse1}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Age Spouse 2</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse2}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Roth Conversion 1</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse1')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Roth Conversion 2</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse2')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Salary 1</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary1')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Salary 2</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary2')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Rental Income</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rentalIncome')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Interest / Dividend</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'interest')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Capital Gains</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'capitalGains')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Pension</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'pension')}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">RMD Spouse 1</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse1, parseInt(year))}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">RMD Spouse 2</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse2, parseInt(year))}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">SS Spouse 1</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse1Benefit}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">SS Spouse 2</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse2Benefit}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Total Ordinary Income</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">${calculateTotalIncomeForYear(year)}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Standard Deductions</td>
                    {Object.keys(staticFields).map((year) => (
                        <td key={year} className="px-3 py-2 text-center whitespace-nowrap">-${calculateStandardDeductionForYear(parseInt(year)).toFixed(2)}</td>
                    ))}
                </tr>
                <tr>
                    <td className="px-3 py-2 text-left whitespace-nowrap">Taxable Ordinary Income</td>
                    {Object.keys(staticFields).map((year) => {
                        const totalIncomeForYear = calculateTotalIncomeForYear(year);
                        const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
                        const taxableIncomeForYear = totalIncomeForYear - standardDeductionForYear;
                        return (
                            <td key={year} className="px-3 py-2 text-center whitespace-nowrap">${taxableIncomeForYear.toFixed(2)}</td>
                        );
                    })}
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default FinancialPlanTable;
