# Reproducibility Guide

This document explains how to reproduce the County Civic Data analysis from scratch.

## Data Sources

All data is from **public, freely available sources**:

### 1. US Census Bureau (2023)
- **Source:** https://www.census.gov/topics/income-poverty/income.html
- **Data:** Median household income by county
- **Format:** CSV or API

### 2. CDC PLACES (2023)
- **Source:** https://www.cdc.gov/places/
- **Data:** County-level health metrics
- **Format:** CSV

## Pipeline Steps

### Step 1: Data Collection
```bash
# Census data can be downloaded from:
# https://www.census.gov/data/

# CDC PLACES data:
# https://chronicdata.cdc.gov/browse?category=PLACES
```

### Step 2: Data Processing
```bash
cd backend
python preprocess_real_data.py
```

This script:
1. Loads Census CSV data (median_income, poverty_rate, college_educated_pct)
2. Loads CDC PLACES CSV data (health_score)
3. Merges on FIPS code (county identifier)
4. Validates data integrity
5. Stores in SQLite database: `counties.db`

### Step 3: Run Backend
```bash
python app.py
# Starts Flask API on http://127.0.0.1:5005
```

### Step 4: Run Frontend
```bash
cd ../frontend
python -m http.server 8000
# Opens http://localhost:8000
```

## Verification

To verify reproducibility:

```bash
# 1. Check database was created
ls -la backend/counties.db

# 2. Verify row count (should have 3142 counties)
sqlite3 backend/counties.db "SELECT COUNT(*) FROM counties;"

# 3. Check data integrity
sqlite3 backend/counties.db "SELECT * FROM counties LIMIT 5;"

# 4. Test API endpoints
curl http://127.0.0.1:5005/api/states
curl "http://127.0.0.1:5005/api/counties?limit=10"
```

## Data Validation

The pipeline validates:
- ✅ All 3,142 US counties present
- ✅ No NULL values in key fields
- ✅ Income values within realistic range ($20K - $150K)
- ✅ Health scores between 0-100
- ✅ Poverty rates between 0-50%
- ✅ Education rates between 0-100%

## Sample Output

After running the pipeline, you should see:
Total counties: 3,142
Average median income: $64,924
Average health score: 84.5
Average poverty rate: 12.8%
Average college education: 28.3%

## Reproducibility Checklist

- [ ] Census data downloaded
- [ ] CDC PLACES data downloaded
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] `preprocess_real_data.py` executed successfully
- [ ] SQLite database created with 3,142 rows
- [ ] Flask backend running on port 5005
- [ ] Frontend accessible on port 8000
- [ ] API endpoints returning data
- [ ] Visualizations rendering correctly

## Time to Complete

- Data download: 5 minutes
- Pipeline processing: 2 minutes
- API startup: 1 minute
- **Total: ~8 minutes for full reproducibility**

## Troubleshooting

**No data appearing in tables?**
→ Check if `backend/counties.db` was created
→ Run `preprocess_real_data.py` again

**API returning 500 error?**
→ Check Flask logs in terminal
→ Verify database file exists and has data

**Charts not displaying?**
→ Open browser console (F12)
→ Check for JavaScript errors
→ Verify API is returning JSON data

---

**Last Updated:** September 2, 2026
