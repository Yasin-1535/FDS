'use client';

import React, { useRef, useState } from 'react';
import { ThemeMode } from '@/lib/types';
import { parseAndValidateCSV } from '@/lib/calculations';
import { Download, FileUp, Moon, RefreshCw, Sun, UploadCloud } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  isCustomData: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onDataUpload: (records: any[]) => void;
  onRestoreBenchmark: () => void;
  onExportCSV: () => void;
}

export default function Header({
  totalCount,
  isCustomData,
  theme,
  setTheme,
  onDataUpload,
  onRestoreBenchmark,
  onExportCSV,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConsole = theme === 'console';
  const borderCol = isConsole ? '#364350' : 'rgba(255, 255, 255, 0.08)';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { records, errors } = parseAndValidateCSV(text);
      if (errors.length > 0) {
        setErrorMessage(errors.join('\n'));
      } else {
        setErrorMessage(null);
        onDataUpload(records);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 0 20px 0',
        borderBottom: `1px solid ${borderCol}`,
        marginBottom: '20px',
      }}
    >
      {/* Brand & Subtitle */}
      <div>
        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: isConsole ? '#EDE6D6' : '#F1F5F9',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          PREDICT &amp; RETAIN
        </h1>
        <div style={{ fontSize: '0.8rem', color: isConsole ? '#8A9BA8' : '#94A3B8', marginTop: '2px' }}>
          Workforce Intelligence &amp; Attrition Analytics
        </div>
      </div>

      {/* Controls & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${borderCol}`,
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            color: '#94A3B8',
          }}
        >
          <span style={{ color: isCustomData ? '#F59E0B' : '#10B981', fontWeight: 800 }}>●</span>
          {isCustomData ? 'Custom Dataset' : 'Dataset Ready'} ({totalCount.toLocaleString()})
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isConsole ? 'modern' : 'console')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${borderCol}`,
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            color: isConsole ? '#EDE6D6' : '#F1F5F9',
            cursor: 'pointer',
          }}
          title="Toggle Visual Theme"
        >
          {isConsole ? <Sun size={14} color="#D4A359" /> : <Moon size={14} color="#60A5FA" />}
          {isConsole ? 'Historical Console' : 'Modern Analytics'}
        </button>

        {/* Upload Custom CSV */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#60A5FA',
            cursor: 'pointer',
          }}
          title="Upload single workforce CSV dataset"
        >
          <FileUp size={14} />
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Restore Benchmark */}
        {isCustomData && (
          <button
            onClick={onRestoreBenchmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#FBBF24',
              cursor: 'pointer',
            }}
            title="Restore original 1,470 benchmark dataset"
          >
            <RefreshCw size={14} />
            Restore Benchmark
          </button>
        )}

        {/* Export Filtered CSV */}
        <button
          onClick={onExportCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#34D399',
            cursor: 'pointer',
          }}
          title="Export active filtered workforce dataset to CSV"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Validation Error Banner */}
      {errorMessage && (
        <div
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '6px',
            padding: '10px 14px',
            color: '#FCA5A5',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}
        >
          <div>
            <strong>CSV Validation Error:</strong> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
}
