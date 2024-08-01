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
        roi: 0.03,
        inflation: 0.02,
        beneficiary_tax_rate: 0.24
    });
    const [staticFields, setStaticFields] = useState({});

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    return (
        <div className="mx-auto">
            <MyUserContextProvider>
                <RothOutputs
                    inputs={inputs}
                    inputs1={inputs1}
                    staticFields={staticFields}
                    setStaticFields={setStaticFields}
                    setInputs1={setInputs1}
                />
            </MyUserContextProvider>
        </div>
    );
};

export default RothConversionCalculator;
