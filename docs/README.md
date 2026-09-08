# County Health Comparison Tool

An interactive dashboard for comparing county-level health indicators across the United States.

## Features

- County Comparison: Select multiple counties and compare key health indicators
- Health Indicators: Mortality rates, disease prevalence, disability status
- Community Factors: Poverty, education, crime rates, healthcare access
- Data Download: Export comparison results as CSV

## Tech Stack

**Backend:** Python (Flask), Pandas, Requests
**Frontend:** HTML5, CSS3, JavaScript

## Data Sources

- Census Bureau (Poverty, Education, Demographics)
- CDC (Mortality rates)
- FBI (Crime rates)
- CMS (Healthcare facilities)

## Quick Start

1. Install dependencies: `pip install -r backend/requirements.txt`
2. Set up .env with Census API key
3. Run backend: `python backend/app.py`
4. Open frontend/index.html in browser
