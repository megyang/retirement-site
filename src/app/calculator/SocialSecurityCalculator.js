"use client"
import React, { useState } from 'react';
import SocialSecurityInput from './SocialSecurityInput';
import SocialSecurityOutput from './SocialSecurityOutput';

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

    return (
        <div className="mx-auto my-0">
            <div>
                <h1 className="text-2xl font-bold text-center mb-4">social security calculator</h1>
                <SocialSecurityInput inputs={inputs} onInputChange={handleInputChange} />
                <div className="mt-8">
                    <SocialSecurityOutput inputs={inputs} />
                </div>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
