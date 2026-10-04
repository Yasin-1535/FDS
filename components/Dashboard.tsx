'use client';

import React, { useMemo, useState } from 'react';
import { AnalysisSection, EmployeeRecord, FilterState, ThemeMode, VisualizationType } from '@/lib/types';
import { BENCHMARK_DATA } from '@/lib/benchmarkData';
import { computeKPIMetrics, filterRecords } from '@/lib/calculations';
import Header from './Header';
import KPIGrid from './KPIGrid';
import Filters from './Filters';
import VisualizationSelector from './VisualizationSelector';
import SectionView from './SectionView';
import ChartRenderer from './charts/ChartRenderer';
import Papa from 'papaparse';

export default function Dashboard() {
  const [dataset, setDataset] = useState<EmployeeRecord[]>(BENCHMARK_DATA);
  const [isCustomData, setIsCustomData] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>('console');

  const [section, setSection] = useState<AnalysisSection>('Overview');
  const [vizType, setVizType] = useState<VisualizationType>('Bar Chart');

  const [filters, setFilters] = useState<FilterState>({
    department: 'All',
    jobRole: 'All',
    overtime: 'All',
    businessTravel: 'All',
  });

  // Dynamically filter active records
  const filteredRecords = useMemo(() => {
    return filterRecords(dataset, filters);
  }, [dataset, filters]);

  // Dynamically compute KPI metrics
  const kpiMetrics = useMemo(() => {
    return computeKPIMetrics(filteredRecords);
  }, [filteredRecords]);

  // Export filtered dataset to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const csv = Papa.unparse(filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `predict_retain_workforce_${section.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = (newRecords: EmployeeRecord[]) => {
    setDataset(newRecords);
    setIsCustomData(true);
  };

  const handleRestore = () => {
    setDataset(BENCHMARK_DATA);
    setIsCustomData(false);
  };

  const isConsole = theme === 'console';

  return (
    <div
      className={`min-h-screen ${isConsole ? 'theme-console' : 'theme-modern'}`}
      style={{
        background: isConsole ? '#0D1117' : '#0B0F19',
        color: isConsole ? '#C9D1D9' : '#E2E8F0',
        minHeight: '100vh',
        padding: '0 24px 40px 24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* 1. Header with Telemetry and Controls */}
        <Header
          totalCount={dataset.length}
          isCustomData={isCustomData}
          theme={theme}
          setTheme={setTheme}
          onDataUpload={handleUpload}
          onRestoreBenchmark={handleRestore}
          onExportCSV={handleExportCSV}
        />

        {/* 2. KPI Metrics Grid */}
        <KPIGrid metrics={kpiMetrics} theme={theme} />

        {/* 3. Primary Two-Column Aligned Workflow Controls */}
        <VisualizationSelector
          section={section}
          setSection={setSection}
          vizType={vizType}
          setVizType={setVizType}
          theme={theme}
        />

        {/* 4. Workforce Filter Bar */}
        <Filters
          records={dataset}
          filteredCount={filteredRecords.length}
          totalCount={dataset.length}
          filters={filters}
          setFilters={setFilters}
          theme={theme}
        />

        {/* 5. Section Narrative & Analytics Context */}
        <SectionView
          section={section}
          records={filteredRecords}
          metrics={kpiMetrics}
          theme={theme}
        />

        {/* 6. Dynamic Visualizations (Single or ALL Gallery) */}
        {filteredRecords.length > 0 ? (
          <ChartRenderer
            section={section}
            vizType={vizType}
            records={filteredRecords}
            theme={theme}
          />
        ) : (
          <div
            style={{
              background: isConsole ? '#161D24' : '#1E293B',
              border: `1px dashed ${isConsole ? '#364350' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '8px',
              padding: '36px 20px',
              textAlign: 'center',
              color: '#94A3B8',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '6px' }}>
              No Workforce Records Match Current Filter Selection
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              Adjust or reset the workforce filters above to display analytical representations.
            </div>
          </div>
        )}

        {/* Modern Enterprise Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '24px 0 16px 0',
            marginTop: '36px',
            borderTop: `1px solid ${isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)'}`,
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          Predict &amp; Retain — Workforce Intelligence &amp; Attrition Analytics &bull; Foundations of Data Science (FDS)
        </footer>
      </div>
    </div>
  );
}
