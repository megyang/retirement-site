"use client";
import React, { useEffect, useState } from 'react';
import Modal from "@/app/modal/Modal";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import useAuthModal from "@/app/hooks/useAuthModal";

const AuthModal = () => {
    const supabaseClient = useSupabaseClient();
    const { onClose, isOpen, view, setView } = useAuthModal();
    const { session } = useSessionContext();
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (session) {
            onClose();
        }
    }, [session, onClose]);

    const getTitle = () => {
        if (view === 'sign_in') {
            return 'Log In';
        } else if (view === 'sign_up') {
            return 'Sign Up';
        } else if (view === 'forgot_password') {
            return 'Reset Password';
        } else {
            return 'Welcome';
        }
    };

    const getDescription = () => {
        if (view === 'sign_in') {
            return 'Please log in to continue';
        } else if (view === 'sign_up') {
            return 'Create an account to plan for retirement';
        } else if (view === 'forgot_password') {
            return 'Enter your email to reset your password';
        } else {
            return 'Please sign in to continue';
        }
    };

    const handlePasswordReset = async () => {
        if (email) {
            const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);
            if (error) {
                console.error('Error sending reset password email:', error);
            } else {
                alert('Password reset email sent!');
                setView('sign_in');
            }
        }
    };

    return (
        <Modal
            title={getTitle()}
            description={getDescription()}
            isOpen={isOpen}
            onChange={onClose}>
            {view === 'forgot_password' ? (
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '20px',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                    />
                    <button
                        onClick={handlePasswordReset}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '20px',
                            fontSize: '1rem',
                            borderRadius: '4px',
                            backgroundColor: '#404040',
                            color: 'white',
                            cursor: 'pointer',
                            border: 'none'
                        }}
                    >
                        Send Reset Link
                    </button>
                </div>
            ) : (
                <Auth
                    providers={[]}
                    magicLink={false}
                    showLinks={false}
                    supabaseClient={supabaseClient}
                    view={view}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#404040',
                                    brandAccent: '#c0e0f8'
                                }
                            }
                        }
                    }}
                />
            )}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem', color: 'gray' }}>
                {view === 'sign_in' ? (
                    <>
                        <p>
                            <button
                                onClick={() => setView('sign_up')}
                                style={{ color: 'gray', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Do not have an account? Sign up
                            </button>
                        </p>
                        <p>
                            <button
                                onClick={() => setView('forgot_password')}
                                style={{ color: 'gray', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Forgot your password?
                            </button>
                        </p>
                    </>
                ) : view === 'sign_up' ? (
                    <p>
                        <button
                            onClick={() => setView('sign_in')}
                            style={{ color: 'gray', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Already have an account? Sign in
                        </button>
                    </p>
                ) : (
                    <p>
                        <button
                            onClick={() => setView('sign_in')}
                            style={{ color: 'gray', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Back to Log In
                        </button>
                    </p>
                )}
            </div>
        </Modal>
    );
};

export default AuthModal;
