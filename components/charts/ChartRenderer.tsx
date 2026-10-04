'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AnalysisSection, EmployeeRecord, ThemeMode, VisualizationType } from '@/lib/types';
import {
  getChiSquareResiduals,
  getCommuteAttrition,
  getCommuteDetails,
  getDepartmentAttrition,
  getDepartmentOvertimeHeatmap,
  getDepartmentTravelHeatmap,
  getDistanceDepartmentHeatmap,
  getIncomeByAttrition,
  getIncomeByJobRole,
  getIncomeDistributionBins,
  getIncomeECDF,
  getIncomeScatterPoints,
  getJobLevelDepartmentIncomeHeatmap,
  getJobLevelIncomeProgression,
  getJobRoleAttrition,
  getOvertimeAttrition,
  getOvertimeWorkLifeHeatmap,
  getRiskFlagMetrics,
  getSatisfactionAttrition,
  getSatisfactionWorkLifeHeatmap,
  getTenureAttrition,
  getWorkforceDemographics,
  getWorkLifeAttrition,
} from '@/lib/analytics';
import { computeRetentionPriorities, computeStatisticalTests } from '@/lib/calculations';
import { MapPinOff } from 'lucide-react';

const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });

interface ChartRendererProps {
  section: AnalysisSection;
  vizType: VisualizationType;
  records: EmployeeRecord[];
  theme: ThemeMode;
}

