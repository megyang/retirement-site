"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import useStore from "@/app/store/useStore";
import { MyUserContextProvider } from '../hooks/useUser';
import useAuthModal from "@/app/hooks/useAuthModal";
import { useUser } from "@/app/hooks/useUser";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const { onOpen } = useAuthModal();
    const { user } = useUser();
    const supabaseClient = useSupabaseClient();

    useEffect(() => {
        if (user) {
            fetchInitialInputs();
        }
    }, [user]);

    const fetchInitialInputs = async () => {
        const { data, error } = await supabaseClient
            .from('social_security_inputs')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching initial inputs:', error);
        } else if (data) {
            setInputs(data);
            setSocialSecurityInputs(data);
        }
    };

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    const handleInputChange = (name, value) => {
        if (!user) {
            onOpen();
            return;
        }
        const newInputs = {
            ...inputs,
            [name]: parseFloat(value)
        };
        setInputs(newInputs);
        setSocialSecurityInputs(newInputs);
    };

    return (
        <div className="mx-auto">
            <div>
                <MyUserContextProvider>
                    <SocialSecurityOutput inputs={inputs} onInputChange={handleInputChange} />
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;