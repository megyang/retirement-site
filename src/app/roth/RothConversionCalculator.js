"use client"
import React, { useState, useEffect } from 'react';
import RothOutputs from "@/app/roth/RothOutputs";
import { MyUserContextProvider, useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";

const RothConversionCalculator = () => {
    const { socialSecurityInputs } = useSocialSecurityStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const [inputs1, setInputs1] = useState({
        ira1: 800000,
        ira2: 1000000,
        roi: 3.0,
        inflation: 2.0,
        beneficiary_tax_rate: 0.24
    });
    const [editableFields, setEditableFields] = useState({});
    const [staticFields, setStaticFields] = useState({});

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    return (
        <div className="mx-auto my-0">
            <div>
                <MyUserContextProvider>
                    <RothOutputs
                        inputs={inputs}
                        inputs1={inputs1}
                        editableFields={editableFields}
                        setEditableFields={setEditableFields}
                        staticFields={staticFields}
                        setStaticFields={setStaticFields}
                        setInputs1={setInputs1}
                    />
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default RothConversionCalculator;
