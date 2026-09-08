# Setup Guide

## Prerequisites

- Python 3.8+
- Census API key (free from api.census.gov)

## Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure API Key

Edit `backend/.env` and add your Census API key:
CENSUS_API_KEY=your_key_here
FLASK_ENV=development

### 3. Run Backend

```bash
cd backend
python app.py
```

You should see: `Running on http://localhost:5000`

### 4. Test API

```bash
curl http://localhost:5000/api/health
```

## Troubleshooting

- CENSUS_API_KEY not set: Check .env file
- Connection refused: Flask not running
- No data: Check API key is valid
