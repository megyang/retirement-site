"use client"
import React, { useState } from 'react';
import RothInputs from "@/app/roth/RothInputs";
import RothOutputs from "@/app/roth/RothOutputs";

const RothConversionCalculator = () => {
    const [inputs, setInputs] = useState({
        Roth1: 0,
        Roth2: 0,
        salary1: 0,
        salary2: 0,
        rentalIncome: 0,
        interest: 0,
        capitalGains: 0,
        pension: 0,
        ss1: 0,
        ss2: 0,
        rmd1: 0,
        rmd2: 0,
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
