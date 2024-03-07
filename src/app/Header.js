// Header.js
"use client";
import React from 'react';
import useAuthModal from "@/app/hooks/useAuthModal";

const Header = ({ children }) => {
    const { isOpen, onOpen } = useAuthModal();

    return (
        <div>
            <div className="fixed top-0 left-0 right-0 z-50 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end h-16 items-center space-x-2">
                        {!isOpen && ( // Conditional rendering based on the modal's open state
                            <>
                                <button onClick={onOpen} className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out">
                                    sign up
                                </button>

                                <button onClick={onOpen} className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out">
                                    log in
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="pt-16"> {/* Pushes the content down under the fixed header */}
                {children}
            </div>
        </div>
    );
};

export default Header;
