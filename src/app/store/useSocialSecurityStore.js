import create from 'zustand';
import { persist } from 'zustand/middleware';

const useSocialSecurityStore = create(persist((set) => ({
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
    inflation: 2.0,
  },
  setSocialSecurityInputs: (inputs) => set({ socialSecurityInputs: inputs }),

  socialSecurityBenefits: {},
  setSocialSecurityBenefits: (benefits) => set({ socialSecurityBenefits: benefits }),
}), {
  name: "socialSecurityStore",
  getStorage: () => localStorage
}));

export default useSocialSecurityStore;
