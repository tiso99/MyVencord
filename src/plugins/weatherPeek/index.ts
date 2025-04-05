import { definePlugin } from "@utils/types";
import { showToast } from "@api/toasts";
import { React, ReactDOM } from "@webpack/common";
import { findByProps, findByDisplayName } from "@webpack";

// Load UI components from Discord
const Text = await findByDisplayName("Text", false);
const Heading = await findByDisplayName("Heading", false);
const Button = (await findByProps("Button", "Colors"))?.Button;

const defaultLocation = "New York";
const defaultKeybind = "ctrl+w";

async function fetchWeather(location: string) {
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%w+%h+%p+%l+%L`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather API failed");
        return await res.text();
    } catch (err) {
        console.error("[WeatherPeek] Error fetching weather:", err);
        return null;
    }
}

function WeatherOverlay({ weather, onClose }) {
    const weatherIcons = {
        "Partly cloudy": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Partly_cloudy_icon.svg/120px-Partly_cloudy_icon.svg.png",
        "Clear": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Sun_icon_%28SVG%29.svg/120px-Sun_icon_%28SVG%29.svg.png",
        "Rain": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Cloud_rain_icon.svg/120px-Cloud_rain_icon.svg.png",
        "Snow": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Snowflake_icon.svg/120px-Snowflake_icon.svg.png",
        "Thunderstorm": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Thunderstorm_icon.svg/120px-Thunderstorm_icon.svg.png"
    };

    const parts = weather.split("+");
    const condition = parts[0]?.trim() || "Unknown";
    const temp = parts[1]?.trim() || "N/A";
    const wind = parts[2]?.trim() || "N/A";
    const humidity = parts[3]?.trim() || "N/A";
    const pressure = parts[4]?.trim() || "N/A";
    const location = parts[5]?.trim() || "Unknown";

    return (
        <div style= {{
        position: "fixed",
            top: "20%",
                left: "50%",
                    transform: "translateX(-50%)",
                        background: "var(--background-secondary)",
                            padding: "20px",
                                borderRadius: "12px",
                                    zIndex: 9999,
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                                            width: "300px",
                                                textAlign: "center",
                                                    color: "var(--text-normal)";
    }
}>
    <Heading variant="heading-md/semibold" > { location } </Heading>
        < img src = { weatherIcons[condition] || weatherIcons["Clear"] } alt = "Weather Icon" style = {{ width: 50, height: 50; }} />
            < Text size = { 16} > { temp } </Text>
                < Text size = { 12} > { condition } </Text>
                    < Text size = { 12} > Wind: { wind; } </Text>
                        < Text size = { 12} > Humidity: { humidity; } </Text>
                            < Text size = { 10} > Pressure: { pressure; } </Text>
                                < br />
                                <Button size={ Button.Sizes.SMALL; } onClick = { onClose } style = {{ marginTop: "10px"; }}> Close </Button>
                                    </div>
    );
}

export default definePlugin({
    name: "WeatherPeek",
    description: "Shows a quick popup with weather information via a hotkey.",
    authors: ["BX", "Tiso99"],

    settings: [
        {
            type: "textbox",
            name: "Location",
            note: "Enter your city or zip.",
            default: defaultLocation,
            id: "weatherLocation"
        },
        {
            type: "textbox",
            name: "Hotkey",
            note: "Key combo to show weather (e.g. Ctrl+W).",
            default: defaultKeybind,
            id: "weatherHotkey"
        }
    ],

    onLoad() {
        this.handleKey = this.handleKey.bind(this);
        document.addEventListener("keydown", this.handleKey);
    },

    onUnload() {
        document.removeEventListener("keydown", this.handleKey);
    },

    async handleKey(event: KeyboardEvent) {
        const location = this.getSetting("weatherLocation", defaultLocation);
        const combo = this.getSetting("weatherHotkey", defaultKeybind).toLowerCase();
        const keysPressed: string[] = [];

        if (event.ctrlKey) keysPressed.push("ctrl");
        if (event.shiftKey) keysPressed.push("shift");
        if (event.altKey) keysPressed.push("alt");

        const mainKey = event.key.toLowerCase();
        if (!["control", "shift", "alt"].includes(mainKey)) keysPressed.push(mainKey);

        if (keysPressed.join("+") !== combo) return;

        const weather = await fetchWeather(location);
        if (!weather) return showToast("Failed to fetch weather data.", { type: "error" });

        this.renderWeather(weather);
    },

    renderWeather(weather: string) {
        const container = document.createElement("div");
        document.body.appendChild(container);

        const close = () => {
            ReactDOM.unmountComponentAtNode(container);
            container.remove();
        };

        ReactDOM.render(React.createElement(WeatherOverlay, { weather, onClose: close }), container);
    }
});
