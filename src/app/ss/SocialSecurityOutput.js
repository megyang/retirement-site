import React, { useEffect, useState } from "react";
import Decimal from "decimal.js";
import BarChart from "../components/BarChart";
import useReferenceTable from "../hooks/useReferenceTable";
import useStore from "@/app/store/useStore";
import { calculateBenefitForYear, calculateXNPV } from "../utils/calculations";
import { debounce } from 'lodash';
import PiaModal from "@/app/modal/PiaModal";
import useAuthModal from "@/app/hooks/useAuthModal";
import { useUser } from "@/app/hooks/useUser";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const SocialSecurityOutput = ({ inputs, onInputChange }) => {
    const supabaseClient = useSupabaseClient();

    const debouncedSaveInputs = debounce(async (name, value) => {
        await saveInputToDatabase(name, value);
    }, 10);

    const { onOpen } = useAuthModal();
    const { user } = useUser();

    useEffect(() => {
        return () => {
            debouncedSaveInputs.cancel();
        };
    }, []);

    const saveInputToDatabase = async (name, value) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('social_security_inputs')
            .upsert({ user_id: user.id, [name]: value, updated_at: new Date().toISOString() }, { onConflict: ['user_id'] });

        if (error) {
            console.error('Error saving data to Supabase:', error);
        } else {
            console.log('Data successfully saved to Supabase.');
        }
    };

    const saveInputsToDatabase = async () => {
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

        const { error } = await supabaseClient
            .from('social_security_inputs')
            .upsert([dataToSave], { onConflict: ['user_id'] });

        if (error) {
            console.error('Error saving data to Supabase:', error);
        } else {
            console.log('Data successfully saved to Supabase.');
        }
    };

    const handleChange = async (e) => {
        if (!user) {
            onOpen();
            return;
        }
        const { name, value } = e.target;
        if (value !== inputs[name]) {
            onInputChange(name, value);
            debouncedSaveInputs(name, value);
            await saveInputsToDatabase(name, parseFloat(value));
        }
    };

    const [closeModalTimeout, setCloseModalTimeout] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

    const handleMouseEnter = (e) => {
        const rect = e.target.getBoundingClientRect();
        const modalWidth = 200; // The width of the modal
        setModalPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX + rect.width / 2 - modalWidth / 2, // Center the modal
        });
        setIsModalOpen(true);
    };
    const handleMouseLeave = () => {
        const timeoutId = setTimeout(() => {
            setIsModalOpen(false);
        }, 1500);
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
    const { setSocialSecurityBenefits } = useStore();

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
                backgroundColor: "#9fc5e8",
                borderColor: "black",
                borderWidth: 1,
            },
            {
                label: "Your Spouse's Benefit",
                data: [],
                backgroundColor: "#ead1dc",
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
                    backgroundColor: "#9fc5e8",
                    borderColor: "black",
                    borderWidth: 1,
                },
                {
                    label: "Your Spouse's Benefit",
                    data: wifeBenefitArray,
                    backgroundColor: "#ead1dc",
                    borderColor: "black",
                    borderWidth: 1,
                },
            ],
        });

    }, [
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

    //console.log(refTable);
    return (
        <div>
            <div className="flex w-full h-auto">
                <div className="left-column flex flex-col gap-5 mr-5 w-1/2 h-auto flex-grow">

                    <div className="rectangle small-rectangle bg-white border-gray-600 rounded-lg w-150 h-250 p-5">
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
                                            onClick={() => {
                                                if (!user) {
                                                    onOpen();
                                                    return;
                                                }
                                            }}
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
                                            onClick={() => {
                                                if (!user) {
                                                    onOpen();
                                                    return;
                                                }
                                            }}
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
                    <div className="rectangle small-rectangle bg-white border-gray-600 rounded-lg w-full h-auto p-5">
                        <h3 className="font-lg text-center">Total Social Security Collected</h3>
                        <h1 className="text-5xl text-center font-extrabold">
                            ${Number(totalCash.toFixed(0)).toLocaleString()}
                        </h1>
                    </div>
                </div>
                <div className="right-column flex flex-col w-1/2 h-auto flex-grow">
                    <div className="rectangle large-rectangle bg-white border-gray-600 rounded-lg w-full h-full p-5">
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
                                <td>Current Age</td>
                                <td className="text-right pr-4 p-5">
                                    <input
                                        type="number"
                                        name="husbandAge"
                                        value={inputs.husbandAge}
                                        onClick={() => {
                                            if (!user) {
                                                onOpen();
                                                return;
                                            }
                                        }}
                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wifeAge"
                                        value={inputs.wifeAge}
                                        onClick={() => {
                                            if (!user) {
                                                onOpen();
                                                return;
                                            }
                                        }}
                                        onChange={handleChange}
                                        className="w-full text-right"
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
                                        onClick={() => {
                                            if (!user) {
                                                onOpen();
                                                return;
                                            }
                                        }}

                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                                <td className="text-right p-5">
                                    <input
                                        type="number"
                                        name="wLE"
                                        value={inputs.wLE}
                                        onClick={() => {
                                            if (!user) {
                                                onOpen();
                                                return;
                                            }
                                        }}

                                        onChange={handleChange}
                                        className="w-full text-right"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Primary Insurance Amount
                                    <span
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ cursor: 'pointer' }}
                                    >
                                         &#9432;
                                    </span>

                                </td>
                                <td className="text-right pr-4 p-5">
                                    <div className="flex items-center">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="hPIA"
                                            value={inputs.hPIA}
                                            onClick={() => {
                                                if (!user) {
                                                    onOpen();
                                                    return;
                                                }
                                            }}
                                            onChange={handleChange}
                                            className="w-full text-right"
                                        />
                                    </div>
                                </td>
                                <td className="text-right p-5">
                                    <div className="flex items-center">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="wPIA"
                                            value={inputs.wPIA}
                                            onClick={() => {
                                                if (!user) {
                                                    onOpen();
                                                    return;
                                                }
                                            }}
                                            onChange={handleChange}
                                            className="w-full text-right"
                                        />
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <PiaModal
                            isOpen={isModalOpen}
                            onChange={setIsModalOpen}
                            title="Primary Insurance Amount"
                            description="This is the monthly amount you would receive if you started collecting Social Security at your full retirement age."
                            position={modalPosition}
                        />
                    </div>
                </div>
            </div>

            <div className="outputs-container bg-white border-gray-600 p-4 rounded w-full mt-4 border-gray-400">
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
