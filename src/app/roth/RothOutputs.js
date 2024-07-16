"use client"
import React, {useEffect, useState} from 'react';
import Decimal from 'decimal.js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import BarChart from "@/app/components/BarChart";
import useRmdCalculations from "@/app/hooks/useRmdCalculations";
import useReferenceTable from "@/app/hooks/useReferenceTable";
import {calculateTaxesForBrackets, calculateXNPV, findRmdByYear, findSsBenefitsByYear} from "@/app/utils/calculations";
import { debounce } from 'lodash';
import useAuthModal from "@/app/hooks/useAuthModal";

const RothOutputs = ({ inputs, inputs1, editableFields, setEditableFields, staticFields, setInputs1 }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { benefitsBasedOnAge } = useReferenceTable(inputs);
    const { socialSecurityBenefits } = useSocialSecurityStore();
    const { onOpen } = useAuthModal();

    const [versionData, setVersionData] = useState([]);
    const [savedVersions, setSavedVersions] = useState([
        { name: "Scenario 1" },
        { name: "Scenario 2" },
        { name: "Scenario 3" }
    ]);

    const [selectedVersion, setSelectedVersion] = useState("Scenario 1");

    const handleInputChange = (e) => {
        if (!user) {
            onOpen();
            return;
        }
        const { name, value } = e.target;
        setInputs1(prevInputs => {
            const updatedInputs = {
                ...prevInputs,
                [name]: parseFloat(value),
            };
            debouncedSaveVersion();
            return updatedInputs;
        });
    };

    const debouncedSaveVersion = debounce(() => {
        saveVersion(selectedVersion);
    }, 10);

    const autoSaveToDatabase = async (year, fields) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const dataToSave = {
            user_id: user.id,
            version_name: selectedVersion,
            year: year,
            rental_income: fields.rentalIncome,
            capital_gains: fields.capitalGains,
            pension: fields.pension,
            roth_1: fields.rothSpouse1,
            roth_2: fields.rothSpouse2,
            salary1: fields.salary1,
            salary2: fields.salary2,
            interest: fields.interest,
            ira1: inputs1.ira1,
            ira2: inputs1.ira2,
            roi: inputs1.roi,
            inflation: inputs1.inflation,
            beneficiary_tax_rate: inputs1.beneficiary_tax_rate,
            age1: inputs.husbandAge,
            age2: inputs.wifeAge,
        };


        const { error } = await supabaseClient
            .from('roth')
            .upsert([dataToSave], { onConflict: ['user_id', 'version_name', 'year'] });

        if (error) {
            console.error('Error saving data to Supabase:', error);
        } else {
            console.log('Data being saved to the 000database:', dataToSave);
        }
    };



    const { ira1, ira2, roi } = inputs1;
    const age1 = inputs.husbandAge;
    const age2 = inputs.wifeAge;
    const {iraDetails, totals} = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE);

