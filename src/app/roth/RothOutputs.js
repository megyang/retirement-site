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
import { DataGrid } from '@mui/x-data-grid';

const RothOutputs = ({ inputs, inputs1, editableFields, setEditableFields, staticFields, setInputs1 }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { socialSecurityBenefits } = useSocialSecurityStore();
    const { onOpen } = useAuthModal();

    const [versionData, setVersionData] = useState([]);
    const [savedVersions, setSavedVersions] = useState([
        { name: "Scenario 1" },
        { name: "Scenario 2" },
        { name: "Scenario 3" }
    ]);

    const [selectedVersion, setSelectedVersion] = useState("Select a scenario");
    const [triggerSave, setTriggerSave] = useState(false);
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

    const processRowUpdate = async (newRow, oldRow) => {
        try {
            const fieldName = newRow.id; // This is the field name like 'capitalGains', 'rothSpouse1', etc.
            const updatedData = {};

            // Ensure all values in newRow are converted to appropriate types
            Object.keys(newRow).forEach(year => {
                if (year !== 'id' && newRow[year] !== oldRow[year]) {
                    updatedData[year] = newRow[year] === null || newRow[year] === '' ? 0 : parseFloat(newRow[year]);
                }
            });

            // Update the editableFields state
            setEditableFields(prevEditableFields => {
                const newEditableFields = { ...prevEditableFields };
                Object.keys(updatedData).forEach(year => {
                    if (!newEditableFields[year]) {
                        newEditableFields[year] = {};
                    }
                    newEditableFields[year][fieldName] = updatedData[year];
                });
                return newEditableFields;
            });

            // Trigger recalculations
            setTriggerSave(true);

            {/*            // Iterate over each year and save the updated value to the corresponding field in the database
                for (const year in updatedData) {
                    // Fetch existing data for the year to preserve other fields
                    const existingData = await fetchDataForYear(parseInt(year));

                    const dataToSave = {
                        rentalIncome: existingData.rental_income,
                        capitalGains: existingData.capital_gains,
                        pension: existingData.pension,
                        rothSpouse1: existingData.roth_1,
                        rothSpouse2: existingData.roth_2,
                        salary1: existingData.salary1,
                        salary2: existingData.salary2,
                        interest: existingData.interest,
                        lifetime_tax: existingData.lifetime_tax,
                        beneficiary_tax: existingData.beneficiary_tax,
                        lifetime0: existingData.lifetime0,
                        beneficiary0: existingData.beneficiary0,
                        age1: inputs.husbandAge,
                        age2: inputs.wifeAge,
                        ira1: inputs1.ira1,
                        ira2: inputs1.ira2,
                        roi: inputs1.roi,
                        inflation: inputs1.inflation,
                        beneficiary_tax_rate: inputs1.beneficiary_tax_rate,
                    };

                    // Assign the updated value to the corresponding field in dataToSave
                    dataToSave[fieldName] = updatedData[year];

                    // Call the saveData function to save the data
                    await saveData(parseInt(year), dataToSave);

                    // Fetch the updated data for the year
                    await fetchDataForYear(parseInt(year));
                }
            */}
            return { ...newRow, ...updatedData };
        } catch (error) {
            console.error('Error processing row update', error);
            return oldRow;
        }
    };

    const processRowUpdateError = (error) => {
        console.error("Error updating row", error);
    };

    {/*
        const saveData = async (year, data) => {
            if (!user) {
                console.error('User is not logged in');
                return;
            }

            const {error} = await supabaseClient.from('roth').upsert([{
                user_id: user.id,
                version_name: selectedVersion,
                year: year,
                rental_income: data.rentalIncome || 0,
                capital_gains: data.capitalGains || 0,
                pension: data.pension || 0,
                roth_1: data.rothSpouse1 || 0,
                roth_2: data.rothSpouse2 || 0,
                salary1: data.salary1 || 0,
                salary2: data.salary2 || 0,
                interest: data.interest || 0,
                age1: inputs.husbandAge,
                age2: inputs.wifeAge,
                ira1: inputs1.ira1,
                ira2: inputs1.ira2,
                roi: inputs1.roi,
                inflation: inputs1.inflation,
                lifetime_tax: data.lifetime_tax || 0,
                beneficiary_tax: data.beneficiary_tax || 0,
                lifetime0: data.lifetime0 || 0,
                beneficiary0: data.beneficiary0 || 0,
                beneficiary_tax_rate: inputs1.beneficiary_tax_rate
            }], {onConflict: ['user_id', 'version_name', 'year']});

            if (error) {
                console.error('Error saving data to Supabase:', error);
            } else {
                console.log('Data successfully saved to Supabase.');
                await fetchSavedVersions();
            }
        };
    */}
    {/*
        const fetchExistingDataForYear = async (year) => {
            if (!user) {
                console.error('User is not logged in');
                return {};
            }

            const {data, error} = await supabaseClient
                .from('roth')
                .select('*')
                .eq('user_id', user.id)
                .eq('version_name', selectedVersion)
                .eq('year', year);

            if (error) {
                console.error('Error fetching existing data for year from Supabase:', error);
                return {};
            }

            if (data.length > 0) {
                return data[0];
            }

            return {};
        };

    */}

    const fetchDataForYear = async (year) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', selectedVersion)
            .eq('year', year);

        if (error) {
            console.error('Error fetching data for year from Supabase:', error);
            return;
        }

        if (data.length > 0) {
            const updatedFields = { ...editableFields };
            const rowData = data[0];
            updatedFields[year] = {
                rothSpouse1: rowData.roth_1,
                rothSpouse2: rowData.roth_2,
                salary1: rowData.salary1,
                salary2: rowData.salary2,
                rentalIncome: rowData.rental_income,
                interest: rowData.interest,
                capitalGains: rowData.capital_gains,
                pension: rowData.pension
            };

            setEditableFields(updatedFields);
        }
    };

    {/*
    const handleEditableFieldChange = (year, field, value) => {
        if (!user) {
            onOpen();
            return;
        }

        const newValue = (typeof value === 'string' ? value.trim() : value) === '' ? 0 : parseFloat(value);

        setEditableFields(prev => {
            const updatedFields = {
                ...prev,
                [year]: {
                    ...prev[year],
                    [field]: isNaN(newValue) ? 0 : newValue
                }
            };
            return updatedFields;
        });
        setTriggerSave(true);
    };


        const renderEditableFieldInput = (year, field) => {
            return (
                <input
                    type="text"
                    className="table-input w-full p-1 border border-gray-300 rounded text-right"
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
   */ }

    const fieldNameMap = {
        rothSpouse1: "Roth Spouse 1",
        rothSpouse2: "Roth Spouse 2",
        rentalIncome: "Rental Income",
        salary1: "Salary 1",
        salary2: "Salary 2",
        interest: "Interest / Dividend",
        capitalGains: "Capital Gains",
        pension: "Pension",
    };


    useEffect(() => {
        if(triggerSave) {
            saveVersion(selectedVersion)
            setTriggerSave(false);
        }
    },[triggerSave, selectedVersion])


