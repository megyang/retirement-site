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
            {/*social security inputs*/}
            <h2 className="text-xl font-semibold mb-3">inputs</h2>
            <table className="table-auto w-full">
                <tbody>
                <tr>
                    <td>primary insurance amount:</td>
                    <td>
                        <input
                            type="number"
                            name="hPIA"
                            value={inputs.hPIA}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>spouse&apos;s primary insurance amount:</td>
                    <td>
                        <input
                            type="number"
                            name="wPIA"
                            value={inputs.wPIA}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>age to start collecting social security:</td>
                    <td>
                        <input
                            type="number"
                            name="hSS"
                            value={inputs.hSS}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>spouse&apos;s age to start collecting social security:</td>
                    <td>
                        <input
                            type="number"
                            name="wSS"
                            value={inputs.wSS}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>life expectancy:</td>
                    <td>
                        <input
                            type="number"
                            name="hLE"
                            value={inputs.hLE}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>spouse&apos;s life expectancy:</td>
                    <td>
                        <input
                            type="number"
                            name="wLE"
                            value={inputs.wLE}
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