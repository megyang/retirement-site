"use client"
import React, { useState } from 'react';
import RothInputs from "@/app/roth/RothInputs";
import RothOutputs from "@/app/roth/RothOutputs";

const RothConversionCalculator = () => {
    const [inputs, setInputs] = useState({
        hLE: 90,
        wLE: 95,
        hPIA: 2500,
        wPIA: 2000,
        hSS: 70,
        wSS: 70
    });

    const [inputs1, setInputs1] = useState({
        age1: 62,
        age2: 60,
        le1: 90,
        le2: 95,
        ira1: 800000,
        ira2: 1000000,
        roi: 3.0,
    });

    const handleInputChange = (name, value) => {
        setInputs(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value), // Convert value to a number
        }));
    };

    const handleInputChange1 = (name, value) => {
        setInputs1(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value), // Convert value to a number
        }));
    };

    return (
        <div>
            <RothInputs inputs={inputs} onInputChange={handleInputChange} inputs1={inputs1} onInputChange1={handleInputChange1}/>
            <RothOutputs inputs={inputs} inputs1={inputs1}/>
        </div>
    );
};

export default RothConversionCalculator;
