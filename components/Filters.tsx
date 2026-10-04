'use client';

import React, { useMemo } from 'react';
import { EmployeeRecord, FilterState, ThemeMode } from '@/lib/types';
import { ChevronDown, Filter, RotateCcw } from 'lucide-react';

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
  const genders = ['All', 'Female', 'Male'];
  const attritions = ['All', 'Yes', 'No'];

  const isFiltered =
    filters.department !== 'All' ||
    filters.jobRole !== 'All' ||
    filters.overtime !== 'All' ||
    filters.businessTravel !== 'All' ||
    filters.gender !== 'All' ||
    filters.attrition !== 'All';

  const handleReset = () => {
    setFilters({
      department: 'All',
      jobRole: 'All',
      overtime: 'All',
      businessTravel: 'All',
      gender: 'All',
      attrition: 'All',
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} style={{ color: isConsole ? '#D4A359' : '#F59E0B' }} />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: labelCol,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            WORKFORCE FILTER CONSOLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '4px',
              background: isFiltered
                ? isConsole ? 'rgba(212, 163, 89, 0.15)' : 'rgba(245, 158, 11, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              color: isFiltered
                ? isConsole ? '#D4A359' : '#FBBF24'
                : '#94A3B8',
              border: `1px solid ${
                isFiltered
                  ? isConsole ? '#D4A359' : '#F59E0B'
                  : 'rgba(255, 255, 255, 0.06)'
              }`,
              fontWeight: 600,
            }}
          >
            {isFiltered
              ? `Filtered Workforce: ${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} Personnel`
              : `Full Benchmark Cohort: ${totalCount.toLocaleString()} Personnel`}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 100px',
          gap: '10px',
          alignItems: 'end',
        }}
      >
        {/* 1. Department */}
        <div>
          <label
            htmlFor="filter-department-select"
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
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
                  jobRole: 'All',
                }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
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
              size={13}
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
            htmlFor="filter-jobrole-select"
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
          >
            Job Role
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-jobrole-select"
              value={filters.jobRole}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, jobRole: e.target.value }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
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
              size={13}
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
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
          >
            OverTime
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-overtime-select"
              value={filters.overtime}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, overtime: e.target.value }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {overtimes.map((o) => (
                <option key={o} value={o} style={{ background: '#0D1117' }}>
                  {o === 'All' ? 'All OverTime' : `OverTime: ${o}`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
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
            htmlFor="filter-travel-select"
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
          >
            Business Travel
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-travel-select"
              value={filters.businessTravel}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, businessTravel: e.target.value }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {travels.map((t) => (
                <option key={t} value={t} style={{ background: '#0D1117' }}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
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

        {/* 5. Gender */}
        <div>
          <label
            htmlFor="filter-gender-select"
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
          >
            Gender
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-gender-select"
              value={filters.gender}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, gender: e.target.value }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {genders.map((g) => (
                <option key={g} value={g} style={{ background: '#0D1117' }}>
                  {g === 'All' ? 'All Genders' : g}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
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

        {/* 6. Attrition Status */}
        <div>
          <label
            htmlFor="filter-attrition-select"
            style={{ fontSize: '0.72rem', color: labelCol, display: 'block', marginBottom: '3px' }}
          >
            Attrition
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="filter-attrition-select"
              value={filters.attrition}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, attrition: e.target.value }));
              }}
              style={{
                width: '100%',
                height: '36px',
                background: selectBg,
                border: `1px solid ${borderCol}`,
                borderRadius: '6px',
                padding: '0 26px 0 8px',
                color: '#F1F5F9',
                fontSize: '0.8rem',
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {attritions.map((a) => (
                <option key={a} value={a} style={{ background: '#0D1117' }}>
                  {a === 'All' ? 'All Status' : a === 'Yes' ? 'Departed (Yes)' : 'Retained (No)'}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
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

        {/* 7. Reset Button */}
        <div>
          <button
            onClick={handleReset}
            disabled={!isFiltered}
            style={{
              width: '100%',
              height: '36px',
              background: isFiltered
                ? isConsole ? 'rgba(212, 163, 89, 0.15)' : 'rgba(245, 158, 11, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${
                isFiltered
                  ? isConsole ? '#D4A359' : '#F59E0B'
                  : borderCol
              }`,
              borderRadius: '6px',
              color: isFiltered
                ? isConsole ? '#D4A359' : '#FBBF24'
                : '#64748B',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isFiltered ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