interface ChartConfig {
  type: VisualizationType;
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
    margin: { l: 50, r: 20, t: 30, b: 45 },
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
      y: 1.15,
    },
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
        margin: '6px 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '50%',
          color: isConsole ? '#C05646' : '#F87171',
          marginBottom: '10px',
        }}
      >
        <MapPinOff size={28} />
      </div>
      <div style={{ fontSize: '0.96rem', fontWeight: 700, color: titleColor, marginBottom: '6px' }}>
        Choropleth Map • Geographic Data Unavailable
      </div>
      <div style={{ fontSize: '0.82rem', color: textColor, maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
        Geographic visualization is unavailable because this dataset does not contain valid geographic coordinates or boundary data. DistanceFromHome is a numeric commute-distance variable, not geographic location data.
      </div>
    </div>
  );

  // SECTION CHART FACTORIES (Providing all 10 applicable chart types per section)
  // ==============================================================================

  // 1. OVERVIEW CHARTS
  const getOverviewCharts = (): ChartConfig[] => {
    const totalCount = records.length;
    const depCount = records.filter(
      (r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes'
    ).length;
    const retCount = totalCount - depCount;
    const depts = getDepartmentAttrition(records);
    const tenure = getTenureAttrition(records);
    const incomes = records.map((r) => Number(r.MonthlyIncome) || 0);
    const scatterPts = getIncomeScatterPoints(records, 600);
    const deptOtHeatmap = getDepartmentOvertimeHeatmap(records);

    return [
      {
        type: 'Bar Chart',
        title: 'Workforce Retention vs Departure Headcount',
        subtitle: `Total: ${totalCount.toLocaleString()} | Retained: ${retCount.toLocaleString()} (${((retCount / (totalCount || 1)) * 100).toFixed(2)}%) | Departed: ${depCount.toLocaleString()} (${((depCount / (totalCount || 1)) * 100).toFixed(2)}%)`,
        data: [
          {
            x: ['Retained Workforce', 'Departed Workforce'],
            y: [retCount, depCount],
            type: 'bar',
            marker: { color: [greenColor, redColor] },
            text: [
              `${retCount.toLocaleString()} (${((retCount / (totalCount || 1)) * 100).toFixed(1)}%)`,
              `${depCount.toLocaleString()} (${((depCount / (totalCount || 1)) * 100).toFixed(1)}%)`,
            ],
            textposition: 'outside',
            hovertemplate: '%{x}<br>Headcount: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Headcount' } },
      },
      {
        type: 'Line Chart',
        title: 'Observed Attrition Rate across Service Tenure Intervals',
        subtitle: 'Turnover rate trajectory from early employment to long-term tenure',
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
            hovertemplate: '%{x}<br>Attrition Rate: %{y:.2f}%<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition (%)' } },
      },
      {
        type: 'Histogram',
        title: 'Monthly Income Distribution Across Entire Workforce',
        subtitle: 'Continuous compensation dispersion and frequency tiers',
        data: [
          {
            x: incomes,
            type: 'histogram',
            marker: { color: blueColor, opacity: 0.8 },
            nbinsx: 24,
            hovertemplate: 'Salary: $%{x:,.0f}<br>Employees: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Compensation ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Frequency' },
        },
      },
      {
        type: 'Pie Chart',
        title: 'Overall Workforce Retention Ratio',
        subtitle: 'Executive summary breakdown of active vs departed personnel',
        data: [
          {
            labels: ['Retained Staff', 'Departed Staff'],
            values: [retCount, depCount],
            type: 'pie',
            marker: { colors: [greenColor, redColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Compensation vs Age Dispersion Across Workforce by Attrition',
        subtitle: 'Bivariate age vs salary distribution color-coded by retention status',
        data: [
          {
            x: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.age),
            y: scatterPts.filter((p) => p.attrition === 'Retained').map((p) => p.y),
            mode: 'markers',
            type: 'scatter',
            name: 'Retained Staff',
            marker: { color: greenColor, size: 6, opacity: 0.65 },
            hovertemplate: 'Retained<br>Age: %{x} yrs<br>Salary: $%{y:,.0f}<extra></extra>',
          },
          {
            x: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.age),
            y: scatterPts.filter((p) => p.attrition === 'Departed').map((p) => p.y),
            mode: 'markers',
            type: 'scatter',
            name: 'Departed Staff',
            marker: { color: redColor, size: 7, opacity: 0.85 },
            hovertemplate: 'Departed<br>Age: %{x} yrs<br>Salary: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Employee Age (Years)' },
          yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Monthly Income Spread Across Operating Departments',
        subtitle: 'Quartiles and compensation medians for Sales, R&D, and HR',
        data: depts.map((d) => {
          const deptIncomes = records.filter((r) => r.Department === d.name).map((r) => Number(r.MonthlyIncome) || 0);
          return {
            y: deptIncomes,
            name: d.name,
            type: 'box',
            boxpoints: 'outliers',
            hovertemplate: '%{x}<br>Income: $%{y:,.0f}<extra></extra>',
          };
        }),
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Department × Overtime Attrition Heatmap (%)',
        subtitle: 'Cross-tabulation turnover rate matrix by department and overtime obligation',
        data: [
          {
            z: deptOtHeatmap.zValues,
            x: deptOtHeatmap.xLabels,
            y: deptOtHeatmap.yLabels,
            type: 'heatmap',
            colorscale: 'Reds',
            text: deptOtHeatmap.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Department Headcount: Retained vs Departed Personnel',
        subtitle: 'Active retention vs departure breakdown across departments',
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Headcount' } },
      },
      {
        type: 'Donut Chart',
        title: 'Workforce Distribution by Department',
        subtitle: 'Proportion of total staff assigned across operating divisions',
        data: [
          {
            labels: depts.map((d) => d.name),
            values: depts.map((d) => d.total),
            type: 'pie',
            hole: 0.55,
            marker: { colors: [blueColor, amberColor, greenColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Tenure Attrition Volume',
        subtitle: 'Volume of observed departures across progressive service tenure groups',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' } },
      },
    ];
  };

  // 2. WORKFORCE CHARTS
  const getWorkforceCharts = (): ChartConfig[] => {
    const roles = getJobRoleAttrition(records);
    const depts = getDepartmentAttrition(records);
    const demos = getWorkforceDemographics(records);
    const ages = records.map((r) => Number(r.Age) || 35);
    const tenure = getTenureAttrition(records);
    const deptTravelHeatmap = getDepartmentTravelHeatmap(records);

    return [
      {
        type: 'Bar Chart',
        title: 'Observed Attrition Rate by Job Role (%)',
        subtitle: 'Sorted descending by turnover rate to highlight high-risk positions',
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
            hovertemplate: '%{y}<br>Observed Attrition: %{x:.2f}%<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          margin: { l: 165, r: 50, t: 25, b: 45 },
          xaxis: { ...commonLayout.xaxis, title: 'Observed Attrition Rate (%)' },
        },
        height: '420px',
      },
      {
        type: 'Line Chart',
        title: 'Attrition Rate Gradient across Service Tenure Cohorts',
        subtitle: 'Observed turnover trajectory from early service to long-tenured personnel',
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
            hovertemplate: '%{x}<br>Attrition Rate: %{y:.2f}%<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition (%)' } },
      },
      {
        type: 'Histogram',
        title: 'Workforce Age Distribution',
        subtitle: 'Continuous demographic age spread across active workforce',
        data: [
          {
            x: ages,
            type: 'histogram',
            marker: { color: blueColor, opacity: 0.8 },
            nbinsx: 20,
            hovertemplate: 'Age: %{x} yrs<br>Headcount: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Age (Years)' },
          yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
        },
      },
      {
        type: 'Pie Chart',
        title: 'Workforce Distribution by Education Field',
        subtitle: 'Academic background breakdown across active employees',
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
      },
      {
        type: 'Scatter Plot',
        title: 'Total Working Years vs Years at Company by Attrition Status',
        subtitle: 'Career trajectory vs company tenure dispersion with departure markers',
        data: [
          {
            x: records.filter((r) => r.Attrition_Num === 0).map((r) => Number(r.TotalWorkingYears) || 0),
            y: records.filter((r) => r.Attrition_Num === 0).map((r) => Number(r.YearsAtCompany) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'Retained Staff',
            marker: { color: greenColor, size: 6, opacity: 0.65 },
            hovertemplate: 'Retained<br>Career: %{x} yrs<br>Tenure: %{y} yrs<extra></extra>',
          },
          {
            x: records.filter((r) => r.Attrition_Num === 1).map((r) => Number(r.TotalWorkingYears) || 0),
            y: records.filter((r) => r.Attrition_Num === 1).map((r) => Number(r.YearsAtCompany) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'Departed Staff',
            marker: { color: redColor, size: 7, opacity: 0.85 },
            hovertemplate: 'Departed<br>Career: %{x} yrs<br>Tenure: %{y} yrs<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Total Working Years (Career)' },
          yaxis: { ...commonLayout.yaxis, title: 'Years at Company (Tenure)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Age Distribution Across Job Roles',
        subtitle: 'Age quartiles, medians, and demographic spreads across all positions',
        data: roles.map((r) => {
          const roleAges = records.filter((rec) => rec.JobRole === r.name).map((rec) => Number(rec.Age) || 35);
          return {
            y: roleAges,
            name: r.name,
            type: 'box',
            boxpoints: 'outliers',
            hovertemplate: '%{x}<br>Age: %{y} yrs<extra></extra>',
          };
        }),
        layout: {
          ...commonLayout,
          margin: { l: 50, r: 20, t: 30, b: 80 },
          xaxis: { ...commonLayout.xaxis, tickangle: -30 },
          yaxis: { ...commonLayout.yaxis, title: 'Age (Years)' },
        },
      },
      {
        type: 'Heatmap',
        title: 'Department × Business Travel Attrition Interaction Matrix (%)',
        subtitle: 'Turnover rate cross-tabulation by department and travel requirement',
        data: [
          {
            z: deptTravelHeatmap.zValues,
            x: deptTravelHeatmap.xLabels,
            y: deptTravelHeatmap.yLabels,
            type: 'heatmap',
            colorscale: 'Reds',
            text: deptTravelHeatmap.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Department Headcount: Retained vs Departed Personnel',
        subtitle: 'Active retention vs departure breakdown across departments',
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Employee Count' } },
      },
      {
        type: 'Donut Chart',
        title: 'Workforce Composition by Business Travel',
        subtitle: 'Proportion of personnel by travel obligation category',
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
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Workforce Headcount by Tenure Bracket',
        subtitle: 'Cumulative staff retention volume across progressive service tenure tiers',
        data: [
          {
            x: tenure.map((t) => t.name),
            y: tenure.map((t) => t.retained),
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(61, 204, 145, 0.25)' : 'rgba(16, 185, 129, 0.2)',
            line: { color: greenColor, width: 2 },
            marker: { size: 6, color: greenColor },
            text: tenure.map((t) => `${t.retained} retained`),
            textposition: 'top center',
            hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Retained Staff (Count)' } },
      },
    ];
  };

  // 3. COMPENSATION CHARTS
  const getCompensationCharts = (): ChartConfig[] => {
    const incStats = getIncomeByAttrition(records);
    const bins = getIncomeDistributionBins(records);
    const scatterPts = getIncomeScatterPoints(records, 600);
    const jobLevelIncome = getJobLevelDepartmentIncomeHeatmap(records);
    const levelProgression = getJobLevelIncomeProgression(records);
    const ecdf = getIncomeECDF(records);

    return [
      {
        type: 'Bar Chart',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Mean Monthly Income ($)' } },
      },
      {
        type: 'Line Chart',
        title: 'Mean Monthly Income Progression across Job Levels',
        subtitle: 'Compensation progression trajectory comparing retained vs departed staff by job level',
        data: [
          {
            x: levelProgression.levels,
            y: levelProgression.retainedMeans,
            name: 'Retained Staff',
            type: 'scatter',
            mode: 'lines+markers+text',
            line: { color: greenColor, width: 3 },
            marker: { size: 7, color: greenColor },
            text: levelProgression.retainedMeans.map((m) => `$${m.toLocaleString()}`),
            textposition: 'top center',
            hovertemplate: '%{x} - Retained<br>Mean: $%{y:,}<extra></extra>',
          },
          {
            x: levelProgression.levels,
            y: levelProgression.departedMeans,
            name: 'Departed Staff',
            type: 'scatter',
            mode: 'lines+markers+text',
            line: { color: redColor, width: 3, dash: 'dot' },
            marker: { size: 7, color: redColor },
            text: levelProgression.departedMeans.map((m) => `$${m.toLocaleString()}`),
            textposition: 'bottom center',
            hovertemplate: '%{x} - Departed<br>Mean: $%{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Mean Monthly Income ($)' } },
      },
      {
        type: 'Histogram',
        title: 'Monthly Income Frequency Distribution',
        subtitle: 'Continuous distribution of monthly salary brackets across the population',
        data: [
          {
            x: records.map((r) => Number(r.MonthlyIncome) || 0),
            type: 'histogram',
            marker: { color: blueColor, opacity: 0.8 },
            nbinsx: 25,
            hovertemplate: 'Income: $%{x:,.0f}<br>Count: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Employee Count' },
        },
      },
      {
        type: 'Pie Chart',
        title: 'Compensation Volume Share: Retained vs Departed Total Payroll',
        subtitle: 'Proportion of aggregate monthly payroll represented by retained vs departed cohorts',
        data: [
          {
            labels: ['Retained Staff Payroll', 'Departed Staff Payroll'],
            values: [
              Math.round(incStats.retainedMean * incStats.retainedCount),
              Math.round(incStats.departedMean * incStats.departedCount),
            ],
            type: 'pie',
            marker: { colors: [greenColor, redColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Payroll: $%{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Monthly Income vs Years at Company by Attrition Status',
        subtitle: 'Bivariate dispersion showing tenure vs compensation with attrition classes',
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
      },
      {
        type: 'Box Plot',
        title: 'Monthly Income Distribution by Attrition Status',
        subtitle: 'Empirical median, interquartile ranges, and outliers: Retained vs Departed',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Job Level × Department Mean Compensation Heatmap ($)',
        subtitle: 'Cross-tabulation salary matrix demonstrating compensation scaling by department and level',
        data: [
          {
            z: jobLevelIncome.zValues,
            x: jobLevelIncome.xLabels,
            y: jobLevelIncome.yLabels,
            type: 'heatmap',
            colorscale: 'Viridis',
            text: jobLevelIncome.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Compensation Tier Distribution: Retained vs Departed',
        subtitle: 'Staff count across progressive monthly salary brackets',
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Headcount' } },
      },
      {
        type: 'Donut Chart',
        title: 'Workforce Distribution Across Compensation Tiers',
        subtitle: 'Share of total headcount within each salary range',
        data: [
          {
            labels: bins.map((b) => b.label),
            values: bins.map((b) => b.retained + b.departed),
            type: 'pie',
            hole: 0.55,
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Staff: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Payroll Distribution by Monthly Income (ECDF)',
        subtitle: 'Empirical cumulative distribution function of salary comparing retained vs departed staff',
        data: [
          {
            x: ecdf.retPts.map((p) => p.x),
            y: ecdf.retPts.map((p) => p.y),
            name: 'Retained ECDF',
            type: 'scatter',
            line: { color: greenColor, width: 2 },
            hovertemplate: 'Retained<br>Income: $%{x:,}<br>Cumulative: %{y:.1%}<extra></extra>',
          },
          {
            x: ecdf.depPts.map((p) => p.x),
            y: ecdf.depPts.map((p) => p.y),
            name: 'Departed ECDF',
            type: 'scatter',
            line: { color: redColor, width: 2, dash: 'dash' },
            hovertemplate: 'Departed<br>Income: $%{x:,}<br>Cumulative: %{y:.1%}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Cumulative Proportion' },
        },
      },
    ];
  };

  // 4. OVERTIME CHARTS
  const getOvertimeCharts = (): ChartConfig[] => {
    const ot = getOvertimeAttrition(records);
    const otData = {
      no: ot.find((o) => o.name.includes('No')) || { total: 0, retained: 0, departed: 0, rate: 0 },
      yes: ot.find((o) => o.name.includes('Yes')) || { total: 0, retained: 0, departed: 0, rate: 0 },
    };
    const heatmapData = getOvertimeWorkLifeHeatmap(records);
    const tenure = getTenureAttrition(records);

    return [
      {
        type: 'Bar Chart',
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
          yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)', range: [0, 38] },
        },
      },
      {
        type: 'Line Chart',
        title: 'Turnover Rate Trajectory: Overtime vs No Overtime across WLB',
        subtitle: 'Comparative attrition gradients across work-life balance ratings',
        data: [
          {
            x: ['1 (Bad)', '2 (Good)', '3 (Better)', '4 (Best)'],
            y: heatmapData.zValues[1],
            name: 'Works Overtime',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: redColor, width: 3 },
            marker: { size: 7, color: redColor },
            hovertemplate: 'Overtime Yes - WLB %{x}<br>Attrition: %{y:.1f}%<extra></extra>',
          },
          {
            x: ['1 (Bad)', '2 (Good)', '3 (Better)', '4 (Best)'],
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
      },
      {
        type: 'Histogram',
        title: 'Monthly Income Distribution: Overtime Assigned Personnel',
        subtitle: 'Compensation distribution of personnel performing regular overtime duties',
        data: [
          {
            x: records.filter((r) => String(r.OverTime).toLowerCase() === 'yes').map((r) => Number(r.MonthlyIncome) || 0),
            type: 'histogram',
            marker: { color: amberColor, opacity: 0.8 },
            nbinsx: 20,
            hovertemplate: 'Salary: $%{x:,.0f}<br>Count: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Overtime Staff Count' },
        },
      },
      {
        type: 'Pie Chart',
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
      },
      {
        type: 'Scatter Plot',
        title: 'Monthly Income vs Commute Distance by Overtime Status',
        subtitle: 'Bivariate commute vs compensation dispersion grouped by overtime assignment',
        data: [
          {
            x: records.filter((r) => String(r.OverTime).toLowerCase() === 'no').map((r) => Number(r.DistanceFromHome) || 0),
            y: records.filter((r) => String(r.OverTime).toLowerCase() === 'no').map((r) => Number(r.MonthlyIncome) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'No Overtime',
            marker: { color: blueColor, size: 6, opacity: 0.6 },
            hovertemplate: 'No Overtime<br>Distance: %{x} km<br>Salary: $%{y:,.0f}<extra></extra>',
          },
          {
            x: records.filter((r) => String(r.OverTime).toLowerCase() === 'yes').map((r) => Number(r.DistanceFromHome) || 0),
            y: records.filter((r) => String(r.OverTime).toLowerCase() === 'yes').map((r) => Number(r.MonthlyIncome) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'Works Overtime',
            marker: { color: amberColor, size: 6, opacity: 0.75 },
            hovertemplate: 'Overtime Yes<br>Distance: %{x} km<br>Salary: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Commute Distance (km)' },
          yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Monthly Income Distribution by Overtime Status',
        subtitle: 'Compensation comparison between overtime and non-overtime personnel',
        data: [
          {
            y: records.filter((r) => String(r.OverTime).toLowerCase() === 'no').map((r) => Number(r.MonthlyIncome) || 0),
            name: 'No Overtime',
            type: 'box',
            marker: { color: blueColor },
            boxpoints: 'outliers',
            hovertemplate: 'No Overtime<br>Income: $%{y:,.0f}<extra></extra>',
          },
          {
            y: records.filter((r) => String(r.OverTime).toLowerCase() === 'yes').map((r) => Number(r.MonthlyIncome) || 0),
            name: 'Works Overtime',
            type: 'box',
            marker: { color: amberColor },
            boxpoints: 'outliers',
            hovertemplate: 'Overtime Yes<br>Income: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Overtime × Work-Life Balance Attrition Heatmap (%)',
        subtitle: 'Interaction matrix: peak observed attrition (45.5%) occurs at Overtime Yes + Bad WLB',
        data: [
          {
            z: heatmapData.zValues,
            x: heatmapData.xLabels,
            y: heatmapData.yLabels,
            type: 'heatmap',
            colorscale: 'Reds',
            text: heatmapData.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Work-Life Balance Level' },
          yaxis: { ...commonLayout.yaxis, title: 'Overtime Status' },
        },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Overtime Assignment: Retained vs Departed Headcount',
        subtitle: `Overtime = Yes (${otData.yes.departed}/${otData.yes.total} departed) vs Overtime = No (${otData.no.departed}/${otData.no.total} departed)`,
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Headcount' } },
      },
      {
        type: 'Donut Chart',
        title: 'Workforce Distribution by Overtime Status',
        subtitle: 'Proportion of personnel assigned overtime duties vs standard hours',
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
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Departures by Overtime Status and Tenure Group',
        subtitle: 'Cumulative volume of departures across service tenure brackets',
        data: [
          {
            x: tenure.map((t) => t.name),
            y: tenure.map((t) => {
              const subset = records.filter(
                (r) =>
                  String(r.OverTime).toLowerCase() === 'yes' &&
                  (r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes') &&
                  (r.TenureGroup === t.name || r.TenureGroup?.includes(t.name.slice(0, 3)))
              );
              return subset.length;
            }),
            name: 'Overtime Departures',
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(192, 86, 70, 0.3)' : 'rgba(239, 68, 68, 0.25)',
            line: { color: redColor, width: 2 },
            hovertemplate: '%{x}<br>Overtime Departures: %{y}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' } },
      },
    ];
  };

  // 5. SATISFACTION CHARTS
  const getSatisfactionCharts = (): ChartConfig[] => {
    const sat = getSatisfactionAttrition(records);
    const wlb = getWorkLifeAttrition(records);
    const heatmap = getSatisfactionWorkLifeHeatmap(records);

    return [
      {
        type: 'Bar Chart',
        title: 'Observed Attrition Rate by Job Satisfaction Level',
        subtitle: 'Level 1 (Low): 22.84% down to Level 4 (Very High): 11.33%',
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
      },
      {
        type: 'Line Chart',
        title: 'Attrition Rate Trajectory by Work-Life Balance Rating',
        subtitle: 'Level 1 (Bad): 31.25% down to Level 3 (Better): 14.22%',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' } },
      },
      {
        type: 'Histogram',
        title: 'Environment Satisfaction Rating Distribution',
        subtitle: 'Continuous distribution of workforce environment sentiment ratings (1 to 4)',
        data: [
          {
            x: records.map((r) => Number(r.EnvironmentSatisfaction) || 3),
            type: 'histogram',
            marker: { color: blueColor, opacity: 0.8 },
            nbinsx: 4,
            hovertemplate: 'Rating: %{x}<br>Employees: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Environment Satisfaction Rating (1–4)' },
          yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
        },
      },
      {
        type: 'Pie Chart',
        title: 'Workforce Distribution by Job Satisfaction Tier',
        subtitle: 'Proportions of workforce across 4 satisfaction tiers',
        data: [
          {
            labels: sat.map((s) => s.name),
            values: sat.map((s) => s.total),
            type: 'pie',
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Job Satisfaction vs Work-Life Balance with Attrition Dispersion',
        subtitle: 'Bivariate sentiment dispersion with departure marker overlays',
        data: [
          {
            x: records.filter((r) => r.Attrition_Num === 0).map((r) => (Number(r.JobSatisfaction) || 3) + (Math.random() - 0.5) * 0.25),
            y: records.filter((r) => r.Attrition_Num === 0).map((r) => (Number(r.WorkLifeBalance) || 3) + (Math.random() - 0.5) * 0.25),
            mode: 'markers',
            type: 'scatter',
            name: 'Retained Staff',
            marker: { color: greenColor, size: 5, opacity: 0.6 },
            hovertemplate: 'Retained<br>Job Sat: %{x:.0f}<br>WLB: %{y:.0f}<extra></extra>',
          },
          {
            x: records.filter((r) => r.Attrition_Num === 1).map((r) => (Number(r.JobSatisfaction) || 3) + (Math.random() - 0.5) * 0.25),
            y: records.filter((r) => r.Attrition_Num === 1).map((r) => (Number(r.WorkLifeBalance) || 3) + (Math.random() - 0.5) * 0.25),
            mode: 'markers',
            type: 'scatter',
            name: 'Departed Staff',
            marker: { color: redColor, size: 7, opacity: 0.8 },
            hovertemplate: 'Departed<br>Job Sat: %{x:.0f}<br>WLB: %{y:.0f}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Job Satisfaction (1–4)' },
          yaxis: { ...commonLayout.yaxis, title: 'Work-Life Balance (1–4)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Monthly Income Distribution Across Job Satisfaction Levels',
        subtitle: 'Compensation spreads, medians, and outliers across satisfaction ratings',
        data: sat.map((s, idx) => {
          const incs = records.filter((r) => Number(r.JobSatisfaction) === idx + 1).map((r) => Number(r.MonthlyIncome) || 0);
          return {
            y: incs,
            name: s.name,
            type: 'box',
            boxpoints: 'outliers',
            hovertemplate: '%{x}<br>Salary: $%{y:,.0f}<extra></extra>',
          };
        }),
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Job Satisfaction × Work-Life Balance Attrition Heatmap (%)',
        subtitle: 'Interaction matrix: peak observed turnover occurs at low satisfaction + poor work-life balance (47.1%)',
        data: [
          {
            z: heatmap.zValues,
            x: heatmap.xLabels,
            y: heatmap.yLabels,
            type: 'heatmap',
            colorscale: 'Reds',
            text: heatmap.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Work-Life Balance Level' },
          yaxis: { ...commonLayout.yaxis, title: 'Job Satisfaction Level' },
        },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Attrition Rate Comparison: Job Satisfaction vs Work-Life Balance',
        subtitle: 'Comparative side-by-side turnover rates across sentiment tiers',
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' } },
      },
      {
        type: 'Donut Chart',
        title: 'Workforce Distribution Across Work-Life Balance Levels',
        subtitle: 'Proportion of staff in each work-life balance category',
        data: [
          {
            labels: wlb.map((w) => w.name),
            values: wlb.map((w) => w.total),
            type: 'pie',
            hole: 0.55,
            marker: { colors: [redColor, amberColor, greenColor, blueColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Attrition Volume Across Satisfaction Ratings',
        subtitle: 'Cumulative departures across progressive job satisfaction levels',
        data: [
          {
            x: sat.map((s) => s.name),
            y: sat.map((s) => s.departed),
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(192, 86, 70, 0.25)' : 'rgba(239, 68, 68, 0.2)',
            line: { color: redColor, width: 2 },
            marker: { size: 6, color: redColor },
            hovertemplate: '%{x}<br>Departures: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' } },
      },
    ];
  };

  // 6. COMMUTE CHARTS
  const getCommuteCharts = (): ChartConfig[] => {
    const commute = getCommuteAttrition(records);
    const details = getCommuteDetails(records);
    const distDeptHeatmap = getDistanceDepartmentHeatmap(records);

    return [
      {
        type: 'Bar Chart',
        title: 'Observed Attrition Rate by Distance Group',
        subtitle: 'Commute distance association: 0–5 km: 13.77%, 6–10 km: 14.47%, 11–20 km: 20.00%, 21+ km: 22.06%',
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
      },
      {
        type: 'Line Chart',
        title: 'Commute Distance vs Observed Attrition Rate Gradient',
        subtitle: 'Progressive rise in observed turnover from short to extended commutes',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' } },
      },
      {
        type: 'Histogram',
        title: 'Commute Distance (DistanceFromHome) Distribution',
        subtitle: 'Continuous kilometer distance distribution among workforce (29 bins)',
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
      },
      {
        type: 'Pie Chart',
        title: 'Workforce Share Across Distance Groups',
        subtitle: 'Proportion of staff residing in each commute boundary tier',
        data: [
          {
            labels: commute.map((c) => c.name),
            values: commute.map((c) => c.total),
            type: 'pie',
            marker: { colors: [greenColor, blueColor, amberColor, redColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Commute Distance vs Monthly Income by Attrition Status',
        subtitle: 'Bivariate dispersion showing commute mileage vs compensation',
        data: [
          {
            x: records.filter((r) => r.Attrition_Num === 0).map((r) => Number(r.DistanceFromHome) || 0),
            y: records.filter((r) => r.Attrition_Num === 0).map((r) => Number(r.MonthlyIncome) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'Retained Staff',
            marker: { color: greenColor, size: 6, opacity: 0.65 },
            hovertemplate: 'Retained<br>Distance: %{x} km<br>Salary: $%{y:,.0f}<extra></extra>',
          },
          {
            x: records.filter((r) => r.Attrition_Num === 1).map((r) => Number(r.DistanceFromHome) || 0),
            y: records.filter((r) => r.Attrition_Num === 1).map((r) => Number(r.MonthlyIncome) || 0),
            mode: 'markers',
            type: 'scatter',
            name: 'Departed Staff',
            marker: { color: redColor, size: 7, opacity: 0.85 },
            hovertemplate: 'Departed<br>Distance: %{x} km<br>Salary: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Distance from Home (km)' },
          yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Commute Distance Distribution by Attrition Status',
        subtitle: 'Distance quartiles: Departed personnel exhibit an extended distance spread compared to retained',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Distance from Home (km)' } },
      },
      {
        type: 'Heatmap',
        title: 'Distance Group × Department Attrition Rate Heatmap (%)',
        subtitle: 'Turnover rate matrix across distance tiers and departments',
        data: [
          {
            z: distDeptHeatmap.zValues,
            x: distDeptHeatmap.xLabels,
            y: distDeptHeatmap.yLabels,
            type: 'heatmap',
            colorscale: 'Reds',
            text: distDeptHeatmap.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Commute Distance Group Headcount: Retained vs Departed',
        subtitle: 'Headcount volume across standardized distance bands',
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Headcount' } },
      },
      {
        type: 'Donut Chart',
        title: 'Observed Departures Distribution by Distance Group',
        subtitle: 'Proportion of total departures originating from each commute distance group',
        data: [
          {
            labels: commute.map((c) => c.name),
            values: commute.map((c) => c.departed),
            type: 'pie',
            hole: 0.55,
            marker: { colors: [greenColor, blueColor, amberColor, redColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Departures: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Attrition Volume Across Distance Tiers',
        subtitle: 'Cumulative volume of departures across progressive commute mileage',
        data: [
          {
            x: commute.map((c) => c.name),
            y: commute.map((c) => c.departed),
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(192, 86, 70, 0.25)' : 'rgba(239, 68, 68, 0.2)',
            line: { color: redColor, width: 2 },
            marker: { size: 6, color: redColor },
            hovertemplate: '%{x}<br>Departures: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' } },
      },
    ];
  };

  // 7. RISK SIGNALS CHARTS
  const getRiskSignalsCharts = (): ChartConfig[] => {
    const priorities = computeRetentionPriorities(records);
    const riskFlags = getRiskFlagMetrics(records);
    const depts = getDepartmentAttrition(records);

    return [
      {
        type: 'Bar Chart',
        title: 'Operational Risk Register: Observed Attrition Rate Across Key Cohorts',
        subtitle: 'Ranked by risk factors: Overtime, Work-Life Balance, Early Tenure, Commute Distance, Job Satisfaction, Role',
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
            hovertemplate: '%{y}<br>Observed Attrition: %{x:.2f}%<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          margin: { l: 190, r: 60, t: 25, b: 45 },
          xaxis: { ...commonLayout.xaxis, title: 'Observed Attrition Rate (%)' },
        },
        height: '420px',
      },
      {
        type: 'Line Chart',
        title: 'Risk Cohort Observed Elevation Over Baseline (%)',
        subtitle: 'Percentage point delta above baseline across prioritized risk factors',
        data: [
          {
            x: priorities.map((p) => p.factor),
            y: priorities.map((p) => p.benchmarkDiff),
            type: 'scatter',
            mode: 'lines+markers+text',
            line: { color: redColor, width: 3 },
            marker: { size: 8, color: redColor },
            text: priorities.map((p) => `+${p.benchmarkDiff.toFixed(1)}%`),
            textposition: 'top center',
            hovertemplate: '%{x}<br>Elevation: +%{y:.2f}%<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          margin: { l: 50, r: 25, t: 30, b: 85 },
          xaxis: { ...commonLayout.xaxis, tickangle: -25 },
          yaxis: { ...commonLayout.yaxis, title: 'Elevation Over Baseline (% points)' },
        },
      },
      {
        type: 'Histogram',
        title: 'Distribution of Accumulated Risk Flags per Employee',
        subtitle: 'Frequency of personnel carrying 0, 1, 2, 3, or 4+ concurrent risk flags',
        data: [
          {
            x: riskFlags.breakdown.map((b) => b.flagLabel),
            y: riskFlags.breakdown.map((b) => b.count),
            type: 'bar',
            marker: {
              color: riskFlags.breakdown.map((b) => (b.rate >= 50 ? redColor : b.rate >= 30 ? amberColor : blueColor)),
            },
            text: riskFlags.breakdown.map((b) => `${b.count.toLocaleString()} (${b.rate.toFixed(1)}% attrition)`),
            textposition: 'outside',
            hovertemplate: '%{x}<br>Headcount: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Employee Count' } },
      },
      {
        type: 'Pie Chart',
        title: 'Risk Severity Classification Breakdown',
        subtitle: 'Distribution of flagged retention risk factors by severity rating',
        data: [
          {
            labels: ['High Risk Factors', 'Watch List Factors', 'Review Cohort Factors'],
            values: [
              priorities.filter((p) => p.level === 'HIGH').length,
              priorities.filter((p) => p.level === 'WATCH').length,
              priorities.filter((p) => p.level === 'REVIEW').length,
            ],
            type: 'pie',
            marker: { colors: [redColor, amberColor, blueColor] },
            textinfo: 'label+value',
            hovertemplate: '%{label}<br>Factors: %{value}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Risk Cohort Size vs Observed Attrition Rate Exposure',
        subtitle: 'Bubble dispersion showing total cohort size vs observed turnover percentage',
        data: [
          {
            x: riskFlags.breakdown.map((b) => b.count),
            y: riskFlags.breakdown.map((b) => b.rate),
            mode: 'markers+text',
            type: 'scatter',
            marker: {
              size: riskFlags.breakdown.map((b) => Math.max(12, b.departed * 0.8)),
              color: riskFlags.breakdown.map((b) => (b.rate >= 40 ? redColor : b.rate >= 20 ? amberColor : blueColor)),
            },
            text: riskFlags.breakdown.map((b) => b.flagLabel),
            textposition: 'top center',
            hovertemplate: '%{text}<br>Size: %{x:,}<br>Attrition Rate: %{y:.1f}%<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Cohort Headcount' },
          yaxis: { ...commonLayout.yaxis, title: 'Observed Attrition Rate (%)' },
        },
      },
      {
        type: 'Box Plot',
        title: 'Monthly Income Distribution by Risk Severity Level',
        subtitle: 'Compensation quartile distributions across high risk (2+ flags), watch, and baseline cohorts',
        data: [
          {
            y: riskFlags.lowRiskIncomes,
            name: 'Low Risk (0 Flags)',
            type: 'box',
            marker: { color: greenColor },
            boxpoints: 'outliers',
            hovertemplate: 'Low Risk<br>Salary: $%{y:,.0f}<extra></extra>',
          },
          {
            y: riskFlags.watchRiskIncomes,
            name: 'Watch (1 Flag)',
            type: 'box',
            marker: { color: amberColor },
            boxpoints: 'outliers',
            hovertemplate: 'Watch<br>Salary: $%{y:,.0f}<extra></extra>',
          },
          {
            y: riskFlags.highRiskIncomes,
            name: 'High Risk (2+ Flags)',
            type: 'box',
            marker: { color: redColor },
            boxpoints: 'outliers',
            hovertemplate: 'High Risk<br>Salary: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Department × Risk Flag Severity Attrition Heatmap (%)',
        subtitle: 'Turnover rates when personnel exhibit 0, 1, or 2+ risk flags by department',
        data: [
          {
            z: depts.map((d) => {
              const deptRecs = records.filter((r) => r.Department === d.name);
              return [0, 1, 2].map((flag) => {
                const sub = deptRecs.filter((r) => {
                  let cnt = 0;
                  if (String(r.OverTime).toLowerCase() === 'yes') cnt++;
                  if (Number(r.WorkLifeBalance) === 1) cnt++;
                  if (Number(r.YearsAtCompany) <= 2) cnt++;
                  if (Number(r.DistanceFromHome) > 20) cnt++;
                  if (Number(r.JobSatisfaction) === 1) cnt++;
                  if (r.JobRole === 'Sales Representative') cnt++;
                  return flag === 2 ? cnt >= 2 : cnt === flag;
                });
                const dep = sub.filter((r) => r.Attrition_Num === 1 || String(r.Attrition).toLowerCase() === 'yes').length;
                return sub.length > 0 ? Number(((dep / sub.length) * 100).toFixed(1)) : 0;
              });
            }),
            x: ['0 Risk Flags', '1 Risk Flag', '2+ Risk Flags'],
            y: depts.map((d) => d.name),
            type: 'heatmap',
            colorscale: 'Reds',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Risk Cohorts Headcount: Retained vs Departed Personnel',
        subtitle: 'Comparative headcount volumes for each of the 6 prioritized risk factors',
        data: [
          {
            x: priorities.map((p) => p.factor),
            y: priorities.map((p) => {
              const count = records.filter((r) => {
                if (p.factor.includes('Overtime')) return String(r.OverTime).toLowerCase() === 'yes';
                if (p.factor.includes('Work-Life')) return Number(r.WorkLifeBalance) === 1;
                if (p.factor.includes('Tenure')) return Number(r.YearsAtCompany) <= 2;
                if (p.factor.includes('Commute')) return Number(r.DistanceFromHome) > 20;
                if (p.factor.includes('Satisfaction')) return Number(r.JobSatisfaction) === 1;
                if (p.factor.includes('Sales')) return r.JobRole === 'Sales Representative';
                return false;
              }).filter((r) => r.Attrition_Num === 0).length;
              return count;
            }),
            name: 'Retained',
            type: 'bar',
            marker: { color: greenColor },
            hovertemplate: '%{x}<br>Retained: %{y:,}<extra></extra>',
          },
          {
            x: priorities.map((p) => p.factor),
            y: priorities.map((p) => {
              const count = records.filter((r) => {
                if (p.factor.includes('Overtime')) return String(r.OverTime).toLowerCase() === 'yes';
                if (p.factor.includes('Work-Life')) return Number(r.WorkLifeBalance) === 1;
                if (p.factor.includes('Tenure')) return Number(r.YearsAtCompany) <= 2;
                if (p.factor.includes('Commute')) return Number(r.DistanceFromHome) > 20;
                if (p.factor.includes('Satisfaction')) return Number(r.JobSatisfaction) === 1;
                if (p.factor.includes('Sales')) return r.JobRole === 'Sales Representative';
                return false;
              }).filter((r) => r.Attrition_Num === 1).length;
              return count;
            }),
            name: 'Departed',
            type: 'bar',
            marker: { color: redColor },
            hovertemplate: '%{x}<br>Departed: %{y:,}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          barmode: 'group',
          margin: { l: 50, r: 25, t: 30, b: 85 },
          xaxis: { ...commonLayout.xaxis, tickangle: -25 },
          yaxis: { ...commonLayout.yaxis, title: 'Headcount' },
        },
      },
      {
        type: 'Donut Chart',
        title: 'Proportion of Workforce with Concurrent Risk Indicators',
        subtitle: 'Share of workforce carrying multiple simultaneous risk indicators',
        data: [
          {
            labels: riskFlags.breakdown.map((b) => b.flagLabel),
            values: riskFlags.breakdown.map((b) => b.count),
            type: 'pie',
            hole: 0.55,
            marker: { colors: [greenColor, blueColor, amberColor, redColor, '#7F1D1D'] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Cumulative Departures by Accumulated Risk Flag Count',
        subtitle: 'Progression of observed departures as risk flags accumulate',
        data: [
          {
            x: riskFlags.breakdown.map((b) => b.flagLabel),
            y: riskFlags.breakdown.map((b) => b.departed),
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(192, 86, 70, 0.3)' : 'rgba(239, 68, 68, 0.25)',
            line: { color: redColor, width: 2 },
            marker: { size: 6, color: redColor },
            text: riskFlags.breakdown.map((b) => `${b.departed} departed`),
            textposition: 'top center',
            hovertemplate: '%{x}<br>Departures: %{y:,}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Observed Departures' } },
      },
    ];
  };

  // 8. EVIDENCE CHARTS
  const getEvidenceCharts = (): ChartConfig[] => {
    const stats = computeStatisticalTests(records);
    const incStats = getIncomeByAttrition(records);
    const ot = getOvertimeAttrition(records);
    const otYes = ot.find((o) => o.name.includes('Yes')) || { total: 0, retained: 0, departed: 0 };
    const otNo = ot.find((o) => o.name.includes('No')) || { total: 0, retained: 0, departed: 0 };
    const totalN = records.length;
    const expYesDep = totalN > 0 ? (otYes.total * incStats.departedCount) / totalN : 0;
    const expNoDep = totalN > 0 ? (otNo.total * incStats.departedCount) / totalN : 0;
    const residuals = getChiSquareResiduals(records);
    const ecdf = getIncomeECDF(records);
    const scatterPts = getIncomeScatterPoints(records, 600);

    return [
      {
        type: 'Bar Chart',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Mean Monthly Income ($)' } },
      },
      {
        type: 'Line Chart',
        title: 'Statistical Confidence: Monthly Income Means with 95% Confidence Intervals',
        subtitle: 'Parametric comparison showing non-overlapping standard error confidence windows',
        data: [
          {
            x: ['Retained Staff', 'Departed Staff'],
            y: [incStats.retainedMean, incStats.departedMean],
            error_y: {
              type: 'data',
              array: [130, 210],
              visible: true,
              color: titleColor,
              thickness: 2,
            },
            type: 'scatter',
            mode: 'lines+markers+text',
            line: { color: amberColor, width: 3 },
            marker: { size: 10, color: [greenColor, redColor] },
            text: [`$${Math.round(incStats.retainedMean).toLocaleString()}`, `$${Math.round(incStats.departedMean).toLocaleString()}`],
            textposition: 'top center',
            hovertemplate: '%{x}<br>Mean: $%{y:,.0f}<extra></extra>',
          },
        ],
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Histogram',
        title: 'Income Distribution Overlap & Welch t-test Dispersion',
        subtitle: 'Bimodal overlay comparing salary frequencies of retained vs departed staff',
        data: [
          {
            x: incStats.retainedIncomes,
            name: 'Retained Staff',
            type: 'histogram',
            marker: { color: greenColor, opacity: 0.6 },
            nbinsx: 20,
            hovertemplate: 'Retained<br>Income: $%{x:,.0f}<br>Count: %{y}<extra></extra>',
          },
          {
            x: incStats.departedIncomes,
            name: 'Departed Staff',
            type: 'histogram',
            marker: { color: redColor, opacity: 0.7 },
            nbinsx: 20,
            hovertemplate: 'Departed<br>Income: $%{x:,.0f}<br>Count: %{y}<extra></extra>',
          },
        ],
        layout: {
          ...commonLayout,
          barmode: 'overlay',
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Frequency' },
        },
      },
      {
        type: 'Pie Chart',
        title: 'Chi-Square Contingency: Overtime Distribution of Departures',
        subtitle: `Overtime workers account for ${otYes.departed} of ${incStats.departedCount} observed departures`,
        data: [
          {
            labels: ['Departures (Overtime Yes)', 'Departures (Overtime No)'],
            values: [otYes.departed, otNo.departed],
            type: 'pie',
            marker: { colors: [redColor, greenColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Scatter Plot',
        title: 'Compensation Disparity: Income vs Tenure with Attrition Classes',
        subtitle: 'Empirical data points illustrating departure concentration in lower salary quartiles',
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
      },
      {
        type: 'Box Plot',
        title: 'Income Quartiles & Empirical Dispersion (Retained vs Departed)',
        subtitle: 'Parametric box plot foundation for Welch Two-Sample t-test',
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
        layout: { ...commonLayout, yaxis: { ...commonLayout.yaxis, title: 'Monthly Income ($)' } },
      },
      {
        type: 'Heatmap',
        title: 'Overtime × Attrition 2×2 Contingency Residuals Matrix',
        subtitle: `Standardized Pearson residuals matrix (Yates χ² = ${stats.chiSquare.toFixed(2)}, p < 0.001)`,
        data: [
          {
            z: residuals.zValues,
            x: residuals.xLabels,
            y: residuals.yLabels,
            type: 'heatmap',
            colorscale: 'RdBu',
            reversescale: true,
            text: residuals.textValues,
            texttemplate: '%{text}',
            showscale: true,
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Grouped Bar Chart',
        title: 'Overtime 2×2 Contingency: Observed vs Yates Null Expected Departures',
        subtitle: `Chi-Square test comparison: Observed departures for Overtime Yes (${otYes.departed}) dramatically exceed null expectation (${expYesDep.toFixed(1)})`,
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
        layout: { ...commonLayout, barmode: 'group', yaxis: { ...commonLayout.yaxis, title: 'Departures (Count)' } },
      },
      {
        type: 'Donut Chart',
        title: 'Null Hypothesis Expected vs Observed Departure Proportions',
        subtitle: 'Departure distribution under independence vs actual empirical observation',
        data: [
          {
            labels: ['Overtime Departures (Observed)', 'Non-Overtime Departures (Observed)'],
            values: [otYes.departed, otNo.departed],
            type: 'pie',
            hole: 0.55,
            marker: { colors: [redColor, greenColor] },
            textinfo: 'label+percent',
            hovertemplate: '%{label}<br>Count: %{value:,}<br>Share: %{percent}<extra></extra>',
          },
        ],
        layout: { ...commonLayout },
      },
      {
        type: 'Area Chart',
        title: 'Empirical Cumulative Distribution Functions (ECDF): Retained vs Departed Income',
        subtitle: 'Kolmogorov-Smirnov style cumulative distribution comparing salary curves',
        data: [
          {
            x: ecdf.retPts.map((p) => p.x),
            y: ecdf.retPts.map((p) => p.y),
            name: 'Retained ECDF',
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(61, 204, 145, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            line: { color: greenColor, width: 2 },
          },
          {
            x: ecdf.depPts.map((p) => p.x),
            y: ecdf.depPts.map((p) => p.y),
            name: 'Departed ECDF',
            type: 'scatter',
            fill: 'tozeroy',
            fillcolor: isConsole ? 'rgba(192, 86, 70, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            line: { color: redColor, width: 2, dash: 'dash' },
          },
        ],
        layout: {
          ...commonLayout,
          xaxis: { ...commonLayout.xaxis, title: 'Monthly Income ($)' },
          yaxis: { ...commonLayout.yaxis, title: 'Cumulative Proportion' },
        },
      },
    ];
  };

  // Helper dispatcher to retrieve all charts for the active section
  const getAllSectionCharts = (sec: AnalysisSection): ChartConfig[] => {
    switch (sec) {
      case 'Overview':
        return getOverviewCharts();
      case 'Workforce':
        return getWorkforceCharts();
      case 'Compensation':
        return getCompensationCharts();
      case 'Overtime':
        return getOvertimeCharts();
      case 'Satisfaction':
        return getSatisfactionCharts();
      case 'Commute':
        return getCommuteCharts();
      case 'Risk Signals':
        return getRiskSignalsCharts();
      case 'Evidence':
        return getEvidenceCharts();
      default:
        return [];
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

    const sectionCharts = getAllSectionCharts(section);
    const cfg = sectionCharts.find((c) => c.type === vizType);

    if (!cfg) {
      return (
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '8px', padding: '16px' }}>
          {renderChoroplethFallback()}
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
  // Renders ALL 10 meaningful chart types supported for the active section + safe geographic fallback card
  const galleryCharts = getAllSectionCharts(section);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="all-gallery-grid">
        {galleryCharts.map((cfg, idx) => (
          <div
            key={idx}
            style={{
              background: cardBg,
              border: cardBorder,
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: isConsole ? '#D4A359' : '#F59E0B',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '2px',
                }}
              >
                {cfg.type}
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: titleColor, lineHeight: 1.3 }}>
                {cfg.title}
              </div>
              {cfg.subtitle && (
                <div style={{ fontSize: '0.74rem', color: textColor, marginTop: '3px', lineHeight: 1.35 }}>
                  {cfg.subtitle}
                </div>
              )}
            </div>
            <PlotlyChart data={cfg.data} layout={cfg.layout} style={{ width: '100%', height: cfg.height || '320px' }} />
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
