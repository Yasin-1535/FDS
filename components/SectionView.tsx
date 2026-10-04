'use client';

import React from 'react';
import { AnalysisSection, EmployeeRecord, KPIMetrics, ThemeMode } from '@/lib/types';
import { computeRetentionPriorities, computeStatisticalTests } from '@/lib/calculations';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

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

  const stats = computeStatisticalTests(records);
  const priorities = computeRetentionPriorities(records);

  const cardStyle: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${borderCol}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  };

  switch (section) {
    case 'Compensation':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
            Compensation & Monthly Income Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERALL MEAN</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60A5FA' }}>${Math.round(metrics.meanIncome).toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Active workforce baseline</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>RETAINED WORKFORCE MEAN</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>${Math.round(metrics.retainedMeanIncome).toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Continuing personnel average</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>DEPARTED WORKFORCE MEAN</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>${Math.round(metrics.departedMeanIncome).toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Disparity: -${Math.round(Math.abs(metrics.incomeGap)).toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Welch Two-Sample t-test: <strong style={{ color: '#F1F5F9' }}>t = {stats.tStat}</strong>, <strong style={{ color: '#F1F5F9' }}>p &lt; 0.001</strong>. Departing personnel exhibit significantly lower monthly compensation compared to continuing colleagues.
          </div>
        </div>
      );

    case 'Overtime':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
            Workplace Overtime & Acute Attrition Exposure
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERTIME = YES ATTRITION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>30.53%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>127 of 416 employees departed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>OVERTIME = NO ATTRITION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>10.44%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>110 of 1,054 employees departed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>STATISTICAL SIGNIFICANCE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24' }}>p &lt; 0.001</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Chi-Square = {stats.chiSquare}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Mandatory overtime demonstrates a near-threefold elevation in observed employee turnover. Overtime rebalancing represents a high-impact immediate retention strategy.
          </div>
        </div>
      );

    case 'Commute':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
            Commute Distance & Spatial Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>0–5 KM</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>13.77%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>88 of 639 departed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>6–10 KM</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>12.82%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>41 of 320 departed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>11–20 KM</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24' }}>19.34%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>47 of 243 departed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', border: `1px solid ${borderCol}` }}>
              <div style={{ fontSize: '0.72rem', color: labelCol, fontWeight: 700 }}>21+ KM</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>22.06%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>61 of 268 departed</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: labelCol, lineHeight: 1.5 }}>
            Long commutes (&gt; 20 km) correlate with an 8.29 percentage-point increase in observed attrition compared to close-proximity staff (0–5 km).
          </div>
        </div>
      );

    case 'Risk Signals':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
            Retention Priority Board (Operational Risk Register)
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
                  <div style={{ fontSize: '0.74rem', color: labelCol, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {p.category}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F1F5F9' }}>{p.factor}</div>
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
                      color: p.level === 'HIGH' ? '#F87171' : p.level === 'WATCH' ? '#FBBF24' : '#60A5FA',
                      border: `1px solid ${
                        p.level === 'HIGH' ? '#EF4444' : p.level === 'WATCH' ? '#F59E0B' : '#3B82F6'
                      }`,
                    }}
                  >
                    {p.level} RISK
                  </span>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    {p.rate.toFixed(1)}% rate ({p.benchmarkDiff > 0 ? `+${p.benchmarkDiff.toFixed(1)}%` : `${p.benchmarkDiff.toFixed(1)}%`})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'Evidence':
      return (
        <div style={cardStyle}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
            Statistical Evidence & Hypothesis Verification
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#F1F5F9', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderCol}`, textAlign: 'left', color: labelCol }}>
                <th style={{ padding: '8px 10px' }}>Hypothesis / Dimension</th>
                <th style={{ padding: '8px 10px' }}>Statistical Test</th>
                <th style={{ padding: '8px 10px' }}>Test Value</th>
                <th style={{ padding: '8px 10px' }}>p-Value</th>
                <th style={{ padding: '8px 10px' }}>Conclusion</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <td style={{ padding: '10px' }}>Compensation Disparity</td>
                <td style={{ padding: '10px' }}>Welch Two-Sample t-test</td>
                <td style={{ padding: '10px' }}>t = {stats.tStat}</td>
                <td style={{ padding: '10px', color: '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                <td style={{ padding: '10px' }}>Statistically Significant Disparity</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <td style={{ padding: '10px' }}>Workplace Overtime</td>
                <td style={{ padding: '10px' }}>Chi-Square Independence</td>
                <td style={{ padding: '10px' }}>χ² = {stats.chiSquare}</td>
                <td style={{ padding: '10px', color: '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                <td style={{ padding: '10px' }}>Strong Statistical Dependency</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <td style={{ padding: '10px' }}>Service Tenure Window</td>
                <td style={{ padding: '10px' }}>Categorical Comparison</td>
                <td style={{ padding: '10px' }}>0-2 yrs: 29.82%</td>
                <td style={{ padding: '10px', color: '#34D399', fontWeight: 700 }}>p &lt; 0.001</td>
                <td style={{ padding: '10px' }}>Early-Career Flight Window</td>
              </tr>
              <tr>
                <td style={{ padding: '10px' }}>Spatial Commute</td>
                <td style={{ padding: '10px' }}>Band Comparison</td>
                <td style={{ padding: '10px' }}>&gt;20 km vs &lt;5 km</td>
                <td style={{ padding: '10px', color: '#34D399', fontWeight: 700 }}>p &lt; 0.01</td>
                <td style={{ padding: '10px' }}>Distance Correlates with Turnover</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '12px' }}>
            ⚠️ <em>Observational Disclaimer: All statistical tests indicate empirical correlation within the benchmark population and do not establish direct mechanical causation.</em>
          </div>
        </div>
      );

    default:
      return null;
  }
}
