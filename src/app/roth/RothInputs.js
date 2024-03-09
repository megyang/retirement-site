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
        <div className="inputs-container">
            <h2 className="text-xl font-semibold mb-3">roth inputs</h2>
            <table className="table-auto w-full">
                <tbody>
                <tr>
                    <td>roth 1:</td>
                    <td>
                        <input
                            type="number"
                            name="Roth1"
                            value={inputs.Roth1}
                            onChange={handleChange}
                        />
                    </td>
                </tr>
                <tr>
                    <td>roth 2: </td>
                    <td>
                        <input
                            type="number"
                            name="Roth2"
                            value={inputs.Roth2}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>salary 1:</td>
                    <td>
                        <input
                            type="number"
                            name="salary1"
                            value={inputs.salary1}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>salary 2:</td>
                    <td>
                        <input
                            type="number"
                            name="salary2"
                            value={inputs.salary2}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>rental income:</td>
                    <td>
                        <input
                            type="number"
                            name="rentalIncome"
                            value={inputs.rentalIncome}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>interest:</td>
                    <td>
                        <input
                            type="number"
                            name="interest"
                            value={inputs.interest}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>capitalGains:</td>
                    <td>
                        <input
                            type="number"
                            name="capitalGains"
                            value={inputs.capitalGains}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>pension:</td>
                    <td>
                        <input
                            type="number"
                            name="pension"
                            value={inputs.pension}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>ss1: </td>
                    <td>
                        <input
                            type="number"
                            name="ss1"
                            value={inputs.ss1}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>ss2: </td>
                    <td>
                        <input
                            type="number"
                            name="ss2"
                            value={inputs.ss2}
                            onChange={handleChange}                        />
                    </td>
                </tr>                <tr>
                    <td>rmd1: </td>
                    <td>
                        <input
                            type="number"
                            name="rmd1"
                            value={inputs.rmd1}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>rmd2: </td>
                    <td>
                        <input
                            type="number"
                            name="rmd2"
                            value={inputs.rmd2}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                </tbody>
            </table>








            {/*rmd inputs*/}
            <h2 className="text-xl font-semibold mb-3">rmd inputs</h2>
            <table className="table-auto w-full">
                <tbody>
                <tr>
                    <td>age 1:</td>
                    <td>
                        <input
                            type="number"
                            name="age1"
                            value={inputs1.age1}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>age 2:</td>
                    <td>
                        <input
                            type="number"
                            name="age2"
                            value={inputs1.age2}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>life expectancy 1:</td>
                    <td>
                        <input
                            type="number"
                            name="le1"
                            value={inputs1.le1}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>life expectancy 2:</td>
                    <td>
                        <input
                            type="number"
                            name="le2"
                            value={inputs1.le2}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>current ira value 1:</td>
                    <td>
                        <input
                            type="number"
                            name="ira1"
                            value={inputs1.ira1}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>current ira value 2:</td>
                    <td>
                        <input
                            type="number"
                            name="ira2"
                            value={inputs1.ira2}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                <tr>
                    <td>roi: </td>
                    <td>
                        <input
                            type="number"
                            name="roi"
                            value={inputs1.roi}
                            onChange={handleChange1}                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );

};

export default RothInputs;