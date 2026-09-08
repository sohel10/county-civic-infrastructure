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
