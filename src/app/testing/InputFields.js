const InputFields = ({ inputs1, setInputs1 }) => {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs1(prevInputs => {
            const updatedInputs = {
                ...prevInputs,
                [name]: parseFloat(value),
            };
            return updatedInputs;
        });
    };

    return (
        <div className="bg-white p-6 rounded flex-1 w-2">
            <h3 className="text-left text-1xl">Other Inputs</h3>
            <div className="">
                <div className="flex items-center justify-between mb-2">
                    <label className="flex-grow">Beneficiary Tax Rate:</label>
                    <input
                        type="number"
                        name="beneficiary_tax_rate"
                        value={inputs1.beneficiary_tax_rate * 100}
                        onChange={(e) => {
                            const { name, value } = e.target;
                            setInputs1(prevInputs => {
                                const updatedInputs = {
                                    ...prevInputs,
                                    [name]: parseFloat(value) / 100,
                                };
                                return updatedInputs;
                            });
                        }}
                        className="border rounded p-1 w-24 text-right"
                    />%
                </div>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex-grow">Your IRA:</label>
                    <input
                        type="number"
                        name="ira2"
                        value={inputs1.ira2}
                        onChange={handleInputChange}
                        className="border rounded w-24 text-right"
                    />
                </div>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex-grow">Your Spouse’s IRA:</label>
                    <input
                        type="number"
                        name="ira1"
                        value={inputs1.ira1}
                        onChange={handleInputChange}
                        className="border rounded w-24 text-right"
                    />
                </div>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex-grow">Investment Return:</label>
                    <input
                        type="number"
                        name="roi"
                        value={inputs1.roi}
                        onChange={handleInputChange}
                        className="border rounded w-24 text-right"
                    />%
                </div>
                <div className="flex items-center justify-between">
                    <label className="flex-grow">Inflation Rate:</label>
                    <input
                        type="number"
                        name="inflation"
                        value={inputs1.inflation}
                        onChange={handleInputChange}
                        className="border rounded w-24 text-right"
                    />%
                </div>
            </div>
        </div>
    );
};

export default InputFields;
