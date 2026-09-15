import sqlite3
import csv
import os

# Remove old database
db_path = 'counties.db'
if os.path.exists(db_path):
    os.remove(db_path)

# Create new database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create table with all metrics
cursor.execute('''
CREATE TABLE counties (
    fips INTEGER PRIMARY KEY,
    county TEXT,
    state TEXT,
    poverty_pct REAL,
    education_rate REAL,
    median_income INTEGER,
    health_score REAL,
    diabetes REAL,
    obesity REAL,
    premature_death INTEGER,
    poor_physical_days REAL,
    poor_mental_days REAL,
    low_birthweight INTEGER
)
''')

# Load data from CSV
with open('counties.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cursor.execute('''
        INSERT INTO counties VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            int(row['fips']),
            row['county'],
            row['state'],
            float(row['poverty_pct']),
            float(row['education_rate']),
            int(row['median_income']),
            float(row['health_score']),
            float(row['diabetes']),
            float(row['obesity']),
            int(row['premature_death']),
            float(row['poor_physical_days']),
            float(row['poor_mental_days']),
            int(row['low_birthweight'])
        ))

conn.commit()
conn.close()
print("✅ Database updated with new health metrics!")
