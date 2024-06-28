import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import BarChart from "../components/BarChart";

const SocialSecurityOutput = ({ inputs, onInputChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

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
                const hBenefit = new Decimal(inputs.hPIA)
                    .times(percentageOfPIA)
                    .dividedBy(100);
                const wBenefit = new Decimal(inputs.wPIA)
                    .times(spousePIA)
                    .dividedBy(100);
                const husbandMonthly = Decimal.max(hBenefit, wBenefit);
                const hBenefit1 = new Decimal(inputs.hPIA)
                    .times(spousePIA)
                    .dividedBy(100);
                const wBenefit1 = new Decimal(inputs.wPIA)
                    .times(percentageOfPIA)
                    .dividedBy(100);
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
        const husbandStartAgeData = tableData1.find(
            (data) => data.age === inputs.hSS
        );
        const wifeStartAgeData = tableData1.find(
            (data) => data.age === inputs.wSS
        );


        setBenefitsBasedOnAge({
            husbandYearly: husbandStartAgeData
                ? husbandStartAgeData.husbandYearly
                : 0,
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
        lastYearSpouseBenefit,
    }) => {
        const ageDecimal = new Decimal(age);
        const spouseAgeDecimal = new Decimal(spouseAge);
        const lifeExpectancyDecimal = new Decimal(lifeExpectancy);
        const spouseLifeExpectancyDecimal = new Decimal(spouseLifeExpectancy);

        if (ageDecimal > lifeExpectancyDecimal) {
            return new Decimal(0);
        }
        if (
            spouseAgeDecimal > spouseLifeExpectancyDecimal &&
            lastYearSpouseBenefit > lastYearBenefit
        ) {
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
        const yearsToCover =
            maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge) + 1;

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
                lastYearSpouseBenefit: lastYearWifeBenefit,
            });

            const wifeBenefit = calculateBenefitForYear({
                age: wifeAge,
                spouseAge: husbandAge,
                lifeExpectancy: inputs.wLE,
                spouseLifeExpectancy: inputs.hLE,
                startAge: inputs.wSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.wifeYearly,
                lastYearBenefit: lastYearWifeBenefit,
                lastYearSpouseBenefit: lastYearHusbandBenefit,
            });

            const totalBenefit = new Decimal(husbandBenefit).add(
                new Decimal(wifeBenefit)
            );
            cumulativeTotal = cumulativeTotal.add(totalBenefit); // Add current year's total benefit to cumulative total

            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return {
                year,
                husbandAge,
                wifeAge,
                husbandBenefit: husbandBenefit.toFixed(0),
                wifeBenefit: wifeBenefit.toFixed(0),
                totalBenefit: totalBenefit.toFixed(0),
            };
        });

        setTableData(newTableData);

        // Calculate NPV
        const roi = inputs.roi / 100;
        const cashFlows = newTableData.map(
            ({ totalBenefit }) => new Decimal(totalBenefit)
        );
        const dates = newTableData.map(({ year }) => new Date(year, 0, 1));

        const calculateXNPV = (rate, cashFlows, dates) => {
            let xnpv = 0.0;
            for (let i = 0; i < cashFlows.length; i++) {
                const xnpvTerm =
                    (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
                xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
            }
            return xnpv;
        };

        const npvValue = calculateXNPV(roi, cashFlows, dates);

        setNpv(npvValue);
        setTotalCash(cumulativeTotal); // Update totalCash with cumulative total
    }, [
        inputs,
        currentYear,
        benefitsBasedOnAge.husbandYearly,
        benefitsBasedOnAge.wifeYearly,
    ]);

    // Creating Bar Chart Data
    const [userData, setUserData] = useState({
        labels: [],
        datasets: [
            {
                label: "Husband Benefit",
                data: [],
            },
            {
                label: "Wife Benefit",
                data: [],
            },
        ],
    });

    useEffect(() => {
        const yearArray = tableData.map(({ year }) => year.toString());
        const husbandBenefitArray = tableData.map(({ husbandBenefit }) =>
            parseInt(husbandBenefit)
        );
        const wifeBenefitArray = tableData.map(({ wifeBenefit }) =>
            parseInt(wifeBenefit)
        );

        setUserData({
            labels: yearArray,
            datasets: [
                {
                    label: "Husband Benefit",
                    data: husbandBenefitArray,
                    backgroundColor: "#9fc5e8",
                    borderColor: "black",
                    borderWidth: 1,
                },
                {
                    label: "Wife Benefit",
                    data: wifeBenefitArray,
                    backgroundColor: "#ead1dc",
                    borderColor: "black",
                    borderWidth: 1,
                },
            ],
        });
    }, [tableData]);

    const benefitChartOptions = {
        //Add commas to bar chart values
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    var value = data.datasets[0].data[tooltipItem.index];
                    value = value.toString();
                    value = value.split(/(?=(?:...)*$)/);
                    value = value.join(",");
                    return "$" + value;
                },
            },
        },

        plugins: {
            legend: {
                position: "bottom",
            },
        },

        scales: {
            x: {
                stacked: true,
                grid: {
                    drawOnChartArea: false,
                },
            },
            y: {
                stacked: true,
                max: 100000,
                ticks: {
                    callback: function (value, index, values) {
                        value = value.toString();
                        value = value.split(/(?=(?:...)*$)/);
                        value = value.join(",");
                        return "$" + value;
                    },
                },
            },
        },
    };

    console.log(tableData1);
    return (
        <div>
            <div className="flex w-full h-auto">
                <div className="left-column flex flex-col gap-5 mr-5 w-1/2 h-auto flex-grow">

                    <div className="rectangle small-rectangle bg-[#f8f5f0] rounded-lg w-150 h-250 p-5">
                        <h2 className="text-lg text-center mb-4">Collection Age</h2>
                        <div className="inputs-container ">
                            <table className="table-auto w-full">
                                <tbody>
                                <tr style={{height: "50px"}}>
                                    <td>You</td>
                                    <td>
                                        <input
                                            type="range"
                                            className="w-full"
                                            name="hSS"
                                            min="62"
                                            max="70"
                                            step="1"
                                            value={inputs.hSS}
                                            onChange={handleChange}
                                        />
                                        <ul className="flex justify-between w-full px-[10px]">
                                            <li className="flex justify-center relative">
                                                <span className="absolute">62</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">63</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">64</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">65</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">66</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">67</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">68</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">69</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">70</span>
                                            </li>
                                        </ul>
                                    </td>
                                </tr>
                                <tr style={{height: "50px"}}>
                                    <td>Your spouse</td>
                                    <td>
                                        <input
                                            type="range"
                                            className="w-full"
                                            name="wSS"
                                            min="62"
                                            max="70"
                                            step="1"
                                            value={inputs.wSS}
                                            onChange={handleChange}
                                        />
                                        <ul className="flex justify-between w-full px-[10px]">
                                            <li className="flex justify-center relative">
                                                <span className="absolute">62</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">63</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">64</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">65</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">66</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">67</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">68</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">69</span>
                                            </li>
                                            <li className="flex justify-center relative">
                                                <span className="absolute">70</span>
                                            </li>
                                        </ul>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="rectangle small-rectangle bg-[#f8f5f0] rounded-lg w-full h-auto p-5">
                        <h3 className="font-lg text-center">Total Social Security Collected</h3>
                        <h1 className="text-5xl text-center font-extrabold">
                            ${Number(totalCash.toFixed(0)).toLocaleString()}
                        </h1>
                    </div>
                </div>
                <div className="right-column flex flex-col w-1/2 h-auto flex-grow">
                    <div className="rectangle large-rectangle bg-[#f8f5f0] rounded-lg w-full h-full p-5">
                        <h2 className="text-xl mb-4 text-center">Your Information</h2>
                        <table className="table-auto w-full">
                            <thead>
                            <tr>
                                <th></th>
                                <th className="text-center pr-4">You</th>
                                <th className="text-center">Spouse</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Current Age:</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="husbandAge"
                                        value={inputs.husbandAge}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wifeAge"
                                        value={inputs.wifeAge}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Life Expectancy:</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="hLE"
                                        value={inputs.hLE}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wLE"
                                        value={inputs.wLE}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td >Primary Insurance Amount:</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="hPIA"
                                        value={inputs.hPIA}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wPIA"
                                        value={inputs.wPIA}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="outputs-container bg-[#f8f5f0] p-4 rounded w-full mt-4">
                <div className="total-collected mb-6">


                    {
                        /*
                        <p>
                            Net Present Value: $
                            {Number(npv.toFixed(0)).toLocaleString()}
                        </p>
                        */
                    }

                </div>
                <div className="ss-graph">
                    <h3 className="font-medium mb-2">Social Security Benefits Graph</h3>
                    <BarChart chartData={userData} chartOptions={benefitChartOptions} />
                </div>
            </div>

        </div>
    );
};

export default SocialSecurityOutput;
