
// =============================================
// ⚡ NEON WEATHER - COMPLETE ADVANCED VERSION
// API: Open-Meteo | No API Key Required
// =============================================

let weatherData = null;
let currentCity = "";
let isCelsius = true;
let isLightMode = false;

// =============================================
// 1. HTML ELEMENTS
// =============================================

const cityInput = document.getElementById("cityInput");
const statusText = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

// =============================================
// 2. EXTRA FEATURES - ADD BUTTONS
// =============================================

function createControls() {

    const controls = document.createElement("div");

    controls.id = "extraControls";

    controls.innerHTML = `
        <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin:15px 0;
        ">
            <button onclick="toggleUnit()" id="unitBtn">
                °C / °F
            </button>

            <button onclick="toggleTheme()" id="themeBtn">
                ☀️ Light Mode
            </button>

            <button onclick="refreshWeather()">
                🔄 Refresh
            </button>

            <button onclick="saveFavorite()">
                ⭐ Favourite
            </button>
        </div>
    `;

    statusText.insertAdjacentElement("afterend", controls);
}

// =============================================
// 3. WEATHER CODE TO ICON AND DESCRIPTION
// =============================================

function getWeatherInfo(code, isDay = 1) {

    const weatherCodes = {

        0: ["Clear Sky", isDay ? "☀️" : "🌙"],
        1: ["Mainly Clear", isDay ? "🌤️" : "🌙"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Depositing Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Moderate Drizzle", "🌦️"],
        55: ["Dense Drizzle", "🌧️"],
        56: ["Freezing Drizzle", "🌧️"],
        57: ["Heavy Freezing Drizzle", "🌧️"],
        61: ["Slight Rain", "🌦️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        66: ["Freezing Rain", "🌧️"],
        67: ["Heavy Freezing Rain", "🌧️"],
        71: ["Slight Snow", "🌨️"],
        73: ["Moderate Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        77: ["Snow Grains", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Violent Showers", "⛈️"],
        85: ["Snow Showers", "🌨️"],
        86: ["Heavy Snow Showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]

    };

    return weatherCodes[code] || ["Unknown", "🌡️"];
}

// =============================================
// 4. SAFE TEXT HELPER
// =============================================

function safeText(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}

// =============================================
// 5. CITY SEARCH
// =============================================

async function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        showStatus("❌ Please enter a city name!");
        return;
    }

    showStatus("⏳ Searching city...");

    try {

        const url =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to search city.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("City not found! Check spelling.");
        }

        const place = data.results[0];

        const name = [
            place.name,
            place.admin1,
            place.country
        ].filter(Boolean).join(", ");

        await loadWeather(
            place.latitude,
            place.longitude,
            name
        );

    } catch (error) {

        showStatus("❌ " + error.message);

    }
}

// =============================================
// 6. FETCH WEATHER DATA
// =============================================

