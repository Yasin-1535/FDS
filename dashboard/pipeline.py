import io
import re
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Canonical required HR analytical fields
REQUIRED_HR_FIELDS = [
    'Attrition',
    'Age',
    'Education',
    'EducationField',
    'DistanceFromHome',
    'Department',
    'JobRole',
    'BusinessTravel',
    'YearsAtCompany',
    'MonthlyIncome',
    'OverTime',
    'JobSatisfaction',
    'WorkLifeBalance'
]

# Aliases and common naming variations for flexible column mapping
COLUMN_ALIASES = {
    'Attrition': ['attrition', 'attrition_status', 'left_company', 'churn', 'turnover', 'is_attrited', 'attrited'],
    'Age': ['age', 'employee_age', 'emp_age'],
    'Education': ['education', 'education_level', 'edu_level', 'education_num'],
    'EducationField': ['educationfield', 'education_field', 'degree_field', 'field_of_study', 'major'],
    'DistanceFromHome': ['distancefromhome', 'distance_from_home', 'commute_distance', 'commute_miles', 'distance_km', 'distance'],
    'Department': ['department', 'dept', 'business_unit', 'division', 'org_unit'],
    'JobRole': ['jobrole', 'job_role', 'role', 'position', 'designation', 'job_title', 'title'],
    'BusinessTravel': ['businesstravel', 'business_travel', 'travel_frequency', 'travel'],
    'YearsAtCompany': ['yearsatcompany', 'years_at_company', 'company_tenure', 'tenure_years', 'tenure'],
    'MonthlyIncome': ['monthlyincome', 'monthly_income', 'salary', 'monthly_salary', 'income', 'base_pay', 'earnings'],
    'OverTime': ['overtime', 'over_time', 'ot_status', 'ot'],
    'JobSatisfaction': ['jobsatisfaction', 'job_satisfaction', 'satisfaction_level', 'satisfaction_score'],
    'WorkLifeBalance': ['worklifebalance', 'work_life_balance', 'wlb_score', 'wlb_rating', 'wlb']
}

def clean_col_name(col: str) -> str:
    """Normalize string for fuzzy comparison: lowercased, stripped, no underscores or spaces."""
    return re.sub(r'[\s_\-]+', '', str(col).strip().lower())

def normalize_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, dict, list]:
    """
    Map variations of required HR columns to standard canonical names safely.
    Returns:
        (df_mapped, mapping_dict, ambiguities)
    """
    df_copy = df.copy()
    current_cols = df_copy.columns.tolist()
    mapping = {}
    ambiguities = []

    # Map exact matches first
    for canon in REQUIRED_HR_FIELDS:
        if canon in current_cols:
            mapping[canon] = canon

    # Map fuzzy variations
    for canon, aliases in COLUMN_ALIASES.items():
        if canon in mapping:
            continue
        cleaned_aliases = [clean_col_name(a) for a in aliases] + [clean_col_name(canon)]
        matches = []
        for col in current_cols:
            if col in mapping.values():
                continue
            cleaned = clean_col_name(col)
            if cleaned in cleaned_aliases:
                matches.append(col)
        
        if len(matches) == 1:
            mapping[matches[0]] = canon
        elif len(matches) > 1:
            ambiguities.append((canon, matches))

    # Apply renaming for mapped columns
    rename_dict = {orig: target for orig, target in mapping.items() if orig != target}
    if rename_dict:
        df_copy.rename(columns=rename_dict, inplace=True)
    
    return df_copy, mapping, ambiguities

def validate_schema(df: pd.DataFrame) -> dict:
    """
    Evaluate dataframe columns against required HR fields.
    Returns validation report dict.
    """
    found_cols = [c for c in REQUIRED_HR_FIELDS if c in df.columns]
    missing_cols = [c for c in REQUIRED_HR_FIELDS if c not in df.columns]
    is_valid = len(missing_cols) == 0

    return {
        'is_valid': is_valid,
        'found_cols': found_cols,
        'missing_cols': missing_cols,
        'total_required': len(REQUIRED_HR_FIELDS),
        'completeness_pct': round((len(found_cols) / len(REQUIRED_HR_FIELDS)) * 100, 1)
    }

