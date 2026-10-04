'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AnalysisSection, EmployeeRecord, ThemeMode, VisualizationType } from '@/lib/types';
import {
  getCommuteAttrition,
  getDepartmentAttrition,
  getIncomeDistributionBins,
  getIncomeScatterPoints,
  getJobRoleAttrition,
  getOvertimeAttrition,
  getSatisfactionAttrition,
  getTenureAttrition,
  getWorkLifeAttrition,
} from '@/lib/analytics';
import { AlertCircle, MapPinOff } from 'lucide-react';

const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

interface ChartRendererProps {
  section: AnalysisSection;
  vizType: VisualizationType;
  records: EmployeeRecord[];
  theme: ThemeMode;
}

export default function ChartRenderer({
  section,
  vizType,
  records,
  theme,
}: ChartRendererProps) {
  const isConsole = theme === 'console';
  const gridColor = isConsole ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  const textColor = isConsole ? '#8A9BA8' : '#94A3B8';
  const greenColor = isConsole ? '#3DCC91' : '#10B981';
  const redColor = isConsole ? '#C05646' : '#EF4444';
  const blueColor = isConsole ? '#81A1C1' : '#3B82F6';
  const amberColor = isConsole ? '#D4A359' : '#F59E0B';

  const commonLayout = {
    font: { color: textColor, family: 'inherit' },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
    yaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
  };

  // Helper to build single chart
  const buildChart = (type: VisualizationType, customTitle?: string) => {
    switch (type) {
      case 'Bar Chart': {
        if (section === 'Compensation') {
          const bins = getIncomeDistributionBins(records);
          return {
            title: customTitle || 'Compensation: Attrition Count by Monthly Income Tier',
            data: [
              {
                x: bins.map((b) => b.label),
                y: bins.map((b) => b.retained),
                name: 'Retained',
                type: 'bar',
                marker: { color: greenColor },
              },
              {
                x: bins.map((b) => b.label),
                y: bins.map((b) => b.departed),
                name: 'Departed',
                type: 'bar',
                marker: { color: redColor },
              },
            ],
            layout: { ...commonLayout, barmode: 'group', yaxis: { title: 'Headcount' } },
          };
        }

        if (section === 'Overtime') {
          const ot = getOvertimeAttrition(records);
          return {
            title: customTitle || 'Overtime: Observed Attrition Rate (%)',
            data: [
              {
                x: ot.map((o) => o.name),
                y: ot.map((o) => o.rate),
                type: 'bar',
                marker: { color: [greenColor, redColor] },
                text: ot.map((o) => `${o.rate.toFixed(1)}%`),
                textposition: 'outside',
              },
            ],
            layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)', range: [0, 42] } },
          };
        }

        if (section === 'Satisfaction') {
          const sat = getSatisfactionAttrition(records);
          return {
            title: customTitle || 'Satisfaction: Attrition Rate by Job Satisfaction',
            data: [
              {
                x: sat.map((s) => s.name),
                y: sat.map((s) => s.rate),
                type: 'bar',
                marker: { color: amberColor },
                text: sat.map((s) => `${s.rate.toFixed(1)}%`),
                textposition: 'outside',
              },
            ],
            layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)' } },
          };
        }

        if (section === 'Commute') {
          const com = getCommuteAttrition(records);
          return {
            title: customTitle || 'Commute: Attrition Rate by Distance Band',
            data: [
              {
                x: com.map((c) => c.name),
                y: com.map((c) => c.rate),
                type: 'bar',
                marker: { color: blueColor },
                text: com.map((c) => `${c.rate.toFixed(1)}%`),
                textposition: 'outside',
              },
            ],
            layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)' } },
          };
        }

        if (section === 'Workforce') {
          const roles = getJobRoleAttrition(records);
          return {
            title: customTitle || 'Workforce: Attrition Rate by Job Role (%)',
            data: [
              {
                y: roles.map((r) => r.name).reverse(),
                x: roles.map((r) => r.rate).reverse(),
                type: 'bar',
                orientation: 'h',
                marker: { color: roles.map((r) => (r.rate > 20 ? redColor : blueColor)).reverse() },
                text: roles.map((r) => `${r.rate.toFixed(1)}%`).reverse(),
                textposition: 'outside',
              },
            ],
            layout: { ...commonLayout, margin: { l: 150, r: 40, t: 40, b: 40 }, xaxis: { title: 'Attrition Rate (%)' } },
          };
        }

        // Overview / default
        const depts = getDepartmentAttrition(records);
        return {
          title: customTitle || 'Overview: Attrition Rate by Department (%)',
          data: [
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.rate),
              type: 'bar',
              marker: { color: [blueColor, amberColor, greenColor] },
              text: depts.map((d) => `${d.rate.toFixed(1)}%`),
              textposition: 'outside',
            },
          ],
          layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)' } },
        };
      }

      case 'Line Chart': {
        const tenure = getTenureAttrition(records);
        return {
          title: customTitle || 'Attrition Rate Trend across Service Tenure',
          data: [
            {
              x: tenure.map((t) => t.name),
              y: tenure.map((t) => t.rate),
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: amberColor, width: 3 },
              marker: { size: 8, color: redColor },
            },
          ],
          layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)' } },
        };
      }

      case 'Histogram': {
        const incomes = records.map((r) => r.MonthlyIncome || 0);
        return {
          title: customTitle || 'Monthly Compensation Distribution (Histogram)',
          data: [
            {
              x: incomes,
              type: 'histogram',
              marker: { color: blueColor, opacity: 0.75 },
              nbinsx: 25,
            },
          ],
          layout: { ...commonLayout, xaxis: { title: 'Monthly Income ($)' }, yaxis: { title: 'Frequency' } },
        };
      }

      case 'Pie Chart': {
        const depCount = records.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').length;
        const retCount = records.length - depCount;
        return {
          title: customTitle || 'Overall Workforce Retention Ratio',
          data: [
            {
              labels: [`Retained (${retCount})`, `Departed (${depCount})`],
              values: [retCount, depCount],
              type: 'pie',
              marker: { colors: [greenColor, redColor] },
              textinfo: 'label+percent',
              hole: 0,
            },
          ],
          layout: { ...commonLayout },
        };
      }

      case 'Scatter Plot': {
        const pts = getIncomeScatterPoints(records, 600);
        return {
          title: customTitle || 'Monthly Income vs Years at Company by Attrition',
          data: [
            {
              x: pts.filter((p) => p.attrition === 'Retained').map((p) => p.x),
              y: pts.filter((p) => p.attrition === 'Retained').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Retained',
              marker: { color: greenColor, size: 6, opacity: 0.6 },
            },
            {
              x: pts.filter((p) => p.attrition === 'Departed').map((p) => p.x),
              y: pts.filter((p) => p.attrition === 'Departed').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Departed',
              marker: { color: redColor, size: 7, opacity: 0.8 },
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { title: 'Years at Company' },
            yaxis: { title: 'Monthly Income ($)' },
          },
        };
      }

      case 'Box Plot': {
        const retInc = records.filter((r) => r.Attrition_Num === 0 && String(r.Attrition).toLowerCase() !== 'yes').map((r) => r.MonthlyIncome);
        const depInc = records.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').map((r) => r.MonthlyIncome);
        return {
          title: customTitle || 'Monthly Income Quartiles by Attrition Status',
          data: [
            {
              y: retInc,
              name: 'Retained',
              type: 'box',
              marker: { color: greenColor },
              boxpoints: 'outliers',
            },
            {
              y: depInc,
              name: 'Departed',
              type: 'box',
              marker: { color: redColor },
              boxpoints: 'outliers',
            },
          ],
          layout: { ...commonLayout, yaxis: { title: 'Monthly Income ($)' } },
        };
      }

      case 'Heatmap': {
        // Department x OverTime Crosstab Attrition Rate
        const depts = ['Human Resources', 'Research & Development', 'Sales'];
        const ots = ['No Overtime', 'Works Overtime'];
        const matrix: number[][] = [];

        for (const ot of ots) {
          const row: number[] = [];
          for (const dept of depts) {
            const subset = records.filter(
              (r) =>
                r.Department === dept &&
                (ot === 'Works Overtime' ? String(r.OverTime).toLowerCase() === 'yes' : String(r.OverTime).toLowerCase() !== 'yes')
            );
            const dep = subset.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').length;
            const rate = subset.length > 0 ? (dep / subset.length) * 100 : 0;
            row.push(Number(rate.toFixed(1)));
          }
          matrix.push(row);
        }

        return {
          title: customTitle || 'Department × Overtime Attrition Heatmap (%)',
          data: [
            {
              z: matrix,
              x: depts,
              y: ots,
              type: 'heatmap',
              colorscale: 'Reds',
              showscale: true,
            },
          ],
          layout: { ...commonLayout },
        };
      }

      case 'Grouped Bar Chart': {
        const depts = getDepartmentAttrition(records);
        return {
          title: customTitle || 'Workforce Count: Retained vs Departed by Department',
          data: [
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.total - d.departed),
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
            },
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.departed),
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
            },
          ],
          layout: { ...commonLayout, barmode: 'group', yaxis: { title: 'Headcount' } },
        };
      }

      case 'Donut Chart': {
        const depCount = records.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').length;
        const retCount = records.length - depCount;
        return {
          title: customTitle || 'Workforce Composition (Donut)',
          data: [
            {
              labels: ['Retained', 'Departed'],
              values: [retCount, depCount],
              type: 'pie',
              hole: 0.55,
              marker: { colors: [greenColor, redColor] },
              textinfo: 'label+percent',
            },
          ],
          layout: { ...commonLayout },
        };
      }

      case 'Area Chart': {
        const tenure = getTenureAttrition(records);
        return {
          title: customTitle || 'Cumulative Attrition Exposure across Tenure Intervals',
          data: [
            {
              x: tenure.map((t) => t.name),
              y: tenure.map((t) => t.rate),
              type: 'scatter',
              fill: 'tozeroy',
              line: { color: amberColor },
              marker: { color: redColor },
            },
          ],
          layout: { ...commonLayout, yaxis: { title: 'Attrition Rate (%)' } },
        };
      }

      case 'Choropleth Map': {
        return null;
      }

      default:
        return null;
    }
  };

  // Safe fallback UI card for Choropleth Map
  const renderChoroplethFallback = () => (
    <div
      style={{
        background: isConsole ? 'rgba(22, 29, 36, 0.7)' : 'rgba(30, 41, 59, 0.7)',
        border: isConsole ? '1px dashed #364350' : '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '24px 20px',
        textAlign: 'center',
        margin: '12px 0',
      }}
    >
      <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#F87171', marginBottom: '12px' }}>
        <MapPinOff size={28} />
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '6px' }}>
        Choropleth Map • Unavailable for Current Dataset
      </div>
      <div style={{ fontSize: '0.82rem', color: '#94A3B8', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
        This visualization requires geographic boundary or coordinate data (such as ISO country codes, latitude/longitude, or regional postal shapefiles) not present in this HR dataset. DistanceFromHome represents scalar mileage and cannot be converted to geographic coordinates.
      </div>
    </div>
  );

  // Single Chart View
  if (vizType !== 'ALL') {
    if (vizType === 'Choropleth Map') {
      return (
        <div style={{ background: isConsole ? '#161D24' : '#1E293B', border: isConsole ? '1px solid #364350' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
          {renderChoroplethFallback()}
        </div>
      );
    }

    const cfg = buildChart(vizType);
    if (!cfg) return null;

    return (
      <div style={{ background: isConsole ? '#161D24' : '#1E293B', border: isConsole ? '1px solid #364350' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isConsole ? '#EDE6D6' : '#F87171', marginBottom: '12px' }}>
          {cfg.title}
        </div>
        <PlotlyChart data={cfg.data} layout={cfg.layout} style={{ width: '100%', height: '420px' }} />
      </div>
    );
  }

  // ALL Visualization Mode: 2-Column Responsive Analytical Gallery
  const allTypes: { type: VisualizationType; title: string }[] = [
    { type: 'Bar Chart', title: `Bar Chart • ${section} Analysis` },
    { type: 'Line Chart', title: `Line Chart • ${section} Trajectory` },
    { type: 'Histogram', title: `Histogram • ${section} Distribution` },
    { type: 'Box Plot', title: `Box Plot • ${section} Disparity` },
    { type: 'Scatter Plot', title: `Scatter Plot • Bivariate Dispersion` },
    { type: 'Heatmap', title: `Heatmap • Interaction Matrix` },
    { type: 'Grouped Bar Chart', title: `Grouped Bar • Comparative View` },
    { type: 'Donut Chart', title: `Donut Chart • Ratio Representation` },
    { type: 'Pie Chart', title: `Pie Chart • Cohort Breakdown` },
    { type: 'Area Chart', title: `Area Chart • Cumulative Volume` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '16px' }}>
        {allTypes.map((item, idx) => {
          const cfg = buildChart(item.type, item.title);
          if (!cfg) return null;

          return (
            <div
              key={idx}
              style={{
                background: isConsole ? '#161D24' : '#1E293B',
                border: isConsole ? '1px solid #364350' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isConsole ? '#EDE6D6' : '#F1F5F9', marginBottom: '10px' }}>
                {cfg.title}
              </div>
              <PlotlyChart data={cfg.data} layout={cfg.layout} style={{ width: '100%', height: '340px' }} />
            </div>
          );
        })}
      </div>

      {/* Row 6: Safe Geographic Notice for Choropleth Map */}
      <div style={{ background: isConsole ? '#161D24' : '#1E293B', border: isConsole ? '1px solid #364350' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
        {renderChoroplethFallback()}
      </div>
    </div>
  );
}
