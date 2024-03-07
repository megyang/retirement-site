import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import useAuthModal from "@/app/hooks/useAuthModal";
import { useUser } from "@/app/hooks/useUser";

const SaveInputs = ({ inputs }) => {
    const supabase = useSupabaseClient();
    const authModal = useAuthModal();
    const { user } = useUser();
    const [versionName, setVersionName] = useState('');

    const onClick = async () => {
        if (!user) {
            authModal.onOpen();
            return;
        }

        const userId = user.id;
        const payload = {
            user_id: userId,
            age: inputs.husbandAge,
            spouse_age: inputs.wifeAge,
            pia: inputs.hPIA,
            spouse_pia: inputs.wPIA,
            roi: inputs.roi,
            ss_age: inputs.hSS,
            spouse_ssage: inputs.wSS,
            le: inputs.hLE,
            spouse_le: inputs.wLE,
            version: versionName.trim() || undefined // Use versionName if provided, otherwise fallback to undefined so Supabase can handle fallback to inputId or auto generation
        };

        const { data, error } = await supabase.from('inputs').insert([payload]);

        if (error) {
            console.error('error saving inputs:', error);
        } else {
            console.log('inputs saved:', data);
            setVersionName(''); // Clear the version name input after successful save
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                type="text"
                placeholder="version name (optional)"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
            />
            <button
                className="bg-blue-200 hover:bg-blue-400 font-medium rounded px-4 py-2 transition duration-150 ease-in-out"
                onClick={onClick}
            >
                save
            </button>
        </div>
    );
};

export default SaveInputs;
