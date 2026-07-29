import { GEOCODING_BASE, OPEN_METEO_FORECAST_BASE, WEATHER_API_BASE, WEATHER_API_KEY } from '../constants';

const buildUrl = (baseUrl, path, params) => {
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

const requestJson = async (url) => {
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Unable to fetch weather data.');
  }

  return response.json();
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

const normalizeOpenMeteoWeather = async (city) => {
  const geocodeUrl = buildUrl(GEOCODING_BASE, '/search', {
    name: city,
    count: 1,
    language: 'en',
    format: 'json',
  });
  const geocodeData = await requestJson(geocodeUrl);
  const location = geocodeData.results?.[0];

  if (!location) {
    throw new Error(`No weather data found for ${city}.`);
  }

  const forecastUrl = buildUrl(OPEN_METEO_FORECAST_BASE, '', {
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 7,
  });
  const forecastData = await requestJson(forecastUrl);
  const current = forecastData.current;
  const daily = forecastData.daily;

  return {
    name: location.name,
    sys: {
      country: location.country_code,
      sunrise: Math.floor(new Date(daily.sunrise[0]).getTime() / 1000),
      sunset: Math.floor(new Date(daily.sunset[0]).getTime() / 1000),
    },
    coord: {
      lat: location.latitude,
      lon: location.longitude,
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

const normalizeOpenMeteoWeatherByCoords = async (lat, lon) => {
  const forecastUrl = buildUrl(OPEN_METEO_FORECAST_BASE, '', {
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 7,
  });

  const forecastData = await requestJson(forecastUrl);
  const current = forecastData.current;
  const daily = forecastData.daily;

  return {
    name: 'Current location',
    sys: {
      country: 'Current',
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
    city: { name: weatherResponse.name },
    list,
  };
};

export const fetchWeatherData = async (city) => {
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
    return normalizeOpenMeteoWeather(city);
  }

  return requestJson(buildUrl(WEATHER_API_BASE, '/weather', {
    q: city,
    appid: WEATHER_API_KEY,
    units: 'metric',
    lang: 'en',
  }));
};

export const fetchForecastData = async (city) => {
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
    const weatherResponse = await normalizeOpenMeteoWeather(city);
    return normalizeOpenMeteoForecast(weatherResponse);
  }

  return requestJson(buildUrl(WEATHER_API_BASE, '/forecast', {
    q: city,
    appid: WEATHER_API_KEY,
    units: 'metric',
    lang: 'en',
  }));
};

export const fetchForecastByCoords = async (lat, lon) => {
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
    const forecastUrl = buildUrl(OPEN_METEO_FORECAST_BASE, '', {
      latitude: lat,
      longitude: lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto',
      forecast_days: 7,
    });
    const forecastData = await requestJson(forecastUrl);
    return {
      city: { name: 'Current location' },
      list: forecastData.daily.time.slice(0, 7).map((time, index) => ({
        dt: Math.floor(new Date(time).getTime() / 1000),
        main: { temp: Math.round(forecastData.daily.temperature_2m_max[index]) },
        weather: [{ description: weatherCodeToDescription(forecastData.daily.weather_code[index]), icon: weatherCodeToIcon(forecastData.daily.weather_code[index], 1) }],
      })),
    };
  }

  return requestJson(buildUrl(WEATHER_API_BASE, '/forecast', {
    lat,
    lon,
    appid: WEATHER_API_KEY,
    units: 'metric',
    lang: 'en',
  }));
};

export const fetchCurrentLocationWeather = async (lat, lon) => {
  if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
    return normalizeOpenMeteoWeatherByCoords(lat, lon);
  }

  return requestJson(buildUrl(WEATHER_API_BASE, '/weather', {
    lat,
    lon,
    appid: WEATHER_API_KEY,
    units: 'metric',
    lang: 'en',
  }));
};
