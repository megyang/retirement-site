"use client";
import React, {useEffect, useState} from 'react';
import AuthModal from "@/app/modal/AuthModal";

const ModalProviders = () => {
    const [isMounted, setIsMounted] = useState(false);
    //server side rendering; could cause errors; if useEffect loads, safely on client and load modals
    //ensuring none of the modals can be seen during server side rendering
    //isMounted - is serverside?
    useEffect(() => {
        setIsMounted(true);
        },[]);
    if (!isMounted) {
        return null;
    }
    return (
        <div>
            <AuthModal />
        </div>
    );
};

export default ModalProviders;