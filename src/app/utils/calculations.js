import Decimal from "decimal.js";
import rmdDistributionTable from "@/app/utils/rmdDistributionTable";

export const formatNumberWithCommas = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === '') return '';
    const isNegative = value < 0;
    const absValue = Math.abs(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return isNegative ? `(${absValue})` : absValue;
};

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
export const findRmdByYear = (details, year) => {
    const detail = details.find((detail) => detail.year === year);
    return detail ? detail.rmd : "0.00";
};
export const findSsBenefitsByYear = (socialSecurityBenefits, year) => {
    const benefitsForYear = Array.isArray(socialSecurityBenefits)
        ? socialSecurityBenefits.find(data => data.year === year)
        : null;
    return {
        spouse1Benefit: benefitsForYear ? benefitsForYear.husbandBenefit : "0.00",
        spouse2Benefit: benefitsForYear ? benefitsForYear.wifeBenefit : "0.00",
    };
};

export const calculateTaxesForBrackets = (taxableIncome) => {
    const brackets = [
        { threshold: 23200, rate: 0.10 },
        { threshold: 94300, rate: 0.12 },
        { threshold: 201050, rate: 0.22 },
        { threshold: 383900, rate: 0.24 },
        { threshold: 487450, rate: 0.32 },
        { threshold: 731200, rate: 0.35 },
        { threshold: Infinity, rate: 0.37 }
    ];

    let taxesForBrackets = {
        '10%': 0,
        '12%': 0,
        '22%': 0,
        '24%': 0,
        '32%': 0,
        '35%': 0,
        '37%': 0
    };

    let remainingIncome = taxableIncome;
    brackets.forEach((bracket, index) => {
        if (index === 0) {
            const amountInBracket = Math.min(remainingIncome, bracket.threshold);
            taxesForBrackets['10%'] = amountInBracket * bracket.rate;
            remainingIncome -= amountInBracket;
        } else {
            const prevThreshold = brackets[index - 1].threshold;
            const amountInBracket = Math.min(remainingIncome, bracket.threshold - prevThreshold);
            taxesForBrackets[`${bracket.rate * 100}%`] = amountInBracket * bracket.rate;
            remainingIncome -= amountInBracket;
        }
    });

    return taxesForBrackets;
};
