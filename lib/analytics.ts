import { EmployeeRecord } from './types';

export interface CategoryMetric {
  name: string;
  total: number;
  departed: number;
  retained: number;
  rate: number;
}

// Helper: Normalize group strings (e.g., replace ASCII hyphen with Unicode en-dash)
export function normalizeGroupStr(str: string): string {
  return (str || '').replace(/-/g, '–').trim();
}

// 1. Department Breakdown (Headcount & Attrition Rate)
export function getDepartmentAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const depts = ['Sales', 'Research & Development', 'Human Resources'];
  const map: { [dept: string]: { total: number; departed: number } } = {};
  depts.forEach((d) => (map[d] = { total: 0, departed: 0 }));

  for (const r of records) {
    const dept = r.Department || 'Unknown';
    if (!map[dept]) map[dept] = { total: 0, departed: 0 };
    map[dept].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[dept].departed++;
    }
  }

  return Object.keys(map).map((dept) => {
    const total = map[dept].total;
    const departed = map[dept].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: dept, total, departed, retained, rate };
  });
}

// 2. Job Role Breakdown (Sorted descending by attrition rate)
export function getJobRoleAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const map: { [role: string]: { total: number; departed: number } } = {};

  for (const r of records) {
    const role = r.JobRole || 'Unknown';
    if (!map[role]) map[role] = { total: 0, departed: 0 };
    map[role].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[role].departed++;
    }
  }

  return Object.keys(map)
    .map((role) => {
      const total = map[role].total;
      const departed = map[role].departed;
      const retained = total - departed;
      const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
      return { name: role, total, departed, retained, rate };
    })
    .sort((a, b) => b.rate - a.rate);
}

// 3. Overtime Breakdown
export function getOvertimeAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const categories = ['No', 'Yes'];
  const map: { [ot: string]: { total: number; departed: number } } = {
    No: { total: 0, departed: 0 },
    Yes: { total: 0, departed: 0 },
  };

  for (const r of records) {
    const isOT = String(r.OverTime).toLowerCase() === 'yes';
    const key = isOT ? 'Yes' : 'No';
    map[key].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[key].departed++;
    }
  }

  return categories.map((k) => {
    const total = map[k].total;
    const departed = map[k].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: k === 'Yes' ? 'Overtime: Yes' : 'Overtime: No', total, departed, retained, rate };
  });
}

// 4. Service Tenure Breakdown
export function getTenureAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const groups = ['0–2 years', '3–5 years', '6–10 years', '11+ years'];
  const map: { [k: string]: { total: number; departed: number } } = {};
  groups.forEach((g) => (map[g] = { total: 0, departed: 0 }));

  for (const r of records) {
    let g = normalizeGroupStr(r.TenureGroup);
    if (!map[g]) {
      const yrs = Number(r.YearsAtCompany) || 0;
      g = yrs <= 2 ? '0–2 years' : yrs <= 5 ? '3–5 years' : yrs <= 10 ? '6–10 years' : '11+ years';
    }
    map[g].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[g].departed++;
    }
  }

  return groups.map((g) => {
    const total = map[g].total;
    const departed = map[g].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: g, total, departed, retained, rate };
  });
}

// 5. Commute Distance Breakdown (DistanceGroup)
export function getCommuteAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const groups = ['0–5 km', '6–10 km', '11–20 km', '21+ km'];
  const map: { [k: string]: { total: number; departed: number } } = {};
  groups.forEach((g) => (map[g] = { total: 0, departed: 0 }));

  for (const r of records) {
    let g = normalizeGroupStr(r.DistanceGroup || r.DistanceBand || '');
    if (!map[g]) {
      const d = Number(r.DistanceFromHome) || 0;
      g = d <= 5 ? '0–5 km' : d <= 10 ? '6–10 km' : d <= 20 ? '11–20 km' : '21+ km';
    }
    map[g].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[g].departed++;
    }
  }

  return groups.map((g) => {
    const total = map[g].total;
    const departed = map[g].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: g, total, departed, retained, rate };
  });
}

// 6. Job Satisfaction Breakdown (1 - Low to 4 - Very High)
export function getSatisfactionAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const levels = [
    { lvl: 1, label: 'Level 1 (Low)' },
    { lvl: 2, label: 'Level 2 (Medium)' },
    { lvl: 3, label: 'Level 3 (High)' },
    { lvl: 4, label: 'Level 4 (Very High)' },
  ];
  const map: { [k: string]: { total: number; departed: number } } = {};
  levels.forEach((l) => (map[l.label] = { total: 0, departed: 0 }));

  for (const r of records) {
    const match = levels.find((l) => l.lvl === Number(r.JobSatisfaction)) || levels[0];
    map[match.label].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[match.label].departed++;
    }
  }

  return levels.map((l) => {
    const total = map[l.label].total;
    const departed = map[l.label].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: l.label, total, departed, retained, rate };
  });
}

