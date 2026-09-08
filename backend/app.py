from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)
DB_PATH = './counties.db'

def query_db(sql, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

@app.route('/api/states', methods=['GET'])
def get_states():
    rows = query_db('SELECT DISTINCT state, COUNT(*) as county_count FROM counties GROUP BY state ORDER BY state')
    return jsonify({'count': len(rows), 'data': [dict(r) for r in rows]})

@app.route('/api/counties/by-state', methods=['GET'])
def get_counties_by_state():
    state = request.args.get('state', '')
    if not state:
        rows = query_db('SELECT * FROM counties ORDER BY state, county LIMIT 3200')
    else:
        rows = query_db('SELECT * FROM counties WHERE state = ? ORDER BY county', (state,))
    return jsonify({'count': len(rows), 'data': [dict(r) for r in rows]})

@app.route('/api/search', methods=['GET'])
def search_counties():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify({'count': 0, 'data': []})
    rows = query_db('SELECT * FROM counties WHERE county LIKE ? OR state LIKE ? ORDER BY state, county LIMIT 20', (f'%{q}%', f'%{q}%'))
    return jsonify({'count': len(rows), 'data': [dict(r) for r in rows]})

@app.route('/api/compare', methods=['GET'])
def compare_counties():
    fips_str = request.args.get('fips', '')
    if not fips_str:
        return jsonify({'count': 0, 'data': []})
    fips_list = fips_str.split(',')
    ph = ','.join(['?' for _ in fips_list])
    rows = query_db(f'SELECT * FROM counties WHERE fips IN ({ph})', fips_list)
    return jsonify({'count': len(rows), 'data': [dict(r) for r in rows]})

if __name__ == '__main__':
    app.run(debug=True, port=5005, host='0.0.0.0')
