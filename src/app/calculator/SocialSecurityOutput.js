import React, { useEffect, useState } from 'react';

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
                const hBenefit = (inputs.hPIA * (percentageOfPIA / 100));
                const wBenefit = (inputs.wPIA * spousePIA / 100);
                const husbandMonthly = Math.max(hBenefit, wBenefit);
                const hBenefit1 = (inputs.hPIA * (spousePIA / 100));
                const wBenefit1 = (inputs.wPIA * percentageOfPIA / 100);
                const wifeMonthly = Math.max(hBenefit1, wBenefit1);
                const husbandYearly = husbandMonthly * 12;
                const wifeYearly = wifeMonthly * 12;

                newData.push({
                    age,
                    percentageOfPIA,
                    spousePIA,
                    husbandMonthly,
                    wifeMonthly,
                    husbandYearly,
                    wifeYearly,
                });
            }

            setTableData1(newData);
        };

        calculateTableData1();
    }, [inputs]);

    console.log(benefitsBasedOnAge)
    const getSpouse = (age) => {
        const referenceTable = {
            62: 32.5,
            63: 35.0,
            64: 37.5,
            65: 41.7,
            66: 45.8
        };
        return referenceTable[age] | 50.0;
    };
    const getPercentageOfPIAForAge = (age) => {
        const referenceTable = {
            62: 70.0,
            63: 75.0,
            64: 80.0,
            65: 86.7,
            66: 93.3,
            67: 100.0,
            68: 108.0,
            69: 116.0,
            70: 124.0,
        };
        return referenceTable[age];
    };

    useEffect(() => {
        // After tableData1 is set, find the entries for the husband's and wife's start ages
        const husbandStartAgeData = tableData1.find(data => data.age === inputs.hSS);
        const wifeStartAgeData = tableData1.find(data => data.age === inputs.wSS);
        console.log(husbandStartAgeData)
        console.log(wifeStartAgeData)
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

    function calculateBenefitForYear({
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
                                     }) {
        if (age > lifeExpectancy) {
            return 0;
        }
        if (spouseAge > spouseLifeExpectancy && lastYearSpouseBenefit > lastYearBenefit) {
            return lastYearSpouseBenefit;
        }
        if (age < startAge) {
            return 0;
        }
        if (age === startAge) {
            return benefitAgeOfWithdraw;
        }
        return lastYearBenefit;
    }

    useEffect(() => {
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
        const yearsToCover = maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge) + 1;


        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;
        let cumulativeTotal = 0;

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear + i;
            const husbandAge = inputs.husbandAge + i;
            const wifeAge = inputs.wifeAge + i;

            const husbandBenefit = calculateBenefitForYear({
                age: husbandAge,
                spouseAge: wifeAge,
                lifeExpectancy: inputs.hLE,
                spouseLifeExpectancy: inputs.wLE,
                currentAge: inputs.husbandAge,
                startAge: inputs.hSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.husbandYearly,
                benefitAgeOfWithdrawSpouse: benefitsBasedOnAge.wifeYearly,
                lastYearBenefit: lastYearHusbandBenefit,
                lastYearSpouseBenefit: lastYearWifeBenefit
            });

            const wifeBenefit = calculateBenefitForYear({
                age: wifeAge,
                spouseAge: husbandAge,
                lifeExpectancy: inputs.wLE,
                spouseLifeExpectancy: inputs.hLE,
                currentAge: inputs.wifeAge,
                startAge: inputs.wSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.wifeYearly,
                benefitAgeOfWithdrawSpouse: benefitsBasedOnAge.husbandYearly,
                lastYearBenefit: lastYearWifeBenefit,
                lastYearSpouseBenefit: lastYearHusbandBenefit
            });

            const totalBenefit = husbandBenefit + wifeBenefit;
            cumulativeTotal += totalBenefit;

            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return { year, husbandAge, wifeAge, husbandBenefit, wifeBenefit, totalBenefit };
        });
        //social security end

        setTableData(newTableData);
        const roi = inputs.roi / 100;
        const cashFlows = newTableData.map(({ totalBenefit }) => totalBenefit);
        const dates = newTableData.map(({ year }) => new Date(year, 0, 1));

        const calculateXNPV = (rate, cashFlows, dates) => {
            let xnpv = 0.0;
            for (let i = 0; i < cashFlows.length; i++) {
                const xnpvTerm = (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
                xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
            }
            return xnpv;
        };

        const adjustedRate = inputs.roi / 100;
        const npvValue = calculateXNPV(adjustedRate, cashFlows, dates);
        setNpv(npvValue);
        setTotalCash(cumulativeTotal);
    }, [inputs, currentYear]);




    return (
        <div>
            <h2>outputs</h2>
            <div>
                <h3>total benefit amount</h3>
                <p>total cash: ${totalCash.toFixed(2)}</p>
                <p>net present value: ${npv.toFixed(2)}</p>
            </div>
            <div>
                <h3>social security benefits by year</h3>
                <table>
                    <thead>
                    <tr>
                        <th>year</th>
                        <th>your age</th>
                        <th>spouse's age</th>
                        <th>ss benefit</th>
                        <th>spouse's ss benefit</th>
                        <th>total ss benefit</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tableData.map(({ year, husbandAge, wifeAge, husbandBenefit, wifeBenefit, totalBenefit }) => (
                        <tr key={year}>
                            <td>{year}</td>
                            <td>{husbandAge}</td>
                            <td>{wifeAge}</td>
                            <td>{`$${husbandBenefit.toFixed(2)}`}</td>
                            <td>{`$${wifeBenefit.toFixed(2)}`}</td>
                            <td>{`$${totalBenefit.toFixed(2)}`}</td>
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
