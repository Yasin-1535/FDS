# Predict & Retain — Workforce Intelligence & Employee Attrition Analytics

![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)
![Vercel](https://img.shields.io/badge/Deployment-Vercel%20Production%20Ready-black.svg?logo=vercel)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python)
![Tests](https://img.shields.io/badge/Tests-38%2F38%20Passing-success.svg)
![Status](https://img.shields.io/badge/Status-Complete%20%26%20Validated-success.svg)

---

## 📌 1. Project Overview

**Predict & Retain — Workforce Intelligence & Employee Attrition Analytics** is an end-to-end data-driven human resources analytics application designed to evaluate workforce attrition patterns, isolate operational risk factors, and empower decision-makers with empirical retention strategies.

The project features a **Vercel-native Next.js web application** (React, TypeScript, Plotly, and serverless architecture) engineered for cloud deployment, alongside a Python analytics research pipeline, inferential statistical modeling, automated unit testing, and an offline Streamlit research dashboard.

---

## 🎯 2. Business Problem

Unplanned employee attrition poses significant financial and organizational burdens, including recruitment expenditures, lost institutional memory, productivity decline, and onboarding overheads.

Human resources leadership requires data-backed visibility into critical workforce drivers:
* **Workforce Stability & Tenure:** Understanding the vulnerability window across employee service years.
* **Compensation Disparities:** Quantifying the earning differences between retained personnel and departing cohorts.
* **Workplace Stressors (Overtime):** Assessing the acute attrition risk driven by recurring overtime demands.
* **Employee Sentiment:** Measuring how Job Satisfaction and Work-Life Balance interact to influence voluntary turnover.
* **Spatial Factors (Commute Distance):** Analyzing the relationship between daily travel distance and employee retention.
* **Organizational Segmentation:** Uncovering stark turnover variances across functional departments and specialized job roles.

---

## 🚀 3. Key Objectives

1. **Quantify Attrition Benchmarks:** Measure baseline and disaggregated turnover metrics across business units (Research & Development, Sales, Human Resources) and nine organizational job roles.
2. **Evaluate Compensation Architecture:** Analyze monthly income distributions, pay equity, and statistical significance tests across retention cohorts.
3. **Assess Workplace Friction Factors:** Statistically evaluate observational correlations between overtime requirements, commute distances, and turnover rates.
4. **Deliver a Production Vercel Web Application:** Deploy a serverless Next.js enterprise intelligence platform featuring real-time KPI telemetry, dynamic cascading filters, multi-chart representation modes, and CSV export facilities.
5. **Provide Evidence-Based Retention Guidelines:** Translate empirical patterns into structured corporate HR interventions.

---

## 📂 4. Dataset Information

* **Benchmark Cohort:** 1,470 employee records (IBM HR Analytics benchmark dataset).
* **Dimensionality:** 35 raw features expanded to 39 validated analytical features after feature engineering.
* **Data Quality:** Zero missing values, zero null entries, and zero duplicate rows across all 1,470 records.
* **Target Feature:** `Attrition` (`Yes` / `No`).
* **Engineered Features:**
  - `Attrition_Num`: Binary numerical indicator (`1` for departed, `0` for retained).
  - `TenureRatio`: Proportion of total life spent at the enterprise (`YearsAtCompany / Age`).
  - `TenureGroup`: Discretized tenure intervals (`0-2 yrs`, `3-5 yrs`, `6-10 yrs`, `10+ yrs`).
  - `DistanceBand`: Discretized commute intervals (`0-5 km`, `6-10 km`, `11-20 km`, `21+ km`).
* **Major Workforce Variables:** `Age`, `Department`, `JobRole`, `JobLevel`, `MonthlyIncome`, `OverTime`, `DistanceFromHome`, `JobSatisfaction`, `WorkLifeBalance`, `YearsAtCompany`, `YearsWithCurrManager`, `BusinessTravel`.

---

## 📈 5. Key Empirical Findings

All findings reflect verified project figures across the benchmark population ($N = 1,470$):

* **Workforce Totals:** 1,470 total employees — **1,233 Retained (83.88%)**, **237 Departed (16.12%)**.
* **Overall Baseline Attrition Rate:** **16.12%**.
* **Monthly Income Disparity:**
  - Overall workforce mean: **$6,502.93**
  - Retained workforce mean: **$6,832.74** (median: $5,204.00)
  - Departed workforce mean: **$4,787.09** (median: $3,202.00)
  - Observed compensation gap: **-$2,045.65** lower mean pay for departing personnel.
  - Welch's two-sample t-test: $t = -7.48$, $p < 0.001$.
* **Overtime Friction:**
  - Employees working overtime (`OverTime = Yes`): **30.53%** attrition rate (127 departed of 416).
  - Employees not working overtime (`OverTime = No`): **10.44%** attrition rate (110 departed of 1,054).
  - Chi-square test of independence: $\chi^2 = 87.56$, $p < 0.001$.
* **Early-Career Tenure Window:** Staff with 0–2 years of company tenure exhibit an observed attrition rate of **29.82%**, compared to 13.82% in years 3–5 and 8.13% beyond 11 years.
* **Role Vulnerability:**
  - Sales Representatives: **39.76%** attrition rate.
  - Laboratory Technicians: **23.94%** attrition rate.
  - Human Resources: **23.08%** attrition rate.
  - Research Directors: **2.50%** attrition rate.
  - Managers: **4.90%** attrition rate.
* **Commute Distance Impact:** Employees commuting $>20\text{ km}$ display **22.06%** attrition vs **13.77%** for staff residing within $5\text{ km}$.

> ⚠️ **Important Methodological Note:** These findings represent **observational associations** within the benchmark dataset, not proof of direct causation.

---

## 🖥️ 6. Dashboard Architecture & Features

The production web platform provides an executive-grade command-center interface:

* **Interactive Workforce Filters:**
  - Cascading multi-select controls: Department, Job Role, OverTime, and Business Travel.
  - Dedicated **Reset Filters** button that resets workforce dimensions while strictly preserving active section, visualization mode, and visual theme.
* **Independent Workflow Controls:**
  - **Analysis Section Selector:** Switch between operational sections (`Overview`, `Workforce`, `Compensation`, `Overtime`, `Satisfaction`, `Commute`, `Risk Signals`, `Evidence`). Selection state persists across all reruns and filter adjustments.
  - **Visualization Type Selector:** Choose from 12 analytical modes (`ALL`, `Bar Chart`, `Line Chart`, `Histogram`, `Pie Chart`, `Scatter Plot`, `Box Plot`, `Heatmap`, `Grouped Bar Chart`, `Donut Chart`, `Area Chart`, `Choropleth Map`).
* **Comprehensive `ALL` Visualization Mode:**
  - Selecting `ALL` renders an organized two-column analytical gallery of all supported chart types for the active analysis section.
  - In single-chart mode, lazy evaluation computes only the requested figure to ensure zero rendering lag.
* **Choropleth Map Safe Fallback:**
  - The current HR dataset contains linear distance (`DistanceFromHome`), not geographic coordinates, shapefiles, or country/state codes.
  - The dashboard intentionally displays an informative explanation notice rather than fabricating synthetic geographic coordinates or misleading boundary maps.
* **Dynamic Command KPI Cards:**
  - Real-time recalculation of Headcount, Departures, Observed Attrition %, and Mean Monthly Income based on active filter scope.
* **Client-Side CSV Upload & Benchmark Management:**
  - Prominent single-file CSV upload terminal (`accept_multiple_files=False`) with automatic schema validation, column normalization, and instant metric recalculation.
  - Ephemeral browser state ensures compatibility with serverless execution without requiring local filesystem persistence.
  - One-click benchmark restore button to seamlessly revert to original dataset state.
* **Export Engine:**
  - Direct in-memory export of the filtered workforce dataset to Clean CSV.
* **Dual Design Themes:**
  - Command-Center Dark Theme (default) with deep charcoal tones, amber/cyan telemetry indicators, and glassmorphic card borders.
  - Modern Analytics Theme with clean slate framing and refined contrast.

---

## 📁 7. Project Structure

```text
FDS-Final-Project/
│
├── app/                              # Next.js App Router (Vercel Production Web Application)
│   ├── api/dataset/route.ts          # Serverless endpoint returning benchmark data & telemetry
│   ├── globals.css                   # Global CSS tokens, scrollbar styling & theme resets
│   ├── layout.tsx                    # HTML shell, OpenGraph metadata & viewport configuration
│   └── page.tsx                      # Root page serving the interactive Dashboard component
│
├── components/                       # Modular React / TypeScript UI components
│   ├── charts/
│   │   ├── ChartRenderer.tsx         # Unified 12-chart rendering engine & 2-column ALL gallery
│   │   └── PlotlyChart.tsx           # Dynamic client Plotly wrapper with responsive resizing
│   ├── Dashboard.tsx                 # Core application controller & client state coordinator
│   ├── Filters.tsx                   # Cascading workforce filter bar with isolated reset button
│   ├── Header.tsx                    # Executive brand header, telemetry indicator & data controls
│   ├── KPIGrid.tsx                   # Dynamic 4-card telemetry display with baseline deltas
│   ├── SectionView.tsx               # Contextual analytical narratives, statistics & risk register
│   └── VisualizationSelector.tsx     # Precision-aligned 2-column primary workflow selector
│
├── lib/                              # Analytical calculations & data schemas
│   ├── analytics.ts                  # Aggregation functions for chart distributions & metrics
│   ├── benchmarkData.ts              # Pre-compiled benchmark dataset (1,470 records) for instant hydration
│   ├── calculations.ts               # Welch t-test, Chi-Square, KPI math & CSV parser/validator
│   └── types.ts                      # Strict TypeScript interfaces for HR records & metrics
│
├── data/
│   ├── original_dataset.csv          # Raw benchmark dataset (1,470 rows x 35 columns)
│   └── final_dataset.csv             # Cleaned & feature-engineered dataset (1,470 rows x 39 columns)
│
├── public/
│   └── data/final_dataset.csv        # Static dataset asset for web access
│
├── dashboard/                        # Python Streamlit research dashboard
│   ├── app.py                        # Streamlit workforce analytics application
│   └── pipeline.py                   # Data ingestion, schema validation & charting engine
│
├── notebooks/
│   └── Predict_and_Retain_HR_Attrition.ipynb  # End-to-end executed Jupyter research notebook
│
├── outputs/                          # 14 Publication-grade high-resolution charts (300 DPI)
├── presentation/                     # Executive presentation deck (Predict_and_Retain.pptx)
├── report/                           # Formal research report (Final_Project_Report.docx)
├── scripts/                          # Python generation & automation scripts
│
├── tests/
│   ├── test_data_pipeline.py         # Benchmark and feature transformation tests (10 tests)
│   ├── test_upload_pipeline.py       # Custom upload and schema validation tests (15 tests)
│   └── test_dashboard_ui.py          # State persistence, ALL mode & UI tests (13 tests)
│
├── package.json                      # Next.js, React, TypeScript, and Plotly dependencies
├── tsconfig.json                     # TypeScript compiler configuration
├── next.config.mjs                   # Next.js build configuration
├── requirements.txt                  # Python dependencies
├── .gitignore                        # Git exclusion rules
└── README.md                         # Unified project documentation
```

---

## 💻 8. Installation & Local Development

### 1. Next.js Web Application (Recommended for Vercel)

```bash
# Clone the repository
git clone https://github.com/Yasin-1535/FDS.git
cd FDS

# Install Node dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

To test the optimized production build locally:
```bash
npm run build
npm run start
```

### 2. Python Environment (Research & Testing)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run automated tests (38 tests)
python -m unittest discover tests

# Launch Streamlit research dashboard
streamlit run dashboard/app.py
```

---

## 🚀 9. Vercel Deployment Guide

This project is configured for **one-click deployment on Vercel**:

1. **Log in to Vercel:** Go to [vercel.com](https://vercel.com) and connect your GitHub account.
2. **Import Repository:** Select `Yasin-1535/FDS`.
3. **Configure Project:**
   - **Framework Preset:** `Next.js` (automatically detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
4. **Environment Variables:** None required. The application runs completely self-contained with bundled benchmark data and client-side processing.
5. **Deploy:** Click **Deploy**. Vercel will build and deploy the production web application within ~1 minute.

---

## 🧪 10. Automated Testing

The repository contains an automated unit and integration test suite with 38 tests across 3 test modules.

Run the test suite:
```bash
python -m unittest discover tests
```

### Verified Test Results:
```text
Ran 38 tests in 31.266s
OK
```

* **`test_data_pipeline.py` (10 tests):** Schema validation, null checking, categorical mappings, numerical scaling, and feature engineering.
* **`test_upload_pipeline.py` (15 tests):** Custom CSV ingestion, isolated data scoping, missing column detection, and dynamic chart generation.
* **`test_dashboard_ui.py` (13 tests):** Analysis Section persistence, independent Visualization Type state, `ALL` mode gallery rendering, workforce filter persistence, and Choropleth safety fallback notices.

---

## 🔒 11. Reproducibility & Environment

* **Fully Self-Contained:** Runs completely locally using the included CSV datasets and standard open-source dependencies.
* **Zero Credentials Required:** No external database connections, cloud storage tokens, or paid third-party API keys are required to execute any portion of the pipeline or dashboard.

---

## ⚠️ 12. Analytical Limitations

1. **Cross-Sectional Observational Nature:** The underlying data represents a static operational cross-section; identified patterns reflect statistical correlations rather than direct causal mechanisms.
2. **Absence of Geographic Boundaries:** The dataset records commute as a scalar metric (`DistanceFromHome`), containing no coordinates, postcodes, or shapefiles suitable for true spatial polygon mapping.
3. **Decision-Support Scope:** The analytical findings and risk prioritizations are intended to guide and augment human talent management decisions, not replace managerial judgment.

---

## 🔮 13. Future Enhancements

* **Predictive Supervised ML:** Implementing ensemble classifiers (e.g., XGBoost, LightGBM) with SHAP (SHapley Additive exPlanations) for individual attrition risk scoring.
* **Longitudinal Survival Analysis:** Applying Kaplan-Meier estimators and Cox Proportional Hazards modeling to evaluate time-to-departure dynamics.
* **Continuous Model Governance:** Integrating drift monitoring for deployed workforce models.
* **Enriched Spatial Telemetry:** Incorporating regional office geolocations and commute transit times.
* **Enterprise HRIS Integration:** Connecting with HR systems (e.g., Workday, SAP SuccessFactors) via secure authenticated webhooks.

---

## 📄 14. License

This project is licensed under the MIT License — see standard terms for details.
