/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 BX and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import {
    ApplicationCommandOptionType,
    findOption
} from "@api/Commands";
import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";

async function fetchWeather(location: string): Promise<string | null> {
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=%C+%t+%w+%h+%p+%l+%L`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error");
        return await res.text();
    } catch (err) {
        console.error("[WeatherPeek] Failed to fetch weather data:", err);
        return null;
    }
}

const settings = definePluginSettings({
    defaultLocation: {
        type: OptionType.STRING,
        description: "Used when no location is passed with /weather.",
        default: "New York"
    }
});

export default definePlugin({
    name: "WeatherPeek",
    description: "Check the weather using /weather [location]",
    authors: [Devs.BX],
    settings,

    commands: [
        {
            name: "weather",
            description: "Shows current weather for a location.",
            options: [
                {
                    name: "location",
                    description: "City or ZIP code",
                    type: ApplicationCommandOptionType.STRING, // Corrected here too
                    required: false // This is what makes it optional
                }
            ],
            execute: async (opts, ctx) => {
                const locationInput = findOption(opts, "location", null);
                const location = locationInput || settings.store.defaultLocation;

                const weather = await fetchWeather(location);
                if (!weather) {
                    return {
                        content: "❌ Failed to fetch weather data. Please try again later."
                    };
                }

                const [condition, temp, wind, humidity, pressure, loc] = weather.split("+").map(s => s.trim());

                return {
                    content: "", // ✅ required even when using embeds
                    embeds: [
                        {
                            type: "rich",
                            title: `🌤️ Weather in ${loc || location}`,
                            description: `**${condition || "Unknown"}**\n🌡️ Temp: ${temp || "N/A"}\n🌬️ Wind: ${wind || "N/A"}\n💧 Humidity: ${humidity || "N/A"}\n📈 Pressure: ${pressure || "N/A"}`,
                            color: 0x00aaff,
                            footer: {
                                text: "Powered by wttr.in"
                            }
                        }
                    ]
                };
            }

        }
    ]
});
