"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import { MyUserContextProvider } from "@/app/hooks/useUser";
import useStore from "@/app/actions/useStore";

const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    const handleInputChange = (name, value) => {
        const newInputs = {
            ...inputs,
            [name]: parseFloat(value) // Convert value to a number
        };
        setInputs(newInputs);
        setSocialSecurityInputs(newInputs);
    };

    return (
        <div className="mx-auto">
            <div>
                <MyUserContextProvider>
                    <div>
                        <SocialSecurityOutput inputs={inputs} onInputChange={handleInputChange} />
                    </div>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
