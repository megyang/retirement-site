import create from 'zustand';

const useStore = create(set => ({
    socialSecurityInputs: {
        husbandAge: 60,
        wifeAge: 60,
        hLE: 90,
        wLE: 95,
        hPIA: 2500,
        wPIA: 2000,
        roi: 3.0,
        hSS: 70,
        wSS: 70,
    },
    setSocialSecurityInputs: (inputs) => set({ socialSecurityInputs: inputs })
}));

export default useStore;
