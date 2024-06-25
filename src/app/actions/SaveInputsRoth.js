import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";

const SaveInputsRoth = forwardRef(({ editableFields, staticFields }, ref) => {
    const [versionName, setVersionName] = useState('');
    const [saving, setSaving] = useState(false);
    const supabase = useSupabaseClient();
    const { user } = useUser();

    useImperativeHandle(ref, () => ({
        saveVersion: (editableFields, staticFields) => saveVersion(editableFields, staticFields)
    }));

    const saveVersion = async (editableFields, staticFields) => {
        console.log('saveVersion called with:', editableFields, staticFields);
        setSaving(true);
        const userId = user.id;

        try {
            const financialPlanDetails = Object.keys(editableFields).map(year => {
                const fields = editableFields[year];
                const staticField = staticFields[year];

                return {
                    year: parseInt(year),
                    user_id: userId,
                    age_spouse_1: staticField.ageSpouse1,
                    age_spouse_2: staticField.ageSpouse2,
                    roth_1: parseFloat(fields.rothSpouse1 || 0),
                    roth_2: parseFloat(fields.rothSpouse2 || 0),
                    salary1: parseFloat(fields.salary1 || 0),
                    salary2: parseFloat(fields.salary2 || 0),
                    rental_income: parseFloat(fields.rentalIncome || 0),
                    interest: parseFloat(fields.interest || 0),
                    capital_gains: parseFloat(fields.capitalGains || 0),
                    pension: parseFloat(fields.pension || 0),
                    rmd_spouse_1: parseFloat(staticField.rmdSpouse1 || 0),
                    rmd_spouse_2: parseFloat(staticField.rmdSpouse2 || 0),
                    ss_spouse_1: parseFloat(staticField.ssSpouse1 || 0),
                    ss_spouse_2: parseFloat(staticField.ssSpouse2 || 0),
                    total_ordinary: parseFloat(staticField.totalOrdinary || 0),
                    standard_deductions: parseFloat(staticField.standardDeductions || 0),
                    taxable_ordinary_income: parseFloat(staticField.taxableOrdinaryIncome || 0),
                    version_name: versionName
                };
            });

            console.log('Financial Plan Details:', financialPlanDetails);

            if (financialPlanDetails.length === 0) {
                console.error('No data to save');
                alert('No data to save.');
                return;
            }

            const { error: detailsError } = await supabase
                .from('roth')
                .insert(financialPlanDetails);

            if (detailsError) throw detailsError;

            alert('Version saved successfully!');
        } catch (error) {
            console.error('Error saving version:', error.message);
            alert('Failed to save version.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Enter version name"
                value={versionName}
                onChange={e => setVersionName(e.target.value)}
                disabled={saving}
            />
            <button onClick={() => saveVersion(editableFields, staticFields)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Version'}
            </button>
        </div>
    );
});

// Add a display name to the component
SaveInputsRoth.displayName = 'SaveInputsRoth';

export default SaveInputsRoth;
