"use client";
import React from 'react';
import useAuthModal from "@/app/hooks/useAuthModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "@/app/hooks/useUser";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
    const { isOpen, onOpen, setView } = useAuthModal();
    const router = useRouter();
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();

    const handleLogout = async () => {
        const { error } = await supabaseClient.auth.signOut();
        router.refresh();
        if (error) {
            console.log(error);
        }
    };

    const handleSettings = () => {
        router.push('/settings');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#8daef2] border-b border-gray-300">
            <div className="w-full px-2 sm:px-3 lg:px-4">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <img src="/assets/logo.png" alt="Logo" className="h-10 w-auto mr-2 mt-[-6px] ml-[-5px]"/>
                        <div className="text-2xl font-bold">
                            Savewell Finance
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {!isOpen && (
                            user ? (
                                <>
                                    <button
                                        onClick={handleLogout}
                                        className="items-end bg-clear border border-black text-black font-medium rounded-lg px-4 py-2 transition duration-150 ease-in-out hover:bg-gray-100"
                                    >
                                        Signout
                                    </button>
                                    <button
                                        onClick={handleSettings}
                                        className="items-center bg-clear text-black font-medium px-4 py-2 transition duration-150 ease-in-out hover:gray-100"
                                    >
                                        <FontAwesomeIcon icon={faCog} className="h-5 w-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setView('sign_up');
                                            onOpen();
                                        }}
                                        className="bg-clear border border-black text-black font-medium rounded-lg px-4 py-2 transition duration-150 ease-in-out hover:bg-gray-100"
                                    >
                                        Sign up
                                    </button>

                                    <button
                                        onClick={() => {
                                            setView('sign_in');
                                            onOpen();
                                        }}
                                        className="bg-clear border border-black text-black font-medium rounded-lg px-4 py-2 transition duration-150 ease-in-out hover:bg-gray-100"
                                    >
                                        Log in
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
