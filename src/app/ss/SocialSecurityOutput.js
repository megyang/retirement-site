import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import BarChart from "../components/BarChart";
import useReferenceTable from "../hooks/useReferenceTable";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import {calculateBenefitForYear, calculateXNPV, formatNumberWithCommas} from "../utils/calculations";
import PiaModal from "@/app/modal/PiaModal";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useAuthModal from "@/app/hooks/useAuthModal";

const SocialSecurityOutput = ({ inputs, setInputs, setSocialSecurityInputs }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { onOpen } = useAuthModal();

    useEffect(() => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const dataToSave = {
            user_id: user.id,
            husbandAge: inputs.husbandAge,
            wifeAge: inputs.wifeAge,
            hLE: inputs.hLE,
            wLE: inputs.wLE,
            hPIA: inputs.hPIA,
            wPIA: inputs.wPIA,
            hSS: inputs.hSS,
            wSS: inputs.wSS,
            roi: inputs.roi,
            updated_at: new Date().toISOString(),
        };

        const saveData = async () => {
            const { error } = await supabaseClient
                .from('social_security_inputs')
                .upsert([dataToSave], { onConflict: ['user_id'] });

            if (error) {
                console.error('Error saving data to Supabase:', error);
            } else {
                console.log('Data successfully saved to Supabase.');
            }
        };

        saveData();
    }, [inputs, user]);

    const handleChange = (e) => {
        if (!user) {
            onOpen();
            return;
        }
        const { name, value } = e.target;

        if (name === 'hPIA' || name === 'wPIA') {
            const numericValue = value.replace(/[$,]/g, '');
            if (!isNaN(numericValue) && numericValue !== '') {
                const newInputs = {
                    ...inputs,
                    [name]: numericValue
                };
                setInputs(newInputs);
                setSocialSecurityInputs(newInputs);
            } else if (numericValue === '') {
                const newInputs = {
                    ...inputs,
                    [name]: ''
                };
                setInputs(newInputs);
                setSocialSecurityInputs(newInputs);
            }
        } else {
            const newInputs = {
                ...inputs,
                [name]: parseFloat(value)
            };
            setInputs(newInputs);
            setSocialSecurityInputs(newInputs);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [closeModalTimeout, setCloseModalTimeout] = useState(null);

    const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect();
        const modalWidth = 200;
        setModalPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX + rect.width / 2 - modalWidth / 2, // Center the modal
        });
        setIsModalOpen(true);
    };
    const handleMouseLeave = () => {
        const timeoutId = setTimeout(() => {
            setIsModalOpen(false);
        }, 10000);
        setCloseModalTimeout(timeoutId);
    };


    useEffect(() => {
        return () => {
            if (closeModalTimeout) {
                clearTimeout(closeModalTimeout);
            }
        };
    }, [closeModalTimeout]);

    // Reference table
    const { refTable, benefitsBasedOnAge } = useReferenceTable(inputs);
    const { setSocialSecurityBenefits } = useSocialSecurityStore();

    // Social security benefits
    const currentYear = new Date().getFullYear();
    const [tableData, setTableData] = useState([]);
    const [totalCash, setTotalCash] = useState(0);
    const [npv, setNpv] = useState(0);
    const [userData, setUserData] = useState({
        labels: [],
        datasets: [
            {
                label: "Your Benefit",
                data: [],
                backgroundColor: "#E2785B",
                borderColor: "black",
                borderWidth: 1,
            },
            {
                label: "Spouse Benefit",
                data: [],
                backgroundColor: "#AFBCB7",
                borderColor: "black",
                borderWidth: 1,
            },
        ],
    });

    useEffect(() => {
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
        const yearsToCover = maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge) + 1;

        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;
        let cumulativeTotal = new Decimal(0);

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear + i;
            const husbandAge = inputs.husbandAge + i;
            const wifeAge = inputs.wifeAge + i;

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

            const totalBenefit = new Decimal(husbandBenefit).add(new Decimal(wifeBenefit));
            cumulativeTotal = cumulativeTotal.add(totalBenefit);

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
        setSocialSecurityBenefits(newTableData);



        // Calculate NPV
        const roi = inputs.roi / 100;
        const cashFlows = newTableData.map(({ totalBenefit }) => new Decimal(totalBenefit));
        const dates = newTableData.map(({ year }) => new Date(year, 0, 1));

        const npvValue = calculateXNPV(roi, cashFlows, dates);

        setNpv(npvValue);
        setTotalCash(cumulativeTotal);

        const yearArray = newTableData.map(({ year }) => year.toString());
        const husbandBenefitArray = newTableData.map(({ husbandBenefit }) => parseInt(husbandBenefit));
        const wifeBenefitArray = newTableData.map(({ wifeBenefit }) => parseInt(wifeBenefit));

        setUserData({
            labels: yearArray,
            datasets: [
                {
                    label: "Your Benefit",
                    data: husbandBenefitArray,
                    backgroundColor: "#E2785B",
                    borderColor: "black",
                    borderWidth: 1,
                },
                {
                    label: "Spouse Benefit",
                    data: wifeBenefitArray,
                    backgroundColor: "#AFBCB7",
                    borderColor: "black",
                    borderWidth: 1,
                },
            ],
        });

    }, [
        inputs,
        inputs.hLE,
        inputs.wLE,
        inputs.husbandAge,
        inputs.wifeAge,
        inputs.hSS,
        inputs.wSS,
        inputs.roi,
        currentYear,
        benefitsBasedOnAge.husbandYearly,
        benefitsBasedOnAge.wifeYearly,
        setSocialSecurityBenefits
    ]);



    const benefitChartOptions = {
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    let value = data.datasets[0].data[tooltipItem.index];
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
                    callback: function (value) {
                        value = value.toString();
                        value = value.split(/(?=(?:...)*$)/);
                        value = value.join(",");
                        return "$" + value;
                    },
                },
            },
        },
    };

    return (
        <div>
            <div className="flex w-full h-auto">
                <div className="left-column flex flex-col gap-5 mr-5 w-1/2 h-auto flex-grow">

                    <div className="small-rectangle bg-white rounded-lg w-150 h-250 p-5">
                        <h2 className="text-lg text-center mb-4">Collection Age</h2>
                        <div className="inputs-container ">
                            <table className="table-auto w-full">
                                <tbody>
                                <tr style={{height: "50px"}}>
                                    <td>You</td>
                                    <td>
                                        <input
                                            type="range"
                                            className="w-full custom-range"
                                            name="hSS"
                                            min="62"
                                            max="70"
                                            step="1"
                                            value={inputs.hSS}
                                            onInput={handleChange}
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
                                    <td>Your Spouse</td>
                                    <td>
                                        <input
                                            type="range"
                                            className="w-full custom-range"
                                            name="wSS"
                                            min="62"
                                            max="70"
                                            step="1"
                                            value={inputs.wSS}
                                            onInput={handleChange}
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
                    <div className="rectangle small-rectangle bg-white rounded-lg w-full h-auto p-5">
                        <h3 className="text-lg text-center">Total Social Security Collected</h3>
                        <h1 className="text-5xl text-center font-extrabold">
                            ${Number(totalCash.toFixed(0)).toLocaleString()}
                        </h1>
                    </div>
                </div>
                <div className="right-column flex flex-col w-1/2 h-auto flex-grow">
                    <div className="rectangle large-rectangle bg-white rounded-lg w-full h-full p-5">
                        <h2 className="text-lg mb-4 text-center">Your Information</h2>
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
                                <td>Current Age</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="husbandAge"
                                        value={inputs.husbandAge}
                                        onChange={handleChange}
                                        className="input-box w-full text-right border border-gray-300"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wifeAge"
                                        value={inputs.wifeAge}
                                        onChange={handleChange}
                                        className="input-box w-full text-right border border-gray-300"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Life Expectancy</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="hLE"
                                        value={inputs.hLE}
                                        onChange={handleChange}
                                        className="input-box w-full text-right border border-gray-300"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wLE"
                                        value={inputs.wLE}
                                        onChange={handleChange}
                                        className="input-box w-full text-right border border-gray-300"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Benefit at Full Retirement Age
                                    <span
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ cursor: 'pointer' }}
                                        className="ml-1"
                                    >
                                    &#9432;
                                    </span>
                                </td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="text"
                                        name="hPIA"
                                        value={`$${formatNumberWithCommas(inputs.hPIA || '')}`}
                                        onChange={handleChange}
                                        className="w-full text-right border border-gray-300"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="text"
                                        name="wPIA"
                                        value={`$${formatNumberWithCommas(inputs.wPIA || '')}`}
                                        onChange={handleChange}
                                        className="w-full text-right border border-gray-300"
                                    />
                                </td>
                            </tr>
                            <PiaModal
                                isOpen={isModalOpen}
                                onChange={setIsModalOpen}
                                title="Benefit at Full Retirement Age"
                                description='The monthly benefit you’d receive at full retirement age. To be as accurate as possible, look it up on <a href="https://ssa.gov/myaccount" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline;">ssa.gov/myaccount</a>.'
                                position={modalPosition}
                            />

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="outputs-container bg-white p-4 rounded w-full mt-4">
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
                    <h3 className="text-lg mb-2 mt-[-12px]">Social Security Collected By Year</h3>
                    <BarChart chartData={userData} chartOptions={benefitChartOptions} />
                </div>
            </div>

        </div>
    );
};

export default SocialSecurityOutput;