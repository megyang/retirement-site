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
        <div>
            <h1>social security calculator</h1>
            <SocialSecurityInput inputs={inputs} onInputChange={handleInputChange} />
            <SocialSecurityOutput inputs={inputs} />
        </div>
    );
};

export default SocialSecurityCalculator;
