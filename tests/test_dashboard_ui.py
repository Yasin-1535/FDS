import unittest
from streamlit.testing.v1 import AppTest

class TestDashboardUI(unittest.TestCase):
    def test_01_benchmark_dashboard_renders(self):
        """Test that default dashboard starts up without uncaught exceptions."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        self.assertFalse(at.exception, f"App threw exception: {at.exception}")

    def test_02_kpi_card_values_and_labels(self):
        """Test KPI cards display expected benchmark values and no raw HTML leaked."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        
        # Check that no markdown elements leaked unrendered HTML tags as visible text
        for md in at.markdown:
            val = md.value or ""
            # If it's pure markdown without unsafe_allow_html, it shouldn't show raw div/span syntax to user
            # In our implementation, all raw HTML is passed through render_html with unsafe_allow_html=True
            # Ensure there is no accidental code block <pre><code> containing div
            self.assertNotIn("<pre><code><div", val)
            self.assertNotIn("```<div", val)

        # Check that "Currently Active in Post" is NOT present anywhere
        full_text = " ".join([m.value or "" for m in at.markdown])
        self.assertNotIn("Currently Active in Post", full_text)

        # Check that 6,832.74 is present
        self.assertIn("6,832.74", full_text)
        self.assertNotIn("$6,503", full_text)

    def test_03_all_nav_sectors(self):
        """Test navigating to each operational sector without error."""
        sectors = [
            "▣ Overview",
            "▣ Workforce",
            "▣ Compensation",
            "▣ Overtime",
            "▣ Satisfaction",
            "▣ Commute",
            "▣ Risk Signals",
            "▣ Evidence",
            "📊 Data Representation",
            "⬇️ Download Archives",
            "📋 Full Situation Board"
        ]
        for sec in sectors:
            at = AppTest.from_file("dashboard/app.py").run(timeout=30)
            at.sidebar.radio[0].set_value(sec).run(timeout=30)
            self.assertFalse(at.exception, f"Sector {sec} crashed with: {at.exception}")

    def test_04_data_representation_chart_types(self):
        """Test switching between all 11 chart representations in Data Representation Console."""
        chart_types = [
            "📊 Bar Chart",
            "📈 Line Chart",
            "📊 Histogram",
            "🥧 Pie Chart",
            "🔵 Scatter Plot",
            "📦 Box Plot",
            "🔥 Heatmap",
            "📊 Grouped Bar Chart",
            "🍩 Donut Chart",
            "📊 Area Chart",
            "🌍 Choropleth Map"
        ]
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.sidebar.radio[0].set_value("📊 Data Representation").run(timeout=30)
        self.assertFalse(at.exception)

        for ct in chart_types:
            # selectbox[0] in main area is SELECT DATA REPRESENTATION
            at.selectbox[0].set_value(ct).run(timeout=30)
            self.assertFalse(at.exception, f"Chart type {ct} crashed with: {at.exception}")

    def test_05_retention_priority_board(self):
        """Test retention priority board displays calculated factors without raw HTML."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.sidebar.radio[0].set_value("▣ Risk Signals").run(timeout=30)
        self.assertFalse(at.exception)
        full_text = " ".join([m.value or "" for m in at.markdown])
        self.assertIn("RETENTION PRIORITY BOARD", full_text)
        self.assertIn("OVERTIME EXPOSURE", full_text.upper())
        self.assertNotIn("<pre><code>", full_text)

    def test_06_analysis_section_persistence(self):
        """Test Analysis Section persists across multiple Streamlit reruns without reset."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Overview")
        at.selectbox[0].set_value("Compensation").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        # Trigger explicit rerun without changing selectbox
        at.run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        at.run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")

    def test_07_visualization_type_persistence(self):
        """Test Visualization Type persists across reruns and interactions."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        self.assertEqual(at.selectbox[1].value, "Bar Chart")
        at.selectbox[1].set_value("Line Chart").run(timeout=30)
        self.assertEqual(at.selectbox[1].value, "Line Chart")
        at.run(timeout=30)
        self.assertEqual(at.selectbox[1].value, "Line Chart")

    def test_08_compensation_selection_remaining_compensation(self):
        """Test Compensation remains Compensation after changing viz type, filters, and rerunning."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.selectbox[0].set_value("Compensation").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        # Change Visualization Type to Line Chart
        at.selectbox[1].set_value("Line Chart").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        self.assertEqual(at.selectbox[1].value, "Line Chart")
        # Change OverTime filter to Yes
        at.selectbox[4].set_value("Yes").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        self.assertEqual(at.selectbox[1].value, "Line Chart")
        # Change Visualization Type to ALL
        at.selectbox[1].set_value("ALL").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Compensation")
        self.assertEqual(at.selectbox[1].value, "ALL")

    def test_09_overtime_selection_remaining_overtime(self):
        """Test Overtime remains Overtime after changing viz type to ALL and interacting."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.selectbox[0].set_value("Overtime").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Overtime")
        at.selectbox[1].set_value("ALL").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Overtime")
        self.assertEqual(at.selectbox[1].value, "ALL")
        at.selectbox[1].set_value("Donut Chart").run(timeout=30)
        self.assertEqual(at.selectbox[0].value, "Overtime")
        self.assertEqual(at.selectbox[1].value, "Donut Chart")

    def test_10_all_visualization_mode(self):
        """Test ALL visualization mode renders all applicable charts vertically without exception."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.selectbox[0].set_value("Compensation").run(timeout=30)
        at.selectbox[1].set_value("ALL").run(timeout=30)
        self.assertFalse(at.exception)
        charts = at.get("plotly_chart")
        self.assertGreaterEqual(len(charts), 10, "Expected at least 10 charts rendered in ALL mode")

    def test_11_all_mode_with_filtered_dataframe(self):
        """Test ALL mode operates correctly under active filter conditions."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.selectbox[0].set_value("Compensation").run(timeout=30)
        at.selectbox[1].set_value("ALL").run(timeout=30)
        at.selectbox[4].set_value("Yes").run(timeout=30)  # OverTime = Yes
        self.assertFalse(at.exception)
        full_text = " ".join([m.value or "" for m in at.markdown])
        self.assertIn("Showing 416 of 1,470 employees", full_text)

    def test_12_all_mode_choropleth_safety_fallback(self):
        """Test that ALL mode includes the safe explanatory fallback for Choropleth Map."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        at.selectbox[0].set_value("Compensation").run(timeout=30)
        at.selectbox[1].set_value("ALL").run(timeout=30)
        self.assertFalse(at.exception)
        full_text = " ".join([m.value or "" for m in at.markdown])
        self.assertIn("Choropleth Map", full_text)
        self.assertIn("Unavailable for Current Dataset", full_text)
        self.assertIn("DistanceFromHome", full_text)

    def test_13_independent_session_state_keys(self):
        """Test that analysis_section and visualization_type exist as independent session state values."""
        at = AppTest.from_file("dashboard/app.py").run(timeout=30)
        self.assertIn("analysis_section", at.session_state)
        self.assertIn("visualization_type", at.session_state)
        self.assertEqual(at.session_state["analysis_section"], "Overview")
        self.assertEqual(at.session_state["visualization_type"], "Bar Chart")

        at.selectbox[0].set_value("Commute").run(timeout=30)
        self.assertEqual(at.session_state["analysis_section"], "Commute")
        self.assertEqual(at.session_state["visualization_type"], "Bar Chart")

        at.selectbox[1].set_value("ALL").run(timeout=30)
        self.assertEqual(at.session_state["analysis_section"], "Commute")
        self.assertEqual(at.session_state["visualization_type"], "ALL")


if __name__ == '__main__':
    unittest.main()
