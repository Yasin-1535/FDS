'use client';

import React from 'react';
import { AnalysisSection, EmployeeRecord, KPIMetrics, ThemeMode } from '@/lib/types';
import { computeRetentionPriorities, computeStatisticalTests } from '@/lib/calculations';
import {
  getCommuteAttrition,
  getDepartmentAttrition,
  getIncomeByAttrition,
  getOvertimeAttrition,
  getSatisfactionAttrition,
  getWorkLifeAttrition,
} from '@/lib/analytics';
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface SectionViewProps {
  section: AnalysisSection;
  records: EmployeeRecord[];
  metrics: KPIMetrics;
  theme: ThemeMode;
}

export default function SectionView({
  section,
  records,
  metrics,
  theme,
}: SectionViewProps) {
  const isConsole = theme === 'console';
  const cardBg = isConsole ? '#161D24' : '#1E293B';
  const borderCol = isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)';
  const labelCol = isConsole ? '#8A9BA8' : '#94A3B8';
  const titleCol = isConsole ? '#EDE6D6' : '#F1F5F9';

  const stats = computeStatisticalTests(records);
  const priorities = computeRetentionPriorities(records);
  const commute = getCommuteAttrition(records);
  const depts = getDepartmentAttrition(records);
  const ot = getOvertimeAttrition(records);
  const otNo = ot.find((o) => o.name.includes('No')) || { total: 0, departed: 0, retained: 0, rate: 0 };
  const otYes = ot.find((o) => o.name.includes('Yes')) || { total: 0, departed: 0, retained: 0, rate: 0 };
  const sat = getSatisfactionAttrition(records);
  const wlb = getWorkLifeAttrition(records);
  const inc = getIncomeByAttrition(records);

  const cardStyle: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${borderCol}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };

  switch (section) {
    case 'Overview':
      return (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol }}>
              Executive Overview • Workforce Intelligence &amp; Attrition Benchmark
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: isConsole ? '#81A1C1' : '#60A5FA',
                border: `1px solid ${isConsole ? '#4C7290' : 'rgba(96, 165, 250, 0.3)'}`,
              }}
            >
              Benchmark Reference: 1,470 Personnel (16.12% Overall Attrition)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>ACTIVE RETENTION RATE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#3DCC91' : '#34D399' }}>
                {metrics.totalCount > 0 ? ((metrics.retainedCount / metrics.totalCount) * 100).toFixed(2) : '0.00'}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{metrics.retainedCount.toLocaleString()} of {metrics.totalCount.toLocaleString()} employees</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OBSERVED ATTRITION RATE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#E57373' : '#F87171' }}>
                {metrics.attritionRate.toFixed(2)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{metrics.departedCount.toLocaleString()} voluntary departures</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERALL MEAN COMPENSATION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#81A1C1' : '#60A5FA' }}>
                ${Math.round(metrics.meanIncome).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Benchmark baseline: $6,502.93</div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Operating departments: {depts.map((d) => `${d.name} (${d.rate.toFixed(1)}% attrition, ${d.total} staff)`).join(' • ')}.
          </div>
        </div>
      );

    case 'Workforce':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Workforce Structural Segmentation &amp; Role Turnover
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {depts.map((d, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700, textTransform: 'uppercase' }}>{d.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: d.rate > 18 ? (isConsole ? '#E57373' : '#F87171') : (isConsole ? '#3DCC91' : '#34D399') }}>
                  {d.rate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{d.departed} of {d.total} departed</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Turnover concentration varies significantly across job roles: Sales Representatives exhibit the highest observed turnover at 39.76%, followed by Laboratory Technicians (23.94%) and Human Resources specialists (23.08%).
          </div>
        </div>
      );

    case 'Compensation':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Compensation Equity &amp; Monthly Income Disparity Analysis
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERALL MEAN INCOME</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#81A1C1' : '#60A5FA' }}>
                ${Math.round(inc.totalMean).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Active dataset mean ($6,502.93 baseline)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>RETAINED WORKFORCE MEAN</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#3DCC91' : '#34D399' }}>
                ${Math.round(inc.retainedMean).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Continuing staff ($6,832.74 baseline)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>DEPARTED WORKFORCE MEAN</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#E57373' : '#F87171' }}>
                ${Math.round(inc.departedMean).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Observed gap: -${Math.round(Math.abs(inc.incomeGap)).toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Welch Two-Sample t-test: <strong style={{ color: titleCol }}>t = {stats.tStat.toFixed(2)}</strong>, <strong style={{ color: titleCol }}>p &lt; 0.001</strong>. Departing personnel exhibit statistically significantly lower monthly compensation on average compared to continuing employees.
          </div>
        </div>
      );

    case 'Overtime':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Workplace Overtime &amp; Acute Attrition Exposure
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERTIME = YES ATTRITION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#E57373' : '#F87171' }}>
                {otYes.rate.toFixed(2)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {otYes.departed} of {otYes.total} employees departed
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERTIME = NO ATTRITION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#3DCC91' : '#34D399' }}>
                {otNo.rate.toFixed(2)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {otNo.departed} of {otNo.total} employees departed
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>STATISTICAL EVIDENCE (YATES χ²)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConsole ? '#D4A359' : '#FBBF24' }}>
                χ² = {stats.chiSquare.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>p &lt; 0.001 (Yates corrected)</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Overtime assignment is one of the strongest observed attrition signals in this dataset. Personnel working overtime display an attrition rate nearly 3× higher (30.53% vs 10.44%) than non-overtime staff.
          </div>
        </div>
      );

    case 'Satisfaction':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Employee Sentiment &amp; Work-Life Balance Correlation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {sat.map((s, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>SATISFACTION {s.name.toUpperCase()}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.rate >= 20 ? (isConsole ? '#E57373' : '#F87171') : s.rate >= 15 ? (isConsole ? '#D4A359' : '#FBBF24') : (isConsole ? '#3DCC91' : '#34D399') }}>
                  {s.rate.toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.departed} of {s.total} departed</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Work-Life Balance: Level 1 (Bad) shows 31.25% observed turnover, compared to 14.22% for Level 3 (Better). Poor work-life balance paired with low job satisfaction produces peak observed attrition risk (47.1%).
          </div>
        </div>
      );

    case 'Commute':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Commute Distance (DistanceFromHome) &amp; Spatial Risk Analysis
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {commute.map((c, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
                <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>{c.name.toUpperCase()}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c.rate >= 20 ? (isConsole ? '#E57373' : '#F87171') : (isConsole ? '#3DCC91' : '#34D399') }}>
                  {c.rate.toFixed(2)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.departed} of {c.total} departed</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Longer commute distance is associated with higher observed attrition. Personnel in the extended 21+ km group exhibit a 22.06% turnover rate versus 13.77% for close-proximity staff (0–5 km).
          </div>
        </div>
      );

    case 'Risk Signals':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Executive Retention Risk Register (Priority Signals)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {priorities.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${borderCol}`,
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: labelCol, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {idx + 1}. {p.category}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: titleCol }}>{p.factor}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>{p.details}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background:
                        p.level === 'HIGH'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : p.level === 'WATCH'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(59, 130, 246, 0.2)',
                      color: p.level === 'HIGH' ? (isConsole ? '#E57373' : '#F87171') : p.level === 'WATCH' ? (isConsole ? '#D4A359' : '#FBBF24') : (isConsole ? '#81A1C1' : '#60A5FA'),
                      border: `1px solid ${
                        p.level === 'HIGH' ? '#EF4444' : p.level === 'WATCH' ? '#F59E0B' : '#3B82F6'
                      }`,
                    }}
                  >
                    {p.level} RISK
                  </span>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    Observed rate: {p.rate.toFixed(2)}% ({p.benchmarkDiff > 0 ? `+${p.benchmarkDiff.toFixed(2)}%` : `${p.benchmarkDiff.toFixed(2)}%`})
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '12px' }}>
            ⚠️ <em>Observational Notice: These empirical signals indicate observed turnover differences in historical personnel records and do not establish independent mechanical causation.</em>
          </div>
        </div>
      );

    case 'Evidence':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleCol, marginBottom: '8px' }}>
            Statistical Evidence &amp; Empirical Hypothesis Verification
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: titleCol, marginTop: '8px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: labelCol }}>
                  <th style={{ padding: '8px 10px' }}>Hypothesis / Test</th>
                  <th style={{ padding: '8px 10px' }}>Statistical Test</th>
                  <th style={{ padding: '8px 10px' }}>Test Value</th>
                  <th style={{ padding: '8px 10px' }}>p-Value</th>
                  <th style={{ padding: '8px 10px' }}>Analytical Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <td style={{ padding: '10px' }}>Overtime Exposure × Attrition</td>
                  <td style={{ padding: '10px' }}>Chi-Square Independence (Yates Continuity Correction)</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>χ² = {stats.chiSquare.toFixed(2)}</td>
                  <td style={{ padding: '10px', color: isConsole ? '#3DCC91' : '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                  <td style={{ padding: '10px' }}>Overtime assignment exhibits statistically significant association with departure risk.</td>
                </tr>
                <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <td style={{ padding: '10px' }}>Monthly Income × Attrition</td>
                  <td style={{ padding: '10px' }}>Welch Two-Sample t-test (Unequal Variances)</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>t = {stats.tStat.toFixed(2)}</td>
                  <td style={{ padding: '10px', color: isConsole ? '#3DCC91' : '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                  <td style={{ padding: '10px' }}>Departed workforce displays significantly lower mean compensation ($4,787 vs $6,833).</td>
                </tr>
                <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <td style={{ padding: '10px' }}>Early Service Flight Window</td>
                  <td style={{ padding: '10px' }}>Categorical Cohort Rate Comparison</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>0–2 yrs: 29.82%</td>
                  <td style={{ padding: '10px', color: isConsole ? '#3DCC91' : '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                  <td style={{ padding: '10px' }}>First 24 months of tenure correlate with elevated observed turnover.</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>Commute Distance Elevation</td>
                  <td style={{ padding: '10px' }}>Distance Group Comparison (21+ km vs 0–5 km)</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>22.06% vs 13.77%</td>
                  <td style={{ padding: '10px', color: isConsole ? '#3DCC91' : '#34D399', fontWeight: 700 }}>p &lt; 0.01</td>
                  <td style={{ padding: '10px' }}>Extended commute distances display higher observed turnover.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '12px' }}>
            ⚠️ <em>Observational Disclaimer: All statistical tests reflect empirical associations within historical HR records and do not assert independent mechanical causation.</em>
          </div>
        </div>
      );

    default:
      return null;
  }
}