// ROTH CALCULATIONS START -----------
    const { ira1, ira2, roi } = inputs1;
    const age1 = inputs.husbandAge;
    const age2 = inputs.wifeAge;
    const {iraDetails, totals} = useRmdCalculations(age1, age2, ira1, ira2, roi, inputs.hLE, inputs.wLE);
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

            return totalIncome.toFixed(0);
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

        const beneficiaryTaxPaidWithZeroRoth = totalInheritedIRA.times(inputs1.beneficiary_tax_rate).toFixed(0);

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
    const annualInflationRate = inputs1.inflation/100;
    const startingStandardDeduction = 29200;

    const calculateStandardDeductionForYear = (year) => {
        const yearsDifference = year - currentYear; // Assuming 'currentYear' is the base year
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

        return totalIncome.toFixed(0);
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
    const beneficiaryTaxPaid = totalInheritedIRA.times(inputs1.beneficiary_tax_rate).toFixed(0);

    const totalLifetimeTaxPaid = Object.keys(taxableIncomes).reduce(
        (total, year) => total.plus(new Decimal(taxableIncomes[year])),
        new Decimal(0)
    );






    const transposedRows = [
        { id: 'ageSpouse1', label: 'Age Spouse 1' },
        { id: 'ageSpouse2', label: 'Age Spouse 2' },
        { id: 'rothSpouse1', label: 'Roth Conversion 1' },
        { id: 'rothSpouse2', label: 'Roth Conversion 2' },
        { id: 'salary1', label: 'Salary 1' },
        { id: 'salary2', label: 'Salary 2' },
        { id: 'rentalIncome', label: 'Rental Income' },
        { id: 'interest', label: 'Interest / Dividend' },
        { id: 'capitalGains', label: 'Capital Gains' },
        { id: 'pension', label: 'Pension' },
        { id: 'rmdSpouse1', label: 'RMD Spouse 1' },
        { id: 'rmdSpouse2', label: 'RMD Spouse 2' },
        { id: 'ssSpouse1', label: 'SS Spouse 1' },
        { id: 'ssSpouse2', label: 'SS Spouse 2' },
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
                return findRmdByYear(iraDetails.spouse1, parseInt(year));
            case 'rmdSpouse2':
                return findRmdByYear(iraDetails.spouse2, parseInt(year));
            case 'ssSpouse1':
                return findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse1Benefit;
            case 'ssSpouse2':
                return findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse2Benefit;
            case 'totalIncome':
                return calculateTotalIncomeForYear(year);
            case 'standardDeductions':
                return calculateStandardDeductionForYear(parseInt(year)).toFixed(0);
            case 'taxableIncome':
                return (calculateTotalIncomeForYear(year) - calculateStandardDeductionForYear(parseInt(year))).toFixed(0);
            default:
                return 0;
        }
    };

    const [selectedCellParams, setSelectedCellParams] = useState([]);

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
        { field: 'label', headerName: 'Field', width: 200, headerAlign: 'center' },
        ...Object.keys(staticFields).map((year) => ({
            field: year.toString(),
            headerName: year.toString(),
            width: 150,
            editable: true,
            sortable: false,
            headerAlign: 'center',
            renderCell: (params) => (
                <div style={{ textAlign: 'right', width: '100%' }}>
                    {formatNumberWithCommas(params.value)}
                </div>
            ),
        })),
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
        return editableRowIds.includes(params.row.id);
    };

    const getRowClassName = (params) => {
        return editableRowIds.includes(params.row.id) ? 'editable-row' : 'uneditable-row';
    };





    const chartData = {
        labels: ["No Conversion", ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.name)],
        datasets: [
            {
                label: 'Lifetime Taxes',
                data: [versionData.length > 0 ? parseFloat(versionData[1].lifetime0) : 0, ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.lifetime_tax)],
                backgroundColor: '#E2785B',
                borderColor: 'black',
                borderWidth: 1,
            },
            {
                label: 'Beneficiary Lifetime Taxes',
                data: [versionData.length > 0 ? parseFloat(versionData[1].beneficiary0) : 0, ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.beneficiary_tax)],
                backgroundColor: '#AFBCB7',
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


    const bracketTitles = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];


    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex-col">
                <div className="bg-white p-4 rounded h-auto w-full">

                    <BarChart chartData={chartData} chartOptions={chartOptions} />
                </div>
                <div className="mt-4 text-left flex items-center space-x-2 w-full">
                    <div className="bg-white rounded p-2 flex-grow">
                        <select
                            className="w-full bg-white border-none"
                            value={selectedVersion}
                            onClick={() => {
                                if (!user)
                                    onOpen();
                                    return;
                                }
                            }
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
                        <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="flex-grow">Beneficiary Tax Rate:</label>
                                <div className="relative w-32">
                                    <input
                                        type="text"
                                        name="beneficiary_tax_rate"
                                        value={`${inputs1.beneficiary_tax_rate * 100}`}
                                        onChange={(e) => {
                                            const { name, value } = e.target;
                                            setInputs1(prevInputs => {
                                                const updatedInputs = {
                                                    ...prevInputs,
                                                    [name]: parseFloat(value) / 100,
                                                };
                                                return updatedInputs;
                                            });
                                        }}
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
            </div>

            {selectedVersion !== "Select a scenario" && (
                <div className="mt-4 bg-white overflow-x-auto p-4 rounded">
                    <h2 className="text-xl font-semi-bold mb-3">Financial Plan Details</h2>
                    <div style={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10]}
                            getRowClassName={getRowClassName}
                            isCellEditable={isCellEditable}
                            processRowUpdate={processRowUpdate}
                            onProcessRowUpdateError={processRowUpdateError}
                        />
                    </div>
                </div>
            )}


            {/*

            {selectedVersion !== "Select a scenario" && (
                <div className="mt-4 bg-white overflow-x-auto p-4 rounded">
                    <h2 className="text-xl font-semi-bold mb-3">Financial Plan Details</h2>
                    <table className="border-collapse border border-slate-400 w-full">
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
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {staticFields[year].ageSpouse1}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >Age Spouse 2</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {staticFields[year].ageSpouse2}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('rothSpouse1')}>Roth Conversion 1</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'rothSpouse1')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('rothSpouse2')}>Roth Conversion 2</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'rothSpouse2')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('salary1')}>Salary 1</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'salary1')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('salary2')}>Salary 2</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'salary2')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('rentalIncome')}>Rental Income</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'rentalIncome')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('interest')}>Interest / Dividend</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'interest')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('capitalGains')}>Capital Gains</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'capitalGains')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" onClick={() => handleFieldNameClick('pension')}>Pension</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {renderEditableFieldInput(year, 'pension')}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >RMD Spouse 1</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {findRmdByYear(iraDetails.spouse1, parseInt(year))}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >RMD Spouse 2</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {findRmdByYear(iraDetails.spouse2, parseInt(year))}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >SS Spouse 1</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse1Benefit}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >SS Spouse 2</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    {findSsBenefitsByYear(socialSecurityBenefits, parseInt(year)).spouse2Benefit}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >Total Ordinary Income</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    ${calculateTotalIncomeForYear(year)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >Standard Deductions</td>
                            {Object.keys(staticFields).map((year) => (
                                <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                    -${calculateStandardDeductionForYear(parseInt(year)).toFixed(2)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-3 py-2 text-left whitespace-nowrap" >Taxable Ordinary Income</td>
                            {Object.keys(staticFields).map((year) => {
                                const totalIncomeForYear = calculateTotalIncomeForYear(year);
                                const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
                                const taxableIncomeForYear = totalIncomeForYear - standardDeductionForYear;
                                return (
                                    <td key={year} className="px-3 py-2 text-center whitespace-nowrap">
                                        ${taxableIncomeForYear.toFixed(2)}
                                    </td>
                                );
                            })}
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}
            */}


            <h1>Ordinary Income Tax Brackets Table</h1>
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
                ${taxesForBrackets[title].toFixed(0)}
                </td>
                ))}
                <td className="px-3 py-2 text-center whitespace-nowrap">${totalTax.toFixed(0)}</td>
                </tr>
                );
            })}
                </tbody>
                </table>

        </div>
    );

};


export default RothOutputs;