const API_URL = 'http://localhost:5005/api';
let allCounties = [];
let filteredCounties = [];
let selectedCounties = [];
let comparisonChart = null;

window.onload = () => {
    loadStates();
    setupGlobalSearch();
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function setupGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    if (!input) return;
    let timeout;
    input.addEventListener('input', function() {
        clearTimeout(timeout);
        const query = this.value.trim();
        if (query.length < 2) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }
        timeout = setTimeout(() => {
            fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(result => displaySearchResults(result.data));
        }, 300);
    });
}

function displaySearchResults(counties) {
    const container = document.getElementById('searchResults');
    if (!counties || counties.length === 0) {
        container.innerHTML = '<div style="padding:10px;">No results</div>';
        container.style.display = 'block';
        return;
    }
    let html = '';
    counties.forEach(c => {
        const isSelected = selectedCounties.some(s => s.fips === c.fips);
        html += `<div style="padding:10px; border-bottom:1px solid #f0f0f0; cursor:pointer; ${isSelected ? 'background:#e8f8f5' : ''}" onclick="addToComparison(${c.fips}, '${c.county}', '${c.state}', ${c.poverty_pct}, ${c.diabetes}, ${c.obesity})">
            <strong>${c.county}, ${c.state}</strong> | Poverty: ${c.poverty_pct}% | Diabetes: ${c.diabetes}% | Obesity: ${c.obesity}%
        </div>`;
    });
    container.innerHTML = html;
    container.style.display = 'block';
}

function addToComparison(fips, county, state, pov, diab, obes) {
    if (selectedCounties.some(c => c.fips === fips)) return;
    if (selectedCounties.length >= 6) { alert('Max 6 counties'); return; }
    selectedCounties.push({ fips, county, state, poverty_pct: pov, diabetes: diab, obesity: obes });
    updateComparisonPanel();
}

function removeFromComparison(fips) {
    selectedCounties = selectedCounties.filter(c => c.fips !== fips);
    updateComparisonPanel();
}

function updateComparisonPanel() {
    const panel = document.getElementById('comparePanel');
    if (selectedCounties.length === 0) { panel.style.display = 'none'; return; }
    let html = '<h3>Selected:</h3><div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">';
    selectedCounties.forEach(c => {
        html += `<div style="background:#3498db; color:white; padding:8px 12px; border-radius:6px;">
            ${c.county}, ${c.state} <button onclick="removeFromComparison(${c.fips})" style="background:none; border:none; color:white; cursor:pointer;">&times;</button>
        </div>`;
    });
    html += '</div>';
    if (selectedCounties.length >= 2) {
        html += '<button onclick="runComparison()" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">📈 Compare</button>';
    }
    panel.innerHTML = html;
    panel.style.display = 'block';
}

function loadStates() {
    fetch(`${API_URL}/states`)
        .then(res => res.json())
        .then(result => {
            const select = document.getElementById('stateSelect');
            select.innerHTML = '<option value="">-- Select State --</option>';
            result.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.state;
                opt.textContent = `${item.state} (${item.county_count})`;
                select.appendChild(opt);
            });
        });
}

function loadByState() {
    const state = document.getElementById('stateSelect').value;
    if (!state) { alert('Select a state'); return; }
    fetch(`${API_URL}/counties/by-state?state=${encodeURIComponent(state)}`)
        .then(res => res.json())
        .then(result => {
            allCounties = result.data;
            filteredCounties = [...allCounties];
            displayCounties(filteredCounties);
            updateSummaryStats(filteredCounties);
        });
}

function loadCounties() {
    fetch(`${API_URL}/counties/by-state`)
        .then(res => res.json())
        .then(result => {
            allCounties = result.data;
            filteredCounties = [...allCounties];
            displayCounties(filteredCounties);
            updateSummaryStats(filteredCounties);
        });
}

function getColorClass(metric, value) {
    if (metric === 'poverty') return value < 10 ? '#27ae60' : value < 20 ? '#3498db' : '#e74c3c';
    if (metric === 'diabetes') return value < 8 ? '#27ae60' : value < 12 ? '#3498db' : '#e74c3c';
    if (metric === 'obesity') return value < 30 ? '#27ae60' : value < 40 ? '#3498db' : '#e74c3c';
    return '#95a5a6';
}

