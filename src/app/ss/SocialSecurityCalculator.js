"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import { MyUserContextProvider } from "@/app/hooks/useUser";
import useStore from "@/app/store/useStore";

const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    const handleInputChange = (name, value) => {
        const newInputs = {
            ...inputs,
            [name]: parseFloat(value)
        };
        setInputs(newInputs);
        setSocialSecurityInputs(newInputs);
    };

    return (
        <div className="mx-auto">
            <div>
                <MyUserContextProvider>
                    <SocialSecurityOutput inputs={inputs} onInputChange={handleInputChange} />
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
