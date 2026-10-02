/* =====================================================
   SMARTFARM DASHBOARD
   script.js - PREMIUM UPGRADED VERSION
   Background + API + Existing Functions Preserved
===================================================== */

let temperatureChart = null;
let humidityChart = null;
let soilChart = null;

let currentMode = "AUTO";
let currentPumpState = false;
let dashboardReady = false;
let refreshBusy = false;

const API_BASE = "";

const REFRESH_SENSOR = 5000;
const REFRESH_HISTORY = 10000;


/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function getElement(id) {
    return document.getElementById(id);
}

function getAll(selector) {
    return document.querySelectorAll(selector);
}

function formatNumber(value, decimals = 1) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "--";
    }

    return number.toFixed(decimals);
}

function getTime(dateValue) {
    const date = dateValue ? new Date(dateValue) : new Date();

    if (Number.isNaN(date.getTime())) {
        return "--:--:--";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}

function addClass(element, className) {
    if (element) element.classList.add(className);
}

function removeClass(element, className) {
    if (element) element.classList.remove(className);
}


/* =====================================================
   PREMIUM NUMBER ANIMATION
===================================================== */

function animateValue(element, target, suffix = "", decimals = 1) {

    if (!element || !Number.isFinite(target)) {
        return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.textContent =
            `${target.toFixed(decimals)}${suffix}`;
        return;
    }

    const start = Number(element.dataset.value || 0);
    const duration = 650;
    const startTime = performance.now();

    function animate(now) {

        const progress = Math.min(
            (now - startTime) / duration,
            1
        );

        const eased =
            1 - Math.pow(1 - progress, 3);

        const value =
            start + (target - start) * eased;

        element.textContent =
            `${value.toFixed(decimals)}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    element.dataset.value = target;

    requestAnimationFrame(animate);
}


/* =====================================================
   SENSOR STATUS CLASS
===================================================== */

function updateSensorState(card, type, value) {

    if (!card || !Number.isFinite(value)) return;

    card.classList.remove(
        "sensor-good",
        "sensor-warning",
        "sensor-danger",
        "sensor-cool",
        "sensor-hot"
    );

    if (type === "temperature") {

        if (value >= 38) {
            card.classList.add("sensor-danger");
        } else if (value >= 32) {
            card.classList.add("sensor-warning");
        } else {
            card.classList.add("sensor-good");
        }
    }

    if (type === "humidity") {

        if (value < 30) {
            card.classList.add("sensor-danger");
        } else if (value < 45) {
            card.classList.add("sensor-warning");
        } else {
            card.classList.add("sensor-good");
        }
    }

    if (type === "soil") {

        if (value < 30) {
            card.classList.add("sensor-danger");
        } else if (value < 45) {
            card.classList.add("sensor-warning");
        } else {
            card.classList.add("sensor-good");
        }
    }
}


/* =====================================================
   SENSOR CARDS
===================================================== */

function updateSensorCards(data) {

    const temperature = Number(data.temperature);
    const humidity = Number(data.humidity);
    const soil = Number(data.soilMoisture);

    const tempEl = getElement("temperature");
    const humidityEl = getElement("humidity");
    const soilEl = getElement("soilMoisture");

    if (tempEl) {

        if (Number.isFinite(temperature)) {
            animateValue(
                tempEl,
                temperature,
                " °C",
                1
            );
        } else {
            tempEl.textContent = "-- °C";
        }
    }

    if (humidityEl) {

        if (Number.isFinite(humidity)) {
            animateValue(
                humidityEl,
                humidity,
                " %",
                1
            );
        } else {
            humidityEl.textContent = "-- %";
        }
    }

    if (soilEl) {

        if (Number.isFinite(soil)) {
            animateValue(
                soilEl,
                soil,
                " %",
                0
            );
        } else {
            soilEl.textContent = "-- %";
        }
    }


    /* Dynamic sensor card state */

    const tempCard =
        tempEl?.closest(".sensor-card");

    const humidityCard =
        humidityEl?.closest(".sensor-card");

    const soilCard =
        soilEl?.closest(".sensor-card");


    updateSensorState(
        tempCard,
        "temperature",
        temperature
    );

    updateSensorState(
        humidityCard,
        "humidity",
        humidity
    );

    updateSensorState(
        soilCard,
        "soil",
        soil
    );


    /* CSS variables for dynamic visual effects */

    document.documentElement.style.setProperty(
        "--farm-temperature",
        Number.isFinite(temperature)
            ? temperature
            : 0
    );

    document.documentElement.style.setProperty(
        "--farm-humidity",
        Number.isFinite(humidity)
            ? humidity
            : 0
    );

    document.documentElement.style.setProperty(
        "--farm-soil",
        Number.isFinite(soil)
            ? soil
            : 0
    );


    if (getElement("lastUpdate")) {

        getElement("lastUpdate").textContent =
            `Updated ${getTime(data.createdAt)}`;
    }

    if (getElement("overviewUpdate")) {

        getElement("overviewUpdate").textContent =
            getTime(data.createdAt);
    }


    /* Dashboard data-loaded animation */

    if (!dashboardReady) {

        document.body.classList.add(
            "dashboard-data-loaded"
        );

        dashboardReady = true;
    }
}


/* =====================================================
   ESP32 STATUS
===================================================== */

function updateESPStatus(isOnline = true) {

    const status = getElement("espStatus");
    const cardStatus = getElement("espCardStatus");
    const overview = getElement("espOverview");
    const overview2 = getElement("espOverview2");

    document.body.classList.toggle(
        "esp-online",
        isOnline
    );

    document.body.classList.toggle(
        "esp-offline",
        !isOnline
    );


    if (isOnline) {

        if (status) {

            status.textContent =
                "🟢 ESP32 Online";

            status.classList.remove(
                "offline-badge"
            );

            status.classList.add(
                "online-badge"
            );
        }

        if (cardStatus) {
            cardStatus.textContent = "ONLINE";
        }

        if (overview) {
            overview.textContent = "ONLINE";
        }

        if (overview2) {
            overview2.textContent = "Connected";
        }

    } else {

        if (status) {

            status.textContent =
                "🔴 ESP32 Offline";

            status.classList.remove(
                "online-badge"
            );

            status.classList.add(
                "offline-badge"
            );
        }

        if (cardStatus) {
            cardStatus.textContent = "OFFLINE";
        }

        if (overview) {
            overview.textContent = "OFFLINE";
        }

        if (overview2) {
            overview2.textContent = "Disconnected";
        }
    }
}


/* =====================================================
   AI RECOMMENDATION
===================================================== */

function generateFallbackAI(data) {

    const temperature = Number(data.temperature);
    const humidity = Number(data.humidity);
    const soil = Number(data.soilMoisture);


    if (soil < 30 && temperature > 35) {

        return {
            status: "URGENT",

            recommendation:
                "Soil is very dry and temperature is high. Irrigation is recommended.",

            action: "PUMP_ON"
        };
    }


    if (soil < 40) {

        return {
            status: "DRY",

            recommendation:
                "Soil moisture is low. Irrigation is recommended.",

            action: "PUMP_ON"
        };
    }


    if (temperature > 38 && humidity < 30) {

        return {
            status: "HOT",

            recommendation:
                "High temperature and low humidity detected. Monitor the crop closely.",

            action: "MONITOR"
        };
    }


    if (soil >= 40 && soil < 60) {

        return {
            status: "MODERATE",

            recommendation:
                "Soil moisture is moderate. Continue monitoring.",

            action: "MONITOR"
        };
    }


    return {
        status: "HEALTHY",

        recommendation:
            "Environmental conditions are suitable. No irrigation required.",

        action: "PUMP_OFF"
    };
}


function updateAI(data) {

    const ai =
        data.ai || generateFallbackAI(data);

    const status =
        ai.status || "HEALTHY";

    const recommendation =
        ai.recommendation ||
        "Continue monitoring farm conditions.";

    const action =
        ai.action ||
        "MONITOR";


    const aiStatus =
        getElement("aiStatus");


    if (aiStatus) {

        aiStatus.textContent =
            status;

        aiStatus.classList.remove(
            "ai-healthy",
            "ai-warning",
            "ai-danger",
            "ai-hot"
        );

        if (status === "URGENT") {
            aiStatus.classList.add(
                "ai-danger"
            );
        } else if (
            status === "DRY" ||
            status === "MODERATE"
        ) {
            aiStatus.classList.add(
                "ai-warning"
            );
        } else if (status === "HOT") {
            aiStatus.classList.add(
                "ai-hot"
            );
        } else {
            aiStatus.classList.add(
                "ai-healthy"
            );
        }
    }


    if (getElement("aiRecommendation")) {

        getElement("aiRecommendation")
            .textContent =
            recommendation;
    }


    if (getElement("aiAction")) {

        getElement("aiAction")
            .textContent =
            action;
    }


    /* AI dashboard state */

    const aiPanel =
        document.querySelector(".ai-panel");

    if (aiPanel) {

        aiPanel.classList.remove(
            "ai-state-healthy",
            "ai-state-warning",
            "ai-state-danger"
        );

        if (status === "URGENT") {

            aiPanel.classList.add(
                "ai-state-danger"
            );

        } else if (
            status === "DRY" ||
            status === "HOT" ||
            status === "MODERATE"
        ) {

            aiPanel.classList.add(
                "ai-state-warning"
            );

        } else {

            aiPanel.classList.add(
                "ai-state-healthy"
            );
        }
    }


    updatePlantHealth(status);
    updateWaterStatus(action);
    updateAlert(status, recommendation);
}


/* =====================================================
   PLANT HEALTH
===================================================== */

function updatePlantHealth(status) {

    const element =
        getElement("plantHealth");

    if (!element) return;


    switch (status) {

        case "URGENT":
            element.textContent =
                "Critical";
            break;

        case "DRY":
            element.textContent =
                "Needs Water";
            break;

        case "HOT":
            element.textContent =
                "Heat Risk";
            break;

        case "MODERATE":
            element.textContent =
                "Moderate";
            break;

        default:
            element.textContent =
                "Healthy";
    }


    element.classList.remove(
        "health-good",
        "health-warning",
        "health-danger"
    );


    if (status === "URGENT") {

        element.classList.add(
            "health-danger"
        );

    } else if (
        status === "DRY" ||
        status === "HOT"
    ) {

        element.classList.add(
            "health-warning"
        );

    } else {

        element.classList.add(
            "health-good"
        );
    }
}


/* =====================================================
   WATER STATUS
===================================================== */

function updateWaterStatus(action) {

    const element =
        getElement("waterStatus");

    if (!element) return;


    if (action === "PUMP_ON") {

        element.textContent =
            "Irrigation Required";

        element.classList.add(
            "water-warning"
        );

    } else if (action === "PUMP_OFF") {

        element.textContent =
            "Not Required";

        element.classList.remove(
            "water-warning"
        );

    } else {

        element.textContent =
            "Monitoring";

        element.classList.remove(
            "water-warning"
        );
    }
}


/* =====================================================
   ALERT SYSTEM
===================================================== */

function updateAlert(
    status,
    recommendation
) {

    const panel =
        getElement("alertPanel");

    const icon =
        getElement("alertIcon");

    const title =
        getElement("alertTitle");

    const message =
        getElement("alertMessage");


    if (!panel || !title || !message) {
        return;
    }


    panel.classList.remove(
        "alert-normal",
        "alert-warning",
        "alert-danger"
    );


    if (status === "URGENT") {

        title.textContent =
            "Urgent Irrigation Alert";

        message.textContent =
            recommendation;

        if (icon) {
            icon.textContent = "🚨";
        }

        panel.classList.add(
            "alert-danger"
        );


    } else if (status === "DRY") {

        title.textContent =
            "Low Soil Moisture";

        message.textContent =
            recommendation;

        if (icon) {
            icon.textContent = "💧";
        }

        panel.classList.add(
            "alert-warning"
        );


    } else if (status === "HOT") {

        title.textContent =
            "High Temperature Alert";

        message.textContent =
            recommendation;

        if (icon) {
            icon.textContent = "🌡️";
        }

        panel.classList.add(
            "alert-warning"
        );


    } else {

        title.textContent =
            "Farm Conditions Normal";

        message.textContent =
            recommendation;

        if (icon) {
            icon.textContent = "🛡️";
        }

        panel.classList.add(
            "alert-normal"
        );
    }


    /* Alert animation */

    panel.classList.remove(
        "alert-refresh"
    );

    void panel.offsetWidth;

    panel.classList.add(
        "alert-refresh"
    );
}


/* =====================================================
   PUMP UI
===================================================== */

function updatePumpUI(
    pumpState,
    mode
) {

    currentPumpState =
        Boolean(pumpState);


    if (mode) {
        currentMode = mode;
    }


    const circle =
        getElement("pumpCircle");

    const status =
        getElement("pumpStatus");

    const description =
        getElement("pumpDescription");

    const autoBtn =
        getElement("autoBtn");

    const manualBtn =
        getElement("manualBtn");


    /* Body state */

    document.body.classList.toggle(
        "pump-running",
        currentPumpState
    );


    /* Pump circle */

    if (circle) {

        circle.classList.toggle(
            "pump-active",
            currentPumpState
        );

        circle.classList.remove(
            "pump-refresh"
        );

        void circle.offsetWidth;

        circle.classList.add(
            "pump-refresh"
        );
    }


    /* Pump status */

    if (status) {

        status.textContent =
            currentPumpState
                ? "PUMP ON"
                : "PUMP OFF";

        status.classList.toggle(
            "pump-on",
            currentPumpState
        );

        status.classList.toggle(
            "pump-off",
            !currentPumpState
        );
    }


    /* Description */

    if (description) {

        if (currentPumpState) {

            description.textContent =
                currentMode === "AUTO"
                    ? "Automatic irrigation is currently running."
                    : "The irrigation pump is manually switched ON.";

        } else {

            description.textContent =
                currentMode === "AUTO"
                    ? "Automatic irrigation is currently stopped."
                    : "The irrigation pump is manually switched OFF.";
        }
    }


    /* Mode buttons */

    if (autoBtn) {

        autoBtn.classList.toggle(
            "active-mode",
            currentMode === "AUTO"
        );
    }


    if (manualBtn) {

        manualBtn.classList.toggle(
            "active-mode",
            currentMode === "MANUAL"
        );
    }
}


/* =====================================================
   LOADING STATE
===================================================== */

function setDashboardLoading(isLoading) {

    document.body.classList.toggle(
        "dashboard-loading",
        isLoading
    );


    getAll(
        ".sensor-card, .overview-card, .chart-card"
    ).forEach(element => {

        element.classList.toggle(
            "is-loading",
            isLoading
        );
    });
}


/* =====================================================
   LOAD LATEST DATA
===================================================== */

async function loadLatestData() {

    if (refreshBusy) {
        return null;
    }

    refreshBusy = true;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/latest`,
                {
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        updateSensorCards(data);
        updateESPStatus(true);
        updateAI(data);


        updatePumpUI(
            data.pump,
            data.mode
        );


        setDashboardLoading(false);


        return data;


    } catch (error) {

        console.error(
            "Latest data error:",
            error
        );


        updateESPStatus(false);

        setDashboardLoading(false);


        return null;


    } finally {

        refreshBusy = false;
    }
}


/* =====================================================
   LOAD HISTORY
===================================================== */

async function loadHistory() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/sensor`,
                {
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {
            return;
        }


        const history =
            data
                .slice(0, 20)
                .reverse();


        updateCharts(history);


    } catch (error) {

        console.error(
            "History error:",
            error
        );
    }
}


/* =====================================================
   CHART CREATION
===================================================== */

function createChart(
    canvasId,
    label,
    values,
    labels
) {

    const canvas =
        getElement(canvasId);


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return null;
    }


    const existing =
        Chart.getChart(canvas);


    if (existing) {
        existing.destroy();
    }


    return new Chart(
        canvas.getContext("2d"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: label,

                        data: values,

                        borderWidth: 3,

                        tension: 0.42,

                        fill: true,

                        pointRadius: 3,

                        pointHoverRadius: 7,

                        pointHitRadius: 15
                    }
                ]
            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                animation: {

                    duration: 800,

                    easing: "easeOutQuart"
                },


                interaction: {

                    intersect: false,

                    mode: "index"
                },


                plugins: {

                    legend: {

                        display: false
                    },


                    tooltip: {

                        enabled: true,

                        displayColors: false,

                        padding: 12,

                        cornerRadius: 10,

                        titleFont: {
                            size: 12,
                            weight: "700"
                        },

                        bodyFont: {
                            size: 12
                        }
                    }
                },


                scales: {

                    x: {

                        grid: {
                            display: false
                        },


                        border: {
                            display: false
                        },


                        ticks: {

                            maxTicksLimit: 8,

                            font: {
                                size: 10
                            }
                        }
                    },


                    y: {

                        beginAtZero: false,


                        border: {
                            display: false
                        },


                        grid: {

                            drawTicks: false
                        },


                        ticks: {

                            padding: 8,

                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        }
    );
}


/* =====================================================
   UPDATE CHARTS
===================================================== */

function updateCharts(history) {

    if (
        !history ||
        history.length === 0
    ) {
        return;
    }


    const labels =
        history.map(
            item =>
                getTime(item.createdAt)
        );


    const temperatures =
        history.map(
            item =>
                Number(item.temperature)
        );


    const humidities =
        history.map(
            item =>
                Number(item.humidity)
        );


    const soilValues =
        history.map(
            item =>
                Number(item.soilMoisture)
        );


    temperatureChart =
        createChart(
            "temperatureChart",
            "Temperature",
            temperatures,
            labels
        );


    humidityChart =
        createChart(
            "humidityChart",
            "Humidity",
            humidities,
            labels
        );


    soilChart =
        createChart(
            "soilChart",
            "Soil Moisture",
            soilValues,
            labels
        );


    getAll(
        ".chart-card"
    ).forEach(card => {

        card.classList.add(
            "chart-loaded"
        );
    });
}


/* =====================================================
   PUMP CONTROL
===================================================== */

async function setPump(state) {

    const requestedState =
        Boolean(state);


    const previousState =
        currentPumpState;


    /* Instant UI feedback */

    updatePumpUI(
        requestedState,
        currentMode
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/api/pump`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },


                    body: JSON.stringify({

                        pump:
                            requestedState
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        updatePumpUI(
            data.pump,
            data.mode
        );


        await loadLatestData();


    } catch (error) {

        console.error(
            "Pump control error:",
            error
        );


        /* Roll back UI */

        updatePumpUI(
            previousState,
            currentMode
        );


        alert(
            "Pump control failed. Check backend server."
        );
    }
}


/* =====================================================
   CONTROL MODE
===================================================== */

async function setMode(mode) {

    if (
        mode !== "AUTO" &&
        mode !== "MANUAL"
    ) {
        return;
    }


    const previousMode =
        currentMode;


    /* Instant mode feedback */

    currentMode = mode;

    updatePumpUI(
        currentPumpState,
        currentMode
    );


    try {

        const response =
            await fetch(
                `${API_BASE}/api/mode`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },


                    body: JSON.stringify({

                        mode: mode
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        updatePumpUI(
            data.pump,
            data.mode
        );


        await loadLatestData();


    } catch (error) {

        console.error(
            "Mode change error:",
            error
        );


        currentMode =
            previousMode;


        updatePumpUI(
            currentPumpState,
            currentMode
        );


        alert(
            "Mode change failed. Check backend server."
        );
    }
}


/* =====================================================
   FARM BACKGROUND VIDEO
   BACKGROUND FILE IS NOT CHANGED
===================================================== */

function setupFarmVideo() {

    const video =
        getElement("farmVideo");


    if (!video) {
        return;
    }


    video.setAttribute(
        "playsinline",
        ""
    );


    video.setAttribute(
        "loop",
        ""
    );


    video.play()
        .catch(() => {
            console.log(
                "Farm background waiting for browser permission."
            );
        });
}


/* =====================================================
   FARM SOUND
===================================================== */

function enableFarmSound() {

    const video =
        getElement("farmVideo");

    const button =
        getElement("soundBtn");


    if (!video) {
        return;
    }


    if (video.muted) {

        video.muted = false;

        video.volume = 0.65;


        video.play()
            .then(() => {

                if (button) {

                    button.innerHTML =
                        "🔊 Farm Sound ON";

                    button.classList.add(
                        "sound-active"
                    );
                }

            })
            .catch(error => {

                console.log(
                    "Audio error:",
                    error
                );
            });


    } else {

        video.muted = true;


        if (button) {

            button.innerHTML =
                "🔇 Farm Sound OFF";

            button.classList.remove(
                "sound-active"
            );
        }
    }
}


/* =====================================================
   SOUND BUTTON CLICK
===================================================== */

function setupSoundButton() {

    const button =
        getElement("soundBtn");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        enableFarmSound
    );
}


/* =====================================================
   SMOOTH CARD ENTRY
===================================================== */

function setupCardAnimations() {

    const cards =
        getAll(
            ".sensor-card, .overview-card, .chart-card, .ai-panel, .alert-panel"
        );


    if (
        !cards.length ||
        !("IntersectionObserver" in window)
    ) {
        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "is-visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: 0.12
            }
        );


    cards.forEach(card => {

        card.classList.add(
            "reveal-card"
        );

        observer.observe(card);
    });
}


/* =====================================================
   HOVER SENSOR EFFECT
===================================================== */

function setupSensorHover() {

    getAll(
        ".sensor-card"
    ).forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {
                card.classList.add(
                    "sensor-hover"
                );
            }
        );


        card.addEventListener(
            "mouseleave",
            () => {
                card.classList.remove(
                    "sensor-hover"
                );
            }
        );
    });
}


