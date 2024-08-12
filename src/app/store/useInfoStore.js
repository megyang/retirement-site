import create from 'zustand';

const useInfoStore = create((set) => ({
    info: null,
    setInfo: (data) => set({ info: data }),
    fetchInfo: async (supabaseClient, userId) => {
        const { data, error } = await supabaseClient
            .from('info')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (data) {
            set({ info: data });
        }
    },
}));

export default useInfoStore