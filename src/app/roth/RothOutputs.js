"use client"
import React, {useEffect, useState} from 'react';
import Decimal from 'decimal.js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUser } from "@/app/hooks/useUser";
import BarChart from "@/app/components/BarChart";

const RothOutputs = ({ inputs, inputs1, editableFields, setEditableFields, staticFields, setInputs1 }) => {
    const supabaseClient = useSupabaseClient();
    const { user } = useUser();

    const [savedVersions, setSavedVersions] = useState([]);
    const [versionName, setVersionName] = useState("");
    const [versionData, setVersionData] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState("");

    const findRmdByYear = (details, year) => {
        const detail = details.find((detail) => detail.year === year);
        return detail ? detail.rmd : "0.00";
    };
    const findSsBenefitsByYear = (year) => {
        const benefitsForYear = tableData.find(data => data.year === year);
        return {
            spouse1Benefit: benefitsForYear ? benefitsForYear.husbandBenefit : "0.00",
            spouse2Benefit: benefitsForYear ? benefitsForYear.wifeBenefit : "0.00",
        };
    };


    //RMD calculations
    const { age1, age2, ira1, ira2, roi } = inputs1;

    const [iraDetails, setIraDetails] = useState({
        spouse1: [],
        spouse2: []
    });

    const [totals, setTotals] = useState({
        totalRMDsHusband: new Decimal(0),
        totalRMDsWife: new Decimal(0),
        inheritedIRAHusband: new Decimal(0),
        inheritedIRAWife: new Decimal(0)
    });

    const rmdDistributionTable = {
        75: 24.6,
        76: 23.7,
        77: 22.9,
        78: 22.0,
        79: 21.1,
        80: 20.2,
        81: 19.4,
        82: 18.5,
        83: 17.7,
        84: 16.8,
        85: 16.0,
        86: 15.2,
        87: 14.4,
        88: 13.7,
        89: 12.9,
        90: 12.2,
        91: 11.5,
        92: 10.8,
        93: 10.1,
        94: 9.5,
        95: 8.9,
        96: 8.4,
        97: 7.8,
        98: 7.3,
        99: 6.8,
        100: 6.4,
        101: 6.0,
        102: 5.6,
        103: 5.2,
        104: 4.9,
        105: 4.6,
        106: 4.3,
        107: 4.1,
        108: 3.9,
        109: 3.7,
        110: 3.5,
        111: 3.4,
        112: 3.3,
        113: 3.1,
        114: 3.0,
        115: 2.9,
        116: 2.8,
        117: 2.7,
        118: 2.5,
        119: 2.3,
        120: 2.0
    };

    const calculateRMD = (age, startingValue) => {
        if (age < 75) return new Decimal(0); // RMD is 0 for ages below 75
        const distributionPeriod = rmdDistributionTable[age];
        return distributionPeriod ? new Decimal(startingValue).dividedBy(distributionPeriod) : new Decimal(0);
    };
    useEffect(() => {
        console.log('Updated editableFields in RothOutputs:', editableFields);
    }, [editableFields]);

    useEffect(() => {
        const calculateIraDetails = (startingAge, lifeExpectancy, currentIraValue) => {
            let year = new Date().getFullYear();
            let age = startingAge;
            let startingValue = new Decimal(currentIraValue);
            const details = [];

            while (age <= lifeExpectancy) {
                const investmentReturns = startingValue.times(Decimal(roi).dividedBy(100));
                const rmd = calculateRMD(age, startingValue);
                const endingValue = startingValue.plus(investmentReturns).minus(rmd); // SUBTRACT ROTH LATER

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

        const spouse1Details = calculateIraDetails(age1, inputs.hLE, ira1);
        const spouse2Details = calculateIraDetails(age2, inputs.wLE, ira2);

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


    }, [age1, age2, ira1, ira2, roi]);
// RMD CALCULATIONS END ----------------

// ROTH CALCULATIONS START -----------
    const currentYear = new Date().getFullYear();
    const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
    [editableFields, setEditableFields] = useState(() => {
        const fields = {};
        for (let year = currentYear; year <= currentYear + (maxLifeExpectancy - Math.min(age1, age2)); year++) {
            fields[year] = {
                rothSpouse1: 0,
                rothSpouse2: 0,
                salary1: 0,
                salary2: 0,
                rentalIncome: 0,
                interest: 0,
                capitalGains: 0,
                pension: 0
            };
        }
        return fields;
    });

    staticFields = {};
    for (let year = currentYear, ageSpouse1 = age1, ageSpouse2 = age2;
         year <= currentYear + maxLifeExpectancy - Math.min(age1, age2);
         year++, ageSpouse1++, ageSpouse2++) {
        staticFields[year] = {
            year: year,
            ageSpouse1: ageSpouse1,
            ageSpouse2: ageSpouse2,
        };
    }

    // save, load, and delete functions
    const saveVersion = async (versionName) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        // Clone editableFields and set roth1 and roth2 to zero for all years
        const editableFieldsWithZeroRoth = JSON.parse(JSON.stringify(editableFields));
        Object.keys(editableFieldsWithZeroRoth).forEach(year => {
            editableFieldsWithZeroRoth[year].rothSpouse1 = 0;
            editableFieldsWithZeroRoth[year].rothSpouse2 = 0;
        });

        const calculateTotalIncomeForYearWithZeroRoth = (year, editableFieldsWithZeroRoth) => {
            const ssBenefits = findSsBenefitsByYear(parseInt(year));
            const editableFieldsForYear = editableFieldsWithZeroRoth[year];
            const rmdSpouse1 = findRmdByYear(iraDetails.spouse1, parseInt(year));
            const rmdSpouse2 = findRmdByYear(iraDetails.spouse2, parseInt(year));

            const totalIncome = new Decimal(editableFieldsForYear.rothSpouse1)
                .plus(editableFieldsForYear.rothSpouse2)
                .plus(editableFieldsForYear.salary1)
                .plus(editableFieldsForYear.salary2)
                .plus(editableFieldsForYear.rentalIncome)
                .plus(editableFieldsForYear.interest)
                .plus(editableFieldsForYear.capitalGains)
                .plus(editableFieldsForYear.pension)
                .plus(rmdSpouse1)
                .plus(rmdSpouse2)
                .plus(ssBenefits.spouse1Benefit)
                .plus(ssBenefits.spouse2Benefit);

            return totalIncome.toFixed(2);
        };

        // Calculate lifetime0 and beneficiary0 with roth1 and roth2 set to zero
        const taxableIncomesWithZeroRoth = calculateTaxableIncomes(
            staticFields,
            iraDetails,
            findSsBenefitsByYear,
            (year) => calculateTotalIncomeForYearWithZeroRoth(year, editableFieldsWithZeroRoth),
            calculateStandardDeductionForYear
        );

        const totalLifetimeTaxPaidWithZeroRoth = Object.keys(taxableIncomesWithZeroRoth).reduce(
            (total, year) => total.plus(new Decimal(taxableIncomesWithZeroRoth[year])),
            new Decimal(0)
        );

        const beneficiaryTaxPaidWithZeroRoth = totalInheritedIRA.times(beneficiaryTaxRate).toFixed(2);

        const dataToSave = [];
        for (let year in editableFields) {
            dataToSave.push({
                user_id: user.id,
                version_name: versionName,
                year: year,
                rental_income: editableFields[year].rentalIncome,
                capital_gains: editableFields[year].capitalGains,
                pension: editableFields[year].pension,
                roth_1: editableFields[year].rothSpouse1,
                roth_2: editableFields[year].rothSpouse2,
                salary1: editableFields[year].salary1,
                salary2: editableFields[year].salary2,
                interest: editableFields[year].interest,
                age1: inputs1.age1,
                age2: inputs1.age2,
                ira1: inputs1.ira1,
                ira2: inputs1.ira2,
                roi: inputs1.roi,
                inflation: inputs1.inflation,
                lifetime_tax: totalLifetimeTaxPaid.toFixed(2),
                beneficiary_tax: beneficiaryTaxPaid,
                lifetime0: totalLifetimeTaxPaidWithZeroRoth.toFixed(2),
                beneficiary0: beneficiaryTaxPaidWithZeroRoth
            });
        }

        const { error } = await supabaseClient.from('roth').insert(dataToSave);
        if (error) {
            console.error('Error saving data to Supabase:', error);
        } else {
            console.log('Data successfully saved to Supabase.');
            await fetchSavedVersions();  // Ensure versions are fetched after saving
        }
    };
    const fetchSavedVersions = async () => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roth')
            .select('version_name, lifetime_tax, beneficiary_tax, lifetime0, beneficiary0')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching versions from Supabase:', error);
        } else {
            const uniqueVersions = Array.from(new Set(data.map(item => item.version_name)))
                .map(name => {
                    const version = data.find(item => item.version_name === name);
                    console.log('Version:', version); // Log version data to check values
                    return {
                        name: name,
                        lifetime_tax: version.lifetime_tax,
                        beneficiary_tax: version.beneficiary_tax,
                        lifetime0: version.lifetime0,
                        beneficiary0: version.beneficiary0
                    };
                });
            setSavedVersions(uniqueVersions.map(version => ({ name: version.name })));
            setVersionData(uniqueVersions);
            if (uniqueVersions.length > 0) {
                setSelectedVersion(uniqueVersions[0].name);
            }

        }
    };



    const loadVersion = async (version) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roth')
            .select('*')
            .eq('user_id', user.id)
            .eq('version_name', version.name);

        if (error) {
            console.error('Error loading version from Supabase:', error);
        } else {
            const loadedEditableFields = {};
            let loadedInputs1 = {
                age1: 0,
                age2: 0,
                ira1: 0,
                ira2: 0,
                roi: 0,
                inflation: 0
            };

            data.forEach(item => {
                loadedEditableFields[item.year] = {
                    rothSpouse1: item.roth_1,
                    rothSpouse2: item.roth_2,
                    salary1: item.salary1,
                    salary2: item.salary2,
                    rentalIncome: item.rental_income,
                    interest: item.interest,
                    capitalGains: item.capital_gains,
                    pension: item.pension
                };

                // Load RMD inputs (assuming they are the same for each year)
                loadedInputs1 = {
                    age1: item.age1,
                    age2: item.age2,
                    ira1: item.ira1,
                    ira2: item.ira2,
                    roi: item.roi,
                    inflation: item.inflation
                };
            });

            setEditableFields(loadedEditableFields);
            setInputs1(loadedInputs1);
        }
    };

    const deleteVersion = async (versionName) => {
        if (!user) {
            console.error('User is not logged in');
            return;
        }

        const { error } = await supabaseClient
            .from('roth')
            .delete()
            .eq('user_id', user.id)
            .eq('version_name', versionName);

        if (error) {
            console.error('Error deleting version from Supabase:', error);
        } else {
            console.log('Version successfully deleted from Supabase.');
            fetchSavedVersions(); // Refresh the list of saved versions
        }
    };

    useEffect(() => {
        if (user) {
            fetchSavedVersions();
        }
    }, [user]);

    // Handler for changes in the editable fields
    const handleEditableFieldChange = (year, field, value) => {
        console.log(`Updating ${field} for year ${year} to value:`, value);
        if (value.trim() === '' || isNaN(value)) {
            alert('Please enter a valid number');
            return;
        }

        setEditableFields(prev => {
            const updatedFields = {
                ...prev,
                [year]: {
                    ...prev[year],
                    [field]: parseFloat(value)
                }
            };
            console.log('Updated editableFields:', updatedFields);  // Log updated state
            return updatedFields;
        });
    };


    const renderEditableFieldInput = (year, field) => {
        return (
            <input
                type="text"
                className="w-full p-1 border border-gray-300 rounded text-right"
                name={`${year}-${field}`}
                value={editableFields[year][field]}
                onChange={(e) => handleEditableFieldChange(year, field, e.target.value)}
            />
        );
    };

