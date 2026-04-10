import assert from 'node:assert/strict';
import { computeDistrictMetrics, selectDistrictForComparison } from './districtComparison.js';

const pune = { state: 'MAHARASHTRA', district: 'PUNE', districtCode: 521 };
const nagpur = { state: 'MAHARASHTRA', district: 'NAGPUR', districtCode: 505 };
const jaipur = { state: 'RAJASTHAN', district: 'JAIPUR', districtCode: 100 };

const nextEmpty = selectDistrictForComparison({ districtA: null, districtB: null }, pune);
assert.deepEqual(nextEmpty, { districtA: pune, districtB: null });

const nextSecond = selectDistrictForComparison(nextEmpty, nagpur);
assert.deepEqual(nextSecond, { districtA: pune, districtB: nagpur });

const nextRotated = selectDistrictForComparison(nextSecond, jaipur);
assert.deepEqual(nextRotated, { districtA: nagpur, districtB: jaipur });

const metrics = computeDistrictMetrics({
    district: pune,
    records: [
        { ...pune, origin: 'BIHAR', count: 120, male: 70, female: 50, rural: 40, urban: 80 },
        { ...pune, origin: 'UTTAR PRADESH', count: 80, male: 30, female: 50, rural: 20, urban: 60 },
        { ...nagpur, origin: 'BIHAR', count: 999, male: 1, female: 1, rural: 1, urban: 1 },
    ],
    threshold: 100,
    durationRows: [
        { ...pune, Persons_LT1yr: 10, Persons_1to4yr: 20, Persons_5to9yr: 30, Persons_10to19yr: 40, Persons_20plusyr: 50, Persons_DurNS: 5 },
    ],
    reasonRows: [
        { ...pune, Persons_Work: 100, Persons_Business: 20, Persons_Education: 10, Persons_Marriage: 5, Persons_MoveAfterBirth: 4, Persons_MoveWithHH: 3, Persons_Other: 2 },
    ],
    educationRows: [
        { ...pune, Literate_Persons: 90, Illiterate_Persons: 10, BelowMatric_Persons: 20, MatricToGrad_Persons: 30, TechDiploma_Persons: 5, Graduate_Persons: 25, TechDegree_Persons: 10 },
    ],
    activityRows: [
        { ...pune, MainWorkers_Persons: 45, MarginalWorkers_Persons: 15, NonWorkers_Persons: 40 },
    ],
    maritalRows: [
        { ...pune, NeverMarried_Persons: 20, CurrMarried_Persons: 70, Widowed_Persons: 5, Separated_Persons: 3, Divorced_Persons: 2 },
    ],
});

assert.equal(metrics.totalFlow, 120);
assert.equal(metrics.totalMale, 70);
assert.equal(metrics.totalFemale, 50);
assert.deepEqual(metrics.counterpartRows, [{ name: 'BIHAR', value: 120 }]);
assert.deepEqual(metrics.durationTotals, [10, 20, 30, 40, 50, 5]);
assert.deepEqual(metrics.reasonValues, [100, 20, 10, 5, 4, 3, 2]);
assert.deepEqual(metrics.educationValues, [20, 30, 5, 25, 10]);
assert.deepEqual(metrics.activityValues, [45, 15, 40]);
assert.deepEqual(metrics.maritalValues, [20, 70, 5, 3, 2]);
assert.equal(metrics.literacyRate, 90);

console.log('districtComparison tests passed');
