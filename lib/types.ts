export interface EmployeeRecord {
  Age: number;
  Attrition: string;
  BusinessTravel: string;
  DailyRate: number;
  Department: string;
  DistanceFromHome: number;
  Education: number;
  EducationField: string;
  EmployeeCount: number;
  EmployeeNumber: number;
  EnvironmentSatisfaction: number;
  Gender: string;
  HourlyRate: number;
  JobInvolvement: number;
  JobLevel: number;
  JobRole: string;
  JobSatisfaction: number;
  MaritalStatus: string;
  MonthlyIncome: number;
  MonthlyRate: number;
  NumCompaniesWorked: number;
  Over18: string;
  OverTime: string;
  PercentSalaryHike: number;
  PerformanceRating: number;
  RelationshipSatisfaction: number;
  StandardHours: number;
  StockOptionLevel: number;
  TotalWorkingYears: number;
  TrainingTimesLastYear: number;
  WorkLifeBalance: number;
  YearsAtCompany: number;
  YearsInCurrentRole: number;
  YearsSinceLastPromotion: number;
  YearsWithCurrManager: number;
  Attrition_Num: number;
  TenureRatio: number;
  TenureGroup: string;
  DistanceBand: string;
  [key: string]: any;
}

export type AnalysisSection =
  | 'Overview'
  | 'Workforce'
  | 'Compensation'
  | 'Overtime'
  | 'Satisfaction'
  | 'Commute'
  | 'Risk Signals'
  | 'Evidence';

export type VisualizationType =
  | 'ALL'
  | 'Bar Chart'
  | 'Line Chart'
  | 'Histogram'
  | 'Pie Chart'
  | 'Scatter Plot'
  | 'Box Plot'
  | 'Heatmap'
  | 'Grouped Bar Chart'
  | 'Donut Chart'
  | 'Area Chart'
  | 'Choropleth Map';

export type ThemeMode = 'console' | 'modern';

export interface FilterState {
  department: string;
  jobRole: string;
  overtime: string;
  businessTravel: string;
}

export interface KPIMetrics {
  totalCount: number;
  departedCount: number;
  retainedCount: number;
  attritionRate: number;
  meanIncome: number;
  retainedMeanIncome: number;
  departedMeanIncome: number;
  incomeGap: number;
  retainedTenureRatioMean: number;
  departedTenureRatioMean: number;
}

export interface StatisticalTests {
  tStat: number;
  tPValue: number;
  chiSquare: number;
  chiPValue: number;
}

export interface RiskPriority {
  category: string;
  factor: string;
  rate: number;
  benchmarkDiff: number;
  level: 'HIGH' | 'WATCH' | 'REVIEW' | 'STABLE';
  details: string;
}
