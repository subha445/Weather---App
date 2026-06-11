const input = document.querySelector('input');
const button = document.querySelector('button');
const resultDiv = document.getElementById('weather-result');

button.addEventListener('click', getWeather);

async function getWeather() {
    const city = input.value.trim();
    
    if(city === "") {
        resultDiv.innerHTML = "<p style='color:red'>❌ City name type pannu da</p>";
        return;
    }

    resultDiv.innerHTML = "<p>⏳ Loading...</p>";

    try {
        const url = `https://wttr.in/${city}?format=j1`;
        const response = await fetch(url);
        const data = await response.json();

        const current = data.current_condition[0];
        const location = data.nearest_area[0];

        const city_name = location.areaName[0].value;
        const country = location.country[0].value;
        const temp_c = current.temp_C;
        const feels_like = current.FeelsLikeC;
        const humidity = current.humidity;
        const condition = current.weatherDesc[0].value;

        resultDiv.innerHTML = `
            <div style="border:2px solid #4CAF50; padding:20px; border-radius:10px; margin-top:20px">
                <h2>☀️ WEATHER REPORT: ${city_name}, ${country}</h2>
                <p>🌡️ Temperature: ${temp_c}°C</p>
                <p>🤒 Feels Like: ${feels_like}°C</p>
                <p>💧 Humidity: ${humidity}%</p>
                <p>⛅ Condition: ${condition}</p>
            </div>
        `;

    } catch (error) {
        resultDiv.innerHTML = `<p style='color:red'>❌ Error: '${city}' city kedakala da. Spelling check pannu</p>`;
    }
}

input.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') {
        getWeather();
    }
});
