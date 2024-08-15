"use client"
import React, {useEffect, useState} from 'react';
import Decimal from 'decimal.js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import BarChart from "@/app/components/BarChart";
import useRmdCalculations from "@/app/hooks/useRmdCalculations";
import {
    calculateAge,
    calculateTaxesForBrackets,
    calculateXNPV,
    findRmdByYear,
    findSsBenefitsByYear,
    formatNumberWithCommas
} from "@/app/utils/calculations";
import useAuthModal from "@/app/hooks/useAuthModal";
import {DataGrid, useGridApiRef} from '@mui/x-data-grid';
import TaxBarChart from "@/app/components/TaxBarChart";
import CustomColumnMenu from "@/app/components/CustomColumnMenu";
import CustomToolbar from "@/app/components/CustomToolbar";
import CustomPagination from "@/app/components/CustomPagination";
import {Bar} from "react-chartjs-2";
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import useInfoStore from "@/app/store/useInfoStore";

Chart.register(ChartDataLabels);

const RothOutputs = ({ inputs, inputs1, staticFields, setStaticFields, setInputs1 }) => {
    const { info, fetchInfo } = useInfoStore();
    let wLE = inputs.wLE
    const hLE = inputs.hLE
    let wifeAge = inputs.wifeAge
    const husbandAge = inputs.husbandAge
    if (!info?.married || (info?.married && !info?.filing)) {
        wLE = inputs.hLE
        wifeAge = inputs.husbandAge
    }
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { socialSecurityBenefits } = useSocialSecurityStore();
    const { onOpen } = useAuthModal();
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(hLE, wLE);
    const age1 = husbandAge;
    const age2 = wifeAge;
    const husbandLEYear = currentYear + hLE - husbandAge;
    const wifeLEYear = currentYear + wLE - wifeAge;
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        if (user) {
            fetchInfo(supabaseClient, user.id); // Fetch info data when user is available
        }
    }, [user]);

    useEffect(() => {
        if (info) {
            // Calculate current age and spouse age if applicable
            const currentAge = calculateAge(info.month, info.year);
            const spouseCurrentAge = info.married ? calculateAge(info.spouse_month, info.spouse_year) : calculateAge(info.month, info.year);

            let yearsToCover;

            if (!info.married || (info.married && !info.filing)) {
                // If not married or married but not filing jointly, use hLE only
                yearsToCover = hLE - currentAge + 1;
            } else if (info.married && info.filing) {
                // If married and filing jointly, consider both hLE and wLE
                const yearsRemainingHusband = hLE - currentAge;
                const yearsRemainingWife = wLE - spouseCurrentAge;
                yearsToCover = Math.max(yearsRemainingHusband, yearsRemainingWife) + 1;
            }

            // Update staticFields to include ages from now until the latest life expectancy
            const updatedStaticFields = {};
            for (let year = currentYear, ageSpouse1 = currentAge, ageSpouse2 = spouseCurrentAge;
                 year <= currentYear + yearsToCover - 1;
                 year++, ageSpouse1++, ageSpouse2++) {
                updatedStaticFields[year] = {
                    year: year,
                    ageSpouse1: ageSpouse1,
                    ageSpouse2: ageSpouse2,
                };
            }
            setStaticFields(updatedStaticFields);
        }
    }, [info, inputs]);

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
    console.log(editableFields)

    const [savedVersions, setSavedVersions] = useState([
        { name: "Scenario 1" },
        { name: "Scenario 2" },
        { name: "Scenario 3" }
    ]);

    const [selectedVersion, setSelectedVersion] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem("selectedScenario") || "Scenario 1";
        }
        return "Scenario 1";
    });

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
        fetchScenarioData();
    }, [editableFields, selectedVersion]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const transformData = (data) => {
        const transformed = {};
        data.forEach(item => {
            if (!transformed[item.year]) {
                transformed[item.year] = {};
            }
            transformed[item.year] = {
                rothSpouse1: item.rothSpouse1 || 0,
                rothSpouse2: item.rothSpouse2 || 0,
                salary1: item.salary1 || 0,
                salary2: item.salary2 || 0,
                rentalIncome: item.rentalIncome || 0,
                interest: item.interest || 0,
                capitalGains: item.capitalGains || 0,
                pension: item.pension || 0
            };
        });
        return transformed;
    };
    const propagateInputsToScenarios = async () => {
        try {
            const scenarios = ['Scenario 2', 'Scenario 3'];

            for (const scenario of scenarios) {
                await supabaseClient
                    .from('roth')
                    .update({
                        ira1: inputs1.ira1,
                        ira2: inputs1.ira2,
                        roi: inputs1.roi,
                        beneficiary_tax_rate: inputs1.beneficiary_tax_rate,
                    })
                    .eq('user_id', user.id)
                    .eq('version_name', scenario);
            }
        } catch (error) {
            console.error('Error propagating inputs to other scenarios:', error);
        }
    };
    useEffect(() => {
        if (selectedVersion === 'Scenario 1' && triggerSave) {
            propagateInputsToScenarios();
        }
    }, [inputs1, selectedVersion, triggerSave]);

    useEffect(() => {
        if (selectedVersion === 'Scenario 1' && triggerSave) {
            propagateInputsToScenarios();
        }
    }, [inputs1, selectedVersion, triggerSave]);

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
    if (!info?.married || (info?.married && !info?.filing)) {
        inputs1.ira2 = 0;
    }
    const { ira1, ira2, roi } = inputs1;

    const {iraDetails, iraDetailsZeroRoth} = useRmdCalculations(age1, age2, ira1, ira2, roi, hLE, wLE, editableFields);
    const iraD1 = useRmdCalculations(age1, age2, ira1, ira2, roi, hLE, wLE, editableScenario1);
    const iraD2 = useRmdCalculations(age1, age2, ira1, ira2, roi, hLE, wLE, editableScenario2);
    const iraD3 = useRmdCalculations(age1, age2, ira1, ira2, roi, hLE, wLE, editableScenario3);

    const iraDetails1 = iraD1.iraDetails
    const iraDetails2 = iraD2.iraDetails
    const iraDetails3 = iraD3.iraDetails

    staticFields = {};
    console.log(inputs)
    for (let year = currentYear, ageSpouse1 = inputs.husbandAge, ageSpouse2 = wifeAge;
         year <= currentYear + maxLifeExpectancy - Math.min(inputs.husbandAge, wifeAge);
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
                ira1: 800000,
                ira2: 1000000,
                roi: 0.03,
                beneficiary_tax_rate: 0.24
            };

            data.forEach(item => {
                if (!loadedEditableFields[item.year]) {
                    loadedEditableFields[item.year] = {
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


                loadedEditableFields[item.year] = {
                    rothSpouse1: item.rothSpouse1 || 0,
                    rothSpouse2: (info?.married && info?.filing) ? (item.rothSpouse2 || 0) : 0,
                    salary1: item.salary1 || 0,
                    salary2: (info?.married && info?.filing) ? (item.salary2 || 0) : 0,
                    rentalIncome: item.rentalIncome || 0,
                    interest: item.interest || 0,
                    capitalGains: item.capitalGains || 0,
                    pension: item.pension || 0
                };

                loadedInputs1 = {
                    ira1: item.ira1 || 0,
                    ira2: item.ira2 || 0,
                    roi: item.roi || 0,
                    beneficiary_tax_rate: item.beneficiary_tax_rate || 0
                };
            });

            // Initialize missing years or fields in editableFields
            const currentYear = new Date().getFullYear();
            const maxLifeExpectancy = Math.max(hLE, wLE);
            for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs.husbandAge, wifeAge)); year++) {
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
                rentalIncome: editableFields[year].rentalIncome,
                capitalGains: editableFields[year].capitalGains,
                pension: editableFields[year].pension,
                rothSpouse1: editableFields[year].rothSpouse1,
                rothSpouse2: editableFields[year].rothSpouse2,
                salary1: editableFields[year].salary1,
                salary2: editableFields[year].salary2,
                interest: editableFields[year].interest,
                age1: inputs.husbandAge,
                age2: inputs.wifeAge,
                ira1: inputs1.ira1,
                ira2: inputs1.ira2,
                roi: inputs1.roi,
                inflation: inputs.inflation,
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
            const defaultScenarios = ["Scenario 1", "Scenario 2", "Scenario 3"];
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
                    for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs.husbandAge, wifeAge)); year++) {
                        dataToSave.push({
                            user_id: user.id,
                            version_name: scenario,
                            year: year,
                            rentalIncome: 0,
                            capitalGains: 0,
                            pension: 0,
                            rothSpouse1: 0,
                            rothSpouse2: 0,
                            salary1: 0,
                            salary2: 0,
                            interest: 0,
                            age1: inputs.husbandAge,
                            age2: inputs.wifeAge,
                            ira1: inputs1.ira1,
                            ira2: inputs1.ira2,
                            roi: inputs1.roi,
                            inflation: inputs.inflation,
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

            // Sort the versions alphabetically
            const sortedVersions = uniqueVersions.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            setSavedVersions(sortedVersions.map(version => ({ name: version.name })));
        }
    };


    useEffect(() => {
        if (user) {
            fetchSavedVersions();
            const lastScenario = localStorage.getItem("selectedScenario") || "Scenario 1";
            const scenario = savedVersions.find(v => v.name === lastScenario);
            if (scenario) {
                loadVersion(scenario);
            }
        }
    }, [user]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedScenario = localStorage.getItem("selectedScenario") || "Scenario 1";
            setSelectedVersion(savedScenario);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("selectedScenario", selectedVersion);
        }
        const scenario = savedVersions.find(v => v.name === selectedVersion);
        if (scenario) {
            loadVersion(scenario);
        }
    }, [selectedVersion, user]);

    useEffect(() => {
        if (!user) {
            localStorage.removeItem("selectedScenario");
            setSelectedVersion("Scenario 1");
        }
    }, [user]);

