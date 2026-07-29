const Navbar = ({ theme, setTheme }) => {
  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">Atmosphere</p>
        <h1>Weather Forecast</h1>
      </div>
      <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  );
};

export default Navbar;
