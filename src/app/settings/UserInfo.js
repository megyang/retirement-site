"use client";
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";

function UserInfo() {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();

    const [ss, setSS] = useState(null);
    const [benefit, setBenefit] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [married, setMarried] = useState(null);
    const [filing, setFiling] = useState(null);
    const [spouseSS, setSpouseSS] = useState(null);
    const [spouseBenefit, setSpouseBenefit] = useState('');
    const [spouseMonth, setSpouseMonth] = useState('');
    const [spouseYear, setSpouseYear] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabaseClient
                .from('info')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                toast.error('Error loading data. Please try again.');
            } else if (data) {
                setSS(data.ss);
                setBenefit(data.monthly_benefit ? data.monthly_benefit.toString() : '');
                setMonth(data.month ? data.month.toString().padStart(2, '0') : '');
                setYear(data.year ? data.year.toString() : '');
                setMarried(data.married);
                setFiling(data.filing);
                setSpouseSS(data.spouse_ss);
                setSpouseBenefit(data.spouse_benefit ? data.spouse_benefit.toString() : '');
                setSpouseMonth(data.spouse_month ? data.spouse_month.toString().padStart(2, '0') : '');
                setSpouseYear(data.spouse_year ? data.spouse_year.toString() : '');
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const validateDate = (month, year) => {
        const monthInt = parseInt(month, 10);
        const yearInt = parseInt(year, 10);
        const currentYear = new Date().getFullYear();
        return (
            monthInt >= 1 && monthInt <= 12 &&
            yearInt >= 1900 && yearInt <= currentYear
        );
    };

    const handleSubmit = async () => {
        const newErrors = {};

        // Validate birth date
        if (!month || !year || !validateDate(month, year)) {
            newErrors.monthYear = "Invalid date. Please enter a value between 01/1900 and 12/" + new Date().getFullYear() + ".";
        }

        // Validate monthly benefit
        if (ss) {
            if (!benefit) {
                newErrors.benefit = "This field is required.";
            } else if (isNaN(benefit) || !Number.isInteger(parseFloat(benefit))) {
                newErrors.benefit = "This field must be a number.";
            }
        }

        // Validate spouse details if married
        if (married) {
            if (!filing) {
                newErrors.filing = "This field is required.";
            }

            if (!spouseMonth || !spouseYear || !validateDate(spouseMonth, spouseYear)) {
                newErrors.spouseMonthYear = "Invalid date. Please enter a value between 01/1900 and 12/" + new Date().getFullYear() + ".";
            }

            if (spouseSS && !spouseBenefit) {
                newErrors.spouseBenefit = "This field is required.";
            } else if (spouseSS && (isNaN(spouseBenefit) || !Number.isInteger(parseFloat(spouseBenefit)))) {
                newErrors.spouseBenefit = "This field must be a number.";
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setLoading(true);

        const userInfo = {
            ss,
            benefit: ss ? parseInt(benefit, 10) : null,
            month: parseInt(month, 10),
            year: parseInt(year, 10),
            married,
            filing,
            spouseSS,
            spouseBenefit: spouseSS ? parseInt(spouseBenefit, 10) : null,
            spouseMonth: spouseMonth ? parseInt(spouseMonth, 10) : null,
            spouseYear: spouseYear ? parseInt(spouseYear, 10) : null,
        };

        const { error } = await supabaseClient
            .from('info')
            .upsert([{ user_id: user.id, ...userInfo }], { onConflict: ['user_id'] });

        if (error) {
            toast.error('Error submitting data. Please try again.');
        } else {
            setUserInfo(userInfo); // Save the userInfo to the local storage via Zustand store
            toast.success('Submitted successfully!');
        }

        setLoading(false);

        if (error) {
            toast.error('Error submitting data. Please try again.');
        } else {
            toast.success('Settings updated successfully!');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <ToastContainer />
            <h1 className="text-2xl font-semibold mb-4 text-gray-800">Update Your Information</h1>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Have you already started collecting social security?</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="ss" value="yes" checked={ss === true} onChange={() => setSS(true)} className="mr-2" /> Yes
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="ss" value="no" checked={ss === false} onChange={() => setSS(false)} className="mr-2" /> No
                    </label>
                </div>
                {ss && (
                    <div className="mt-4">
                        <label className="block text-gray-700 mb-2">What is your monthly benefit?</label>
                        <input type="text" value={benefit} onChange={(e) => setBenefit(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        {errors.benefit && <div className="text-red-500 text-sm mt-1">{errors.benefit}</div>}
                    </div>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2">What month and year were you born? (MM/YYYY)</label>
                <div className="flex space-x-4">
                    <input type="text" placeholder="MM" value={month} onChange={(e) => setMonth(e.target.value)} className="w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <input type="text" placeholder="YYYY" value={year} onChange={(e) => setYear(e.target.value)} className="w-2/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                {errors.monthYear && <div className="text-red-500 text-sm mt-1">{errors.monthYear}</div>}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 mb-2">Are you married?</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="married" value="yes" checked={married === true} onChange={() => setMarried(true)} className="mr-2" /> Yes
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="married" value="no" checked={married === false} onChange={() => setMarried(false)} className="mr-2" /> No
                    </label>
                </div>
                {married && (
                    <>
                        <div className="mt-4">
                            <label className="block text-gray-700 mb-2">How are you filing?</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" name="filing" value="jointly" checked={filing === true} onChange={() => setFiling(true)} className="mr-2" /> Jointly
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="filing" value="separately" checked={filing === false} onChange={() => setFiling(false)} className="mr-2" /> Separately
                                </label>
                            </div>
                            {errors.filing && <div className="text-red-500 text-sm mt-1">{errors.filing}</div>}
                        </div>

                        <div className="mt-4">
                            <label className="block text-gray-700 mb-2">Has your spouse already started collecting Social Security?</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" name="spouse_ss" value="yes" checked={spouseSS === true} onChange={() => setSpouseSS(true)} className="mr-2" /> Yes
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="spouse_ss" value="no" checked={spouseSS === false} onChange={() => setSpouseSS(false)} className="mr-2" /> No
                                </label>
                            </div>
                            {spouseSS && (
                                <div className="mt-4">
                                    <label className="block text-gray-700 mb-2">What is your spouse's monthly benefit?</label>
                                    <input type="text" value={spouseBenefit} onChange={(e) => setSpouseBenefit(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                    {errors.spouseBenefit && <div className="text-red-500 text-sm mt-1">{errors.spouseBenefit}</div>}
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <label className="block text-gray-700 mb-2">What month and year was your spouse born? (MM/YYYY)</label>
                            <div className="flex space-x-4">
                                <input type="text" placeholder="MM" value={spouseMonth} onChange={(e) => setSpouseMonth(e.target.value)} className="w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                <input type="text" placeholder="YYYY" value={spouseYear} onChange={(e) => setSpouseYear(e.target.value)} className="w-2/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            {errors.spouseMonthYear && <div className="text-red-500 text-sm mt-1">{errors.spouseMonthYear}</div>}
                        </div>
                    </>
                )}
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50">
                {loading ? <span>Submitting...</span> : <span>Update Settings</span>}
            </button>
        </div>
    );
}

export default UserInfo;