/* =====================================================
   DASHBOARD INITIALIZE
===================================================== */

async function initializeDashboard() {

    console.log(
        "🌱 SmartFarm Premium Dashboard Starting..."
    );


    setDashboardLoading(true);


    setupFarmVideo();
    setupSoundButton();
    setupCardAnimations();
    setupSensorHover();


    await loadLatestData();

    await loadHistory();


    console.log(
        "✅ SmartFarm Premium Dashboard Ready"
    );
}


/* =====================================================
   START DASHBOARD
===================================================== */

initializeDashboard();


/* =====================================================
   AUTO REFRESH SENSOR
===================================================== */

setInterval(
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {
            loadLatestData();
        }

    },
    REFRESH_SENSOR
);


/* =====================================================
   AUTO REFRESH HISTORY
===================================================== */

setInterval(
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {
            loadHistory();
        }

    },
    REFRESH_HISTORY
);


/* =====================================================
   PAGE VISIBILITY
===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadLatestData();
            loadHistory();
        }
    }
);


/* =====================================================
   NETWORK ONLINE
===================================================== */

window.addEventListener(
    "online",
    () => {

        console.log(
            "🌐 Browser network connected"
        );


        document.body.classList.remove(
            "network-offline"
        );


        loadLatestData();
    }
);


/* =====================================================
   NETWORK OFFLINE
===================================================== */

window.addEventListener(
    "offline",
    () => {

        console.log(
            "🔴 Browser network disconnected"
        );


        document.body.classList.add(
            "network-offline"
        );


        updateESPStatus(false);
    }
);


/* =====================================================
   TAB FOCUS REFRESH
===================================================== */

window.addEventListener(
    "focus",
    () => {

        loadLatestData();
    }
);


/* =====================================================
   REDUCED MOTION SUPPORT
===================================================== */

if (
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches
) {

    document.documentElement.classList.add(
        "reduced-motion"
    );
}