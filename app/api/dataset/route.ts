import { NextResponse } from 'next/server';
import { BENCHMARK_DATA } from '@/lib/benchmarkData';
import { computeKPIMetrics, computeStatisticalTests } from '@/lib/calculations';

export async function GET() {
  const metrics = computeKPIMetrics(BENCHMARK_DATA);
  const stats = computeStatisticalTests(BENCHMARK_DATA);

  return NextResponse.json({
    status: 'success',
    totalRecords: BENCHMARK_DATA.length,
    metrics,
    statistics: stats,
    data: BENCHMARK_DATA,
  });
}
