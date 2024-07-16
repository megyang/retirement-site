"use client"
import React, { useState, useEffect } from 'react';
import RothOutputs from "@/app/roth/RothOutputs";
import { MyUserContextProvider, useUser } from "@/app/hooks/useUser";
import useStore from "@/app/store/useStore";
import {useSupabaseClient} from "@supabase/auth-helpers-react";
const RothConversionCalculator = () => {
    const { socialSecurityInputs } = useStore();
    const supabaseClient = useSupabaseClient();
    const user = useUser();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const [inputs1, setInputs1] = useState({
        ira1: 800000,
        ira2: 1000000,
        roi: 3.0,
        inflation: 2.0,
        beneficiary_tax_rate: 0.24
    });
    const [isUserInitiated, setIsUserInitiated] = useState(false);
    const handleInputChange = (e) => {
        setIsUserInitiated(true);
        const { name, value } = e.target;
        setInputs1(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value),
        }));
    };

    const [editableFields, setEditableFields] = useState({});
    const [staticFields, setStaticFields] = useState({});

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    {/*
        useEffect(() => {
            const loadInitialData = async () => {
                if (!user) {
                    console.error('User is not logged in');
                    return;
                }

                const {data, error} = await supabaseClient
                    .from('roth')
                    .select('version_name')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error loading data from Supabase:', error);
                } else {
                    const existingVersions = data.map(item => item.version_name);
                    const defaultScenarios = ["Scenario 1", "Scenario 2", "Scenario 3"];

                    const missingScenarios = defaultScenarios.filter(scenario => !existingVersions.includes(scenario));

                    if (missingScenarios.length > 0) {
                        const currentYear = new Date().getFullYear();
                        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);

                        const initialEditableFields = {};
                        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs1.age1, inputs1.age2)); year++) {
                            initialEditableFields[year] = {
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

                        const dataToSave = [];
                        missingScenarios.forEach(scenario => {
                            for (let year in initialEditableFields) {
                                dataToSave.push({
                                    user_id: user.id,
                                    version_name: scenario,
                                    year: year,
                                    rental_income: initialEditableFields[year].rentalIncome,
                                    capital_gains: initialEditableFields[year].capitalGains,
                                    pension: initialEditableFields[year].pension,
                                    roth_1: initialEditableFields[year].rothSpouse1,
                                    roth_2: initialEditableFields[year].rothSpouse2,
                                    salary1: initialEditableFields[year].salary1,
                                    salary2: initialEditableFields[year].salary2,
                                    interest: initialEditableFields[year].interest,
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
                        });

                        const {error: upsertError} = await supabaseClient.from('roth').upsert(dataToSave, {onConflict: ['user_id', 'version_name', 'year']});
                        if (upsertError) {
                            console.error('Error initializing scenarios:', upsertError);
                        } else {
                            console.log('Default scenarios initialized.');
                        }
                    }
                }
            };

            if (user) {
                loadInitialData();
            }
        }, [user, supabaseClient, socialSecurityInputs]);
    */}
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);

        const initialEditableFields = {};
        const initialStaticFields = {};

        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs1.age1, inputs1.age2)); year++) {
            initialEditableFields[year] = {
                rothSpouse1: 0,
                rothSpouse2: 0,
                salary1: 0,
                salary2: 0,
                rentalIncome: 0,
                interest: 0,
                capitalGains: 0,
                pension: 0
            };

            initialStaticFields[year] = {
                year: year,
                ageSpouse1: inputs1.age1 + (year - currentYear),
                ageSpouse2: inputs1.age2 + (year - currentYear),
            };
        }

        setEditableFields(initialEditableFields);
        setStaticFields(initialStaticFields);
    }, [inputs1]);

    return (
        <div className="mx-auto my-0">
            <div>
                <MyUserContextProvider>
                        <div className="mt-8">
                            <RothOutputs
                                inputs={inputs}
                                inputs1={inputs1}
                                editableFields={editableFields}
                                setEditableFields={setEditableFields}
                                staticFields={staticFields}
                                setStaticFields={setStaticFields}
                                setInputs1={setInputs1}
                            />
                        </div>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default RothConversionCalculator;