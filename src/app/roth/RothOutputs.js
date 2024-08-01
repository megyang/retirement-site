"use client"
import React, {useEffect, useState} from 'react';
import Decimal from 'decimal.js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import BarChart from "@/app/components/BarChart";
import useRmdCalculations from "@/app/hooks/useRmdCalculations";
import {
    calculateTaxesForBrackets,
    calculateXNPV,
    findRmdByYear,
    findSsBenefitsByYear,
    formatNumberWithCommas
} from "@/app/utils/calculations";
import useAuthModal from "@/app/hooks/useAuthModal";
import {DataGrid, useGridApiRef} from '@mui/x-data-grid';
import debounce from 'lodash.debounce';
import TaxBarChart from "@/app/components/TaxBarChart";
import CustomColumnMenu from "@/app/components/CustomColumnMenu";
import CustomToolbar from "@/app/components/CustomToolbar";
import CustomPagination from "@/app/components/CustomPagination";
import {Bar} from "react-chartjs-2";

const RothOutputs = ({ inputs, inputs1, staticFields, setInputs1 }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { socialSecurityBenefits } = useSocialSecurityStore();
    const { onOpen } = useAuthModal();
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
    const age1 = inputs.husbandAge;
    const age2 = inputs.wifeAge;
    const husbandLEYear = currentYear + inputs.hLE - inputs.husbandAge;
    const wifeLEYear = currentYear + inputs.wLE - inputs.wifeAge;

    const [editableFields, setEditableFields] = useState(() => {
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
    const apiRef = useGridApiRef();

    const [versionData, setVersionData] = useState([]);
    const [savedVersions, setSavedVersions] = useState([
        { name: "Scenario 1" },
        { name: "Scenario 2" },
        { name: "Scenario 3" }
    ]);

    const [selectedVersion, setSelectedVersion] = useState("Select a scenario");
    const [triggerSave, setTriggerSave] = useState(false);

    const [editableScenario1, setEditableScenario1] = useState({});
    const [editableScenario2, setEditableScenario2] = useState({});
    const [editableScenario3, setEditableScenario3] = useState({});

    const handleInputChange = (e) => {
        if (!user) {
            onOpen();
            return;
        }
        const { name, value } = e.target;
        let numericValue = value.replace(/[$,%]/g, ''); // Remove dollar sign, commas, and percentage sign

        if (!isNaN(numericValue) && numericValue !== '') {
            // Convert to a percentage if the input field is a percentage field
            if (['beneficiary_tax_rate', 'roi', 'inflation'].includes(name)) {
                numericValue = parseFloat(numericValue) / 100;
            } else {
                numericValue = parseFloat(numericValue);
            }
            setInputs1(prevInputs => ({
                ...prevInputs,
                [name]: numericValue
            }));
            setTriggerSave(true);
        } else if (numericValue === '') {
            setInputs1(prevInputs => ({
                ...prevInputs,
                [name]: 0
            }));
            setTriggerSave(true);
        }
    };

    const fetchScenarioData = async () => {
        if (!user) return;

        const { data: scenario1, error: error1 } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', 'Scenario 1');

        const { data: scenario2, error: error2 } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', 'Scenario 2');

        const { data: scenario3, error: error3 } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', 'Scenario 3');

        if (error1 || error2 || error3) {
            console.error('Error loading scenarios:', error1 || error2 || error3);
            return;
        }

        setEditableScenario1(transformData(scenario1));
        setEditableScenario2(transformData(scenario2));
        setEditableScenario3(transformData(scenario3));
    };

    useEffect(() => {
        if (selectedVersion === 'Scenario 1') {
            fetchScenarioData();
        }
    }, [editableFields, selectedVersion]);

    const transformData = (data) => {
        const transformed = {};
        data.forEach(item => {
            if (!transformed[item.year]) {
                transformed[item.year] = {};
            }
            transformed[item.year] = {
                rothSpouse1: item.roth_1 || 0,
                rothSpouse2: item.roth_2 || 0,
                salary1: item.salary1 || 0,
                salary2: item.salary2 || 0,
                rentalIncome: item.rental_income || 0,
                interest: item.interest || 0,
                capitalGains: item.capital_gains || 0,
                pension: item.pension || 0
            };
        });
        return transformed;
    };

    const propagateUpdatesToScenarios = async (updatedData, fieldsToUpdate) => {
        try {
            const { data: scenario2Data, error: scenario2Error } = await supabaseClient
                .from('roth')
                .select('*')
                .eq('user_id', user.id)
                .eq('version_name', 'Scenario 2');

            const { data: scenario3Data, error: scenario3Error } = await supabaseClient
                .from('roth')
                .select('*')
                .eq('user_id', user.id)
                .eq('version_name', 'Scenario 3');

            if (scenario2Error || scenario3Error) {
                console.error('Error fetching scenarios:', scenario2Error || scenario3Error);
                return;
            }

            const updateScenarioData = (scenarioData, scenarioName) => {
                const updatedRows = scenarioData.map(row => {
                    const updatedRow = { ...row };
                    Object.keys(updatedData).forEach(year => {
                        if (updatedRow.year === parseInt(year)) {
                            fieldsToUpdate.forEach(field => {
                                // Check if the value exists in updatedData
                                if (updatedData[year] && updatedData[year][field] !== undefined) {
                                    updatedRow[field] = updatedData[year][field];
                                } else {
                                    console.warn(`Value for ${field} in year ${year} is undefined in updatedData.`);
                                }

                            });
                        }
                    });
                    return updatedRow;
                });

                return updatedRows;
            };

            const updatedScenario2Data = updateScenarioData(scenario2Data, 'Scenario 2');
            const updatedScenario3Data = updateScenarioData(scenario3Data, 'Scenario 3');

            const upsertData = async (scenarioData, scenarioName) => {
                const { error } = await supabaseClient.from('roth').upsert(scenarioData, { onConflict: ['user_id', 'version_name', 'year'] });
                if (error) {
                    console.error(`Error updating ${scenarioName}:`, error);
                }
            };

            await upsertData(updatedScenario2Data, 'Scenario 2');
            await upsertData(updatedScenario3Data, 'Scenario 3');

        } catch (error) {
            console.error('Error propagating updates:', error);
        }
    };



    const processRowUpdate = async (newRow, oldRow) => {
        try {
            const fieldName = newRow.id; // This is the field name like 'capitalGains', 'rothSpouse1', etc.
            const updatedData = {};

            // Ensure all values in newRow are converted to appropriate types
            Object.keys(newRow).forEach(year => {
                if (year !== 'id' && newRow[year] !== oldRow[year]) {
                    updatedData[year] = updatedData[year] || {};
                    updatedData[year][fieldName] = newRow[year] === null || newRow[year] === '' ? 0 : parseFloat(newRow[year]);
                }
            });


            // Update Scenario 1
            setEditableFields(prevEditableFields => {
                const newEditableFields = { ...prevEditableFields };
                Object.keys(updatedData).forEach(year => {
                    if (!newEditableFields[year]) {
                        newEditableFields[year] = {};
                    }
                    newEditableFields[year][fieldName] = updatedData[year][fieldName];
                });
                return newEditableFields;
            });

            // Fields to propagate
            const fieldsToPropagate = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
            if (fieldsToPropagate.includes(fieldName)) {
                await propagateUpdatesToScenarios(updatedData, [fieldName]);
            }

            // Trigger recalculations and save for Scenario 1
            setTriggerSave(true);
            return { ...newRow, ...updatedData };
        } catch (error) {
            console.error('Error processing row update', error);
            return oldRow;
        }
    };

    const processRowUpdateError = (error) => {
        console.error("Error updating row", error);
    };

    useEffect(() => {
        if(triggerSave) {
            saveVersion(selectedVersion)
            setTriggerSave(false);
            fetchScenarioData()
        }
    },[triggerSave, selectedVersion])


// ROTH CALCULATIONS START -----------
    const { ira1, ira2, roi } = inputs1;
    const {iraDetails, iraDetailsZeroRoth} = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE, editableFields);
    const iraD1 = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE, editableScenario1);
    const iraD2 = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE, editableScenario2);
    const iraD3 = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE, editableScenario3);

    const iraDetails1 = iraD1.iraDetails
    const iraDetails2 = iraD2.iraDetails
    const iraDetails3 = iraD3.iraDetails

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

    // save and load
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

        if (error) {
            console.error('Error loading version from Supabase:', error);
        } else {
            const loadedEditableFields = {};
            let loadedInputs1 = {
                ira1: 0,
                ira2: 0,
                roi: 0,
                inflation: 0,
                beneficiary_tax_rate: 0
            };

            data.forEach(item => {
                if (!loadedEditableFields[item.year]) {
                    loadedEditableFields[item.year] = {};
                }

                loadedEditableFields[item.year] = {
                    rothSpouse1: item.roth_1 || 0,
                    rothSpouse2: item.roth_2 || 0,
                    salary1: item.salary1 || 0,
                    salary2: item.salary2 || 0,
                    rentalIncome: item.rental_income || 0,
                    interest: item.interest || 0,
                    capitalGains: item.capital_gains || 0,
                    pension: item.pension || 0
                };

                loadedInputs1 = {
                    ira1: item.ira1 || 0,
                    ira2: item.ira2 || 0,
                    roi: item.roi || 0,
                    inflation: item.inflation || 0,
                    beneficiary_tax_rate: item.beneficiary_tax_rate || 0
                };
            });


            // Initialize missing years or fields in editableFields
            const currentYear = new Date().getFullYear();
            const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
            for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge)); year++) {
                if (!loadedEditableFields[year]) {
                    loadedEditableFields[year] = {
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
            }

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
                lifetime_tax: totalLifetimeTaxPaid.toFixed(0),
                beneficiary_tax: beneficiaryTaxPaid,
                lifetime0: totalLifetimeTaxPaidWithZeroRoth.toFixed(0),
                beneficiary0: beneficiaryTaxPaidWithZeroRoth,
                beneficiary_tax_rate: inputs1.beneficiary_tax_rate
            });
        }

        const { error } = await supabaseClient.from('roth').upsert(dataToSave, { onConflict: ['user_id', 'version_name', 'year'] });
        if (error) {
            console.error('saveVersion: Error saving data to Supabase:', error);
        } else {
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
            const defaultScenarios = ["Select a scenario", "Scenario 1", "Scenario 2", "Scenario 3"];
            let uniqueVersions = Array.from(new Set(data.map(item => item.version_name)))
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

            // Initialize default scenarios if they don't exist
            for (const scenario of defaultScenarios) {
                if (!uniqueVersions.some(version => version.name === scenario)) {
                    // Initialize default scenario
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
                        uniqueVersions.push({
                            name: scenario,
                            lifetime_tax: 0,
                            beneficiary_tax: 0,
                            lifetime0: 0,
                            beneficiary0: 0
                        });
                    }
                }
            }

            // Sort the versions alphabetically except for "Select a scenario"
            const sortedVersions = uniqueVersions.sort((a, b) => {
                if (a.name === "Select a scenario") return -1;
                if (b.name === "Select a scenario") return 1;
                return a.name.localeCompare(b.name);
            });

            setSavedVersions(sortedVersions.map(version => ({ name: version.name })));
            setVersionData(sortedVersions);

            // Ensure "Select a scenario" is selected by default
            if (sortedVersions.length > 0 && !sortedVersions.find(v => v.name === selectedVersion)) {
                setSelectedVersion("Select a scenario");
            }
        }
    };


    useEffect(() => {
        if (user) {
            fetchSavedVersions();
        }

    }, [user]);


