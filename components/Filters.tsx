'use client';

import React, { useMemo } from 'react';
import { EmployeeRecord, FilterState, ThemeMode } from '@/lib/types';
import { ChevronDown, RotateCcw } from 'lucide-react';

interface FiltersProps {
  records: EmployeeRecord[];
  filteredCount: number;
  totalCount: number;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  theme: ThemeMode;
}

export default function Filters({
  records,
  filteredCount,
  totalCount,
  filters,
  setFilters,
  theme,
}: FiltersProps) {
  const isConsole = theme === 'console';

  const containerBg = isConsole ? '#161D24' : '#1E293B';
  const borderCol = isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)';
  const labelCol = isConsole ? '#8A9BA8' : '#94A3B8';
  const selectBg = isConsole ? '#0D1117' : '#0F172A';

  // Compute unique filter options
  const departments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.Department) set.add(r.Department);
    });
    return ['All', ...Array.from(set).sort()];
  }, [records]);

  const jobRoles = useMemo(() => {
    const set = new Set<string>();
    const subset =
      filters.department === 'All'
        ? records
        : records.filter((r) => r.Department === filters.department);

    subset.forEach((r) => {
      if (r.JobRole) set.add(r.JobRole);
    });
    return ['All', ...Array.from(set).sort()];
  }, [records, filters.department]);

  const overtimes = ['All', 'Yes', 'No'];
  const travels = ['All', 'Travel_Rarely', 'Travel_Frequently', 'Non-Travel'];

  const handleReset = () => {
    setFilters({
      department: 'All',
      jobRole: 'All',
      overtime: 'All',
      businessTravel: 'All',
    });
  };

  return (
    <div
      style={{
        background: containerBg,
        border: `1px solid ${borderCol}`,
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: labelCol,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        FILTER WORKFORCE
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) 100px',
          gap: '12px',
          alignItems: 'end',
        }}
      >
        {/* 1. Department */}
        <div>
          <label
            htmlFor="filter-department-select"
            style={{ fontSize: '0.75rem', color: labelCol, display: 'block', marginBottom: '4px' }}
          >
            Department
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-department-select"
              value={filters.department}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  department: e.target.value,
                  jobRole: 'All', // Reset role on department change
                }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 28px 0 10px',
                color: '#F1F5F9',
                fontSize: '0.82rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {departments.map((d) => (
                <option key={d} value={d} style={{ background: '#0D1117' }}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: labelCol,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 2. Job Role */}
        <div>
          <label
            htmlFor="filter-job-role-select"
            style={{ fontSize: '0.75rem', color: labelCol, display: 'block', marginBottom: '4px' }}
          >
            Job Role
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-job-role-select"
              value={filters.jobRole}
              onChange={(e) => setFilters((prev) => ({ ...prev, jobRole: e.target.value }))}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 28px 0 10px',
                color: '#F1F5F9',
                fontSize: '0.82rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {jobRoles.map((r) => (
                <option key={r} value={r} style={{ background: '#0D1117' }}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: labelCol,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 3. Overtime */}
        <div>
          <label
            htmlFor="filter-overtime-select"
            style={{ fontSize: '0.75rem', color: labelCol, display: 'block', marginBottom: '4px' }}
          >
            OverTime
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-overtime-select"
              value={filters.overtime}
              onChange={(e) => setFilters((prev) => ({ ...prev, overtime: e.target.value }))}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 28px 0 10px',
                color: '#F1F5F9',
                fontSize: '0.82rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {overtimes.map((o) => (
                <option key={o} value={o} style={{ background: '#0D1117' }}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: labelCol,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 4. Business Travel */}
        <div>
          <label
            htmlFor="filter-business-travel-select"
            style={{ fontSize: '0.75rem', color: labelCol, display: 'block', marginBottom: '4px' }}
          >
            Business Travel
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-business-travel-select"
              value={filters.businessTravel}
              onChange={(e) => setFilters((prev) => ({ ...prev, businessTravel: e.target.value }))}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 28px 0 10px',
                color: '#F1F5F9',
                fontSize: '0.82rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {travels.map((t) => (
                <option key={t} value={t} style={{ background: '#0D1117' }}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: labelCol,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* 5. Reset Filters Button */}
        <div>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              height: '36px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              color: '#60A5FA',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '8px' }}>
        Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} employees
      </div>
    </div>
  );
}
