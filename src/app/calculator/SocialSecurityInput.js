import React from "react";

const SocialSecurityInput = ({ inputs, onInputChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    return (
        <div className="inputs-container">
            <h2 className="text-xl font-semibold mb-3">
                Enter Your Information:
            </h2>
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
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Husband&apos;s Life Expectancy:</td>
                        <td>
                            <input
                                type="number"
                                name="hLE"
                                value={inputs.hLE}
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Wife&apos;s Life Expectancy:</td>
                        <td>
                            <input
                                type="number"
                                name="wLE"
                                value={inputs.wLE}
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Husband&apos;s Primary Insurance Amount:</td>
                        <td>
                            <input
                                type="number"
                                name="hPIA"
                                value={inputs.hPIA}
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Wife&apos;s Primary Insurance Amount:</td>
                        <td>
                            <input
                                type="number"
                                name="wPIA"
                                value={inputs.wPIA}
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Return on Investment:</td>
                        <td>
                            <input
                                type="number"
                                name="roi"
                                value={inputs.roi}
                                onChange={handleChange}
                            />
                        </td>
                    </tr>
                    <tr style={{ height: "50px" }}>
                        <td>Huband&apos;s Social Security Age:</td>
                        <td>
                            <input
                                type="range"
                                class="w-full"
                                name="hSS"
                                min="62"
                                max="70"
                                step="1"
                                value={inputs.hSS}
                                onChange={handleChange}
                            />
                            <ul class="flex justify-between w-full px-[10px]">
                                <li class="flex justify-center relative">
                                    <span class="absolute">62</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">63</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">64</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">65</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">66</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">67</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">68</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">69</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">70</span>
                                </li>
                            </ul>
                        </td>
                    </tr>
                    <tr style={{ height: "50px" }}>
                        <td>Wife&apos;s Social Security Age:</td>
                        <td>
                            <input
                                type="range"
                                class="w-full"
                                name="wSS"
                                min="62"
                                max="70"
                                step="1"
                                value={inputs.wSS}
                                onChange={handleChange}
                            />
                            <ul class="flex justify-between w-full px-[10px]">
                                <li class="flex justify-center relative">
                                    <span class="absolute">62</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">63</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">64</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">65</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">66</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">67</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">68</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">69</span>
                                </li>
                                <li class="flex justify-center relative">
                                    <span class="absolute">70</span>
                                </li>
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SocialSecurityInput;