//social security -----------------
    //REFERENCE TABLE
    const [tableData1, setTableData1] = useState([]);
    const [benefitsBasedOnAge, setBenefitsBasedOnAge] = useState({
        husbandYearly: 0,
        wifeYearly: 0,
    });
    useEffect(() => {
        const calculateTableData1 = () => {
            const newData = [];

            for (let age = 62; age <= 70; age++) {
                const percentageOfPIA = getPercentageOfPIAForAge(age);
                const spousePIA = getSpouse(age);
                const hBenefit = new Decimal(inputs.hPIA).times(percentageOfPIA).dividedBy(100);
                const wBenefit = new Decimal(inputs.wPIA).times(spousePIA).dividedBy(100);
                const husbandMonthly = Decimal.max(hBenefit, wBenefit);
                const hBenefit1 = new Decimal(inputs.hPIA).times(spousePIA).dividedBy(100);
                const wBenefit1 = new Decimal(inputs.wPIA).times(percentageOfPIA).dividedBy(100);
                const wifeMonthly = Decimal.max(hBenefit1, wBenefit1);

                newData.push({
                    age,
                    percentageOfPIA,
                    spousePIA,
                    husbandMonthly: husbandMonthly.toNumber(),
                    wifeMonthly: wifeMonthly.toNumber(),
                    husbandYearly: husbandMonthly.times(12).toNumber(),
                    wifeYearly: wifeMonthly.times(12).toNumber(),
                });
            }

            setTableData1(newData);
        };

        calculateTableData1();
    }, [inputs]);

    const getSpouse = (age) => {
        const referenceTable = {
            62: new Decimal(32.5),
            63: new Decimal(35.0),
            64: new Decimal(37.5),
            65: new Decimal(41.7),
            66: new Decimal(45.8),
            // Assuming default as 50 for ages not listed in the table
        };
        return referenceTable[age] || new Decimal(50.0);
    };

    const getPercentageOfPIAForAge = (age) => {
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
    useEffect(() => {
        const husbandStartAgeData = tableData1.find(data => data.age === inputs.hSS);
        const wifeStartAgeData = tableData1.find(data => data.age === inputs.wSS);
        setBenefitsBasedOnAge({
            husbandYearly: husbandStartAgeData ? husbandStartAgeData.husbandYearly : 0,
            wifeYearly: wifeStartAgeData ? wifeStartAgeData.wifeYearly : 0,
        });
    }, [tableData1, inputs.hSS, inputs.wSS]);

////REFERENCE TABLE END

/////social security benefits
    const currentYear1 = new Date().getFullYear();
    const [tableData, setTableData] = useState([]);
    const calculateBenefitForYear = ({
                                         age,
                                         spouseAge,
                                         lifeExpectancy,
                                         spouseLifeExpectancy,
                                         startAge,
                                         spouseStartAge,
                                         benefitAgeOfWithdraw,
                                         spouseBenefitAgeOfWithdraw,
                                         lastYearBenefit,
                                         lastYearSpouseBenefit
                                     }) => {
        const ageDecimal = new Decimal(age);
        const spouseAgeDecimal = new Decimal(spouseAge);
        const lifeExpectancyDecimal = new Decimal(lifeExpectancy);
        const spouseLifeExpectancyDecimal = new Decimal(spouseLifeExpectancy);

        if (ageDecimal > (lifeExpectancyDecimal)) {
            return new Decimal(0);
        }
        if (spouseAgeDecimal > (spouseLifeExpectancyDecimal) && lastYearSpouseBenefit > (lastYearBenefit)) {
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

    useEffect(() => {
        const maxLifeExpectancy = Math.max(inputs.hLE, inputs.wLE);
        const yearsToCover = maxLifeExpectancy - Math.min(inputs1.age1, inputs1.age2) + 1;

        let lastYearHusbandBenefit = 0;
        let lastYearWifeBenefit = 0;

        const newTableData = Array.from({ length: yearsToCover }, (_, i) => {
            const year = currentYear1 + i;
            const husbandAge = inputs1.age1 + i;
            const wifeAge = inputs1.age2 + i;

            // Calculate husband and wife benefits for the year
            const husbandBenefit = calculateBenefitForYear({
                age: husbandAge,
                spouseAge: wifeAge,
                lifeExpectancy: inputs.hLE,
                spouseLifeExpectancy: inputs.wLE,
                startAge: inputs.hSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.husbandYearly,
                lastYearBenefit: lastYearHusbandBenefit,
                lastYearSpouseBenefit: lastYearWifeBenefit
            });

            const wifeBenefit = calculateBenefitForYear({
                age: wifeAge,
                spouseAge: husbandAge,
                lifeExpectancy: inputs.wLE,
                spouseLifeExpectancy: inputs.hLE,
                startAge: inputs.wSS,
                benefitAgeOfWithdraw: benefitsBasedOnAge.wifeYearly,
                lastYearBenefit: lastYearWifeBenefit,
                lastYearSpouseBenefit: lastYearHusbandBenefit
            });
            lastYearHusbandBenefit = husbandBenefit;
            lastYearWifeBenefit = wifeBenefit;

            return { year, husbandAge, wifeAge, husbandBenefit: husbandBenefit.toFixed(2), wifeBenefit: wifeBenefit.toFixed(2) };
        });

        setTableData(newTableData);

    }, [inputs, currentYear1, benefitsBasedOnAge.husbandYearly, benefitsBasedOnAge.wifeYearly]);

    const startingStandardDeduction = 29200;

    const [annualInflationRate, setAnnualInflationRate] = useState(inputs1.inflation/100);

    const calculateStandardDeductionForYear = (year) => {
        const yearsDifference = year - currentYear; // Assuming 'currentYear' is the base year
        return startingStandardDeduction * Math.pow(1 + annualInflationRate, yearsDifference);
    };

    const calculateTotalIncomeForYear = (year) => {
        const ssBenefits = findSsBenefitsByYear(parseInt(year));
        const editableFieldsForYear = editableFields[year];
        const rmdSpouse1 = findRmdByYear(iraDetails.spouse1, parseInt(year));
        const rmdSpouse2 = findRmdByYear(iraDetails.spouse2, parseInt(year));

        const totalIncome = new Decimal(editableFieldsForYear.rothSpouse1)
            .plus(editableFieldsForYear.rothSpouse2)
            .plus(editableFieldsForYear.salary1)
            .plus(editableFieldsForYear.salary2)
            .plus(editableFieldsForYear.rentalIncome)
            .plus(editableFieldsForYear.interest)
            .plus(editableFieldsForYear.capitalGains)
            .plus(editableFieldsForYear.pension)
            .plus(rmdSpouse1)
            .plus(rmdSpouse2)
            .plus(ssBenefits.spouse1Benefit)
            .plus(ssBenefits.spouse2Benefit);

        return totalIncome.toFixed(2);
    };
    //ordinary income tax calc -------
    const calculateTaxesForBrackets = (taxableIncome) => {
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
    const calculateTaxableIncomes = (staticFields, iraDetails, findSsBenefitsByYear, calculateTotalIncomeForYear, calculateStandardDeductionForYear) => {
        let taxableIncomes = {};

        Object.keys(staticFields).forEach(year => {
            const totalIncomeForYear = calculateTotalIncomeForYear(year);
            const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));

            taxableIncomes[year] = totalIncomeForYear - standardDeductionForYear;
        });

        return taxableIncomes;
    };

    const taxableIncomes = calculateTaxableIncomes(
        staticFields,
        iraDetails,
        findSsBenefitsByYear,
        calculateTotalIncomeForYear,
        calculateStandardDeductionForYear
    );

    const bracketTitles = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];
    const years = Object.keys(taxableIncomes).map(year => parseInt(year, 10));
    const startYear = currentYear

    //// so that roth automatically shows up in rmd
    const [rothConversions, setRothConversions] = useState({
        spouse1: {},
        spouse2: {},
    });

    const [beneficiaryTaxRate, setBeneficiaryTaxRate] = useState(0.24); // Default to 24%

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs1(prevInputs => ({
            ...prevInputs,
            [name]: parseFloat(value),
        }));
    };

    const handleTaxRateChange = (e) => {
        const newRate = parseFloat(e.target.value) / 100; // Convert percentage to a decimal for calculation
        setBeneficiaryTaxRate(newRate);
    };

    const totalInheritedIRA = totals.inheritedIRAHusband.plus(totals.inheritedIRAWife);
    const beneficiaryTaxPaid = totalInheritedIRA.times(beneficiaryTaxRate).toFixed(2);

    const calculateXNPV = (rate, cashFlows, dates) => {
        let xnpv = 0.0;
        for (let i = 0; i < cashFlows.length; i++) {
            const xnpvTerm = (dates[i] - dates[0]) / (365 * 24 * 3600 * 1000);
            xnpv += cashFlows[i] / Math.pow(1 + rate, xnpvTerm);
        }
        return xnpv;
    };

