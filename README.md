# Weather Forecast Application

A polished, responsive weather forecasting web app built with React, Vite, and the OpenWeatherMap API. Users can search for any city, view current conditions, and browse a multi-day forecast with a modern glassmorphism UI and smooth animations.

## Features

- Search weather by city
- Current temperature, humidity, pressure, wind, visibility, sunrise, and sunset
- 7-day forecast cards
- Recent searches
- Dark and light mode
- Current location support with Geolocation
- Responsive layout for desktop, tablet, and mobile
- Smooth UI animations with Framer Motion

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your API key:
   ```env
   VITE_WEATHER_API_KEY=YOUR_API_KEY
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- src/components — reusable UI components
- src/hooks — weather data hook
- src/pages — app page layout
- src/services — API service layer
- src/styles — application styling

## API Setup

Sign up for a free API key at OpenWeatherMap and place it in the `.env` file.

## Screenshots

Placeholder for screenshots.

## Future Enhancements

- Voice search
- Auto-suggestions
- Weather background changes by conditions
- Saved favorite cities
