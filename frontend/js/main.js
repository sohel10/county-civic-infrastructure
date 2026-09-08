const API_URL = 'http://localhost:5005/api';
let allCounties = [];
let filteredCounties = [];
let selectedCounties = [];
let comparisonChart = null;

window.onload = () => {
    loadStates();
    setupGlobalSearch();
};

// FEATURE 1: Global Search
function setupGlobalSearch() {
    const input = document.getElementById('globalSearchInput');
    if (!input) return;
    let timeout;
    input.addEventListener('input', function() {
        clearTimeout(timeout);
        const query = this.value.trim();
        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('searchResults').style.display = 'none';
            return;
        }
        timeout = setTimeout(() => {
            fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(result => displaySearchResults(result.data));
        }, 300);
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.global-search-wrapper')) {
            document.getElementById('searchResults').style.display = 'none';
        }
    });
}

function displaySearchResults(counties) {
    const container = document.getElementById('searchResults');
    if (!counties || counties.length === 0) {
        container.innerHTML = '<div style="padding:10px;">No counties found</div>';
        container.style.display = 'block';
        return;
    }
    let html = '';
    counties.forEach(c => {
        const isSelected = selectedCounties.some(s => s.fips === c.fips);
        html += `<div class="search-item ${isSelected ? 'selected' : ''}" onclick="addToComparison(${c.fips}, '${c.county}', '${c.state}', ${c.poverty_pct}, ${c.diabetes}, ${c.obesity}, ${c.bphigh}, ${c.depression})">
            <strong>${c.county}, ${c.state}</strong><br/>
            Poverty: ${c.poverty_pct}% | Diabetes: ${c.diabetes}% | Obesity: ${c.obesity}%
            <span style="float:right; background:#3498db; color:white; padding:3px 8px; border-radius:3px; font-size:12px;">${isSelected ? '✓ Selected' : '+ Add'}</span>
        </div>`;
    });
    container.innerHTML = html;
    container.style.display = 'block';
}

function addToComparison(fips, county, state, pov, diab, obes, bp, dep) {
    if (selectedCounties.some(c => c.fips === fips)) return;
    if (selectedCounties.length >= 6) { alert('Max 6 counties'); return; }
    selectedCounties.push({ fips, county, state, poverty_pct: pov, diabetes: diab, obesity: obes, bphigh: bp, depression: dep });
    updateComparisonPanel();
}

function removeFromComparison(fips) {
    selectedCounties = selectedCounties.filter(c => c.fips !== fips);
    updateComparisonPanel();
}

function updateComparisonPanel() {
    const panel = document.getElementById('comparePanel');
    if (selectedCounties.length === 0) { panel.style.display = 'none'; return; }
    let html = '<h3>Selected for Comparison:</h3><div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;">';
    selectedCounties.forEach(c => {
        html += `<div style="background:#3498db; color:white; padding:8px 12px; border-radius:6px; display:flex; align-items:center; gap:6px;">
            ${c.county}, ${c.state}
            <button onclick="removeFromComparison(${c.fips})" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold;">&times;</button>
        </div>`;
    });
    html += '</div>';
    if (selectedCounties.length >= 2) {
        html += '<button onclick="runComparison()" style="background:#27ae60; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;">📊 Compare Charts</button>';
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

// FEATURE 3: Color-coded health
function getColorClass(metric, value) {
    if (metric === 'poverty') {
        return value < 10 ? '#27ae60' : value < 20 ? '#f39c12' : '#e74c3c';
    } else if (metric === 'diabetes') {
        return value < 8 ? '#27ae60' : value < 12 ? '#f39c12' : '#e74c3c';
    } else if (metric === 'obesity') {
        return value < 30 ? '#27ae60' : value < 40 ? '#f39c12' : '#e74c3c';
    }
    return '#95a5a6';
}

function displayCounties(counties) {
    let html = '<table><thead><tr style="background:#34495e; color:white;"><th>County, State</th><th style="text-align:center;">Poverty %</th><th style="text-align:center;">Diabetes %</th><th style="text-align:center;">Obesity %</th></tr></thead><tbody>';
    counties.forEach(c => {
        const povColor = getColorClass('poverty', c.poverty_pct);
        const diabColor = getColorClass('diabetes', c.diabetes);
        const obesColor = getColorClass('obesity', c.obesity);
        html += `<tr style="cursor:pointer;" onclick="addToComparison(${c.fips}, '${c.county}', '${c.state}', ${c.poverty_pct}, ${c.diabetes}, ${c.obesity}, ${c.bphigh}, ${c.depression})">
            <td><strong>${c.county}</strong>, ${c.state}</td>
            <td style="text-align:center; background-color:${povColor}; color:white; font-weight:bold;">${c.poverty_pct}%</td>
            <td style="text-align:center; background-color:${diabColor}; color:white; font-weight:bold;">${c.diabetes}%</td>
            <td style="text-align:center; background-color:${obesColor}; color:white; font-weight:bold;">${c.obesity}%</td>
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

// FEATURE 1: Comparison Charts
function runComparison() {
    if (selectedCounties.length < 2) { alert('Select 2+ counties'); return; }
    displayComparisonChart();
}

function displayComparisonChart() {
    const labels = selectedCounties.map(c => `${c.county}, ${c.state.substring(0, 2)}`);
    const povData = selectedCounties.map(c => c.poverty_pct);
    const diabData = selectedCounties.map(c => c.diabetes);
    const obesData = selectedCounties.map(c => c.obesity);
    
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) {
        let container = document.getElementById('chartContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'chartContainer';
            container.style.marginTop = '30px';
            document.querySelector('.content-wrapper').appendChild(container);
        }
        container.innerHTML = '<h3>📊 Comparison Chart</h3><canvas id="comparisonChart" style="max-height:300px;"></canvas>';
    }
    
    if (comparisonChart) comparisonChart.destroy();
    comparisonChart = new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Poverty %', data: povData, backgroundColor: '#e74c3c' },
                { label: 'Diabetes %', data: diabData, backgroundColor: '#f39c12' },
                { label: 'Obesity %', data: obesData, backgroundColor: '#3498db' }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 50 } } }
    });
}

// FEATURE 4: Export PDF
function exportComparison() {
    if (selectedCounties.length === 0) { alert('Select counties first'); return; }
    const html = `<h2>County Comparison Report</h2><p>${new Date().toLocaleString()}</p>
        ${selectedCounties.map(c => `<p><strong>${c.county}, ${c.state}</strong><br/>
        Poverty: ${c.poverty_pct}% | Diabetes: ${c.diabetes}% | Obesity: ${c.obesity}% | High BP: ${c.bphigh}% | Depression: ${c.depression}%</p>`).join('')}`;
    const element = document.createElement('div');
    element.innerHTML = html;
    html2pdf().set({margin:10, filename:'county-comparison.pdf'}).from(element).save();
}
