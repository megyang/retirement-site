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
    const [editableFields, setEditableFields] = useState(() => {
        const savedEditableFields = localStorage.getItem('financialPlanDetailsEditableFields');
        return savedEditableFields ? JSON.parse(savedEditableFields) : {};
    });
    const [staticFields, setStaticFields] = useState(() => {
        const savedStaticFields = localStorage.getItem('financialPlanDetailsStaticFields');
        return savedStaticFields ? JSON.parse(savedStaticFields) : {};
    });

    useEffect(() => {
        localStorage.setItem('financialPlanDetailsInputs1', JSON.stringify(inputs1));
    }, [inputs1]);

    useEffect(() => {
        localStorage.setItem('financialPlanDetailsEditableFields', JSON.stringify(editableFields));
    }, [editableFields]);

    useEffect(() => {
        localStorage.setItem('financialPlanDetailsStaticFields', JSON.stringify(staticFields));
    }, [staticFields]);

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

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
