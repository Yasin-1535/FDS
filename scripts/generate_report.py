import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

os.makedirs('report', exist_ok=True)

# ==============================================================================
# 1. GENERATE MARKDOWN REPORT
# ==============================================================================
md_content = """# PREDICT & RETAIN
## Data-Driven HR Employee Attrition & Workforce Analytics

---

**Project Title:** Predict & Retain: Data-Driven HR Employee Attrition & Workforce Analytics  
**Course/Domain:** Foundations of Data Science / HR Workforce Analytics  
**Date:** October 2026  
**Status:** Completed & Validated  

---

### Executive Summary

Employee attrition creates acute disruption for contemporary organizations, imposing heavy replacement expenses, degrading team productivity, and depleting institutional knowledge. This study applies systematic exploratory data analysis, inferential statistics, feature engineering, and interactive business intelligence to evaluate workforce attrition patterns across 1,470 employee records from the IBM HR Analytics benchmark dataset.

The investigation uncovered several critical observational patterns:
1. **Workplace Overtime Association:** Employees assigned to overtime exhibit an observed attrition rate of **30.53%**, compared to **10.44%** among non-overtime peers—a statistically significant difference of +20.09 percentage points ($\\chi^2 = 87.56$, $p < 0.001$).
2. **Compensation Differences:** Retained staff earn a mean monthly income of **$6,832.74** (median **$5,204.00**), whereas departing employees average **$4,787.09** (median **$3,202.00**), representing an observed difference of **$2,045.65** (Welch's $t = -7.48$, $p < 0.001$).
3. **Tenure Relationship:** Staff in their initial 2 years of organizational tenure display an observed attrition rate of **29.82%**, compared to **13.82%** in years 3–5, and **8.13%** beyond 11 years.
4. **Job Role Variation:** The highest observed attrition rates occur among *Sales Representatives* (**39.76%**), *Laboratory Technicians* (**23.94%**), and *Human Resources* (**23.08%**), whereas *Managers* (**4.90%**) and *Research Directors* (**2.50%**) exhibit lower observed attrition.
5. **Commute Distance Relationship:** Employees residing more than 20 km away exhibit an observed attrition rate of **22.06%**, compared to **13.77%** for staff living within 5 km.

To operationalize these findings, an interactive Streamlit analytics platform (`dashboard/app.py`) was engineered, providing dynamic KPI cards, multi-criteria filtering, and data-driven decision support.

---

### 1. Introduction

Human capital retention is foundational to organizational stability and operational effectiveness. Unplanned employee turnover incurs direct costs—including recruitment advertising, onboarding, and training—alongside indirect costs such as workflow disruption and lost team momentum. 

Rather than relying purely on retrospective exit interviews, modern workforce analytics leverages quantitative records to identify observable patterns associated with turnover. The **Predict & Retain** framework provides empirical rigor to workforce retention analysis.

---

### 2. Problem Statement

Organizational leadership faces complex challenges in talent retention, characterized by several unresolved operational questions:
* Which functional departments and specific job roles exhibit higher observed attrition rates?
* How does employee compensation compare between retained and departing cohorts?
* What observable statistical relationship exists between workplace variables—specifically overtime status and daily commute distance—and turnover rates?
* How do employee survey ratings (Job Satisfaction and Work-Life Balance) interact with turnover behavior?

---

### 3. Project Objectives

1. **Quantify Attrition Risk:** Establish exact turnover rates across Research & Development, Sales, and Human Resources divisions and across all nine job roles.
2. **Compensation Analysis:** Quantify income distributions, median/mean comparisons, and test the statistical significance of earnings differences between departing and retained cohorts.
3. **Workplace Stress & Commute Evaluation:** Analyze observational associations between overtime status, commute distance, and employee attrition.
4. **Interactive Dashboard Development:** Construct a production-grade Streamlit application featuring live KPI cards, interactive Plotly visualizations, and multi-criteria workforce filtering.
5. **Evidence-Based HR Recommendations:** Translate validated statistical findings into actionable retention policies while distinguishing correlation from causation.

---

### 4. Dataset Source & Attribution

The analysis utilizes the benchmark **IBM HR Analytics Employee Attrition & Performance** dataset:
* **Record Count:** 1,470 unique employee observations
* **Attribute Count:** 35 baseline organizational, demographic, and survey attributes
* **Missing Values:** Zero missing or null entries detected across the entire matrix
* **Duplicate Rows:** Zero duplicate records detected

#### Key Analytical Fields

| Feature | Type | Description |
| :--- | :--- | :--- |
| `Attrition` | Categorical | Target variable ('Yes' = Departed, 'No' = Retained) |
| `Age` | Integer | Chronological age of employee (18–60 years) |
| `Department` | Categorical | Operating unit (R&D, Sales, Human Resources) |
| `JobRole` | Categorical | Specific organizational title (9 distinct roles) |
| `MonthlyIncome` | Continuous | Gross monthly compensation in USD ($1,009–$19,999) |
| `OverTime` | Categorical | Overtime work status ('Yes', 'No') |
| `YearsAtCompany` | Integer | Total service years at the enterprise (0–40 years) |
| `DistanceFromHome` | Integer | Commute distance in miles/km (1–29) |
| `JobSatisfaction` | Ordinal | Survey score (1: Low to 4: Very High) |
| `WorkLifeBalance` | Ordinal | Survey score (1: Bad to 4: Best) |
| `BusinessTravel` | Categorical | Travel frequency (Non-Travel, Rarely, Frequently) |

---

### 5. Data Understanding

Exploration of distributions confirmed a workforce of 1,470 employees with a median age of 36 years (mean 36.92 years, range 18 to 60). The overall workforce turnover rate in the dataset is 16.12% (237 departed, 1,233 retained). Distributional skewness was noted in `MonthlyIncome` and `YearsAtCompany`, which reflect typical organizational compensation and service longevity structures.

---

### 6. Data Cleaning Pipeline

A rigorous auditing pipeline was implemented:
1. **Completeness Audit:** Scanned for NaN/null values (`df.isnull().sum()`); verified 100% completeness (0 nulls across 1,470 rows).
2. **Duplicate Detection:** Confirmed absence of duplicate rows (`df.duplicated().sum() == 0`).
3. **Constant Feature Audit:** Identified zero-variance administrative columns (`EmployeeCount` = 1, `StandardHours` = 80, `Over18` = 'Y').
4. **Categorical Consistency:** Validated category labels across `Attrition`, `OverTime`, `Department`, `BusinessTravel`, and `JobRole`.
5. **Outlier Investigation:** Evaluated distribution spreads in `MonthlyIncome` (ranging to $19,999) and `YearsAtCompany` (extending to 40 years). These represent valid high-tenure and executive salary observations rather than data entry errors and were retained to preserve complete distributional fidelity.

---

### 7. Data Transformation

Data types were verified. Numerical variables (`Age`, `MonthlyIncome`, `YearsAtCompany`, `DistanceFromHome`) were confirmed as integer/float, and nominal variables (`Department`, `JobRole`, `BusinessTravel`, `OverTime`) were preserved with readable labels for clear visualization and reporting.

---

### 8. Feature Engineering

Two core features and two analytical grouping dimensions were constructed:

#### 1. `Attrition_Num`
Binary numerical mapping facilitating aggregation and statistical computation:
$$\\text{Attrition\\_Num} = \\begin{cases} 1 & \\text{if Attrition} = \\text{'Yes'} \\\\ 0 & \\text{if Attrition} = \\text{'No'} \\end{cases}$$

#### 2. `TenureRatio`
Measures the proportion of an employee's chronological age spent at the company, with safe zero-denominator handling:
$$\\text{TenureRatio} = \\frac{\\text{YearsAtCompany}}{\\text{Age}}$$
*Retained staff display a mean TenureRatio of 0.1956 vs 0.1424 for departed personnel.*

#### 3. `TenureGroup`
Segmented into four service categories:
* `0–2 years`: Initial tenure period
* `3–5 years`: Intermediate tenure
* `6–10 years`: Established tenure
* `11+ years`: Long-term organizational tenure

#### 4. `DistanceBand`
Segmented into four commute distance intervals:
* `0–5 km`: Short commute
* `6–10 km`: Moderate commute
* `11–20 km`: Extended commute
* `21+ km`: Long-distance commute

---

### 9. Exploratory Data Analysis & Empirical Findings

#### 9.1 Overall Workforce Attrition Baseline
* **Total Employees:** 1,470
* **Retained Cohort:** 1,233 (83.88%)
* **Departed Cohort:** 237 (16.12%)
* **Baseline Turnover Benchmark:** **16.12%**

#### 9.2 Departmental Attrition Breakdown

| Department | Total Headcount | Departures | Attrition Rate (%) |
| :--- | :---: | :---: | :---: |
| **Sales** | 446 | 92 | **20.63%** |
| **Human Resources** | 63 | 12 | **19.05%** |
| **Research & Development** | 961 | 133 | **13.84%** |

*Finding:* Sales (20.63%) and Human Resources (19.05%) exhibit higher observed attrition rates compared to Research & Development (13.84%).

#### 9.3 Job Role Turnover Disparities

| Job Role | Total Staff | Departures | Attrition Rate (%) | Mean Monthly Income |
| :--- | :---: | :---: | :---: | :---: |
| **Sales Representative** | 83 | 33 | **39.76%** | $2,626.00 |
| **Laboratory Technician** | 259 | 62 | **23.94%** | $3,237.16 |
| **Human Resources** | 52 | 12 | **23.08%** | $4,235.75 |
| **Sales Executive** | 326 | 57 | **17.48%** | $6,924.28 |
| **Research Scientist** | 292 | 47 | **16.10%** | $4,404.14 |
| **Manufacturing Director** | 145 | 10 | **6.90%** | $7,295.14 |
| **Healthcare Representative** | 131 | 9 | **6.87%** | $7,528.76 |
| **Manager** | 102 | 5 | **4.90%** | $17,181.68 |
| **Research Director** | 80 | 2 | **2.50%** | $16,033.55 |

*Finding:* Among the nine individual job roles, the highest observed attrition rates are recorded for *Sales Representatives* (39.76%), *Laboratory Technicians* (23.94%), and *Human Resources* (23.08%). The lowest observed attrition rates are recorded for *Research Directors* (2.50%) and *Managers* (4.90%).

#### 9.4 Overtime Association & Statistical Testing

| OverTime Status | Total Employees | Departures | Attrition Rate (%) |
| :--- | :---: | :---: | :---: |
| **No Overtime** | 1,054 | 110 | **10.44%** |
| **Works Overtime** | 416 | 127 | **30.53%** |

* **Chi-Square Statistic ($\\chi^2$):** 87.5643  
* **Degrees of Freedom:** 1  
* **p-value:** $8.16 \\times 10^{-21}$ ($p < 0.0001$)  
* **Observational Difference:** +20.09 percentage points (30.53% vs 10.44%).  
* **Observational Distinction:** Working overtime shows a statistically significant association with employee attrition. This analysis demonstrates an observational relationship; it does not establish that overtime is the sole cause of departures.

#### 9.5 Compensation Analysis & Salary Reference Reconciliation

| Cohort | Headcount | Mean Income ($) | Median Income ($) | Std Dev ($) |
| :--- | :---: | :---: | :---: | :---: |
| **Retained (No)** | 1,233 | $6,832.74 | $5,204.00 | $4,818.21 |
| **Departed (Yes)** | 237 | $4,787.09 | $3,202.00 | $3,640.21 |
| **Difference** | — | **+$2,045.65** | **+$2,002.00** | — |

* **Welch's Two-Sample t-test:** $t = -7.4826, \\quad p = 4.43 \\times 10^{-13}$

> **Methodological Note on Specification Reference Salaries vs. Dataset Reality:**  
> The project prompt mentioned initial reference comparison values of approximately $11,330 for retained employees and $9,592 for departing employees. The authentic dataset (`data/final_dataset.csv`) yields actual calculated mean monthly incomes of **$6,832.74** for retained staff and **$4,787.09** for departing staff. In strict adherence to the project data integrity guidelines, all reported values and dashboard KPIs reflect the actual calculated metrics from the loaded dataset rather than forced reference figures. The direction and statistical significance of the finding remain identical: employees who leave have significantly lower monthly income on average than those who stay ($p < 0.001$).

#### 9.6 Career Tenure & TenureRatio

| Tenure Group | Headcount | Departures | Attrition Rate (%) |
| :--- | :---: | :---: | :---: |
| **0–2 years** | 342 | 102 | **29.82%** |
| **3–5 years** | 434 | 60 | **13.82%** |
| **6–10 years** | 448 | 55 | **12.28%** |
| **11+ years** | 246 | 20 | **8.13%** |

*Finding:* Observed attrition is highest among employees with 0–2 years of tenure (29.82%), dropping to 13.82% in the 3–5 year cohort, and 8.13% among those with 11+ years.

#### 9.7 Sentiment & Survey Metrics

* **Job Satisfaction (1 to 4 scale):** Attrition rate is **22.84%** at Level 1, **16.43%** at Level 2, **16.52%** at Level 3, and **11.33%** at Level 4.
* **Work-Life Balance (1 to 4 scale):** Attrition rate is **31.25%** at Level 1, **16.86%** at Level 2, **14.22%** at Level 3, and **17.65%** at Level 4.
* **Combined Interaction:** Employees reporting Level 1 on both Job Satisfaction and Work-Life Balance exhibit an observed attrition rate exceeding **40%**.

#### 9.8 Distance from Home & Commute Analysis

| Distance Band | Headcount | Departures | Attrition Rate (%) |
| :--- | :---: | :---: | :---: |
| **0–5 km** | 632 | 87 | **13.77%** |
| **6–10 km** | 394 | 57 | **14.47%** |
| **11–20 km** | 240 | 48 | **20.00%** |
| **21+ km** | 204 | 45 | **22.06%** |

*Finding:* Employees residing 21+ km away show a higher observed attrition rate (22.06%) compared to those living within 0–5 km (13.77%).

---

### 10. Visualization Assets

The project generated 13 publication-grade charts in `outputs/`:
* `attrition_distribution.png`: Overall workforce retention/attrition breakdown
* `attrition_department.png`: Departmental turnover rates
* `attrition_jobrole.png`: Horizontal bar chart across all 9 job roles
* `overtime_attrition.png`: Overtime comparison with Chi-square test callout
* `income_avg_attrition.png`: Average monthly income bar chart
* `income_distribution.png`: Income density distributions
* `income_attrition.png`: Side-by-side boxplot and density chart
* `tenure_attrition.png`: Tenure group bar chart
* `tenureratio_attrition.png`: TenureRatio boxplot
* `satisfaction_attrition.png`: Job satisfaction level rates
* `worklife_attrition.png`: Work-life balance rating rates
* `distance_attrition.png`: Distance band attrition comparison
* `correlation_heatmap.png`: 14-feature correlation matrix
* `eda_charts.png`: Comprehensive 4-panel overview chart

---

### 11. Interactive Dashboard

The Streamlit dashboard (`dashboard/app.py`) provides:
* Dynamic KPI cards calculated from `final_dataset.csv`
* Multi-criteria sidebar filters: Department, Job Role, Overtime, Business Travel
* Five structured exploration tabs: Workforce Overview, Compensation & Tenure, Workplace & Satisfaction, Commute Analysis, Key Insights
* Defensive handling for empty filter selections without runtime errors

---

### 12. Key Findings Summary

1. **Overtime:** Employees working overtime exhibit an observed attrition rate of **30.53%** vs **10.44%** for non-overtime employees ($\\chi^2 = 87.56, p < 0.001$).
2. **Compensation:** Retained staff average **$6,832.74** monthly income vs **$4,787.09** for departing staff (Welch $t = -7.48, p < 0.001$).
3. **Tenure:** Employees with 0–2 years at the company show an observed attrition rate of **29.82%**, compared to **8.13%** for 11+ years.
4. **Job Roles:** *Sales Representatives* (39.76%), *Laboratory Technicians* (23.94%), and *Human Resources* (23.08%) exhibit the highest observed turnover.
5. **Commute:** Staff living 21+ km away exhibit an observed attrition rate of **22.06%** compared to **13.77%** for those within 0–5 km.
6. **Sentiment Interaction:** Combining Level 1 Job Satisfaction with Level 1 Work-Life Balance associates with attrition rates above 40%.

---

### 13. HR Recommendations

1. **Overtime Governance:** Monitor cumulative overtime hours and assess staffing levels in teams with high recurring overtime.
2. **Compensation Review:** Conduct salary benchmarking evaluations specifically for roles with elevated attrition rates (*Sales Representatives*, *Laboratory Technicians*).
3. **Early-Tenure Onboarding Support:** Implement structured check-ins and mentorship during the initial 0–24 months of tenure.
4. **Flexible Commute Considerations:** Consider partial remote options or flexible scheduling for staff with extended commutes (>20 km).
5. **Role-Specific Retention Programs:** Design career progression pathways and support systems tailored to individual job roles.

---

### 14. Conclusion

The analysis indicates that employee attrition in this dataset is strongly associated with observable factors including overtime status, compensation levels, service tenure, and specific job roles. Proactive monitoring of these workforce indicators provides actionable evidence for organizational retention strategies.

---

### 15. Limitations

* The dataset represents cross-sectional observational data; associations do not demonstrate direct causality.
* External market conditions (labor market competition, macroeconomics) are not represented in this internal HR dataset.
* Qualitative feedback (such as specific exit interview narratives) is not captured in tabular attributes.

---

### 16. Future Scope

* Longitudinal survival analysis (Kaplan-Meier curves and Cox Proportional Hazards models) tracking time-to-event attrition.
* Supervised predictive modeling (Random Forest, Gradient Boosting) with SHAP explainability.
* Natural language processing on open-ended employee pulse surveys.

---

### 17. References

1. IBM Watson Analytics. *HR Employee Attrition and Performance Dataset*.
2. Agresti, A. (2018). *An Introduction to Categorical Data Analysis*. Wiley.
3. McKinney, W. (2022). *Python for Data Analysis*. O'Reilly Media.
4. Streamlit Documentation (2026). *Interactive Dashboard Development with Python*.
"""

