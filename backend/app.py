from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DB_PATH = 'counties.db'

def query_db(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

@app.route('/api/health', methods=['GET'])
def health_check():
    rows = query_db('SELECT COUNT(*) as total FROM counties')
    return jsonify({'status': 'ok', 'total_counties': rows[0]['total']})

@app.route('/api/counties', methods=['GET'])
def get_counties():
    limit = request.args.get('limit', 3142, type=int)  # Changed from 50 to ALL
    state = request.args.get('state', '', type=str)
    
    if state:
        rows = query_db('SELECT * FROM counties WHERE state_name = ? LIMIT ?', (state, limit))
    else:
        rows = query_db('SELECT * FROM counties LIMIT ?', (limit,))
    
    total = query_db('SELECT COUNT(*) as total FROM counties')[0]['total']
    return jsonify({'total': total, 'count': len(rows), 'data': rows})

@app.route('/api/counties/search', methods=['GET'])
def search():
    query = request.args.get('q', '')
    rows = query_db('SELECT * FROM counties WHERE county_name LIKE ? OR state_name LIKE ?', (f'%{query}%', f'%{query}%'))
    return jsonify({'count': len(rows), 'data': rows})

@app.route('/api/states', methods=['GET'])
def get_states():
    rows = query_db('SELECT DISTINCT state_name, COUNT(*) as county_count FROM counties GROUP BY state_name ORDER BY state_name')
    return jsonify({'count': len(rows), 'data': rows})

@app.route('/api/compare', methods=['GET'])
def compare():
    fips_list = request.args.get('fips', '').split(',')
    placeholders = ','.join(['?' for _ in fips_list])
    rows = query_db(f'SELECT * FROM counties WHERE fips IN ({placeholders})', fips_list)
    return jsonify({'count': len(rows), 'data': rows})


import numpy as np

@app.route('/api/analytics/disparity', methods=['GET'])
def analytics_disparity():
    """Calculate statistical disparity metrics"""
    fips_list = request.args.get('fips', '').split(',')
    
    if len(fips_list) < 2:
        return jsonify({'error': 'Need 2+ counties'}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    query = f"SELECT fips, state_name, county_name, poverty_rate, college_educated_pct, median_income, health_score FROM counties WHERE fips IN ({','.join(['?']*len(fips_list))})"
    cursor.execute(query, fips_list)
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return jsonify({'error': 'Not found'}), 404
    
    columns = ['fips', 'state_name', 'county_name', 'poverty_rate', 'college_educated_pct', 'median_income', 'health_score']
    counties = [dict(zip(columns, row)) for row in rows]
    
    poverty = np.array([c['poverty_rate'] for c in counties])
    health = np.array([c['health_score'] for c in counties])
    income = np.array([c['median_income'] for c in counties])
    
    corr_pov_health = float(np.corrcoef(poverty, health)[0, 1]) if len(poverty) > 1 else None
    corr_inc_health = float(np.corrcoef(income, health)[0, 1]) if len(income) > 1 else None
    
    return jsonify({
        'statistics': {
            'poverty_mean': round(float(np.mean(poverty)), 1),
            'health_mean': round(float(np.mean(health)), 1),
            'correlation_poverty_health': round(corr_pov_health, 3) if corr_pov_health else None,
            'correlation_income_health': round(corr_inc_health, 3) if corr_inc_health else None
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)

from comparison_service import get_comparison_data

@app.route('/api/compare/detailed', methods=['GET'])
def compare_detailed():
    fips_list = request.args.get('fips', '').split(',')
    if len(fips_list) < 2:
        return jsonify({'error': 'Select 2+ counties'}), 400
    
    data = get_comparison_data(fips_list)
    return jsonify(data)