// Compute Total Cash for Lifetime Tax Paid
    const totalLifetimeTaxPaid = Object.keys(taxableIncomes).reduce(
        (total, year) => total.plus(new Decimal(taxableIncomes[year])),
        new Decimal(0)
    );

    const [npvLifetimeTax, setNpvLifetimeTax] = useState(0);
    const [npvBeneficiaryTax, setNpvBeneficiaryTax] = useState(0);


    useEffect(() => {
        // For Lifetime Tax Paid NPV
        const cashFlowsLifetimeTax = Object.keys(taxableIncomes).map(year => new Decimal(taxableIncomes[year]));
        const datesLifetimeTax = Object.keys(taxableIncomes).map(year => new Date(parseInt(year), 0, 1));
        const npvLifetimeTaxValue = calculateXNPV(inputs.roi / 100, cashFlowsLifetimeTax, datesLifetimeTax);

        setNpvLifetimeTax(npvLifetimeTaxValue);

        // For Beneficiary Tax Paid NPV
        const futureYear = currentYear + Math.max(inputs.hLE - age1, inputs.wLE - age2);
        const cashFlowBeneficiaryTax = new Decimal(beneficiaryTaxPaid);
        const dateBeneficiaryTax = new Date(futureYear, 0, 1);
        const npvBeneficiaryTaxValue = calculateXNPV(inputs.roi / 100, [cashFlowBeneficiaryTax], [dateBeneficiaryTax]);
        setNpvBeneficiaryTax(npvBeneficiaryTaxValue);

    }, [inputs.roi, taxableIncomes, beneficiaryTaxPaid, inputs1, currentYear, age1, inputs.hLE, age2, inputs.wLE]);


    const chartData = {
        labels: ["No Conversion", ...Array.from(new Set(versionData.map(item => item.name)))], // Unique version names with "No Conversion" as the first label
        datasets: [
            {
                label: 'Lifetime Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[0].lifetime0) : 0, ...versionData.map(item => item.lifetime_tax)],
                backgroundColor: 'rgba(173, 216, 230, 0.6)', // Light blue
                borderColor: 'black',
                borderWidth: 1,
            },
            {
                label: 'Beneficiary Tax Paid',
                data: [versionData.length > 0 ? parseFloat(versionData[0].beneficiary0) : 0, ...versionData.map(item => item.beneficiary_tax)],
                backgroundColor: 'rgba(255, 182, 193, 0.6)', // Light pink
                borderColor: 'black',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `$${context.raw}`;
                    },
                },
            },
            legend: {
                position: 'top', // Positioning the legend at the top
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: {
                    drawOnChartArea: false,
                },
            },
            y: {
                stacked: true,
                ticks: {
                    callback: function (value) {
                        return `$${value}`;
                    },
                },
            },
        },
    };

