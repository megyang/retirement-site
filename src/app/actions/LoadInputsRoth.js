import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useAuthModal from "@/app/hooks/useAuthModal";

const LoadInputsRoth = ({ versionId, setFinancialInputs }) => {
    const [loading, setLoading] = useState(false);
    const supabase = useSupabaseClient();
    const { user } = useUser(); // Ensuring user object is correctly obtained from the hook
    const authModal = useAuthModal();

    useEffect(() => {
        // Ensure you're checking for both user existence and versionId before attempting to load data
        if (user && versionId) {
            const loadVersionDetails = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('roth')
                        .select('*')
                        // You might want to filter by user_id if your table contains data for multiple users
                        .eq('user_id', user.id) // Assuming 'user_id' is the correct column name in your table
                        .eq('version_id', versionId);

                    if (error) throw error;

                    setFinancialInputs(data);
                } catch (error) {
                    console.error('Error loading version details:', error.message);
                } finally {
                    setLoading(false);
                }
            };

            loadVersionDetails();
        }
    }, [setFinancialInputs, supabase]); // Adjust the dependency array

    if (loading) return <p>Loading...</p>;
    return null; // Optionally, render UI elements based on the loaded data
};

export default LoadInputsRoth;
