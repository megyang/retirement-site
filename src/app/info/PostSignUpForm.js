"use client";
import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostSignUpForm = () => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const router = useRouter();
    const [formData, setFormData] = useState({
        socialSecurity: '',
        monthlyBenefit: '',
        married: '',
        filingStatus: '',
        birthDate: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDateChange = (e) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            birthDate: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const regex = /^(0[1-9]|1[0-2])\/(19[0-9]{2}|20[0-2][0-4])$/;

        if (
            formData.socialSecurity === '' ||
            (formData.socialSecurity === 'yes' && formData.monthlyBenefit === '') ||
            formData.married === '' ||
            (formData.married === 'yes' && formData.filingStatus === '') ||
            !formData.birthDate ||
            !regex.test(formData.birthDate)
        ) {
            setError('Please fill out all required fields correctly.');
            setLoading(false);
        } else {
            setError('');
            const [month, year] = formData.birthDate.split('/').map(Number);
            const data = {
                ss: formData.socialSecurity === 'yes',
                monthly_benefit: formData.socialSecurity === 'yes' ? parseInt(formData.monthlyBenefit) : null,
                married: formData.married === 'yes',
                filing: formData.married === 'yes' ? (formData.filingStatus === 'jointly') : null,
                month,
                year,
                user_id: user.id
            };

            const { data: existingData, error: fetchError } = await supabaseClient
                .from('info')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching data:', fetchError);
                setError('There was an error submitting the form.');
                setLoading(false);
            } else if (existingData) {
                // Update existing entry
                const { error: updateError } = await supabaseClient
                    .from('info')
                    .update(data)
                    .eq('user_id', user.id);

                if (updateError) {
                    console.error('Error updating data:', updateError);
                    setError('There was an error submitting the form.');
                } else {
                    console.log('Form updated:', formData);
                    toast.success('Submitted successfully!');
                    setTimeout(() => router.push('/ss'), 2000);
                }
                setLoading(false);
            } else {
                // Insert new entry
                const { error: insertError } = await supabaseClient
                    .from('info')
                    .upsert([{ ...data, user_id: user.id }]);

                if (insertError) {
                    console.error('Error inserting data:', insertError);
                    setError('There was an error submitting the form.');
                } else {
                    console.log('Form submitted:', formData);
                    toast.success('Submitted successfully!');
                    setTimeout(() => router.push('/ss'), 2000);
                }
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mx-auto p-6 border border-gray-300 rounded-lg bg-white shadow-md">
            <h2 className="text-2xl font-bold mb-4">Post Sign Up Form</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-group">
                    <label className="block text-lg font-medium text-gray-700">
                        Have you already started collecting social security?
                    </label>
                    <div className="mt-2 flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="socialSecurity"
                                value="yes"
                                checked={formData.socialSecurity === 'yes'}
                                onChange={handleChange}
                                className="form-radio"
                            />
                            <span className="ml-2">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="socialSecurity"
                                value="no"
                                checked={formData.socialSecurity === 'no'}
                                onChange={handleChange}
                                className="form-radio"
                            />
                            <span className="ml-2">No</span>
                        </label>
                    </div>
                    {loading && formData.socialSecurity === '' && <div className="text-red-500 text-sm mt-1">This field is required.</div>}
                </div>
                {formData.socialSecurity === 'yes' && (
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">
                            What is your monthly benefit?
                        </label>
                        <input
                            type="text"
                            name="monthlyBenefit"
                            value={formData.monthlyBenefit}
                            onChange={handleChange}
                            placeholder="Enter your monthly benefit"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        {loading && formData.monthlyBenefit === '' && <div className="text-red-500 text-sm mt-1">This field is required.</div>}
                    </div>
                )}
                <div className="form-group">
                    <label className="block text-lg font-medium text-gray-700">
                        Are you married?
                    </label>
                    <div className="mt-2 flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="married"
                                value="yes"
                                checked={formData.married === 'yes'}
                                onChange={handleChange}
                                className="form-radio"
                            />
                            <span className="ml-2">Yes</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                name="married"
                                value="no"
                                checked={formData.married === 'no'}
                                onChange={handleChange}
                                className="form-radio"
                            />
                            <span className="ml-2">No</span>
                        </label>
                    </div>
                    {loading && formData.married === '' && <div className="text-red-500 text-sm mt-1">This field is required.</div>}
                </div>
                {formData.married === 'yes' && (
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">
                            Are you filing married jointly or single?
                        </label>
                        <div className="mt-2 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="filingStatus"
                                    value="jointly"
                                    checked={formData.filingStatus === 'jointly'}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">Jointly</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="filingStatus"
                                    value="single"
                                    checked={formData.filingStatus === 'single'}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">Single</span>
                            </label>
                        </div>
                        {loading && formData.filingStatus === '' && <div className="text-red-500 text-sm mt-1">This field is required.</div>}
                    </div>
                )}
                <div className="form-group">
                    <label className="block text-lg font-medium text-gray-700">
                        What month and year were you born?
                    </label>
                    <input
                        type="text"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleDateChange}
                        placeholder="mm/yyyy"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {loading && !formData.birthDate && <div className="text-red-500 text-sm mt-1">This field is required.</div>}
                    {loading && formData.birthDate && !/^(0[1-9]|1[0-2])\/(19[0-9]{2}|20[0-2][0-4])$/.test(formData.birthDate) && (
                        <div className="text-red-500 text-sm mt-1">Invalid date. Please enter a value between 01/1900 and 12/2024.</div>
                    )}
                </div>
                {loading && error && <div className="text-red-500 text-sm mt-1">{error}</div>}
                <button
                    type="submit"
                    className={`mt-4 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} shadow-sm`}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default PostSignUpForm;