return (
        <div>
            <div className="flex-col">
                <div className="bg-[#f8f5f0] p-4 rounded w-full h-auto">
                    <BarChart chartData={chartData} chartOptions={chartOptions} />
                </div>
                <div className="mt-4 text-left flex items-center space-x-2">
                    <div className="bg-[#f8f5f0] rounded p-2 flex-grow">
                        <select
                            className="w-full bg-[#f8f5f0] border-none"
                            value={selectedVersion}
                            onChange={(e) => {
                                setSelectedVersion(e.target.value);
                                const version = savedVersions.find(v => v.name === e.target.value);
                                if (version) {
                                    loadVersion(version);
                                }
                            }}
                        >
                            {savedVersions.map((version, index) => (
                                <option key={index} value={version.name}>
                                    <span className="font-bold">Selected: {version.name}</span>
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Enter version name"
                            className="border rounded p-2"
                            onChange={(e) => setVersionName(e.target.value)}
                        />
                        <button
                            className="bg-blue-500 text-white rounded p-2"
                            onClick={() => saveVersion(versionName)}
                        >
                            Save
                        </button>
                        <button
                            className="bg-red-500 text-white rounded p-2"
                            onClick={() => deleteVersion(selectedVersion)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                <div className="flex mt-4 w-full space-x-4">
                    <div className="bg-[#f8f5f0] p-6 rounded flex-1">
                        <h3 className="text-center font-bold mb-4">{selectedVersion}: Total Taxes Saved</h3>
                        <div className="text-4xl font-bold text-center">
                            ${parseFloat(versionData.find(v => v.name === selectedVersion)?.lifetime_tax || 0) + parseFloat(versionData.find(v => v.name === selectedVersion)?.beneficiary_tax || 0)}
                        </div>
                    </div>
                    <div className="bg-[#f8f5f0] p-6 rounded flex-1">
                        <h3 className="text-center font-bold mb-4">Other Inputs</h3>
                        <div className="space-y-2 text-sm"> {/* Add text-sm for smaller font size */}
                            <div className="flex items-center justify-between">
                                <label>Beneficiary Tax Rate:</label>
                                <input
                                    type="number"
                                    value={beneficiaryTaxRate * 100}
                                    onChange={handleTaxRateChange}
                                    className="border rounded p-1 w-20"
                                />%
                            </div>
                            <div className="flex items-center justify-between">
                                <label>Your IRA:</label>
                                <input
                                    type="number"
                                    name="ira2"
                                    value={inputs1.ira2}
                                    onChange={handleInputChange}
                                    className="border rounded p-1 w-20"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label>Your Spouse’s IRA:</label>
                                <input
                                    type="number"
                                    name="ira1"
                                    value={inputs1.ira1}
                                    onChange={handleInputChange}
                                    className="border rounded p-1 w-20"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label>Investment Return:</label>
                                <input
                                    type="number"
                                    name="roi"
                                    value={inputs1.roi}
                                    onChange={handleInputChange}
                                    className="border rounded p-1 w-20"
                                />%
                            </div>
                            <div className="flex items-center justify-between">
                                <label>Inflation Rate:</label>
                                <input
                                    type="number"
                                    name="inflation"
                                    value={inputs1.inflation}
                                    onChange={handleInputChange}
                                    className="border rounded p-1 w-20"
                                />%
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="bg-[#f8f5f0] p-4 rounded overflow-auto max-h-96" style={{ maxHeight: '600px' }}>
                <h2 className="text-xl font-semibold mb-3">Financial Plan Details</h2>
                <table className="min-w-full table-fixed border-collapse border border-slate-400">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Year</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 1</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 2</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 1</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 2</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 1</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 2</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Rental Income</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Interest / Dividend</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Capital Gains</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Pension</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 1</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 2</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">SS Spouse 1</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">SS Spouse 2</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Total Ordinary Income</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Standard Deductions</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Taxable Ordinary Income</th>
                    </tr>
                    </thead>
                    <tbody>
                    {Object.keys(staticFields).map((year, index) => {
                        const ssBenefits = findSsBenefitsByYear(parseInt(year));
                        const totalIncomeForYear = calculateTotalIncomeForYear(year);
                        const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
                        const taxableIncomeForYear = totalIncomeForYear - standardDeductionForYear;
                        return (
                            <tr key={year}>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse1}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse2}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse1')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse2')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary1')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary2')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rentalIncome')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'interest')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'capitalGains')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'pension')}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse1, parseInt(year))}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse2, parseInt(year))}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse1Benefit}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse2Benefit}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">${totalIncomeForYear}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">-${standardDeductionForYear.toFixed(2)}</td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">${taxableIncomeForYear.toFixed(2)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>


            {/*
                <div className="totals-display"
                     style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px', marginBottom: '20px'}}>
                    <div className="total-rmds" style={{textAlign: 'center', padding: '10px'}}>
                        <h2 style={{marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: 'bold'}}>Total
                            RMDs</h2>
                        <div
                            style={{marginBottom: '10px'}}>Husband: <strong>${totals.totalRMDsHusband.toFixed(2)}</strong>
                        </div>
                        <div style={{marginBottom: '10px'}}>Wife: <strong>${totals.totalRMDsWife.toFixed(2)}</strong>
                        </div>
                        <div>Total: <strong>${totals.totalRMDsHusband.plus(totals.totalRMDsWife).toFixed(2)}</strong>
                        </div>
                    </div>
                    <div className="total-taxes-paid" style={{textAlign: 'center', padding: '10px'}}>
                        <h2 style={{marginBottom: '15px', color: '#333', fontSize: '18px', fontWeight: 'bold'}}>Total
                            Taxes Paid </h2>
                        <h1>Total Cash</h1>
                        <div>Lifetime Tax Paid: <strong>${totalLifetimeTaxPaid.toFixed(2)}</strong></div>
                        <div>Beneficiary Tax Paid: <strong>${beneficiaryTaxPaid}</strong></div>
                        <h1>Net Present Value</h1>
                        <div>Lifetime Tax NPV: <strong>${npvLifetimeTax.toFixed(2)}</strong></div>
                        <div>Beneficiary Tax NPV: <strong>${npvBeneficiaryTax.toFixed(2)}</strong></div>

                    </div>

                    <div className="inherited-iras" style={{textAlign: 'center', padding: '10px', width: '30%'}}>
                        <h2 style={{
                            marginBottom: '15px',
                            color: '#333',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>Inherited Pre-Tax IRA</h2>
                        <div
                            style={{marginBottom: '10px'}}>Husband: <strong>${totals.inheritedIRAHusband.toFixed(2)}</strong>
                        </div>
                        <div style={{marginBottom: '10px'}}>Wife: <strong>${totals.inheritedIRAWife.toFixed(2)}</strong>
                        </div>
                        <div>Total: <strong>${totalInheritedIRA.toFixed(2)}</strong></div>
                        <div>
                            <label htmlFor="beneficiaryTaxRate"
                                   style={{fontWeight: 'normal', color: '#333', fontSize: '16px', marginRight: '10px'}}>Beneficiary
                                Tax Rate:</label>
                            <input
                                id="beneficiaryTaxRate"
                                type="number"
                                value={beneficiaryTaxRate * 100}
                                onChange={handleTaxRateChange}
                                style={{
                                    flex: '1',
                                    textAlign: 'right',
                                    padding: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px'
                                }}
                            />%
                        </div>
                        <div style={{marginTop: '10px'}}>
                            Beneficiary Tax Paid: <strong>${beneficiaryTaxPaid}</strong>
                        </div>
                    </div>
                </div>*/}

            {/*
            <h2 className="text-xl font-semibold mb-3">Financial Plan Details</h2>
            <table className="min-w-full table-fixed border-collapse border border-slate-400">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Year</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Age Spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Roth Conversion 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Salary 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Rental Income</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Interest / Dividend</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Capital Gains</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Pension</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">RMD Spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">ss spouse 1</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">ss spouse 2</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">total ordinary income</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">standard deductions</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">taxable ordinary income</th>


                </tr>
                </thead>

                <tbody>
                {Object.keys(staticFields).map((year, index) => {
                    const ssBenefits = findSsBenefitsByYear(parseInt(year));
                    const totalIncomeForYear = calculateTotalIncomeForYear(year);
                    const standardDeductionForYear = calculateStandardDeductionForYear(parseInt(year));
                    const taxableIncomeForYear = totalIncomeForYear - standardDeductionForYear;
                    return (
                        <tr key={year}>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse1}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{staticFields[year].ageSpouse2}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse1')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rothSpouse2')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary1')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'salary2')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'rentalIncome')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'interest')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'capitalGains')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{renderEditableFieldInput(year, 'pension')}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse1, parseInt(year))}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{findRmdByYear(iraDetails.spouse2, parseInt(year))}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse1Benefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{ssBenefits.spouse2Benefit}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${totalIncomeForYear}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">-${standardDeductionForYear.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">${taxableIncomeForYear.toFixed(2)}</td>


                        </tr>
                    )
                })}

                </tbody>
            </table>
*/}
            {/*ORDINARY INCOME TAX BRACKET*/}
            {/* Ordinary Income Tax Brackets Table
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Year</th>
                    {bracketTitles.map((title) => (
                        <th key={title} className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">{title}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">Total Income Tax</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(taxableIncomes).map((year) => {
                    const taxesForBrackets = calculateTaxesForBrackets(taxableIncomes[year]);
                    // Calculate the total tax by summing up all values in the taxesForBrackets object
                    const totalTax = Object.values(taxesForBrackets).reduce((sum, tax) => sum + tax, 0);

                    return (
                        <tr key={year}>
                            <td className="px-3 py-2 text-center whitespace-nowrap">{year}</td>
                            {bracketTitles.map((title) => (
                                <td key={`${year}-${title}`} className="px-3 py-2 text-center whitespace-nowrap">
                                    ${taxesForBrackets[title].toFixed(2)}
                                </td>
                            ))}
                            <td className="px-3 py-2 text-center whitespace-nowrap">${totalTax.toFixed(2)}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>*/}
        </div>
    );

};


export default RothOutputs;
