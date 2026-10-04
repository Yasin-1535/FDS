import os
import unittest
import pandas as pd
import numpy as np

class TestDataPipeline(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Resolve dataset paths relative to repository root
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.orig_path = os.path.join(base_dir, "data", "original_dataset.csv")
        cls.final_path = os.path.join(base_dir, "data", "final_dataset.csv")
        
        cls.required_columns = [
            'Attrition', 'Age', 'Education', 'EducationField', 'DistanceFromHome',
            'Department', 'JobRole', 'BusinessTravel', 'YearsAtCompany',
            'MonthlyIncome', 'OverTime', 'JobSatisfaction', 'WorkLifeBalance',
            'Attrition_Num', 'TenureRatio'
        ]

    def test_01_original_dataset_exists(self):
        """Verify original dataset exists on disk and is non-empty."""
        self.assertTrue(os.path.exists(self.orig_path), f"Original dataset missing at {self.orig_path}")
        df = pd.read_csv(self.orig_path)
        self.assertGreater(len(df), 0, "Original dataset is empty")
        self.assertEqual(len(df), 1470, f"Expected 1,470 records, got {len(df)}")

    def test_02_final_dataset_exists(self):
        """Verify final cleaned dataset exists on disk."""
        self.assertTrue(os.path.exists(self.final_path), f"Final dataset missing at {self.final_path}")

    def test_03_final_dataset_can_reload(self):
        """Verify final dataset can be parsed and reloaded cleanly."""
        df = pd.read_csv(self.final_path)
        self.assertIsInstance(df, pd.DataFrame)
        self.assertEqual(len(df), 1470, f"Expected 1,470 records in final dataset, got {len(df)}")

    def test_04_required_columns_exist(self):
        """Verify all mandated analytical fields exist in final_dataset.csv."""
        df = pd.read_csv(self.final_path)
        missing_cols = [c for c in self.required_columns if c not in df.columns]
        self.assertEqual(len(missing_cols), 0, f"Missing required columns in final dataset: {missing_cols}")

    def test_05_attrition_values_valid(self):
        """Verify Attrition column contains only valid values ('Yes', 'No')."""
        df = pd.read_csv(self.final_path)
        valid_attrition = {'Yes', 'No'}
        actual_values = set(df['Attrition'].dropna().unique())
        self.assertTrue(actual_values.issubset(valid_attrition), f"Unexpected Attrition values: {actual_values}")

    def test_06_attrition_num_valid(self):
        """Verify Attrition_Num contains only integers 0 and 1 with exact mapping."""
        df = pd.read_csv(self.final_path)
        self.assertEqual(set(df['Attrition_Num'].unique()), {0, 1})
        # Check mapping consistency
        mismatches = df[(df['Attrition'] == 'Yes') & (df['Attrition_Num'] != 1)]
        self.assertEqual(len(mismatches), 0, "Attrition 'Yes' not mapped to 1")
        mismatches_no = df[(df['Attrition'] == 'No') & (df['Attrition_Num'] != 0)]
        self.assertEqual(len(mismatches_no), 0, "Attrition 'No' not mapped to 0")

    def test_07_tenure_ratio_valid(self):
        """Verify TenureRatio is non-negative and mathematically valid (<= 1.0)."""
        df = pd.read_csv(self.final_path)
        self.assertTrue((df['TenureRatio'] >= 0.0).all(), "Negative TenureRatio found")
        self.assertTrue((df['TenureRatio'] <= 1.0).all(), "TenureRatio greater than 1.0 found")
        # Validate calculation logic (supports YearsAtCompany / TotalWorkingYears or YearsAtCompany / Age)
        expected_working = (df['YearsAtCompany'] / df['TotalWorkingYears'].replace(0, np.nan)).fillna(0)
        expected_age = (df['YearsAtCompany'] / df['Age'].replace(0, np.nan)).fillna(0)
        diff_working = (df['TenureRatio'] - expected_working).abs().max()
        diff_age = (df['TenureRatio'] - expected_age).abs().max()
        self.assertTrue(diff_working < 1e-3 or diff_age < 1e-3, "TenureRatio does not match expected calculation logic")

    def test_08_no_duplicate_records(self):
        """Verify there are no unexpected duplicate rows in the final dataset."""
        df = pd.read_csv(self.final_path)
        duplicates = df.duplicated().sum()
        self.assertEqual(duplicates, 0, f"Found {duplicates} duplicate records in final dataset")

    def test_09_no_missing_values_in_required_features(self):
        """Verify zero missing/null values in key analytical features."""
        df = pd.read_csv(self.final_path)
        null_counts = df[self.required_columns].isnull().sum()
        total_nulls = null_counts.sum()
        self.assertEqual(total_nulls, 0, f"Null values detected in required columns:\n{null_counts[null_counts > 0]}")

    def test_10_monthly_income_positive_and_realistic(self):
        """Verify compensation values are positive and strictly non-zero."""
        df = pd.read_csv(self.final_path)
        self.assertGreater(df['MonthlyIncome'].min(), 0, "Non-positive monthly income detected")
        self.assertGreater(df['MonthlyIncome'].mean(), 1000, "Unreasonably low average income")

if __name__ == '__main__':
    unittest.main()