async function loadWeather(lat, lon, cityName) {

    showStatus("⏳ Loading live weather...");

    try {

        const current = [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "weather_code",
            "cloud_cover",
            "pressure_msl",
            "wind_speed_10m",
            "wind_direction_10m",
            "visibility",
            "uv_index"
        ].join(",");

        const hourly = [
            "temperature_2m",
            "weather_code",
            "precipitation_probability",
            "wind_speed_10m"
        ].join(",");

        const daily = [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "sunrise",
            "sunset",
            "uv_index_max",
            "precipitation_probability_max",
            "precipitation_sum"
        ].join(",");

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${current}&hourly=${hourly}&daily=${daily}&forecast_days=7&timezone=auto`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather service unavailable.");
        }

        const data = await response.json();

        if (!data.current || !data.daily || !data.hourly) {
            throw new Error("Weather information unavailable.");
        }

        weatherData = data;
        currentCity = cityName;

        displayWeather();

        saveRecent(cityName);

        showStatus("✨ Weather updated successfully!");

    } catch (error) {

        showStatus("❌ " + error.message);

    }

}

// =============================================
// 7. DISPLAY CURRENT WEATHER
// =============================================

function displayWeather() {

    if (!weatherData) return;

    const current = weatherData.current;

    const temp = convertTemperature(current.temperature_2m);

    const feels = convertTemperature(current.apparent_temperature);

    const info = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    weatherContent.classList.remove("hidden");

    document.getElementById("cityName").textContent = currentCity;

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    document.getElementById("weatherIcon").textContent = info[1];

    document.getElementById("temperature").textContent = temp;

    document.querySelector(".feels").innerHTML =
        `Feels like <span id="feels">${feels}</span>°${isCelsius ? "C" : "F"}`;

    document.getElementById("condition").textContent = info[0];

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("pressure").textContent =
        current.pressure_msl + " hPa";

    document.getElementById("cloud").textContent =
        current.cloud_cover + "%";

    // Additional weather details

    const details = document.querySelector(".details");

    details.innerHTML = `
        <div class="detail">
            <p>💧 Humidity</p>
            <h3>${current.relative_humidity_2m}%</h3>
        </div>

        <div class="detail">
            <p>💨 Wind Speed</p>
            <h3>${current.wind_speed_10m} km/h</h3>
        </div>

        <div class="detail">
            <p>🌡️ Pressure</p>
            <h3>${current.pressure_msl} hPa</h3>
        </div>

        <div class="detail">
            <p>☁️ Cloud Cover</p>
            <h3>${current.cloud_cover}%</h3>
        </div>

        <div class="detail">
            <p>☀️ UV Index</p>
            <h3>${current.uv_index ?? "--"}</h3>
        </div>

        <div class="detail">
            <p>👁️ Visibility</p>
            <h3>${current.visibility != null
                ? (current.visibility / 1000).toFixed(1) + " km"
                : "--"}</h3>
        </div>

        <div class="detail">
            <p>🌧️ Precipitation</p>
            <h3>${current.precipitation} mm</h3>
        </div>

        <div class="detail">
            <p>🧭 Wind Direction</p>
            <h3>${getWindDirection(current.wind_direction_10m)}</h3>
        </div>
    `;

    displayHourly();
    displayDaily();
    displaySun();

}

// =============================================
// 8. TEMPERATURE CONVERSION
// =============================================

function convertTemperature(temp) {

    if (isCelsius) {
        return Math.round(temp);
    }

    return Math.round((temp * 9 / 5) + 32);

}

// =============================================
// 9. °C / °F TOGGLE
// =============================================

function toggleUnit() {

    isCelsius = !isCelsius;

    document.getElementById("unitBtn").textContent =
        isCelsius ? "°C / °F" : "°F / °C";

    if (weatherData) {
        displayWeather();
    }

}

// =============================================
// 10. HOURLY FORECAST
// =============================================

function displayHourly() {

    const hourly = weatherData.hourly;

    const container = document.getElementById("hourly");

    const now = new Date(weatherData.current.time)
        .getTime();

    const startIndex = hourly.time.findIndex(time =>
        new Date(time).getTime() >= now
    );

    const start = Math.max(0, startIndex);

    const hours = hourly.time.slice(start, start + 8);

    container.innerHTML = hours.map((time, index) => {

        const i = start + index;

        const info = getWeatherInfo(hourly.weather_code[i]);

        const hour = new Date(time).toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                hour12: true
            }
        );

        const temp = convertTemperature(
            hourly.temperature_2m[i]
        );

        return `
            <div class="forecast-item">
                <p>${hour}</p>
                <span>${info[1]}</span>
                <h3>${temp}°${isCelsius ? "C" : "F"}</h3>
                <p>🌧️ ${hourly.precipitation_probability[i] ?? 0}%</p>
            </div>
        `;

    }).join("");

}

// =============================================
// 11. 7-DAY FORECAST
// =============================================

function displayDaily() {

    const daily = weatherData.daily;

    const container = document.getElementById("daily");

    container.innerHTML = daily.time.map((date, index) => {

        const info = getWeatherInfo(daily.weather_code[index]);

        const day = new Date(date + "T12:00:00")
            .toLocaleDateString("en-IN", {
                weekday: "long"
            });

        const max = convertTemperature(
            daily.temperature_2m_max[index]
        );

        const min = convertTemperature(
            daily.temperature_2m_min[index]
        );

        const rain = daily.precipitation_probability_max[index];

        return `
            <div class="day-row">

                <span class="day-icon">${info[1]}</span>

                <span class="day-name">${day}</span>

                <span class="temps">
                    ${max}° / ${min}° ${isCelsius ? "C" : "F"}
                </span>

                <span style="margin-left:8px">
                    💧 ${rain ?? 0}%
                </span>

            </div>
        `;

    }).join("");

}

// =============================================
// 12. SUNRISE AND SUNSET
// =============================================

function displaySun() {

    const daily = weatherData.daily;

    document.getElementById("sunrise").textContent =
        formatTime(daily.sunrise[0]);

    document.getElementById("sunset").textContent =
        formatTime(daily.sunset[0]);

}

function formatTime(date) {

    return new Date(date).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}

// =============================================
// 13. WIND DIRECTION
// =============================================

function getWindDirection(degree) {

    const directions = [
        "N", "NE", "E", "SE",
        "S", "SW", "W", "NW"
    ];

    return directions[
        Math.round(degree / 45) % 8
    ];

}

// =============================================
// 14. CURRENT LOCATION
// =============================================

function useLocation() {

    if (!navigator.geolocation) {

        showStatus("❌ Location is not supported!");

        return;
    }

    showStatus("📍 Getting your location...");

    navigator.geolocation.getCurrentPosition(

        position => {

            const lat = position.coords.latitude;

            const lon = position.coords.longitude;

            loadWeather(lat, lon, "My Location");

        },

        error => {

            if (error.code === 1) {
                showStatus("❌ Please allow location permission.");
            } else {
                showStatus("❌ Unable to get your location.");
            }

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}

// =============================================
// 15. RECENT SEARCHES
// =============================================

function saveRecent(city) {

    let recent = getStored("neonRecent");

    recent = recent.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    recent.unshift(city);

    recent = recent.slice(0, 5);

    setStored("neonRecent", recent);

    displayRecent();

}

function displayRecent() {

    const container = document.getElementById("recent");

    const recent = getStored("neonRecent");

    if (!recent.length) {

        container.innerHTML = "<p>No recent searches yet.</p>";

        return;
    }

    container.innerHTML = recent.map(city => `
        <button
            onclick="searchSavedCity('${safeText(city).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">
            ${safeText(city)}
        </button>
    `).join("");

}

function searchSavedCity(city) {

    cityInput.value = city;

    searchWeather();

}

// =============================================
// 16. FAVOURITE CITIES
// =============================================

function saveFavorite() {

    if (!currentCity) {

        showStatus("Search a city first!");

        return;
    }

    let favorites = getStored("neonFavorites");

    if (favorites.some(city =>
        city.toLowerCase() === currentCity.toLowerCase()
    )) {

        showStatus("⭐ Already in favourites!");

        return;
    }

    favorites.push(currentCity);

    setStored("neonFavorites", favorites);

    displayFavorites();

    showStatus("⭐ Added to favourites!");

}

function displayFavorites() {

    let container = document.getElementById("favorites");

    if (!container) {

        container = document.createElement("div");

        container.id = "favorites";
        container.className = "recent";

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h2 class="section-title">⭐ Favourite Cities</h2>
        `;

        card.appendChild(container);

        document.querySelector("footer")
            .before(card);

    }

    const favorites = getStored("neonFavorites");

    container.innerHTML = favorites.length
        ? favorites.map(city => `
            <button onclick="searchSavedCity('${safeText(city).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}')">
                ${safeText(city)}
            </button>
        `).join("")
        : "<p>No favourite cities yet.</p>";

}

