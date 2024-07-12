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
    const router = useRouter();
    const { session } = useSessionContext();
    const { onClose, isOpen, view } = useAuthModal();

    useEffect(() => {
        if (session) {
            router.refresh();
            onClose();
        }
    }, [session, router, onClose]);

    return (
        <Modal
            title="Welcome"
            description="Please sign in to continue"
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
                            colors:{
                                brand: '#404040',
                                brandAccent: '#c0e0f8'
                            }
                        }
                    }
                }}
            />
        </Modal>
    );
};

export default AuthModal;
