'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PlotlyChartProps {
  data: any[];
  layout: any;
  config?: any;
  style?: React.CSSProperties;
  className?: string;
}

export default function PlotlyChart({
  data,
  layout,
  config = { responsive: true, displayModeBar: false },
  style = { width: '100%', height: '350px' },
  className = '',
}: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotlyInstance, setPlotlyInstance] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    import('plotly.js-dist-min').then((Plotly) => {
      if (mounted) {
        setPlotlyInstance(Plotly.default || Plotly);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!plotlyInstance || !containerRef.current) return;

    const el = containerRef.current;
    const finalLayout = {
      autosize: true,
      margin: { l: 50, r: 25, t: 45, b: 45 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'inherit', color: '#8A9BA8', size: 11 },
      ...layout,
    };

    plotlyInstance.newPlot(el, data, finalLayout, config);

    const handleResize = () => {
      if (el) {
        plotlyInstance.Plots.resize(el);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (el) {
        plotlyInstance.purge(el);
      }
    };
  }, [plotlyInstance, data, layout, config]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={`plotly-chart-container ${className}`}
    />
  );
}
