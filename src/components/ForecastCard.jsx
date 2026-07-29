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

const ForecastCard = ({ item }) => {
  const icon = item?.weather?.[0]?.icon ? iconMap[item.weather[0].icon] || '☀️' : '☀️';

  return (
    <article className="forecast-card">
      <p>{new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short' })}</p>
      <span className="forecast-emoji">{icon}</span>
      <h4>{Math.round(item.main.temp)}°C</h4>
      <span>{item.weather[0].description}</span>
    </article>
  );
};

export default ForecastCard;
