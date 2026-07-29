import { GEOCODING_BASE, OPEN_METEO_FORECAST_BASE, OPEN_METEO_GEOCODING_BASE, WEATHER_API_BASE, WEATHER_API_KEY } from '../constants';

const buildUrl = (baseUrl, path, params) => {
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

const parseApiError = (errorBody, fallbackMessage) => {
  if (!errorBody) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(errorBody);
    if (parsed?.message) {
      if (parsed.message.toLowerCase().includes('invalid api key')) {
        return 'Invalid API key. Please update your weather API configuration.';
      }
      return parsed.message;
    }
    if (parsed?.cod && parsed.cod !== 200) {
      return parsed.message || fallbackMessage;
    }
  } catch {
    // Fall back to the raw body text.
  }

  return errorBody;
};

const requestJson = async (url, fallbackMessage = 'Unable to fetch weather data.') => {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(parseApiError(errorBody, fallbackMessage));
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please try again.');
    }
    throw error;
  }
};

const weatherCodeToDescription = (code) => {
  const map = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow',
    73: 'moderate snow',
    75: 'heavy snow',
    95: 'thunderstorm',
  };
  return map[code] || 'weather conditions';
};

const weatherCodeToIcon = (code, isDay) => {
  const map = {
    0: isDay ? '01d' : '01n',
    1: isDay ? '02d' : '02n',
    2: isDay ? '03d' : '03n',
    3: isDay ? '04d' : '04n',
    45: '50d',
    48: '50d',
    51: '09d',
    53: '09d',
    55: '09d',
    61: '10d',
    63: '10d',
    65: '10d',
    71: '13d',
    73: '13d',
    75: '13d',
    95: '11d',
  };
  return map[code] || '01d';
};

const buildDisplayName = (locationInfo) => {
  const parts = [locationInfo?.name, locationInfo?.state, locationInfo?.country].filter(Boolean);
  return parts.join(', ');
};

export const searchLocation = async (searchText) => {
  const normalized = (searchText || '').trim();

  if (!normalized) {
    throw new Error('Please enter a location.');
  }

  if (WEATHER_API_KEY && WEATHER_API_KEY !== 'YOUR_API_KEY') {
    const geocodeUrl = buildUrl(GEOCODING_BASE, '/direct', {
      q: normalized,
      limit: 1,
      appid: WEATHER_API_KEY,
    });

    try {
      const data = await requestJson(geocodeUrl, 'Unable to search this location.');
      const location = Array.isArray(data) ? data[0] : null;

      if (!location) {
        throw new Error('Location not found. Please enter a valid city, town, village, or locality.');
      }

      return {
        lat: location.lat,
        lon: location.lon,
        name: location.name || 'Location',
        state: location.state || '',
        country: location.country || '',
        displayName: buildDisplayName({
          name: location.name || 'Location',
          state: location.state || '',
          country: location.country || '',
        }),
      };
    } catch (error) {
      if (error.message.includes('Location not found')) {
        throw error;
      }
      throw error;
    }
  }

  const fallbackUrl = buildUrl(OPEN_METEO_GEOCODING_BASE, '/search', {
    name: normalized,
    count: 1,
    language: 'en',
    format: 'json',
  });
  const geocodeData = await requestJson(fallbackUrl, 'Unable to search this location.');
  const location = geocodeData.results?.[0];

  if (!location) {
    throw new Error('Location not found. Please enter a valid city, town, village, or locality.');
  }

  return {
    lat: location.latitude,
    lon: location.longitude,
    name: location.name || 'Location',
    state: location.admin1 || '',
    country: location.country_code || '',
    displayName: buildDisplayName({
      name: location.name || 'Location',
      state: location.admin1 || '',
      country: location.country_code || '',
    }),
  };
};

