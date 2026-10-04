'use client';

import React from 'react';
import { AnalysisSection, ThemeMode, VisualizationType } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

interface VisualizationSelectorProps {
  section: AnalysisSection;
  setSection: (sec: AnalysisSection) => void;
  vizType: VisualizationType;
  setVizType: (vt: VisualizationType) => void;
  theme: ThemeMode;
}

const SECTIONS: AnalysisSection[] = [
  'Overview',
  'Workforce',
  'Compensation',
  'Overtime',
  'Satisfaction',
  'Commute',
  'Risk Signals',
  'Evidence',
];

const VIZ_TYPES: VisualizationType[] = [
  'ALL',
  'Bar Chart',
  'Line Chart',
  'Histogram',
  'Pie Chart',
  'Scatter Plot',
  'Box Plot',
  'Heatmap',
  'Grouped Bar Chart',
  'Donut Chart',
  'Area Chart',
  'Choropleth Map',
];

export default function VisualizationSelector({
  section,
  setSection,
  vizType,
  setVizType,
  theme,
}: VisualizationSelectorProps) {
  const isConsole = theme === 'console';

  const containerBg = isConsole ? '#161D24' : '#1E293B';
  const borderCol = isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)';
  const labelCol = isConsole ? '#8A9BA8' : '#94A3B8';
  const selectBg = isConsole ? '#0D1117' : '#0F172A';

  return (
    <div
      style={{
        background: containerBg,
        border: `1px solid ${borderCol}`,
        borderRadius: '8px',
        padding: '12px 16px',
        marginTop: '6px',
        marginBottom: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        alignItems: 'start',
      }}
    >
      {/* 1. Analysis Section Column */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label
          htmlFor="analysis-section-select"
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: labelCol,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '6px',
            height: '14px',
            lineHeight: '14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ANALYSIS SECTION
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            id="analysis-section-select"
            value={section}
            onChange={(e) => setSection(e.target.value as AnalysisSection)}
            style={{
              width: '100%',
              height: '42px',
              minHeight: '42px',
              background: selectBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '6px',
              padding: '0 36px 0 12px',
              color: '#F1F5F9',
              fontSize: '0.88rem',
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s} style={{ background: '#0D1117', color: '#F1F5F9' }}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: labelCol,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* 2. Visualization Type Column */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label
          htmlFor="visualization-type-select"
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: labelCol,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '6px',
            height: '14px',
            lineHeight: '14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          VISUALIZATION TYPE
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            id="visualization-type-select"
            value={vizType}
            onChange={(e) => setVizType(e.target.value as VisualizationType)}
            style={{
              width: '100%',
              height: '42px',
              minHeight: '42px',
              background: selectBg,
              border: `1px solid ${borderCol}`,
              borderRadius: '6px',
              padding: '0 36px 0 12px',
              color: '#F1F5F9',
              fontSize: '0.88rem',
              fontWeight: 500,
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {VIZ_TYPES.map((v) => (
              <option key={v} value={v} style={{ background: '#0D1117', color: '#F1F5F9' }}>
                {v}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: labelCol,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
