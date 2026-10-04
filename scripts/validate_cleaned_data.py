import pandas as pd
import numpy as np
from scipy import stats

df = pd.read_csv(r'C:\Users\srval\Downloads\final_dataset_cleaned_for_visualization.csv', encoding='utf-8')
print('Total employees:', len(df))
ret = df[df['Attrition'] == 'No']
dep = df[df['Attrition'] == 'Yes']
print('Retained:', len(ret))
print('Departed:', len(dep))
print(f'Overall attrition: {len(dep) / len(df) * 100:.2f}%')

print('\nCompensation:')
print(f'Overall mean MonthlyIncome: ${df["MonthlyIncome"].mean():.2f}')
print(f'Retained mean: ${ret["MonthlyIncome"].mean():.2f}')
print(f'Departed mean: ${dep["MonthlyIncome"].mean():.2f}')

print('\nOvertime:')
ot_yes = df[df['OverTime'] == 'Yes']
ot_no = df[df['OverTime'] == 'No']
print(f'Overtime Yes count: {len(ot_yes)}, attrition: {(ot_yes["Attrition"] == "Yes").mean() * 100:.2f}%')
print(f'Overtime No count: {len(ot_no)}, attrition: {(ot_no["Attrition"] == "Yes").mean() * 100:.2f}%')

print('\nStatistical evidence:')
# Welch t-statistic: dep vs ret or ret vs dep?
# Let's check both:
ttest1 = stats.ttest_ind(dep['MonthlyIncome'], ret['MonthlyIncome'], equal_var=False)
ttest2 = stats.ttest_ind(ret['MonthlyIncome'], dep['MonthlyIncome'], equal_var=False)
print(f'Welch t-stat (dep - ret): {ttest1.statistic:.4f}, p-val: {ttest1.pvalue:.4e}')
print(f'Welch t-stat (ret - dep): {ttest2.statistic:.4f}, p-val: {ttest2.pvalue:.4e}')

contingency = pd.crosstab(df['OverTime'], df['Attrition'])
print('Contingency table:\n', contingency)
chi2_yates = stats.chi2_contingency(contingency, correction=True)
chi2_uncorr = stats.chi2_contingency(contingency, correction=False)
print(f'Chi2 (Yates corrected): {chi2_yates[0]:.4f}, p-val: {chi2_yates[1]:.4e}')
print(f'Chi2 (Uncorrected): {chi2_uncorr[0]:.4f}, p-val: {chi2_uncorr[1]:.4e}')

print('\nJobSatisfaction Attrition Rate:')
for js in sorted(df['JobSatisfaction'].unique()):
    sub = df[df['JobSatisfaction'] == js]
    rate = (sub['Attrition'] == 'Yes').mean() * 100
    print(f'Level {js}: {rate:.2f}% ({len(sub)} employees)')

print('\nWorkLifeBalance Attrition Rate:')
for wlb in sorted(df['WorkLifeBalance'].unique()):
    sub = df[df['WorkLifeBalance'] == wlb]
    rate = (sub['Attrition'] == 'Yes').mean() * 100
    print(f'Level {wlb}: {rate:.2f}% ({len(sub)} employees)')

print('\nDistanceGroup Attrition Rate:')
for dg in ['0–5 km', '6–10 km', '11–20 km', '21+ km']:
    sub = df[df['DistanceGroup'] == dg]
    rate = (sub['Attrition'] == 'Yes').mean() * 100
    print(f'{dg}: {rate:.2f}% ({len(sub)} employees)')
