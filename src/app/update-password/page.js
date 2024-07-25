"use client";
import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import useAuthModal from "@/app/hooks/useAuthModal";

const UpdatePassword = () => {
    const supabaseClient = useSupabaseClient();
    const router = useRouter();
    const { onOpen, setView } = useAuthModal();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
            supabaseClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                .then(({ data, error }) => {
                    if (error) {
                        setErrorMessage('Invalid or expired token.');
                    }
                });
        } else {
            setErrorMessage('Invalid or missing token.');
        }
    }, [supabaseClient]);

    const handlePasswordUpdate = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabaseClient.auth.updateUser({
            password: password,
        });

        setIsLoading(false);

        if (error) {
            setErrorMessage('Error updating password: ' + error.message);
        } else {
            setSuccessMessage('Password updated successfully');
            setTimeout(() => {
                setView('sign_in');
                onOpen();
                router.push('/');
            }, 2000);
        }
    };

    return (
        <div className="max-w-sm mx-auto px-4 py-8">
            <h1 className="text-3xl text-slate-800 font-bold mb-6">Update your Password ✨</h1>
            {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
            {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}
            <form onSubmit={handlePasswordUpdate}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password <span className="text-rose-500">*</span></label>
                        <input
                            id="new_password"
                            className="form-input w-full"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password <span className="text-rose-500">*</span></label>
                        <input
                            id="confirm_password"
                            className="form-input w-full"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white whitespace-nowrap" type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdatePassword;
