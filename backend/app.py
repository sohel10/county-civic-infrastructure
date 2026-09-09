from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import statistics
from scipy import stats
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)
DB_PATH = './counties.db'

# Get API key from environment
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

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

@app.route('/api/correlation', methods=['GET'])
def correlation_analysis():
    state = request.args.get('state', '')
    if not state:
        rows = query_db('SELECT poverty_pct, diabetes, obesity FROM counties')
    else:
        rows = query_db('SELECT poverty_pct, diabetes, obesity FROM counties WHERE state = ?', (state,))
    
    data = [dict(r) for r in rows]
    pov = [d['poverty_pct'] for d in data]
    diab = [d['diabetes'] for d in data]
    obes = [d['obesity'] for d in data]
    
    corr_pov_diab, p_pov_diab = stats.pearsonr(pov, diab)
    corr_pov_obes, p_pov_obes = stats.pearsonr(pov, obes)
    corr_diab_obes, p_diab_obes = stats.pearsonr(diab, obes)
    
    return jsonify({
        'poverty_diabetes': {'correlation': round(corr_pov_diab, 3), 'p_value': round(p_pov_diab, 4)},
        'poverty_obesity': {'correlation': round(corr_pov_obes, 3), 'p_value': round(p_pov_obes, 4)},
        'diabetes_obesity': {'correlation': round(corr_diab_obes, 3), 'p_value': round(p_diab_obes, 4)}
    })

@app.route('/api/rankings', methods=['GET'])
def rankings():
    state = request.args.get('state', '')
    metric = request.args.get('metric', 'poverty_pct')
    
    if not state:
        rows = query_db(f'SELECT county, state, poverty_pct, diabetes, obesity FROM counties ORDER BY {metric} DESC LIMIT 20')
    else:
        rows = query_db(f'SELECT county, state, poverty_pct, diabetes, obesity FROM counties WHERE state = ? ORDER BY {metric} DESC LIMIT 20', (state,))
    
    return jsonify({'count': len(rows), 'data': [dict(r) for r in rows]})

@app.route('/api/statistics', methods=['GET'])
def statistics_summary():
    state = request.args.get('state', '')
    if not state:
        rows = query_db('SELECT poverty_pct, diabetes, obesity FROM counties')
    else:
        rows = query_db('SELECT poverty_pct, diabetes, obesity FROM counties WHERE state = ?', (state,))
    
    data = [dict(r) for r in rows]
    pov = [d['poverty_pct'] for d in data]
    diab = [d['diabetes'] for d in data]
    obes = [d['obesity'] for d in data]
    
    return jsonify({
        'poverty_pct': {
            'mean': round(statistics.mean(pov), 2),
            'median': round(statistics.median(pov), 2),
            'stdev': round(statistics.stdev(pov), 2),
            'min': min(pov),
            'max': max(pov),
            'q1': round(sorted(pov)[len(pov)//4], 2),
            'q3': round(sorted(pov)[3*len(pov)//4], 2)
        },
        'diabetes': {
            'mean': round(statistics.mean(diab), 2),
            'median': round(statistics.median(diab), 2),
            'stdev': round(statistics.stdev(diab), 2),
            'min': min(diab),
            'max': max(diab),
            'q1': round(sorted(diab)[len(diab)//4], 2),
            'q3': round(sorted(diab)[3*len(diab)//4], 2)
        },
        'obesity': {
            'mean': round(statistics.mean(obes), 2),
            'median': round(statistics.median(obes), 2),
            'stdev': round(statistics.stdev(obes), 2),
            'min': min(obes),
            'max': max(obes),
            'q1': round(sorted(obes)[len(obes)//4], 2),
            'q3': round(sorted(obes)[3*len(obes)//4], 2)
        }
    })

@app.route('/api/equity-index', methods=['GET'])
def equity_index():
    fips_str = request.args.get('fips', '')
    if not fips_str:
        return jsonify({'error': 'No counties selected'})
    
    fips_list = fips_str.split(',')
    ph = ','.join(['?' for _ in fips_list])
    rows = query_db(f'SELECT county, state, poverty_pct, diabetes, obesity FROM counties WHERE fips IN ({ph})', fips_list)
    
    data = [dict(r) for r in rows]
    pov_range = max([d['poverty_pct'] for d in data]) - min([d['poverty_pct'] for d in data])
    health_range = max([d['diabetes'] + d['obesity'] for d in data]) - min([d['diabetes'] + d['obesity'] for d in data])
    
    equity_score = round((pov_range + health_range) / 2, 2)
    
    return jsonify({
        'equity_score': equity_score,
        'interpretation': 'High disparity' if equity_score > 30 else 'Moderate disparity' if equity_score > 15 else 'Low disparity',
        'poverty_gap': round(pov_range, 2),
        'health_gap': round(health_range, 2)
    })

# FIXED: OpenAI Copilot using environment variable
@app.route('/api/ai-suggestions', methods=['POST'])
def ai_suggestions():
    if not OPENAI_API_KEY:
        return jsonify({'suggestions': '❌ Error: OPENAI_API_KEY environment variable not set. Set it and restart.'}), 400
    
    data = request.json
    counties = data.get('counties', [])
    
    if len(counties) < 2:
        return jsonify({'suggestions': 'Select 2+ counties for analysis'}), 400
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Create comparison of counties
        summary = "Health Equity Analysis:\n\n"
        summary += "SELECTED COUNTIES:\n"
        for c in counties:
            summary += f"• {c['county']}, {c['state']}: Poverty {c['poverty_pct']}%, Diabetes {c['diabetes']}%, Obesity {c['obesity']}%\n"
        
        # Calculate gaps
        pov_vals = [c['poverty_pct'] for c in counties]
        diab_vals = [c['diabetes'] for c in counties]
        obes_vals = [c['obesity'] for c in counties]
        
        summary += f"\nGAPS BETWEEN COUNTIES:\n"
        summary += f"• Poverty gap: {max(pov_vals) - min(pov_vals):.1f}%\n"
        summary += f"• Diabetes gap: {max(diab_vals) - min(diab_vals):.1f}%\n"
        summary += f"• Obesity gap: {max(obes_vals) - min(obes_vals):.1f}%\n"
        
        message = client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "user",
                "content": f"{summary}\n\nProvide 3 specific, actionable insights to reduce health disparities between these counties. Focus on the differences you see."
            }],
            max_tokens=500
        )
        
        return jsonify({'suggestions': message.choices[0].message.content})
    except Exception as e:
        return jsonify({'suggestions': f'❌ Error: {str(e)}'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5005, host='0.0.0.0')
