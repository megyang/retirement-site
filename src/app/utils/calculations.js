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
        65: new Decimal(86.666666666666666666667),
        66: new Decimal(93.333333333333333333333),
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
                                            inflationRate,
                                        }) => {
    const ageDecimal = new Decimal(age);
    const spouseAgeDecimal = new Decimal(spouseAge);
    const lifeExpectancyDecimal = new Decimal(lifeExpectancy);
    const spouseLifeExpectancyDecimal = new Decimal(spouseLifeExpectancy);

    if (ageDecimal > lifeExpectancyDecimal) {
        return new Decimal(0);
    }
    if (spouseAgeDecimal > spouseLifeExpectancyDecimal && lastYearSpouseBenefit > lastYearBenefit) {
        return calculateInflationAdjustedBenefit(lastYearSpouseBenefit, startAge, ageDecimal, inflationRate);
    }
    if (ageDecimal.lessThan(startAge)) {
        return new Decimal(0);
    }
    if (ageDecimal.equals(startAge)) {
        return calculateInflationAdjustedBenefit(benefitAgeOfWithdraw, startAge, ageDecimal, inflationRate);
    }
    return calculateInflationAdjustedBenefit(lastYearBenefit, startAge, ageDecimal, inflationRate);
};

export const calculateInflationAdjustedBenefit = (benefit, startAge, currentAge, inflationRate) => {
    const validBenefit = benefit !== null ? benefit : 0;
    const validStartAge = startAge !== null ? startAge : 0;
    const validCurrentAge = currentAge !== null ? currentAge : 0;
    const validInflationRate = inflationRate !== null ? inflationRate : 0.02;

    if (validCurrentAge < validStartAge) {
        return new Decimal(0);
    }

    const yearsSinceStart = validCurrentAge - validStartAge;
    console.log("yearsSinceStart", yearsSinceStart)
    console.log("validBenefit", validBenefit)
    const inflationFactor = new Decimal(1).plus(new Decimal(validInflationRate));
    console.log("inflationFactor", inflationFactor)

    return new Decimal(validBenefit).times(inflationFactor);
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
    if (age < 75) return new Decimal(0);
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

export const calculateTaxableIncomes = (staticFields, iraDetails, findSsBenefitsByYear, calculateTotalIncomeForYear, calculateStandardDeductionForYear) => {
    let taxableIncomes = {};

    Object.keys(staticFields).forEach(year => {
        const totalIncomeForYear = calculateTotalIncomeForYear(year);
        const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));

        taxableIncomes[year] = totalIncomeForYear - standardDeductionForYear;
    });

    return taxableIncomes;
};


export const calculateTaxesForBrackets = (taxableIncome, inflationRate, currentYear, taxYear, married, filing) => {
    let brackets;

    if (married && filing) {
        // Married and filing jointly
        brackets = [
            { threshold: 23200, rate: 0.10 },
            { threshold: 94300, rate: 0.12 },
            { threshold: 201050, rate: 0.22 },
            { threshold: 383900, rate: 0.24 },
            { threshold: 487450, rate: 0.32 },
            { threshold: 731200, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ];
    } else if (!married) {
        // Not married
        brackets = [
            { threshold: 11600, rate: 0.10 },
            { threshold: 47150, rate: 0.12 },
            { threshold: 100525, rate: 0.22 },
            { threshold: 191950, rate: 0.24 },
            { threshold: 243725, rate: 0.32 },
            { threshold: 609350, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ];
    } else if (married && !filing) {
        // Married and filing separately
        brackets = [
            { threshold: 11600, rate: 0.10 },
            { threshold: 47150, rate: 0.12 },
            { threshold: 100525, rate: 0.22 },
            { threshold: 191950, rate: 0.24 },
            { threshold: 243725, rate: 0.32 },
            { threshold: 365600, rate: 0.35 },
            { threshold: Infinity, rate: 0.37 }
        ];
    }

    let taxesForBrackets = {
        '10%': 0,
        '12%': 0,
        '22%': 0,
        '24%': 0,
        '32%': 0,
        '35%': 0,
        '37%': 0
    };

    let remainingIncome = Math.max(0, taxableIncome); // Ensure taxable income is not negative
    brackets.forEach((bracket, index) => {
        // Adjust the threshold for inflation
        const adjustedThreshold = bracket.threshold * Math.pow(1 + inflationRate, taxYear - currentYear);

        if (index === 0) {
            const amountInBracket = Math.min(remainingIncome, adjustedThreshold);
            taxesForBrackets['10%'] = Math.max(0, amountInBracket * bracket.rate);
            remainingIncome -= amountInBracket;
        } else {
            const prevThreshold = brackets[index - 1].threshold * Math.pow(1 + inflationRate, taxYear - currentYear);
            const amountInBracket = Math.min(remainingIncome, adjustedThreshold - prevThreshold);
            taxesForBrackets[`${bracket.rate * 100}%`] = Math.max(0, amountInBracket * bracket.rate);
            remainingIncome -= amountInBracket;
        }
    });

    return taxesForBrackets;
};


export function calculateAge(month, year) {
    const birthDate = new Date(year, month - 1);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}
