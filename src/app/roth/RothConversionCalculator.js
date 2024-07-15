"use client"
import React, { useState, useEffect } from 'react';
import RothOutputs from "@/app/roth/RothOutputs";
import { MyUserContextProvider } from "@/app/hooks/useUser";
import useStore from "@/app/store/useStore";

const RothConversionCalculator = () => {
    const { socialSecurityInputs } = useStore();
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

    useEffect(() => {
        if (isUserInitiated) {
            const saveData = async () => {
                const { user } = useUser();
                if (!user) {
                    console.error('User is not logged in');
                    return;
                }
                const dataToSave = {
                    user_id: user.id,
                    ira1: inputs1.ira1,
                    ira2: inputs1.ira2,
                    roi: inputs1.roi,
                    inflation: inputs1.inflation,
                    beneficiary_tax_rate: inputs1.beneficiary_tax_rate,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabaseClient
                    .from('roth_conversion_inputs')
                    .upsert([dataToSave], { onConflict: ['user_id'] });

                if (error) {
                    console.error('Error saving data to Supabase:', error);
                } else {
                    console.log('Data successfully saved to Supabase.');
                }
            };
            saveData();
            setIsUserInitiated(false); // Reset user-initiated flag
        }
    }, [inputs1, isUserInitiated]); // Add isUserInitiated to the dependency array

    const [editableFields, setEditableFields] = useState({});
    const [staticFields, setStaticFields] = useState({});

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);


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