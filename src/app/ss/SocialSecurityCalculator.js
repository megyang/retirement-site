"use client"
import React, { useState, useEffect, useCallback } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import useStore from "@/app/store/useStore";
import { MyUserContextProvider } from '../hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import { debounce } from '../utils/debounce';

const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();

    const loadInputsFromDatabase = useCallback(async () => {
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
        } else if (data.length === 0) {
            console.log('No data found for user, initializing with default values.');
            setInputs(socialSecurityInputs);
            setSocialSecurityInputs(socialSecurityInputs);
        } else {
            setInputs(data[0]);
            setSocialSecurityInputs(data[0]);
        }
    }, [user, supabaseClient, socialSecurityInputs, setSocialSecurityInputs]);

    useEffect(() => {
        if (user) {
            loadInputsFromDatabase();
        }
    }, [user, loadInputsFromDatabase]);

    const saveInputsToDatabase = useCallback(debounce(async (newInputs) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { error } = await supabaseClient
            .from('social_security_inputs')
            .upsert({ ...newInputs, user_id: user.id, updated_at: new Date() }, { onConflict: ['user_id'] });

        if (error) {
            console.error('Error saving data to Supabase:', error);
        } else {
            console.log('Data successfully saved to Supabase.');
        }
    }, 500), [user, supabaseClient]);

    const handleInputChange = (name, value) => {
        const newInputs = {
            ...inputs,
            [name]: parseFloat(value)
        };
        setInputs(newInputs);
        setSocialSecurityInputs(newInputs);
        saveInputsToDatabase(newInputs);
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
