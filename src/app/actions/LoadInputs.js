import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import useAuthModal from "@/app/hooks/useAuthModal";

const LoadInputs = ({ onLoad, onDelete }) => {
    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const supabase = useSupabaseClient();
    const { user } = useUser();
    const authModal = useAuthModal();

    useEffect(() => {
        const fetchVersions = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('inputs')
                    .select('inputsId, version')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('error fetching versions:', error);
                } else {
                    setVersions(data);
                }
            }
        };

        fetchVersions();
    }, [user, supabase]);

    const handleLoad = async () => {
        if (!user) {
            authModal.onOpen(); // Open the authentication modal if user is not logged in
            return;
        }

        if (!selectedVersion) {
            alert('please select a version to load.');
            return;
        }

        const { data, error } = await supabase
            .from('inputs')
            .select('*')
            .eq('inputsId', selectedVersion)
            .single();

        if (error) {
            console.error('Error loading input version:', error);
        } else {
            onLoad(data);
        }
    };

    const handleDelete = async () => {
        if (!user) {
            authModal.onOpen(); // Open the authentication modal if user is not logged in
            return;
        }

        if (!selectedVersion) {
            alert('Please select a version to delete.');
            return;
        }

        if (window.confirm('are you sure you want to delete this version?')) {
            const { error } = await supabase
                .from('inputs')
                .delete()
                .eq('inputsId', selectedVersion);

            if (error) {
                console.error('Error deleting input version:', error);
            } else {
                onDelete();
                setVersions(versions.filter(v => v.inputsId !== selectedVersion));
                setSelectedVersion(''); // Reset selected version after deletion
            }
        }
    };

    return (
        <div className="flex items-center space-x-2 mt-4">
            <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={selectedVersion}
                    onChange={(e) => setSelectedVersion(e.target.value)}>
                <option value="">select a version</option>
                {versions.map((v) => (
                    <option key={v.inputsId} value={v.inputsId}>
                        {v.version || v.inputsId}
                    </option>
                ))}
            </select>
            <button className="px-4 py-2 bg-blue-200 rounded hover:bg-blue-400"
                    onClick={handleLoad}>
                load
            </button>
            <button className="px-4 py-2 bg-red-200 rounded hover:bg-red-400"
                    onClick={handleDelete}>
                delete
            </button>
        </div>
    );
};

export default LoadInputs;
