import { AuthUtils } from "./_auth.js";

export class WebSocketHandler {
  constructor(env) {
    this.env = env;
    this.connections = new Map(); // Store active connections by user
    this.heartbeatInterval = 30000; // 30 seconds
  }

  async handleUpgrade(request) {
    const url = new URL(request.url);
    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);

    try {
      const auth = new AuthUtils(this.env);

      // Get token from query params or headers
      const token = this.getAuthToken(request);
      if (!token) {
        server.close(1008, "Authentication required");
        return new Response(null, { status: 101, webSocket: client });
      }

      // Validate user
      const user = await auth.validateUserToken(token);
      if (!user) {
        server.close(1008, "Invalid authentication token");
        return new Response(null, { status: 101, webSocket: client });
      }

      // Handle WebSocket connection
      await this.handleConnection(server, user);
    } catch (error) {
      console.error("WebSocket error:", error);
      server.close(1011, "Internal server error");
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  getAuthToken(request) {
    const url = new URL(request.url);
    return (
      url.searchParams.get("token") ||
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      request.headers.get("X-Auth-Token")
    );
  }

  async handleConnection(ws, user) {
    const userId = user.id;

    // Store connection
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(ws);

    console.log(`WebSocket connected for user ${userId}`);

    // Send initial data
    await this.sendInitialData(ws, userId);

    // Setup heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));
        } catch (error) {
          console.error("Heartbeat error:", error);
          this.cleanupConnection(userId, ws);
          clearInterval(heartbeat);
        }
      } else {
        clearInterval(heartbeat);
      }
    }, this.heartbeatInterval);

    // Handle incoming messages
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleMessage(ws, user, data);
      } catch (error) {
        console.error("Message handling error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
          })
        );
      }
    };

    // Handle close
    ws.onclose = () => {
      clearInterval(heartbeat);
      this.cleanupConnection(userId, ws);
      console.log(`WebSocket disconnected for user ${userId}`);
    };

    // Handle errors
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      clearInterval(heartbeat);
      this.cleanupConnection(userId, ws);
    };
  }

  async sendInitialData(ws, userId) {
    try {
      // Get user's farms
      const farms = await this.getUserFarms(userId);

      ws.send(
        JSON.stringify({
          type: "initial_data",
          data: {
            farms: farms,
            connection_established: true,
            server_time: Date.now(),
          },
        })
      );
    } catch (error) {
      console.error("Error sending initial data:", error);
    }
  }

  async handleMessage(ws, user, data) {
    switch (data.type) {
      case "subscribe_farm":
        await this.subscribeToFarm(ws, user, data.farm_id);
        break;

      case "unsubscribe_farm":
        await this.unsubscribeFromFarm(ws, user, data.farm_id);
        break;

      case "request_dashboard_data":
        await this.sendDashboardData(ws, user, data.farm_id);
        break;

      case "ping":
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          })
        );
    }
  }

  async subscribeToFarm(ws, user, farmId) {
    try {
      // Verify user has access to farm
      const auth = new AuthUtils(this.env);
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Access denied to farm",
          })
        );
        return;
      }

      ws.send(
        JSON.stringify({
          type: "subscription_confirmed",
          farm_id: farmId,
          message: `Subscribed to farm ${farmId} updates`,
        })
      );

      // Send initial dashboard data
      await this.sendDashboardData(ws, user, farmId);
    } catch (error) {
      console.error("Subscription error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to subscribe to farm",
        })
      );
    }
  }

  async unsubscribeFromFarm(ws, user, farmId) {
    ws.send(
      JSON.stringify({
        type: "unsubscription_confirmed",
        farm_id: farmId,
        message: `Unsubscribed from farm ${farmId} updates`,
      })
    );
  }

  async sendDashboardData(ws, user, farmId) {
    try {
      const dashboardData = await this.getDashboardData(farmId);
      ws.send(
        JSON.stringify({
          type: "dashboard_update",
          farm_id: farmId,
          data: dashboardData,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Dashboard data error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch dashboard data",
        })
      );
    }
  }

  async getDashboardData(farmId) {
    // Get updated dashboard data
    const [farms, animals, crops, fields, inventory, tasks, finance] =
      await Promise.all([
        // Farm data
        this.env.DB.prepare(
          `
        SELECT 
          f.*,
          COUNT(DISTINCT a.id) as animal_count,
          COUNT(DISTINCT c.id) as crop_count,
          COUNT(DISTINCT fi.id) as field_count,
          COUNT(DISTINCT t.id) as task_count,
          COALESCE(SUM(CASE WHEN fe.type = 'income' THEN fe.amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN fe.type = 'expense' THEN fe.amount ELSE 0 END), 0) as total_expenses
        FROM farms f
        LEFT JOIN animals a ON f.id = a.farm_id
        LEFT JOIN crops c ON f.id = c.farm_id
        LEFT JOIN fields fi ON f.id = fi.farm_id
        LEFT JOIN tasks t ON f.id = t.farm_id
        LEFT JOIN finance_entries fe ON f.id = fe.farm_id
        WHERE f.id = ?
        GROUP BY f.id
      `
        )
          .bind(farmId)
          .all(),

        // Animal statistics
        this.env.DB.prepare(
          `
        SELECT 
          species,
          COUNT(*) as count,
          COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
          AVG(CASE WHEN current_weight IS NOT NULL THEN current_weight END) as avg_weight
        FROM animals
        WHERE farm_id = ?
        GROUP BY species
      `
        )
          .bind(farmId)
          .all(),

        // Crop statistics
        this.env.DB.prepare(
          `
        SELECT 
          crop_type,
          COUNT(*) as count,
          AVG(expected_yield) as avg_yield,
          COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_count
        FROM crops
        WHERE farm_id = ?
        GROUP BY crop_type
      `
        )
          .bind(farmId)
          .all(),

        // Field utilization
        this.env.DB.prepare(
          `
        SELECT 
          COUNT(*) as total_fields,
          AVG(area_hectares) as avg_area,
          COUNT(CASE WHEN current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields
        FROM fields
        WHERE farm_id = ?
      `
        )
          .bind(farmId)
          .all(),

        // Inventory status
        this.env.DB.prepare(
          `
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_items,
          COALESCE(SUM(qty * unit_cost), 0) as total_value
        FROM inventory_items
        WHERE farm_id = ?
      `
        )
          .bind(farmId)
          .all(),

        // Task overview
        this.env.DB.prepare(
          `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
          COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks
        FROM tasks
        WHERE farm_id = ?
      `
        )
          .bind(farmId)
          .all(),

        // Financial summary
        this.env.DB.prepare(
          `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit
        FROM finance_entries
        WHERE farm_id = ?
          AND date(entry_date) >= date('now', '-30 days')
      `
        )
          .bind(farmId)
          .all(),
      ]);

    return {
      farm: farms[0] || {},
      animals: animals,
      crops: crops,
      fields: fields[0] || {},
      inventory: inventory[0] || {},
      tasks: tasks[0] || {},
      finance: finance[0] || {},
      alerts: await this.getSystemAlerts(farmId),
      insights: await this.generateSystemInsights(farmId),
    };
  }

  async getUserFarms(userId) {
    const result = await this.env.DB.prepare(
      `
      SELECT DISTINCT f.id, f.name, f.location
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE fm.user_id = ?
      ORDER BY f.name
    `
    )
      .bind(userId)
      .all();

    return result;
  }

  async getSystemAlerts(farmId) {
    const alerts = [];

    // Check for overdue tasks
    const overdueTasks = await this.env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM tasks 
      WHERE farm_id = ? AND due_date < date('now') AND status != 'completed'
    `
    )
      .bind(farmId)
      .all();

    if (overdueTasks[0].count > 0) {
      alerts.push({
        type: "warning",
        category: "tasks",
        message: `${overdueTasks[0].count} overdue tasks require attention`,
        count: overdueTasks[0].count,
        timestamp: Date.now(),
      });
    }

    // Check for low stock items
    const lowStock = await this.env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE farm_id = ? AND qty <= reorder_threshold
    `
    )
      .bind(farmId)
      .all();

    if (lowStock[0].count > 0) {
      alerts.push({
        type: "warning",
        category: "inventory",
        message: `${lowStock[0].count} items are running low on stock`,
        count: lowStock[0].count,
        timestamp: Date.now(),
      });
    }

    // Check for unhealthy animals
    const unhealthyAnimals = await this.env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM animals 
      WHERE farm_id = ? AND health_status != 'healthy'
    `
    )
      .bind(farmId)
      .all();

    if (unhealthyAnimals[0].count > 0) {
      alerts.push({
        type: "error",
        category: "animals",
        message: `${unhealthyAnimals[0].count} animals need health attention`,
        count: unhealthyAnimals[0].count,
        timestamp: Date.now(),
      });
    }

    return alerts;
  }

  async generateSystemInsights(farmId) {
    const insights = [];

    // Financial efficiency insight
    const financialData = await this.env.DB.prepare(
      `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM finance_entries
      WHERE farm_id = ? AND date(entry_date) >= date('now', '-30 days')
    `
    )
      .bind(farmId)
      .all();

    const revenue = financialData[0]?.revenue || 0;
    const expenses = financialData[0]?.expenses || 0;
    const profitMargin =
      revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    if (profitMargin < 10) {
      insights.push({
        type: "improvement",
        category: "finance",
        title: "Profit Margin Optimization",
        description:
          "Consider reviewing expenses or increasing revenue streams to improve profitability.",
        impact: "high",
        suggestion:
          "Analyze top expense categories and identify cost reduction opportunities",
        timestamp: Date.now(),
      });
    }

    return insights;
  }

  cleanupConnection(userId, ws) {
    if (this.connections.has(userId)) {
      this.connections.get(userId).delete(ws);
      if (this.connections.get(userId).size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  // Broadcast data to all users subscribed to a farm
  async broadcastToFarm(farmId, data) {
    for (const [userId, connections] of this.connections.entries()) {
      // Check if user has access to this farm
      const auth = new AuthUtils(this.env);
      if (await auth.hasFarmAccess(userId, farmId)) {
        for (const ws of connections) {
          if (ws.readyState === ws.OPEN) {
            try {
              ws.send(
                JSON.stringify({
                  type: "farm_broadcast",
                  farm_id: farmId,
                  data: data,
                  timestamp: Date.now(),
                })
              );
            } catch (error) {
              console.error("Broadcast error:", error);
            }
          }
        }
      }
    }
  }

  // Trigger real-time updates based on database changes
  async triggerRealtimeUpdate(farmId, updateType, data) {
    const update = {
      type: updateType,
      data: data,
      farm_id: farmId,
      timestamp: Date.now(),
    };

    await this.broadcastToFarm(farmId, update);
  }
}
