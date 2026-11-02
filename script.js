
/* =========================================
   ⚡ NEON WEATHER - COMPLETE WEATHER APP
   API: OPEN-METEO
   ========================================= */

let weatherData = null;
let currentCity = "";
let isCelsius = true;
let isLightMode = false;

// =========================================
// 1. HTML ELEMENTS
// =========================================

const cityInput = document.getElementById("cityInput");
const statusText = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

// =========================================
// 2. WEATHER ICONS
// =========================================

function getWeatherInfo(code, isDay = 1) {

    const icons = {
        0: ["Clear Sky", isDay ? "☀️" : "🌙"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Cloudy", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Foggy", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Drizzle", "🌦️"],
        55: ["Heavy Drizzle", "🌧️"],
        61: ["Light Rain", "🌦️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Heavy Showers", "🌧️"],
        82: ["Violent Showers", "⛈️"],
        85: ["Snow Showers", "🌨️"],
        86: ["Heavy Snow", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return icons[code] || ["Unknown Weather", "🌡️"];
}

// =========================================
// 3. EXTRA BUTTONS
// =========================================

function createControls() {

    if (document.getElementById("extraControls")) return;

    const controls = document.createElement("div");

    controls.id = "extraControls";

    controls.innerHTML = `
        <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin:15px 0;
        ">

            <button id="unitBtn">°C / °F</button>

            <button id="themeBtn">☀️ Light Mode</button>

            <button id="refreshBtn">🔄 Refresh</button>

            <button id="favoriteBtn">⭐ Favourite</button>

        </div>
    `;

    statusText.after(controls);

    document.getElementById("unitBtn")
        .addEventListener("click", toggleUnit);

    document.getElementById("themeBtn")
        .addEventListener("click", toggleTheme);

    document.getElementById("refreshBtn")
        .addEventListener("click", refreshWeather);

    document.getElementById("favoriteBtn")
        .addEventListener("click", saveFavorite);

}

// =========================================
// 4. SEARCH CITY
// =========================================

async function searchWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        showStatus("❌ Please enter a city name!");
        return;
    }

    showStatus("⏳ Searching for " + city + "...");

    try {

        const url =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("City search failed!");
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

// =========================================
// 5. LOAD WEATHER DATA
// =========================================

async function loadWeather(lat, lon, cityName) {

    showStatus("⏳ Loading weather data...");

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
            throw new Error("Weather service unavailable!");
        }

        const data = await response.json();

        if (!data.current || !data.daily || !data.hourly) {
            throw new Error("Weather data unavailable!");
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

// =========================================
// 6. DISPLAY CURRENT WEATHER
// =========================================

function displayWeather() {

    if (!weatherData) return;

    const c = weatherData.current;

    const info = getWeatherInfo(c.weather_code, c.is_day);

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

    document.getElementById("temperature").textContent =
        convertTemp(c.temperature_2m);

    document.getElementById("condition").textContent = info[0];

    document.querySelector(".feels").textContent =
        `Feels like ${convertTemp(c.apparent_temperature)}°${isCelsius ? "C" : "F"}`;

    displayDetails();
    displayHourly();
    displayDaily();
    displaySun();

}

// =========================================
// 7. WEATHER DETAILS
// =========================================

function displayDetails() {

    const c = weatherData.current;

    const details = [
        ["💧 Humidity", c.relative_humidity_2m + "%"],
        ["💨 Wind Speed", c.wind_speed_10m + " km/h"],
        ["🌡️ Pressure", c.pressure_msl + " hPa"],
        ["☁️ Cloud Cover", c.cloud_cover + "%"],
        ["☀️ UV Index", c.uv_index ?? "--"],
        ["👁️ Visibility", c.visibility != null
            ? (c.visibility / 1000).toFixed(1) + " km"
            : "--"],
        ["🌧️ Precipitation", c.precipitation + " mm"],
        ["🧭 Wind Direction", getWindDirection(c.wind_direction_10m)]
    ];

    document.querySelector(".details").innerHTML =
        details.map(item => `
            <div class="detail">
                <p>${item[0]}</p>
                <h3>${item[1]}</h3>
            </div>
        `).join("");

}

// =========================================
// 8. TEMPERATURE CONVERTER
// =========================================

function convertTemp(temp) {

    return isCelsius
        ? Math.round(temp)
        : Math.round(temp * 9 / 5 + 32);

}

// =========================================
// 9. TEMPERATURE TOGGLE
// =========================================

function toggleUnit() {

    isCelsius = !isCelsius;

    document.getElementById("unitBtn").textContent =
        isCelsius ? "°C / °F" : "°F / °C";

    if (weatherData) {
        displayWeather();
    }

}

// =========================================
// 10. HOURLY FORECAST
// =========================================

function displayHourly() {

    const h = weatherData.hourly;

    const container = document.getElementById("hourly");

    const now = weatherData.current.time;

    let start = h.time.findIndex(time => time >= now);

    if (start === -1) start = 0;

    const hours = h.time.slice(start, start + 8);

    container.innerHTML = hours.map((time, index) => {

        const i = start + index;

        const info = getWeatherInfo(h.weather_code[i]);

        const hour = time.substring(11, 16);

        return `
            <div class="forecast-item">

                <p>${hour}</p>

                <span>${info[1]}</span>

                <h3>${convertTemp(h.temperature_2m[i])}°${isCelsius ? "C" : "F"}</h3>

                <p>🌧️ ${h.precipitation_probability[i] ?? 0}%</p>

            </div>
        `;

    }).join("");

}

// =========================================
// 11. 7 DAY FORECAST
// =========================================

function displayDaily() {

    const d = weatherData.daily;

    const container = document.getElementById("daily");

    container.innerHTML = d.time.map((date, i) => {

        const info = getWeatherInfo(d.weather_code[i]);

        const day = new Date(date + "T12:00:00")
            .toLocaleDateString("en-IN", {
                weekday: "long"
            });

        const max = convertTemp(d.temperature_2m_max[i]);

        const min = convertTemp(d.temperature_2m_min[i]);

        const rain = d.precipitation_probability_max[i] ?? 0;

        return `
            <div class="day-row">

                <span class="day-icon">${info[1]}</span>

                <span class="day-name">${day}</span>

                <span class="temps">
                    ${max}° / ${min}° ${isCelsius ? "C" : "F"}
                </span>

                <span>💧 ${rain}%</span>

            </div>
        `;

    }).join("");

}

// =========================================
// 12. SUNRISE AND SUNSET
// =========================================

function displaySun() {

    const d = weatherData.daily;

    document.getElementById("sunrise").textContent =
        formatTime(d.sunrise[0]);

    document.getElementById("sunset").textContent =
        formatTime(d.sunset[0]);

}

function formatTime(value) {

    const time = value.substring(11, 16);

    const [hour, minute] = time.split(":");

    const date = new Date();

    date.setHours(Number(hour), Number(minute));

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

}

// =========================================
// 13. WIND DIRECTION
// =========================================

function getWindDirection(degree) {

    const directions = [
        "N", "NE", "E", "SE",
        "S", "SW", "W", "NW"
    ];

    return directions[
        Math.round(degree / 45) % 8
    ];

}

// =========================================
// 14. MY CURRENT LOCATION
// =========================================

function useLocation() {

    if (!navigator.geolocation) {

        showStatus("❌ Location not supported!");

        return;
    }

    showStatus("📍 Getting your location...");

    navigator.geolocation.getCurrentPosition(

        position => {

            loadWeather(
                position.coords.latitude,
                position.coords.longitude,
                "My Location"
            );

        },

        error => {

            showStatus(
                error.code === 1
                    ? "❌ Please allow location permission."
                    : "❌ Unable to get location."
            );

        },

        {
            enableHighAccuracy: false,
            timeout: 15000
        }

    );

}

// =========================================
// 15. RECENT SEARCHES
// =========================================

function getStored(key) {

    try {

        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch {

        return [];

    }

}

function setStored(key, value) {

    try {

        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {

        console.log("Storage unavailable", error);

    }

}

function saveRecent(city) {

    let recent = getStored("neonRecent");

    recent = recent.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    recent.unshift(city);

    setStored("neonRecent", recent.slice(0, 5));

    displayRecent();

}

function displayRecent() {

    const container = document.getElementById("recent");

    const recent = getStored("neonRecent");

    container.innerHTML = "";

    if (!recent.length) {

        container.textContent = "No recent searches yet.";

        return;
    }

    recent.forEach(city => {

        const btn = document.createElement("button");

        btn.textContent = city;

        btn.addEventListener("click", () => {

            cityInput.value = city;

            searchWeather();

        });

        container.appendChild(btn);

    });

}

// =========================================
// 16. FAVOURITE CITIES
// =========================================

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

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML =
            '<h2 class="section-title">⭐ Favourite Cities</h2>';

        container = document.createElement("div");

        container.id = "favorites";
        container.className = "recent";

        card.appendChild(container);

        document.querySelector("footer").before(card);

    }

    container.innerHTML = "";

    const favorites = getStored("neonFavorites");

    if (!favorites.length) {

        container.textContent = "No favourite cities yet.";

        return;
    }

    favorites.forEach(city => {

        const btn = document.createElement("button");

        btn.textContent = city;

        btn.addEventListener("click", () => {

            cityInput.value = city;

            searchWeather();

        });

        container.appendChild(btn);

    });

}

// =========================================
// 17. DARK / LIGHT MODE
// =========================================

function toggleTheme() {

    isLightMode = !isLightMode;

    document.body.classList.toggle(
        "neon-light",
        isLightMode
    );

    document.getElementById("themeBtn").textContent =
        isLightMode ? "🌙 Dark Mode" : "☀️ Light Mode";

    setStored(
        "neonTheme",
        isLightMode ? "light" : "dark"
    );

}

// =========================================
// 18. THEME CSS
// =========================================

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

        #extraControls button {
            flex: 1 1 120px;
            min-height: 42px;
        }

        button {
            transition: 0.2s ease;
        }

        button:hover {
            filter: brightness(1.15);
        }

    `;

    document.head.appendChild(style);

}

// =========================================
// 19. REFRESH WEATHER
// =========================================

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

// =========================================
// 20. STATUS MESSAGE
// =========================================

function showStatus(message) {

    statusText.textContent = message;

}

// =========================================
// 21. ENTER KEY SEARCH
// =========================================

cityInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        searchWeather();

    }

});

// =========================================
// 22. START APP
// =========================================

createControls();

addThemeStyles();

displayRecent();

displayFavorites();

// Restore saved theme

if (localStorage.getItem("neonTheme") === "light") {

    toggleTheme();

}

// Connect HTML onclick functions

window.searchWeather = searchWeather;
window.useLocation = useLocation;
window.toggleUnit = toggleUnit;
window.toggleTheme = toggleTheme;
window.refreshWeather = refreshWeather;
window.saveFavorite = saveFavorite;

console.log("⚡ NEON WEATHER CONNECTED SUCCESSFULLY!");
        
