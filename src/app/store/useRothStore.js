import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useRothStore = create(persist(
    (set) => ({
        inputs1: {
            ira1: 800000,
            ira2: 1000000,
            roi: 3.0,
            inflation: 2.0,
            beneficiary_tax_rate: 0.24,
        },
        editableFields: {},
        staticFields: {},
        setInputs1: (newInputs) => {
            set((state) => ({ inputs1: { ...state.inputs1, ...newInputs } }));
            console.log('setInputs1: ', newInputs);
        },
        setEditableFields: (newEditableFields) => {
            set((state) => ({ editableFields: { ...state.editableFields, ...newEditableFields } }));
            console.log('setEditableFields: ', newEditableFields);
        },
        setStaticFields: (newStaticFields) => {
            set((state) => ({ staticFields: { ...state.staticFields, ...newStaticFields } }));
            console.log('setStaticFields: ', newStaticFields);
        },
        loadScenario: (scenarioNumber) => {
            const scenarioData = {
                inputs1: {
                    ira1: 800000,
                    ira2: 1000000,
                    roi: 3.0,
                    inflation: 2.0,
                    beneficiary_tax_rate: 0.24,
                },
                editableFields: {},
                staticFields: {},
            };

            set({
                inputs1: scenarioData.inputs1,
                editableFields: scenarioData.editableFields,
                staticFields: scenarioData.staticFields,
            });

            console.log(`Scenario ${scenarioNumber} loaded:`, scenarioData);
        },
    }),
    {
        name: 'roth-scenario-1',
        getStorage: () => localStorage,
        partialize: (state) => {
            const partialState = { inputs1: state.inputs1, editableFields: state.editableFields, staticFields: state.staticFields };
            console.log('Saving to localStorage: ', partialState);
            return partialState;
        },
    }
));
