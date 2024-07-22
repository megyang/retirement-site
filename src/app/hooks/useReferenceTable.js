import { useState, useEffect } from "react";
import Decimal from "decimal.js";
import { getPercentageOfPIAForAge, getSpouse } from "../utils/calculations";

const useReferenceTable = (inputs) => {
    const [refTable, setRefTable] = useState([]);
    const [benefitsBasedOnAge, setBenefitsBasedOnAge] = useState({
        husbandYearly: 0,
        wifeYearly: 0,
    });

    useEffect(() => {
        const calculateTableData = () => {
            const newData = [];

            const hPIA = inputs.hPIA != null ? inputs.hPIA : 0;
            const wPIA = inputs.wPIA != null ? inputs.wPIA : 0;

            for (let age = 62; age <= 70; age++) {
                const percentageOfPIA = getPercentageOfPIAForAge(age);
                const spousePIA = getSpouse(age);
                const hBenefit = new Decimal(hPIA)
                    .times(percentageOfPIA)
                    .dividedBy(100);
                const wBenefit = new Decimal(wPIA)
                    .times(spousePIA)
                    .dividedBy(100);
                const husbandMonthly = Decimal.max(hBenefit, wBenefit);
                const hBenefit1 = new Decimal(hPIA)
                    .times(spousePIA)
                    .dividedBy(100);
                const wBenefit1 = new Decimal(wPIA)
                    .times(percentageOfPIA)
                    .dividedBy(100);
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

            setRefTable(newData);
        };

        calculateTableData();
    }, [inputs]);

    useEffect(() => {
        const husbandStartAgeData = refTable.find((data) => data.age === inputs.hSS);
        const wifeStartAgeData = refTable.find((data) => data.age === inputs.wSS);

        setBenefitsBasedOnAge({
            husbandYearly: husbandStartAgeData ? husbandStartAgeData.husbandYearly : 0,
            wifeYearly: wifeStartAgeData ? wifeStartAgeData.wifeYearly : 0,
        });
    }, [refTable, inputs.hSS, inputs.wSS]);

    return { refTable, benefitsBasedOnAge };
};

export default useReferenceTable;
