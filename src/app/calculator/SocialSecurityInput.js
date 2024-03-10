import React from 'react';

const SocialSecurityInput = ({ inputs, onInputChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    return (
        <div className="inputs-container">
            <h2 className="text-xl font-semibold mb-3">Enter Your Information:</h2>
            <table className="table-auto w-full">
                <tbody>
                <tr>
                    <td>Husband&apos;s Age &#40;Dec 2024&#41;:</td>
                    <td>
                        <input
                            type="number"
                            name="husbandAge"
                            value={inputs.husbandAge}
                            onChange={handleChange}
                        />
                    </td>
                </tr>
                <tr>
                    <td>Wife&apos;s Age: &#40;Dec 2024&#41;</td>
                    <td>
                        <input
                            type="number"
                            name="wifeAge"
                            value={inputs.wifeAge}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Husband&apos;s Life Expectancy:</td>
                    <td>
                        <input
                            type="number"
                            name="hLE"
                            value={inputs.hLE}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Wife&apos;s Life Expectancy:</td>
                    <td>
                        <input
                            type="number"
                            name="wLE"
                            value={inputs.wLE}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Husband&apos;s Primary Insurance Amount:</td>
                    <td>
                        <input
                            type="number"
                            name="hPIA"
                            value={inputs.hPIA}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Wife&apos;s Primary Insurance Amount:</td>
                    <td>
                        <input
                            type="number"
                            name="wPIA"
                            value={inputs.wPIA}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Return on Investment:</td>
                    <td>
                        <input
                            type="number"
                            name="roi"
                            value={inputs.roi}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Huband&apos;s Social Security Age:</td>
                    <td>
                        <input
                            type="number"
                            name="hSS"
                            value={inputs.hSS}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                <tr>
                    <td>Wife&apos;s Social Security Age:</td>
                    <td>
                        <input
                            type="number"
                            name="wSS"
                            value={inputs.wSS}
                            onChange={handleChange}                        />
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );

};

export default SocialSecurityInput;