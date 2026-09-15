# County Health & Civic Data Comparison Tool

A comprehensive data analytics platform for exploring socioeconomic health disparities across 3,142+ US counties. Compare income, health outcomes, poverty rates, and educational attainment to identify equity gaps and inform public health policy.

## Overview

This tool empowers public health professionals, researchers, and policymakers to:
- **Compare Health Outcomes** – Health scores across multiple counties
- **Analyze Income Disparities** – Median household income comparisons
- **Examine Poverty Rates** – County-level poverty percentages
- **Assess Educational Attainment** – College education levels
- **Identify Equity Gaps** – Quantify socioeconomic health disparities
- **Generate Reports** – Export comparative analysis as PDF

**Real Data Sources:**
- **2023 US Census Bureau** – Median income, poverty rates, educational attainment
- **2023 CDC PLACES** – County-level health metrics and health scores

## Civic Data Dimensions

### 1. **Health Outcomes** 📊
- Overall health scores
- Preventable disease rates
- Health behavior indicators

### 2. **Income & Economic Status** 💰
- Median household income
- Economic opportunity metrics

### 3. **Poverty & Socioeconomic Status** 📉
- Poverty rates (%)
- Economic vulnerability indicators

### 4. **Education & Workforce** 🎓
- College education attainment (%)
- Educational opportunity disparities

## Key Features

✅ **Interactive Multi-Dimensional Comparison** – View 4 civic indicators side-by-side  
✅ **Disparity Analysis** – Calculate gaps in health, income, poverty, education  
✅ **Real-Time Search** – Filter by county name or state  
✅ **Summary Statistics** – Aggregate metrics across selected regions  
✅ **PDF Export** – Generate professional comparison reports  
✅ **Real Data Only** – 2023 Census Bureau + CDC PLACES (no synthetic values)  

## Tech Stack

**Frontend:**
- HTML5 / CSS3
- JavaScript (Vanilla ES6+)
- Chart.js (data visualization)
- html2pdf.js (PDF export)

**Backend:**
- Python 3.8+
- Flask (lightweight web framework)
- SQLite (data storage)
- Pandas (data processing)

## Installation & Setup

### Prerequisites
Python 3.8+
Git
Modern browser (Chrome, Firefox, Safari, Edge)


### Clone Repository
```bash
git clone https://github.com/sohel10/county-civic-data.git
cd county-civic-data
```

### Install Dependencies
```bash
python -m venv env
source env/bin/activate  # macOS/Linux
env\Scripts\activate     # Windows

pip install -r requirements.txt
```

### Run Application

**Backend (Flask API):**
```bash
cd backend
python app.py
# Runs on http://127.0.0.1:5005
```

**Frontend (in new terminal):**
```bash
cd frontend
python -m http.server 8000
# Open http://localhost:8000
```

## Usage Guide

### Step 1: Load Data

### Step 2: Search & Filter
Check 2+ counties (e.g., Oakland, Wayne, Genesee)
Click "Compare Selected"
View Income vs Health charts
View Health Trend visualization

### Step 4: Analyze Disparities
Income gap: $X,XXX
Health gap: X.X points
Poverty gap: X.X%
Education gap: X.X%

### Step 5: Export Report
Click "Export PDF" to download:

County comparison table
Visualizations
Disparity analysis

## Project Structure
```text
county-civic-data/
├── frontend/
│ ├── index.html
│ ├── css/style.css
│ ├── js/
│ │ ├── main.js
│ │ ├── api_client.js
│ │ └── visualization.js
├── backend/
│ ├── app.py
│ ├── comparison_service.py
│ ├── preprocess_real_data.py
│ └── requirements.txt
├── README.md
└── .gitignore
```
## API Endpoints
GET /api/states
→ List of US states with county counts

GET /api/counties?state=Michigan
→ All counties in Michigan with civic data

GET /api/counties?limit=3142
→ All US counties

GET /api/compare?fips=26125,26161
→ Detailed comparison for selected counties
GET /api/states
→ List of US states with county counts

GET /api/counties?state=Michigan
→ All counties in Michigan with civic data

GET /api/counties?limit=3142
→ All US counties

GET /api/compare?fips=26125,26161
→ Detailed comparison for selected counties




## Data Quality

✅ Official US Census Bureau and CDC PLACES data only  
✅ 3,142 US counties  
✅ No synthetic or estimated values  
✅ Real 2023 data

## License

MIT License

## Author

**Sohel Ahmed**  
GitHub: [@sohel10](https://github.com/sohel10)  
Email: sohelcu06@gmail.com

---

**Status:** Production Ready ✅  
**Data:** 2023 Census + CDC PLACES  
**Counties:** 3,142 US counties
