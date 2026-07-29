const SearchBar = ({ city, setCity, onSearch, onUseLocation, recentSearches }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(city.trim());
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          🔍
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Search for a city"
          />
        </div>
        <div className="button-row">
          <button type="submit">Search</button>
          <button type="button" onClick={() => onUseLocation()} className="secondary-btn">
            📍 Use My Location
          </button>
        </div>
      </form>

      <div className="recent-searches">
        <span>Recent</span>
        <div className="chips">
          {recentSearches.map((item) => (
            <button key={item} type="button" onClick={() => onSearch(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
