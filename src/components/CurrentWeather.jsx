const iconMap = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌦️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
};

const CurrentWeather = ({ weather }) => {
  const icon = weather?.icon ? iconMap[weather.icon] || '☀️' : '☀️';

  return (
    <section className="current-weather-card">
      <div className="current-main">
        <div>
          <p className="eyebrow">Now</p>
          <h2>{weather?.name}, {weather?.country}</h2>
          <p className="weather-description">{weather?.description}</p>
        </div>
        <div className="weather-icon-wrap">
          <span className="weather-emoji">{icon}</span>
        </div>
      </div>
      <div className="temperature-row">
        <div>
          <h3>{weather?.temp}°C</h3>
          <p>Feels like {weather?.feelsLike}°C</p>
        </div>
        <div className="pill">Updated just now</div>
      </div>
    </section>
  );
};

export default CurrentWeather;