// =============================================
// 17. DARK / LIGHT MODE
// =============================================

function toggleTheme() {

    isLightMode = !isLightMode;

    document.body.classList.toggle(
        "neon-light",
        isLightMode
    );

    document.getElementById("themeBtn").textContent =
        isLightMode ? "🌙 Dark Mode" : "☀️ Light Mode";

    setStored("neonTheme", isLightMode ? "light" : "dark");

}

// =============================================
// 18. THEME STYLES
// =============================================

function addThemeStyles() {

    const style = document.createElement("style");

    style.textContent = `
        body.neon-light {
            background: #eee8ff;
            color: #25163c;
        }

        body.neon-light .card {
            background: linear-gradient(145deg,#ffffff,#eee5ff);
            border-color: #b99ae5;
            box-shadow: 0 0 15px #c7b2ec;
        }

        body.neon-light .detail,
        body.neon-light .forecast-item,
        body.neon-light .day-row,
        body.neon-light .sun {
            background: #e7dcfa;
            border-color: #c5afe8;
        }

        body.neon-light .detail h3,
        body.neon-light .sun h3,
        body.neon-light .temperature {
            color: #45266d;
        }

        body.neon-light .section-title,
        body.neon-light .city {
            color: #7136bd;
        }

        body.neon-light input {
            background: white;
            color: #25163c;
        }

        body.neon-light .location-btn {
            background: #ded0f6;
            color: #45266d;
        }

        body.neon-light .recent button {
            background: #e4d6fa;
            color: #45266d;
        }

        button {
            transition: 0.2s ease;
        }

        button:hover {
            filter: brightness(1.15);
        }

        .forecast-item img {
            max-width: 100%;
        }
    `;

    document.head.appendChild(style);

}

// =============================================
// 19. REFRESH WEATHER
// =============================================

function refreshWeather() {

    if (!weatherData) {

        showStatus("Search a city first!");

        return;
    }

    loadWeather(
        weatherData.latitude,
        weatherData.longitude,
        currentCity
    );

}

// =============================================
// 20. LOCAL STORAGE HELPERS
// =============================================

function getStored(key) {

    try {

        const value = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(value) ? value : [];

    } catch {

        return [];

    }

}

function setStored(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn("Storage unavailable:", error);

    }

}

// =============================================
// 21. STATUS MESSAGE
// =============================================

function showStatus(message) {

    statusText.textContent = message;

}

// =============================================
// 22. ENTER KEY SEARCH
// =============================================

cityInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        searchWeather();

    }

});

// =============================================
// 23. START APP
// =============================================

createControls();

addThemeStyles();

displayRecent();

displayFavorites();

if (localStorage.getItem("neon
