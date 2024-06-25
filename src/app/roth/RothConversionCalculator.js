"use client"
import React, { useState, useEffect } from 'react';
import RothInputs from "@/app/roth/RothInputs";
import RothOutputs from "@/app/roth/RothOutputs";
import { MyUserContextProvider } from "@/app/hooks/useUser";

const RothConversionCalculator = () => {
    const [inputs, setInputs] = useState({
        hLE: 90,
        wLE: 95,
        hPIA: 2500,
        wPIA: 2000,
        hSS: 70,
        wSS: 70
    });

    const [inputs1, setInputs1] = useState({
        age1: 62,
        age2: 60,
        le1: 90,
        le2: 95,
        ira1: 800000,
        ira2: 1000000,
        roi: 3.0,
        inflation: 2.0
    });

    const [editableFields, setEditableFields] = useState({});
    const [staticFields, setStaticFields] = useState({});

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const maxLifeExpectancy = Math.max(inputs1.le1, inputs1.le2);

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

    const handleInputChange = (name, value) => {
        setInputs(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value),
        }));
    };

    const handleInputChange1 = (name, value) => {
        setInputs1(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value),
        }));
    };

    const handleLoadInputs = (inputs) => {
        setInputs({
            hLE: inputs.le,
            wLE: inputs.spouse_le,
            hPIA: inputs.pia,
            wPIA: inputs.spouse_pia,
            hSS: inputs.ss_age,
            wSS: inputs.spouse_ssage,
        });
    };

    const handleLoadInputs1 = (inputs1) => {
        setInputs1({
            age1: inputs1.age1,
            age2: inputs1.age2,
            le1: inputs1.le1,
            le2: inputs1.le2,
            ira1: inputs1.ira1,
            ira2: inputs1.ira2,
            roi: inputs1.roi,
            inflation: inputs1.inflation
        });
    };

    return (
        <div className="mx-auto my-0">
            <div>
                <MyUserContextProvider>
                    <h1 className="text-2xl font-bold text-center mb-4">Social Security Calculator</h1>
                    <RothInputs inputs={inputs} onInputChange={handleInputChange} inputs1={inputs1} onInputChange1={handleInputChange1}/>
                    <div className="mt-8">
                        <RothOutputs
                            inputs={inputs}
                            inputs1={inputs1}
                            editableFields={editableFields}
                            setEditableFields={setEditableFields}
                            staticFields={staticFields}
                            setStaticFields={setStaticFields}
                        />
                    </div>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default RothConversionCalculator;
