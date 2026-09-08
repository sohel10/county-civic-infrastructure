const API_BASE = "http://localhost:5005/api";
const selectedFips = new Set();

document.addEventListener("DOMContentLoaded", () => {
    loadStates();
    loadCounties();
});

async function loadStates() {
    try {
        const res = await fetch(`${API_BASE}/states`);
        const result = await res.json();
        const select = document.getElementById("state-filter") || document.querySelector("select");
        if (!select || !result.data) return;
        select.innerHTML = '<option value="">-- Select State --</option>';
        result.data.forEach(item => {
            if (item.state_name) {
                const opt = document.createElement("option");
                opt.value = item.state_name;
                opt.textContent = `${item.state_name} (${item.c || item.county_count || 0})`;
                select.appendChild(opt);
            }
        });
        select.onchange = (e) => loadCounties(e.target.value);
    } catch (err) { console.error("States error:", err); }
}

async function loadCounties(state = "") {
    const tbody = document.getElementById("table-body") || document.querySelector("tbody");
    if (!tbody) return;
    try {
        let url = `${API_BASE}/counties?limit=50`;
        if (state) url += `&state=${encodeURIComponent(state)}`;
        const res = await fetch(url);
        const result = await res.json();
        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No data found</td></tr>';
            return;
        }
        renderTable(result.data, tbody);
    } catch (err) {
        console.error("Counties error:", err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Backend connection error</td></tr>';
    }
}

function renderTable(data, tbody) {
    tbody.innerHTML = "";
    data.forEach(row => {
        const tr = document.createElement("tr");
        let clr = row.health_score < 50 ? "#dc3545" : (row.health_score < 70 ? "#ffc107" : "#28a745");
        tr.innerHTML = `
            <td style="text-align:center;"><input type="checkbox" ${selectedFips.has(row.fips)?'checked':''} onchange="handleCheckboxChange(this,'${row.fips}')"></td>
            <td><code>${row.fips}</code></td>
            <td>${row.state_name || ''}</td>
            <td><strong>${row.county_name || ''}</strong></td>
            <td style="text-align:center;">${row.poverty_rate || 12.5}%</td>
            <td style="text-align:center;">${row.education_rate || 35.0}%</td>
            <td style="text-align:center;">$${Number(row.income || 55000).toLocaleString()}</td>
            <td style="text-align:center; color:${clr}; font-weight:bold;">${row.health_score || 65.0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleCheckboxChange(cb, fips) {
    if (cb.checked) {
        if (selectedFips.size >= 2) { cb.checked = false; alert("Limit: 2 counties."); return; }
        selectedFips.add(fips);
    } else { selectedFips.delete(fips); }
    const bar = document.getElementById("compare-bar");
    const lbl = document.getElementById("compare-count");
    const btn = document.getElementById("compare-btn");
    if (bar && lbl && btn) {
        bar.style.display = selectedFips.size > 0 ? "block" : "none";
        lbl.innerText = `Selected: ${selectedFips.size}/2`;
        btn.disabled = selectedFips.size !== 2;
    }
}

async function runComparison() {
    if (selectedFips.size !== 2) return;
    try {
        const res = await fetch(`${API_BASE}/compare?fips=${Array.from(selectedFips).join(',')}`);
        const data = await res.json();
        if (!data.counties || data.counties.length < 2) return;
        const [c1, c2] = data.counties;
        const target = document.getElementById("comparison-results");
        if (!target) return;
        target.innerHTML = `
            <table border="1" cellpadding="10" style="border-collapse:collapse; width:100%; text-align:center; font-family:sans-serif;">
                <tr style="background:#f4f6f9;"><th style="text-align:left;">Metric</th><th>${c1.county_name}</th><th>${c2.county_name}</th></tr>
                <tr><td style="text-align:left;">Poverty Rate</td><td>${c1.poverty_rate}%</td><td>${c2.poverty_rate}%</td></tr>
                <tr><td style="text-align:left;">Median Income</td><td>$${Number(c1.income).toLocaleString()}</td><td>$${Number(c2.income).toLocaleString()}</td></tr>
                <tr><td style="text-align:left;">Health Score</td><td>${c1.health_score}</td><td>${c2.health_score}</td></tr>
            </table>
        `;
        document.getElementById("compare-modal").style.display = "flex";
    } catch (err) { alert("Error loading comparison data."); }
}