// ROTH CALCULATIONS START -----------
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
    [editableFields, setEditableFields] = useState(() => {
        const fields = {};
        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(age1, age2)); year++) {
            fields[year] = {
                rothSpouse1: 0,
                rothSpouse2: 0,
                salary1: 0,
                salary2: 0,
                rentalIncome: 0,
                interest: 0,
                capitalGains: 0,
                pension: 0
            };
        }
        return fields;
    });

    staticFields = {};
    for (let year = currentYear, ageSpouse1 = inputs.husbandAge, ageSpouse2 = inputs.wifeAge;
         year <= currentYear + maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge);
         year++, ageSpouse1++, ageSpouse2++) {
        staticFields[year] = {
            year: year,
            ageSpouse1: ageSpouse1,
            ageSpouse2: ageSpouse2,
        };
    }


    // save, load, and delete functions
    const loadVersion = async (version) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', version.name);
        console.log(user.id);
        console.log(version.name);

        if (error) {
            console.error('Error loading version from Supabase:', error);
        } else {
            const loadedEditableFields = {};
            let loadedInputs1 = {
                age1: 0,
                age2: 0,
                ira1: 0,
                ira2: 0,
                roi: 0,
                inflation: 0,
                beneficiary_tax_rate: 0
            };

            data.forEach(item => {
                loadedEditableFields[item.year] = {
                    rothSpouse1: item.roth_1,
                    rothSpouse2: item.roth_2,
                    salary1: item.salary1,
                    salary2: item.salary2,
                    rentalIncome: item.rental_income,
                    interest: item.interest,
                    capitalGains: item.capital_gains,
                    pension: item.pension
                };

                loadedInputs1 = {
                    ira1: item.ira1,
                    ira2: item.ira2,
                    roi: item.roi,
                    inflation: item.inflation,
                    beneficiary_tax_rate: item.beneficiary_tax_rate
                };

            });

            setEditableFields(loadedEditableFields);
            setInputs1(loadedInputs1);
        }
    };

    const saveVersion = async (versionName) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        // Clone editableFields and set roth1 and roth2 to zero for all years
        const editableFieldsWithZeroRoth = JSON.parse(JSON.stringify(editableFields));
        Object.keys(editableFieldsWithZeroRoth).forEach(year => {
            editableFieldsWithZeroRoth[year].rothSpouse1 = 0;
            editableFieldsWithZeroRoth[year].rothSpouse2 = 0;
        });

        const calculateTotalIncomeForYearWithZeroRoth = (year, editableFieldsWithZeroRoth) => {
            const ssBenefits = findSsBenefitsByYear(socialSecurityBenefits, parseInt(year));
            const editableFieldsForYear = editableFieldsWithZeroRoth[year];
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

        // Calculate lifetime0 and beneficiary0 with roth1 and roth2 set to zero
        const taxableIncomesWithZeroRoth = calculateTaxableIncomes(
            staticFields,
            iraDetails,
            findSsBenefitsByYear,
            (year) => calculateTotalIncomeForYearWithZeroRoth(year, editableFieldsWithZeroRoth),
            calculateStandardDeductionForYear
        );

        const totalLifetimeTaxPaidWithZeroRoth = Object.keys(taxableIncomesWithZeroRoth).reduce(
            (total, year) => total.plus(new Decimal(taxableIncomesWithZeroRoth[year])),
            new Decimal(0)
        );

        const beneficiaryTaxPaidWithZeroRoth = totalInheritedIRA.times(inputs1.beneficiary_tax_rate).toFixed(2);

        const dataToSave = [];
        for (let year in editableFields) {
            dataToSave.push({
                user_id: user.id,
                version_name: versionName,
                year: year,
                rental_income: editableFields[year].rentalIncome,
                capital_gains: editableFields[year].capitalGains,
                pension: editableFields[year].pension,
                roth_1: editableFields[year].rothSpouse1,
                roth_2: editableFields[year].rothSpouse2,
                salary1: editableFields[year].salary1,
                salary2: editableFields[year].salary2,
                interest: editableFields[year].interest,
                age1: inputs.husbandAge,
                age2: inputs.wifeAge,
                ira1: inputs1.ira1,
                ira2: inputs1.ira2,
                roi: inputs1.roi,
                inflation: inputs1.inflation,
                lifetime_tax: totalLifetimeTaxPaid.toFixed(2),
                beneficiary_tax: beneficiaryTaxPaid,
                lifetime0: totalLifetimeTaxPaidWithZeroRoth.toFixed(2),
                beneficiary0: beneficiaryTaxPaidWithZeroRoth,
                beneficiary_tax_rate: inputs1.beneficiary_tax_rate
            });
        }

        const { error } = await supabaseClient.from('roth').upsert(dataToSave, { onConflict: ['user_id', 'version_name', 'year'] });
        if (error) {
            console.error('saveVersion: Error saving data to Supabase:', error);
        } else {
            console.log('Data successfully saved to Supabase.');
            await fetchSavedVersions();
        }
    };

    const fetchSavedVersions = async () => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roth')
            .select('version_name, lifetime_tax, beneficiary_tax, lifetime0, beneficiary0')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching versions from Supabase:', error);
        } else {
            const uniqueVersions = Array.from(new Set(data.map(item => item.version_name)))
                .map(name => {
                    const version = data.find(item => item.version_name === name);
                    return {
                        name: name,
                        lifetime_tax: version.lifetime_tax,
                        beneficiary_tax: version.beneficiary_tax,
                        lifetime0: version.lifetime0,
                        beneficiary0: version.beneficiary0
                    };
                });

            const defaultScenarios = ["Scenario 1", "Scenario 2", "Scenario 3"];
            const sortedVersions = [
                ...defaultScenarios.map(scenario => uniqueVersions.find(version => version.name === scenario)).filter(Boolean),
                ...uniqueVersions.filter(version => !defaultScenarios.includes(version.name))
            ];

            // Initialize default scenarios if they don't exist
            defaultScenarios.forEach(async (scenario) => {
                if (!sortedVersions.find(version => version.name === scenario)) {
                    const dataToSave = [];
                    for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge)); year++) {
                        dataToSave.push({
                            user_id: user.id,
                            version_name: scenario,
                            year: year,
                            rental_income: 0,
                            capital_gains: 0,
                            pension: 0,
                            roth_1: 0,
                            roth_2: 0,
                            salary1: 0,
                            salary2: 0,
                            interest: 0,
                            age1: inputs.husbandAge,
                            age2: inputs.wifeAge,
                            ira1: inputs1.ira1,
                            ira2: inputs1.ira2,
                            roi: inputs1.roi,
                            inflation: inputs1.inflation,
                            lifetime_tax: 0,
                            beneficiary_tax: 0,
                            lifetime0: 0,
                            beneficiary0: 0,
                            beneficiary_tax_rate: inputs1.beneficiary_tax_rate
                        });
                    }

                    const { error } = await supabaseClient.from('roth').upsert(dataToSave, { onConflict: ['user_id', 'version_name', 'year'] });
                    if (error) {
                        console.error(`Error initializing ${scenario}:`, error);
                    } else {
                        console.log(`${scenario} initialized with default values.`);
                    }
                }
            });

            setSavedVersions(sortedVersions.map(version => ({ name: version.name })));
            setVersionData(sortedVersions);
            if (sortedVersions.length > 0 && !sortedVersions.find(v => v.name === selectedVersion)) {
                setSelectedVersion(sortedVersions[0].name);
            }
        }
    };


    useEffect(() => {
        if (user) {
            fetchSavedVersions();
        }
    }, [user]);

    const handleEditableFieldChange = (year, field, value) => {
        console.log(`Updating ${field} for year ${year} to value:`, value);
        if (value.trim() === '' || isNaN(value)) {
            alert('Please enter a valid number');
            return;
        }

        setEditableFields(prev => {
            const updatedFields = {
                ...prev,
                [year]: {
                    ...prev[year],
                    [field]: parseFloat(value)
                }
            };
            console.log('Updated editableFields:', updatedFields);
            return updatedFields;
        });
        debouncedSaveAndAutoSave(year, field, parseFloat(value));

    };
    const debouncedSaveAndAutoSave = debounce((year, field, value) => {
        saveVersion(selectedVersion);
        autoSaveToDatabase(year, { ...editableFields[year], [field]: value });
    }, 10);

    useEffect(() => {
        return () => {
            debouncedSaveAndAutoSave.cancel();
        };
    }, []);

    const renderEditableFieldInput = (year, field) => {
        return (
            <input
                type="text"
                className="w-full p-1 border border-gray-300 rounded text-right"
                name={`${year}-${field}`}
                value={editableFields[year][field]}
                onClick={() => {
                    if (!user) {
                        onOpen();
                        return;
                    }
                }}
                onChange={(e) => handleEditableFieldChange(year, field, e.target.value)}
            />
        );
    };


