function createChart(data, chartType = 'bar') {
    console.log('Creating chart with data:', data);
    // Chart.js or Plotly.js code goes here
}

function displayHealthScore(county) {
    const score = county.health_score || 0;
    const color = score > 70 ? 'green' : score > 50 ? 'orange' : 'red';
    return `<div style="color: ${color}; font-size: 18px;">Health Score: ${score}</div>`;
}

function compareCounties(counties) {
    console.log('Comparing counties:', counties);
    // Comparison logic here
}
