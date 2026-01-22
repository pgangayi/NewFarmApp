import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authStorage } from '../lib/authStorage';

// Logger utility for consistent logging
const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(message, ...args);
    }
  },
  log: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
};

interface WebSocketMessage {
  type: string;
  data?: unknown;
  farm_id?: string;
  timestamp?: number;
  message?: string;
}

interface WebSocketState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
  } = options;

  const { isAuthenticated } = useAuth();
  const accessToken = authStorage.getToken();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    connectionError: null,
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimer = useRef<number | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated()) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        connectionError: 'Not authenticated',
      }));
      return;
    }

    const token = accessToken;
    if (!token) {
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        connectionError: 'No auth token',
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        connectionStatus: 'connecting',
        connectionError: null,
      }));

      // Get WebSocket URL from current origin
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket?token=${token}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        logger.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
          connectionError: null,
        }));
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatTimer.current = window.setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            sendMessage({ type: 'ping' });
          }
        }, heartbeatInterval);
      };

      ws.current.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));

          // Handle different message types
          switch (message.type) {
            case 'heartbeat':
              // Heartbeat received, connection is alive
              break;
            case 'error':
              logger.error('WebSocket error:', message.message);
              setState(prev => ({
                ...prev,
                connectionError: message.message || 'Unknown error',
              }));
              break;
            case 'initial_data':
              logger.log('Received initial data:', message.data);
              break;
            case 'dashboard_update':
              logger.log('Dashboard update received:', message);
              break;
            case 'farm_broadcast':
              logger.log('Farm broadcast received:', message);
              break;
            default:
              logger.log('Unknown message type:', message.type);
          }
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = event => {
        logger.log('WebSocket closed:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'disconnected',
        }));

        // Clear heartbeat
        if (heartbeatTimer.current) {
          window.clearInterval(heartbeatTimer.current);
          heartbeatTimer.current = null;
        }

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          logger.log(
            `Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`
          );

          reconnectTimer.current = window.setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = error => {
        logger.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          connectionError: 'Connection error',
        }));
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        connectionError: 'Failed to create connection',
      }));
    }
  }, [isAuthenticated, accessToken, maxReconnectAttempts, reconnectInterval, heartbeatInterval]);

  const disconnect = useCallback(() => {
    // Clear unknown pending reconnection
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    // Clear heartbeat
    if (heartbeatTimer.current) {
      window.clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }

    // Close WebSocket
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionStatus: 'disconnected',
    }));
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Subscribe to a specific farm for real-time updates
  const subscribeToFarm = useCallback(
    (farm_id: string) => {
      return sendMessage({
        type: 'subscribe_farm',
        farm_id: farm_id,
      });
    },
    [sendMessage]
  );

  // Unsubscribe from a farm
  const unsubscribeFromFarm = useCallback(
    (farm_id: string) => {
      return sendMessage({
        type: 'unsubscribe_farm',
        farm_id: farm_id,
      });
    },
    [sendMessage]
  );

  // Request dashboard data for a specific farm
  const requestDashboardData = useCallback(
    (farm_id: string) => {
      return sendMessage({
        type: 'request_dashboard_data',
        farm_id: farm_id,
      });
    },
    [sendMessage]
  );

  // Connect on mount if autoConnect is enabled
  useEffect(() => {
    if (autoConnect && isAuthenticated() && accessToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, accessToken, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatTimer.current) {
        window.clearInterval(heartbeatTimer.current);
      }
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    subscribeToFarm,
    unsubscribeFromFarm,
    requestDashboardData,
    isAuthenticated: isAuthenticated(),
  };
}