/////social security benefits
    const currentYear1 = new Date().getFullYear();
    const [tableData, setTableData] = useState([]);
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
        const yearsToCover = maxLifeExpectancy - Math.min(inputs1.age1, inputs1.age2) + 1;

        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear1 + i;
            const husbandAge = inputs1.age1 + i;
            const wifeAge = inputs1.age2 + i;

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
            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return { year, husbandAge, wifeAge, husbandBenefit: husbandBenefit.toFixed(2), wifeBenefit: wifeBenefit.toFixed(2) };
        });

        setTableData(newTableData);

    }, [inputs, currentYear1, benefitsBasedOnAge.husbandYearly, benefitsBasedOnAge.wifeYearly]);


    const [annualInflationRate, setAnnualInflationRate] = useState(inputs1.inflation/100);

    const startingStandardDeduction = 29200;

    const calculateStandardDeductionForYear = (year) => {
        const yearsDifference = year - currentYear; // Assuming 'currentYear' is the base year
        return startingStandardDeduction * Math.pow(1 + annualInflationRate, yearsDifference);
    };

    const calculateTotalIncomeForYear = (year) => {
        const ssBenefits = findSsBenefitsByYear(parseInt(year));
        const editableFieldsForYear = editableFields[year];
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

    const calculateTaxableIncomes = (staticFields, iraDetails, findSsBenefitsByYear, calculateTotalIncomeForYear, calculateStandardDeductionForYear) => {
        let taxableIncomes = {};

        Object.keys(staticFields).forEach(year => {
            const totalIncomeForYear = calculateTotalIncomeForYear(year);
            const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));

            taxableIncomes[year] = totalIncomeForYear - standardDeductionForYear;
        });

        return taxableIncomes;
    };

    const taxableIncomes = calculateTaxableIncomes(
        staticFields,
        iraDetails,
        findSsBenefitsByYear,
        calculateTotalIncomeForYear,
        calculateStandardDeductionForYear
    );
    const totalInheritedIRA = totals.inheritedIRAHusband.plus(totals.inheritedIRAWife);
    const beneficiaryTaxPaid = totalInheritedIRA.times(inputs1.beneficiary_tax_rate).toFixed(2);

    const totalLifetimeTaxPaid = Object.keys(taxableIncomes).reduce(
        (total, year) => total.plus(new Decimal(taxableIncomes[year])),
        new Decimal(0)
    );



    const chartData = {
        labels: ["No Conversion", ...Array.from(new Set(versionData.map(item => item.name)))],
        datasets: [
            {
                label: 'Lifetime Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[0].lifetime0) : 0, ...versionData.map(item => item.lifetime_tax)],
                backgroundColor: 'rgba(173, 216, 230, 0.6)', // Light blue
                borderColor: 'black',
                borderWidth: 1,
            },
            {
                label: 'Beneficiary Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[0].beneficiary0) : 0, ...versionData.map(item => item.beneficiary_tax)],
                backgroundColor: 'rgba(255, 182, 193, 0.6)', // Light pink
                borderColor: 'black',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `$${context.raw}`;
                    },
                },
            },
            legend: {
                position: 'top',
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
                ticks: {
                    callback: function (value) {
                        return `$${value}`;
                    },
                },
            },
        },
    };


    // Compute Total Cash for Lifetime Tax Paid
    const [npvLifetimeTax, setNpvLifetimeTax] = useState(0);
    const [npvBeneficiaryTax, setNpvBeneficiaryTax] = useState(0);


    useEffect(() => {
        // For Lifetime Tax Paid NPV
        const cashFlowsLifetimeTax = Object.keys(taxableIncomes).map(year => new Decimal(taxableIncomes[year]));
        const datesLifetimeTax = Object.keys(taxableIncomes).map(year => new Date(parseInt(year), 0, 1));
        const npvLifetimeTaxValue = calculateXNPV(inputs.roi / 100, cashFlowsLifetimeTax, datesLifetimeTax);

        setNpvLifetimeTax(npvLifetimeTaxValue);

        // For Beneficiary Tax Paid NPV
        const futureYear = currentYear + Math.max(inputs.hLE - age1, inputs.wLE - age2);
        const cashFlowBeneficiaryTax = new Decimal(beneficiaryTaxPaid);
        const dateBeneficiaryTax = new Date(futureYear, 0, 1);
        const npvBeneficiaryTaxValue = calculateXNPV(inputs.roi / 100, [cashFlowBeneficiaryTax], [dateBeneficiaryTax]);
        setNpvBeneficiaryTax(npvBeneficiaryTaxValue);

    }, [inputs.roi, taxableIncomes, beneficiaryTaxPaid, inputs1, currentYear, age1, inputs.hLE, age2, inputs.wLE]);

    //ordinary income tax calc -------
    const bracketTitles = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex-col">
                <div className="bg-white p-4 rounded h-auto w-full">
                    <h3 className=" text-left text-2xl">
                        Total Taxes Paid
                    </h3>
                    <BarChart chartData={chartData} chartOptions={chartOptions} />
                </div>
                <div className="mt-4 text-left flex items-center space-x-2 w-full">
                    <div className="bg-white rounded p-2 flex-grow">
                        <select
                            className="w-full bg-white border-none"
                            value={selectedVersion}
                            onClick={() => {
                                if (!user) {
                                    onOpen();
                                    return;
                                }
                            }}
                            onChange={(e) => {
                                if (user) {
                                    setSelectedVersion(e.target.value);
                                    const version = savedVersions.find(v => v.name === e.target.value);
                                    if (version) {
                                        loadVersion(version);
                                    }
                                }
                            }}
                        >
                            {savedVersions.map((version, index) => (
                                <option key={index} value={version.name}>
                                    {version.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex mt-4 w-full space-x-4">
                    <div className="bg-white p-6 rounded flex-1 w-2 flex flex-col justify-center">
                        <h3 className="text-2xl text-center mb-4">{selectedVersion}: Total Taxes Saved</h3>
                        <div className="text-4xl font-bold text-center">
                            ${(parseFloat(versionData.find(v => v.name === selectedVersion)?.lifetime_tax || 0) + parseFloat(versionData.find(v => v.name === selectedVersion)?.beneficiary_tax || 0)).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded flex-1 w-2">
                        <h3 className="text-left text-1xl">Other Inputs</h3>
                        <div className="">
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex-grow">Beneficiary Tax Rate:</label>
                                <input
                                    type="number"
                                    name="beneficiary_tax_rate"
                                    value={inputs1.beneficiary_tax_rate * 100}
                                    onChange={(e) => {
                                        const { name, value } = e.target;
                                        setInputs1(prevInputs => {
                                            const updatedInputs = {
                                                ...prevInputs,
                                                [name]: parseFloat(value) / 100,
                                            };
                                            debouncedSaveVersion();
                                            return updatedInputs;
                                        });
                                    }}
                                    className="border rounded p-1 w-24 text-right"
                                />%
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex-grow">Your IRA:</label>
                                <input
                                    type="number"
                                    name="ira2"
                                    value={inputs1.ira2}
                                    onChange={handleInputChange}
                                    className="border rounded w-24 text-right"
                                />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex-grow">Your Spouse’s IRA:</label>
                                <input
                                    type="number"
                                    name="ira1"
                                    value={inputs1.ira1}
                                    onChange={handleInputChange}
                                    className="border rounded w-24 text-right"
                                />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex-grow">Investment Return:</label>
                                <input
                                    type="number"
                                    name="roi"
                                    value={inputs1.roi}
                                    onChange={handleInputChange}
                                    className="border rounded w-24 text-right"
                                />%
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex-grow">Inflation Rate:</label>
                                <input
                                    type="number"
                                    name="inflation"
                                    value={inputs1.inflation}
                                    onChange={handleInputChange}
                                    className="border rounded w-24 text-right"
                                />%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                            <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findSsBenefitsByYear(parseInt(year)).spouse1Benefit}</td>
                        ))}
                    </tr>
                    <tr>
                        <td className="px-3 py-2 text-left whitespace-nowrap">SS Spouse 2</td>
                        {Object.keys(staticFields).map((year) => (
                            <td key={year} className="px-3 py-2 text-center whitespace-nowrap">{findSsBenefitsByYear(parseInt(year)).spouse2Benefit}</td>
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

            {/*
                <div className="totals-display"
                     style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px', marginBottom: '20px'}}>
                    <div className="total-rmds" style={{textAlign: 'center', padding: '10px'}}>
                        <h2 style={{marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: 'bold'}}>Total
                            RMDs</h2>
                        <div
                            style={{marginBottom: '10px'}}>Husband: <strong>${totals.totalRMDsHusband.toFixed(2)}</strong>
                        </div>
                        <div style={{marginBottom: '10px'}}>Wife: <strong>${totals.totalRMDsWife.toFixed(2)}</strong>
                        </div>
                        <div>Total: <strong>${totals.totalRMDsHusband.plus(totals.totalRMDsWife).toFixed(2)}</strong>
                        </div>
                    </div>
                    <div className="total-taxes-paid" style={{textAlign: 'center', padding: '10px'}}>
                        <h2 style={{marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: 'bold'}}>Total
                            Taxes Paid </h2>
                        <h1>Total Cash</h1>
                        <div>Lifetime Tax Paid: <strong>${totalLifetimeTaxPaid.toFixed(2)}</strong></div>
                        <div>Beneficiary Tax Paid: <strong>${beneficiaryTaxPaid}</strong></div>
                        <h1>Net Present Value</h1>
                        <div>Lifetime Tax NPV: <strong>${npvLifetimeTax.toFixed(2)}</strong></div>
                        <div>Beneficiary Tax NPV: <strong>${npvBeneficiaryTax.toFixed(2)}</strong></div>

                    </div>

                    <div className="inherited-iras" style={{textAlign: 'center', padding: '10px', width: '30%'}}>
                        <h2 style={{
                            marginBottom: '15px',
                            color: '#333',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>Inherited Pre-Tax IRA</h2>
                        <div
                            style={{marginBottom: '10px'}}>Husband: <strong>${totals.inheritedIRAHusband.toFixed(2)}</strong>
                        </div>
                        <div style={{marginBottom: '10px'}}>Wife: <strong>${totals.inheritedIRAWife.toFixed(2)}</strong>
                        </div>
                        <div>Total: <strong>${totalInheritedIRA.toFixed(2)}</strong></div>
                        <div>
                            <label htmlFor="beneficiaryTaxRate"
                                   style={{fontWeight: 'normal', color: '#333', fontSize: '16px', marginRight: '10px'}}>Beneficiary
                                Tax Rate:</label>
                            <input
                                id="beneficiaryTaxRate"
                                type="number"
                                value={beneficiaryTaxRate * 100}
                                onChange={handleTaxRateChange}
                                style={{
                                    flex: '1',
                                    textAlign: 'right',
                                    padding: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px'
                                }}
                            />%
                        </div>
                        <div style={{marginTop: '10px'}}>
                            Beneficiary Tax Paid: <strong>${beneficiaryTaxPaid}</strong>
                        </div>
                    </div>
                </div>*/}

            {/*
            <h2 className="text-xl font-semibold mb-3">Financial Plan Details</h2>
            <table className="min-w-full table-fixed border-collapse border border-slate-400">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Year</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Rental Income</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Interest / Dividend</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Capital Gains</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Pension</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">ss spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">ss spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">total ordinary income</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">standard deductions</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">taxable ordinary income</th>


                </tr>
                </thead>

                <tbody>
                {Object.keys(staticFields).map((year, index) => {
                    const ssBenefits = findSsBenefitsByYear(parseInt(year));
                    const totalIncomeForYear = calculateTotalIncomeForYear(year);
                    const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
                    const taxableIncomeForYear = totalIncomeForYear - standardDeductionForYear;
                    return (
                        <tr key={year}>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse1}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse2}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse1')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse2')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary1')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary2')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rentalIncome')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'interest')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'capitalGains')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'pension')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse1, parseInt(year))}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse2, parseInt(year))}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse1Benefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse2Benefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${totalIncomeForYear}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">-${standardDeductionForYear.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${taxableIncomeForYear.toFixed(2)}</td>


                        </tr>
                    )
                })}

                </tbody>
            </table>
*/}
            {/*ORDINARY INCOME TAX BRACKET*/}
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


export default RothOutputs;