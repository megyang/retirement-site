"use client";
import React, { useEffect } from 'react';
import Modal from "@/app/modal/Modal";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import useAuthModal from "@/app/hooks/useAuthModal";

const AuthModal = () => {
    const supabaseClient = useSupabaseClient();
    const { onClose, isOpen, view } = useAuthModal();
    const { session } = useSessionContext();
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
        } else {
            return 'Welcome';
        }
    };

    const getDescription = () => {
        if (view === 'sign_in') {
            return 'Please log in to continue';
        } else if (view === 'sign_up') {
            return 'Create an account to plan for retirement';
        } else {
            return 'Please sign in to continue';
        }
    };

    const localization = {
        variables: {
            sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                password_input_placeholder: 'Create a password'
            },
            sign_in: {
                email_label: 'Email',
                password_label: 'Password'
            }
        }
    };

    return (
        <Modal
            title={getTitle()}
            description={getDescription()}
            isOpen={isOpen}
            onChange={onClose}>
            <Auth
                providers={[]}
                magicLink
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
                localization={view === 'sign_up' || view === 'sign_in' ? localization : {}}
            />
        </Modal>
    );
};

export default AuthModal;
