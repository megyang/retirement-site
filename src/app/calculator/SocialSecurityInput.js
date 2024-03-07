import React from 'react';

const SocialSecurityInput = ({ inputs, onInputChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    return (
        <div className="inputs-container">
            <h2 className="text-xl font-semibold mb-3">inputs</h2>
            <table className="table-auto w-full">
                <tbody>
                <tr>
                    <td>age by the end of this year:</td>
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
                    <td>spouse&apos;s age by the end of this year:</td>
                    <td>
                        <input
                            type="number"
                            name="wifeAge"
                            value={inputs.wifeAge}
                            onChange={handleChange}                        />
                    </td>
                </tr>
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
                    <td>return on investment:</td>
                    <td>
                        <input
                            type="number"
                            name="roi"
                            value={inputs.roi}
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
        </div>
    );

};

export default SocialSecurityInput;