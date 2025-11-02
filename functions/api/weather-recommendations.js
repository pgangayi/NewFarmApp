// Weather recommendations engine for farm management
// Provides AI-driven weather-based recommendations and alerts

import { AuthUtils } from './_auth.js';

export async function generateRecommendations(env, farmId, weatherData) {
  try {
    const recommendations = [];
    const alerts = [];

    // Get farm context for personalized recommendations
    const farmQuery = `
      SELECT f.name, f.area_hectares, f.location
      FROM farms f 
      WHERE f.id = ?
    `;
    const { results: farmData } = await env.DB.prepare(farmQuery)
      .bind(farmId)
      .all();

    const farm = farmData[0];

    // Generate recommendations based on weather patterns
    for (let i = 0; i < weatherData.time.length; i++) {
      const date = weatherData.time[i];
      const tempMax = weatherData.temperature_2m_max[i];
      const tempMin = weatherData.temperature_2m_min[i];
      const precipitation = weatherData.precipitation_sum[i];
      const windSpeed = weatherData.wind_speed_10m_max[i] || 0;
      const humidity = weatherData.relative_humidity_2m_mean?.[i] || 50;

      // Temperature-based recommendations
      if (tempMax > 35) {
        recommendations.push({
          type: 'heat_warning',
          severity: 'high',
          date: date,
          title: 'Extreme Heat Expected',
          message: `Temperature reaching ${tempMax}°C. Ensure adequate water supply for animals and consider providing shade.`,
          action_items: [
            'Increase water availability',
            'Monitor animal behavior for heat stress',
            'Consider moving animals to shaded areas',
            'Avoid heavy farm work during peak hours'
          ]
        });
      }

      if (tempMin < 0 && tempMax > 5) {
        recommendations.push({
          type: 'frost_risk',
          severity: 'medium',
          date: date,
          title: 'Frost Risk Alert',
          message: `Freezing temperatures expected (${tempMin}°C). Protect sensitive crops and animals.`,
          action_items: [
            'Cover sensitive plants',
            'Bring animals indoors if possible',
            'Insulate water pipes and tanks',
            'Delay planting frost-sensitive crops'
          ]
        });
      }

      // Precipitation-based recommendations
      if (precipitation > 25) {
        recommendations.push({
          type: 'heavy_rain',
          severity: 'medium',
          date: date,
          title: 'Heavy Rain Expected',
          message: `${precipitation}mm rainfall expected. Take precautions against flooding.`,
          action_items: [
            'Check drainage systems',
            'Move equipment to higher ground',
            'Delay field operations',
            'Monitor soil erosion risk'
          ]
        });
      }

      if (precipitation === 0 && windSpeed > 25) {
        recommendations.push({
          type: 'fire_risk',
          severity: 'medium',
          date: date,
          title: 'High Fire Risk',
          message: `Dry conditions with strong winds (${windSpeed}km/h). Be extra cautious with fire.`,
          action_items: [
            'Postpone controlled burns',
            'Ensure firefighting equipment is ready',
            'Monitor for dry vegetation fires',
            'Avoid welding or other spark-producing activities'
          ]
        });
      }

      // Wind-based recommendations
      if (windSpeed > 45) {
        recommendations.push({
          type: 'high_wind',
          severity: 'high',
          date: date,
          title: 'Strong Winds Warning',
          message: `Wind speeds reaching ${windSpeed}km/h. Secure equipment and avoid working at heights.`,
          action_items: [
            'Secure loose equipment and tools',
            'Avoid working on roofs or ladders',
            'Check animal shelter integrity',
            'Delay helicopter or drone operations'
          ]
        });
      }

      // Humidity-based recommendations
      if (humidity > 85) {
        recommendations.push({
          type: 'high_humidity',
          severity: 'low',
          date: date,
          title: 'High Humidity Conditions',
          message: `Humidity at ${humidity}%. Watch for fungal disease development.`,
          action_items: [
            'Monitor crops for fungal diseases',
            'Improve ventilation in animal housing',
            'Consider preventive fungicide application',
            'Avoid overhead irrigation'
          ]
        });
      }

      // Optimal conditions recommendations
      if (precipitation < 5 && tempMax > 15 && tempMax < 30 && windSpeed < 20) {
        recommendations.push({
          type: 'optimal_conditions',
          severity: 'low',
          date: date,
          title: 'Optimal Farming Conditions',
          message: `Perfect weather for field operations: ${tempMax}°C, light winds, minimal rain.`,
          action_items: [
            'Excellent day for planting',
            'Ideal for crop maintenance',
            'Good for field inspections',
            'Perfect for harvesting dry crops'
          ]
        });
      }
    }

    // Get existing alerts to avoid duplicates
    const existingAlertsQuery = `
      SELECT alert_date, alert_type FROM weather_alerts 
      WHERE farm_id = ? AND alert_date >= date('now')
    `;
    const { results: existingAlerts } = await env.DB.prepare(existingAlertsQuery)
      .bind(farmId)
      .all();

    const existingKey = new Set(existingAlerts.map(a => `${a.alert_date}_${a.alert_type}`));

    // Store new alerts (avoiding duplicates)
    for (const rec of recommendations) {
      const alertKey = `${rec.date}_${rec.type}`;
      if (!existingKey.has(alertKey)) {
        await env.DB.prepare(`
          INSERT INTO weather_alerts (
            farm_id, alert_date, alert_type, severity, title, message, 
            action_items, created_at, acknowledged_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)
        `).bind(
          farmId,
          rec.date,
          rec.type,
          rec.severity,
          rec.title,
          rec.message,
          JSON.stringify(rec.action_items)
        ).run();
      }
    }

    return recommendations;

  } catch (error) {
    console.error('Failed to generate weather recommendations:', error);
    throw error;
  }
}

