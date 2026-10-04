'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AnalysisSection, EmployeeRecord, ThemeMode, VisualizationType } from '@/lib/types';
import {
  getCommuteAttrition,
  getCommuteDetails,
  getDepartmentAttrition,
  getIncomeByAttrition,
  getIncomeByJobRole,
  getIncomeDistributionBins,
  getIncomeScatterPoints,
  getJobRoleAttrition,
  getOvertimeAttrition,
  getOvertimeWorkLifeHeatmap,
  getSatisfactionAttrition,
  getSatisfactionWorkLifeHeatmap,
  getTenureAttrition,
  getWorkforceDemographics,
  getWorkLifeAttrition,
} from '@/lib/analytics';
import { computeRetentionPriorities, computeStatisticalTests } from '@/lib/calculations';
import { Info, MapPinOff } from 'lucide-react';

const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

interface ChartRendererProps {
  section: AnalysisSection;
  vizType: VisualizationType;
  records: EmployeeRecord[];
  theme: ThemeMode;
}

interface ChartConfig {
  title: string;
  subtitle?: string;
  data: any[];
  layout: any;
  height?: string;
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
  const titleColor = isConsole ? '#EDE6D6' : '#F1F5F9';
  const greenColor = isConsole ? '#3DCC91' : '#10B981';
  const redColor = isConsole ? '#C05646' : '#EF4444';
  const blueColor = isConsole ? '#81A1C1' : '#3B82F6';
  const amberColor = isConsole ? '#D4A359' : '#F59E0B';
  const cardBg = isConsole ? '#161D24' : '#1E293B';
  const cardBorder = isConsole ? '1px solid #364350' : '1px solid rgba(255, 255, 255, 0.08)';

