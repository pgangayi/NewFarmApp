// Real-time data hook for WebSocket-based live updates
// Eliminates manual refresh needs and provides instant data updates

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketOptions {
  onMessage?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealtimeData {
  type: string;
  data: unknown;
  timestamp: string;
  farm_id?: string;
}

export function useRealtimeData(farmId: string, options: WebSocketOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const queryClient = useQueryClient();

  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/dashboard/${farmId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.onmessage = event => {
        try {
          const data: RealtimeData = JSON.parse(event.data);
          console.log('Real-time data received:', data);

          setLastUpdate(new Date());

          // Update React Query cache based on data type
          if (data.type === 'dashboard_update') {
            queryClient.setQueryData(['dashboard', farmId], data.data);
          } else if (data.type === 'inventory_update') {
            queryClient.setQueryData(['inventory'], data.data);
          } else if (data.type === 'task_update') {
            queryClient.setQueryData(['tasks'], data.data);
          } else if (data.type === 'animal_update') {
            queryClient.setQueryData(['animals'], data.data);
          } else if (data.type === 'crop_update') {
            queryClient.setQueryData(['crops'], data.data);
          } else if (data.type === 'weather_update') {
            queryClient.setQueryData(['weather', farmId], data.data);
          }

          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = event => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(
            `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const sendMessage = (data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (farmId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [farmId]);

  return {
    connectionStatus,
    lastUpdate,
    sendMessage,
    connect,
    disconnect,
  };
}

// Specific hooks for different data types
export function useRealtimeDashboard(farmId: string) {
  const { connectionStatus, lastUpdate, ...rest } = useRealtimeData(farmId);

  return {
    connectionStatus,
    lastUpdate,
    ...rest,
  };
}

export function useRealtimeInventory() {
  const [inventoryUpdates, setInventoryUpdates] = useState<unknown[]>([]);

  const { connectionStatus, lastUpdate } = useRealtimeData('global', {
    onMessage: (data: any) => {
      if (data.type === 'inventory_update') {
        setInventoryUpdates(prev => [...prev, data].slice(-10)); // Keep last 10 updates
      }
    },
  });

  return {
    connectionStatus,
    lastUpdate,
    inventoryUpdates,
  };
}

export function useRealtimeTasks() {
  const [taskUpdates, setTaskUpdates] = useState<unknown[]>([]);

  const { connectionStatus, lastUpdate } = useRealtimeData('global', {
    onMessage: (data: any) => {
      if (data.type === 'task_update') {
        setTaskUpdates(prev => [...prev, data].slice(-10));
      }
    },
  });

  return {
    connectionStatus,
    lastUpdate,
    taskUpdates,
  };
}
