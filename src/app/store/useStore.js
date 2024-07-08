import create from 'zustand';

const useStore = create(set => ({
  socialSecurityInputs: {
    husbandAge: 62,
    wifeAge: 60,
    hLE: 90,
    wLE: 95,
    hSS: 70,
    wSS: 70,
    hPIA: 2500,
    wPIA: 2000,
    roi: 2,
  },
  setSocialSecurityInputs: (inputs) => set({ socialSecurityInputs: inputs }),
  
  socialSecurityBenefits: {},
  setSocialSecurityBenefits: (benefits) => set({ socialSecurityBenefits: benefits }),
}));

export default useStore;
