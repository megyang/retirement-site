import { create } from 'zustand';

const useAuthModal = create((set) => ({
    isOpen: false,
    view: 'sign_in',
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    setView: (view) => set({ view })
}));

export default useAuthModal;
