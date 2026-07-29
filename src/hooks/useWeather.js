import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CITY, RECENT_SEARCHES_LIMIT } from '../constants';
import { fetchCurrentLocationWeather, fetchCurrentWeather, fetchForecast, fetchForecastByCoords, searchLocation } from '../services/weatherApi';

const getStoredSearches = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  } catch {
    return [];
  }
};

const saveStoredSearches = (items) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('recentSearches', JSON.stringify(items));
  }
};

export const useWeather = () => {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState(getStoredSearches);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('weather-theme') || 'dark';
  });

  const applyWeatherResponse = (weatherResponse, forecastResponse) => {
    const dailyForecast = Array.isArray(forecastResponse?.list)
      ? forecastResponse.list.filter((_, index) => index % 8 === 0).slice(0, 7)
      : [];

    setWeather(weatherResponse);
    setForecast(dailyForecast);
    setCity(weatherResponse.displayName || weatherResponse.name);

    setRecentSearches((prev) => {
      const nextSearch = weatherResponse.displayName || weatherResponse.name;
      const nextSearches = [nextSearch, ...prev.filter((item) => item !== nextSearch)].slice(0, RECENT_SEARCHES_LIMIT);
      saveStoredSearches(nextSearches);
      return nextSearches;
    });
  };

  const getCurrentLocationWeather = async () => {
    if (typeof window === 'undefined') return;

    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      setError('Geolocation is only available on HTTPS or localhost.');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);

    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => reject(new Error('Unable to detect your location.')), 10000);
        navigator.geolocation.getCurrentPosition(
          (geoPosition) => {
            window.clearTimeout(timeoutId);
            resolve(geoPosition);
          },
          (geoError) => {
            window.clearTimeout(timeoutId);
            if (geoError.code === 1) {
              reject(new Error('Location permission denied.'));
            } else if (geoError.code === 2) {
              reject(new Error('Unable to detect your location.'));
            } else if (geoError.code === 3) {
              reject(new Error('Location request timed out.'));
            } else {
              reject(new Error('Unable to fetch weather for your location.'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      });

      const { latitude, longitude } = position.coords;
      const locationInfo = {
        name: 'Current location',
        state: '',
        country: '',
        displayName: 'Current location',
      };

      const weatherResponse = await fetchCurrentLocationWeather(latitude, longitude);
      const forecastResponse = await fetchForecastByCoords(latitude, longitude);

      applyWeatherResponse({ ...weatherResponse, ...locationInfo }, forecastResponse);
    } catch (err) {
      console.error('Geolocation error:', err);
      setError(err.message || 'Unable to fetch weather for your location.');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async (searchCity, useLocation = false) => {
    const normalizedCity = (searchCity || '').trim();
    if (!normalizedCity && !useLocation) {
      setError('Please enter a location.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);

    try {
      let weatherResponse;
      if (useLocation) {
        await getCurrentLocationWeather();
        return;
      }

      const locationInfo = await searchLocation(normalizedCity);
      weatherResponse = await fetchCurrentWeather(locationInfo.lat, locationInfo.lon, locationInfo);
      const forecastResponse = await fetchForecast(locationInfo.lat, locationInfo.lon, locationInfo);

      applyWeatherResponse(weatherResponse, forecastResponse);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Unable to fetch weather data.');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(DEFAULT_CITY);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('weather-theme', theme);
  }, [theme]);

  const currentWeather = useMemo(() => {
    if (!weather) return null;
    return {
      temp: Math.round(weather.main.temp),
      feelsLike: Math.round(weather.main.feels_like),
      humidity: weather.main.humidity,
      pressure: weather.main.pressure,
      wind: Math.round(weather.wind.speed),
      visibility: Math.round(weather.visibility / 1000),
      sunrise: new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: weather.weather[0].description,
      icon: weather.weather[0].icon,
      country: weather.sys.country,
      name: weather.name,
      state: weather.state,
      country: weather.country,
      displayName: weather.displayName,
    };
  }, [weather]);

  return {
    city,
    weather: currentWeather,
    forecast,
    loading,
    error,
    recentSearches,
    theme,
    setTheme,
    loadWeather,
    getCurrentLocationWeather,
    setCity,
  };
};