/////social security benefits
    const annualInflationRate = inputs.inflation;
    let startingStandardDeduction;
    let initialBrackets;

    if (info?.married && info?.filing) {
        // If married and filing jointly
        startingStandardDeduction = 29200;
        initialBrackets = [
            { threshold: 23200, rate: 0.10, color: '#B3DDF2' }, // Light Sky Blue (brighter)
            { threshold: 94300, rate: 0.12, color: '#81C1E3' }, // Light Blue (more saturated)
            { threshold: 201050, rate: 0.22, color: '#4E9ACF' }, // Moderate Blue (more vivid)
            { threshold: 383900, rate: 0.24, color: '#2D7DB7' }, // Darker Blue (more contrast)
            { threshold: 487450, rate: 0.32, color: '#1E6091' }, // Dark Blue (more distinct)
            { threshold: 731200, rate: 0.35, color: '#1B4F72' }, // Navy Blue (high contrast)
            { threshold: Infinity, rate: 0.37, color: '#10375C' }  // Very Dark Blue (almost black)
        ];
    } else if (!info?.married) {
        // If not married
        startingStandardDeduction = 14600;
        initialBrackets = [
            { threshold: 11600, rate: 0.10, color: '#B3DDF2' }, // Updated to $11,600 and 10%
            { threshold: 47150, rate: 0.12, color: '#81C1E3' }, // Updated to $47,150 and 12%
            { threshold: 100525, rate: 0.22, color: '#4E9ACF' }, // Updated to $100,525 and 22%
            { threshold: 191950, rate: 0.24, color: '#2D7DB7' }, // Updated to $191,950 and 24%
            { threshold: 243725, rate: 0.32, color: '#1E6091' }, // Updated to $243,725 and 32%
            { threshold: 609350, rate: 0.35, color: '#1B4F72' }, // Updated to $609,350 and 35%
            { threshold: Infinity, rate: 0.37, color: '#10375C' }  // Updated to > $609,350 and 37%
        ];
    } else if (info?.married && !info?.filing) {
        // If married and filing separately
        startingStandardDeduction = 13800;
        initialBrackets = [
            { threshold: 11600, rate: 0.10, color: '#B3DDF2' }, // Updated to $11,600 and 10%
            { threshold: 47150, rate: 0.12, color: '#81C1E3' }, // Updated to $47,150 and 12%
            { threshold: 100525, rate: 0.22, color: '#4E9ACF' }, // Updated to $100,525 and 22%
            { threshold: 191950, rate: 0.24, color: '#2D7DB7' }, // Updated to $191,950 and 24%
            { threshold: 243725, rate: 0.32, color: '#1E6091' }, // Updated to $243,725 and 32%
            { threshold: 365600, rate: 0.35, color: '#1B4F72' }, // Updated to $365,600 and 35%
            { threshold: Infinity, rate: 0.37, color: '#10375C' }  // Updated to > $609,350 and 37%
        ];
    }

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

    const totalLifetimeTaxPaid = calculateTotalLifetimeTaxPaid(taxableIncomes, inputs.inflation, currentYear);
    const totalLifetimeTaxPaid1 = calculateTotalLifetimeTaxPaid(taxableIncomes1, inputs.inflation, currentYear);
    const totalLifetimeTaxPaid2 = calculateTotalLifetimeTaxPaid(taxableIncomes2, inputs.inflation, currentYear);
    const totalLifetimeTaxPaid3 = calculateTotalLifetimeTaxPaid(taxableIncomes3, inputs.inflation, currentYear);


    const beneficiaryTaxPaid = calculateBeneficiaryTaxPaid(iraDetails, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid1 = calculateBeneficiaryTaxPaid(iraDetails1, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid2 = calculateBeneficiaryTaxPaid(iraDetails2, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);
    const beneficiaryTaxPaid3 = calculateBeneficiaryTaxPaid(iraDetails3, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);

    const calculateTotalTaxesPaid = (totalLifetimeTaxPaid, beneficiaryTaxPaid) => {
        return new Decimal(totalLifetimeTaxPaid).plus(new Decimal(beneficiaryTaxPaid)).toNumber();
    };

    const totalTaxesPaid = Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaid, beneficiaryTaxPaid)).toLocaleString();
    const totalTaxesPaid1 = Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaid1, beneficiaryTaxPaid1)).toLocaleString();
    const totalTaxesPaid2 = Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaid2, beneficiaryTaxPaid2)).toLocaleString();
    const totalTaxesPaid3 = Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaid3, beneficiaryTaxPaid3)).toLocaleString();

    useEffect(() => {
        const key = `taxes_${selectedVersion}`;
        const data = {
            totalLifetimeTaxesPaid: totalLifetimeTaxPaid,
            beneficiaryTaxesPaid: beneficiaryTaxPaid
        };
        localStorage.setItem(key, JSON.stringify(data));
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

    const totalLifetimeTaxPaidWithZeroRoth = calculateTotalLifetimeTaxPaidWithZeroRoth(taxableIncomesWithZeroRoth, inputs.inflation, currentYear);
    const beneficiaryTaxPaidWithZeroRoth = calculateBeneficiaryTaxPaidWithZeroRoth(iraDetailsZeroRoth, currentYear, husbandLEYear, wifeLEYear, inputs1.beneficiary_tax_rate);

    const totalTaxesPaidWithZeroRoth = Math.round(calculateTotalTaxesPaid(totalLifetimeTaxPaidWithZeroRoth, beneficiaryTaxPaidWithZeroRoth)).toLocaleString();
    const transposedRows = [
        { id: 'ageSpouse1', label: info?.married && info?.filing ? 'Age (You)' : 'Age' },
        (info?.married && info?.filing) && { id: 'ageSpouse2', label: 'Age (Spouse)' },
        { id: 'rothSpouse1', label: info?.married && info?.filing ? 'Roth Conversion (You)' : 'Roth Conversion' },
        (info?.married && info?.filing) && { id: 'rothSpouse2', label: 'Roth Conversion (Spouse)' },
        { id: 'salary1', label: info?.married && info?.filing ? 'Salary (You)' : 'Salary' },
        (info?.married && info?.filing) && { id: 'salary2', label: 'Salary (Spouse)' },
        { id: 'rentalIncome', label: 'Rental Income' },
        { id: 'interest', label: 'Interest / Dividends' },
        { id: 'capitalGains', label: 'Capital Gains' },
        { id: 'pension', label: 'Pension Withdrawals' },
        { id: 'rmdSpouse1', label: 'RMD' }, // RMD (You) not included as per your original logic
        (info?.married && info?.filing) && { id: 'rmdSpouse2', label: 'RMD (Spouse)' },
        { id: 'ssSpouse1', label: 'Social Security' }, // Social Security (You) not included as per your original logic
        (info?.married && info?.filing) && { id: 'ssSpouse2', label: 'Social Security (Spouse)' },
        { id: 'totalIncome', label: 'Total Ordinary Income' },
        { id: 'standardDeductions', label: 'Standard Deductions' },
        { id: 'taxableIncome', label: 'Taxable Ordinary Income' }
    ].filter(Boolean); // Remove false entries for spouse rows if not married

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
            const fieldsToPropagate = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains'];
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

    console.log("this is static", staticFields);
    const columns = [
        { field: 'label', headerName: 'Label', width: 200, headerAlign: 'center', pinned: 'left' },
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
                newRow[year] = editableFields[year]?.[row.id] || 0; // Use optional chaining
            }
        });
        return newRow;
    });

    const isCellEditable = (params) => {
        const scenario = selectedVersion;
        const fieldsToDisable = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        return !((scenario === 'Scenario 2' || scenario === 'Scenario 3') && fieldsToDisable.includes(params.row.id));
    };

    const getRowClassName = (params) => {

        const editableRowIds = ['rothSpouse1', 'rothSpouse2', 'salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        if (params.row.id === 'ssSpouse2') {
            return 'ss-spouse-row';
        } else if (params.row.id === 'standardDeductions') {
            return 'standard-deductions-row'; // Add this line
        } else if (editableRowIds.includes(params.row.id)) {
            return 'editable-row';
        } else {
            return 'uneditable-row';
        }
    };

    const getCellClassName = (params) => {
        const scenario = selectedVersion;
        const editableRowIds = ['rothSpouse1', 'rothSpouse2', 'salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];

        const fieldsToDisable = ['salary1', 'salary2', 'rentalIncome', 'interest', 'capitalGains', 'pension'];
        const isSelected = selectedCellParams.some(cell => cell.id === params.id && cell.field === params.field);
        const isUneditable = (scenario === 'Scenario 2' || scenario === 'Scenario 3') && fieldsToDisable.includes(params.row.id);

        let className = '';

        // Check if the row is one of the specified rows and the cell is not in the label column
        if (editableRowIds.includes(params.row.id) && params.field !== 'label') {
            className += 'editable-cell '; // Apply blue text to editable fields
        }

        // Ensure uneditable rows get the correct class
        if (isUneditable) {
            className += 'uneditable-row ';
        }

        // Apply the selected cell class for highlighting
        if (isSelected) {
            className += 'selected-cell ';
        }

        return className.trim(); // Return the combined classes
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
                    totalLifetimeTaxPaidWithZeroRoth.toFixed(0).toLocaleString(),
                    totalLifetimeTaxPaid1.toFixed(0).toLocaleString(),
                    totalLifetimeTaxPaid2.toFixed(0).toLocaleString(),
                    totalLifetimeTaxPaid3.toFixed(0).toLocaleString()
                ],
                backgroundColor: "#d95448",
            },
            {
                label: 'Beneficiary Lifetime Taxes',
                data: [
                    beneficiaryTaxPaidWithZeroRoth.toFixed(0).toLocaleString(),
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
            datalabels: {
                display: function(context) {
                    // Only display labels for the second dataset (Beneficiary Taxes)
                    return context.datasetIndex === 1;
                },
                color: 'black',
                align: 'top', // Aligns the label to the top of the bar
                anchor: 'end', // Positions the label outside the bar
                formatter: function(value, context) {
                    // Map the correct total taxes paid value to each label for Beneficiary Taxes
                    switch (context.dataIndex) {
                        case 0:
                            return `$${totalTaxesPaidWithZeroRoth}`;
                        case 1:
                            return `$${totalTaxesPaid1}`;
                        case 2:
                            return `$${totalTaxesPaid2}`;
                        case 3:
                            return `$${totalTaxesPaid3}`;
                        default:
                            return null;
                    }
                }
            },

            tooltip: {
                callbacks: {
                    title: function(context) {
                        let title = context[0].label || '';
                        let total = '';

                        // Determine the total based on the label (assuming labels match scenario names)
                        switch (title) {
                            case 'No Conversion':
                                total = totalTaxesPaidWithZeroRoth;
                                break;
                            case 'Scenario 1':
                                total = totalTaxesPaid1;
                                break;
                            case 'Scenario 2':
                                total = totalTaxesPaid2;
                                break;
                            case 'Scenario 3':
                                total = totalTaxesPaid3;
                                break;
                            default:
                                total = '';
                        }

                        title += `\nTotal: $${total}`;
                        return title;
                    },
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += `$${parseInt(context.raw, 10).toLocaleString()}`;
                        return label;
                    }
                }
            },
            legend: {
                position: 'bottom',
                onClick: null
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
                        return `$${value.toLocaleString()}`;
                    },
                    max: Math.max(totalLifetimeTaxPaidWithZeroRoth, totalLifetimeTaxPaid1, totalLifetimeTaxPaid2, totalLifetimeTaxPaid3) * 1.3,

                },
                padding: {
                    top: 20,
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
        const futureYear = currentYear + Math.max(hLE - age1, wLE - age2);
        const cashFlowBeneficiaryTax = new Decimal(beneficiaryTaxPaid);
        const dateBeneficiaryTax = new Date(futureYear, 0, 1);
        const npvBeneficiaryTaxValue = calculateXNPV(inputs.roi / 100, [cashFlowBeneficiaryTax], [dateBeneficiaryTax]);
        setNpvBeneficiaryTax(npvBeneficiaryTaxValue);

    }, [inputs.roi, taxableIncomes, beneficiaryTaxPaid, inputs1, currentYear, age1, hLE, age2, wLE]);


    const bracketTitles = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];

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
        const adjustedBrackets = adjustThresholdsForInflation(initialBrackets, inputs.inflation, currentYear, year);
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

    const dataForChart = taxBracketDataByYear;
    const taxBarChartOptions = {
        responsive: true,
        plugins: {
            datalabels: {
                display: false
            },

            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += `$${parseInt(context.raw, 10).toLocaleString()}`;
                        return label;
                    }
                }
            },
            legend: {
                position: 'bottom',
                onClick: null // Disable clicking on the legend to show/hide datasets
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
                        return `$${value.toLocaleString()}`;
                    },
                },
            },
        },
    };

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
            datalabels: {
                display: false
            },

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
            },
            legend: {
                position: 'bottom',
                onClick: null
            },

        }
    };

    const [isBarChartVisible, setIsBarChartVisible] = useState(false);

    const toggleBarChartVisibility = () => {
        setIsBarChartVisible(!isBarChartVisible);
    };

    const [isIraChartVisible, setIsIraChartVisible] = useState(false);

    const toggleIraChartVisibility = () => {
        setIsIraChartVisible(!isIraChartVisible);
    };

    const [isTotalTaxesChartVisible, setIsTotalTaxesChartVisible] = useState(false);

    const toggleTotalTaxesChartVisibility = () => {
        setIsTotalTaxesChartVisible(!isTotalTaxesChartVisible);
    };


    return (
        <div className="w-full mx-auto p-4 flex flex-col items-stretch">
            {isClient && (
                <>
                    <div className="mb-5 text-left flex items-center space-x-2 w-full">
                        <div className="text-left flex items-center space-x-2 w-full">
                            {savedVersions.map((version, index) => (
                                <button
                                    key={index}
                                    className={`p-2 rounded ${selectedVersion === version.name ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300'}`}
                                    onClick={() => {
                                        if (!user) {
                                            onOpen();
                                            return;
                                        }
                                        setSelectedVersion(version.name);
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem("selectedScenario", version.name);
                                        }
                                        loadVersion(version);
                                    }}
                                >
                                    {version.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-container w-full flex-wrap justify-between ml-[-7px] mb-4">
                        <div className="equal-height bg-white p-4 rounded m-2 h-full flex flex-col justify-between">
                            <h3 className="text-lg mb-5">Other Inputs</h3>
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
                                            disabled={selectedVersion !== 'Scenario 1'} // Disable if not Scenario 1
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
                                            disabled={selectedVersion !== 'Scenario 1'} // Disable if not Scenario 1
                                        />
                                    </div>
                                </div>
                                {(info?.married && info?.filing) && (
                                    <div className="flex justify-between items-center">
                                        <label className="flex-grow">Your Spouse’s IRA:</label>
                                        <div className="w-32 ml-4">
                                            <input
                                                type="text"
                                                name="ira2"
                                                value={`$${formatNumberWithCommas(inputs1.ira2 || '')}`}
                                                onChange={handleInputChange}
                                                className="w-full h-8 text-right border border-gray-300 p-2 rounded"
                                                disabled={selectedVersion !== 'Scenario 1'} // Disable if not Scenario 1
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <label className="flex-grow">Investment Return:</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="roi"
                                            value={`${(inputs1.roi) * 100}`}
                                            onChange={handleInputChange}
                                            className="w-32 h-8 text-right border border-gray-300 p-2 rounded pr-6"
                                            disabled={selectedVersion !== 'Scenario 1'} // Disable if not Scenario 1
                                        />
                                        <span className="absolute right-2 top-1">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="equal-height bg-white w-full p-4 rounded m-2 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col justify-center">
                                <h3 className="text-xl text-center mb-2">{selectedVersion}: Total Taxes Paid</h3>
                                <div className="text-3xl font-bold text-center">
                                    ${totalTaxesPaid}
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="mb-4 bg-white p-4 rounded w-full">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-xl font-semi-bold mb-3">Financial Plan Details</h2>
                            <div>
                                <DataGrid
                                    HorizontalAlignment="Stretch"
                                    VerticalAlignment="Stretch"
                                    style={{ flex: 1, minHeight: 0, maxWidth: '100%' }}
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
                    </div>
                    <div>
                        <div className="mt-4 mb-4 bg-white overflow-x-auto p-4 rounded max-w-full">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semi-bold mb-3">Total Taxes Paid</h2>
                                <button onClick={toggleTotalTaxesChartVisibility} className="text-xl">
                                    {isTotalTaxesChartVisible ? '-' : '+'}
                                </button>
                            </div>
                            {isTotalTaxesChartVisible && (
                                <div className="bg-white p-4 rounded">
                                    <Bar data={chartData} options={chartOptions} />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 bg-white overflow-x-auto p-4 rounded max-w-full">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semi-bold mb-3">Tax Brackets</h2>
                                <button onClick={toggleBarChartVisibility} className="text-xl">
                                    {isBarChartVisible ? '-' : '+'}
                                </button>
                            </div>
                            {isBarChartVisible && (
                                <div className="bg-white p-4 rounded">
                                    <TaxBarChart data={dataForChart} options={taxBarChartOptions}/>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 mb-4 bg-white overflow-x-auto p-4 rounded max-w-full">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semi-bold mb-3">IRA Balance</h2>
                                <button onClick={toggleIraChartVisibility} className="text-xl">
                                    {isIraChartVisible ? '-' : '+'}
                                </button>
                            </div>
                            {isIraChartVisible && (
                                <Bar data={iraChartData} options={barChartOptions} />
                            )}
                        </div>

                    </div>


                </>)}
        </div>
    );
};


export default RothOutputs;