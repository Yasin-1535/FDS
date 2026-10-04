import { EmployeeRecord } from './types';

export interface CategoryMetric {
  name: string;
  total: number;
  departed: number;
  rate: number;
}

export function getDepartmentAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const map: { [dept: string]: { total: number; departed: number } } = {};
  for (const r of records) {
    const dept = r.Department || 'Unknown';
    if (!map[dept]) map[dept] = { total: 0, departed: 0 };
    map[dept].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[dept].departed++;
    }
  }

  return Object.keys(map).map((dept) => ({
    name: dept,
    total: map[dept].total,
    departed: map[dept].departed,
    rate: Number(((map[dept].departed / (map[dept].total || 1)) * 100).toFixed(2)),
  }));
}

export function getJobRoleAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const map: { [role: string]: { total: number; departed: number } } = {};
  for (const r of records) {
    const role = r.JobRole || 'Unknown';
    if (!map[role]) map[role] = { total: 0, departed: 0 };
    map[role].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[role].departed++;
    }
  }

  return Object.keys(map)
    .map((role) => ({
      name: role,
      total: map[role].total,
      departed: map[role].departed,
      rate: Number(((map[role].departed / (map[role].total || 1)) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.rate - a.rate);
}

export function getOvertimeAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const map: { [ot: string]: { total: number; departed: number } } = {
    'No Overtime': { total: 0, departed: 0 },
    'Works Overtime': { total: 0, departed: 0 },
  };

  for (const r of records) {
    const isOT = String(r.OverTime).toLowerCase() === 'yes';
    const key = isOT ? 'Works Overtime' : 'No Overtime';
    map[key].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[key].departed++;
    }
  }

  return Object.keys(map).map((k) => ({
    name: k,
    total: map[k].total,
    departed: map[k].departed,
    rate: Number(((map[k].departed / (map[k].total || 1)) * 100).toFixed(2)),
  }));
}

export function getTenureAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const groups = ['0-2 yrs', '3-5 yrs', '6-10 yrs', '10+ yrs'];
  const map: { [k: string]: { total: number; departed: number } } = {};
  groups.forEach((g) => (map[g] = { total: 0, departed: 0 }));

  for (const r of records) {
    const g = r.TenureGroup || (r.YearsAtCompany <= 2 ? '0-2 yrs' : r.YearsAtCompany <= 5 ? '3-5 yrs' : r.YearsAtCompany <= 10 ? '6-10 yrs' : '10+ yrs');
    if (!map[g]) map[g] = { total: 0, departed: 0 };
    map[g].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[g].departed++;
    }
  }

  return groups.map((g) => ({
    name: g,
    total: map[g].total,
    departed: map[g].departed,
    rate: Number(((map[g].departed / (map[g].total || 1)) * 100).toFixed(2)),
  }));
}

export function getCommuteAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const bands = ['0-5 km', '6-10 km', '11-20 km', '21+ km'];
  const map: { [k: string]: { total: number; departed: number } } = {};
  bands.forEach((b) => (map[b] = { total: 0, departed: 0 }));

  for (const r of records) {
    const b = r.DistanceBand || (r.DistanceFromHome <= 5 ? '0-5 km' : r.DistanceFromHome <= 10 ? '6-10 km' : r.DistanceFromHome <= 20 ? '11-20 km' : '21+ km');
    if (!map[b]) map[b] = { total: 0, departed: 0 };
    map[b].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[b].departed++;
    }
  }

  return bands.map((b) => ({
    name: b,
    total: map[b].total,
    departed: map[b].departed,
    rate: Number(((map[b].departed / (map[b].total || 1)) * 100).toFixed(2)),
  }));
}

export function getSatisfactionAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const levels = [
    { lvl: 1, label: '1: Low' },
    { lvl: 2, label: '2: Medium' },
    { lvl: 3, label: '3: High' },
    { lvl: 4, label: '4: Very High' },
  ];
  const map: { [k: string]: { total: number; departed: number } } = {};
  levels.forEach((l) => (map[l.label] = { total: 0, departed: 0 }));

  for (const r of records) {
    const match = levels.find((l) => l.lvl === r.JobSatisfaction) || levels[0];
    map[match.label].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[match.label].departed++;
    }
  }

  return levels.map((l) => ({
    name: l.label,
    total: map[l.label].total,
    departed: map[l.label].departed,
    rate: Number(((map[l.label].departed / (map[l.label].total || 1)) * 100).toFixed(2)),
  }));
}

export function getWorkLifeAttrition(records: EmployeeRecord[]): CategoryMetric[] {
  const levels = [
    { lvl: 1, label: '1: Bad' },
    { lvl: 2, label: '2: Good' },
    { lvl: 3, label: '3: Better' },
    { lvl: 4, label: '4: Best' },
  ];
  const map: { [k: string]: { total: number; departed: number } } = {};
  levels.forEach((l) => (map[l.label] = { total: 0, departed: 0 }));

  for (const r of records) {
    const match = levels.find((l) => l.lvl === r.WorkLifeBalance) || levels[0];
    map[match.label].total++;
    if (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') {
      map[match.label].departed++;
    }
  }

  return levels.map((l) => ({
    name: l.label,
    total: map[l.label].total,
    departed: map[l.label].departed,
    rate: Number(((map[l.label].departed / (map[l.label].total || 1)) * 100).toFixed(2)),
  }));
}

export function getIncomeDistributionBins(records: EmployeeRecord[]) {
  const bins = [
    { label: '< $2.5k', min: 0, max: 2500, retained: 0, departed: 0 },
    { label: '$2.5k-$5k', min: 2500, max: 5000, retained: 0, departed: 0 },
    { label: '$5k-$7.5k', min: 5000, max: 7500, retained: 0, departed: 0 },
    { label: '$7.5k-$10k', min: 7500, max: 10000, retained: 0, departed: 0 },
    { label: '$10k-$15k', min: 10000, max: 15000, retained: 0, departed: 0 },
    { label: '$15k+', min: 15000, max: Infinity, retained: 0, departed: 0 },
  ];

  for (const r of records) {
    const inc = r.MonthlyIncome || 0;
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

export function getIncomeScatterPoints(records: EmployeeRecord[], maxPoints = 800) {
  const step = Math.max(1, Math.floor(records.length / maxPoints));
  const points: { x: number; y: number; attrition: string; role: string }[] = [];

  for (let i = 0; i < records.length; i += step) {
    const r = records[i];
    points.push({
      x: r.YearsAtCompany,
      y: r.MonthlyIncome,
      attrition: r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes' ? 'Departed' : 'Retained',
      role: r.JobRole || 'Unknown',
    });
  }

  return points;
}
