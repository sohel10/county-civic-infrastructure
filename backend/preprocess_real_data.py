"""
Real Data Preprocessing - Load ALL CDC health metrics (no fake score)
"""

import csv
import sqlite3

DB_PATH = 'counties.db'
INCOME_FILE = '../data/raw/median_income_2023.csv'
HEALTH_FILE = '../data/raw/health_cdc_2023.csv'

# ALL real CDC metrics we want to keep
HEALTH_METRICS = [
    'DIABETES_AdjPrev', 'OBESITY_AdjPrev', 'BPHIGH_AdjPrev', 'CHD_AdjPrev',
    'STROKE_AdjPrev', 'COPD_AdjPrev', 'CASTHMA_AdjPrev', 'DEPRESSION_AdjPrev',
    'KIDNEY_AdjPrev', 'CANCER_AdjPrev', 'DISABILITY_AdjPrev', 
    'GHLTH_AdjPrev', 'MHLTH_AdjPrev', 'SLEEP_AdjPrev'
]

def load_income_data():
    """Load REAL median income"""
    print("📊 Loading 2023 Census S1901 Median Income...")
    income_data = {}
    with open(INCOME_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                geoid = row['GEO_ID'].strip()
                median_income_str = row['S1901_C01_012E'].strip()
                if median_income_str and median_income_str not in ['-', 'N', '']:
                    median_income = int(float(median_income_str))
                    fips = geoid[-5:]
                    if 10000 < median_income < 200000:
                        income_data[fips] = median_income
            except (ValueError, KeyError):
                pass
    print(f"✅ Loaded {len(income_data)} counties with income")
    return income_data

def load_health_data():
    """Load ALL CDC health metrics"""
    print("📊 Loading 2023 CDC PLACES Health Data...")
    health_data = {}
    with open(HEALTH_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fips = row.get('CountyFIPS', '').strip().strip('"')
                if not fips or len(fips) != 5:
                    continue
                
                county_name = row.get('CountyName', '').strip().strip('"')
                state = row.get('StateDesc', '').strip().strip('"')
                state_abbr = row.get('StateAbbr', '').strip().strip('"')
                
                # Extract ALL health metrics as separate columns
                metrics = {}
                for metric in HEALTH_METRICS:
                    try:
                        val = row.get(metric, '')
                        if val and val.strip():
                            metrics[metric] = float(val.strip().strip('"'))
                        else:
                            metrics[metric] = None
                    except ValueError:
                        metrics[metric] = None
                
                health_data[fips] = {
                    'county_name': county_name,
                    'state': state,
                    'state_abbr': state_abbr,
                    'metrics': metrics
                }
            except (ValueError, KeyError):
                pass
    
    print(f"✅ Loaded {len(health_data)} counties with health data")
    return health_data

def create_new_schema(cursor):
    """Create table with ALL real health metrics"""
    cursor.execute("DROP TABLE IF EXISTS counties")
    
    # Build dynamic column list
    metric_cols = ', '.join([f"{m.lower()} REAL" for m in HEALTH_METRICS])
    
    cursor.execute(f"""
        CREATE TABLE counties (
            fips INTEGER PRIMARY KEY,
            county_name TEXT,
            state_name TEXT,
            state_abbr TEXT,
            median_income REAL,
            {metric_cols}
        )
    """)

def merge_and_update_db(income_data, health_data):
    """Merge and insert data"""
    print("\n💾 Creating new database with REAL metrics...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    create_new_schema(cursor)
    
    merged = 0
    for fips, health in health_data.items():
        if fips in income_data:
            income = income_data[fips]
            metrics = health['metrics']
            
            # Build values list
            values = [
                fips,
                health['county_name'],
                health['state'],
                health['state_abbr'],
                income
            ]
            
            # Add all metric values in order
            for metric in HEALTH_METRICS:
                values.append(metrics.get(metric))
            
            # Build placeholders
            placeholders = ','.join(['?' for _ in values])
            
            cursor.execute(f"""
                INSERT INTO counties VALUES ({placeholders})
            """, values)
            
            merged += 1
            if merged <= 5 or merged % 100 == 0:
                print(f"   {merged}: {health['county_name']:<20} {health['state']:<12} ${income:>8,.0f}")
    
    conn.commit()
    conn.close()
    print(f"\n✅ Inserted {merged} counties with ALL real health metrics")

def verify_data():
    """Show what we have"""
    print("\n" + "="*80)
    print("VERIFICATION - REAL CDC METRICS (NO FAKE SCORE)")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(*), 
               ROUND(AVG(median_income), 0),
               ROUND(AVG(diabetes_adjprev), 1),
               ROUND(AVG(obesity_adjprev), 1),
               ROUND(AVG(bphigh_adjprev), 1),
               ROUND(AVG(depression_adjprev), 1)
        FROM counties
    """)
    
    stats = cursor.fetchone()
    print(f"📊 Total Counties: {stats[0]}")
    print(f"💰 Average Income: ${stats[1]:,.0f}")
    print(f"\n🏥 AVERAGE DISEASE PREVALENCE:")
    print(f"   Diabetes: {stats[2]}%")
    print(f"   Obesity: {stats[3]}%")
    print(f"   High BP: {stats[4]}%")
    print(f"   Depression: {stats[5]}%")
    
    print("\n📋 SAMPLE COMPARISON (Wayne, MI vs Random):")
    cursor.execute("""
        SELECT county_name, state_name, median_income, 
               diabetes_adjprev, obesity_adjprev, bphigh_adjprev, depression_adjprev
        FROM counties
        WHERE county_name = 'Wayne' AND state_name = 'Michigan'
    """)
    
    wayne = cursor.fetchone()
    if wayne:
        print(f"\n{wayne[0]}, {wayne[1]}:")
        print(f"  Income: ${wayne[2]:,.0f}")
        print(f"  Diabetes: {wayne[3]}% | Obesity: {wayne[4]}% | High BP: {wayne[5]}% | Depression: {wayne[6]}%")
    
    cursor.execute("""
        SELECT county_name, state_abbr, median_income,
               diabetes_adjprev, obesity_adjprev, depression_adjprev
        FROM counties
        ORDER BY RANDOM()
        LIMIT 5
    """)
    
    print("\nRandom samples:")
    for row in cursor.fetchall():
        print(f"  {row[0]:<20} {row[1]}: ${row[2]:>8,.0f} | D:{row[3]}% O:{row[4]}% Dep:{row[5]}%")
    
    conn.close()

def main():
    print("="*80)
    print("REAL DATA PREPROCESSING")
    print("2023 Census Income + 2023 CDC PLACES (14 individual health metrics)")
    print("="*80 + "\n")
    
    income_data = load_income_data()
    health_data = load_health_data()
    merge_and_update_db(income_data, health_data)
    verify_data()
    
    print("\n" + "="*80)
    print("✅ DATABASE REBUILT WITH REAL METRICS!")
    print("="*80)

if __name__ == '__main__':
    main()