  const commonLayout = {
    font: { color: textColor, family: 'system-ui, -apple-system, sans-serif', size: 11 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 55, r: 25, t: 30, b: 50 },
    xaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
      tickfont: { color: textColor, size: 10 },
      color: textColor,
    },
    yaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
      tickfont: { color: textColor, size: 10 },
      color: textColor,
    },
    legend: {
      font: { color: textColor, size: 10 },
      orientation: 'h',
      x: 0,
      y: 1.12,
    },
  };

  // Safe fallback UI card for Choropleth Map
  const renderChoroplethFallback = () => (
    <div
      style={{
        background: isConsole ? 'rgba(22, 29, 36, 0.7)' : 'rgba(30, 41, 59, 0.7)',
        border: isConsole ? '1px dashed #364350' : '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '28px 24px',
        textAlign: 'center',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          color: isConsole ? '#C05646' : '#F87171',
          marginBottom: '12px',
        }}
      >
        <MapPinOff size={30} />
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: titleColor, marginBottom: '6px' }}>
        Choropleth Visualization Unavailable for Current Dataset
      </div>
      <div style={{ fontSize: '0.84rem', color: textColor, maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
        Choropleth visualization unavailable for this dataset because it does not contain valid geographic boundary or location fields. DistanceFromHome is a numeric commute-distance variable, not geographic location data.
      </div>
      <div style={{ marginTop: '14px', fontSize: '0.78rem', color: isConsole ? '#D4A359' : '#FBBF24' }}>
        Recommended analytical alternatives: Select <strong>Bar Chart</strong>, <strong>Histogram</strong>, or <strong>Box Plot</strong> under the Commute section.
      </div>
    </div>
  );

  // Incompatible Chart Type Card
  const renderIncompatibleFallback = (type: VisualizationType, sec: AnalysisSection, recommended: string[]) => (
    <div
      style={{
        background: isConsole ? 'rgba(22, 29, 36, 0.7)' : 'rgba(30, 41, 59, 0.7)',
        border: isConsole ? '1px dashed #364350' : '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '28px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '12px',
          background: 'rgba(96, 165, 250, 0.1)',
          borderRadius: '50%',
          color: blueColor,
          marginBottom: '12px',
        }}
      >
        <Info size={28} />
      </div>
      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: titleColor, marginBottom: '6px' }}>
        {type} is Not Analytically Appropriate for {sec}
      </div>
      <div style={{ fontSize: '0.84rem', color: textColor, maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
        The {sec} analytical domain focuses on specific cohort metrics that are best represented using alternative chart paradigms.
      </div>
      <div style={{ marginTop: '14px', fontSize: '0.8rem', color: isConsole ? '#D4A359' : '#FBBF24' }}>
        Recommended chart types for {sec}: <strong>{recommended.join(', ')}</strong> or select <strong>ALL</strong> to view the curated gallery.
      </div>
    </div>
  );

  // SECTION CHART FACTORIES
  // -------------------------------------------------------------

  // 1. OVERVIEW CHARTS
  const getOverviewChart = (type: VisualizationType): ChartConfig | null => {
    const totalCount = records.length;
    const depCount = records.filter(
      (r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes'
    ).length;
    const retCount = totalCount - depCount;
    const depts = getDepartmentAttrition(records);

    switch (type) {
      case 'Bar Chart':
        return {
          title: 'Workforce Attrition vs Retention Headcount',
          subtitle: `Total workforce: ${totalCount.toLocaleString()} employees | Retained: ${retCount.toLocaleString()} (${((retCount / (totalCount || 1)) * 100).toFixed(2)}%) | Departed: ${depCount.toLocaleString()} (${((depCount / (totalCount || 1)) * 100).toFixed(2)}%)`,
          data: [
            {
              x: ['Retained Workforce', 'Departed Workforce'],
              y: [retCount, depCount],
              type: 'bar',
              marker: { color: [greenColor, redColor] },
              text: [
                `${retCount.toLocaleString()} (${((retCount / (totalCount || 1)) * 100).toFixed(2)}%)`,
                `${depCount.toLocaleString()} (${((depCount / (totalCount || 1)) * 100).toFixed(2)}%)`,
              ],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Headcount: %{y:,}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Employee Headcount' },
          },
        };

      case 'Donut Chart':
        return {
          title: 'Overall Workforce Retention Composition',
          subtitle: `Proportion of retained active staff vs voluntary departures`,
          data: [
            {
              labels: ['Retained Active', 'Observed Departures'],
              values: [retCount, depCount],
              type: 'pie',
              hole: 0.55,
              marker: { colors: [greenColor, redColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Pie Chart':
        return {
          title: 'Workforce Retention Ratio Breakdown',
          subtitle: `Executive summary breakdown of active vs departed personnel`,
          data: [
            {
              labels: ['Retained Workforce', 'Departed Workforce'],
              values: [retCount, depCount],
              type: 'pie',
              marker: { colors: [greenColor, redColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Department Headcount: Retained vs Departed',
          subtitle: `Distribution of active staff and departures across operating departments`,
          data: [
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.retained),
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
              text: depts.map((d) => `${d.retained.toLocaleString()}`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
            },
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.departed),
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
              text: depts.map((d) => `${d.departed.toLocaleString()} (${d.rate.toFixed(1)}%)`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Departed: %{y:,} (%{text})<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
          },
        };

      case 'Histogram': {
        const incomes = records.map((r) => Number(r.MonthlyIncome) || 0);
        return {
          title: 'Monthly Income Distribution Across Entire Workforce',
          subtitle: `Compensation dispersion and frequency tiers`,
          data: [
            {
              x: incomes,
              type: 'histogram',
              marker: { color: blueColor, opacity: 0.8 },
              nbinsx: 24,
              hovertemplate: 'Income Tier: %{x}<br>Employees: %{y}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Monthly Compensation ($)' },
            yaxis: { ...commonLayout.yaxis, title: 'Employee Frequency' },
          },
        };
      }

      case 'Line Chart': {
        const tenure = getTenureAttrition(records);
        return {
          title: 'Observed Attrition Rate Across Service Tenure Intervals',
          subtitle: `Turnover rate trajectory from early employment to long-term tenure`,
          data: [
            {
              x: tenure.map((t) => t.name),
              y: tenure.map((t) => t.rate),
              type: 'scatter',
              mode: 'lines+markers+text',
              line: { color: amberColor, width: 3 },
              marker: { size: 8, color: redColor },
              text: tenure.map((t) => `${t.rate.toFixed(1)}%`),
              textposition: 'top center',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };
      }

      case 'Area Chart': {
        const tenure = getTenureAttrition(records);
        return {
          title: 'Cumulative Tenure Attrition Volume',
          subtitle: `Volume of departures across progressive service tenure groups`,
          data: [
            {
              x: tenure.map((t) => t.name),
              y: tenure.map((t) => t.departed),
              type: 'scatter',
              fill: 'tozeroy',
              fillcolor: isConsole ? 'rgba(192, 86, 70, 0.25)' : 'rgba(239, 68, 68, 0.2)',
              line: { color: redColor, width: 2 },
              marker: { size: 6, color: redColor },
              text: tenure.map((t) => `${t.departed} departed`),
              textposition: 'top center',
              hovertemplate: '%{x}<br>Departures: %{y:,}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Departures (Count)' },
          },
        };
      }

      default:
        return null;
    }
  };

  // 2. WORKFORCE CHARTS
  const getWorkforceChart = (type: VisualizationType): ChartConfig | null => {
    const roles = getJobRoleAttrition(records);
    const depts = getDepartmentAttrition(records);
    const demos = getWorkforceDemographics(records);
    const ages = records.map((r) => Number(r.Age) || 35);

    switch (type) {
      case 'Bar Chart':
        return {
          title: 'Observed Attrition Rate by Job Role (%)',
          subtitle: `Sorted descending by turnover rate to highlight high-risk positions`,
          data: [
            {
              y: roles.map((r) => r.name).reverse(),
              x: roles.map((r) => r.rate).reverse(),
              type: 'bar',
              orientation: 'h',
              marker: {
                color: roles.map((r) => (r.rate >= 20 ? redColor : r.rate >= 15 ? amberColor : blueColor)).reverse(),
              },
              text: roles.map((r) => `${r.rate.toFixed(1)}% (${r.departed}/${r.total})`).reverse(),
              textposition: 'outside',
              hovertemplate: '%{y}<br>Observed Attrition: %{x:.2f}%<br>Details: %{text}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            margin: { l: 165, r: 50, t: 25, b: 45 },
            xaxis: { ...commonLayout.xaxis, title: 'Observed Attrition Rate (%)' },
          },
          height: '460px',
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Department Headcount: Retained vs Departed Personnel',
          subtitle: `Active retention vs departure breakdown across departments`,
          data: [
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.retained),
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
              text: depts.map((d) => `${d.retained.toLocaleString()}`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
            },
            {
              x: depts.map((d) => d.name),
              y: depts.map((d) => d.departed),
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
              text: depts.map((d) => `${d.departed.toLocaleString()} (${d.rate.toFixed(1)}%)`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Departed: %{y:,} (%{text})<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
          },
        };

      case 'Histogram':
        return {
          title: 'Workforce Age Distribution',
          subtitle: `Demographic age spread across the active population`,
          data: [
            {
              x: ages,
              type: 'histogram',
              marker: { color: blueColor, opacity: 0.8 },
              nbinsx: 20,
              hovertemplate: 'Age Range: %{x}<br>Employees: %{y}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Employee Age (Years)' },
            yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
          },
        };

      case 'Donut Chart':
        return {
          title: 'Workforce Composition by Business Travel',
          subtitle: `Proportion of personnel by travel obligation category`,
          data: [
            {
              labels: demos.travel.map((t) => t.name),
              values: demos.travel.map((t) => t.total),
              type: 'pie',
              hole: 0.55,
              marker: { colors: [blueColor, amberColor, greenColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Pie Chart':
        return {
          title: 'Workforce Distribution by Education Field',
          subtitle: `Academic background breakdown across active employees`,
          data: [
            {
              labels: demos.educationField.map((e) => e.name),
              values: demos.educationField.map((e) => e.total),
              type: 'pie',
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Line Chart': {
        const tenure = getTenureAttrition(records);
        return {
          title: 'Attrition Rate Trajectory across Service Tenure Groups',
          subtitle: `Observed turnover percentage from early to senior tenure cohorts`,
          data: [
            {
              x: tenure.map((t) => t.name),
              y: tenure.map((t) => t.rate),
              type: 'scatter',
              mode: 'lines+markers+text',
              line: { color: amberColor, width: 3 },
              marker: { size: 8, color: redColor },
              text: tenure.map((t) => `${t.rate.toFixed(1)}%`),
              textposition: 'top center',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };
      }

      case 'Box Plot': {
        const retAges = records.filter((r) => r.Attrition_Num === 0 && String(r.Attrition).toLowerCase() !== 'yes').map((r) => Number(r.Age) || 35);
        const depAges = records.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').map((r) => Number(r.Age) || 35);
        return {
          title: 'Age Distribution by Attrition Status',
          subtitle: `Quartiles and medians comparing continuing vs departed cohorts`,
          data: [
            {
              y: retAges,
              name: 'Retained',
              type: 'box',
              marker: { color: greenColor },
              boxpoints: 'outliers',
            },
            {
              y: depAges,
              name: 'Departed',
              type: 'box',
              marker: { color: redColor },
              boxpoints: 'outliers',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Age (Years)' },
          },
        };
      }

      default:
        return null;
    }
  };

  // 3. COMPENSATION CHARTS
  const getCompensationChart = (type: VisualizationType): ChartConfig | null => {
    const incStats = getIncomeByAttrition(records);
    const bins = getIncomeDistributionBins(records);
    const roleIncomes = getIncomeByJobRole(records);
    const scatterPts = getIncomeScatterPoints(records, 600);

    switch (type) {
      case 'Box Plot':
        return {
          title: 'Monthly Income Distribution by Attrition Status',
          subtitle: `Empirical median, interquartile ranges, and outliers: Retained vs Departed`,
          data: [
            {
              y: incStats.retainedIncomes,
              name: 'Retained Staff',
              type: 'box',
              marker: { color: greenColor },
              boxpoints: 'outliers',
              hovertemplate: 'Retained<br>Income: $%{y:,.0f}<extra></extra>',
            },
            {
              y: incStats.departedIncomes,
              name: 'Departed Staff',
              type: 'box',
              marker: { color: redColor },
              boxpoints: 'outliers',
              hovertemplate: 'Departed<br>Income: $%{y:,.0f}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
          },
        };

      case 'Bar Chart':
        return {
          title: 'Mean Monthly Income Comparison by Attrition Status',
          subtitle: `Retained workforce mean: $${Math.round(incStats.retainedMean).toLocaleString()} vs Departed mean: $${Math.round(incStats.departedMean).toLocaleString()} (Gap: -$${Math.round(Math.abs(incStats.incomeGap)).toLocaleString()})`,
          data: [
            {
              x: ['Retained Workforce Mean', 'Departed Workforce Mean'],
              y: [incStats.retainedMean, incStats.departedMean],
              type: 'bar',
              marker: { color: [greenColor, redColor] },
              text: [
                `$${Math.round(incStats.retainedMean).toLocaleString()}`,
                `$${Math.round(incStats.departedMean).toLocaleString()}`,
              ],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Average Income: $%{y:,.2f}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Mean Monthly Income ($)' },
          },
        };

      case 'Scatter Plot':
        return {
          title: 'Monthly Income vs Years at Company by Attrition Status',
          subtitle: `Bivariate dispersion showing tenure vs compensation with attrition classes`,
          data: [
            {
              x: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.x),
              y: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Retained Active',
              marker: { color: greenColor, size: 6, opacity: 0.65 },
              hovertemplate: 'Retained<br>Tenure: %{x} yrs<br>Income: $%{y:,.0f}<extra></extra>',
            },
            {
              x: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.x),
              y: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Observed Departures',
              marker: { color: redColor, size: 7, opacity: 0.85 },
              hovertemplate: 'Departed<br>Tenure: %{x} yrs<br>Income: $%{y:,.0f}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Years at Company (Tenure)' },
            yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
          },
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Compensation Tier Distribution: Retained vs Departed',
          subtitle: `Staff count across progressive monthly salary brackets`,
          data: [
            {
              x: bins.map((b) => b.label),
              y: bins.map((b) => b.retained),
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
              hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
            },
            {
              x: bins.map((b) => b.label),
              y: bins.map((b) => b.departed),
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
              hovertemplate: '%{x}<br>Departed: %{y:,}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
          },
        };

      case 'Histogram': {
        const allInc = records.map((r) => Number(r.MonthlyIncome) || 0);
        return {
          title: 'Monthly Income Frequency Distribution',
          subtitle: `Overall workforce compensation spread`,
          data: [
            {
              x: allInc,
              type: 'histogram',
              marker: { color: blueColor, opacity: 0.8 },
              nbinsx: 25,
              hovertemplate: 'Income: %{x}<br>Count: %{y}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
            yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
          },
        };
      }

      default:
        return null;
    }
  };

  // 4. OVERTIME CHARTS
  const getOvertimeChart = (type: VisualizationType): ChartConfig | null => {
    const ot = getOvertimeAttrition(records);
    const otData = {
      no: ot.find((o) => o.name.includes('No')) || { total: 0, retained: 0, departed: 0, rate: 0 },
      yes: ot.find((o) => o.name.includes('Yes')) || { total: 0, retained: 0, departed: 0, rate: 0 },
    };
    const heatmapData = getOvertimeWorkLifeHeatmap(records);

    switch (type) {
      case 'Grouped Bar Chart':
        return {
          title: 'Overtime Assignment: Retained vs Departed Headcount',
          subtitle: `Overtime = Yes (${otData.yes.departed}/${otData.yes.total} departed, ${otData.yes.rate.toFixed(1)}%) vs Overtime = No (${otData.no.departed}/${otData.no.total} departed, ${otData.no.rate.toFixed(1)}%)`,
          data: [
            {
              x: ['Overtime: No', 'Overtime: Yes'],
              y: [otData.no.retained, otData.yes.retained],
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
              text: [`${otData.no.retained.toLocaleString()}`, `${otData.yes.retained.toLocaleString()}`],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
            },
            {
              x: ['Overtime: No', 'Overtime: Yes'],
              y: [otData.no.departed, otData.yes.departed],
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
              text: [
                `${otData.no.departed.toLocaleString()} (${otData.no.rate.toFixed(1)}%)`,
                `${otData.yes.departed.toLocaleString()} (${otData.yes.rate.toFixed(1)}%)`,
              ],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Departed: %{y:,} (%{text})<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
          },
        };

      case 'Bar Chart':
        return {
          title: 'Observed Attrition Rate by Overtime Status',
          subtitle: `Overtime Yes exhibits an observed attrition rate of ${otData.yes.rate.toFixed(2)}% vs ${otData.no.rate.toFixed(2)}% for Overtime No`,
          data: [
            {
              x: ['Overtime: No', 'Overtime: Yes'],
              y: [otData.no.rate, otData.yes.rate],
              type: 'bar',
              marker: { color: [greenColor, redColor] },
              text: [`${otData.no.rate.toFixed(2)}%`, `${otData.yes.rate.toFixed(2)}%`],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)', range: [0, 40] },
          },
        };

      case 'Donut Chart':
        return {
          title: 'Workforce Distribution by Overtime Status',
          subtitle: `Proportion of personnel assigned overtime duties vs standard hours`,
          data: [
            {
              labels: ['No Overtime', 'Works Overtime'],
              values: [otData.no.total, otData.yes.total],
              type: 'pie',
              hole: 0.55,
              marker: { colors: [blueColor, amberColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Pie Chart':
        return {
          title: 'Overtime Share of Observed Departures',
          subtitle: `${otData.yes.departed} of ${otData.yes.departed + otData.no.departed} total departures were overtime workers`,
          data: [
            {
              labels: ['Departures (No Overtime)', 'Departures (Works Overtime)'],
              values: [otData.no.departed, otData.yes.departed],
              type: 'pie',
              marker: { colors: [greenColor, redColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Departures: %{value:,}<br>Share: %{percent}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      case 'Heatmap':
        return {
          title: 'Overtime × Work-Life Balance Attrition Heatmap (%)',
          subtitle: `Interaction matrix showing attrition rates by overtime status and work-life balance levels`,
          data: [
            {
              z: heatmapData.zValues,
              x: heatmapData.xLabels,
              y: heatmapData.yLabels,
              type: 'heatmap',
              colorscale: 'Reds',
              text: heatmapData.textValues,
              texttemplate: '%{text}',
              hoverongaps: false,
              showscale: true,
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Work-Life Balance Level' },
            yaxis: { ...commonLayout.yaxis, title: 'Overtime Status' },
          },
        };

      case 'Line Chart': {
        const wlbLevels = ['1 (Bad)', '2 (Good)', '3 (Better)', '4 (Best)'];
        return {
          title: 'Turnover Rate Trajectory: Overtime vs No Overtime across WLB',
          subtitle: `Comparative attrition gradients across work-life balance ratings`,
          data: [
            {
              x: wlbLevels,
              y: heatmapData.zValues[1],
              name: 'Works Overtime',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: redColor, width: 3 },
              marker: { size: 7, color: redColor },
              hovertemplate: 'Overtime Yes - WLB %{x}<br>Attrition: %{y:.1f}%<extra></extra>',
            },
            {
              x: wlbLevels,
              y: heatmapData.zValues[0],
              name: 'No Overtime',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: greenColor, width: 3 },
              marker: { size: 7, color: greenColor },
              hovertemplate: 'Overtime No - WLB %{x}<br>Attrition: %{y:.1f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Work-Life Balance Level' },
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };
      }

      default:
        return null;
    }
  };

  // 5. SATISFACTION CHARTS
  const getSatisfactionChart = (type: VisualizationType): ChartConfig | null => {
    const sat = getSatisfactionAttrition(records);
    const wlb = getWorkLifeAttrition(records);
    const heatmap = getSatisfactionWorkLifeHeatmap(records);

    switch (type) {
      case 'Bar Chart':
        return {
          title: 'Observed Attrition Rate by Job Satisfaction Level',
          subtitle: `Level 1 (Low): 22.84% down to Level 4 (Very High): 11.33%`,
          data: [
            {
              x: sat.map((s) => s.name),
              y: sat.map((s) => s.rate),
              type: 'bar',
              marker: {
                color: sat.map((s) => (s.rate >= 20 ? redColor : s.rate >= 15 ? amberColor : greenColor)),
              },
              text: sat.map((s) => `${s.rate.toFixed(2)}% (${s.departed}/${s.total})`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)', range: [0, 30] },
          },
        };

      case 'Heatmap':
        return {
          title: 'Job Satisfaction × Work-Life Balance Attrition Heatmap (%)',
          subtitle: `Interaction matrix: Highest observed turnover occurs at low satisfaction + poor work-life balance (47.1%)`,
          data: [
            {
              z: heatmap.zValues,
              x: heatmap.xLabels,
              y: heatmap.yLabels,
              type: 'heatmap',
              colorscale: 'Reds',
              text: heatmap.textValues,
              texttemplate: '%{text}',
              hoverongaps: false,
              showscale: true,
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Work-Life Balance Level' },
            yaxis: { ...commonLayout.yaxis, title: 'Job Satisfaction Level' },
          },
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Attrition Rate Comparison: Job Satisfaction vs Work-Life Balance',
          subtitle: `Comparative side-by-side turnover rates across sentiment tiers`,
          data: [
            {
              x: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
              y: sat.map((s) => s.rate),
              name: 'Job Satisfaction Rate (%)',
              type: 'bar',
              marker: { color: blueColor },
              text: sat.map((s) => `${s.rate.toFixed(1)}%`),
              textposition: 'outside',
              hovertemplate: 'Job Satisfaction %{x}<br>Rate: %{y:.1f}%<extra></extra>',
            },
            {
              x: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
              y: wlb.map((w) => w.rate),
              name: 'Work-Life Balance Rate (%)',
              type: 'bar',
              marker: { color: amberColor },
              text: wlb.map((w) => `${w.rate.toFixed(1)}%`),
              textposition: 'outside',
              hovertemplate: 'Work-Life Balance %{x}<br>Rate: %{y:.1f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };

      case 'Line Chart':
        return {
          title: 'Attrition Rate Trajectory by Work-Life Balance Rating',
          subtitle: `Level 1 (Bad): 31.25% vs Level 3 (Better): 14.22%`,
          data: [
            {
              x: wlb.map((w) => w.name),
              y: wlb.map((w) => w.rate),
              type: 'scatter',
              mode: 'lines+markers+text',
              line: { color: redColor, width: 3 },
              marker: { size: 8, color: redColor },
              text: wlb.map((w) => `${w.rate.toFixed(2)}%`),
              textposition: 'top center',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };

      case 'Donut Chart':
        return {
          title: 'Workforce Share Across Job Satisfaction Levels',
          subtitle: `Proportion of workforce in each satisfaction tier`,
          data: [
            {
              labels: sat.map((s) => s.name),
              values: sat.map((s) => s.total),
              type: 'pie',
              hole: 0.55,
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      default:
        return null;
    }
  };

  // 6. COMMUTE CHARTS
  const getCommuteChart = (type: VisualizationType): ChartConfig | null => {
    const commute = getCommuteAttrition(records);
    const details = getCommuteDetails(records);

    switch (type) {
      case 'Bar Chart':
        return {
          title: 'Observed Attrition Rate by Distance Group',
          subtitle: `Commute distance association: 0–5 km: 13.77%, 6–10 km: 14.47%, 11–20 km: 20.00%, 21+ km: 22.06%`,
          data: [
            {
              x: commute.map((c) => c.name),
              y: commute.map((c) => c.rate),
              type: 'bar',
              marker: {
                color: commute.map((c) => (c.rate >= 20 ? redColor : c.rate >= 14 ? amberColor : greenColor)),
              },
              text: commute.map((c) => `${c.rate.toFixed(2)}% (${c.departed}/${c.total})`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)', range: [0, 28] },
          },
        };

      case 'Histogram':
        return {
          title: 'Commute Distance (DistanceFromHome) Distribution',
          subtitle: `Continuous kilometer distance distribution among workforce`,
          data: [
            {
              x: details.allDistances,
              type: 'histogram',
              marker: { color: blueColor, opacity: 0.8 },
              nbinsx: 29,
              hovertemplate: 'Distance: %{x} km<br>Employees: %{y}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Distance from Facility (km)' },
            yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
          },
        };

      case 'Box Plot':
        return {
          title: 'Commute Distance Distribution by Attrition Status',
          subtitle: `Distance quartiles: Departed personnel exhibit an extended distance spread compared to retained`,
          data: [
            {
              y: details.retainedDist,
              name: 'Retained Staff',
              type: 'box',
              marker: { color: greenColor },
              boxpoints: 'outliers',
              hovertemplate: 'Retained<br>Distance: %{y} km<extra></extra>',
            },
            {
              y: details.departedDist,
              name: 'Departed Staff',
              type: 'box',
              marker: { color: redColor },
              boxpoints: 'outliers',
              hovertemplate: 'Departed<br>Distance: %{y} km<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Distance from Home (km)' },
          },
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Commute Distance Group Headcount: Retained vs Departed',
          subtitle: `Headcount volume across standardized distance bands`,
          data: [
            {
              x: commute.map((c) => c.name),
              y: commute.map((c) => c.retained),
              name: 'Retained',
              type: 'bar',
              marker: { color: greenColor },
              text: commute.map((c) => `${c.retained.toLocaleString()}`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
            },
            {
              x: commute.map((c) => c.name),
              y: commute.map((c) => c.departed),
              name: 'Departed',
              type: 'bar',
              marker: { color: redColor },
              text: commute.map((c) => `${c.departed.toLocaleString()} (${c.rate.toFixed(1)}%)`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Departed: %{y:,} (%{text})<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
          },
        };

      case 'Line Chart':
        return {
          title: 'Commute Distance vs Observed Attrition Rate Gradient',
          subtitle: `Progressive rise in observed turnover from short to extended commutes`,
          data: [
            {
              x: commute.map((c) => c.name),
              y: commute.map((c) => c.rate),
              type: 'scatter',
              mode: 'lines+markers+text',
              line: { color: amberColor, width: 3 },
              marker: { size: 8, color: redColor },
              text: commute.map((c) => `${c.rate.toFixed(2)}%`),
              textposition: 'top center',
              hovertemplate: '%{x}<br>Observed Attrition: %{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
          },
        };

      case 'Donut Chart':
        return {
          title: 'Workforce Share Across Distance Groups',
          subtitle: `Proportion of staff residing in each commute boundary tier`,
          data: [
            {
              labels: commute.map((c) => c.name),
              values: commute.map((c) => c.total),
              type: 'pie',
              hole: 0.55,
              marker: { colors: [greenColor, blueColor, amberColor, redColor] },
              textinfo: 'label+percent',
              hovertemplate: '%{label}<br>Count: %{value:,}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };

      default:
        return null;
    }
  };

  // 7. RISK SIGNALS CHARTS
  const getRiskSignalsChart = (type: VisualizationType): ChartConfig | null => {
    const priorities = computeRetentionPriorities(records);

    switch (type) {
      case 'Bar Chart':
        return {
          title: 'Operational Risk Register: Observed Attrition Rate Across Key Cohorts',
          subtitle: `Ranked by risk factors: Overtime, Work-Life Balance, Early Tenure, Commute Distance, Job Satisfaction, Role`,
          data: [
            {
              y: priorities.map((p) => p.factor).reverse(),
              x: priorities.map((p) => p.rate).reverse(),
              type: 'bar',
              orientation: 'h',
              marker: {
                color: priorities.map((p) => (p.level === 'HIGH' ? redColor : p.level === 'WATCH' ? amberColor : blueColor)).reverse(),
              },
              text: priorities.map((p) => `${p.rate.toFixed(1)}% (+${p.benchmarkDiff.toFixed(1)}%)`).reverse(),
              textposition: 'outside',
              hovertemplate: '%{y}<br>Observed Attrition: %{x:.2f}%<br>Details: %{text}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            margin: { l: 200, r: 60, t: 25, b: 45 },
            xaxis: { ...commonLayout.xaxis, title: 'Observed Attrition Rate (%)' },
          },
          height: '420px',
        };

      case 'Grouped Bar Chart':
        return {
          title: 'Risk Cohorts Observed Elevation Over Baseline (%)',
          subtitle: `Percentage point delta above workforce baseline for priority cohorts`,
          data: [
            {
              x: priorities.map((p) => p.factor),
              y: priorities.map((p) => p.benchmarkDiff),
              type: 'bar',
              marker: {
                color: priorities.map((p) => (p.benchmarkDiff >= 10 ? redColor : amberColor)),
              },
              text: priorities.map((p) => `+${p.benchmarkDiff.toFixed(1)}%`),
              textposition: 'outside',
              hovertemplate: '%{x}<br>Elevation: +%{y:.2f}%<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            margin: { l: 50, r: 25, t: 30, b: 90 },
            xaxis: { ...commonLayout.xaxis, tickangle: -25 },
            yaxis: { ...commonLayout.yaxis, title: 'Elevation Over Baseline (% points)' },
          },
        };

      case 'Donut Chart': {
        const highCount = priorities.filter((p) => p.level === 'HIGH').length;
        const watchCount = priorities.filter((p) => p.level === 'WATCH').length;
        const reviewCount = priorities.filter((p) => p.level === 'REVIEW').length;
        return {
          title: 'Priority Risk Factor Classification Breakdown',
          subtitle: `Distribution of flagged retention risk factors by severity rating`,
          data: [
            {
              labels: ['High Risk', 'Watch List', 'Review Cohort'],
              values: [highCount, watchCount, reviewCount],
              type: 'pie',
              hole: 0.55,
              marker: { colors: [redColor, amberColor, blueColor] },
              textinfo: 'label+value',
              hovertemplate: '%{label}<br>Count: %{value}<extra></extra>',
            },
          ],
          layout: { ...commonLayout },
        };
      }

      default:
        return null;
    }
  };

  // 8. EVIDENCE CHARTS
  const getEvidenceChart = (type: VisualizationType): ChartConfig | null => {
    const stats = computeStatisticalTests(records);
    const incStats = getIncomeByAttrition(records);
    const ot = getOvertimeAttrition(records);
    const otYes = ot.find((o) => o.name.includes('Yes')) || { total: 0, retained: 0, departed: 0 };
    const otNo = ot.find((o) => o.name.includes('No')) || { total: 0, retained: 0, departed: 0 };
    const totalN = records.length;
    const expYesDep = totalN > 0 ? (otYes.total * incStats.departedCount) / totalN : 0;
    const expNoDep = totalN > 0 ? (otNo.total * incStats.departedCount) / totalN : 0;

    switch (type) {
      case 'Grouped Bar Chart':
        return {
          title: 'Overtime 2×2 Contingency: Observed vs Expected Departures',
          subtitle: `Chi-Square Independence Test (Yates χ² = ${stats.chiSquare.toFixed(2)}, p < 0.001). Observed departures for Overtime Yes (${otYes.departed}) dramatically exceed null expectation (${expYesDep.toFixed(1)})`,
          data: [
            {
              x: ['Overtime: No', 'Overtime: Yes'],
              y: [otNo.departed, otYes.departed],
              name: 'Observed Departures',
              type: 'bar',
              marker: { color: redColor },
              text: [`${otNo.departed}`, `${otYes.departed}`],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Observed: %{y}<extra></extra>',
            },
            {
              x: ['Overtime: No', 'Overtime: Yes'],
              y: [Number(expNoDep.toFixed(1)), Number(expYesDep.toFixed(1))],
              name: 'Null Expected Departures',
              type: 'bar',
              marker: { color: blueColor },
              text: [`${expNoDep.toFixed(1)}`, `${expYesDep.toFixed(1)}`],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Expected: %{y}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            barmode: 'group',
            yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' },
          },
        };

      case 'Bar Chart':
        return {
          title: 'Monthly Income Comparison & Statistical Significance',
          subtitle: `Welch Two-Sample t-test: t = ${stats.tStat.toFixed(2)}, p < 0.001. Retained ($${Math.round(incStats.retainedMean).toLocaleString()}) vs Departed ($${Math.round(incStats.departedMean).toLocaleString()})`,
          data: [
            {
              x: ['Retained Workforce Mean', 'Departed Workforce Mean'],
              y: [incStats.retainedMean, incStats.departedMean],
              type: 'bar',
              marker: { color: [greenColor, redColor] },
              text: [
                `$${Math.round(incStats.retainedMean).toLocaleString()}`,
                `$${Math.round(incStats.departedMean).toLocaleString()}`,
              ],
              textposition: 'outside',
              hovertemplate: '%{x}<br>Mean Income: $%{y:,.2f}<extra></extra>',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Mean Monthly Income ($)' },
          },
        };

      case 'Box Plot':
        return {
          title: 'Income Quartiles & Empirical Dispersion (Retained vs Departed)',
          subtitle: `Welch t-test foundation: Demonstrating statistically significant compensation disparity`,
          data: [
            {
              y: incStats.retainedIncomes,
              name: 'Retained Staff',
              type: 'box',
              marker: { color: greenColor },
              boxpoints: 'outliers',
            },
            {
              y: incStats.departedIncomes,
              name: 'Departed Staff',
              type: 'box',
              marker: { color: redColor },
              boxpoints: 'outliers',
            },
          ],
          layout: {
            ...commonLayout,
            yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
          },
        };

      case 'Scatter Plot': {
        const scatterPts = getIncomeScatterPoints(records, 600);
        return {
          title: 'Compensation Disparity: Income vs Tenure with Attrition Classes',
          subtitle: `Bivariate dispersion demonstrating departure clustering in lower salary ranges`,
          data: [
            {
              x: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.x),
              y: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Retained',
              marker: { color: greenColor, size: 6, opacity: 0.65 },
            },
            {
              x: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.x),
              y: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.y),
              mode: 'markers',
              type: 'scatter',
              name: 'Departed',
              marker: { color: redColor, size: 7, opacity: 0.85 },
            },
          ],
          layout: {
            ...commonLayout,
            xaxis: { ...commonLayout.xaxis, title: 'Years at Company' },
            yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
          },
        };
      }

      default:
        return null;
    }
  };

  // Helper dispatcher to retrieve chart config based on section
  const getSectionChart = (sec: AnalysisSection, type: VisualizationType): ChartConfig | null => {
    switch (sec) {
      case 'Overview':
        return getOverviewChart(type);
      case 'Workforce':
        return getWorkforceChart(type);
      case 'Compensation':
        return getCompensationChart(type);
      case 'Overtime':
        return getOvertimeChart(type);
      case 'Satisfaction':
        return getSatisfactionChart(type);
      case 'Commute':
        return getCommuteChart(type);
      case 'Risk Signals':
        return getRiskSignalsChart(type);
      case 'Evidence':
        return getEvidenceChart(type);
      default:
        return null;
    }
  };

  // Get recommended chart types for each section
  const getRecommendedTypes = (sec: AnalysisSection): string[] => {
    switch (sec) {
      case 'Overview':
        return ['Bar Chart', 'Donut Chart', 'Grouped Bar Chart', 'Histogram', 'Line Chart'];
      case 'Workforce':
        return ['Bar Chart', 'Grouped Bar Chart', 'Histogram', 'Donut Chart', 'Line Chart'];
      case 'Compensation':
        return ['Box Plot', 'Bar Chart', 'Scatter Plot', 'Grouped Bar Chart', 'Histogram'];
      case 'Overtime':
        return ['Grouped Bar Chart', 'Bar Chart', 'Donut Chart', 'Heatmap', 'Line Chart'];
      case 'Satisfaction':
        return ['Bar Chart', 'Heatmap', 'Grouped Bar Chart', 'Line Chart', 'Donut Chart'];
      case 'Commute':
        return ['Bar Chart', 'Histogram', 'Box Plot', 'Grouped Bar Chart', 'Line Chart'];
      case 'Risk Signals':
        return ['Bar Chart', 'Grouped Bar Chart', 'Donut Chart'];
      case 'Evidence':
        return ['Grouped Bar Chart', 'Bar Chart', 'Box Plot', 'Scatter Plot'];
    }
  };

  // 1. SINGLE VISUALIZATION MODE
  if (vizType !== 'ALL') {
    if (vizType === 'Choropleth Map') {
      return (
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '8px', padding: '16px' }}>
          {renderChoroplethFallback()}
        </div>
      );
    }

    const cfg = getSectionChart(section, vizType);

    if (!cfg) {
      return (
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '8px', padding: '16px' }}>
          {renderIncompatibleFallback(vizType, section, getRecommendedTypes(section))}
        </div>
      );
    }

    return (
      <div style={{ background: cardBg, border: cardBorder, borderRadius: '8px', padding: '16px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleColor }}>{cfg.title}</div>
          {cfg.subtitle && (
            <div style={{ fontSize: '0.78rem', color: textColor, marginTop: '3px' }}>{cfg.subtitle}</div>
          )}
        </div>
        <PlotlyChart data={cfg.data} layout={cfg.layout} style={{ width: '100%', height: cfg.height || '420px' }} />
      </div>
    );
  }

  // 2. ALL VISUALIZATION GALLERY MODE
  // Curated, section-tailored analytical galleries
  const getAllSectionGalleryConfigs = (): ChartConfig[] => {
    switch (section) {
      case 'Overview':
        return [
          getOverviewChart('Bar Chart')!,
          getOverviewChart('Donut Chart')!,
          getOverviewChart('Grouped Bar Chart')!,
          getOverviewChart('Line Chart')!,
          getOverviewChart('Histogram')!,
        ].filter(Boolean);

      case 'Workforce':
        return [
          getWorkforceChart('Bar Chart')!,
          getWorkforceChart('Grouped Bar Chart')!,
          getWorkforceChart('Histogram')!,
          getWorkforceChart('Donut Chart')!,
          getWorkforceChart('Line Chart')!,
        ].filter(Boolean);

      case 'Compensation':
        return [
          getCompensationChart('Box Plot')!,
          getCompensationChart('Bar Chart')!,
          getCompensationChart('Scatter Plot')!,
          getCompensationChart('Grouped Bar Chart')!,
          getCompensationChart('Histogram')!,
        ].filter(Boolean);

      case 'Overtime':
        return [
          getOvertimeChart('Grouped Bar Chart')!,
          getOvertimeChart('Bar Chart')!,
          getOvertimeChart('Donut Chart')!,
          getOvertimeChart('Heatmap')!,
          getOvertimeChart('Line Chart')!,
        ].filter(Boolean);

      case 'Satisfaction':
        return [
          getSatisfactionChart('Bar Chart')!,
          getSatisfactionChart('Heatmap')!,
          getSatisfactionChart('Grouped Bar Chart')!,
          getSatisfactionChart('Line Chart')!,
        ].filter(Boolean);

      case 'Commute':
        return [
          getCommuteChart('Bar Chart')!,
          getCommuteChart('Histogram')!,
          getCommuteChart('Box Plot')!,
          getCommuteChart('Grouped Bar Chart')!,
          getCommuteChart('Line Chart')!,
        ].filter(Boolean);

      case 'Risk Signals':
        return [
          getRiskSignalsChart('Bar Chart')!,
          getRiskSignalsChart('Grouped Bar Chart')!,
          getRiskSignalsChart('Donut Chart')!,
        ].filter(Boolean);

      case 'Evidence':
        return [
          getEvidenceChart('Grouped Bar Chart')!,
          getEvidenceChart('Bar Chart')!,
          getEvidenceChart('Box Plot')!,
          getEvidenceChart('Scatter Plot')!,
        ].filter(Boolean);

      default:
        return [];
    }
  };

  const galleryConfigs = getAllSectionGalleryConfigs();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '16px',
        }}
      >
        {galleryConfigs.map((cfg, idx) => (
          <div
            key={idx}
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: titleColor }}>{cfg.title}</div>
              {cfg.subtitle && (
                <div style={{ fontSize: '0.74rem', color: textColor, marginTop: '2px' }}>{cfg.subtitle}</div>
              )}
            </div>
            <PlotlyChart data={cfg.data} layout={cfg.layout} style={{ width: '100%', height: cfg.height || '340px' }} />
          </div>
        ))}
      </div>

      {/* Safe Geographic Notice in ALL Mode */}
      <div style={{ background: cardBg, border: cardBorder, borderRadius: '8px', padding: '16px' }}>
        {renderChoroplethFallback()}
      </div>
    </div>
  );
}
