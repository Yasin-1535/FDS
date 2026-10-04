import os
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Path resolution relative to repository root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_path = os.path.join(BASE_DIR, 'data', 'final_dataset.csv')
if not os.path.exists(data_path):
    data_path = os.path.join(BASE_DIR, 'data', 'original_dataset.csv')
if not os.path.exists(data_path):
    # Fallback to local relative path if BASE_DIR is current directory
    data_path = 'data/final_dataset.csv' if os.path.exists('data/final_dataset.csv') else 'data/original_dataset.csv'

# Ensure outputs directory exists at repository root
output_dir = os.path.join(BASE_DIR, 'outputs')
os.makedirs(output_dir, exist_ok=True)

# Set style
sns.set_theme(style='whitegrid', font='sans-serif')
plt.rcParams['font.size'] = 11
plt.rcParams['axes.titlesize'] = 13
plt.rcParams['axes.labelsize'] = 11

df = pd.read_csv(data_path)

# Ensure required derived columns exist
if 'Attrition_Num' not in df.columns:
    df['Attrition_Num'] = (df['Attrition'].astype(str).str.strip().str.lower() == 'yes').astype(int)
if 'TenureRatio' not in df.columns and 'YearsAtCompany' in df.columns and 'Age' in df.columns:
    df['TenureRatio'] = (df['YearsAtCompany'] / df['Age'].replace(0, np.nan)).round(4)
if 'TenureGroup' not in df.columns and 'YearsAtCompany' in df.columns:
    df['TenureGroup'] = pd.cut(df['YearsAtCompany'], bins=[-1, 2, 5, 10, 100], labels=['0-2 yrs', '3-5 yrs', '6-10 yrs', '10+ yrs'])
if 'DistanceBand' not in df.columns and 'DistanceFromHome' in df.columns:
    df['DistanceBand'] = pd.cut(df['DistanceFromHome'], bins=[-1, 5, 10, 20, 100], labels=['0-5 km', '6-10 km', '11-20 km', '21+ km'])

# 1. Overall Attrition Distribution
fig, ax = plt.subplots(figsize=(6, 5))
counts = df['Attrition'].value_counts()
no_count = counts.get('No', (df['Attrition_Num'] == 0).sum())
yes_count = counts.get('Yes', (df['Attrition_Num'] == 1).sum())
wedges, texts, autotexts = ax.pie(
    [no_count, yes_count],
    labels=[f'Retained ({no_count})', f'Departed ({yes_count})'],
    autopct='%1.1f%%',
    colors=['#10B981', '#EF4444'],
    startangle=140,
    explode=[0, 0.08],
    wedgeprops={'edgecolor': 'white', 'linewidth': 2}
)
for at in autotexts:
    at.set_color('white')
    at.set_weight('bold')
ax.set_title('Overall Workforce Attrition Distribution (N=1,470)', pad=15, fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'attrition_distribution.png'), dpi=300)
plt.close()

# 2. Attrition by Department
fig, ax = plt.subplots(figsize=(8, 5))
dept_data = df.groupby('Department', observed=False)['Attrition_Num'].mean().reset_index()
dept_data['Attrition_Rate%'] = dept_data['Attrition_Num'] * 100
bars = ax.bar(dept_data['Department'], dept_data['Attrition_Rate%'], color=['#3B82F6', '#1E40AF', '#F59E0B'], width=0.55, edgecolor='black', linewidth=0.5)
ax.set_title('Observed Attrition Rate by Department', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_ylim(0, 30)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.8, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'attrition_department.png'), dpi=300)
plt.close()

# 3. Attrition by Job Role
fig, ax = plt.subplots(figsize=(10, 6))
role_data = df.groupby('JobRole', observed=False)['Attrition_Num'].mean().reset_index().sort_values(by='Attrition_Num', ascending=True)
role_data['Rate%'] = role_data['Attrition_Num'] * 100
colors = ['#EF4444' if r > 20 else '#3B82F6' for r in role_data['Rate%']]
bars = ax.barh(role_data['JobRole'], role_data['Rate%'], color=colors, height=0.6, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate across Job Roles', pad=15, fontweight='bold')
ax.set_xlabel('Attrition Rate (%)')
ax.set_xlim(0, 48)
for bar in bars:
    xval = bar.get_width()
    ax.text(xval + 0.8, bar.get_y() + bar.get_height()/2.0, f'{xval:.1f}%', ha='left', va='center', fontweight='bold', fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'attrition_jobrole.png'), dpi=300)
plt.close()

