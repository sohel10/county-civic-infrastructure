"""
Real Data Preprocessing - Handle BOM in CSV
"""

import csv
import sqlite3

DB_PATH = 'counties.db'
INCOME_FILE = '../data/raw/median_income_2023.csv'
HEALTH_FILE = '../data/raw/health_cdc_3states.csv'

def load_income_data():
    """Load REAL median income from S1901 - Handle BOM"""
    print("📊 Loading 2023 Census S1901 Median Income...")
    
    income_data = {}
    with open(INCOME_FILE, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
        reader = csv.DictReader(f)
        for row in reader:
            try:
                geoid = row['GEO_ID'].strip()
                name = row['NAME'].strip()
                # Column S1901_C01_012E = Median household income
                median_income_str = row['S1901_C01_012E'].strip()
                
                # Only process if value exists and is not missing
                if median_income_str and median_income_str not in ['-', 'N', '']:
                    median_income = int(float(median_income_str))
                    fips = geoid[-5:]
                    
                    # Sanity check
                    if 10000 < median_income < 200000:
                        income_data[fips] = {
                            'name': name,
                            'median_income': median_income
                        }
                        
            except (ValueError, KeyError) as e:
                pass
    
    print(f"✅ Loaded {len(income_data)} counties with median income")
    return income_data

def load_health_data():
    """Load health metrics from CDC"""
    print("📊 Loading 2023 CDC PLACES Health Data...")
    
    health_data = {}
    with open(HEALTH_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fips = row.get('CountyFIPS', '').strip().strip('"')
                county_name = row.get('CountyName', '').strip().strip('"')
                state = row.get('StateDesc', '').strip().strip('"')
                
                if not fips or len(fips) != 5:
                    continue
                
                # Extract health metrics
                metrics = {}
                for metric in ['DIABETES_AdjPrev', 'OBESITY_AdjPrev', 'ARTHRITIS_AdjPrev', 
                              'CHD_AdjPrev', 'COPD_AdjPrev', 'STROKE_AdjPrev']:
                    try:
                        val = float(row.get(metric, '0').strip().strip('"') or 0)
                        metrics[metric] = val
                    except ValueError:
                        metrics[metric] = 0
                
                # Health score
                avg_disease = sum(metrics.values()) / len(metrics)
                health_score = max(25, 100 - avg_disease)
                
                health_data[fips] = {
                    'county_name': county_name,
                    'state': state,
                    'health_score': round(health_score, 1)
                }
                
            except (ValueError, KeyError):
                pass
    
    print(f"✅ Loaded {len(health_data)} counties with health data")
    return health_data

def merge_and_update_db(income_data, health_data):
    """Merge and update database"""
    print("\n💾 Merging REAL data into database...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    merged = 0
    
    for fips, income_info in income_data.items():
        if fips in health_data:
            health = health_data[fips]
            income = income_info['median_income']
            
            cursor.execute('''
                UPDATE counties 
                SET median_income = ?, health_score = ?
                WHERE fips = ?
            ''', (income, health['health_score'], fips))
            
            if cursor.rowcount > 0:
                merged += 1
                if merged <= 10 or merged % 50 == 0:
                    print(f"   ✅ {health['county_name']:<22} {health['state']:<12} Income:${income:>8,} Health:{health['health_score']:>5}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Updated {merged} counties with REAL data")

def verify_data():
    """Verify the data"""
    print("\n" + "="*70)
    print("VERIFICATION - REAL DATA LOADED")
    print("="*70 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total,
            MIN(median_income) as min_income,
            MAX(median_income) as max_income,
            ROUND(AVG(median_income), 0) as avg_income,
            ROUND(AVG(health_score), 1) as avg_health
        FROM counties
        WHERE median_income > 0
    ''')
    
    stats = cursor.fetchone()
    if stats[0] > 0:
        print(f"📊 Total Counties: {stats[0]}")
        print(f"💰 Income Range: ${stats[1]:,} - ${stats[2]:,}")
        print(f"💰 Average Income: ${stats[3]:,}")
        print(f"🏥 Average Health Score: {stats[4]}")
        
        print("\n📍 BY STATE:")
        cursor.execute('''
            SELECT state_name, COUNT(*),
                ROUND(AVG(median_income), 0),
                ROUND(AVG(health_score), 1)
            FROM counties
            WHERE median_income > 0
            GROUP BY state_name
            ORDER BY state_name
        ''')
        
        for row in cursor.fetchall():
            print(f"   {row[0]:<12}: {row[1]:>3} | Income: ${row[2]:>8,} | Health: {row[3]:>5}")
        
        print("\n📋 SAMPLE DATA (Wayne County + random):")
        cursor.execute('''
            SELECT county_name, state_name, median_income, health_score
            FROM counties
            WHERE county_name LIKE '%Wayne%' AND state_name = 'Michigan'
        ''')
        wayne = cursor.fetchone()
        if wayne:
            print(f"   {wayne[0]:<22} {wayne[1]:<12} Income:${wayne[2]:>8,} Health:{wayne[3]:>6}")
        
        cursor.execute('''
            SELECT county_name, state_name, median_income, health_score
            FROM counties
            WHERE median_income > 0
            ORDER BY RANDOM()
            LIMIT 9
        ''')
        
        for row in cursor.fetchall():
            print(f"   {row[0]:<22} {row[1]:<12} Income:${row[2]:>8,} Health:{row[3]:>6}")
    
    conn.close()

def main():
    print("="*70)
    print("REAL DATA PREPROCESSING")
    print("2023 Census S1901 + 2023 CDC PLACES")
    print("="*70 + "\n")
    
    income_data = load_income_data()
    health_data = load_health_data()
    merge_and_update_db(income_data, health_data)
    verify_data()
    
    print("\n" + "="*70)
    print("✅ PREPROCESSING COMPLETE!")
    print("="*70)

if __name__ == '__main__':
    main()