with open('report/Final_Project_Report.md', 'w', encoding='utf-8') as f:
    f.write(md_content)
print("Saved report/Final_Project_Report.md successfully!")

# ==============================================================================
# 2. GENERATE DOCX REPORT
# ==============================================================================
doc = docx.Document()

# Margins
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

COLOR_PRIMARY = RGBColor(30, 58, 138)
COLOR_SECONDARY = RGBColor(59, 130, 246)
COLOR_DARK = RGBColor(15, 23, 42)

def add_title(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(24)
    r.font.bold = True
    r.font.color.rgb = COLOR_PRIMARY
    p.paragraph_format.space_after = Pt(4)

def add_subtitle(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(13)
    r.font.color.rgb = COLOR_SECONDARY
    p.paragraph_format.space_after = Pt(20)

def add_h1(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = COLOR_PRIMARY
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(6)

def add_h2(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(12.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_SECONDARY
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)

def add_p(text, bold_prefix=None):
    p = doc.add_paragraph()
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(10.5)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(10.5)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    return p

def add_bullet(text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.bold = True
        r_pre.font.size = Pt(10.5)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(10.5)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15

add_title("PREDICT & RETAIN")
add_subtitle("Data-Driven HR Employee Attrition & Workforce Analytics")

meta_p = doc.add_paragraph()
meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
m_run = meta_p.add_run("Foundations of Data Science | October 2026 | Submission-Ready Technical Report")
m_run.font.name = 'Arial'
m_run.font.size = Pt(9.5)
m_run.font.italic = True
meta_p.paragraph_format.space_after = Pt(20)

add_h1("Executive Summary")
add_p("This study evaluates employee attrition patterns across 1,470 employee records from the IBM HR Analytics benchmark dataset using exploratory data analysis, statistical hypothesis testing, and an interactive Streamlit dashboard.")
add_bullet(" Employees assigned to overtime exhibit an observed attrition rate of 30.53% vs 10.44% for non-overtime staff (Chi-square = 87.56, p < 0.001).", "Overtime Association:")
add_bullet(" Retained personnel average $6,832.74 monthly earnings vs $4,787.09 for departing staff ($2,045.65 difference, Welch t = -7.48, p < 0.001).", "Compensation Gap:")
add_bullet(" Employees in years 0–2 experience an observed attrition rate of 29.82%, dropping to 13.82% in years 3–5 and 8.13% after 11 years.", "Tenure Cohorts:")
add_bullet(" Highest observed attrition occurs in Sales Representatives (39.76%), Laboratory Technicians (23.94%), and Human Resources (23.08%).", "Job Role Variation:")
add_bullet(" Staff living >20 km away exhibit 22.06% attrition compared to 13.77% within 0–5 km.", "Commute Distance:")

add_h1("1. Dataset & Analytical Fields")
add_p("The dataset contains 1,470 rows and 35 baseline columns, with 0 missing values and 0 duplicate records. Overall workforce turnover is 16.12% (237 departed / 1,233 retained). Key fields include Attrition, Age, Department, JobRole, MonthlyIncome, OverTime, YearsAtCompany, DistanceFromHome, JobSatisfaction, and WorkLifeBalance.")

add_h1("2. Salary Reference Reconciliation")
add_p("The project specification referenced salary values of approximately $11,330 for retained staff and $9,592 for departing staff. The authentic dataset (final_dataset.csv) yields actual calculated mean monthly incomes of $6,832.74 for retained employees and $4,787.09 for departing employees. In accordance with data integrity guidelines, all reported values reflect actual dataset calculations rather than forced reference figures. Both indicate a statistically significant compensation gap (p < 0.001).")

add_h1("3. Visual Assets & Key Findings")
if os.path.exists('outputs/eda_charts.png'):
    doc.add_picture('outputs/eda_charts.png', width=Inches(6.0))
    cap = doc.add_paragraph("Figure 1: Workforce Analytics Multi-Panel Summary.")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.runs[0].font.size = Pt(9)
    cap.runs[0].font.italic = True

add_h2("3.1 Department and Role Turnover")
add_p("Sales exhibits an observed attrition rate of 20.63%, Human Resources 19.05%, and Research & Development 13.84%. Job roles with the highest observed attrition rates are Sales Representatives (39.76%), Laboratory Technicians (23.94%), and Human Resources (23.08%).")

if os.path.exists('outputs/attrition_jobrole.png'):
    doc.add_picture('outputs/attrition_jobrole.png', width=Inches(5.6))
    cap = doc.add_paragraph("Figure 2: Observed Attrition Rate by Job Role.")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.runs[0].font.size = Pt(9)
    cap.runs[0].font.italic = True

add_h2("3.2 Overtime and Compensation")
add_p("Overtime status demonstrates a strong statistical association with turnover (30.53% vs 10.44%, Chi-square = 87.56, p < 0.001). Retained employees earn significantly higher monthly incomes ($6,832.74 vs $4,787.09, t = -7.48, p < 0.001).")

if os.path.exists('outputs/income_attrition.png'):
    doc.add_picture('outputs/income_attrition.png', width=Inches(5.6))
    cap = doc.add_paragraph("Figure 3: Monthly Compensation Distribution by Attrition Cohort.")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.runs[0].font.size = Pt(9)
    cap.runs[0].font.italic = True

add_h1("4. Streamlit Dashboard Architecture")
add_p("The dashboard (dashboard/app.py) provides live KPI metrics, dynamic sidebar filtering (Department, Job Role, Overtime, Business Travel), 5 exploration tabs, and empty-filter handling.")

add_h1("5. Evidence-Based HR Recommendations")
add_bullet(" Monitor recurring overtime hours and evaluate staffing levels in high-overtime units.", "1. Overtime Governance:")
add_bullet(" Review compensation for roles showing elevated turnover (Sales Representatives, Laboratory Technicians).", "2. Compensation Alignment:")
add_bullet(" Implement structured onboarding check-ins and mentorship during the 0–24 month tenure period.", "3. Early-Tenure Mentorship:")
add_bullet(" Offer flexible scheduling or commute accommodations for staff living >20 km away.", "4. Commute Accommodation:")
add_bullet(" Design clear progression pathways and support systems tailored to individual job roles.", "5. Role-Specific Support:")

add_h1("6. Conclusion & References")
add_p("Employee attrition is strongly associated with observable factors including overtime status, compensation levels, service tenure, and specific job roles. Addressing these areas provides concrete opportunities for retention improvement.")
add_p("References: IBM Watson Analytics; Agresti (2018); Streamlit Documentation (2026).")

doc.save('report/Final_Project_Report.docx')
print("Saved report/Final_Project_Report.docx successfully!")
