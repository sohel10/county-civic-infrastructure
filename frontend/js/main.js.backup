const API_URL = 'http://127.0.0.1:5005/api';
let comparisonChart1 = null;
let comparisonChart2 = null;
let allCounties = [];
let filteredCounties = [];

window.onload = loadStates;

function loadStates() {
    fetch(`${API_URL}/states`)
        .then(res => res.json())
        .then(result => {
            const select = document.getElementById('stateSelect');
            select.innerHTML = '<option value="">-- Select State --</option>';
            result.data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.state_name;
                opt.textContent = `${item.state_name} (${item.county_count})`;
                select.appendChild(opt);
            });
        });
}

function loadByState() {
    const state = document.getElementById('stateSelect').value;
    if (!state) { alert('Select a state'); return; }
    fetch(`${API_URL}/counties?state=${encodeURIComponent(state)}`)
        .then(res => res.json())
        .then(result => {
            allCounties = result.data;
            filteredCounties = [...allCounties];
            displayCounties(filteredCounties);
            updateSummaryStats(filteredCounties);
            document.getElementById('dataSources').style.display = 'block';
        });
}

function loadCounties() {
    fetch(`${API_URL}/counties?limit=3142`)
        .then(res => res.json())
        .then(result => {
            allCounties = result.data;
            filteredCounties = [...allCounties];
            displayCounties(filteredCounties);
            updateSummaryStats(filteredCounties);
            document.getElementById('dataSources').style.display = 'block';
        });
}

