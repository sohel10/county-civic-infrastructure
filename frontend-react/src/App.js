import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = '/api';
const MAX_COUNTIES = 5;

function App() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [counties, setCounties] = useState([]);
  const [filteredCounties, setFilteredCounties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedFips, setSelectedFips] = useState([]);
  const [selectedCounties, setSelectedCounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [rankMetric, setRankMetric] = useState('poverty_pct');
  const [equityData, setEquityData] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const dashboardRef = useRef(null);

  useEffect(() => { loadStates(); }, []);

  const loadStates = async () => {
    try {
      setLoading(true); setError('');
      const response = await axios.get(`${API_URL}/states`);
      setStates(response.data.data || []);
    } catch (err) {
      setError('Cannot connect to Flask API on port 5001. Start backend first!');
    } finally { setLoading(false); }
  };

  const loadByState = async (e) => {
    const state = e.target.value;
    setSelectedState(state); setSearchQuery('');
    if (state) {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/counties/by-state?state=${state}`);
        const data = response.data.data || [];
        setCounties(data); setFilteredCounties(data);
      } catch (err) { setError(`Error: ${err.message}`); }
      finally { setLoading(false); }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() && counties.length > 0) {
      setFilteredCounties(counties.filter((c) => (c.county || '').toLowerCase().includes(query.toLowerCase())));
    } else { setFilteredCounties(counties); }
  };

  const handleGlobalSearch = async () => {
    if (!globalSearch.trim()) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/search?q=${globalSearch}`);
      setFilteredCounties(response.data.data || []);
      setCounties(response.data.data || []);
      setSelectedState('Global Search'); setShowDashboard(true);
    } catch (err) { setError(`Search error: ${err.message}`); }
    finally { setLoading(false); }
  };

  const toggleFips = (fips) => {
    const county = filteredCounties.find(c => c.fips === fips);
    if (selectedFips.includes(fips)) {
      setSelectedFips(prev => prev.filter(f => f !== fips));
      setSelectedCounties(prev => prev.filter(c => c.fips !== fips));
    } else if (selectedFips.length < MAX_COUNTIES) {
      setSelectedFips(prev => [...prev, fips]);
      if (county && !selectedCounties.find(c => c.fips === fips)) {
        setSelectedCounties(prev => [...prev, county]);
      }
    }
  };

  const clearAll = () => {
    setSelectedFips([]);
    setSelectedCounties([]);
  };

  const loadStatistics = async () => {
    try { setLoading(true);
      const url = selectedState && selectedState !== 'Global Search' ? `${API_URL}/statistics?state=${selectedState}` : `${API_URL}/statistics`;
      const response = await axios.get(url); setStats(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadCorrelation = async () => {
    try { setLoading(true);
      const url = selectedState && selectedState !== 'Global Search' ? `${API_URL}/correlation?state=${selectedState}` : `${API_URL}/correlation`;
      const response = await axios.get(url); setCorrelation(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadRankings = async (metric) => {
    const m = metric || rankMetric;
    try { setLoading(true);
      const url = selectedState && selectedState !== 'Global Search' ? `${API_URL}/rankings?state=${selectedState}&metric=${m}` : `${API_URL}/rankings?metric=${m}`;
      const response = await axios.get(url); setRankings(response.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadEquityIndex = async () => {
    if (selectedFips.length < 2) { setError(`Select at least 2 counties (${selectedFips.length}/${MAX_COUNTIES})`); return; }
    try { setLoading(true);
      const response = await axios.get(`${API_URL}/equity-index?fips=${selectedFips.join(',')}`);
      setEquityData(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadAISuggestions = async () => {
    if (selectedCounties.length < 2) { setError(`Select at least 2 counties`); return; }
    try { setLoading(true);
      const response = await axios.post(`${API_URL}/ai-suggestions`, { counties: selectedCounties });
      setAiInsights(response.data.suggestions || 'No suggestions');
    } catch (err) { setAiInsights('AI requires OPENAI_API_KEY environment variable.'); }
    finally { setLoading(false); }
  };

  const getComparisonData = () => {
    if (selectedCounties.length < 2) return [];
    return selectedCounties.map(s => ({
      name: s.county + ', ' + s.state,
      poverty: s.poverty_pct,
      diabetes: s.diabetes,
      obesity: s.obesity
    }));
  };

  const exportCSV = () => {
    let csv = 'County,State,Poverty %,Diabetes %,Obesity %\n';
    filteredCounties.forEach((c) => { csv += `${c.county},${c.state},${c.poverty_pct},${c.diabetes},${c.obesity}\n`; });
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    el.setAttribute('download', `county_data_${selectedState || 'all'}.csv`);
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  };

  const launchDashboard = () => {
    setShowDashboard(true);
    setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const summaryStats = filteredCounties.length > 0 ? {
    avgPoverty: (filteredCounties.reduce((s, c) => s + (c.poverty_pct || 0), 0) / filteredCounties.length).toFixed(1),
    avgDiabetes: (filteredCounties.reduce((s, c) => s + (c.diabetes || 0), 0) / filteredCounties.length).toFixed(1),
    avgObesity: (filteredCounties.reduce((s, c) => s + (c.obesity || 0), 0) / filteredCounties.length).toFixed(1),
    totalCounties: filteredCounties.length,
  } : { avgPoverty: 0, avgDiabetes: 0, avgObesity: 0, totalCounties: 0 };

  return (
    <div className="app-container">

      {/* HERO LANDING PAGE */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">County Health Comparison</h1>
          <p className="app-subtitle">
            Compare up to {MAX_COUNTIES} counties at once | AI-powered health equity analysis<br/>
            Analyze. Compare. Act.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-number">3,135</div>
              <div className="hero-label">US Counties</div>
            </div>
            <div className="hero-stat">
              <div className="hero-number">50</div>
              <div className="hero-label">States</div>
            </div>
            <div className="hero-stat">
              <div className="hero-number">2023</div>
              <div className="hero-label">Data Year</div>
            </div>
          </div>
          <button onClick={launchDashboard} className="btn-launch">
            🚀 Launch Dashboard
          </button>
        </div>
      </header>

      {/* THE PROBLEM SECTION */}
      <section className="problem-section">
        <h2 className="section-title">The Problem</h2>
        <p className="section-subtitle">Health disparities across US counties are widening, costly, and preventable</p>
        <div className="problem-cards">
          <div className="problem-card">
            <div className="problem-icon">🏥</div>
            <div className="problem-number">37M</div>
            <div className="problem-desc">Americans living in poverty</div>
            <div className="problem-source">US Census Bureau 2023</div>
          </div>
          <div className="problem-card">
            <div className="problem-icon">💉</div>
            <div className="problem-number">11.6%</div>
            <div className="problem-desc">Adult diabetes prevalence nationwide</div>
            <div className="problem-source">CDC PLACES 2023</div>
          </div>
          <div className="problem-card">
            <div className="problem-icon">📊</div>
            <div className="problem-number">41.9%</div>
            <div className="problem-desc">Adult obesity rate in the US</div>
            <div className="problem-source">CDC National Data 2023</div>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <div ref={dashboardRef} className="dashboard-section" style={{ display: showDashboard ? "block" : "none" }}>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="btn-dismiss">Dismiss</button>
          </div>
        )}

        {/* SELECTED COUNTIES - PILLS (like AWS version) */}
        {selectedCounties.length > 0 && (
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px solid #0ea5e9' }}>
            <div style={{ marginBottom: '10px', color: '#94a3b8', fontWeight: 600 }}>Selected:</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {selectedCounties.map(c => (
                <div key={c.fips} style={{ background: '#0ea5e9', color: 'white', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <span>{c.county}, {c.state}</span>
                  <button onClick={() => toggleFips(c.fips)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>&#x2715;</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setActiveTab('overview')} className="btn-action btn-green" disabled={selectedCounties.length < 2}>
                ✓ Compare ({selectedCounties.length}/{MAX_COUNTIES})
              </button>
              <button onClick={clearAll} className="btn-action btn-red">Clear All</button>
            </div>
          </div>
        )}

        <div className="controls">
          <div className="global-search">
            <input type="text" placeholder="🔍 Search any county across ALL states..." value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
              className="search-input-global" />
            <button onClick={handleGlobalSearch} className="btn-action btn-blue">🔍 Search</button>
          </div>
          <select value={selectedState} onChange={loadByState} className="state-select" disabled={loading}>
            <option value="">-- Select State --</option>
            {states.map((s) => (<option key={s.state} value={s.state}>{s.state} ({s.county_count})</option>))}
          </select>
          <button onClick={exportCSV} className="btn-action btn-purple">📋 Export CSV</button>
        </div>

        <div className="tabs">
          {[
            { id: 'overview', label: '📊 Overview', color: '#3b82f6' },
            { id: 'statistics', label: '📈 Statistics', color: '#10b981' },
            { id: 'correlation', label: '🔗 Correlation', color: '#ef4444' },
            { id: 'rankings', label: '🏆 Rankings', color: '#f59e0b' },
            { id: 'equity', label: '⚖️ Equity', color: '#8b5cf6' },
            { id: 'ai', label: '🤖 AI Insights', color: '#14b8a6' },
          ].map((tab) => (
            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id);
                if (tab.id === 'statistics') loadStatistics();
                if (tab.id === 'correlation') loadCorrelation();
                if (tab.id === 'rankings') loadRankings();
              }}
              style={activeTab === tab.id ? { backgroundColor: tab.color } : {}}
            >{tab.label}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                <strong>AVG POVERTY %</strong><div className="stat-number">{summaryStats.avgPoverty}%</div>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #991b1b, #ef4444)' }}>
                <strong>AVG DIABETES %</strong><div className="stat-number">{summaryStats.avgDiabetes}%</div>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #92400e, #f59e0b)' }}>
                <strong>AVG OBESITY %</strong><div className="stat-number">{summaryStats.avgObesity}%</div>
              </div>
              <div className="stat-box" style={{ background: 'linear-gradient(135deg, #065f46, #10b981)' }}>
                <strong>COUNTIES</strong><div className="stat-number">{summaryStats.totalCounties}</div>
              </div>
            </div>

            {/* MULTI-COUNTY COMPARISON PANEL */}
            {selectedCounties.length >= 2 && getComparisonData().length >= 2 && (
              <div className="comparison-panel">
                <h3>✓ Multi-County Comparison ({selectedCounties.length}/{MAX_COUNTIES})</h3>
                <div className="comparison-grid">
                  <div className="comparison-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>County</th>
                          <th>State</th>
                          <th>Poverty %</th>
                          <th>Diabetes %</th>
                          <th>Obesity %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getComparisonData().map((c, idx) => (
                          <tr key={idx}>
                            <td><strong>{c.name.split(',')[0]}</strong></td>
                            <td>{c.name.split(',')[1]}</td>
                            <td style={{ textAlign: 'center' }}>{c.poverty}%</td>
                            <td style={{ textAlign: 'center' }}>{c.diabetes}%</td>
                            <td style={{ textAlign: 'center' }}>{c.obesity}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="comparison-chart">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getComparisonData()} barSize={30}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ background: '#1a1f3a', border: '1px solid #2d3748', borderRadius: '8px', color: '#e2e8f0' }} />
                        <Legend />
                        <Bar dataKey="poverty" name="Poverty %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="diabetes" name="Diabetes %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="obesity" name="Obesity %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <input type="text" placeholder="Search county..." value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)} className="search-input" />

            <table className="data-table">
              <thead><tr><th>Select</th><th>FIPS</th><th>State</th><th>County</th><th>Poverty %</th><th>Diabetes %</th><th>Obesity %</th></tr></thead>
              <tbody>
                {filteredCounties.slice(0, 50).map((c) => (
                  <tr key={c.fips || c.county} style={selectedFips.includes(c.fips) ? { background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' } : { cursor: 'pointer' }} onClick={() => toggleFips(c.fips)}>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={selectedFips.includes(c.fips)} onChange={() => toggleFips(c.fips)} disabled={selectedFips.length >= MAX_COUNTIES && !selectedFips.includes(c.fips)} /></td>
                    <td><code style={{ color: '#64748b' }}>{c.fips}</code></td>
                    <td>{c.state}</td>
                    <td><strong>{c.county}</strong></td>
                    <td style={{ textAlign: 'center' }}>{c.poverty_pct || 'N/A'}%</td>
                    <td style={{ textAlign: 'center' }}>{c.diabetes || 'N/A'}%</td>
                    <td style={{ textAlign: 'center' }}>{c.obesity || 'N/A'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && (
          <div className="tab-content">
            <h2>📈 Statistical Summary</h2>
            {stats ? (
              <div className="stats-detail-grid">
                {Object.entries(stats).map(([metric, values]) => (
                  <div key={metric} className="stats-detail-card">
                    <h3>{metric.replace('_', ' ')}</h3>
                    {typeof values === 'object' ? (
                      <table className="mini-table"><tbody>
                        {Object.entries(values).map(([k, v]) => (
                          <tr key={k}><td>{k}</td><td>{typeof v === 'number' ? v.toFixed(2) : v}</td></tr>
                        ))}
                      </tbody></table>
                    ) : <p>{values}</p>}
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#64748b' }}>Select a state to view statistics</p>}
          </div>
        )}

        {/* CORRELATION TAB */}
        {activeTab === 'correlation' && (
          <div className="tab-content">
            <h2>🔗 Correlation Analysis</h2>
            {correlation ? (
              <div className="correlation-grid">
                {Object.entries(correlation).map(([pair, data]) => (
                  <div key={pair} className="correlation-card">
                    <h4>{pair.replace(/_/g, ' ↔ ')}</h4>
                    <div className="correlation-value" style={{ color: Math.abs(data.r) > 0.5 ? '#ef4444' : '#f59e0b' }}>
                      r = {data.r}
                    </div>
                    <div className="correlation-bar-container">
                      <div className="correlation-bar-fill" style={{ width: `${Math.abs(data.r) * 100}%` }} />
                    </div>
                    <small>p-value: {data.p_value}</small>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#64748b' }}>Select a state to view correlations</p>}
          </div>
        )}

        {/* RANKINGS TAB */}
        {activeTab === 'rankings' && (
          <div className="tab-content">
            <h2>🏆 County Rankings</h2>
            <select value={rankMetric} onChange={(e) => { setRankMetric(e.target.value); loadRankings(e.target.value); }} className="state-select">
              <option value="poverty_pct">Highest Poverty %</option>
              <option value="diabetes">Highest Diabetes %</option>
              <option value="obesity">Highest Obesity %</option>
            </select>
            {rankings && rankings.length > 0 ? (
              <table className="data-table" style={{ marginTop: '1rem' }}>
                <thead><tr><th>#</th><th>County</th><th>State</th><th>Poverty %</th><th>Diabetes %</th><th>Obesity %</th></tr></thead>
                <tbody>
                  {rankings.map((r, i) => (
                    <tr key={r.county + r.state}><td>{i + 1}</td><td><strong>{r.county}</strong></td><td>{r.state}</td>
                    <td>{r.poverty_pct}%</td><td>{r.diabetes}%</td><td>{r.obesity}%</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b' }}>Click a metric to load rankings</p>}
          </div>
        )}

        {/* EQUITY TAB */}
        {activeTab === 'equity' && (
          <div className="tab-content">
            <h2>⚖️ Equity Index</h2>
            <p style={{ color: '#94a3b8' }}>Select 2-{MAX_COUNTIES} counties then click:</p>
            <button onClick={loadEquityIndex} className="btn-action btn-purple" disabled={selectedFips.length < 2} style={{ marginTop: '1rem' }}>
              Calculate Equity Index
            </button>
            {equityData && (
              <div className="equity-result">
                <div className="equity-score" style={{ color: equityData.equity_score > 30 ? '#ef4444' : equityData.equity_score > 15 ? '#f59e0b' : '#10b981' }}>
                  {equityData.equity_score}
                </div>
                <div className="equity-label">{equityData.interpretation}</div>
                <div className="equity-details">
                  <span>Poverty Gap: {equityData.poverty_gap}%</span>
                  <span>Health Gap: {equityData.health_gap}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI TAB */}
        {activeTab === 'ai' && (
          <div className="tab-content">
            <h2>🤖 AI-Powered Health Insights</h2>
            <p style={{ color: '#94a3b8' }}>Select 2-{MAX_COUNTIES} counties then click:</p>
            <button onClick={loadAISuggestions} className="btn-action btn-teal" disabled={selectedCounties.length < 2} style={{ marginTop: '1rem' }}>
              Generate AI Insights
            </button>
            {aiInsights && <div className="ai-result"><pre style={{ whiteSpace: 'pre-wrap' }}>{aiInsights}</pre></div>}
          </div>
        )}
      </div>

      {/* REFERENCES */}
      <section className="references-section">
        <h2>References & Data Sources</h2>
        <div className="ref-grid">
          <div className="ref-card">
            <h4>📊 US Census Bureau</h4>
            <p>Small Area Income and Poverty Estimates (SAIPE), 2023. County-level poverty rates for all 3,135 US counties.</p>
          </div>
          <div className="ref-card">
            <h4>🏥 CDC PLACES</h4>
            <p>Population Level Analysis and Community Estimates, 2023. County-level diabetes and obesity prevalence rates.</p>
          </div>
          <div className="ref-card">
            <h4>📈 Methodology</h4>
            <p>Pearson correlation analysis between poverty rates and health outcomes. Equity index from disparity gaps.</p>
          </div>
          <div className="ref-card">
            <h4>🤖 AI Analysis</h4>
            <p>GPT-4 powered insights for health equity recommendations based on county-level data comparisons.</p>
          </div>
          <div className="ref-card">
            <h4>⚙️ Technology Stack</h4>
            <p>React frontend, Flask API backend, SQLite database. Deployed on AWS EC2 with HTTPS via Nginx.</p>
          </div>
          <div className="ref-card">
            <h4>👨‍💻 Developer</h4>
            <p>Sohel Ahmed, Ph.D. — ML Engineer & Data Scientist. 8+ years production experience in healthcare AI.</p>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <p>📊 Data: 2023 US Census Bureau + CDC PLACES | 3,135 Counties | Compare up to {MAX_COUNTIES} counties | Built with React + Flask | 💻 Sohel Ahmed</p>
      </footer>
    </div>
  );
}

export default App;