// 7. Work-Life Balance Breakdown (1 - Bad to 4 - Best)
export function getWorkLifeAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const levels = [
    { lvl: 1, label: 'Level 1 (Bad)' },
    { lvl: 2, label: 'Level 2 (Good)' },
    { lvl: 3, label: 'Level 3 (Better)' },
    { lvl: 4, label: 'Level 4 (Best)' },
  ];
  const map: { [k: string]: { total: number; departed: number } } = {};
  levels.forEach((l) => (map[l.label] = { total: 0, departed: 0 }));

  for (const r of records) {
    const match = levels.find((l) => l.lvl === Number(r.WorkLifeBalance)) || levels[0];
    map[match.label].total++;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) {
      map[match.label].departed++;
    }
  }

  return levels.map((l) => {
    const total = map[l.label].total;
    const departed = map[l.label].departed;
    const retained = total - departed;
    const rate = total > 0 ? Number(((departed / total) * 100).toFixed(2)) : 0;
    return { name: l.label, total, departed, retained, rate };
  });
}

// 8. 4x4 Heatmap: Job Satisfaction × Work-Life Balance Attrition Matrix (%)
export function getSatisfactionWorkLifeHeatmap(records: EmployeeRecord[]) {
  const jsLevels = ['1 (Low)', '2 (Medium)', '3 (High)', '4 (Very High)'];
  const wlbLevels = ['1 (Bad)', '2 (Good)', '3 (Better)', '4 (Best)'];

  const matrix: number[][] = [];
  const textMatrix: string[][] = [];

  for (let js = 1; js <= 4; js++) {
    const rowRates: number[] = [];
    const rowTexts: string[] = [];
    for (let wlb = 1; wlb <= 4; wlb++) {
      const subset = records.filter(
        (r) => Number(r.JobSatisfaction) === js && Number(r.WorkLifeBalance) === wlb
      );
      const total = subset.length;
      const departed = subset.filter(
        (r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes'
      ).length;
      const rate = total > 0 ? Number(((departed / total) * 100).toFixed(1)) : 0;
      rowRates.push(rate);
      rowTexts.push(`${rate.toFixed(1)}%<br>(${departed}/${total})`);
    }
    matrix.push(rowRates);
    textMatrix.push(rowTexts);
  }

  return {
    yLabels: jsLevels,
    xLabels: wlbLevels,
    zValues: matrix,
    textValues: textMatrix,
  };
}

// 9. Overtime × Work-Life Balance Heatmap Matrix (%)
export function getOvertimeWorkLifeHeatmap(records: EmployeeRecord[]) {
  const otLevels = ['No Overtime', 'Works Overtime'];
  const wlbLevels = ['1 (Bad)', '2 (Good)', '3 (Better)', '4 (Best)'];

  const matrix: number[][] = [];
  const textMatrix: string[][] = [];

  otLevels.forEach((ot) => {
    const isOT = ot === 'Works Overtime';
    const rowRates: number[] = [];
    const rowTexts: string[] = [];

    for (let wlb = 1; wlb <= 4; wlb++) {
      const subset = records.filter(
        (r) =>
          (String(r.OverTime).toLowerCase() === 'yes') === isOT &&
          Number(r.WorkLifeBalance) === wlb
      );
      const total = subset.length;
      const departed = subset.filter(
        (r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes'
      ).length;
      const rate = total > 0 ? Number(((departed / total) * 100).toFixed(1)) : 0;
      rowRates.push(rate);
      rowTexts.push(`${rate.toFixed(1)}%<br>(${departed}/${total})`);
    }
    matrix.push(rowRates);
    textMatrix.push(rowTexts);
  });

  return {
    yLabels: otLevels,
    xLabels: wlbLevels,
    zValues: matrix,
    textValues: textMatrix,
  };
}

// 10. Mean Monthly Income by Attrition Status
export function getIncomeByAttrition(records: EmployeeRecord[]) {
  const retained: number[] = [];
  const departed: number[] = [];

  for (const r of records) {
    const inc = Number(r.MonthlyIncome) || 0;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) departed.push(inc);
    else retained.push(inc);
  }

  const retMean = retained.length > 0 ? retained.reduce((a, b) => a + b, 0) / retained.length : 0;
  const depMean = departed.length > 0 ? departed.reduce((a, b) => a + b, 0) / departed.length : 0;
  const totalMean = records.length > 0 ? (retMean * retained.length + depMean * departed.length) / records.length : 0;

  return {
    retainedCount: retained.length,
    departedCount: departed.length,
    retainedMean: retMean,
    departedMean: depMean,
    totalMean,
    incomeGap: depMean - retMean,
    retainedIncomes: retained,
    departedIncomes: departed,
  };
}

// 11. Mean Monthly Income by Job Role
export function getIncomeByJobRole(records: EmployeeRecord[]) {
  const map: { [role: string]: { total: number; sum: number } } = {};

  for (const r of records) {
    const role = r.JobRole || 'Unknown';
    if (!map[role]) map[role] = { total: 0, sum: 0 };
    map[role].total++;
    map[role].sum += Number(r.MonthlyIncome) || 0;
  }

  return Object.keys(map)
    .map((role) => ({
      name: role,
      meanIncome: Math.round(map[role].sum / (map[role].total || 1)),
      count: map[role].total,
    }))
    .sort((a, b) => b.meanIncome - a.meanIncome);
}

// 12. Income Distribution Bins
export function getIncomeDistributionBins(records: EmployeeRecord[]) {
  const bins = [
    { label: '< $2.5k', min: 0, max: 2500, retained: 0, departed: 0 },
    { label: '$2.5k–$5k', min: 2500, max: 5000, retained: 0, departed: 0 },
    { label: '$5k–$7.5k', min: 5000, max: 7500, retained: 0, departed: 0 },
    { label: '$7.5k–$10k', min: 7500, max: 10000, retained: 0, departed: 0 },
    { label: '$10k–$15k', min: 10000, max: 15000, retained: 0, departed: 0 },
    { label: '$15k+', min: 15000, max: Infinity, retained: 0, departed: 0 },
  ];

  for (const r of records) {
    const inc = Number(r.MonthlyIncome) || 0;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    for (const b of bins) {
      if (inc >= b.min && inc < b.max) {
        if (isDep) b.departed++;
        else b.retained++;
        break;
      }
    }
  }

  return bins;
}

// 13. Income vs YearsAtCompany Scatter Points
export function getIncomeScatterPoints(records: EmployeeRecord[], maxPoints = 800) {
  const step = Math.max(1, Math.floor(records.length / maxPoints));
  const points: { x: number; y: number; attrition: string; role: string }[] = [];

  for (let i = 0; i < records.length; i += step) {
    const r = records[i];
    points.push({
      x: Number(r.YearsAtCompany) || 0,
      y: Number(r.MonthlyIncome) || 0,
      attrition: r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes' ? 'Departed' : 'Retained',
      role: r.JobRole || 'Unknown',
    });
  }

  return points;
}

// 14. Commute Distance Box Plot & Binned Distribution
export function getCommuteDetails(records: EmployeeRecord[]) {
  const retainedDist: number[] = [];
  const departedDist: number[] = [];

  for (const r of records) {
    const dist = Number(r.DistanceFromHome) || 0;
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';
    if (isDep) departedDist.push(dist);
    else retainedDist.push(dist);
  }

  return {
    retainedDist,
    departedDist,
    allDistances: records.map((r) => Number(r.DistanceFromHome) || 0),
  };
}

// 15. Demographic & Workforce Distributions
export function getWorkforceDemographics(records: EmployeeRecord[]) {
  const genderMap: { [g: string]: { total: number; departed: number } } = {};
  const travelMap: { [t: string]: { total: number; departed: number } } = {};
  const eduFieldMap: { [e: string]: { total: number; departed: number } } = {};

  for (const r of records) {
    const isDep = r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes';

    // Gender
    const g = r.Gender || 'Other';
    if (!genderMap[g]) genderMap[g] = { total: 0, departed: 0 };
    genderMap[g].total++;
    if (isDep) genderMap[g].departed++;

    // BusinessTravel
    const t = r.BusinessTravel || 'Other';
    if (!travelMap[t]) travelMap[t] = { total: 0, departed: 0 };
    travelMap[t].total++;
    if (isDep) travelMap[t].departed++;

    // EducationField
    const e = r.EducationField || 'Other';
    if (!eduFieldMap[e]) eduFieldMap[e] = { total: 0, departed: 0 };
    eduFieldMap[e].total++;
    if (isDep) eduFieldMap[e].departed++;
  }

  return {
    gender: Object.keys(genderMap).map((k) => ({
      name: k,
      total: genderMap[k].total,
      departed: genderMap[k].departed,
      retained: genderMap[k].total - genderMap[k].departed,
      rate: Number(((genderMap[k].departed / (genderMap[k].total || 1)) * 100).toFixed(2)),
    })),
    travel: Object.keys(travelMap).map((k) => ({
      name: k.replace(/_/g, ' '),
      total: travelMap[k].total,
      departed: travelMap[k].departed,
      retained: travelMap[k].total - travelMap[k].departed,
      rate: Number(((travelMap[k].departed / (travelMap[k].total || 1)) * 100).toFixed(2)),
    })),
    educationField: Object.keys(eduFieldMap).map((k) => ({
      name: k,
      total: eduFieldMap[k].total,
      departed: eduFieldMap[k].departed,
      retained: eduFieldMap[k].total - eduFieldMap[k].departed,
      rate: Number(((eduFieldMap[k].departed / (eduFieldMap[k].total || 1)) * 100).toFixed(2)),
    })),
  };
}
