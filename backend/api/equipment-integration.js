// Equipment Integration API
// Connects with farm equipment APIs for data synchronization and control

import { createSuccessResponse, createErrorResponse } from './_auth.js';

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Route handling
  if (path === '/api/equipment/connect' && method === 'POST') {
    return await connectEquipment(request, env);
  } else if (path === '/api/equipment/sync' && method === 'POST') {
    return await syncEquipmentData(request, env);
  } else if (path === '/api/equipment/telemetry' && method === 'GET') {
    return await getEquipmentTelemetry(request, env);
  } else if (path === '/api/equipment/commands' && method === 'POST') {
    return await sendEquipmentCommand(request, env);
  } else if (path === '/api/equipment/providers' && method === 'GET') {
    return await getSupportedProviders(request, env);
  } else {
    return createErrorResponse('Equipment integration endpoint not found', 404);
  }
}

async function connectEquipment(request, env) {
  try {
    const { provider, equipmentId, authToken, farmId } = await request.json();

    if (!provider || !equipmentId || !authToken) {
      return createErrorResponse('Provider, equipment ID, and auth token are required', 400);
    }

    // Validate provider
    const supportedProviders = ['john-deere', 'agco', 'case-ih', 'new-holland', 'claas'];
    if (!supportedProviders.includes(provider.toLowerCase())) {
      return createErrorResponse(`Unsupported provider: ${provider}`, 400);
    }

    // In a real implementation, this would:
    // 1. Validate the auth token with the provider's API
    // 2. Establish a connection and get equipment details
    // 3. Store connection credentials securely
    // 4. Set up webhooks for real-time data

    // Mock connection response
    const connectionResult = {
      provider: provider.toLowerCase(),
      equipmentId,
      connectionId: `conn_${Date.now()}`,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      equipment: {
        model: 'John Deere 8R 250',
        year: 2022,
        capabilities: ['GPS', 'Auto-steer', 'Yield monitoring', 'Variable rate application'],
        lastSync: new Date().toISOString()
      }
    };

    return createSuccessResponse(connectionResult);
  } catch (error) {
    console.error('Equipment connection error:', error);
    return createErrorResponse('Failed to connect equipment', 500);
  }
}

async function syncEquipmentData(request, env) {
  try {
    const { connectionId, dataTypes } = await request.json();

    if (!connectionId) {
      return createErrorResponse('Connection ID is required', 400);
    }

    // Mock sync data
    const syncResult = {
      connectionId,
      syncedAt: new Date().toISOString(),
      dataTypes: dataTypes || ['telemetry', 'operations', 'maintenance'],
      recordsSynced: {
        telemetry: 145,
        operations: 23,
        maintenance: 5
      },
      status: 'completed'
    };

    return createSuccessResponse(syncResult);
  } catch (error) {
    console.error('Equipment sync error:', error);
    return createErrorResponse('Failed to sync equipment data', 500);
  }
}

async function getEquipmentTelemetry(request, env) {
  try {
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');
    const hours = parseInt(url.searchParams.get('hours')) || 24;

    if (!connectionId) {
      return createErrorResponse('Connection ID is required', 400);
    }

    // Mock telemetry data
    const telemetry = {
      connectionId,
      timeRange: `${hours} hours`,
      data: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          location: { lat: -33.8688, lng: 151.2093 },
          engine: { rpm: 2200, temperature: 85, fuelLevel: 75 },
          implements: { depth: 6, speed: 8.5, areaCovered: 2.3 }
        },
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          location: { lat: -33.8708, lng: 151.2113 },
          engine: { rpm: 2100, temperature: 82, fuelLevel: 70 },
          implements: { depth: 6, speed: 8.2, areaCovered: 4.1 }
        }
      ],
      summary: {
        totalDistance: 12.5,
        totalArea: 8.2,
        avgSpeed: 8.3,
        fuelUsed: 45.2
      }
    };

    return createSuccessResponse(telemetry);
  } catch (error) {
    console.error('Equipment telemetry error:', error);
    return createErrorResponse('Failed to fetch equipment telemetry', 500);
  }
}

async function sendEquipmentCommand(request, env) {
  try {
    const { connectionId, command, parameters } = await request.json();

    if (!connectionId || !command) {
      return createErrorResponse('Connection ID and command are required', 400);
    }

    // Validate command
    const validCommands = ['start_operation', 'stop_operation', 'adjust_depth', 'set_speed', 'emergency_stop'];
    if (!validCommands.includes(command)) {
      return createErrorResponse(`Invalid command: ${command}`, 400);
    }

    // Mock command execution
    const commandResult = {
      connectionId,
      command,
      parameters,
      status: 'executed',
      executedAt: new Date().toISOString(),
      response: {
        success: true,
        message: `Command '${command}' executed successfully`
      }
    };

    return createSuccessResponse(commandResult);
  } catch (error) {
    console.error('Equipment command error:', error);
    return createErrorResponse('Failed to send equipment command', 500);
  }
}

async function getSupportedProviders(request, env) {
  try {
    const providers = [
      {
        id: 'john-deere',
        name: 'John Deere',
        apiVersion: '2.0',
        capabilities: ['GPS', 'Auto-steer', 'Yield monitoring', 'Field operations'],
        authType: 'OAuth2',
        documentation: 'https://developer.deere.com/'
      },
      {
        id: 'agco',
        name: 'AGCO',
        apiVersion: '1.5',
        capabilities: ['Equipment monitoring', 'Maintenance tracking', 'Fuel management'],
        authType: 'API Key',
        documentation: 'https://api.agco.com/'
      },
      {
        id: 'case-ih',
        name: 'Case IH',
        apiVersion: '3.0',
        capabilities: ['Precision farming', 'Data analytics', 'Remote diagnostics'],
        authType: 'OAuth2',
        documentation: 'https://developer.caseih.com/'
      }
    ];

    return createSuccessResponse({ providers });
  } catch (error) {
    console.error('Supported providers error:', error);
    return createErrorResponse('Failed to fetch supported providers', 500);
  }
}

export async function onRequest(context) {
  return handleRequest(context.request, context.env);
}