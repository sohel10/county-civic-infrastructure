const API_URL = 'http://127.0.0.1:5005/api';
let comparisonChart = null;

async function loadStates() {
    try {
        const response = await fetch(`${API_URL}/states`);
        const result = await response.json();
        const select = document.getElementById('stateSelect');
        result.data.forEach(state => {
            const option = document.createElement('option');
            option.value = state.state_name;
            option.textContent = `${state.state_name} (${state.county_count})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadByState() {
    const state = document.getElementById('stateSelect').value;
    if (!state) { alert('Select a state'); return; }
    try {
        const response = await fetch(`${API_URL}/counties?state=${encodeURIComponent(state)}`);
        const result = await response.json();
        document.getElementById('stats').innerHTML = `<p>✅ ${result.count} counties in ${state}</p>`;
        displayCounties(result.data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadCounties() {
    try {
        const response = await fetch(`${API_URL}/counties?limit=100`);
        const result = await response.json();
        document.getElementById('stats').innerHTML = `<p>Showing ${result.count} of ${result.total} counties</p>`;
        displayCounties(result.data);
    } catch (error) {
        document.getElementById('results').innerHTML = '<p>Error loading data</p>';
    }
}

function displayCounties(counties) {
    if (!counties || counties.length === 0) {
        document.getElementById('results').innerHTML = '<p>No counties found</p>';
        return;
    }
    let html = '<table><tr><th>Select</th><th>County</th><th>State</th><th>Poverty %</th><th>Health</th></tr>';
    counties.forEach(c => {
        const color = c.health_score > 70 ? '#27ae60' : '#e74c3c';
        html += `<tr><td><input type="checkbox" value="${c.fips}" class="county-select"></td><td>${c.county_name}</td><td>${c.state_name}</td><td>${c.poverty_rate}%</td><td style="color:${color}">${c.health_score}</td></tr>`;
    });
    html += '</table>';
    document.getElementById('results').innerHTML = html;
}

async function compareSelected() {
    const checked = document.querySelectorAll('.county-select:checked');
    if (checked.length < 2) { alert('Select 2+ counties'); return; }
    
    const fips = Array.from(checked).map(c => c.value).join(',');
    try {
        const response = await fetch(`${API_URL}/compare?fips=${fips}`);
        const result = await response.json();
        displayChart(result.data);
    } catch (error) {
        console.error('Error:', error);
        alert('Error comparing');
    }
}

function displayChart(counties) {
    const names = counties.map(c => c.county_name);
    const poverty = counties.map(c => parseFloat(c.poverty_rate));
    const health = counties.map(c => parseFloat(c.health_score));
    
    document.getElementById('chartContainer').style.display = 'block';
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [
                {
                    label: 'Poverty Rate (%)',
                    data: poverty,
                    backgroundColor: '#e74c3c',
                    yAxisID: 'y'
                },
                {
                    label: 'Health Score',
                    data: health,
                    backgroundColor: '#27ae60',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Poverty Rate (%)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Health Score' }
                }
            }
        }
    });
}

window.onload = loadStates;
