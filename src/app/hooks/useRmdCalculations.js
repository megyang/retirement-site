import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import {calculateRMD} from "@/app/utils/calculations";

const useRmdCalculations = (age1, age2, ira1, ira2, roi, hLE, wLE) => {
    const [iraDetails, setIraDetails] = useState({ spouse1: [], spouse2: [] });
    const [totals, setTotals] = useState({
        totalRMDsHusband: new Decimal(0),
        totalRMDsWife: new Decimal(0),
        inheritedIRAHusband: new Decimal(0),
        inheritedIRAWife: new Decimal(0)
    });

    useEffect(() => {
        const calculateIraDetails = (startingAge, lifeExpectancy, currentIraValue) => {
            let year = new Date().getFullYear();
            let age = startingAge;
            let startingValue = new Decimal(currentIraValue);
            const details = [];

            while (age <= lifeExpectancy) {
                const investmentReturns = startingValue.times(Decimal(roi).dividedBy(100));
                const rmd = calculateRMD(age, startingValue);
                const endingValue = startingValue.plus(investmentReturns).minus(rmd);

                details.push({
                    year,
                    age,
                    startingValue: startingValue.toFixed(2),
                    investmentReturns: investmentReturns.toFixed(2),
                    rmd: rmd.toFixed(2),
                    endingValue: endingValue.toFixed(2)
                });
                startingValue = endingValue;
                age++;
                year++;
            }

            return details;
        };

        const spouse1Details = calculateIraDetails(age1, hLE, ira1);
        const spouse2Details = calculateIraDetails(age2, wLE, ira2);

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
    }, [age1, age2, ira1, ira2, roi, hLE, wLE]);

    return { iraDetails, totals };
};

export default useRmdCalculations;
