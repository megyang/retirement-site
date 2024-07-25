"use client";
import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const ResetPassword = () => {
    const supabaseClient = useSupabaseClient();
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleResetPassword = async (event) => {
        event.preventDefault();

        // Simple validation for email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('Please enter a valid email');
            return;
        }

        const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://savewellfinance.com/reset-password',
        });

        if (error) {
            setErrorMessage('Error resetting password: ' + error.message);
        } else {
            setSuccessMessage(`Recovery instructions sent to ${email}. Please check your spam folder.`);
        }
    };

    return (
        <div className="max-w-sm mx-auto px-4 py-8">
            <h1 className="text-3xl text-slate-800 font-bold mb-6">Reset your Password ✨</h1>
            {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
            {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}
            <form onSubmit={handleResetPassword}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address <span className="text-rose-500">*</span></label>
                        <input
                            id="email_to_reset"
                            className="form-input w-full"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white whitespace-nowrap" type="submit">Send Reset Link</button>
                </div>
                <div className="text-sm mt-4">
                    Have an account? <a className="font-medium text-indigo-500 hover:text-indigo-600" href="/signin">Sign In</a>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;
