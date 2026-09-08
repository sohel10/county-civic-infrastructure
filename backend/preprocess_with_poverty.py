"""
Extract poverty indicator from income brackets + CDC health data
"""
import csv
import sqlite3

DB_PATH = 'counties.db'
INCOME_FILE = '../data/raw/median_income_2023.csv'
HEALTH_FILE = '../data/raw/health_cdc_2023.csv'

def load_income_with_poverty():
    """Extract median income AND poverty indicator"""
    print("📊 Loading income data with poverty calculation...")
    
    income_data = {}
    with open(INCOME_FILE, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                geoid = row['GEO_ID'].strip()
                fips = geoid[-5:]
                name = row['NAME'].strip()
                
                median_income_str = row['S1901_C01_012E'].strip()
                if not median_income_str or median_income_str in ['-', 'N']:
                    continue
                    
                median_income = int(float(median_income_str))
                if not (10000 < median_income < 200000):
                    continue
                
                try:
                    less_10k = int(float(row['S1901_C01_002E'].strip() or 0))
                    ten_15k = int(float(row['S1901_C01_003E'].strip() or 0))
                    fifteen_25k = int(float(row['S1901_C01_004E'].strip() or 0))
                    total_households = int(float(row['S1901_C01_001E'].strip() or 1))
                    
                    low_income_households = less_10k + ten_15k + fifteen_25k
                    poverty_proxy = (low_income_households / total_households * 100) if total_households > 0 else 0
                except:
                    poverty_proxy = 0
                
                income_data[fips] = {
                    'name': name,
                    'median_income': median_income,
                    'poverty_proxy': round(poverty_proxy, 1)
                }
            except (ValueError, KeyError):
                pass
    
    print(f"✅ Loaded {len(income_data)} counties with income & poverty proxy")
    return income_data

def load_health_data():
    """Load CDC health metrics"""
    print("📊 Loading CDC health data...")
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
                
                metrics = {}
                for metric in ['DIABETES_AdjPrev', 'OBESITY_AdjPrev', 'BPHIGH_AdjPrev', 
                              'DEPRESSION_AdjPrev', 'STROKE_AdjPrev', 'COPD_AdjPrev',
                              'CASTHMA_AdjPrev', 'CHD_AdjPrev', 'KIDNEY_AdjPrev', 'CANCER_AdjPrev']:
                    try:
                        val = row.get(metric, '')
                        metrics[metric.lower()] = float(val.strip().strip('"')) if val and val.strip() else None
                    except ValueError:
                        metrics[metric.lower()] = None
                
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

def create_schema(cursor):
    """Create table with income + poverty + health"""
    cursor.execute("DROP TABLE IF EXISTS counties")
    
    cursor.execute("""
        CREATE TABLE counties (
            fips INTEGER PRIMARY KEY,
            county_name TEXT,
            state_name TEXT,
            state_abbr TEXT,
            median_income REAL,
            poverty_proxy REAL,
            diabetes_adjprev REAL,
            obesity_adjprev REAL,
            bphigh_adjprev REAL,
            depression_adjprev REAL,
            stroke_adjprev REAL,
            copd_adjprev REAL,
            casthma_adjprev REAL,
            chd_adjprev REAL,
            kidney_adjprev REAL,
            cancer_adjprev REAL,
            disability_adjprev REAL,
            ghlth_adjprev REAL,
            mhlth_adjprev REAL,
            sleep_adjprev REAL
        )
    """)

def merge_data(income_data, health_data):
    """Merge and insert"""
    print("\n💾 Merging data...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    create_schema(cursor)
    
    merged = 0
    for fips, health in health_data.items():
        if fips in income_data:
            income = income_data[fips]
            metrics = health['metrics']
            
            cursor.execute("""
                INSERT INTO counties VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            """, (
                int(fips),
                health['county_name'],
                health['state'],
                health['state_abbr'],
                income['median_income'],
                income['poverty_proxy'],
                metrics.get('diabetes_adjprev'),
                metrics.get('obesity_adjprev'),
                metrics.get('bphigh_adjprev'),
                metrics.get('depression_adjprev'),
                metrics.get('stroke_adjprev'),
                metrics.get('copd_adjprev'),
                metrics.get('casthma_adjprev'),
                metrics.get('chd_adjprev'),
                metrics.get('kidney_adjprev'),
                metrics.get('cancer_adjprev'),
                metrics.get('disability_adjprev'),
                metrics.get('ghlth_adjprev'),
                metrics.get('mhlth_adjprev'),
                metrics.get('sleep_adjprev'),
            ))
            merged += 1
    
    conn.commit()
    conn.close()
    print(f"✅ Inserted {merged} counties")

def verify():
    """Show results"""
    print("\n" + "="*80)
    print("INCOME vs HEALTH STATUS - REAL CORRELATION")
    print("="*80 + "\n")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(*), 
               ROUND(AVG(median_income), 0),
               ROUND(AVG(poverty_proxy), 1),
               ROUND(AVG(diabetes_adjprev), 1),
               ROUND(AVG(obesity_adjprev), 1)
        FROM counties
    """)
    
    stats = cursor.fetchone()
    print(f"📊 {stats[0]} counties analyzed")
    print(f"💰 Average Income: ${stats[1]:,.0f}")
    print(f"📉 Average Poverty Proxy (% <$25k): {stats[2]}%")
    print(f"🏥 Average Diabetes: {stats[3]}%")
    print(f"⚖️  Average Obesity: {stats[4]}%")
    
    print("\n" + "="*80)
    print("RICHEST vs POOREST COUNTIES - HEALTH DISPARITY")
    print("="*80 + "\n")
    
    cursor.execute("""
        SELECT 
            'RICHEST' as category,
            COUNT(*) as count,
            ROUND(AVG(median_income), 0) as avg_income,
            ROUND(AVG(poverty_proxy), 1) as poverty_pct,
            ROUND(AVG(diabetes_adjprev), 1) as diabetes,
            ROUND(AVG(obesity_adjprev), 1) as obesity,
            ROUND(AVG(depression_adjprev), 1) as depression
        FROM counties
        WHERE median_income > (SELECT AVG(median_income) FROM counties)
        UNION ALL
        SELECT 
            'POOREST',
            COUNT(*),
            ROUND(AVG(median_income), 0),
            ROUND(AVG(poverty_proxy), 1),
            ROUND(AVG(diabetes_adjprev), 1),
            ROUND(AVG(obesity_adjprev), 1),
            ROUND(AVG(depression_adjprev), 1)
        FROM counties
        WHERE median_income < (SELECT AVG(median_income) FROM counties)
    """)
    
    print("{:<12} {:<8} {:<14} {:<10} {:<10} {:<10} {:<10}".format(
        "Category", "Count", "Avg Income", "Poverty%", "Diabetes%", "Obesity%", "Depression%"))
    print("-" * 80)
    for row in cursor.fetchall():
        print("{:<12} {:<8} ${:<13,} {:<10} {:<10} {:<10} {:<10}".format(
            row[0], row[1], row[2], row[3], row[4], row[5], row[6]))
    
    conn.close()

if __name__ == '__main__':
    print("="*80)
    print("INCOME vs HEALTH PREPROCESSING")
    print("="*80 + "\n")
    
    income_data = load_income_with_poverty()
    health_data = load_health_data()
    merge_data(income_data, health_data)
    verify()
    
    print("\n✅ Database ready for income-health analysis!")
