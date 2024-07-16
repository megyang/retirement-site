"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import useSocialSecurityStore from "@/app/store/useSocialSecurityStore";
import { MyUserContextProvider } from '../hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";

const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useSocialSecurityStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();

    useEffect(() => {
        const loadInputsFromDatabase = async () => {
            if (!user) {
                console.error('User is not logged in');
                return;
            }
            const { data, error } = await supabaseClient
                .from('social_security_inputs')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error loading data from Supabase:', error);
            } else {
                console.log('Data successfully loaded from 99999Supabase:', data);
                if (data && data[0]) {
                    setInputs(data[0]);
                    setSocialSecurityInputs(data[0]);
                }
            }
        };

        if (user) {
            loadInputsFromDatabase();
        }
    }, [user, supabaseClient, setSocialSecurityInputs]);

    useEffect(() => {
        setInputs(socialSecurityInputs);
    }, [socialSecurityInputs]);

    return (
        <div className="mx-auto">
            <div>
                <MyUserContextProvider>
                    <SocialSecurityOutput inputs={inputs} setInputs={setInputs} setSocialSecurityInputs={setSocialSecurityInputs} />
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
