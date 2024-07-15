"use client"
import React, { useState, useEffect } from 'react';
import SocialSecurityOutput from './SocialSecurityOutput';
import useStore from "@/app/store/useStore";
import { MyUserContextProvider, useUser } from '../hooks/useUser';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
const SocialSecurityCalculator = () => {
    const { socialSecurityInputs, setSocialSecurityInputs } = useStore();
    const [inputs, setInputs] = useState(socialSecurityInputs);
    const [isUserInitiated, setIsUserInitiated] = useState(false); // Add this line
    const user = useUser();
    const supabaseClient = useSupabaseClient();

    const handleInputChange = (name, value) => {
        setIsUserInitiated(true);
        const newInputs = {
            ...inputs,
            [name]: parseFloat(value)
        };
        setInputs(newInputs);
        setSocialSecurityInputs(newInputs);
    };

    // Add useEffect to save inputs only if user-initiated
    useEffect(() => {
        if (isUserInitiated) {
            const saveData = async () => {
                if (!user) {
                    console.error('User is not logged in');
                    return;
                }
                const dataToSave = {
                    user_id: user.id,
                    husbandAge: inputs.husbandAge,
                    wifeAge: inputs.wifeAge,
                    hLE: inputs.hLE,
                    wLE: inputs.wLE,
                    hPIA: inputs.hPIA,
                    wPIA: inputs.wPIA,
                    hSS: inputs.hSS,
                    wSS: inputs.wSS,
                    roi: inputs.roi,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabaseClient
                    .from('social_security_inputs')
                    .upsert([dataToSave], { onConflict: ['user_id'] });

                if (error) {
                    console.error('Error saving data to Supabase:', error);
                } else {
                    console.log('Data successfully saved to Supabase.');
                }
            };
            saveData();
            setIsUserInitiated(false); // Reset user-initiated flag
        }
    }, [inputs, isUserInitiated]); // Add isUserInitiated to the dependency array

    return (
        <div className="mx-auto">
            <div>
                <MyUserContextProvider>
                    <SocialSecurityOutput inputs={inputs} onInputChange={handleInputChange} setInputs={setInputs} setSocialSecurityInputs={setSocialSecurityInputs}/>
                </MyUserContextProvider>
            </div>
        </div>
    );
};

export default SocialSecurityCalculator;
