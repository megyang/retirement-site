"use client"
import React, { useState } from 'react';
import SocialSecurityInput from './SocialSecurityInput';
import SocialSecurityOutput from './SocialSecurityOutput';
import Decimal from 'decimal.js';
import SaveInputs from "@/app/actions/SaveInputs";
import LoadInputs from "@/app/actions/LoadInputs";
import {MyUserContextProvider} from "@/app/hooks/useUser";

const SocialSecurityCalculator = () => {
    const [inputs, setInputs] = useState({
        husbandAge: 62,
        wifeAge: 60,
        hLE: 90,
        wLE: 95,
        hPIA: 2500,
        wPIA: 2000,
        roi: 3.0,
        hSS: 70,
        wSS: 70
    });
    const handleInputChange = (name, value) => {
        setInputs(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value) // Convert value to a number
        }));
    };
    const handleLoadInputs = (inputs) => {
        // Update the state with the loaded inputs
        setInputs({
            husbandAge: inputs.age,
            wifeAge: inputs.spouse_age,
            hLE: inputs.le,
            wLE: inputs.spouse_le,
            hPIA: inputs.pia,
            wPIA: inputs.spouse_pia,
            roi: inputs.roi,
            hSS: inputs.ss_age,
            wSS: inputs.spouse_ssage,
        });
    };

    const handleDeleteInputs = (inputsId) => {
        console.log('Deleted version with ID:', inputsId);
        // You can also implement further state updates if needed
    };

    return (
        <div className="mx-auto my-0">
            <div>
                <MyUserContextProvider>
                <h1 className="text-2xl font-bold text-center mb-4">social security calculator</h1>
                <SocialSecurityInput inputs={inputs} onInputChange={handleInputChange} />
                <div className="mt-8">
                    <SaveInputs inputs={inputs}/>
                </div>
                <div className="mt-8">
                    <LoadInputs onLoad={handleLoadInputs} onDelete={handleDeleteInputs} />
                </div>
                <div className="mt-8">
                    <SocialSecurityOutput inputs={inputs} />
                </div>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