const normalizeOpenMeteoWeatherByCoords = async (lat, lon, locationInfo = {}) => {
  const forecastUrl = buildUrl(OPEN_METEO_FORECAST_BASE, '', {
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 7,
  });

  const forecastData = await requestJson(forecastUrl, 'Unable to fetch weather data.');
  const current = forecastData.current;
  const daily = forecastData.daily;

  return {
    name: locationInfo.name || 'Current location',
    state: locationInfo.state || '',
    country: locationInfo.country || '',
    displayName: locationInfo.displayName || buildDisplayName(locationInfo),
    sys: {
      country: locationInfo.country || 'Current',
      sunrise: Math.floor(new Date(daily.sunrise[0]).getTime() / 1000),
      sunset: Math.floor(new Date(daily.sunset[0]).getTime() / 1000),
    },
    coord: {
      lat,
      lon,
    },
    main: {
      temp: Math.round(current.temperature_2m),
      feels_like: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      pressure: 1013,
    },
    wind: {
      speed: Math.round(current.wind_speed_10m),
    },
    visibility: 10,
    weather: [{
      description: weatherCodeToDescription(current.weather_code),
      icon: weatherCodeToIcon(current.weather_code, current.is_day),
    }],
    fallbackSource: 'open-meteo',
    _forecastData: forecastData,
  };
};

const normalizeOpenMeteoForecast = (weatherResponse) => {
  const daily = weatherResponse._forecastData.daily;
  const list = daily.time.slice(0, 7).map((time, index) => ({
    dt: Math.floor(new Date(time).getTime() / 1000),
    main: {
      temp: Math.round(daily.temperature_2m_max[index]),
    },
    weather: [{
      description: weatherCodeToDescription(daily.weather_code[index]),
      icon: weatherCodeToIcon(daily.weather_code[index], 1),
    }],
  }));

  return {
    city: { name: weatherResponse.displayName || weatherResponse.name },
    list,
  };
};

export const fetchCurrentWeather = async (lat, lon, locationInfo = {}) => {
  if (WEATHER_API_KEY && WEATHER_API_KEY !== 'YOUR_API_KEY') {
    const weatherResponse = await requestJson(buildUrl(WEATHER_API_BASE, '/weather', {
      lat,
      lon,
      appid: WEATHER_API_KEY,
      units: 'metric',
      lang: 'en',
    }), 'Unable to fetch weather data.');

    return {
      ...weatherResponse,
      name: locationInfo.name || weatherResponse.name || 'Current location',
      state: locationInfo.state || '',
      country: weatherResponse.sys?.country || locationInfo.country || '',
      displayName: locationInfo.displayName || buildDisplayName({
        name: locationInfo.name || weatherResponse.name || 'Current location',
        state: locationInfo.state || '',
        country: weatherResponse.sys?.country || locationInfo.country || '',
      }),
    };
  }

  return normalizeOpenMeteoWeatherByCoords(lat, lon, locationInfo);
};

export const fetchForecast = async (lat, lon, locationInfo = {}) => {
  if (WEATHER_API_KEY && WEATHER_API_KEY !== 'YOUR_API_KEY') {
    const forecastResponse = await requestJson(buildUrl(WEATHER_API_BASE, '/forecast', {
      lat,
      lon,
      appid: WEATHER_API_KEY,
      units: 'metric',
      lang: 'en',
    }), 'Unable to fetch forecast data.');

    return {
      city: { name: locationInfo.displayName || locationInfo.name || 'Current location' },
      list: forecastResponse.list.slice(0, 7).map((item) => ({
        dt: item.dt,
        main: { temp: Math.round(item.main.temp) },
        weather: [{ description: item.weather?.[0]?.description || 'weather conditions', icon: item.weather?.[0]?.icon || '01d' }],
      })),
    };
  }

  const weatherResponse = await normalizeOpenMeteoWeatherByCoords(lat, lon, locationInfo);
  return normalizeOpenMeteoForecast(weatherResponse);
};

export const fetchWeatherData = async (city) => {
  const location = await searchLocation(city);
  return fetchCurrentWeather(location.lat, location.lon, location);
};

export const fetchForecastData = async (city) => {
  const location = await searchLocation(city);
  return fetchForecast(location.lat, location.lon, location);
};

export const fetchForecastByCoords = async (lat, lon) => fetchForecast(lat, lon);

export const fetchCurrentLocationWeather = async (lat, lon) => fetchCurrentWeather(lat, lon);
