const WeatherDetails = ({ weather }) => {
  const details = [
    { label: 'Feels like', value: `${weather?.feelsLike}°C`, icon: '🌡️' },
    { label: 'Humidity', value: `${weather?.humidity}%`, icon: '💧' },
    { label: 'Wind', value: `${weather?.wind} km/h`, icon: '🌬️' },
    { label: 'Visibility', value: `${weather?.visibility} km`, icon: '👁️' },
    { label: 'Pressure', value: `${weather?.pressure} hPa`, icon: '⏱️' },
    { label: 'Sunrise', value: weather?.sunrise, icon: '🌅' },
    { label: 'Sunset', value: weather?.sunset, icon: '🌇' },
  ];

  return (
    <section className="details-card">
      <h3>Weather Details</h3>
      <div className="details-grid">
        {details.map((item) => (
          <div key={item.label} className="detail-item">
            <div className="detail-icon">{item.icon}</div>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeatherDetails;