# 4. Overtime vs Attrition
fig, ax = plt.subplots(figsize=(7, 5))
ot_data = df.groupby('OverTime', observed=False)['Attrition_Num'].mean().reset_index()
ot_data['Rate%'] = ot_data['Attrition_Num'] * 100
bars = ax.bar(ot_data['OverTime'], ot_data['Rate%'], color=['#10B981', '#EF4444'], width=0.45, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate by Overtime Status (Chi-sq p < 0.001)', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_xlabel('Works Overtime')
ax.set_ylim(0, 40)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1.0, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold', fontsize=11)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'overtime_attrition.png'), dpi=300)
plt.close()

# 5. Average Monthly Income by Attrition
fig, ax = plt.subplots(figsize=(7, 5))
inc_avg = df.groupby('Attrition', observed=False)['MonthlyIncome'].mean().reset_index()
bars = ax.bar(inc_avg['Attrition'], inc_avg['MonthlyIncome'], color=['#10B981', '#EF4444'], width=0.45, edgecolor='black', linewidth=0.5)
ax.set_title('Average Monthly Income by Attrition Status', pad=15, fontweight='bold')
ax.set_ylabel('Average Monthly Income ($)')
ax.set_xlabel('Attrition')
ax.set_ylim(0, 8500)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 150, f'${yval:,.0f}', ha='center', va='bottom', fontweight='bold', fontsize=11)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'income_avg_attrition.png'), dpi=300)
plt.close()

# 6. Monthly Income Distribution (Density & Boxplot)
fig, ax = plt.subplots(figsize=(8, 5))
sns.kdeplot(data=df, x='MonthlyIncome', hue='Attrition', palette={'No': '#10B981', 'Yes': '#EF4444'}, common_norm=False, fill=True, alpha=0.3, ax=ax)
ax.set_title('Monthly Income Density Distribution by Attrition Status', pad=15, fontweight='bold')
ax.set_xlabel('Monthly Income ($)')
ax.set_ylabel('Density')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'income_distribution.png'), dpi=300)
plt.close()

# Income Boxplot + Distribution Combined
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
sns.boxplot(x='Attrition', y='MonthlyIncome', data=df, hue='Attrition', palette={'No': '#10B981', 'Yes': '#EF4444'}, legend=False, ax=ax1, width=0.4)
ax1.set_title('Monthly Income Boxplot by Attrition', fontweight='bold')
ax1.set_ylabel('Monthly Income ($)')
ax1.set_xlabel('Attrition Status')

sns.kdeplot(data=df, x='MonthlyIncome', hue='Attrition', palette={'No': '#10B981', 'Yes': '#EF4444'}, common_norm=False, fill=True, alpha=0.3, ax=ax2)
ax2.set_title('Monthly Income Distribution (Density)', fontweight='bold')
ax2.set_xlabel('Monthly Income ($)')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'income_attrition.png'), dpi=300)
plt.close()

# 7. YearsAtCompany vs Attrition (Tenure)
fig, ax = plt.subplots(figsize=(8, 5))
tg_data = df.groupby('TenureGroup', observed=False)['Attrition_Num'].mean().reset_index()
tg_data['Rate%'] = tg_data['Attrition_Num'] * 100
bars = ax.bar(tg_data['TenureGroup'], tg_data['Rate%'], color='#6366F1', width=0.5, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate across Tenure Groups', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_ylim(0, 36)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.8, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'tenure_attrition.png'), dpi=300)
plt.close()

# 8. TenureRatio vs Attrition
fig, ax = plt.subplots(figsize=(7, 5))
sns.boxplot(x='Attrition', y='TenureRatio', data=df, hue='Attrition', palette={'No': '#10B981', 'Yes': '#EF4444'}, legend=False, ax=ax, width=0.4)
ax.set_title('TenureRatio (YearsAtCompany / Age) by Attrition', pad=15, fontweight='bold')
ax.set_ylabel('Tenure Ratio')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'tenureratio_attrition.png'), dpi=300)
plt.close()

# 9. Job Satisfaction vs Attrition
fig, ax = plt.subplots(figsize=(8, 5))
js_data = df.groupby('JobSatisfaction', observed=False)['Attrition_Num'].mean().reset_index()
js_data['Rate%'] = js_data['Attrition_Num'] * 100
bars = ax.bar(['1: Low', '2: Medium', '3: High', '4: Very High'], js_data['Rate%'], color='#8B5CF6', width=0.5, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate by Job Satisfaction Level', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_xlabel('Job Satisfaction Level (1 - 4)')
ax.set_ylim(0, 30)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.8, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'satisfaction_attrition.png'), dpi=300)
plt.close()

