// Header.js
"use client";
import React from 'react';
import useAuthModal from "@/app/hooks/useAuthModal";
import {useSupabaseClient} from "@supabase/auth-helpers-react";
import {useUser} from "@/app/hooks/useUser";
import {useRouter} from "next/navigation";
import {FaUserAlt} from "react-icons/fa";

const Header = ({ children }) => {
    const { isOpen, onOpen } = useAuthModal();
    const router = useRouter();
    const supabaseClient = useSupabaseClient();
    const {user} = useUser();

    const handleLogout = async () => {
        const {error} = await supabaseClient.auth.signOut();
        router.refresh();
        if (error) {
            console.log(error);
        }
    }

    return (
        <div>
            <div className="fixed top-0 left-0 right-0 z-50 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end h-16 items-center space-x-2">
                        {!isOpen && (
                            user ? (
                                <div className="flex gap-x-4 items-center">
                                    <button
                                    onClick={handleLogout}
                                    className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out mr-2" >
                                        log out
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={onOpen} className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out mr-2">
                                        sign up
                                    </button>

                                    <button onClick={onOpen} className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out">
                                        log in
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
            <div className="pt-16"> {/* pushes the content down under the fixed header */}
                {children}
            </div>
        </div>
    );
};

export default Header;
