"use client"
import React from 'react';

const RothInputs = ({ inputs, onInputChange, inputs1, onInputChange1 }) => {


    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    const handleChange1 = (e) => {
        const { name, value } = e.target;
        onInputChange1(name, value);
    };

    return (
        <div className="inputs-container max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-xl font-semibold mb-6">Social Security Inputs</h2>
            <div className="mb-8">
                <div className="grid gap-4 grid-cols-2">
                    {[
                        { label: "Primary Insurance Amount:", name: "hPIA", value: inputs.hPIA },
                        { label: "Spouse's Primary Insurance Amount:", name: "wPIA", value: inputs.wPIA },
                        { label: "Age to start collecting Social Security:", name: "hSS", value: inputs.hSS },
                        { label: "Spouse's age to start collecting Social Security:", name: "wSS", value: inputs.wSS },
                        { label: "Life Expectancy:", name: "hLE", value: inputs.hLE },
                        { label: "Spouse's Life Expectancy:", name: "wLE", value: inputs.wLE },

                    ].map((input) => (
                        <div key={input.name} className="flex items-center">
                            <label className="w-1/2 mr-4 text-right">{input.label}</label>
                            <input
                                type="number"
                                name={input.name}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                value={input.value}
                                onChange={handleChange}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-6">RMD Inputs</h2>
            <div className="mb-8">
                <div className="grid gap-4 grid-cols-2">
                    {[
                        { label: "Age:", name: "age1", value: inputs1.age1 },
                        { label: "Spouse's Age:", name: "age2", value: inputs1.age2 },
                        { label: "Current IRA Value 1:", name: "ira1", value: inputs1.ira1 },
                        { label: "Current IRA Value 2:", name: "ira2", value: inputs1.ira2 },
                        { label: "ROI:", name: "roi", value: inputs1.roi },
                        { label: "Inflation Rate:", name: "inflation", value: inputs1.inflation }

                    ].map((input) => (
                        <div key={input.name} className="flex items-center">
                            <label className="w-1/2 mr-4 text-right">{input.label}</label>
                            <input
                                type="number"
                                name={input.name}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                value={input.value}
                                onChange={handleChange1}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>

    );

};

export default RothInputs;