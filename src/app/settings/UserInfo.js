"use client";
import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserInfo = () => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        ss: false,
        monthly_benefit: '',
        married: false,
        filing: '',
        month: '',
        year: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const { data, error } = await supabaseClient
                    .from('info')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching user data:', error);
                } else if (data.length > 0) {
                    setUserData(data[0]);
                    setFormData({
                        ss: data[0].ss,
                        monthly_benefit: data[0].monthly_benefit || '',
                        married: data[0].married,
                        filing: data[0].filing || '',
                        month: data[0].month,
                        year: data[0].year
                    });
                } else {
                    setFormData({
                        ss: false,
                        monthly_benefit: '',
                        married: false,
                        filing: '',
                        month: '',
                        year: ''
                    });
                }
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, supabaseClient]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const newValue = type === 'radio' ? (value === 'true' ? true : false) : value;
        setFormData({
            ...formData,
            [name]: newValue
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient
            .from('info')
            .upsert({ ...formData, user_id: user.id }, { onConflict: ['user_id'] });

        if (error) {
            setError('Error updating user data');
            console.error('Error updating user data:', error);
        } else {
            toast.success('User data updated successfully');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6 border border-gray-300 rounded-lg bg-white shadow-md">
            <h2 className="text-2xl font-bold mb-4">User Information</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">Collecting Social Security:</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="ss"
                                    value={true}
                                    checked={formData.ss === true}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="ss"
                                    value={false}
                                    checked={formData.ss === false}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">No</span>
                            </label>
                        </div>
                    </div>
                    {formData.ss && (
                        <div className="form-group">
                            <label className="block text-lg font-medium text-gray-700">Monthly Benefit:</label>
                            <input
                                type="text"
                                name="monthly_benefit"
                                value={formData.monthly_benefit}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">Married:</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="married"
                                    value={true}
                                    checked={formData.married === true}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="married"
                                    value={false}
                                    checked={formData.married === false}
                                    onChange={handleChange}
                                    className="form-radio"
                                />
                                <span className="ml-2">No</span>
                            </label>
                        </div>
                    </div>
                    {formData.married && (
                        <div className="form-group">
                            <label className="block text-lg font-medium text-gray-700">How User is Filing:</label>
                            <div className="mt-2 flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="filing"
                                        value={true}
                                        checked={formData.filing === true}
                                        onChange={handleChange}
                                        className="form-radio"
                                    />
                                    <span className="ml-2">Jointly</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="filing"
                                        value={false}
                                        checked={formData.filing === false}
                                        onChange={handleChange}
                                        className="form-radio"
                                    />
                                    <span className="ml-2">Single</span>
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">Birth Month:</label>
                        <input
                            type="text"
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                            placeholder="MM"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-lg font-medium text-gray-700">Birth Year:</label>
                        <input
                            type="text"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            placeholder="YYYY"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <button type="submit" className="mt-4 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                        Save Changes
                    </button>
                </form>
            <ToastContainer />
        </div>
    );
};

export default UserInfo;
