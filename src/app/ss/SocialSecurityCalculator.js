"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import useStore from "@/app/store/useStore";
import { MyUserContextProvider } from '../hooks/useUser';

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
                    <SocialSecurityOutput inputs={inputs} onInputChange={handleInputChange} setInputs={setInputs}/>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;