"use client"
import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import BarChart from "@/app/components/BarChart";
import useRmdCalculations from "@/app/hooks/useRmdCalculations";
import useReferenceTable from "@/app/hooks/useReferenceTable";
import { calculateTaxesForBrackets, calculateXNPV, findRmdByYear, findSsBenefitsByYear } from "@/app/utils/calculations";
import useAuthModal from "@/app/hooks/useAuthModal";
import VersionSelector from './VersionSelector';
import InputFields from './InputFields';
import FinancialPlanTable from './FinancialPlanTable';
import OrdinaryIncomeTaxTable from './OrdinaryIncomeTaxTable';

const RothOutputs = ({ inputs, inputs1, editableFields, setEditableFields, staticFields, setInputs1 }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const { benefitsBasedOnAge } = useReferenceTable(inputs);
    const { socialSecurityBenefits } = useSocialSecurityStore();
    const { iraDetails, totals } = useRmdCalculations(inputs.husbandAge, inputs.wifeAge, inputs1.ira1, inputs1.ira2, inputs1.roi, inputs.hLE, inputs.wLE);
    const { onOpen } = useAuthModal();

    const [versionData, setVersionData] = useState([]);
    const [savedVersions, setSavedVersions] = useState([
        { name: "Scenario 1" },
        { name: "Scenario 2" },
        { name: "Scenario 3" }
    ]);

    const [selectedVersion, setSelectedVersion] = useState("Select a scenario");

    useEffect(() => {
        if (Object.keys(inputs1).length > 0 && Object.keys(editableFields).length > 0) {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year <= currentYear + (Math.max(inputs.hLE, inputs.wLE) - Math.min(inputs.husbandAge, inputs.wifeAge)); year++) {
                autoSaveToDatabase(year, editableFields[year]);
            }
        }
    }, [inputs1, editableFields]);

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
            console.log('Data being saved to the database:', dataToSave);
        }
    };

    const saveVersion = async (versionName) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

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

        const beneficiaryTaxPaidWithZeroRoth = totals.inheritedIRAHusband.plus(totals.inheritedIRAWife).times(inputs1.beneficiary_tax_rate).toFixed(2);

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

            for (const scenario of defaultScenarios) {
                if (!uniqueVersions.some(version => version.name === scenario)) {
                    const dataToSave = [];
                    for (let year = currentYear; year <= currentYear + (Math.max(inputs.hLE, inputs.wLE) - Math.min(inputs.husbandAge, inputs.wifeAge)); year++) {
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

            const sortedVersions = uniqueVersions.sort((a, b) => {
                if (a.name === "Select a scenario") return -1;
                if (b.name === "Select a scenario") return 1;
                return a.name.localeCompare(b.name);
            });

            setSavedVersions(sortedVersions.map(version => ({ name: version.name })));
            setVersionData(sortedVersions);

            if (sortedVersions.length > 0 && !sortedVersions.find(v => v.name === selectedVersion)) {
                setSelectedVersion("Select a scenario");
            }
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (user) {
                fetchSavedVersions();
            }
        }
    }, [user]);

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

    const chartData = {
        labels: ["No Conversion", ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.name)],
        datasets: [
            {
                label: 'Lifetime Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[1].lifetime0) : 0, ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.lifetime_tax)],
                backgroundColor: 'rgba(173, 216, 230, 0.6)', // Light blue
                borderColor: 'black',
                borderWidth: 1,
            },
            {
                label: 'Beneficiary Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[1].beneficiary0) : 0, ...versionData.filter(item => item.name !== "Select a scenario").map(item => item.beneficiary_tax)],
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex-col">
                <div className="bg-white p-4 rounded h-auto w-full">
                    <h3 className=" text-left text-2xl">
                        Total Taxes Paid
                    </h3>
                    <BarChart chartData={chartData} chartOptions={chartOptions} />
                </div>
                <VersionSelector
                    user={user}
                    selectedVersion={selectedVersion}
                    setSelectedVersion={setSelectedVersion}
                    savedVersions={savedVersions}
                    loadVersion={loadVersion}
                    onOpen={onOpen}
                />
                <InputFields inputs1={inputs1} setInputs1={setInputs1} />
                <FinancialPlanTable
                    inputs={inputs}
                    inputs1={inputs1}
                    staticFields={staticFields}
                    editableFields={editableFields}
                    setEditableFields={setEditableFields}
                    benefitsBasedOnAge={benefitsBasedOnAge}
                />
                <OrdinaryIncomeTaxTable
                    inputs={inputs}
                    inputs1={inputs1}
                    staticFields={staticFields}
                    editableFields={editableFields}
                    calculateTaxesForBrackets={calculateTaxesForBrackets}
                    bracketTitles={bracketTitles}
                />
            </div>
        </div>
    );
};

export default RothOutputs;
