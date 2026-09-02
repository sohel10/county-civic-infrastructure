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
        });
}

// CLEANED: ONLY Show Select, County, State, Income, Health
function displayCounties(counties) {
    let html = `<table><thead><tr style="background:#34495e; color:white;"><th style="text-align:center; width:50px;">Select</th><th>County</th><th>State</th><th style="text-align:center;">Income</th><th style="text-align:center;">Health</th></tr></thead><tbody>`;

    counties.forEach(c => {
        html += `<tr><td style="text-align:center;"><input type="checkbox" class="county-select" value="${c.fips}" onchange="autoCompare()"></td><td>${c.county_name}</td><td>${c.state_name}</td><td style="text-align:center;">$${Number(c.median_income).toLocaleString()}</td><td style="text-align:center; color:#e74c3c; font-weight:bold;">${c.health_score}</td></tr>`;
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
}

// FEATURE 2: Summary Stats - ONLY Income & Health
function updateSummaryStats(counties) {
    if (counties.length === 0) return;

    const avgHealth = (counties.reduce((sum, c) => sum + c.health_score, 0) / counties.length).toFixed(1);
    const avgIncome = Math.round(counties.reduce((sum, c) => sum + c.median_income, 0) / counties.length);

    document.getElementById('totalCounties').textContent = counties.length;
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
            displayDisparityAnalysis(result.data);
        });
}

// CHART 1: Income vs Health
function displayChart1(counties) {
    const labels = counties.map(c => c.county_name);
    const income = counties.map(c => c.median_income / 1000);
    const health = counties.map(c => c.health_score);

    const ctx = document.getElementById('comparisonChart1');
    if (!ctx) return;
    if (comparisonChart1) comparisonChart1.destroy();

    comparisonChart1 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Income ($1000s)', data: income, backgroundColor: '#f39c12', yAxisID: 'y' },
                { label: 'Health Score', data: health, backgroundColor: '#27ae60', yAxisID: 'y1' }
            ]
        },
        options: { 
            responsive: true, 
            scales: { 
                y: { position: 'left', title: { display: true, text: 'Income ($1000s)' } }, 
                y1: { position: 'right', title: { display: true, text: 'Health Score' } } 
            } 
        }
    });

    document.getElementById('chartContainer1').style.display = 'block';
}

// CHART 2: Health Trend by County
function displayChart2(counties) {
    const labels = counties.map(c => c.county_name);
    const health = counties.map(c => c.health_score);

    const ctx = document.getElementById('comparisonChart2');
    if (!ctx) return;
    if (comparisonChart2) comparisonChart2.destroy();

    comparisonChart2 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Health Score', data: health, borderColor: '#27ae60', backgroundColor: 'rgba(39, 174, 96, 0.1)', borderWidth: 2, fill: true }
            ]
        },
        options: { 
            responsive: true, 
            scales: { 
                y: { title: { display: true, text: 'Health Score' } } 
            } 
        }
    });

    document.getElementById('chartContainer2').style.display = 'block';
}

// FEATURE 3: Health Disparity Analysis - REAL DATA ONLY
function displayDisparityAnalysis(counties) {
    if (counties.length < 2) return;

    // Sort by income to find disparity
    const sorted = [...counties].sort((a, b) => a.median_income - b.median_income);
    const highest = sorted[sorted.length - 1];
    const lowest = sorted[0];

    const incomeGap = highest.median_income - lowest.median_income;
    const healthGap = Math.abs(highest.health_score - lowest.health_score);

    const html = `
        <div style="padding: 20px; background: linear-gradient(135deg, #f39c12, #e67e22); border-radius: 8px; color: white; margin-top: 20px;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px;">🔍 Health Disparity Analysis</h3>
            <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 8px 0; font-size: 16px;"><strong>${highest.county_name}</strong> vs <strong>${lowest.county_name}</strong></p>
            </div>
            <div style="font-size: 14px; line-height: 1.8;">
                <p style="margin: 8px 0;">💰 <strong>Income Gap:</strong> $${incomeGap.toLocaleString()}</p>
                <p style="margin: 8px 0;">❤️ <strong>Health Gap:</strong> ${healthGap.toFixed(1)} points</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-top: 15px; font-size: 13px; font-style: italic;">
                ⚠️ ${highest.county_name} shows ${incomeGap > 20000 ? 'significant' : 'notable'} socioeconomic health disparities requiring targeted intervention and resources.
            </div>
        </div>
    `;

    // Find or create container for disparity analysis
    let container = document.getElementById('disparityContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'disparityContainer';
        document.querySelector('.charts-panel').appendChild(container);
    }
    container.innerHTML = html;
    container.style.display = 'block';
}

// FEATURE 6: Export Button - ONLY Real Data
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
                        <p><strong>Median Income:</strong> $${Number(c.median_income).toLocaleString()}</p>
                        <p><strong>Health Score:</strong> ${c.health_score}</p>
                    </div>
                `).join('')}
                <p style="margin-top: 30px; font-size: 12px; color: #666;">Data: 2023 US Census Bureau (Income) + 2023 CDC PLACES (Health)</p>
                <p style="font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
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
