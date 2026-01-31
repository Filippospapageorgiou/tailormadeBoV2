// $lib/stores/weather.svelte.ts
// Weather store with geolocation and caching

import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY as PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Types
export interface WeatherData {
	temperature: number;
	weatherCode: number;
	description: string;
	icon: string;
	humidity: number;
	windSpeed: number;
	feelsLike: number;
	location?: {
		city: string;
		country: string;
	};
	cached?: boolean;
	cacheAge?: number;
}

export interface WeatherState {
	data: WeatherData | null;
	loading: boolean;
	error: string | null;
	lastUpdated: Date | null;
	coordinates: { lat: number; lng: number } | null;
	permissionDenied: boolean;
}

// Default coordinates (Athens, Greece)
const DEFAULT_COORDS = {
	lat: 37.98,
	lng: 23.73
};

// Create the weather store
function createWeatherStore() {
	// Reactive state
	let state = $state<WeatherState>({
		data: null,
		loading: false,
		error: null,
		lastUpdated: null,
		coordinates: null,
		permissionDenied: false
	});

	// Get user's location
	async function getUserLocation(): Promise<{ lat: number; lng: number }> {
		if (!browser || !navigator.geolocation) {
			console.log('Geolocation not available, using default coordinates');
			return DEFAULT_COORDS;
		}

		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const coords = {
						lat: position.coords.latitude,
						lng: position.coords.longitude
					};
					state.coordinates = coords;
					state.permissionDenied = false;
					resolve(coords);
				},
				(error) => {
					console.warn('Geolocation error:', error.message);
					state.permissionDenied = error.code === error.PERMISSION_DENIED;
					resolve(DEFAULT_COORDS);
				},
				{
					enableHighAccuracy: false,
					timeout: 10000,
					maximumAge: 300000 // 5 minutes
				}
			);
		});
	}

	// Fetch weather from Edge Function
	async function fetchWeather(coords: { lat: number; lng: number }, includeLocation = true) {
		// Round coordinates client-side for consistent caching
		const roundedLat = Math.round(coords.lat * 100) / 100;
		const roundedLng = Math.round(coords.lng * 100) / 100;

		const url = `${PUBLIC_SUPABASE_URL}/functions/v1/dynamic-responder?lat=${roundedLat}&lng=${roundedLng}&location=${includeLocation}`;

		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Authorization': `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`
			}
		});

		if (!response.ok) {
			throw new Error(`Weather API error: ${response.status}`);
		}

		return response.json() as Promise<WeatherData>;
	}

	// Main function to get weather
	async function getWeather(forceRefresh = false) {
		// Don't fetch if already loading
		if (state.loading) return;

		// Check if we have recent data (less than 5 minutes old)
		if (!forceRefresh && state.data && state.lastUpdated) {
			const ageMinutes = (Date.now() - state.lastUpdated.getTime()) / (1000 * 60);
			if (ageMinutes < 5) {
				return; // Use existing data
			}
		}

		state.loading = true;
		state.error = null;

		try {
			// Get user location (or use cached/default)
			const coords = state.coordinates || (await getUserLocation());

			// Fetch weather
			const weatherData = await fetchWeather(coords);

			state.data = weatherData;
			state.lastUpdated = new Date();
			state.coordinates = coords;
		} catch (err) {
			state.error = err instanceof Error ? err.message : 'Failed to fetch weather';
			console.error('Weather fetch error:', err);
		} finally {
			state.loading = false;
		}
	}

	// Refresh weather data
	function refresh() {
		return getWeather(true);
	}

	// Set custom coordinates (e.g., from user's organization location)
	function setCoordinates(lat: number, lng: number) {
		state.coordinates = { lat, lng };
		return getWeather(true);
	}

	return {
		get state() {
			return state;
		},
		getWeather,
		refresh,
		setCoordinates,
		getUserLocation
	};
}

// Singleton store instance
let weatherStoreInstance: ReturnType<typeof createWeatherStore> | null = null;

export function getWeatherStore() {
	if (!weatherStoreInstance) {
		weatherStoreInstance = createWeatherStore();
	}
	return weatherStoreInstance;
}

// Context-based store for Svelte 5
const WEATHER_CONTEXT_KEY = Symbol('weather-store');

export function setWeatherContext() {
	const store = createWeatherStore();
	// If using Svelte's setContext, you'd do it here
	return store;
}

export function getWeatherContext() {
	return getWeatherStore();
}