// Weather API extension for farm location management and advanced weather features
// Handles farm coordinates updates and advanced weather analytics

import { generateRecommendations } from './weather-recommendations.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Validate JWT authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify and extract user from token
    const { AuthUtils } = await import('./_auth.js');
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    if (method === 'POST') {
      const body = await request.json();
      const { action, farm_id, latitude, longitude, timezone, alert_id } = body;

      switch (action) {
        case 'update_farm_location':
          return await updateFarmLocation(env, userId, farm_id, latitude, longitude, timezone);
        
        case 'acknowledge_alert':
          return await acknowledgeAlert(env, userId, alert_id);
        
        default:
          return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }

    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const days = parseInt(url.searchParams.get('days') || '7');
      
      if (!farmId) {
        return new Response(JSON.stringify({ error: 'Farm ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check user access to farm
      const accessQuery = `
        SELECT id FROM farm_members
        WHERE farm_id = ? AND user_id = ?
      `;
      const { results: farmAccess } = await env.DB.prepare(accessQuery)
        .bind(farmId, userId)
        .all();

      if (!farmAccess || farmAccess.length === 0) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get farm coordinates
      const farmQuery = `
        SELECT latitude, longitude, timezone FROM farms WHERE id = ?
      `;
      const { results: farmData } = await env.DB.prepare(farmQuery)
        .bind(farmId)
        .all();

      if (!farmData || farmData.length === 0) {
        return new Response(JSON.stringify({ error: 'Farm not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const farm = farmData[0];
      
      if (!farm.latitude || !farm.longitude) {
        return new Response(JSON.stringify({ error: 'Farm location not set' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return await getWeatherData(env, farmId, farm.latitude, farm.longitude, farm.timezone, days);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Weather location API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateFarmLocation(env, userId, farmId, latitude, longitude, timezone) {
  // Verify user has access to farm
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env.DB.prepare(accessQuery)
    .bind(farmId, userId)
    .all();

  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update farm coordinates
  const updateQuery = `
    UPDATE farms 
    SET latitude = ?, longitude = ?, timezone = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env.DB.prepare(updateQuery)
    .bind(latitude, longitude, timezone, farmId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to update farm location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Immediately fetch and store weather data for the new location
  try {
    await fetchAndStoreWeatherData(env, farmId, latitude, longitude, timezone);
  } catch (weatherError) {
    console.warn('Failed to fetch initial weather data:', weatherError);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Farm location updated successfully' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function acknowledgeAlert(env, userId, alertId) {
  // Verify user has access to the alert
  const accessQuery = `
    SELECT wa.id FROM weather_alerts wa
    JOIN farm_members fm ON wa.farm_id = fm.farm_id
    WHERE wa.id = ? AND fm.user_id = ?
  `;
  const { results: alertAccess } = await env.DB.prepare(accessQuery)
    .bind(alertId, userId)
    .all();

  if (!alertAccess || alertAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Alert not found or access denied' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mark alert as acknowledged
  const updateQuery = `
    UPDATE weather_alerts 
    SET acknowledged_at = datetime('now')
    WHERE id = ?
  `;
  const result = await env.DB.prepare(updateQuery)
    .bind(alertId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to acknowledge alert' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Alert acknowledged' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getWeatherData(env, farmId, latitude, longitude, timezone, days) {
  // Check if we have recent weather data (less than 6 hours old)
  const recentDataQuery = `
    SELECT data_date FROM weather_data 
    WHERE farm_id = ? AND data_date >= datetime('now', '-6 hours')
    ORDER BY data_date DESC 
    LIMIT 1
  `;
  const { results: recentData } = await env.DB.prepare(recentDataQuery)
    .bind(farmId)
    .all();

  let weatherData;
  
  if (!recentData || recentData.length === 0) {
    // Fetch fresh data from Open-Meteo
    weatherData = await fetchAndStoreWeatherData(env, farmId, latitude, longitude, timezone, days);
  } else {
    // Return cached data
    const cachedQuery = `
      SELECT data_date, temperature_max, temperature_min, temperature_avg,
             precipitation_sum, relative_humidity_max, relative_humidity_min,
             wind_speed_max, wind_speed_avg, et0_fao_evapotranspiration,
             hourly_data
      FROM weather_data 
      WHERE farm_id = ?
      ORDER BY data_date DESC
      LIMIT ?
    `;
    const { results: cached } = await env.DB.prepare(cachedQuery)
      .bind(farmId, days)
      .all();
    
    weatherData = {
      weather: cached.map(day => ({
        ...day,
        hourly_data: day.hourly_data ? JSON.parse(day.hourly_data) : null,
        weather_description: getWeatherDescription(day.precipitation_sum, day.wind_speed_max || 0)
      }))
    };
  }

  return new Response(JSON.stringify(weatherData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function fetchAndStoreWeatherData(env, farmId, latitude, longitude, timezone, days = 7) {
  try {
    const openMeteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
    openMeteoUrl.searchParams.set('latitude', latitude.toString());
    openMeteoUrl.searchParams.set('longitude', longitude.toString());
    openMeteoUrl.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m');
    openMeteoUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_hours,snowfall_sum,wind_speed_10m_max,wind_speed_10m_mean,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration,soil_temperature_0_to_7cm_mean');
    openMeteoUrl.searchParams.set('forecast_days', days.toString());
    openMeteoUrl.searchParams.set('timezone', timezone || 'auto');

    const response = await fetch(openMeteoUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const weatherData = await response.json();
    
    // Process and store daily weather data
    const dailyData = weatherData.daily;
    const hourlyData = weatherData.hourly;
    
    // Store each day's data
    for (let i = 0; i < dailyData.time.length; i++) {
      const dataDate = dailyData.time[i];
      
      const insertQuery = `
        INSERT OR REPLACE INTO weather_data (
          farm_id, data_date, temperature_max, temperature_min, temperature_avg,
          precipitation_sum, precipitation_hours, snowfall_sum,
          wind_speed_max, wind_speed_avg, wind_direction_dominant,
          shortwave_radiation_sum, et0_fao_evapotranspiration,
          soil_temperature_0_to_7cm_mean, hourly_data, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      await env.DB.prepare(insertQuery).bind(
        farmId,
        dataDate,
        dailyData.temperature_2m_max[i],
        dailyData.temperature_2m_min[i],
        dailyData.temperature_2m_mean[i],
        dailyData.precipitation_sum[i],
        dailyData.precipitation_hours[i],
        dailyData.snowfall_sum[i] || 0,
        dailyData.wind_speed_10m_max[i],
        dailyData.wind_speed_10m_mean[i],
        dailyData.wind_direction_10m_dominant[i],
        dailyData.shortwave_radiation_sum[i],
        dailyData.et0_fao_evapotranspiration[i],
        dailyData.soil_temperature_0_to_7cm_mean[i],
        JSON.stringify({
          time: hourlyData.time,
          temperature_2m: hourlyData.temperature_2m,
          relative_humidity_2m: hourlyData.relative_humidity_2m,
          precipitation: hourlyData.precipitation,
          wind_speed_10m: hourlyData.wind_speed_10m
        })
      ).run();
    }

    // Generate recommendations and alerts
    try {
      await generateRecommendations(env, farmId, dailyData);
    } catch (recommendationError) {
      console.warn('Failed to generate recommendations:', recommendationError);
    }

    // Return the processed data
    return {
      weather: dailyData.time.map((date, index) => ({
        data_date: date,
        temperature_max: dailyData.temperature_2m_max[index],
        temperature_min: dailyData.temperature_2m_min[index],
        temperature_avg: dailyData.temperature_2m_mean[index],
        precipitation_sum: dailyData.precipitation_sum[index],
        precipitation_hours: dailyData.precipitation_hours[index],
        wind_speed_max: dailyData.wind_speed_10m_max[index],
        wind_speed_avg: dailyData.wind_speed_10m_mean[index],
        wind_direction_dominant: dailyData.wind_direction_10m_dominant[index],
        relative_humidity_max: dailyData.relative_humidity_2m_max?.[index] || null,
        relative_humidity_min: dailyData.relative_humidity_2m_min?.[index] || null,
        et0_fao_evapotranspiration: dailyData.et0_fao_evapotranspiration[index],
        soil_temperature_0_to_7cm_mean: dailyData.soil_temperature_0_to_7cm_mean[index],
        weather_description: getWeatherDescription(dailyData.precipitation_sum[index], dailyData.wind_speed_10m_max[index])
      }))
    };

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
}

function getWeatherDescription(precipitation, windSpeed) {
  if (precipitation > 10) return 'Heavy rain';
  if (precipitation > 5) return 'Rain';
  if (precipitation > 0) return 'Light rain';
  if (windSpeed > 30) return 'Windy';
  return 'Clear';
}