def clean_and_transform(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Clean dataset and engineer features:
      - Attrition_Num (Yes/1 -> 1, No/0 -> 0)
      - TenureRatio = YearsAtCompany / Age (safely bounded)
      - TenureGroup: ['0-2 years', '3-5 years', '6-10 years', '11+ years']
      - DistanceBand: ['0-5 km', '6-10 km', '11-20 km', '21+ km']
    Returns:
        (df_cleaned, summary_dict)
    """
    df_clean = df.copy()
    
    # 1. Deduplication
    initial_rows = len(df_clean)
    df_clean = df_clean.drop_duplicates()
    duplicates_removed = initial_rows - len(df_clean)

    # 2. Attrition_Num mapping
    if 'Attrition' in df_clean.columns:
        if df_clean['Attrition'].dtype == object or isinstance(df_clean['Attrition'].iloc[0], str):
            attr_map = {
                'yes': 1, 'y': 1, 'true': 1, '1': 1, 1: 1,
                'no': 0, 'n': 0, 'false': 0, '0': 0, 0: 0
            }
            df_clean['Attrition_Num'] = df_clean['Attrition'].astype(str).str.strip().str.lower().map(attr_map)
            df_clean['Attrition_Num'] = df_clean['Attrition_Num'].fillna(0).astype(int)
        else:
            df_clean['Attrition_Num'] = (df_clean['Attrition'] == 1).astype(int)
    elif 'Attrition_Num' in df_clean.columns:
        df_clean['Attrition_Num'] = df_clean['Attrition_Num'].astype(int)
        if 'Attrition' not in df_clean.columns:
            df_clean['Attrition'] = df_clean['Attrition_Num'].map({1: 'Yes', 0: 'No'})

    # 3. Numeric conversion for Age and YearsAtCompany
    if 'Age' in df_clean.columns:
        df_clean['Age'] = pd.to_numeric(df_clean['Age'], errors='coerce')
    if 'YearsAtCompany' in df_clean.columns:
        df_clean['YearsAtCompany'] = pd.to_numeric(df_clean['YearsAtCompany'], errors='coerce')
    if 'MonthlyIncome' in df_clean.columns:
        df_clean['MonthlyIncome'] = pd.to_numeric(df_clean['MonthlyIncome'], errors='coerce')
    if 'DistanceFromHome' in df_clean.columns:
        df_clean['DistanceFromHome'] = pd.to_numeric(df_clean['DistanceFromHome'], errors='coerce')

    # 4. TenureRatio: YearsAtCompany / Age
    if 'YearsAtCompany' in df_clean.columns and 'Age' in df_clean.columns:
        valid_mask = (df_clean['Age'] > 0) & (df_clean['YearsAtCompany'] >= 0)
        df_clean['TenureRatio'] = np.where(
            valid_mask,
            (df_clean['YearsAtCompany'] / df_clean['Age']).round(4),
            0.0
        )
        # Cap at 1.0 for mathematical boundary safety
        df_clean['TenureRatio'] = np.clip(df_clean['TenureRatio'], 0.0, 1.0)

    # 5. TenureGroup
    if 'YearsAtCompany' in df_clean.columns:
        df_clean['TenureGroup'] = pd.cut(
            df_clean['YearsAtCompany'],
            bins=[-1, 2, 5, 10, 100],
            labels=['0-2 years', '3-5 years', '6-10 years', '11+ years']
        ).astype(str)

    # 6. DistanceBand
    if 'DistanceFromHome' in df_clean.columns:
        df_clean['DistanceBand'] = pd.cut(
            df_clean['DistanceFromHome'],
            bins=[-1, 5, 10, 20, 100],
            labels=['0-5 km', '6-10 km', '11-20 km', '21+ km']
        ).astype(str)

    summary = {
        'initial_rows': initial_rows,
        'final_rows': len(df_clean),
        'duplicates_removed': duplicates_removed,
        'total_nulls': int(df_clean.isnull().sum().sum()),
        'cols_count': len(df_clean.columns)
    }

    return df_clean, summary

def detect_column_types(df: pd.DataFrame) -> dict:
    """
    Classify dataframe columns into semantic & statistical types:
    numeric, categorical, binary, ordinal, datetime.
    """
    types = {}
    for col in df.columns:
        series = df[col]
        n_unique = series.nunique()
        
        # Check datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            types[col] = 'datetime'
            continue
            
        # Check binary
        if n_unique == 2:
            types[col] = 'binary'
            continue
            
        # Check known ordinal HR ratings (scale 1-4 or 1-5)
        if col in ['JobSatisfaction', 'WorkLifeBalance', 'Education', 'PerformanceRating', 'EnvironmentSatisfaction', 'JobInvolvement', 'RelationshipSatisfaction']:
            types[col] = 'ordinal'
            continue
            
        # Numeric
        if pd.api.types.is_numeric_dtype(series):
            types[col] = 'numeric'
        else:
            types[col] = 'categorical'

    return types

def get_data_health_metrics(df: pd.DataFrame) -> dict:
    """Compute data quality summary statistics for the health card."""
    col_types = detect_column_types(df)
    numeric_count = sum(1 for t in col_types.values() if t in ['numeric', 'ordinal'])
    categorical_count = sum(1 for t in col_types.values() if t in ['categorical', 'binary'])
    datetime_count = sum(1 for t in col_types.values() if t == 'datetime')
    
    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    duplicates = int(df.duplicated().sum())
    missing_cells = int(df.isnull().sum().sum())
    total_cells = df.shape[0] * df.shape[1] if df.shape[0] > 0 and df.shape[1] > 0 else 1
    health_score = round(max(0, 100 - (missing_cells / total_cells * 100) - (duplicates / max(1, len(df)) * 50)), 1)

    return {
        'rows': len(df),
        'cols': len(df.columns),
        'missing_cells': missing_cells,
        'duplicates': duplicates,
        'memory_mb': memory_mb,
        'numeric_cols': numeric_count,
        'categorical_cols': categorical_count,
        'datetime_cols': datetime_count,
        'health_score': health_score
    }

def apply_console_chart_theme(fig: go.Figure, height: int = 480, theme: str = "historical") -> go.Figure:
    """
    Applies either the historical operations-room dark console theme (default)
    or the sleek modern analytics theme to any Plotly figure.
    """
    is_modern = str(theme).lower().startswith("modern")
    
    paper_bg = "#0F172A" if is_modern else "#161D24"
    plot_bg = "#1E293B" if is_modern else "#1C242C"
    font_family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" if is_modern else "'Share Tech Mono', 'Courier New', monospace"
    text_color = "#F8FAFC" if is_modern else "#EDE6D6"
    title_color = "#F8FAFC" if is_modern else "#F5F8FA"
    grid_color = "#334155" if is_modern else "#26323D"
    line_color = "#475569" if is_modern else "#364350"
    tick_color = "#94A3B8" if is_modern else "#B5AA9A"
    hover_border = "#38BDF8" if is_modern else "#3DCC91"
    hover_bg = "#0F172A" if is_modern else "#182026"
    legend_bg = "rgba(30, 41, 59, 0.85)" if is_modern else "rgba(24, 32, 38, 0.8)"

    fig.update_layout(
        paper_bgcolor=paper_bg,
        plot_bgcolor=plot_bg,
        font=dict(family=font_family, color=text_color, size=12),
        title_font=dict(family=font_family, color=title_color, size=15),
        height=height,
        margin=dict(l=55, r=35, t=55, b=50),
        xaxis=dict(
            gridcolor=grid_color,
            linecolor=line_color,
            zerolinecolor=grid_color,
            tickfont=dict(color=tick_color, size=11),
            title_font=dict(color=text_color, size=12)
        ),
        yaxis=dict(
            gridcolor=grid_color,
            linecolor=line_color,
            zerolinecolor=grid_color,
            tickfont=dict(color=tick_color, size=11),
            title_font=dict(color=text_color, size=12)
        ),
        legend=dict(
            font=dict(color=text_color, size=11),
            bgcolor=legend_bg,
            bordercolor=line_color,
            borderwidth=1
        ),
        hoverlabel=dict(
            bgcolor=hover_bg,
            bordercolor=hover_border,
            font=dict(family=font_family, color="#F5F8FA", size=12)
        )
    )
    return fig


def select_smart_chart(
    df: pd.DataFrame,
    x_col: str,
    y_col: str = None,
    color_col: str = None,
    max_scatter_points: int = 2000
) -> tuple[go.Figure, str]:
    """
    Intelligent Visualization Engine:
    Selects optimal chart representation based on semantic types, cardinality, and dimensions.
    Returns:
        (plotly_figure, chart_rationale_string)
    """
    if df.empty or x_col not in df.columns:
        fig = go.Figure()
        fig.update_layout(title="No data available to display")
        apply_console_chart_theme(fig, 380)
        return fig, "No data available."

    types = detect_column_types(df)
    x_type = types.get(x_col, 'categorical')
    y_type = types.get(y_col, None) if y_col and y_col in df.columns else None
    
    # ----------------------------------------------------
    # Case 1: Single Numeric Variable (Distribution)
    # ----------------------------------------------------
    if y_col is None and x_type in ['numeric']:
        fig = px.histogram(
            df,
            x=x_col,
            color=color_col if color_col and color_col in df.columns else None,
            marginal="box",
            opacity=0.75,
            title=f"Distribution of {x_col}",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359']
        )
        fig.update_layout(xaxis_title=x_col, yaxis_title="Count / Density")
        apply_console_chart_theme(fig, 480)
        return fig, f"Selected **Histogram with Boxplot Marginal** to display distribution spread, skewness, and outliers for numeric variable `{x_col}`."

    # ----------------------------------------------------
    # Case 2: Single Categorical / Binary Variable
    # ----------------------------------------------------
    if y_col is None and x_type in ['categorical', 'binary']:
        val_counts = df[x_col].value_counts().reset_index()
        val_counts.columns = [x_col, 'Count']
        n_cats = len(val_counts)
        
        # Donut for very small binary proportions (2-3 items)
        if n_cats <= 3 and color_col is None:
            fig = px.pie(
                val_counts,
                names=x_col,
                values='Count',
                hole=0.55,
                title=f"Composition of {x_col}",
                color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359']
            )
            fig.update_traces(textposition='inside', textinfo='percent+label', marker=dict(line=dict(color='#182026', width=2)))
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Donut Chart** for low-cardinality ({n_cats} categories) proportional composition of `{x_col}`."
        
        # Horizontal Bar for moderate-to-high cardinality (7-20 categories)
        elif 7 <= n_cats <= 20:
            val_counts = val_counts.sort_values(by='Count', ascending=True)
            fig = px.bar(
                val_counts,
                y=x_col,
                x='Count',
                orientation='h',
                text='Count',
                title=f"Frequency Count by {x_col}",
                color='Count',
                color_continuous_scale=[[0, '#2D3E33'], [0.5, '#4E6A55'], [1, '#78A183']]
            )
            fig.update_traces(textposition='outside')
            apply_console_chart_theme(fig, max(480, n_cats * 28))
            fig.update_layout(coloraxis_showscale=False)
            return fig, f"Selected **Horizontal Bar Chart** to ensure readable category labels for {n_cats} distinct levels of `{x_col}`."
        
        # Extremely high cardinality (>20 categories): Top 15 + Other
        elif n_cats > 20:
            top_15 = val_counts.iloc[:15].copy()
            other_sum = val_counts.iloc[15:]['Count'].sum()
            other_df = pd.DataFrame([{x_col: 'Other (Combined)', 'Count': other_sum}])
            condensed = pd.concat([top_15, other_df], ignore_index=True).sort_values(by='Count', ascending=True)
            
            fig = px.bar(
                condensed,
                y=x_col,
                x='Count',
                orientation='h',
                text='Count',
                title=f"Top Categories of {x_col} (with Combined Others)",
                color_discrete_sequence=['#4A6B82']
            )
            fig.update_traces(textposition='outside')
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Top-N Horizontal Bar Chart** with grouped 'Other' to manage high cardinality ({n_cats} categories) in `{x_col}`."
        
        # Standard Vertical Bar
        else:
            fig = px.bar(
                val_counts,
                x=x_col,
                y='Count',
                text='Count',
                title=f"Headcount by {x_col}",
                color_discrete_sequence=['#4E6A55']
            )
            fig.update_traces(textposition='outside')
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Vertical Bar Chart** to compare counts across {n_cats} categories of `{x_col}`."

    # ----------------------------------------------------
    # Case 3: Ordinal + Target or Ordinal Variable
    # ----------------------------------------------------
    if x_type == 'ordinal' and (y_col is None or y_col == 'Attrition_Num'):
        if 'Attrition_Num' in df.columns:
            agg_df = df.groupby(x_col, observed=False).agg(
                Headcount=('Attrition_Num', 'count'),
                Attrition_Rate=('Attrition_Num', 'mean')
            ).reset_index()
            agg_df['Attrition_Rate%'] = (agg_df['Attrition_Rate'] * 100).round(1)
            # Ensure natural numeric ordering
            agg_df = agg_df.sort_values(by=x_col)
            
            fig = px.bar(
                agg_df,
                x=x_col,
                y='Attrition_Rate%',
                text='Attrition_Rate%',
                color='Attrition_Rate%',
                color_continuous_scale=[[0, '#4E6A55'], [0.5, '#D4A359'], [1, '#C05646']],
                title=f"Observed Attrition Rate by {x_col} (Preserved Ordinal Scale)"
            )
            fig.update_traces(texttemplate='%{text}%', textposition='outside')
            fig.update_layout(
                yaxis_title="Attrition Rate (%)",
                xaxis_title=f"{x_col} (Natural Low-to-High Order)",
                coloraxis_showscale=False
            )
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Ordered Bar Chart** preserving natural 1 $\\to$ 4 rating progression for ordinal feature `{x_col}`."

    # ----------------------------------------------------
    # Case 4: Numeric + Categorical (Box Plot / Grouped Bar)
    # ----------------------------------------------------
    if (x_type in ['categorical', 'binary', 'ordinal'] and y_type in ['numeric']) or \
       (x_type in ['numeric'] and y_type in ['categorical', 'binary', 'ordinal']):
        cat_col = x_col if x_type in ['categorical', 'binary', 'ordinal'] else y_col
        num_col = y_col if x_type in ['categorical', 'binary', 'ordinal'] else x_col
        
        fig = px.box(
            df,
            x=cat_col,
            y=num_col,
            color=color_col if color_col and color_col in df.columns else cat_col,
            points="outliers",
            title=f"{num_col} Distribution Across {cat_col}",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82', '#82919E']
        )
        fig.update_layout(
            xaxis_title=cat_col,
            yaxis_title=num_col,
            showlegend=False if color_col is None else True
        )
        apply_console_chart_theme(fig, 480)
        return fig, f"Selected **Box Plot with Outlier Points** to display distribution, median, and IQR of `{num_col}` segmented by `{cat_col}`."

    # ----------------------------------------------------
    # Case 5: Numeric + Numeric (Scatter Plot with Sampling Guard)
    # ----------------------------------------------------
    if x_type in ['numeric'] and y_type in ['numeric']:
        # Deterministic sampling protection for very large files
        sample_note = ""
        plot_df = df
        if len(df) > max_scatter_points:
            plot_df = df.sample(n=max_scatter_points, random_state=42)
            sample_note = f" (Sampled {max_scatter_points:,} of {len(df):,} points for performance)"

        fig = px.scatter(
            plot_df,
            x=x_col,
            y=y_col,
            color=color_col if color_col and color_col in plot_df.columns else None,
            opacity=0.75,
            title=f"{y_col} vs {x_col}{sample_note}",
            color_discrete_sequence=['#4A6B82', '#C05646', '#4E6A55', '#D4A359']
        )
        apply_console_chart_theme(fig, 480)
        return fig, f"Selected **Scatter Plot** to evaluate correlation and bivariate relationship between `{x_col}` and `{y_col}`."

    # ----------------------------------------------------
    # Case 6: Categorical + Categorical (Grouped Bar or Crosstab Heatmap)
    # ----------------------------------------------------
    if x_type in ['categorical', 'binary'] and y_type in ['categorical', 'binary']:
        cross = pd.crosstab(df[x_col], df[y_col])
        if cross.shape[0] <= 6 and cross.shape[1] <= 6:
            fig = px.imshow(
                cross,
                text_auto=True,
                color_continuous_scale=[[0, '#1C242C'], [0.5, '#2D3E33'], [1, '#4E6A55']],
                title=f"Cross-Tabulation Matrix: {x_col} × {y_col}"
            )
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Heatmap Crosstab Matrix** for low-cardinality interaction between `{x_col}` and `{y_col}`."
        else:
            fig = px.histogram(
                df,
                x=x_col,
                color=y_col,
                barmode="group",
                title=f"{x_col} Grouped by {y_col}",
                color_discrete_sequence=['#4A6B82', '#C05646', '#4E6A55', '#D4A359']
            )
            apply_console_chart_theme(fig, 480)
            return fig, f"Selected **Grouped Bar Chart** to compare proportions of `{y_col}` across levels of `{x_col}`."

    # ----------------------------------------------------
    # Case 7: Datetime + Numeric (Trend Line Chart)
    # ----------------------------------------------------
    if x_type == 'datetime' and y_type in ['numeric']:
        agg_ts = df.groupby(x_col)[y_col].mean().reset_index()
        fig = px.line(
            agg_ts,
            x=x_col,
            y=y_col,
            markers=True,
            title=f"Temporal Trend: {y_col} over Time",
            color_discrete_sequence=['#D4A359']
        )
        fig.update_traces(line=dict(width=3), marker=dict(size=8))
        apply_console_chart_theme(fig, 480)
        return fig, f"Selected **Time-Series Line Chart** to track temporal evolution of `{y_col}`."

    # Fallback
    fig = px.histogram(df, x=x_col, title=f"Summary Chart for {x_col}", color_discrete_sequence=['#4E6A55'])
    apply_console_chart_theme(fig, 480)
    return fig, f"Generated standard summary plot for `{x_col}`."


def detect_geographic_columns(df: pd.DataFrame) -> list[str]:
    """
    Identify genuine geographic columns (e.g. Country, State, Province, Region, ISO).
    Commute distance (DistanceFromHome) is strictly excluded.
    """
    geo_candidates = []
    geo_keywords = ['country', 'state', 'province', 'region', 'iso', 'nation', 'location_state', 'country_code', 'state_code']
    exclude_keywords = ['distance', 'commute', 'home', 'travel', 'stats', 'statistic', 'rating', 'status', 'score']

    for col in df.columns:
        c_clean = clean_col_name(col)
        # Exclude commute/distance/travel
        if any(ex in c_clean for ex in exclude_keywords):
            continue
        if any(gk in c_clean for gk in geo_keywords):
            # Verify it's categorical/string
            if df[col].dtype == object or isinstance(df[col].iloc[0] if not df[col].empty else None, str):
                geo_candidates.append(col)
    return geo_candidates


def compute_retention_priorities(df: pd.DataFrame) -> list[dict]:
    """
    Compute evidence-based Retention Priority Board rankings dynamically from the active dataset.
    Returns list of dicts: [{'factor': str, 'metric': str, 'level': 'HIGH'|'WATCH'|'STABLE'|'REVIEW', 'detail': str}]
    """
    priorities = []
    if df.empty or 'Attrition_Num' not in df.columns:
        return [
            {'factor': 'Overtime Exposure', 'metric': 'N/A', 'level': 'STABLE', 'detail': 'Dataset empty or Attrition field missing.'},
            {'factor': 'Early Tenure (0-2 Yrs)', 'metric': 'N/A', 'level': 'STABLE', 'detail': 'Awaiting active workforce records.'},
            {'factor': 'Job Satisfaction', 'metric': 'N/A', 'level': 'STABLE', 'detail': 'Awaiting active workforce records.'},
            {'factor': 'Long Commute (>20 km)', 'metric': 'N/A', 'level': 'STABLE', 'detail': 'Awaiting active workforce records.'},
            {'factor': 'Compensation Pattern', 'metric': 'N/A', 'level': 'REVIEW', 'detail': 'Awaiting active workforce records.'}
        ]

    # 1. Overtime Exposure
    if 'OverTime' in df.columns:
        ot_rates = df.groupby('OverTime')['Attrition_Num'].mean()
        ot_yes = ot_rates.get('Yes', 0.0) * 100
        ot_no = ot_rates.get('No', 0.0) * 100
        diff = ot_yes - ot_no
        level = 'HIGH' if ot_yes >= 25.0 else ('WATCH' if ot_yes >= 18.0 else 'STABLE')
        priorities.append({
            'factor': 'Overtime Exposure',
            'metric': f"{ot_yes:.1f}% vs {ot_no:.1f}%",
            'level': level,
            'detail': f"+{diff:.1f} percentage point attrition spread for overtime staff"
        })

    # 2. Early Tenure Window
    if 'TenureGroup' in df.columns:
        tg_rates = df.groupby('TenureGroup', observed=False)['Attrition_Num'].mean() * 100
        t_early = tg_rates.get('0-2 years', 0.0)
        t_late = tg_rates.get('11+ years', 0.0)
        level = 'HIGH' if t_early >= 25.0 else ('WATCH' if t_early >= 15.0 else 'STABLE')
        priorities.append({
            'factor': 'Early Tenure (0-2 Yrs)',
            'metric': f"{t_early:.1f}% Rate",
            'level': level,
            'detail': f"Initial 24-month attrition exceeds late tenure ({t_late:.1f}%)"
        })
    elif 'YearsAtCompany' in df.columns:
        early_mask = df['YearsAtCompany'] <= 2
        t_early = df[early_mask]['Attrition_Num'].mean() * 100 if early_mask.any() else 0.0
        level = 'HIGH' if t_early >= 25.0 else ('WATCH' if t_early >= 15.0 else 'STABLE')
        priorities.append({
            'factor': 'Early Tenure (<=2 Yrs)',
            'metric': f"{t_early:.1f}% Rate",
            'level': level,
            'detail': "Elevated early-tenure turnover signal"
        })

    # 3. Low Job Satisfaction
    if 'JobSatisfaction' in df.columns:
        sat_rates = df.groupby('JobSatisfaction')['Attrition_Num'].mean() * 100
        low_sat = sat_rates.get(1, sat_rates.get('1', 0.0))
        high_sat = sat_rates.get(4, sat_rates.get('4', 0.0))
        level = 'HIGH' if low_sat >= 25.0 else ('WATCH' if low_sat >= 18.0 else 'STABLE')
        priorities.append({
            'factor': 'Job Satisfaction (Lvl 1)',
            'metric': f"{low_sat:.1f}% Rate",
            'level': level,
            'detail': f"Rating 1 staff show higher turnover vs Rating 4 ({high_sat:.1f}%)"
        })

    # 4. Commute Distance Strain
    if 'DistanceBand' in df.columns:
        dist_rates = df.groupby('DistanceBand', observed=False)['Attrition_Num'].mean() * 100
        d_far = dist_rates.get('21+ km', 0.0)
        d_close = dist_rates.get('0-5 km', 0.0)
        level = 'WATCH' if d_far >= 20.0 else 'STABLE'
        priorities.append({
            'factor': 'Long Commute (>20 km)',
            'metric': f"{d_far:.1f}% Rate",
            'level': level,
            'detail': f"+{d_far - d_close:.1f} pts higher than local commuters (0-5 km)"
        })
    elif 'DistanceFromHome' in df.columns:
        far_mask = df['DistanceFromHome'] > 20
        d_far = df[far_mask]['Attrition_Num'].mean() * 100 if far_mask.any() else 0.0
        level = 'WATCH' if d_far >= 20.0 else 'STABLE'
        priorities.append({
            'factor': 'Long Commute (>20 km)',
            'metric': f"{d_far:.1f}% Rate",
            'level': level,
            'detail': "Commute distance strain threshold evaluated"
        })

    # 5. Compensation Disparity
    if 'MonthlyIncome' in df.columns and 'Attrition' in df.columns:
        inc_retained = df[df['Attrition'] == 'No']['MonthlyIncome'].mean() if (df['Attrition'] == 'No').any() else 0.0
        inc_departed = df[df['Attrition'] == 'Yes']['MonthlyIncome'].mean() if (df['Attrition'] == 'Yes').any() else 0.0
        gap = inc_retained - inc_departed
        level = 'HIGH' if (inc_retained > 0 and inc_departed / inc_retained < 0.75) else ('REVIEW' if gap > 1000 else 'STABLE')
        priorities.append({
            'factor': 'Compensation Disparity',
            'metric': f"${gap:,.0f} Gap",
            'level': level,
            'detail': f"Departed staff earn less (${inc_departed:,.0f} vs ${inc_retained:,.0f})"
        })

    return priorities


def build_manual_chart(
    df: pd.DataFrame,
    chart_type: str,
    params: dict
) -> tuple[go.Figure, str]:
    """
    Renders the exact user-selected chart representation with validation, correct aggregations,
    operations-room dark console styling, and concise contextual explanations.
    Returns:
        (plotly_figure, explanation_string)
    """
    if df.empty:
        fig = go.Figure()
        fig.update_layout(title="No records match current filter criteria.")
        apply_console_chart_theme(fig, 380)
        return fig, "No data available in the current filtered subset."

    # ----------------------------------------------------
    # 1. BAR CHART
    # ----------------------------------------------------
    if "Bar Chart" in chart_type and "Grouped" not in chart_type:
        category = params.get('category')
        measure = params.get('measure', 'Employee Count')
        
        if not category or category not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid category column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Category column not found."

        if measure == 'Employee Count':
            agg = df[category].value_counts().reset_index()
            agg.columns = [category, 'Value']
            y_title = "Headcount (Employees)"
            val_format = "%{text:,}"
            bar_color = ['#4E6A55']
        elif measure == 'Attrition Count':
            if 'Attrition_Num' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="Attrition_Num not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "Attrition column required."
            agg = df.groupby(category)['Attrition_Num'].sum().reset_index()
            agg.columns = [category, 'Value']
            y_title = "Departed Employees"
            val_format = "%{text:,}"
            bar_color = ['#C05646']
        elif measure == 'Attrition Rate (%)':
            if 'Attrition_Num' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="Attrition_Num not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "Attrition column required."
            agg = df.groupby(category)['Attrition_Num'].mean().reset_index()
            agg['Value'] = (agg['Attrition_Num'] * 100).round(1)
            y_title = "Observed Attrition Rate (%)"
            val_format = "%{text}%"
            bar_color = ['#D4A359']
        elif measure == 'Average Monthly Income':
            if 'MonthlyIncome' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="MonthlyIncome not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "MonthlyIncome column required."
            agg = df.groupby(category)['MonthlyIncome'].mean().round(0).reset_index()
            agg.columns = [category, 'Value']
            y_title = "Mean Monthly Income ($)"
            val_format = "$%{text:,.0f}"
            bar_color = ['#4A6B82']
        elif measure == 'Median Monthly Income':
            if 'MonthlyIncome' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="MonthlyIncome not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "MonthlyIncome column required."
            agg = df.groupby(category)['MonthlyIncome'].median().round(0).reset_index()
            agg.columns = [category, 'Value']
            y_title = "Median Monthly Income ($)"
            val_format = "$%{text:,.0f}"
            bar_color = ['#4A6B82']
        else:
            agg = df[category].value_counts().reset_index()
            agg.columns = [category, 'Value']
            y_title = "Count"
            val_format = "%{text}"
            bar_color = ['#4E6A55']

        n_cats = len(agg)
        if n_cats > 6:
            agg = agg.sort_values(by='Value', ascending=True)
            fig = px.bar(
                agg,
                y=category,
                x='Value',
                orientation='h',
                text='Value',
                title=f"{measure} across {category}",
                color_discrete_sequence=bar_color
            )
            fig.update_traces(texttemplate=val_format, textposition='outside')
            chart_height = max(480, n_cats * 32)
            apply_console_chart_theme(fig, chart_height)
            fig.update_layout(xaxis_title=y_title, yaxis_title=category)
        else:
            fig = px.bar(
                agg,
                x=category,
                y='Value',
                text='Value',
                title=f"{measure} by {category}",
                color_discrete_sequence=bar_color
            )
            fig.update_traces(texttemplate=val_format, textposition='outside')
            apply_console_chart_theme(fig, 480)
            fig.update_layout(yaxis_title=y_title, xaxis_title=category)

        return fig, f"Observed {measure.lower()} across {category}."

    # ----------------------------------------------------
    # 2. LINE CHART
    # ----------------------------------------------------
    elif "Line Chart" in chart_type:
        x_col = params.get('x_col')
        y_measure = params.get('y_measure', 'Attrition Rate (%)')

        if not x_col or x_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid ordered X-axis column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Valid ordered X-axis required."

        if y_measure == 'Attrition Rate (%)':
            if 'Attrition_Num' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="Attrition_Num not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "Attrition column required."
            agg = df.groupby(x_col, observed=False)['Attrition_Num'].mean().reset_index()
            agg['Value'] = (agg['Attrition_Num'] * 100).round(1)
            y_title = "Attrition Rate (%)"
            line_color = '#C05646'
        elif y_measure == 'Average Monthly Income':
            if 'MonthlyIncome' not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="MonthlyIncome not available.")
                apply_console_chart_theme(fig, 380)
                return fig, "MonthlyIncome required."
            agg = df.groupby(x_col, observed=False)['MonthlyIncome'].mean().round(0).reset_index()
            agg.columns = [x_col, 'Value']
            y_title = "Average Monthly Income ($)"
            line_color = '#4A6B82'
        else:
            agg = df.groupby(x_col, observed=False).size().reset_index(name='Value')
            y_title = "Headcount"
            line_color = '#4E6A55'

        # Preserve natural ordering
        if x_col == 'TenureGroup':
            order = ['0-2 years', '3-5 years', '6-10 years', '11+ years']
            agg[x_col] = pd.Categorical(agg[x_col], categories=order, ordered=True)
            agg = agg.sort_values(by=x_col)
        elif x_col == 'DistanceBand':
            order = ['0-5 km', '6-10 km', '11-20 km', '21+ km']
            agg[x_col] = pd.Categorical(agg[x_col], categories=order, ordered=True)
            agg = agg.sort_values(by=x_col)
        elif pd.api.types.is_numeric_dtype(agg[x_col]):
            agg = agg.sort_values(by=x_col)

        fig = px.line(
            agg,
            x=x_col,
            y='Value',
            markers=True,
            title=f"{y_measure} across {x_col}",
            color_discrete_sequence=[line_color]
        )
        fig.update_traces(line=dict(width=3), marker=dict(size=8))
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=x_col, yaxis_title=y_title)
        return fig, f"Trend in {y_measure.lower()} along ordered intervals of {x_col}."

    # ----------------------------------------------------
    # 3. HISTOGRAM
    # ----------------------------------------------------
    elif "Histogram" in chart_type:
        num_col = params.get('num_col')
        bins = params.get('bins', 'Automatic')
        segment = params.get('segment_by', 'None')
        color_arg = segment if segment != 'None' and segment in df.columns else None
        nbins = int(bins) if bins not in ['Automatic', None] else None

        if not num_col or num_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid numeric column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Valid numeric column required."

        fig = px.histogram(
            df,
            x=num_col,
            nbins=nbins,
            color=color_arg,
            marginal="box",
            opacity=0.75,
            title=f"Histogram Distribution of {num_col}",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359']
        )
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=num_col, yaxis_title="Employee Count")
        return fig, f"Distribution and frequency spread of {num_col}."

    # ----------------------------------------------------
    # 4. PIE CHART
    # ----------------------------------------------------
    elif "Pie Chart" in chart_type:
        cat_col = params.get('category')
        val_metric = params.get('value', 'Employee Count')

        if not cat_col or cat_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid category column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Valid category column required."

        if val_metric == 'Attrition Count' and 'Attrition_Num' in df.columns:
            agg = df.groupby(cat_col)['Attrition_Num'].sum().reset_index()
            agg.columns = [cat_col, 'Value']
        else:
            agg = df[cat_col].value_counts().reset_index()
            agg.columns = [cat_col, 'Value']

        fig = px.pie(
            agg,
            names=cat_col,
            values='Value',
            title=f"Proportional Breakdown of {cat_col} ({val_metric})",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82', '#82919E']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label', marker=dict(line=dict(color='#182026', width=2)))
        apply_console_chart_theme(fig, 480)
        return fig, f"Proportional breakdown of {val_metric.lower()} across {cat_col}."

    # ----------------------------------------------------
    # 5. SCATTER PLOT
    # ----------------------------------------------------
    elif "Scatter Plot" in chart_type:
        x_col = params.get('x_col')
        y_col = params.get('y_col')
        color_by = params.get('color_by', 'None')
        color_arg = color_by if color_by != 'None' and color_by in df.columns else None

        if not x_col or not y_col or x_col not in df.columns or y_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select valid numeric X and Y columns.")
            apply_console_chart_theme(fig, 380)
            return fig, "Numeric X and Y columns required."

        # Performance sampling safeguard (>2000 points)
        plot_df = df
        sampled_note = ""
        if len(df) > 2000:
            plot_df = df.sample(n=2000, random_state=42)
            sampled_note = " (Sampled 2,000 points for performance; metrics use full dataset)"

        hover_data = [c for c in ['JobRole', 'Department', 'YearsAtCompany', 'Attrition'] if c in plot_df.columns]

        fig = px.scatter(
            plot_df,
            x=x_col,
            y=y_col,
            color=color_arg,
            hover_data=hover_data,
            opacity=0.75,
            title=f"{y_col} vs {x_col}{sampled_note}",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82']
        )
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=x_col, yaxis_title=y_col)
        return fig, f"Bivariate relationship and data point dispersion between {x_col} and {y_col}."

    # ----------------------------------------------------
    # 6. BOX PLOT
    # ----------------------------------------------------
    elif "Box Plot" in chart_type:
        num_col = params.get('num_col')
        group_by = params.get('group_by')

        if not num_col or num_col not in df.columns or not group_by or group_by not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid numeric variable and grouping category.")
            apply_console_chart_theme(fig, 380)
            return fig, "Numeric and grouping variables required."

        fig = px.box(
            df,
            x=group_by,
            y=num_col,
            color=group_by,
            points="outliers",
            title=f"{num_col} Segmented by {group_by}",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82', '#82919E']
        )
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=group_by, yaxis_title=num_col, showlegend=False)
        return fig, f"Median, interquartile spread, and outliers of {num_col} across {group_by} subgroups."

    # ----------------------------------------------------
    # 7. HEATMAP
    # ----------------------------------------------------
    elif "Heatmap" in chart_type:
        heatmap_type = params.get('heatmap_type', 'Correlation Matrix')

        if heatmap_type == 'Correlation Matrix':
            numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c not in ['EmployeeCount', 'StandardHours']]
            if len(numeric_cols) < 2:
                fig = go.Figure()
                fig.update_layout(title="At least 2 numeric columns required for correlation matrix.")
                apply_console_chart_theme(fig, 380)
                return fig, "Insufficient numeric columns."

            # Prioritize standard HR analytics columns if present
            priority_cols = ['Age', 'MonthlyIncome', 'YearsAtCompany', 'DistanceFromHome', 'TenureRatio', 'JobSatisfaction', 'WorkLifeBalance', 'Attrition_Num']
            chosen_cols = [c for c in priority_cols if c in numeric_cols]
            if len(chosen_cols) < 2:
                chosen_cols = numeric_cols[:8]

            corr = df[chosen_cols].corr()
            fig = px.imshow(
                corr,
                text_auto=".2f",
                color_continuous_scale=[[0, '#1B3B6F'], [0.5, '#161D24'], [1, '#B84A39']],
                zmin=-1,
                zmax=1,
                title="Pairwise Pearson Correlation Matrix"
            )
            apply_console_chart_theme(fig, 480)
            return fig, "Pairwise linear correlation coefficients between key numeric metrics (-1.0 to +1.0)."
        else:
            x_cat = params.get('x_cat', 'JobSatisfaction')
            y_cat = params.get('y_cat', 'WorkLifeBalance')
            metric = params.get('metric', 'Employee Count')

            if x_cat not in df.columns or y_cat not in df.columns:
                fig = go.Figure()
                fig.update_layout(title="Select valid row and column dimensions for crosstab.")
                apply_console_chart_theme(fig, 380)
                return fig, "Row and column dimensions required."

            if metric == 'Attrition Rate (%)' and 'Attrition_Num' in df.columns:
                ct = df.pivot_table(index=y_cat, columns=x_cat, values='Attrition_Num', aggfunc='mean') * 100
                ct = ct.round(1)
                title = f"Crosstab Attrition Rate (%): {x_cat} × {y_cat}"
                scale = [[0, '#161D24'], [0.5, '#D4A359'], [1, '#C05646']]
            else:
                ct = pd.crosstab(df[y_cat], df[x_cat])
                title = f"Headcount Density Crosstab: {x_cat} × {y_cat}"
                scale = [[0, '#161D24'], [0.5, '#2D3E33'], [1, '#4E6A55']]

            fig = px.imshow(
                ct,
                text_auto=True,
                color_continuous_scale=scale,
                title=title
            )
            apply_console_chart_theme(fig, 480)
            fig.update_layout(xaxis_title=x_cat, yaxis_title=y_cat)
            return fig, f"Displays the cross-tabulated concentration of {metric.lower()} across {x_cat} and {y_cat}."

    # ----------------------------------------------------
    # 8. GROUPED BAR CHART
    # ----------------------------------------------------
    elif "Grouped Bar Chart" in chart_type:
        cat_col = params.get('category')
        group_by = params.get('group_by')
        measure = params.get('measure', 'Employee Count')

        if not cat_col or not group_by or cat_col not in df.columns or group_by not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select valid category and grouping columns.")
            apply_console_chart_theme(fig, 380)
            return fig, "Category and grouping columns required."

        if measure == 'Attrition Rate (%)' and 'Attrition_Num' in df.columns:
            agg = df.groupby([cat_col, group_by], observed=False)['Attrition_Num'].mean().reset_index()
            agg['Value'] = (agg['Attrition_Num'] * 100).round(1)
            y_title = "Attrition Rate (%)"
        elif measure == 'Average Monthly Income' and 'MonthlyIncome' in df.columns:
            agg = df.groupby([cat_col, group_by], observed=False)['MonthlyIncome'].mean().round(0).reset_index()
            agg.columns = [cat_col, group_by, 'Value']
            y_title = "Average Monthly Income ($)"
        else:
            agg = df.groupby([cat_col, group_by], observed=False).size().reset_index(name='Value')
            y_title = "Headcount"

        fig = px.bar(
            agg,
            x=cat_col,
            y='Value',
            color=group_by,
            barmode='group',
            text='Value',
            title=f"{cat_col} Grouped by {group_by} ({measure})",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82']
        )
        fig.update_traces(textposition='outside')
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=cat_col, yaxis_title=y_title)
        return fig, f"Compares {measure.lower()} across {cat_col} clustered side-by-side by {group_by}."

    # ----------------------------------------------------
    # 9. DONUT CHART
    # ----------------------------------------------------
    elif "Donut Chart" in chart_type:
        cat_col = params.get('category')
        val_metric = params.get('value', 'Employee Count')

        if not cat_col or cat_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid category column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Category column required."

        if val_metric == 'Attrition Count' and 'Attrition_Num' in df.columns:
            agg = df.groupby(cat_col)['Attrition_Num'].sum().reset_index()
            agg.columns = [cat_col, 'Value']
        else:
            agg = df[cat_col].value_counts().reset_index()
            agg.columns = [cat_col, 'Value']

        fig = px.pie(
            agg,
            names=cat_col,
            values='Value',
            hole=0.55,
            title=f"Donut Composition of {cat_col} ({val_metric})",
            color_discrete_sequence=['#4E6A55', '#C05646', '#D4A359', '#4A6B82']
        )
        fig.update_traces(textposition='inside', textinfo='percent+label', marker=dict(line=dict(color='#182026', width=2)))
        apply_console_chart_theme(fig, 480)
        return fig, f"Shows the proportional donut distribution of {val_metric.lower()} across {cat_col}."

    # ----------------------------------------------------
    # 10. AREA CHART
    # ----------------------------------------------------
    elif "Area Chart" in chart_type:
        x_col = params.get('x_col')
        y_measure = params.get('y_measure', 'Attrition Rate (%)')

        if not x_col or x_col not in df.columns:
            fig = go.Figure()
            fig.update_layout(title="Select a valid ordered X-axis column.")
            apply_console_chart_theme(fig, 380)
            return fig, "Ordered X-axis column required."

        if y_measure == 'Attrition Rate (%)' and 'Attrition_Num' in df.columns:
            agg = df.groupby(x_col, observed=False)['Attrition_Num'].mean().reset_index()
            agg['Value'] = (agg['Attrition_Num'] * 100).round(1)
            y_title = "Attrition Rate (%)"
        elif y_measure == 'Average Monthly Income' and 'MonthlyIncome' in df.columns:
            agg = df.groupby(x_col, observed=False)['MonthlyIncome'].mean().round(0).reset_index()
            agg.columns = [x_col, 'Value']
            y_title = "Average Monthly Income ($)"
        else:
            agg = df.groupby(x_col, observed=False).size().reset_index(name='Value')
            y_title = "Headcount"

        # Order preservation
        if x_col == 'TenureGroup':
            order = ['0-2 years', '3-5 years', '6-10 years', '11+ years']
            agg[x_col] = pd.Categorical(agg[x_col], categories=order, ordered=True)
            agg = agg.sort_values(by=x_col)
        elif x_col == 'DistanceBand':
            order = ['0-5 km', '6-10 km', '11-20 km', '21+ km']
            agg[x_col] = pd.Categorical(agg[x_col], categories=order, ordered=True)
            agg = agg.sort_values(by=x_col)
        elif pd.api.types.is_numeric_dtype(agg[x_col]):
            agg = agg.sort_values(by=x_col)

        fig = px.area(
            agg,
            x=x_col,
            y='Value',
            markers=True,
            title=f"Area Trajectory: {y_measure} across {x_col}",
            color_discrete_sequence=['#4E6A55']
        )
        apply_console_chart_theme(fig, 480)
        fig.update_layout(xaxis_title=x_col, yaxis_title=y_title)
        return fig, f"Shows the cumulative area volume and progressive profile of {y_measure.lower()} along {x_col}."

    # ----------------------------------------------------
    # 11. CHOROPLETH MAP
    # ----------------------------------------------------
    elif "Choropleth" in chart_type:
        geo_cols = detect_geographic_columns(df)
        if not geo_cols:
            fig = go.Figure()
            fig.add_annotation(
                text="<b>🌍 CHOROPLETH UNAVAILABLE</b><br><br>No supported geographic boundary field (State, Country, Region) was detected in the active dataset.<br><br><i>Note: Commute distance (DistanceFromHome) is a linear metric, not a geographic location or spatial coordinate.</i>",
                xref="paper", yref="paper",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=14, color="#C05646", family="'Share Tech Mono', monospace"),
                align="center",
                bordercolor="#C05646", borderwidth=2, borderpad=24, bgcolor="#182026"
            )
            apply_console_chart_theme(fig, 480)
            fig.update_layout(xaxis=dict(visible=False), yaxis=dict(visible=False))
            return fig, "🌍 Geographic mapping is unavailable because the active dataset contains no verified location, state, or country fields."
        else:
            geo_col = params.get('geo_col', geo_cols[0])
            metric = params.get('metric', 'Employee Count')
            if metric == 'Attrition Rate (%)' and 'Attrition_Num' in df.columns:
                agg = df.groupby(geo_col)['Attrition_Num'].mean().reset_index()
                agg['Value'] = (agg['Attrition_Num'] * 100).round(1)
            else:
                agg = df[geo_col].value_counts().reset_index()
                agg.columns = [geo_col, 'Value']

            fig = px.choropleth(
                agg,
                locations=geo_col,
                locationmode='country names',
                color='Value',
                title=f"Geographic Distribution across {geo_col}",
                color_continuous_scale=[[0, '#161D24'], [0.5, '#2D3E33'], [1, '#4E6A55']]
            )
            apply_console_chart_theme(fig, 480)
            return fig, f"Shows the geographic intensity of {metric.lower()} across detected regions in {geo_col}."

    # Fallback
    fig = px.histogram(df, x=df.columns[0], title="Default View", color_discrete_sequence=['#4E6A55'])
    apply_console_chart_theme(fig, 480)
    return fig, "Standard overview rendered."

