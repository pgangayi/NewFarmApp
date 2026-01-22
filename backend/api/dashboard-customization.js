import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const userId = url.searchParams.get("user_id");

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      // Get dashboard configuration
      const { results: configs } = await env.DB.prepare(
        `
        SELECT 
          dc.*,
          fa.name as farm_name,
          u.name as user_name
        FROM dashboard_configurations dc
        JOIN farms fa ON dc.farm_id = fa.id
        LEFT JOIN users u ON dc.user_id = u.id
        WHERE dc.farm_id = ? AND (dc.user_id = ? OR dc.is_default = 1)
        ORDER BY dc.is_default DESC, dc.updated_at DESC
      `
      )
        .bind(farmId, userId || user.id)
        .all();

      return createSuccessResponse(configs || []);
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        user_id,
        name,
        layout,
        widgets,
        is_default,
        theme,
        settings,
      } = body;

      if (!farm_id || !name || !layout || !widgets) {
        return createErrorResponse(
          "Farm ID, name, layout, and widgets are required",
          400
        );
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      // If setting as default, unset other defaults
      if (is_default) {
        await env.DB.prepare(
          `
          UPDATE dashboard_configurations 
          SET is_default = 0 
          WHERE farm_id = ? AND user_id = ?
        `
        )
          .bind(farm_id, user_id || user.id)
          .run();
      }

      const { results, error: insertError } = await env.DB.prepare(
        `
        INSERT INTO dashboard_configurations (
          farm_id, user_id, name, layout, widgets, is_default, 
          theme, settings, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          farm_id,
          user_id || user.id,
          name,
          JSON.stringify(layout),
          JSON.stringify(widgets),
          is_default ? 1 : 0,
          JSON.stringify(theme || {}),
          JSON.stringify(settings || {}),
          user.id
        )
        .run();

      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create dashboard configuration", 500);
      }

      // Get the created configuration
      const { results: configResults } = await env.DB.prepare(
        `
        SELECT 
          dc.*,
          fa.name as farm_name,
          u.name as user_name
        FROM dashboard_configurations dc
        JOIN farms fa ON dc.farm_id = fa.id
        LEFT JOIN users u ON dc.user_id = u.id
        WHERE dc.rowid = last_insert_rowid()
      `
      ).all();

      return createSuccessResponse(configResults[0]);
    } else if (method === "PUT") {
      const body = await request.json();
      const {
        id,
        name,
        layout,
        widgets,
        is_default,
        theme,
        settings,
      } = body;

      if (!id) {
        return createErrorResponse("Configuration ID required", 400);
      }

      // Get the configuration and check farm access
      const { results: existingConfigs } = await env.DB.prepare(
        `
        SELECT dc.farm_id, dc.user_id
        FROM dashboard_configurations dc
        JOIN farms fa ON dc.farm_id = fa.id
        WHERE dc.id = ? AND fa.owner_id = ?
      `
      )
        .bind(id, user.id)
        .all();

      if (existingConfigs.length === 0) {
        return createErrorResponse(
          "Dashboard configuration not found or access denied",
          404
        );
      }

      const existingConfig = existingConfigs[0];

      // If setting as default, unset other defaults
      if (is_default) {
        await env.DB.prepare(
          `
          UPDATE dashboard_configurations 
          SET is_default = 0 
          WHERE farm_id = ? AND user_id = ? AND id != ?
        `
        )
          .bind(existingConfig.farm_id, existingConfig.user_id, id)
          .run();
      }

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (layout !== undefined) {
        updateFields.push("layout = ?");
        updateValues.push(JSON.stringify(layout));
      }
      if (widgets !== undefined) {
        updateFields.push("widgets = ?");
        updateValues.push(JSON.stringify(widgets));
      }
      if (is_default !== undefined) {
        updateFields.push("is_default = ?");
        updateValues.push(is_default ? 1 : 0);
      }
      if (theme !== undefined) {
        updateFields.push("theme = ?");
        updateValues.push(JSON.stringify(theme));
      }
      if (settings !== undefined) {
        updateFields.push("settings = ?");
        updateValues.push(JSON.stringify(settings));
      }

      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      const { error: updateError } = await env.DB.prepare(
        `
        UPDATE dashboard_configurations 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `
      )
        .bind(...updateValues)
        .run();

      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update dashboard configuration", 500);
      }

      // Get updated configuration
      const { results: configResults } = await env.DB.prepare(
        `
        SELECT 
          dc.*,
          fa.name as farm_name,
          u.name as user_name
        FROM dashboard_configurations dc
        JOIN farms fa ON dc.farm_id = fa.id
        LEFT JOIN users u ON dc.user_id = u.id
        WHERE dc.id = ?
      `
      )
        .bind(id)
        .all();

      return createSuccessResponse(configResults[0]);
    } else if (method === "DELETE") {
      const configId = url.searchParams.get("config_id") || request.params?.id;

      if (!configId) {
        return createErrorResponse("Configuration ID required", 400);
      }

      // Get the configuration and check farm access
      const { results: existingConfigs } = await env.DB.prepare(
        `
        SELECT dc.farm_id, dc.name
        FROM dashboard_configurations dc
        JOIN farms fa ON dc.farm_id = fa.id
        WHERE dc.id = ? AND fa.owner_id = ?
      `
      )
        .bind(configId, user.id)
        .all();

      if (existingConfigs.length === 0) {
        return createErrorResponse(
          "Dashboard configuration not found or access denied",
          404
        );
      }

      const { error: deleteError } = await env.DB.prepare(
        `
        DELETE FROM dashboard_configurations WHERE id = ?
      `
      )
        .bind(configId)
        .run();

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete dashboard configuration", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Dashboard customization API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Dashboard Templates Management
export async function onRequestTemplates(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const role = url.searchParams.get("role");
      const category = url.searchParams.get("category");

      let query = `
        SELECT 
          dt.*,
          u.name as created_by_name
        FROM dashboard_templates dt
        LEFT JOIN users u ON dt.created_by = u.id
        WHERE dt.is_active = 1
      `;
      const params = [];

      if (role) {
        query += " AND JSON_EXTRACT(dt.target_roles, '$') LIKE ?";
        params.push(`%${role}%`);
      }
      if (category) {
        query += " AND dt.category = ?";
        params.push(category);
      }

      query += " ORDER BY dt.name ASC";

      const { results, error } = await env.DB.prepare(query)
        .bind(...params)
        .all();

      if (error) {
        console.error("Templates error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results || []);
    } else if (method === "POST") {
      const body = await request.json();
      const {
        name,
        description,
        category,
        target_roles,
        layout,
        widgets,
        theme,
        settings,
        is_public,
      } = body;

      if (!name || !category || !layout || !widgets) {
        return createErrorResponse(
          "Name, category, layout, and widgets are required",
          400
        );
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO dashboard_templates (
          name, description, category, target_roles, layout, widgets,
          theme, settings, is_public, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          name,
          description || null,
          category,
          JSON.stringify(target_roles || []),
          JSON.stringify(layout),
          JSON.stringify(widgets),
          JSON.stringify(theme || {}),
          JSON.stringify(settings || {}),
          is_public ? 1 : 0,
          user.id
        )
        .run();

      if (error) {
        console.error("Template insert error:", error);
        return createErrorResponse("Failed to create dashboard template", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Dashboard templates API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
