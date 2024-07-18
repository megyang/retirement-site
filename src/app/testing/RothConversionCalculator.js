"use client"
import React, { useState, useEffect } from 'react';
import RothOutputs from "@/app/roth/RothOutputs";
import { MyUserContextProvider, useUser } from "@/app/hooks/useUser";
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import useRmdCalculations from "@/app/hooks/useRmdCalculations";
import useReferenceTable from "@/app/hooks/useReferenceTable";

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
    const { user } = useUser();
    const { benefitsBasedOnAge } = useReferenceTable(inputs);
    const { iraDetails, totals } = useRmdCalculations(inputs.husbandAge, inputs.wifeAge, inputs1.ira1, inputs1.ira2, inputs1.roi, inputs.hLE, inputs.wLE);

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
        const newStaticFields = {};
        for (let year = currentYear, ageSpouse1 = inputs.husbandAge, ageSpouse2 = inputs.wifeAge; year <= currentYear + maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge); year++, ageSpouse1++, ageSpouse2++) {
            newStaticFields[year] = {
                year: year,
                ageSpouse1: ageSpouse1,
                ageSpouse2: ageSpouse2,
            };
        }
        setStaticFields(newStaticFields);

        const newEditableFields = {};
        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(inputs.husbandAge, inputs.wifeAge)); year++) {
            newEditableFields[year] = {
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
        setEditableFields(newEditableFields);
    }, [inputs]);

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
                            setInputs1={setInputs1}
                        />
                    </div>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default RothConversionCalculator;
