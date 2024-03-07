import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import useAuthModal from "@/app/hooks/useAuthModal";
import { useUser } from "@/app/hooks/useUser";

const SaveInputs = ({ inputs }) => {
    const supabase = useSupabaseClient();
    const authModal = useAuthModal();
    const { user } = useUser(); // Assuming useUser hook returns the authenticated user object

    const onClick = async () => {
        if (!user) {
            authModal.onOpen();
            return;
        }

        // Use the user.id directly from the user object provided by your authentication state
        const userId = user.id; // This should match the ID from auth.users.id

        const { data, error } = await supabase
            .from('inputs')
            .insert([{
                user_id: userId, // This should be the foreign key column in your inputs table
                age: inputs.husbandAge,
                spouse_age: inputs.wifeAge,
                pia: inputs.hPIA,
                spouse_pia: inputs.wPIA,
                roi: inputs.roi,
                ss_age: inputs.hSS,
                spouse_ssage: inputs.wSS,
                le: inputs.hLE,
                spouse_le: inputs.wLE
            }]);

        if (error) {
            console.error('error saving inputs:', error);
            return;
        }

        console.log('inputs saved:', data);
    };

    return (
        <div>
            <button onClick={onClick} className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out">
                save
            </button>
        </div>
    );
};

export default SaveInputs;
