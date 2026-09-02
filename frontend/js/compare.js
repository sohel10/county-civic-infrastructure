async function compareSelected() {
    const checked = document.querySelectorAll('.county-select:checked');
    if (checked.length < 2) return;
    
    const fips = Array.from(checked).map(c => c.value).join(',');
    try {
        const response = await fetch(`${API_URL}/compare?fips=${fips}`);
        const result = await response.json();
        displayChart(result.data);
        displayInsightCard(result.data);  // ADD THIS LINE
    } catch (error) {
        console.error('Error:', error);
    }
}
