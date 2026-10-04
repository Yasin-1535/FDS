import os
import unittest
import pandas as pd
import numpy as np
from dashboard.pipeline import (
    normalize_columns,
    validate_schema,
    clean_and_transform,
    detect_column_types,
    get_data_health_metrics,
    select_smart_chart,
    clean_col_name,
    build_manual_chart,
    detect_geographic_columns,
    compute_retention_priorities,
    REQUIRED_HR_FIELDS
)

class TestUploadPipeline(unittest.TestCase):

    def setUp(self):
        # Sample synthetic dataframe with messy column names
        self.sample_raw = pd.DataFrame({
            'employee_age': [25, 40, 50, 0, -5],
            'attrition_status': ['Yes', 'No', 'No', 'Yes', 'No'],
            'dept': ['Sales', 'R&D', 'HR', 'Sales', 'R&D'],
            'job_role': ['Sales Rep', 'Research Scientist', 'HR Specialist', 'Sales Rep', 'Manager'],
            'monthly_income': [2500, 7000, 4500, 3000, 15000],
            'ot': ['Yes', 'No', 'Yes', 'No', 'No'],
            'tenure_years': [2, 10, 15, 0, 2],
            'commute_distance': [3, 8, 25, 12, 1],
            'satisfaction_score': [1, 3, 4, 2, 3],
            'wlb_score': [2, 3, 1, 4, 3],
            'education_level': [3, 4, 2, 3, 5],
            'degree_field': ['Life Sciences', 'Medical', 'Other', 'Marketing', 'Technical'],
            'travel_frequency': ['Travel_Rarely', 'Non-Travel', 'Travel_Frequently', 'Travel_Rarely', 'Non-Travel']
        })

    def test_01_clean_col_name(self):
        """Verify clean_col_name normalizes various string formatting patterns."""
        self.assertEqual(clean_col_name("Monthly Income"), "monthlyincome")
        self.assertEqual(clean_col_name("monthly_income"), "monthlyincome")
        self.assertEqual(clean_col_name("  Distance-From_Home  "), "distancefromhome")

    def test_02_normalize_columns(self):
        """Verify column normalization safely maps aliases to canonical names."""
        df_norm, mapping, amb = normalize_columns(self.sample_raw)
        self.assertIn('Age', df_norm.columns)
        self.assertIn('Attrition', df_norm.columns)
        self.assertIn('Department', df_norm.columns)
        self.assertIn('JobRole', df_norm.columns)
        self.assertIn('MonthlyIncome', df_norm.columns)
        self.assertIn('OverTime', df_norm.columns)
        self.assertIn('YearsAtCompany', df_norm.columns)
        self.assertIn('DistanceFromHome', df_norm.columns)
        self.assertIn('JobSatisfaction', df_norm.columns)
        self.assertIn('WorkLifeBalance', df_norm.columns)
        self.assertEqual(len(amb), 0)

    def test_03_validate_schema_full_and_partial(self):
        """Verify schema validation detects complete vs missing fields."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        report = validate_schema(df_norm)
        self.assertTrue(report['is_valid'])
        self.assertEqual(len(report['missing_cols']), 0)

        # Drop one column and re-test
        df_incomplete = df_norm.drop(columns=['DistanceFromHome'])
        report_inc = validate_schema(df_incomplete)
        self.assertFalse(report_inc['is_valid'])
        self.assertIn('DistanceFromHome', report_inc['missing_cols'])

    def test_04_clean_and_transform_features(self):
        """Verify Attrition_Num, TenureRatio, and groupings are properly engineered."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        df_clean, summary = clean_and_transform(df_norm)

        self.assertIn('Attrition_Num', df_clean.columns)
        self.assertIn('TenureRatio', df_clean.columns)
        self.assertIn('TenureGroup', df_clean.columns)
        self.assertIn('DistanceBand', df_clean.columns)

        # Check binary mapping
        self.assertEqual(df_clean['Attrition_Num'].iloc[0], 1)
        self.assertEqual(df_clean['Attrition_Num'].iloc[1], 0)

        # Check zero/invalid age safety
        # Row 3 had Age=0 -> TenureRatio must be 0.0, not NaN or inf
        self.assertEqual(df_clean['TenureRatio'].iloc[3], 0.0)
        # TenureRatio must be non-negative and <= 1.0
        self.assertTrue((df_clean['TenureRatio'] >= 0.0).all())
        self.assertTrue((df_clean['TenureRatio'] <= 1.0).all())

    def test_05_detect_column_types(self):
        """Verify semantic type classification."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        df_clean, _ = clean_and_transform(df_norm)
        types = detect_column_types(df_clean)

        self.assertEqual(types['Age'], 'numeric')
        self.assertEqual(types['MonthlyIncome'], 'numeric')
        self.assertEqual(types['Department'], 'categorical')
        self.assertEqual(types['JobSatisfaction'], 'ordinal')
        self.assertEqual(types['WorkLifeBalance'], 'ordinal')
        self.assertEqual(types['Attrition'], 'binary')

    def test_06_data_health_metrics(self):
        """Verify data health card metrics."""
        health = get_data_health_metrics(self.sample_raw)
        self.assertEqual(health['rows'], 5)
        self.assertEqual(health['cols'], 13)
        self.assertGreaterEqual(health['health_score'], 0)
        self.assertLessEqual(health['health_score'], 100)

    def test_07_smart_chart_single_numeric(self):
        """Verify intelligent engine chooses histogram for single numeric variable."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        fig, rationale = select_smart_chart(df_norm, x_col='MonthlyIncome')
        self.assertIn("Histogram", rationale)
        self.assertIsNotNone(fig)

    def test_08_smart_chart_numeric_categorical(self):
        """Verify intelligent engine chooses box plot for numeric + categorical."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        fig, rationale = select_smart_chart(df_norm, x_col='Department', y_col='MonthlyIncome')
        self.assertIn("Box Plot", rationale)
        self.assertIsNotNone(fig)

    def test_09_smart_chart_numeric_numeric(self):
        """Verify intelligent engine chooses scatter plot for two numeric variables."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        fig, rationale = select_smart_chart(df_norm, x_col='Age', y_col='MonthlyIncome')
        self.assertIn("Scatter Plot", rationale)
        self.assertIsNotNone(fig)

    def test_10_smart_chart_ordinal_target(self):
        """Verify intelligent engine chooses ordered bar chart for ordinal variables."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        df_clean, _ = clean_and_transform(df_norm)
        fig, rationale = select_smart_chart(df_clean, x_col='JobSatisfaction')
        self.assertIn("Ordered Bar Chart", rationale)
        self.assertIsNotNone(fig)

    def test_11_empty_dataframe_safety(self):
        """Verify select_smart_chart handles empty dataframes safely without crashing."""
        empty_df = pd.DataFrame()
        fig, rationale = select_smart_chart(empty_df, x_col='NonExistent')
        self.assertIsNotNone(fig)
        self.assertIn("No data", rationale)

    def test_12_high_cardinality_category(self):
        """Verify categories with >20 values are condensed to Top N + Other."""
        high_card_df = pd.DataFrame({
            'City': [f'City_{i}' for i in range(30)],
            'Value': np.random.randint(10, 100, 30)
        })
        fig, rationale = select_smart_chart(high_card_df, x_col='City')
        self.assertIn("Top-N Horizontal Bar Chart", rationale)
        self.assertIsNotNone(fig)

    def test_13_manual_all_eleven_chart_representations(self):
        """Verify build_manual_chart accurately renders all 11 explicit representations."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        df_clean, _ = clean_and_transform(df_norm)

        # 1. Bar Chart
        fig, exp = build_manual_chart(df_clean, "📊 Bar Chart", {'category': 'Department', 'measure': 'Attrition Rate (%)'})
        self.assertIsNotNone(fig)
        self.assertIn("attrition rate", exp.lower())

        # 2. Line Chart
        fig, exp = build_manual_chart(df_clean, "📈 Line Chart", {'x_col': 'TenureGroup', 'y_measure': 'Attrition Rate (%)'})
        self.assertIsNotNone(fig)
        self.assertIn("trend", exp.lower())

        # 3. Histogram
        fig, exp = build_manual_chart(df_clean, "📊 Histogram", {'num_col': 'MonthlyIncome', 'bins': '10'})
        self.assertIsNotNone(fig)
        self.assertIn("distribution", exp.lower())

        # 4. Pie Chart
        fig, exp = build_manual_chart(df_clean, "🥧 Pie Chart", {'category': 'Attrition', 'value': 'Employee Count'})
        self.assertIsNotNone(fig)
        self.assertIn("proportional", exp.lower())

        # 5. Scatter Plot
        fig, exp = build_manual_chart(df_clean, "🔵 Scatter Plot", {'x_col': 'Age', 'y_col': 'MonthlyIncome', 'color_by': 'Attrition'})
        self.assertIsNotNone(fig)
        self.assertIn("bivariate", exp.lower())

        # 6. Box Plot
        fig, exp = build_manual_chart(df_clean, "📦 Box Plot", {'num_col': 'MonthlyIncome', 'group_by': 'Attrition'})
        self.assertIsNotNone(fig)
        self.assertIn("median", exp.lower())

        # 7. Heatmap - Correlation Matrix
        fig, exp = build_manual_chart(df_clean, "🔥 Heatmap", {'heatmap_type': 'Correlation Matrix'})
        self.assertIsNotNone(fig)
        self.assertIn("correlation", exp.lower())

        # 7b. Heatmap - Crosstab
        fig, exp = build_manual_chart(df_clean, "🔥 Heatmap", {'heatmap_type': 'Crosstab Heatmap', 'x_cat': 'JobSatisfaction', 'y_cat': 'WorkLifeBalance'})
        self.assertIsNotNone(fig)
        self.assertIn("cross-tabulated", exp.lower())

        # 8. Grouped Bar Chart
        fig, exp = build_manual_chart(df_clean, "📊 Grouped Bar Chart", {'category': 'Department', 'group_by': 'Attrition', 'measure': 'Employee Count'})
        self.assertIsNotNone(fig)
        self.assertIn("compares", exp.lower())

        # 9. Donut Chart
        fig, exp = build_manual_chart(df_clean, "🍩 Donut Chart", {'category': 'OverTime', 'value': 'Employee Count'})
        self.assertIsNotNone(fig)
        self.assertIn("donut", exp.lower())

        # 10. Area Chart
        fig, exp = build_manual_chart(df_clean, "📊 Area Chart", {'x_col': 'TenureGroup', 'y_measure': 'Attrition Rate (%)'})
        self.assertIsNotNone(fig)
        self.assertIn("area", exp.lower())

        # 11. Choropleth Map (Unavailable case on non-geographic dataset)
        fig, exp = build_manual_chart(df_clean, "🌍 Choropleth Map", {})
        self.assertIsNotNone(fig)
        self.assertIn("unavailable", exp.lower())

    def test_14_retention_priorities_and_geo(self):
        """Verify retention priorities computation and geographic exclusion."""
        df_norm, _, _ = normalize_columns(self.sample_raw)
        df_clean, _ = clean_and_transform(df_norm)

        priorities = compute_retention_priorities(df_clean)
        self.assertGreaterEqual(len(priorities), 4)
        for p in priorities:
            self.assertIn('factor', p)
            self.assertIn('metric', p)
            self.assertIn('level', p)
            self.assertIn(p['level'], ['HIGH', 'WATCH', 'STABLE', 'REVIEW'])

        # DistanceFromHome must NOT be classified as geographic
        geo_cols = detect_geographic_columns(df_clean)
        self.assertNotIn('DistanceFromHome', geo_cols)
        self.assertNotIn('commute_distance', geo_cols)

        # Test true geographic column detection
        geo_df = df_clean.copy()
        geo_df['State'] = ['CA', 'NY', 'TX', 'WA', 'IL']
        detected = detect_geographic_columns(geo_df)
        self.assertIn('State', detected)

    def test_15_dynamic_custom_dataset_isolation(self):
        """Verify uploaded custom dataset produces purely dynamic values with zero benchmark leakage."""
        custom_data = pd.DataFrame({
            'emp_age': [24, 30, 36, 42, 48, 54],
            'attrition': ['Yes', 'No', 'Yes', 'No', 'Yes', 'No'],
            'dept': ['Sales', 'R&D', 'Sales', 'HR', 'R&D', 'Sales'],
            'job_role': ['Sales Rep', 'Manager', 'Sales Rep', 'HR Specialist', 'Manager', 'Sales Rep'],
            'salary': [3000, 6000, 3500, 5000, 7000, 2500],
            'overtime': ['Yes', 'No', 'Yes', 'No', 'Yes', 'No'],
            'tenure': [1, 5, 2, 8, 12, 1],
            'commute': [4, 12, 8, 2, 22, 15]
        })
        df_norm, mapping, _ = normalize_columns(custom_data)
        df_clean, summary = clean_and_transform(df_norm)

        # Dynamic metrics verification
        total_custom = len(df_clean)
        custom_attrition_rate = (df_clean['Attrition_Num'].mean() * 100)
        custom_mean_income = df_clean['MonthlyIncome'].mean()

        self.assertEqual(total_custom, 6)
        self.assertNotEqual(total_custom, 1470)

        self.assertEqual(custom_attrition_rate, 50.0)
        self.assertNotEqual(custom_attrition_rate, 16.12)

        self.assertEqual(custom_mean_income, 4500.0)
        self.assertNotEqual(round(custom_mean_income, 2), 6832.74)

        # Confirm priority board also calculates custom metrics
        priorities = compute_retention_priorities(df_clean)
        ot_priority = next(p for p in priorities if p['factor'] == 'Overtime Exposure')
        # Overtime yes rate is 3/3 = 100%, overtime no rate is 0/3 = 0%
        self.assertEqual(ot_priority['level'], 'HIGH')
        self.assertIn('100.0%', ot_priority['metric'])

if __name__ == '__main__':
    unittest.main()


