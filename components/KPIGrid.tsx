'use client';

import React from 'react';
import { KPIMetrics, ThemeMode } from '@/lib/types';
import { BENCHMARK_ATTRITION_RATE } from '@/lib/calculations';

interface KPIGridProps {
  metrics: KPIMetrics;
  theme: ThemeMode;
}

export default function KPIGrid({ metrics, theme }: KPIGridProps) {
  const isConsole = theme === 'console';
  const diff = metrics.attritionRate - BENCHMARK_ATTRITION_RATE;
  const isHigh = metrics.attritionRate > 20;
  const isWatch = metrics.attritionRate > 12 && metrics.attritionRate <= 20;

  const cardBg = isConsole ? '#161D24' : '#1E293B';
  const borderCol = isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)';
  const labelCol = isConsole ? '#8A9BA8' : '#94A3B8';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      {/* 1. Total Employees */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: labelCol, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          TOTAL EMPLOYEES
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isConsole ? '#F1F5F9' : '#FFFFFF', margin: '4px 0' }}>
          {metrics.totalCount.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.76rem', color: isConsole ? '#3DCC91' : '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>●</span> {metrics.retainedCount.toLocaleString()} retained active
        </div>
      </div>

      {/* 2. Employees Departed */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: labelCol, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          EMPLOYEES DEPARTED
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isConsole ? '#E57373' : '#EF4444', margin: '4px 0' }}>
          {metrics.departedCount.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.76rem', color: labelCol }}>
          Observed voluntary departures
        </div>
      </div>

      {/* 3. Attrition Rate */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: labelCol, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          ATTRITION RATE
        </div>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: isHigh ? (isConsole ? '#E57373' : '#EF4444') : isWatch ? (isConsole ? '#F59E0B' : '#FBBF24') : (isConsole ? '#3DCC91' : '#10B981'),
            margin: '4px 0',
          }}
        >
          {metrics.attritionRate.toFixed(2)}%
        </div>
        <div style={{ fontSize: '0.76rem', color: labelCol }}>
          Observed attrition • Benchmark: {BENCHMARK_ATTRITION_RATE}%
        </div>
      </div>

      {/* 4. Retained Workforce Mean Income */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: labelCol, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          RETAINED WORKFORCE MEAN
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isConsole ? '#3DCC91' : '#34D399', margin: '4px 0' }}>
          ${Math.round(metrics.retainedMeanIncome).toLocaleString()}
        </div>
        <div style={{ fontSize: '0.76rem', color: labelCol }}>
          Average monthly compensation
        </div>
      </div>
    </div>
  );
}
