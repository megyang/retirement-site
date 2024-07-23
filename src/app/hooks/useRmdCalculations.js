import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { calculateRMD } from "@/app/utils/calculations";

const useRmdCalculations = (age1, age2, ira1, ira2, roi, hLE, wLE, editableFields) => {
    const [iraDetails, setIraDetails] = useState({ spouse1: [], spouse2: [] });
    const [totals, setTotals] = useState({
        totalRMDsHusband: new Decimal(0),
        totalRMDsWife: new Decimal(0),
        inheritedIRAHusband: new Decimal(0),
        inheritedIRAWife: new Decimal(0)
    });

    useEffect(() => {
        const calculateIraDetails = (startingAge, lifeExpectancy, currentIraValue, roi, rothConversions) => {
            let year = new Date().getFullYear();
            let age = startingAge;
            let startingValue = new Decimal(currentIraValue);
            const details = [];

            while (age <= lifeExpectancy) {
                const investmentReturns = startingValue.times(Decimal(roi));
                const rmd = calculateRMD(age, startingValue);
                const rothConversion = new Decimal(rothConversions[year] || 0);
                const endingValue = startingValue.plus(investmentReturns).minus(rmd).minus(rothConversion);

                details.push({
                    year,
                    age,
                    startingValue: startingValue.toFixed(2),
                    investmentReturns: investmentReturns.toFixed(2),
                    rothConversion: rothConversion.toFixed(2),
                    rmd: rmd.toFixed(2),
                    endingValue: endingValue.toFixed(2)
                });
                startingValue = endingValue;
                age++;
                year++;
            }

            return details;
        };

        const spouse1RothConversions = Object.keys(editableFields).reduce((acc, year) => {
            acc[year] = editableFields[year].rothSpouse1;
            return acc;
        }, {});

        const spouse2RothConversions = Object.keys(editableFields).reduce((acc, year) => {
            acc[year] = editableFields[year].rothSpouse2;
            return acc;
        }, {});

        const spouse1Details = calculateIraDetails(age1, hLE, ira1, roi, spouse1RothConversions);
        const spouse2Details = calculateIraDetails(age2, wLE, ira2, roi, spouse2RothConversions);

        setIraDetails({
            spouse1: spouse1Details,
            spouse2: spouse2Details
        });

        const totalRMDsHusband = spouse1Details.reduce((total, detail) => total.plus(new Decimal(detail.rmd)), new Decimal(0));
        const totalRMDsWife = spouse2Details.reduce((total, detail) => total.plus(new Decimal(detail.rmd)), new Decimal(0));

        const inheritedIRAHusband = new Decimal(spouse1Details[spouse1Details.length - 1]?.endingValue || 0);
        const inheritedIRAWife = new Decimal(spouse2Details[spouse2Details.length - 1]?.endingValue || 0);

        setTotals({
            totalRMDsHusband,
            totalRMDsWife,
            inheritedIRAHusband,
            inheritedIRAWife
        });
    }, [age1, age2, ira1, ira2, roi, hLE, wLE, editableFields]);

    return { iraDetails, totals };
};

export default useRmdCalculations;