function displayCounties(counties) {
    let html = `<table><thead><tr style="background:#34495e; color:white;"><th style="text-align:center; width:50px;">Select</th><th>County</th><th>State</th><th style="text-align:center;">Poverty %</th><th style="text-align:center;">Education %</th><th style="text-align:center;">Income</th><th style="text-align:center;">Health</th></tr></thead><tbody>`;
    
    counties.forEach(c => {
        html += `<tr><td style="text-align:center;"><input type="checkbox" class="county-select" value="${c.fips}" onchange="autoCompare()"></td><td>${c.county_name}</td><td>${c.state_name}</td><td style="text-align:center;">${c.poverty_rate}%</td><td style="text-align:center;">${c.college_educated_pct}%</td><td style="text-align:center;">$${Number(c.median_income).toLocaleString()}</td><td style="text-align:center; color:#e74c3c; font-weight:bold;">${c.health_score}</td></tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('results').innerHTML = html;
}

// FEATURE 1: Search Box
function searchCounty() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) { filteredCounties = [...allCounties]; displayCounties(filteredCounties); return; }
    
    filteredCounties = allCounties.filter(c => c.county_name.toLowerCase().includes(query) || c.state_name.toLowerCase().includes(query));
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    filteredCounties = [...allCounties];
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
    resetFilters();
}

// FEATURE 5: Data Filters
function applyFilters() {
    const maxPoverty = parseFloat(document.getElementById('povertyFilter').value);
    const maxIncome = parseFloat(document.getElementById('incomeFilter').value);
    
    document.getElementById('povertyValue').textContent = `0-${maxPoverty}%`;
    document.getElementById('incomeValue').textContent = `$${(maxIncome/1000).toFixed(0)}K+`;
    
    filteredCounties = allCounties.filter(c => c.poverty_rate <= maxPoverty && c.median_income >= (maxIncome - 10000));
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
}

function resetFilters() {
    document.getElementById('povertyFilter').value = 50;
    document.getElementById('incomeFilter').value = 150000;
    document.getElementById('povertyValue').textContent = '0-50%';
    document.getElementById('incomeValue').textContent = '$30K-$150K';
    filteredCounties = [...allCounties];
    displayCounties(filteredCounties);
    updateSummaryStats(filteredCounties);
}

// FEATURE 2: Summary Stats
function updateSummaryStats(counties) {
    if (counties.length === 0) return;
    
    const avgPoverty = (counties.reduce((sum, c) => sum + c.poverty_rate, 0) / counties.length).toFixed(1);
    const avgHealth = (counties.reduce((sum, c) => sum + c.health_score, 0) / counties.length).toFixed(1);
    const avgIncome = Math.round(counties.reduce((sum, c) => sum + c.median_income, 0) / counties.length);
    
    document.getElementById('totalCounties').textContent = counties.length;
    document.getElementById('avgPoverty').textContent = avgPoverty + '%';
    document.getElementById('avgHealth').textContent = avgHealth;
    document.getElementById('avgIncome').textContent = '$' + avgIncome.toLocaleString();
    document.getElementById('summaryStats').style.display = 'grid';
}

function autoCompare() {
    const checked = document.querySelectorAll('.county-select:checked');
    if (checked.length >= 2) {
        compareSelected();
    }
}

function compareSelected() {
    const checked = document.querySelectorAll('.county-select:checked');
    if (checked.length < 2) return;
    
    const fips = Array.from(checked).map(c => c.value).join(',');
    fetch(`${API_URL}/compare?fips=${fips}`)
        .then(res => res.json())
        .then(result => {
            displayChart1(result.data);
            displayChart2(result.data);
            displayInsightCard(result.data);
        });
}

function displayChart1(counties) {
    const labels = counties.map(c => c.county_name);
    const poverty = counties.map(c => c.poverty_rate);
    const health = counties.map(c => c.health_score);
    
    const ctx = document.getElementById('comparisonChart1');
    if (!ctx) return;
    if (comparisonChart1) comparisonChart1.destroy();
    
    comparisonChart1 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Poverty Rate (%)', data: poverty, backgroundColor: '#e74c3c', yAxisID: 'y' },
                { label: 'Health Score', data: health, backgroundColor: '#27ae60', yAxisID: 'y1' }
            ]
        },
        options: { responsive: true, scales: { y: { position: 'left' }, y1: { position: 'right' } } }
    });
    
    document.getElementById('chartContainer1').style.display = 'block';
}

function displayChart2(counties) {
    const labels = counties.map(c => c.county_name);
    const education = counties.map(c => c.college_educated_pct);
    const income = counties.map(c => c.median_income / 1000);
    
    const ctx = document.getElementById('comparisonChart2');
    if (!ctx) return;
    if (comparisonChart2) comparisonChart2.destroy();
    
    comparisonChart2 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Education (%)', data: education, backgroundColor: '#3498db', yAxisID: 'y' },
                { label: 'Income ($1000s)', data: income, backgroundColor: '#f39c12', yAxisID: 'y1' }
            ]
        },
        options: { responsive: true, scales: { y: { position: 'left' }, y1: { position: 'right' } } }
    });
    
    document.getElementById('chartContainer2').style.display = 'block';
}

// FEATURE 3: Better Disparity Card
function displayInsightCard(counties) {
    if (counties.length < 2) return;
    
    const sorted = [...counties].sort((a, b) => a.poverty_rate - b.poverty_rate);
    const highest = sorted[sorted.length - 1];
    const lowest = sorted[0];
    
    const html = `
        <div class="insight-item"><strong>${highest.county_name}</strong> vs <strong>${lowest.county_name}</strong></div>
        <div class="insight-item">Poverty: <strong>${(highest.poverty_rate - lowest.poverty_rate).toFixed(1)}%</strong> gap</div>
        <div class="insight-item">Health: <strong>${Math.abs(highest.health_score - lowest.health_score).toFixed(1)}</strong> points difference</div>
        <div class="insight-item">Income: <strong>$${(highest.median_income - lowest.median_income).toLocaleString()}</strong> gap</div>
        <div class="insight-item">Education: <strong>${(highest.college_educated_pct - lowest.college_educated_pct).toFixed(1)}%</strong> gap</div>
        <div class="insight-warning">⚠️ ${highest.county_name} shows significant health equity challenges requiring targeted intervention</div>
    `;
    
    document.getElementById('insightContent').innerHTML = html;
    document.getElementById('insightCard').style.display = 'block';
}

// FEATURE 6: Export Button
function exportComparison() {
    const checked = document.querySelectorAll('.county-select:checked');
    if (checked.length < 2) { alert('Select 2+ counties to export'); return; }
    
    const fips = Array.from(checked).map(c => c.value).join(',');
    fetch(`${API_URL}/compare?fips=${fips}`)
        .then(res => res.json())
        .then(result => {
            const element = document.createElement('div');
            element.innerHTML = `
                <h2>County Health Comparison Report</h2>
                <h3>Compared Counties:</h3>
                ${result.data.map(c => `
                    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
                        <h4>${c.county_name}, ${c.state_name}</h4>
                        <p><strong>FIPS Code:</strong> ${c.fips}</p>
                        <p><strong>Poverty Rate:</strong> ${c.poverty_rate}%</p>
                        <p><strong>College Education:</strong> ${c.college_educated_pct}%</p>
                        <p><strong>Median Income:</strong> $${Number(c.median_income).toLocaleString()}</p>
                        <p><strong>Health Score:</strong> ${c.health_score}</p>
                    </div>
                `).join('')}
                <p style="margin-top: 30px; font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
            `;
            
            const opt = {
                margin: 10,
                filename: 'county-comparison-report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };
            
            html2pdf().set(opt).from(element).save();
        });
}
