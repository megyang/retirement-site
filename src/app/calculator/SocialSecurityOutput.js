import React, { useEffect, useState } from 'react';
import Decimal from "decimal.js";

const SocialSecurityOutput = ({ inputs }) => {
    //REFERENCE TABLE
    const [tableData1, setTableData1] = useState([]);
    const [benefitsBasedOnAge, setBenefitsBasedOnAge] = useState({
        husbandYearly: 0,
        wifeYearly: 0,
    });
    useEffect(() => {
        const calculateTableData1 = () => {
            const newData = [];

            for (let age = 62; age <= 70; age++) {
                const percentageOfPIA = getPercentageOfPIAForAge(age);
                const spousePIA = getSpouse(age);
                const hBenefit = new Decimal(inputs.hPIA).times(percentageOfPIA).dividedBy(100);
                const wBenefit = new Decimal(inputs.wPIA).times(spousePIA).dividedBy(100);
                const husbandMonthly = Decimal.max(hBenefit, wBenefit);
                const hBenefit1 = new Decimal(inputs.hPIA).times(spousePIA).dividedBy(100);
                const wBenefit1 = new Decimal(inputs.wPIA).times(percentageOfPIA).dividedBy(100);
                const wifeMonthly = Decimal.max(hBenefit1, wBenefit1);

                newData.push({
                    age,
                    percentageOfPIA,
                    spousePIA,
                    husbandMonthly: husbandMonthly.toNumber(),
                    wifeMonthly: wifeMonthly.toNumber(),
                    husbandYearly: husbandMonthly.times(12).toNumber(),
                    wifeYearly: wifeMonthly.times(12).toNumber(),
                });
            }

            setTableData1(newData);
        };

        calculateTableData1();
    }, [inputs]);

    const getSpouse = (age) => {
        const referenceTable = {
            62: new Decimal(32.5),
            63: new Decimal(35.0),
            64: new Decimal(37.5),
            65: new Decimal(41.7),
            66: new Decimal(45.8),
            // Assuming default as 50 for ages not listed in the table
        };
        return referenceTable[age] || new Decimal(50.0);
    };

    const getPercentageOfPIAForAge = (age) => {
        const referenceTable = {
            62: new Decimal(70.0),
            63: new Decimal(75.0),
            64: new Decimal(80.0),
            65: new Decimal(86.7),
            66: new Decimal(93.3),
            67: new Decimal(100.0),
            68: new Decimal(108.0),
            69: new Decimal(116.0),
            70: new Decimal(124.0),
        };
        return referenceTable[age];
    };
    useEffect(() => {
        // After tableData1 is set, find the entries for the husband's and wife's start ages
        const husbandStartAgeData = tableData1.find(data => data.age === inputs.hSS);
        const wifeStartAgeData = tableData1.find(data => data.age === inputs.wSS);
        // Update benefitsBasedOnAge with the yearly values found for both husband and wife
        // If no data is found for the start age (in case of incorrect inputs or data not available),
        // keep the benefits as 0 (or you could set them to a default value if preferred)
        setBenefitsBasedOnAge({
            husbandYearly: husbandStartAgeData ? husbandStartAgeData.husbandYearly : 0,
            wifeYearly: wifeStartAgeData ? wifeStartAgeData.wifeYearly : 0,
        });
    }, [tableData1, inputs.hSS, inputs.wSS]); // Depend on tableData1 and the start ages to trigger this effect

////REFERENCE TABLE END

/////social security benefits
    const currentYear = new Date().getFullYear();
    const [tableData, setTableData] = useState([]);
    const [totalCash, setTotalCash] = useState(0); // State to hold the sum of all total benefits
    const [npv, setNpv] = useState(0);
    const calculateBenefitForYear = ({
                                         age,
                                         spouseAge,
                                         lifeExpectancy,
                                         spouseLifeExpectancy,
                                         startAge,
                                         spouseStartAge,
                                         benefitAgeOfWithdraw,
                                         spouseBenefitAgeOfWithdraw,
                                         lastYearBenefit,
                                         lastYearSpouseBenefit
                                     }) => {
        const ageDecimal = new Decimal(age);
        const spouseAgeDecimal = new Decimal(spouseAge);
        const lifeExpectancyDecimal = new Decimal(lifeExpectancy);
        const spouseLifeExpectancyDecimal = new Decimal(spouseLifeExpectancy);

        if (ageDecimal > (lifeExpectancyDecimal)) {
            return new Decimal(0);
        }
        if (spouseAgeDecimal > (spouseLifeExpectancyDecimal) && lastYearSpouseBenefit > (lastYearBenefit)) {
            return lastYearSpouseBenefit;
        }
        if (ageDecimal.lessThan(startAge)) {
            return new Decimal(0);
        }
        if (ageDecimal.equals(startAge)) {
            return benefitAgeOfWithdraw;
        }
        return lastYearBenefit;
    };

    useEffect(() => {
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
        const yearsToCover = maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge) + 1;

        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;
        let cumulativeTotal = new Decimal(0); // Initialize cumulative total

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear + i;
            const husbandAge = inputs.husbandAge + i;
            const wifeAge = inputs.wifeAge + i;

            // Calculate husband and wife benefits for the year
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

            const totalBenefit = new Decimal(husbandBenefit).add(new Decimal(wifeBenefit));
            cumulativeTotal = cumulativeTotal.add(totalBenefit); // Add current year's total benefit to cumulative total

            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return { year, husbandAge, wifeAge, husbandBenefit: husbandBenefit.toFixed(2), wifeBenefit: wifeBenefit.toFixed(2), totalBenefit: totalBenefit.toFixed(2) };
        });

        setTableData(newTableData);

        // Calculate NPV
        const roi = inputs.roi / 100;
        const cashFlows = newTableData.map(({ totalBenefit }) => new Decimal(totalBenefit));
        const dates = newTableData.map(({ year }) => new Date(year, 0, 1));

        const calculateXNPV = (rate, cashFlows, dates) => {
            let xnpv = 0.0;
            for (let i = 0; i < cashFlows.length; i++) {
                const xnpvTerm = (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
                xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
            }
            return xnpv;
        };

        const npvValue = calculateXNPV(roi, cashFlows, dates);

        setNpv(npvValue);
        setTotalCash(cumulativeTotal); // Update totalCash with cumulative total
    }, [inputs, currentYear, benefitsBasedOnAge.husbandYearly, benefitsBasedOnAge.wifeYearly]);


    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">outputs</h2>
            <div className="mb-6">
                <h3 className="font-medium">total benefit amount</h3>
                <p>total cash: ${totalCash.toFixed(2)}</p>
                <p>net present value: ${npv.toFixed(2)}</p>
            </div>
            <div>
                <h3 className="font-medium mb-2">social security benefits by year</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">year</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">your age</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">spouse&apos;s age</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">ss benefit</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">spouse&apos;s ss benefit</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">total ss benefit</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map(({ year, husbandAge, wifeAge, husbandBenefit, wifeBenefit, totalBenefit }, index) => (
                        <tr key={index}>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{husbandAge}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{wifeAge}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${husbandBenefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${wifeBenefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${totalBenefit}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {/*REFERENCE TABLE !!!!!!!
            <div>
                <div>Benefit Based on Age of Withdraw:</div>
                <div>Husband: ${benefitsBasedOnAge.husbandYearly.toFixed(2)}</div>
                <div>Wife: ${benefitsBasedOnAge.wifeYearly.toFixed(2)}</div>


                <table>
                    <thead>
                    <tr>
                        <th>age | </th>
                        <th>% of PIA | </th>
                        <th>spousal % of PIA | </th>
                        <th>monthly for you | </th>
                        <th>spouse's monthly | </th>
                        <th>yearly for you | </th>
                        <th>spouse's yearly</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tableData1.map((row, index) => (
                        <tr key={index}>
                            <td>{row.age}</td>
                            <td>{row.percentageOfPIA}%</td>
                            <td>{row.spousePIA}%</td>
                            <td>${row.husbandMonthly.toFixed(2)}</td>
                            <td>${row.wifeMonthly.toFixed(2)}</td>
                            <td>${row.husbandYearly.toFixed(2)}</td>
                            <td>${row.wifeYearly.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
 */}
        </div>
    );
};

export default SocialSecurityOutput;