/////social security benefits
    const annualInflationRate = inputs1.inflation;
    const startingStandardDeduction = 29200;

    const calculateStandardDeductionForYear = (year) => {
        const yearsDifference = year - currentYear;
        return startingStandardDeduction * Math.pow(1 + annualInflationRate, yearsDifference);
    };

    const calculateTotalIncomeForYear = (year, fields) => {
        const ssBenefits = findSsBenefitsByYear(socialSecurityBenefits, parseInt(year));
        const editableFieldsForYear = fields[year] || {
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

        return totalIncome.toFixed(0);
    };

    const calculateTaxableIncomes = (fields, staticFields, iraDetails, findSsBenefitsByYear, calculateTotalIncomeForYear, calculateStandardDeductionForYear) => {
        let taxableIncomes = {};

        Object.keys(staticFields).forEach(year => {
            const totalIncomeForYear = calculateTotalIncomeForYear(year, fields);
            const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));

            taxableIncomes[year] = Math.max(0, totalIncomeForYear - standardDeductionForYear);
        });

        return taxableIncomes;
    };

    const taxableIncomes = calculateTaxableIncomes(
        editableFields,
        staticFields,
        iraDetails,
        findSsBenefitsByYear,
        (year) => calculateTotalIncomeForYear(year, editableFields),
        calculateStandardDeductionForYear
    );

    const taxableIncomes1 = calculateTaxableIncomes(
        editableScenario1,
        staticFields,
        iraDetails1,
        findSsBenefitsByYear,
        (year) => calculateTotalIncomeForYear(year, editableScenario1),
        calculateStandardDeductionForYear
    );

    const taxableIncomes2 = calculateTaxableIncomes(
        editableScenario2,
        staticFields,
        iraDetails2,
        findSsBenefitsByYear,
        (year) => calculateTotalIncomeForYear(year, editableScenario2),
        calculateStandardDeductionForYear
    );

    const taxableIncomes3 = calculateTaxableIncomes(
        editableScenario3,
        staticFields,
        iraDetails3,
        findSsBenefitsByYear,
        (year) => calculateTotalIncomeForYear(year, editableScenario3),
        calculateStandardDeductionForYear
    );

    console.log("editableFields", editableFields);
    console.log("editableFields1", editableScenario1);
    console.log("editableFields2", editableScenario2);
    console.log("editableFields3", editableScenario3);

    console.log("taxableIncome", taxableIncomes);
    console.log("taxableIncome1", taxableIncomes1);
    console.log("taxableIncome2", taxableIncomes2);
    console.log("taxableIncome3", taxableIncomes3);

    const calculateTotalLifetimeTaxPaid = (taxableIncomes, inflation, currentYear) => {
        let totalSum = 0;
        Object.keys(taxableIncomes).forEach((year) => {
            const taxesForBrackets = calculateTaxesForBrackets(Math.max(0, taxableIncomes[year]), inflation, currentYear, year);
            const totalTax = Object.values(taxesForBrackets).reduce((sum, tax) => sum + tax, 0);
            totalSum += totalTax;
        });
        return totalSum;
    };

    const calculateBeneficiaryTaxPaid = (iraDetails, currentYear, husbandLEYear, wifeLEYear, beneficiary_tax_rate) => {
        const husbandEndingValue = iraDetails.spouse1.find(detail => detail.year === husbandLEYear)?.endingValue || 0;
        const wifeEndingValue = iraDetails.spouse2.find(detail => detail.year === wifeLEYear)?.endingValue || 0;
        const totalEndingValue = new Decimal(husbandEndingValue).plus(new Decimal(wifeEndingValue));
        return totalEndingValue.times(new Decimal(beneficiary_tax_rate));
    };

    const totalLifetimeTaxPaid = calculateTotalLifetimeTaxPaid(taxableIncomes, inputs1.inflation, currentYear);
    const totalLifetimeTaxPaid1 = calculateTotalLifetimeTaxPaid(taxableIncomes1, inputs1.inflation, currentYear);
    const totalLifetimeTaxPaid2 = calculateTotalLifetimeTaxPaid(taxableIncomes2, inputs1.inflation, currentYear);
    const totalLifetimeTaxPaid3 = calculateTotalLifetimeTaxPaid(taxableIncomes3, inputs1.inflation, currentYear);


    const beneficiaryTaxPaid = calculateBeneficiaryTaxPaid(iraDetails, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid1 = calculateBeneficiaryTaxPaid(iraDetails1, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid2 = calculateBeneficiaryTaxPaid(iraDetails2, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid3 = calculateBeneficiaryTaxPaid(iraDetails3, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    console.log("iraDetails", iraDetails);
    console.log("iraDetails1", iraDetails1);
    console.log("iraDetails2", iraDetails2);
    console.log("iraDetails3", iraDetails3);
    console.log("totallifetimetaxpaid", totalLifetimeTaxPaid);
    console.log("totallifetimetaxpaid1", totalLifetimeTaxPaid1);
    console.log("totallifetimetaxpaid2", totalLifetimeTaxPaid2);
    console.log("totallifetimetaxpaid3", totalLifetimeTaxPaid3);

    console.log("beneficiarytaxpaid", beneficiaryTaxPaid);
    console.log("beneficiarytaxpaid1", beneficiaryTaxPaid1);
    console.log("beneficiarytaxpaid2", beneficiaryTaxPaid2);
    console.log("beneficiarytaxpaid3", beneficiaryTaxPaid3);



    const calculateTotalTaxesPaid = (totalLifetimeTaxPaid, beneficiaryTaxPaid) => {
        return new Decimal(totalLifetimeTaxPaid).plus(new Decimal(beneficiaryTaxPaid)).toNumber();
    };

    const totalTaxesPaid = selectedVersion === "Select a scenario"
        ? 0
        : Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaid, beneficiaryTaxPaid)).toLocaleString();

    useEffect(() => {
        if (selectedVersion !== "Select a scenario") {
            const key = `taxes_${selectedVersion}`;
            const data = {
                totalLifetimeTaxesPaid: totalLifetimeTaxPaid,
                beneficiaryTaxesPaid: beneficiaryTaxPaid
            };
            localStorage.setItem(key, JSON.stringify(data));
        }
    }, [totalLifetimeTaxPaid, beneficiaryTaxPaid, selectedVersion]);


    const calculateTotalIncomeForYearWithZeroRoth = (year) => {
        const ssBenefits = findSsBenefitsByYear(socialSecurityBenefits, parseInt(year));
        const editableFieldsForYear = editableFields[year] || {
            salary1: 0,
            salary2: 0,
            rentalIncome: 0,
            interest: 0,
            capitalGains: 0,
            pension: 0
        };

        const rmdSpouse1 = findRmdByYear(iraDetailsZeroRoth.spouse1, parseInt(year));
        const rmdSpouse2 = findRmdByYear(iraDetailsZeroRoth.spouse2, parseInt(year));

        const totalIncome = new Decimal(0)
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

        return totalIncome.toFixed(0);
    };

    const calculateTaxableIncomesWithZeroRoth = (staticFields, iraDetailsZeroRoth, findSsBenefitsByYear, calculateTotalIncomeForYearWithZeroRoth, calculateStandardDeductionForYear) => {
        let taxableIncomes = {};

        Object.keys(staticFields).forEach(year => {
            const totalIncomeForYear = calculateTotalIncomeForYearWithZeroRoth(year);
            const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));

            taxableIncomes[year] = totalIncomeForYear - standardDeductionForYear;
        });

        return taxableIncomes;
    };

    const taxableIncomesWithZeroRoth = calculateTaxableIncomesWithZeroRoth(
        staticFields,
        iraDetailsZeroRoth,
        findSsBenefitsByYear,
        calculateTotalIncomeForYearWithZeroRoth,
        calculateStandardDeductionForYear
    );

    const calculateTotalLifetimeTaxPaidWithZeroRoth = (taxableIncomesWithZeroRoth, inflation, currentYear) => {
        let totalSum = 0;
        Object.keys(taxableIncomesWithZeroRoth).forEach((year) => {
            const taxesForBrackets = calculateTaxesForBrackets(Math.max(0, taxableIncomesWithZeroRoth[year]), inflation, currentYear, year);
            const totalTax = Object.values(taxesForBrackets).reduce((sum, tax) => sum + tax, 0);
            totalSum += totalTax;
        });
        return totalSum;
    };

    const calculateBeneficiaryTaxPaidWithZeroRoth = (iraDetailsZeroRoth, currentYear, husbandLEYear, wifeLEYear, beneficiary_tax_rate) => {
        const husbandEndingValueZeroRoth = iraDetailsZeroRoth.spouse1.find(detail => detail.year === husbandLEYear)?.endingValue || 0;
        const wifeEndingValueZeroRoth = iraDetailsZeroRoth.spouse2.find(detail => detail.year === wifeLEYear)?.endingValue || 0;
        const totalEndingValueZeroRoth = new Decimal(husbandEndingValueZeroRoth).plus(new Decimal(wifeEndingValueZeroRoth));
        return totalEndingValueZeroRoth.times(new Decimal(beneficiary_tax_rate));
    };

    const totalLifetimeTaxPaidWithZeroRoth = calculateTotalLifetimeTaxPaidWithZeroRoth(taxableIncomesWithZeroRoth, inputs1.inflation, currentYear);
    const beneficiaryTaxPaidWithZeroRoth = calculateBeneficiaryTaxPaidWithZeroRoth(iraDetailsZeroRoth, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);

    const transposedRows = [
        { id: 'ageSpouse1', label: 'Age (You)' },
        { id: 'ageSpouse2', label: 'Age (Spouse)' },
        { id: 'rothSpouse1', label: 'Roth Conversion (You)' },
        { id: 'rothSpouse2', label: 'Roth Conversion (Spouse)' },
        { id: 'salary1', label: 'Salary (You)' },
        { id: 'salary2', label: 'Salary (Spouse)' },
        { id: 'rentalIncome', label: 'Rental Income' },
        { id: 'interest', label: 'Interest / Dividends' },
        { id: 'capitalGains', label: 'Capital Gains' },
        { id: 'pension', label: 'Pension Withdrawals' },
        { id: 'rmdSpouse1', label: 'RMD (You)' },
        { id: 'rmdSpouse2', label: 'RMD (Spouse)' },
        { id: 'ssSpouse1', label: 'Social Security (You)' },
        { id: 'ssSpouse2', label: 'Social Security (Spouse)' },
        { id: 'totalIncome', label: 'Total Ordinary Income' },
        { id: 'standardDeductions', label: 'Standard Deductions' },
        { id: 'taxableIncome', label: 'Taxable Ordinary Income' }
    ];

    const getStaticFieldValue = (id, year) => {
        switch (id) {
            case 'ageSpouse1':
                return staticFields[year].ageSpouse1;
            case 'ageSpouse2':
                return staticFields[year].ageSpouse2;
            case 'rmdSpouse1':
                return Math.round(findRmdByYear(iraDetails.spouse1, parseInt(year)));
            case 'rmdSpouse2':
                return Math.round(findRmdByYear(iraDetails.spouse2, parseInt(year)));
            case 'ssSpouse1':
                return findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse1Benefit;
            case 'ssSpouse2':
                return findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse2Benefit;
            case 'totalIncome':
                return calculateTotalIncomeForYear(year, editableFields);
            case 'standardDeductions':
                return calculateStandardDeductionForYear(parseInt(year)).toFixed(0);
            case 'taxableIncome':
                return Math.max(0, calculateTotalIncomeForYear(year, editableFields) - calculateStandardDeductionForYear(parseInt(year))).toFixed(0);
            default:
                return 0;
        }
    };

    const [selectedCellParams, setSelectedCellParams] = useState([]);

    const handleCellClick = (params) => {
        setSelectedCellParams((prevSelected) => {
            const alreadySelected = prevSelected.some(cell => cell.id === params.id && cell.field === params.field);
            if (alreadySelected) {
                return prevSelected.filter(cell => !(cell.id === params.id && cell.field === params.field));
            }
            return [...prevSelected, params];
        });
    };

    const handleMultiEdit = async () => {
        const value = prompt('Enter the value to set for selected cells:');
        if (value !== null) {
            const updatedFields = { ...editableFields };
            const updates = selectedCellParams.map(({ id, field }) => {
                const year = parseInt(field);
                if (updatedFields[year]) {
                    updatedFields[year][id] = parseFloat(value);
                }
                return { id, field, value: parseFloat(value) };
            });

            // Update state
            setEditableFields(updatedFields);

            // Prepare data for propagation
            const updatedData = {};
            updates.forEach(({ id, field, value }) => {
                const year = parseInt(field);
                if (!updatedData[year]) {
                    updatedData[year] = {};
                }
                updatedData[year][id] = value;
            });

            // Fields to propagate
            const fieldsToPropagate = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
            const selectedRows = Array.from(new Set(selectedCellParams.map(param => param.id))); // Convert Set to Array
            if (selectedRows.some(rowId => fieldsToPropagate.includes(rowId))) {
                await propagateUpdatesToScenarios(updatedData, fieldsToPropagate);
            }

            // Clear selection after update
            setSelectedCellParams([]);
            setTriggerSave(true);
            // Update cells in the grid
            for (const update of updates) {
                await apiRef.current.setEditCellValue({ id: update.id, field: update.field, value: update.value, debounceMs: 200 });
                apiRef.current.stopCellEditMode({ id: update.id, field: update.field });
            }
        }
    };

    const handleRowEdit = async () => {
        const value = prompt('Enter the value to set for the entire row:');
        if (value !== null) {
            const selectedRows = Array.from(new Set(selectedCellParams.map(param => param.id))); // Convert Set to Array
            const updates = columns.filter(column => column.field !== 'label').map(column => {
                return { field: column.field, value: parseFloat(value) };
            });

            // Update state
            const updatedFields = { ...editableFields };
            selectedRows.forEach(rowId => {
                updates.forEach(({ field, value }) => {
                    const year = parseInt(field);
                    if (updatedFields[year]) {
                        updatedFields[year][rowId] = value;
                    }
                });
            });

            setEditableFields(updatedFields);

            // Prepare data for propagation
            const updatedData = {};
            selectedRows.forEach(rowId => {
                updates.forEach(({ field, value }) => {
                    const year = parseInt(field);
                    if (!updatedData[year]) {
                        updatedData[year] = {};
                    }
                    updatedData[year][rowId] = value;
                });
            });

            // Fields to propagate
            const fieldsToPropagate = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
            if (selectedRows.some(rowId => fieldsToPropagate.includes(rowId))) {
                await propagateUpdatesToScenarios(updatedData, fieldsToPropagate);
            }

            // Clear selection after update
            setSelectedCellParams([]);
            setTriggerSave(true);
            // Update cells in the grid
            for (const rowId of selectedRows) {
                for (const update of updates) {
                    await apiRef.current.setEditCellValue({ id: rowId, field: update.field, value: update.value });
                    apiRef.current.stopCellEditMode({ id: rowId, field: update.field });
                }
            }
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === 'Tab') {
            setSelectedCellParams([]);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const columns = [
        { field: 'label', headerName: 'Label', width: 200, headerAlign: 'center', pinned: 'left' },  // Pin the 'Label' column and set width to 250px
        ...Object.keys(staticFields).map((year) => ({
            field: year.toString(),
            headerName: year.toString(),
            width: 80,
            editable: true,
            sortable: false,
            headerAlign: 'center',
            renderCell: (params) => {
                if (params.row.id === 'standardDeductions') {
                    return (
                        <div style={{ textAlign: 'right', width: '100%' }}>
                            ({formatNumberWithCommas(params.value)})
                        </div>
                    );
                } else {
                    return (
                        <div style={{ textAlign: 'right', width: '100%' }}>
                            {formatNumberWithCommas(params.value)}
                        </div>
                    );
                }
            },
        }))
    ];


    const rows = transposedRows.map(row => {
        const newRow = { id: row.id, label: row.label };
        Object.keys(staticFields).forEach(year => {
            if (row.id.startsWith('age') || row.id.startsWith('rmd') || row.id.startsWith('ss') || row.id === 'totalIncome' || row.id === 'standardDeductions' || row.id === 'taxableIncome') {
                newRow[year] = getStaticFieldValue(row.id, year);
            } else {
                newRow[year] = editableFields[year][row.id] || 0;
            }
        });
        return newRow;
    });

    const editableRowIds = ['rothSpouse1', 'rothSpouse2', 'salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
    const isCellEditable = (params) => {
        const scenario = selectedVersion;
        const fieldsToDisable = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        return !((scenario === 'Scenario 2' || scenario === 'Scenario 3') && fieldsToDisable.includes(params.row.id));
    };

    const getRowClassName = (params) => {
        const editableRowIds = ['rothSpouse1', 'rothSpouse2', 'salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        if (params.row.id === 'ssSpouse2') {
            return 'ss-spouse-row';
        } else if (editableRowIds.includes(params.row.id)) {
            return 'editable-row';
        } else {
            return 'uneditable-row';
        }
    };

    const getCellClassName = (params) => {
        const scenario = selectedVersion;
        const fieldsToDisable = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        const isSelected = selectedCellParams.some(cell => cell.id === params.id && cell.field === params.field);
        const isUneditable = (scenario === 'Scenario 2' || scenario === 'Scenario 3') && fieldsToDisable.includes(params.row.id);

        let className = '';
        if (isSelected) {
            className += 'selected-cell ';
        }
        if (isUneditable) {
            className += 'uneditable-row ';
        }
        if (fieldsToDisable.includes(params.row.id)) {
            className += 'salary-row ';
        } else if (params.row.id === 'rothSpouse1' || params.row.id === 'rothSpouse2') {
            className += 'roth-row ';
        }

        return className.trim();
    };




    const getChartData = (version) => {
        const key = `taxes_${version.name}`;
        const localStorageData = localStorage.getItem(key);
        if (localStorageData) {
            const parsedData = JSON.parse(localStorageData);
            return {
                lifetime_tax: parsedData.totalLifetimeTaxesPaid,
                beneficiary_tax: parsedData.beneficiaryTaxesPaid
            };
        } else {
            return {
                lifetime_tax: version.lifetime_tax,
                beneficiary_tax: version.beneficiary_tax
            };
        }
    };

    const chartData = {
        labels: [
            `No Conversion`,
            'Scenario 1',
            'Scenario 2',
            'Scenario 3'
        ],
        datasets: [
            {
                label: 'Your Lifetime Taxes',
                data: [
                    selectedVersion !== "Select a scenario"
                        ? totalLifetimeTaxPaidWithZeroRoth.toFixed(0).toLocaleString()
                        : 0,
                    totalLifetimeTaxPaid1.toFixed(0).toLocaleString(),
                    totalLifetimeTaxPaid2.toFixed(0).toLocaleString(),
                    totalLifetimeTaxPaid3.toFixed(0).toLocaleString()
                ],
                backgroundColor: "#d95448",
            },
            {
                label: 'Beneficiary Lifetime Taxes',
                data: [
                    selectedVersion !== "Select a scenario"
                        ? beneficiaryTaxPaidWithZeroRoth.toFixed(0).toLocaleString()
                        : 0,
                    beneficiaryTaxPaid1.toFixed(0).toLocaleString(),
                    beneficiaryTaxPaid2.toFixed(0).toLocaleString(),
                    beneficiaryTaxPaid3.toFixed(0).toLocaleString()
                ],
                backgroundColor: "#f2cd88",
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        return `${label}: $${context.raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                    },
                },
            },
            legend: {
                position: 'bottom',
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
                        return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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


    const bracketTitles = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];
    const initialBrackets = [
        { threshold: 23200, rate: 0.10, color: '#465EA6' }, // Dark Blue
        { threshold: 94300, rate: 0.12, color: '#D95448' }, // Light Blue
        { threshold: 201050, rate: 0.22, color: '#F2CD88' }, // Light Yellow
        { threshold: 383900, rate: 0.24, color: '#8DAEF2' }, // Red
        { threshold: 487450, rate: 0.32, color: '#AFBCB7' }, // Greyish Blue
        { threshold: 731200, rate: 0.35, color: '#E2785B' }, // Light Red (or another color from your palette)
        { threshold: Infinity, rate: 0.37, color: '#366CD9' }  // Medium Blue (or another color from your palette)
    ];

    const zeroTaxBracketDataByYear = Object.keys(taxableIncomes).map(year => {
        const bracketData = bracketTitles.map((title, index) => ({
            label: title,
            filled: 0,
            remaining: initialBrackets[index].threshold,
            color: initialBrackets[index].color,
        }));
        return {
            year,
            data: bracketData,
        };
    });

    const adjustThresholdsForInflation = (initialBrackets, inflationRate, currentYear, targetYear) => {
        const yearsDifference = targetYear - currentYear;
        return initialBrackets.map(bracket => ({
            ...bracket,
            adjustedThreshold: bracket.threshold * Math.pow(1 + inflationRate, yearsDifference)
        }));
    };

    const taxBracketDataByYear = Object.keys(taxableIncomes).map(year => {
        const taxableIncome = taxableIncomes[year];
        const adjustedBrackets = adjustThresholdsForInflation(initialBrackets, inputs1.inflation, currentYear, year);
        const bracketData = [];
        let previousThreshold = 0;

        for (let i = 0; i < adjustedBrackets.length; i++) {
            const { adjustedThreshold, rate, color } = adjustedBrackets[i];
            let filled = 0;
            let remaining = 0;

            if (taxableIncome > previousThreshold) {
                filled = Math.min(taxableIncome - previousThreshold, adjustedThreshold - previousThreshold);
                remaining = adjustedThreshold - taxableIncome;
                if (remaining < 0) remaining = 0;
            } else {
                remaining = adjustedThreshold - previousThreshold;
            }

            bracketData.push({
                label: bracketTitles[i],
                filled: filled,
                remaining: remaining,
                color: color,
            });

            previousThreshold = adjustedThreshold;
        }

        return {
            year,
            data: bracketData,
        };
    });

    const dataForChart = selectedVersion === "Select a scenario" ? zeroTaxBracketDataByYear : taxBracketDataByYear;

    const createTableData = (details) => {
        const rows = {
            startingValue: { label: 'Starting Value', values: {} },
            investmentReturns: { label: 'Investment Returns', values: {} },
            rothConversion: { label: 'Roth Conversion', values: {} },
            rmd: { label: 'RMD', values: {} },
            endingValue: { label: 'Ending Value', values: {} },
        };

        details.forEach(detail => {
            rows.startingValue.values[detail.year] = formatNumberWithCommas(detail.startingValue);
            rows.investmentReturns.values[detail.year] = formatNumberWithCommas(detail.investmentReturns);
            rows.rothConversion.values[detail.year] = formatNumberWithCommas(detail.rothConversion);
            rows.rmd.values[detail.year] = formatNumberWithCommas(detail.rmd);
            rows.endingValue.values[detail.year] = formatNumberWithCommas(detail.endingValue);
        });

        return rows;
    };

    const husbandTableData = createTableData(iraDetails.spouse1);
    const wifeTableData = createTableData(iraDetails.spouse2);
    const maxLifeYear = Math.max(husbandLEYear, wifeLEYear);

    const husbandEndingValues = Object.keys(husbandTableData.endingValue.values).map(year => ({
        year,
        value: Math.round(parseFloat(husbandTableData.endingValue.values[year].replace(/,/g, '')))
    }));

    const wifeEndingValues = Object.keys(wifeTableData.endingValue.values).map(year => ({
        year,
        value: Math.round(parseFloat(wifeTableData.endingValue.values[year].replace(/,/g, '')))
    }));
    const extendedHusbandEndingValues = [];
    const extendedWifeEndingValues = [];

    for (let year = currentYear; year <= maxLifeYear; year++) {
        const husbandValue = husbandEndingValues.find(item => item.year === year.toString());
        const wifeValue = wifeEndingValues.find(item => item.year === year.toString());

        extendedHusbandEndingValues.push({
            year: year.toString(),
            value: husbandValue ? husbandValue.value : 0
        });

        extendedWifeEndingValues.push({
            year: year.toString(),
            value: wifeValue ? wifeValue.value : 0
        });
    }

    const iraChartLabels = extendedHusbandEndingValues.map(item => item.year);
    const iraChartData = {
        labels: iraChartLabels,
        datasets: [
            {
                label: 'Your IRA',
                data: extendedHusbandEndingValues.map(item => item.value),
                backgroundColor: '#d95448',
            },
            {
                label: 'Spouse IRA',
                data: extendedWifeEndingValues.map(item => item.value),
                backgroundColor: '#f2cd88',
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        scales: {
            x: {
                stacked: true
            },
            y: {
                stacked: true,
                ticks: {
                    callback: function (value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += '$' + context.raw.toLocaleString();
                        return label;
                    }
                }
            }
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col items-stretch">
            <div className="mb-5 text-left flex items-center space-x-2 w-full max-w-6xl">
                <div className="bg-white rounded p-2 flex-grow">
                    <select
                        className="w-full bg-white border-none"
                        value={selectedVersion}
                        onClick={() => {
                            if (!user)
                                onOpen();
                            return;
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
            <div className="bg-white p-4 rounded h-auto w-full max-w-6xl">
                <div className="text-lg text-left">
                    Total Taxes Paid
                </div>
                <BarChart chartData={chartData} chartOptions={chartOptions} />
            </div>

            {selectedVersion !== "Select a scenario" && (
                <>
                    <div className="flex mt-4 w-full space-x-4 flex-wrap justify-between max-w-6xl">
                        <div className="bg-white p-6 rounded flex-1 m-2 min-w-[300px] flex flex-col justify-center">
                            <h3 className="text-2xl text-center mb-4">{selectedVersion}: Total Taxes Paid</h3>
                            <div className="text-4xl font-bold text-center">
                                ${(totalTaxesPaid)}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded flex-1 m-2 min-w-[300px]">
                            <h3 className="text-left text-1xl">Other Inputs</h3>
                            <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Beneficiary Tax Rate:</label>
                                    <div className="relative w-32">
                                        <input
                                            type="text"
                                            name="beneficiary_tax_rate"
                                            value={`${(inputs1.beneficiary_tax_rate) * 100}`}
                                            onChange={handleInputChange}
                                            className="w-full h-8 text-right border border-gray-300 p-2 rounded pr-6"
                                        />
                                        <span className="absolute right-2 top-1">%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Your IRA:</label>
                                    <div className="w-32 ml-4">
                                        <input
                                            type="text"
                                            name="ira1"
                                            value={`$${formatNumberWithCommas(inputs1.ira1 || '')}`}
                                            onChange={handleInputChange}
                                            className="w-full h-8 text-right border border-gray-300 p-2 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Your Spouse’s IRA:</label>
                                    <div className="w-32 ml-4">
                                        <input
                                            type="text"
                                            name="ira2"
                                            value={`$${formatNumberWithCommas(inputs1.ira2 || '')}`}
                                            onChange={handleInputChange}
                                            className="w-full h-8 text-right border border-gray-300 p-2 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Investment Return:</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="roi"
                                            value={`${(inputs1.roi) * 100}`}
                                            onChange={handleInputChange}
                                            className="w-32 h-8 text-right border border-gray-300 p-2 rounded pr-6"
                                        />
                                        <span className="absolute right-2 top-1">%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Inflation Rate:</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="inflation"
                                            value={`${(inputs1.inflation) * 100}`}
                                            onChange={handleInputChange}
                                            className="w-32 h-8 text-right border border-gray-300 p-2 rounded pr-6"
                                        />
                                        <span className="absolute right-2 top-1">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full mt-4 bg-white p-4 rounded max-w-6xl">
                        <h2 className="text-xl font-semi-bold mb-3">Financial Plan Details</h2>
                        <div className="mb-4 p-4 bg-gray-100 rounded">
                            <p>Fill out the yellow rows first, then the red rows.</p>
                            <p>To use the buttons:</p>
                            <p>Edit multiple cells at once: First click on all the cells you want to have the same value, then the button.</p>
                            <p>Edit the row: Click on one cell in the row, then the button.</p>
                            <p>To deselect all, hit the enter key.</p>
                        </div>
                        <div className="items-center overflow-x-auto" style={{ height: 600 }}>
                            <DataGrid
                                apiRef={apiRef}
                                rows={rows}
                                rowHeight={40}
                                columns={columns}
                                pageSize={10}
                                rowsPerPageOptions={[10]}
                                getRowClassName={getRowClassName}
                                getCellClassName={getCellClassName}
                                isCellEditable={isCellEditable}
                                processRowUpdate={processRowUpdate}
                                onProcessRowUpdateError={processRowUpdateError}
                                onCellClick={handleCellClick}
                                slots={{
                                    toolbar: CustomToolbar,
                                    columnMenu: CustomColumnMenu,
                                    pagination: CustomPagination,
                                }}
                                slotProps={{
                                    toolbar: {
                                        someCustomString: 'Hello',
                                        someCustomNumber: 42,
                                        onMultiEdit: handleMultiEdit,
                                        onRowEdit: handleRowEdit,
                                    },
                                    columnMenu: { background: 'red', counter: rows.length }
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-4 bg-white p-4 rounded max-w-6xl">
                        <h2 className="text-lg mb-3">Ordinary Income Tax Brackets</h2>
                        <TaxBarChart data={dataForChart} />
                    </div>
                    <div className="mt-4 bg-white overflow-x-auto p-4 rounded max-w-6xl">
                        <h2 className="text-xl font-semi-bold mb-3">IRA</h2>
                        <Bar data={iraChartData} options={barChartOptions} />
                    </div>
                </>
            )}
        </div>
    );

};


export default RothOutputs;