export function generateSeasonalRecommendations(season, weatherData) {
  const recommendations = [];

  switch (season.toLowerCase()) {
    case 'spring':
      recommendations.push({
        category: 'planting',
        priority: 'high',
        title: 'Spring Planting Season',
        recommendations: [
          'Start soil preparation early',
          'Test soil pH and nutrients',
          'Choose cold-hardy varieties',
          'Prepare seedling trays'
        ]
      });
      break;

    case 'summer':
      recommendations.push({
        category: 'irrigation',
        priority: 'high',
        title: 'Summer Irrigation Management',
        recommendations: [
          'Implement water conservation strategies',
          'Monitor soil moisture regularly',
          'Adjust irrigation timing for heat',
          'Use mulching to retain moisture'
        ]
      });
      break;

    case 'autumn':
      recommendations.push({
        category: 'harvest',
        priority: 'high',
        title: 'Autumn Harvest Preparation',
        recommendations: [
          'Plan harvest schedule around weather',
          'Prepare storage facilities',
          'Monitor crop maturity',
          'Backup power for critical equipment'
        ]
      });
      break;

    case 'winter':
      recommendations.push({
        category: 'maintenance',
        priority: 'medium',
        title: 'Winter Farm Maintenance',
        recommendations: [
          'Service machinery and equipment',
          'Plan next season\'s crop rotation',
          'Weatherproof infrastructure',
          'Maintain animal housing'
        ]
      });
      break;
  }

  return recommendations;
}

export function getWeatherAlertThresholds() {
  return {
    temperature: {
      extreme_heat: 38,
      heat_warning: 35,
      frost_risk: 0,
      freezing: -2
    },
    precipitation: {
      light_rain: 2,
      moderate_rain: 10,
      heavy_rain: 25,
      extreme_rain: 50
    },
    wind: {
      breezy: 20,
      windy: 35,
      strong_winds: 50,
      dangerous_winds: 70
    },
    humidity: {
      dry: 30,
      comfortable: 40,
      humid: 80,
      very_humid: 90
    }
  };
}