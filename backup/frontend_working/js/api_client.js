const API_URL = 'http://localhost:5000/api';

async function fetchCounties(limit = 10) {
    try {
        const response = await fetch(`${API_URL}/counties?limit=${limit}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching counties:', error);
        return null;
    }
}

async function searchCounty(query) {
    try {
        const response = await fetch(`${API_URL}/counties/search?q=${query}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching:', error);
        return null;
    }
}

async function getCountyByFIPS(fips) {
    try {
        const response = await fetch(`${API_URL}/counties/${fips}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching county:', error);
        return null;
    }
}
