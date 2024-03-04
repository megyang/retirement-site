import React from 'react';

const SocialSecurityInput = ({ inputs, onInputChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    return (
        <div className="inputs-container">
            <h2>inputs</h2>
            <div className="label-input-container">
                <label htmlFor="husbandAge">age by the end of this year:</label>
                <input type="number" id="husbandAge" name="husbandAge" value={inputs.husbandAge} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="wifeAge">spouse's age by the end of this year:</label>
                <input type="number" id="wifeAge" name="wifeAge" value={inputs.wifeAge} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="hPIA">primary insurance amount:</label>
                <input type="number" id="hPIA" name="hPIA" value={inputs.hPIA} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="wPIA">spouse's primary insurance amount:</label>
                <input type="number" id="wPIA" name="wPIA" value={inputs.wPIA} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="roi">return on investment:</label>
                <input type="number" id="roi" name="roi" value={inputs.roi} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="hSS">age to start collecting social security:</label>
                <input type="number" id="hSS" name="hSS" value={inputs.hSS} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="wSS">spouse's age to start collecting social security:</label>
                <input type="number" id="wSS" name="wSS" value={inputs.wSS} onChange={handleChange} />
            </div>

            <div className="label-input-container">
                <label htmlFor="hLE">life expectancy:</label>
                <input type="number" id="hLE" name="hLE" value={inputs.hLE} onChange={handleChange} />
            </div>
            <div className="label-input-container">
                <label htmlFor="wLE">spouse's life expectancy:</label>
                <input type="number" id="wLE" name="wLE" value={inputs.wLE} onChange={handleChange} />
            </div>
        </div>
    );
};

export default SocialSecurityInput;
