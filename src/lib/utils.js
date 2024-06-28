import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

import Decimal from "decimal.js";

export const calculateXNPV = (rate, cashFlows, dates) => {
  let xnpv = 0.0;
  for (let i = 0; i < cashFlows.length; i++) {
    const xnpvTerm = (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
    xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
  }
  return xnpv;
};

export const calculateBenefitForYear = ({
                                          age,
                                          spouseAge,
                                          lifeExpectancy,
                                          spouseLifeExpectancy,
                                          startAge,
                                          spouseStartAge,
                                          benefitAgeOfWithdraw,
                                          spouseBenefitAgeOfWithdraw,
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
  if (
      spouseAgeDecimal > spouseLifeExpectancyDecimal &&
      lastYearSpouseBenefit > lastYearBenefit
  ) {
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