// SIMPLIFIED: Clean table - just numbers, NO colored bars in cells
function displayCounties(counties) {
    let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr style="background:#2c3e50; color:white; font-weight:bold;"><th style="padding:10px; text-align:left;">County, State</th><th style="padding:10px; text-align:center;">Poverty %</th><th style="padding:10px; text-align:center;">Diabetes %</th><th style="padding:10px; text-align:center;">Obesity %</th></tr></thead><tbody>';
    
    counties.forEach((c, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
        html += `<tr style="background:${bgColor}; cursor:pointer; border-bottom:1px solid #ddd; hover-background:#f0f0f0;" onclick="addToComparison(${c.fips}, '${c.county}', '${c.state}', ${c.poverty_pct}, ${c.diabetes}, ${c.obesity})">
            <td style="padding:10px; text-align:left;"><strong>${c.county}</strong>, ${c.state}</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${getColorClass('poverty', c.poverty_pct)};">${c.poverty_pct}%</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${getColorClass('diabetes', c.diabetes)};">${c.diabetes}%</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${getColorClass('obesity', c.obesity)};">${c.obesity}%</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('results').innerHTML = html;
}

function searchCounty() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) { filteredCounties = [...allCounties]; displayCounties(filteredCounties); return; }
    filteredCounties = allCounties.filter(c => c.county.toLowerCase().includes(query) || c.state.toLowerCase().includes(query));
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    filteredCounties = [...allCounties];
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
}

function updateSummaryStats(counties) {
    if (counties.length === 0) return;
    const avgPov = (counties.reduce((s, c) => s + c.poverty_pct, 0) / counties.length).toFixed(1);
    const avgDiab = (counties.reduce((s, c) => s + c.diabetes, 0) / counties.length).toFixed(1);
    const avgObes = (counties.reduce((s, c) => s + c.obesity, 0) / counties.length).toFixed(1);
    document.getElementById('totalCounties').textContent = counties.length;
    document.getElementById('avgPoverty').textContent = avgPov + '%';
    document.getElementById('avgDiabetes').textContent = avgDiab + '%';
    document.getElementById('avgObesity').textContent = avgObes + '%';
    document.getElementById('summaryStats').style.display = 'grid';
}

function runComparison() {
    if (selectedCounties.length < 2) { alert('Select 2+ counties'); return; }
    displayComparisonChart();
}

// PERFECT: Horizontal bars with numbers beside
function displayComparisonChart() {
    const labels = selectedCounties.map(c => `${c.county}, ${c.state}`);
    const povData = selectedCounties.map(c => c.poverty_pct);
    const diabData = selectedCounties.map(c => c.diabetes);
    const obesData = selectedCounties.map(c => c.obesity);
    
    if (comparisonChart) comparisonChart.destroy();
    
    const ctx = document.getElementById('comparisonChart');
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Poverty %', data: povData, backgroundColor: '#e74c3c' },
                { label: 'Diabetes %', data: diabData, backgroundColor: '#f39c12' },
                { label: 'Obesity %', data: obesData, backgroundColor: '#3498db' }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#2c3e50',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#2c3e50', font: { weight: 'bold' } },
                    grid: { color: '#ecf0f1' }
                },
                y: {
                    ticks: { color: '#2c3e50', font: { weight: 'bold' } },
                    grid: { color: '#ecf0f1' }
                }
            }
        },
        plugins: [{
            id: 'textLabels',
            afterDatasetsDraw(chart) {
                const { ctx, data } = chart;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta.hidden) {
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            const xPos = bar.x + 8;
                            const yPos = bar.y;
                            ctx.font = 'bold 14px Arial';
                            ctx.fillStyle = '#2c3e50';
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(value + '%', xPos, yPos);
                        });
                    }
                });
            }
        }]
    });
    document.getElementById('chartContainer').style.display = 'block';
}

function loadStatistics() {
    const state = document.getElementById('stateSelect').value || 'all';
    const url = state === 'all' ? `${API_URL}/statistics` : `${API_URL}/statistics?state=${state}`;
    fetch(url)
        .then(res => res.json())
        .then(result => {
            let html = '<table style="width:100%; border-collapse:collapse;"><tr style="background:#27ae60; color:white;"><th style="padding:10px;">Metric</th><th>Mean</th><th>Median</th><th>Stdev</th><th>Q1</th><th>Q3</th><th>Min</th><th>Max</th></tr>';
            Object.keys(result).forEach(metric => {
                const s = result[metric];
                html += `<tr style="border-bottom:1px solid #ddd;"><td style="padding:10px;"><strong>${metric}</strong></td><td>${s.mean}</td><td>${s.median}</td><td>${s.stdev}</td><td>${s.q1}</td><td>${s.q3}</td><td>${s.min}</td><td>${s.max}</td></tr>`;
            });
            html += '</table>';
            document.getElementById('statisticsContent').innerHTML = html;
        });
}

function loadCorrelation() {
    const state = document.getElementById('stateSelect').value || 'all';
    const url = state === 'all' ? `${API_URL}/correlation` : `${API_URL}/correlation?state=${state}`;
    fetch(url)
        .then(res => res.json())
        .then(result => {
            let html = '<div style="font-size:14px; color:#2c3e50;">';
            html += `<p><strong>Poverty vs Diabetes:</strong> r=${result.poverty_diabetes.correlation} (p=${result.poverty_diabetes.p_value})</p>`;
            html += `<p><strong>Poverty vs Obesity:</strong> r=${result.poverty_obesity.correlation} (p=${result.poverty_obesity.p_value})</p>`;
            html += `<p><strong>Diabetes vs Obesity:</strong> r=${result.diabetes_obesity.correlation} (p=${result.diabetes_obesity.p_value})</p>`;
            html += '</div>';
            document.getElementById('correlationContent').innerHTML = html;
        });
}

function loadRankings() {
    const state = document.getElementById('stateSelect').value || 'all';
    const metric = document.getElementById('rankingMetric').value;
    const url = state === 'all' ? `${API_URL}/rankings?metric=${metric}` : `${API_URL}/rankings?state=${state}&metric=${metric}`;
    fetch(url)
        .then(res => res.json())
        .then(result => {
            let html = '<table style="width:100%; border-collapse:collapse;"><tr style="background:#f39c12; color:white;"><th style="padding:10px;">County, State</th><th>Poverty %</th><th>Diabetes %</th><th>Obesity %</th></tr>';
            result.data.forEach((c, i) => {
                html += `<tr style="border-bottom:1px solid #ddd;"><td style="padding:10px;"><strong>${i+1}. ${c.county}, ${c.state}</strong></td><td>${c.poverty_pct}%</td><td>${c.diabetes}%</td><td>${c.obesity}%</td></tr>`;
            });
            html += '</table>';
            document.getElementById('rankingsContent').innerHTML = html;
        });
}

function loadEquityIndex() {
    if (selectedCounties.length < 2) { alert('Select 2+ counties first'); return; }
    const fips = selectedCounties.map(c => c.fips).join(',');
    fetch(`${API_URL}/equity-index?fips=${fips}`)
        .then(res => res.json())
        .then(result => {
            let html = `<div style="background:#f0f0f0; padding:15px; border-radius:6px; font-size:14px; color:#2c3e50;">
                <h3 style="color:#9b59b6;">Health Equity Index: ${result.equity_score}</h3>
                <p><strong>Interpretation:</strong> ${result.interpretation}</p>
                <p><strong>Poverty Gap:</strong> ${result.poverty_gap}%</p>
                <p><strong>Health Gap:</strong> ${result.health_gap}%</p>
            </div>`;
            document.getElementById('equityContent').innerHTML = html;
        });
}

function loadAISuggestions() {
    if (selectedCounties.length < 2) { alert('Select 2+ counties first'); return; }
    document.getElementById('aiContent').innerHTML = '<p style="color:#2c3e50;">Loading AI insights...</p>';
    fetch(`${API_URL}/ai-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counties: selectedCounties })
    })
        .then(res => res.json())
        .then(result => {
            document.getElementById('aiContent').innerHTML = `<div style="background:#e8f8f5; padding:15px; border-radius:6px; border-left:4px solid #1abc9c; color:#2c3e50; line-height:1.6;">${result.suggestions.replace(/\n/g, '<br>')}</div>`;
        })
        .catch(err => document.getElementById('aiContent').innerHTML = '<p style="color:#e74c3c;">Error loading AI insights.</p>');
}

function exportCSV() {
    if (filteredCounties.length === 0) { alert('Load counties first'); return; }
    let csv = 'County,State,Poverty %,Diabetes %,Obesity %\n';
    filteredCounties.forEach(c => {
        csv += `${c.county},${c.state},${c.poverty_pct},${c.diabetes},${c.obesity}\n`;
    });
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'counties.csv';
    link.click();
}

function exportComparison() {
    if (selectedCounties.length === 0) { alert('Select counties first'); return; }
    const html = `<h2>County Health Comparison Report</h2><p>${new Date().toLocaleString()}</p>
        ${selectedCounties.map(c => `<p><strong>${c.county}, ${c.state}</strong><br/>Poverty: ${c.poverty_pct}% | Diabetes: ${c.diabetes}% | Obesity: ${c.obesity}%</p>`).join('')}`;
    const element = document.createElement('div');
    element.innerHTML = html;
    html2pdf().set({margin:10, filename:'county-comparison.pdf'}).from(element).save();
}
