import Decimal from "decimal.js";
import rmdDistributionTable from "@/app/utils/rmdDistributionTable";

export const getPercentageOfPIAForAge = (age) => {
    const referenceTable = {
        62: new Decimal(70.0),
        63: new Decimal(75.0),
        64: new Decimal(80.0),
        65: new Decimal(86.7),
        66: new Decimal(93.3),
        67: new Decimal(100.0),
        68: new Decimal(108.0),
        69: new Decimal(116.0),
        70: new Decimal(124.0),
    };
    return referenceTable[age];
};

export const getSpouse = (age) => {
    const referenceTable = {
        62: new Decimal(32.5),
        63: new Decimal(35.0),
        64: new Decimal(37.5),
        65: new Decimal(41.7),
        66: new Decimal(45.8),
    };
    return referenceTable[age] || new Decimal(50.0);
};

export const calculateBenefitForYear = ({
                                            age,
                                            spouseAge,
                                            lifeExpectancy,
                                            spouseLifeExpectancy,
                                            startAge,
                                            benefitAgeOfWithdraw,
                                            lastYearBenefit,
                                            lastYearSpouseBenefit,
                                        }) => {
    const ageDecimal = new Decimal(age);
    const spouseAgeDecimal = new Decimal(spouseAge);
    const lifeExpectancyDecimal = new Decimal(lifeExpectancy);
    const spouseLifeExpectancyDecimal = new Decimal(spouseLifeExpectancy);

    if (ageDecimal > lifeExpectancyDecimal) {
        return new Decimal(0);
    }
    if (spouseAgeDecimal > spouseLifeExpectancyDecimal && lastYearSpouseBenefit > lastYearBenefit) {
        return lastYearSpouseBenefit;
    }
    if (ageDecimal.lessThan(startAge)) {
        return new Decimal(0);
    }
    if (ageDecimal.equals(startAge)) {
        return benefitAgeOfWithdraw;
    }
    return lastYearBenefit;
};

export const calculateXNPV = (rate, cashFlows, dates) => {
    let xnpv = 0.0;
    for (let i = 0; i < cashFlows.length; i++) {
        const xnpvTerm = (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
        xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
    }
    return xnpv;
};

export const calculateRMD = (age, startingValue) => {
    if (age < 75) return new Decimal(0); // RMD is 0 for ages below 75
    const distributionPeriod = rmdDistributionTable[age];
    return distributionPeriod ? new Decimal(startingValue).dividedBy(distributionPeriod) : new Decimal(0);
};
