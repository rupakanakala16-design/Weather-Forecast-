import CurrentWeather from '../components/CurrentWeather';
import ErrorMessage from '../components/ErrorMessage';
import ForecastCard from '../components/ForecastCard';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import WeatherDetails from '../components/WeatherDetails';
import { useWeather } from '../hooks/useWeather';

const Home = () => {
  const { city, weather, forecast, loading, error, recentSearches, theme, setTheme, loadWeather, getCurrentLocationWeather, setCity } = useWeather();

  return (
    <div className="app-shell">
      <Navbar theme={theme} setTheme={setTheme} />
      <main className="main-content">
        <SearchBar
          city={city}
          setCity={setCity}
          onSearch={(value) => loadWeather(value)}
          onUseLocation={() => getCurrentLocationWeather()}
          recentSearches={recentSearches}
        />

        {loading && <Loader />}
        {error && <ErrorMessage message={error} />}

        {!loading && !error && weather && (
          <>
            <CurrentWeather weather={weather} />
            <WeatherDetails weather={weather} />

            <section className="section-card">
              <div className="section-heading">
                <h3>Today&apos;s Forecast</h3>
                <p>Hourly outlook at a glance</p>
              </div>
              <div className="forecast-row">
                {forecast.slice(0, 4).map((item) => (
                  <ForecastCard key={item.dt} item={item} />
                ))}
              </div>
            </section>

            <section className="section-card">
              <div className="section-heading">
                <h3>7-Day Forecast</h3>
                <p>Plan ahead with a full-week snapshot</p>
              </div>
              <div className="forecast-row">
                {forecast.map((item) => (
                  <ForecastCard key={item.dt} item={item} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
