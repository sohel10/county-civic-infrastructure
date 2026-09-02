# Data Pipeline Architecture

## High-Level Flow
US Census Bureau (CSV) CDC PLACES (CSV)
↓ ↓
Load CSV Load CSV
↓ ↓
Validate Data Validate Data
↓ ↓
──────────────────────────────────
↓
Merge on FIPS Code
↓
Store in SQLite
↓
Flask API Layer
↓
Frontend Visualization

## Data Schema

### Counties Table
```sql
CREATE TABLE counties (
    fips TEXT PRIMARY KEY,           -- County FIPS code
    county_name TEXT,                -- County name
    state_name TEXT,                 -- State name
    median_income REAL,              -- 2023 Census median income
    poverty_rate REAL,               -- 2023 Census poverty rate (%)
    college_educated_pct REAL,       -- 2023 Census college education (%)
    health_score REAL,               -- 2023 CDC PLACES health score
    population INT                   -- County population
);
```

## Processing Steps in preprocess_real_data.py

```python
1. Load Census CSV
   - Read median_income, poverty_rate, college_educated_pct
   - Match by county FIPS code

2. Load CDC PLACES CSV
   - Extract health metrics
   - Convert to health_score (0-100)

3. Merge Datasets
   - Inner join on FIPS code
   - Result: 3,142 counties with all 4 civic dimensions

4. Validate
   - Check for NULL values
   - Verify numeric ranges
   - Count total records

5. Store in SQLite
   - Create counties table
   - Insert 3,142 rows
   - Index by FIPS code
```

## Data Lineage

| Field | Source | Transformation | Final |
|-------|--------|-----------------|-------|
| FIPS | Census + CDC | Key for join | counties.fips |
| County Name | Census | No change | counties.county_name |
| State | Census | No change | counties.state_name |
| Median Income | Census 2023 | No change | counties.median_income |
| Poverty Rate | Census 2023 | No change | counties.poverty_rate |
| College Education | Census 2023 | No change | counties.college_educated_pct |
| Health Score | CDC PLACES 2023 | Aggregated from indicators | counties.health_score |

## Reproducibility: Key Principles

✅ **Source Data is Public** - Anyone can download Census/CDC data  
✅ **Deterministic Processing** - Same input → Same output  
✅ **Version Controlled** - preprocess_real_data.py in GitHub  
✅ **Documented Transformations** - All steps logged  
✅ **Verifiable Results** - Can check record counts and data integrity

---

**Pipeline maintained by:** Sohel Ahmed (@sohel10)