# 10. Work-Life Balance vs Attrition
fig, ax = plt.subplots(figsize=(8, 5))
wlb_data = df.groupby('WorkLifeBalance', observed=False)['Attrition_Num'].mean().reset_index()
wlb_data['Rate%'] = wlb_data['Attrition_Num'] * 100
bars = ax.bar(['1: Bad', '2: Good', '3: Better', '4: Best'], wlb_data['Rate%'], color=['#EF4444', '#F59E0B', '#10B981', '#3B82F6'], width=0.5, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate by Work-Life Balance Level', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_xlabel('Work-Life Balance Rating (1 - 4)')
ax.set_ylim(0, 38)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.9, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'worklife_attrition.png'), dpi=300)
plt.close()

# 11. DistanceFromHome vs Attrition
fig, ax = plt.subplots(figsize=(8, 5))
dist_data = df.groupby('DistanceBand', observed=False)['Attrition_Num'].mean().reset_index()
dist_data['Rate%'] = dist_data['Attrition_Num'] * 100
bars = ax.bar(dist_data['DistanceBand'], dist_data['Rate%'], color='#0284C7', width=0.5, edgecolor='black', linewidth=0.5)
ax.set_title('Attrition Rate by Commute Distance Band', pad=15, fontweight='bold')
ax.set_ylabel('Attrition Rate (%)')
ax.set_xlabel('Distance From Home')
ax.set_ylim(0, 28)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.7, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'distance_attrition.png'), dpi=300)
plt.close()

# 12. Correlation Heatmap
num_cols = ['Age', 'DistanceFromHome', 'Education', 'JobSatisfaction', 'MonthlyIncome', 'NumCompaniesWorked', 'PercentSalaryHike', 'TotalWorkingYears', 'YearsAtCompany', 'YearsInCurrentRole', 'YearsSinceLastPromotion', 'YearsWithCurrManager', 'Attrition_Num', 'TenureRatio']
corr = df[num_cols].corr()

fig, ax = plt.subplots(figsize=(12, 10))
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', vmin=-0.4, vmax=1.0, linewidths=0.5, ax=ax, cbar_kws={'shrink': 0.8})
ax.set_title('Numeric Correlation Matrix (including Attrition_Num & TenureRatio)', pad=15, fontweight='bold')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'correlation_heatmap.png'), dpi=300)
plt.close()

# 13. Multi-panel comprehensive EDA overview chart (eda_charts.png)
fig, axes = plt.subplots(2, 2, figsize=(14, 11))

# Panel A: Overall Attrition Donut
counts = df['Attrition'].value_counts()
no_count = counts.get('No', (df['Attrition_Num'] == 0).sum())
yes_count = counts.get('Yes', (df['Attrition_Num'] == 1).sum())
axes[0, 0].pie([no_count, yes_count], labels=[f'Stayed ({no_count})', f'Departed ({yes_count})'], autopct='%1.1f%%', colors=['#10B981', '#EF4444'], startangle=140, explode=[0, 0.08], wedgeprops={'edgecolor': 'white', 'linewidth': 2})
axes[0, 0].set_title('A. Overall Workforce Attrition Ratio (N=1,470)', fontweight='bold')

# Panel B: Overtime Comparison
axes[0, 1].bar(['No Overtime', 'Works Overtime'], ot_data['Rate%'], color=['#10B981', '#EF4444'], width=0.45, edgecolor='black', linewidth=0.5)
axes[0, 1].set_title('B. Attrition Rate by OverTime Status', fontweight='bold')
axes[0, 1].set_ylabel('Attrition Rate (%)')
for i, v in enumerate(ot_data['Rate%']):
    axes[0, 1].text(i, v + 1.0, f'{v:.1f}%', ha='center', fontweight='bold')

# Panel C: Tenure Groups
axes[1, 0].bar(tg_data['TenureGroup'], tg_data['Rate%'], color='#6366F1', width=0.5, edgecolor='black', linewidth=0.5)
axes[1, 0].set_title('C. Attrition Rate by Tenure Group at Company', fontweight='bold')
axes[1, 0].set_ylabel('Attrition Rate (%)')
for i, v in enumerate(tg_data['Rate%']):
    axes[1, 0].text(i, v + 0.8, f'{v:.1f}%', ha='center', fontweight='bold')

# Panel D: Income Distribution Boxplot
sns.boxplot(x='Attrition', y='MonthlyIncome', data=df, hue='Attrition', palette={'No': '#10B981', 'Yes': '#EF4444'}, legend=False, ax=axes[1, 1], width=0.4)
axes[1, 1].set_title('D. Monthly Income Distribution by Attrition Status', fontweight='bold')
axes[1, 1].set_ylabel('Monthly Income ($)')

plt.suptitle('Predict & Retain — Workforce Attrition Analytics Summary', fontsize=16, fontweight='bold', y=0.99)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'eda_charts.png'), dpi=300)
plt.close()

print('All 13 publication charts rendered and saved to outputs/!')
