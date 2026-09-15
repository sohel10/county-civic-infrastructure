import csv
import sqlite3
import os

print("=" * 80)
print("BUILDING DATABASE WITH REAL CENSUS POVERTY DATA")
print("=" * 80)

# File paths
poverty_csv = '../data/raw/poverty_2023.csv'
health_csv = '../data/raw/health_cdc_2023.csv'
db_path = 'counties.db'

# Load REAL poverty% from Census S1701
print("\n📊 Loading REAL poverty data from Census S1701...")
poverty_data = {}
try:
    with open(poverty_csv, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fips = row['GEO_ID'].strip().strip('"')[-5:]
                pov_pct = float(row['S1701_C03_001E'].strip().strip('"'))
                if fips and len(fips) == 5 and pov_pct >= 0:
                    poverty_data[fips] = pov_pct
            except:
                pass
    print(f"✅ Loaded {len(poverty_data)} counties with REAL poverty%")
except Exception as e:
    print(f"❌ Error loading poverty data: {e}")
    exit(1)

# Load CDC health data
print("📊 Loading CDC health data...")
health_data = {}
try:
    with open(health_csv, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fips = row.get('CountyFIPS', '').strip().strip('"')
                if fips and len(fips) == 5:
                    health_data[fips] = {
                        'county': row.get('CountyName', '').strip().strip('"'),
                        'state': row.get('StateDesc', '').strip().strip('"'),
                        'diabetes': float(row.get('DIABETES_AdjPrev', '') or 0),
                        'obesity': float(row.get('OBESITY_AdjPrev', '') or 0),
                        'bphigh': float(row.get('BPHIGH_AdjPrev', '') or 0),
                        'depression': float(row.get('DEPRESSION_AdjPrev', '') or 0),
                    }
            except:
                pass
    print(f"✅ Loaded {len(health_data)} counties with health data")
except Exception as e:
    print(f"❌ Error loading health data: {e}")
    exit(1)

# Create database
print("\n💾 Creating database...")
os.remove(db_path) if os.path.exists(db_path) else None
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE counties (
        fips INTEGER PRIMARY KEY,
        county TEXT,
        state TEXT,
        poverty_pct REAL,
        diabetes REAL,
        obesity REAL,
        bphigh REAL,
        depression REAL
    )
""")

# Merge and insert
merged = 0
for fips, h in health_data.items():
    if fips in poverty_data:
        cursor.execute("""
            INSERT INTO counties VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            int(fips),
            h['county'],
            h['state'],
            poverty_data[fips],
            h['diabetes'],
            h['obesity'],
            h['bphigh'],
            h['depression']
        ))
        merged += 1

conn.commit()
conn.close()

print(f"\n✅ Database created with {merged} counties!")
print(f"\n📊 SAMPLE DATA:")

# Show sample
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT county, state, poverty_pct, diabetes, obesity FROM counties WHERE county = 'Wayne' AND state = 'Michigan'")
row = cursor.fetchone()
if row:
    print(f"   Wayne, Michigan: Poverty {row[2]}% | Diabetes {row[3]}% | Obesity {row[4]}%")

cursor.execute("SELECT AVG(poverty_pct), AVG(diabetes), AVG(obesity) FROM counties")
row = cursor.fetchone()
print(f"   Average: Poverty {row[0]:.1f}% | Diabetes {row[1]:.1f}% | Obesity {row[2]:.1f}%")
conn.close()

print("\n✅ Database ready!\n")
