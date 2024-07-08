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
        inflation: 2.0
    });
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
