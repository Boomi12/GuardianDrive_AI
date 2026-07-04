import dotenv from 'dotenv';
dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

// weather conditions mapping helper
function parseWeatherCondition(mainText) {
  const main = mainText?.toLowerCase().trim() || 'clear';
  if (main.includes('thunderstorm') || main.includes('storm')) return 'thunderstorm';
  if (main.includes('drizzle') || main.includes('rain')) return 'rain';
  if (main.includes('snow')) return 'snow';
  if (main.includes('fog') || main.includes('mist') || main.includes('haze') || main.includes('smoke')) return 'fog';
  if (main.includes('cloud')) return 'clouds';
  return 'clear';
}

export async function getWeatherData(lat, lng, cityName) {
  if (!OPENWEATHER_API_KEY) {
    // Generate realistic mock weather condition
    // Let's seed this with a simple hash of the name/coordinates so it's consistent per test run
    const seedString = cityName || `${lat},${lng}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const rand = Math.abs(hash) % 100;
    
    let temp = 24 + (Math.abs(hash) % 8); // 24 to 32
    let condition = 'clear';
    let windSpeed = 8 + (Math.abs(hash) % 15); // 8 to 23 km/h
    let desc = 'clear sky';

    // Paris/London: slightly colder
    if (cityName && (cityName.toLowerCase().includes('paris') || cityName.toLowerCase().includes('london'))) {
      temp = 14 + (Math.abs(hash) % 6);
    }

    if (rand < 15) {
      condition = 'rain';
      desc = 'light rain showers';
    } else if (rand < 25) {
      condition = 'clouds';
      desc = 'scattered clouds';
    } else if (rand < 30) {
      condition = 'fog';
      desc = 'patchy dense fog';
    } else if (rand < 33) {
      condition = 'thunderstorm';
      desc = 'severe thunderstorm alert';
    }

    return {
      temperature: temp,
      condition,
      windSpeed,
      description: desc
    };
  }

  try {
    let url = '';
    if (lat !== undefined && lng !== undefined) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else if (cityName) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    } else {
      return { temperature: 24, condition: 'clear', windSpeed: 10, description: 'clear sky' };
    }

    const response = await fetch(url);
    const data = await response.json();
    if (response.ok && data.main && data.weather && data.weather[0]) {
      return {
        temperature: Math.round(data.main.temp),
        condition: parseWeatherCondition(data.weather[0].main),
        windSpeed: data.wind ? Math.round(data.wind.speed * 3.6) : 10, // convert m/s to km/h
        description: data.weather[0].description
      };
    }
    console.error('OpenWeather API Error:', data.message || 'Unknown response');
    return { temperature: 24, condition: 'clear', windSpeed: 10, description: 'clear sky' };
  } catch (err) {
    console.error('Failed to contact OpenWeather:', err);
    return { temperature: 24, condition: 'clear', windSpeed: 10, description: 'clear sky' };
  }
}
