// Farm Worker Invitation System
// Handles inviting workers to specific farms

import { SimpleAuth, createErrorResponse, createSuccessResponse } from "../_auth.js";
import { EmailService } from "../_email.js";
import { SimpleUserRepository } from "./_session-response.js";

export async function onRequestSendInvite(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);

  try {
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { email, farm_id, role = 'worker', message } = body;

    if (!email || !farm_id) {
      return createErrorResponse("Email and farm ID are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Validate role
    const validRoles = ['owner', 'manager', 'worker', 'member'];
    if (!validRoles.includes(role)) {
      return createErrorResponse("Invalid role", 400);
    }

    // Check if user has permission to invite to this farm
    const farmAccess = await env.DB.prepare(`
      SELECT * FROM farm_members 
      WHERE farm_id = ? AND user_id = ? AND role IN ('owner', 'manager')
    `).bind(farm_id, user.id).first();

    if (!farmAccess) {
      return createErrorResponse("You don't have permission to invite users to this farm", 403);
    }

    // Get farm details
    const farm = await env.DB.prepare(`
      SELECT * FROM farms WHERE id = ?
    `).bind(farm_id).first();

    if (!farm) {
      return createErrorResponse("Farm not found", 404);
    }

    // Check if user is already a member
    const existingMember = await env.DB.prepare(`
      SELECT * FROM farm_members 
      WHERE farm_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)
    `).bind(farm_id, email.toLowerCase().trim()).first();

    if (existingMember) {
      return createErrorResponse("User is already a member of this farm", 400);
    }

    // Check for existing pending invitation
    const existingInvite = await env.DB.prepare(`
      SELECT * FROM farm_invites 
      WHERE farm_id = ? AND email = ? AND status = 'pending' AND expires_at > ?
    `).bind(farm_id, email.toLowerCase().trim(), new Date().toISOString()).first();

    if (existingInvite) {
      return createErrorResponse("Invitation already sent", 400);
    }

    // Generate invitation token
    const inviteToken = auth.generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation
    await env.DB.prepare(`
      INSERT INTO farm_invites (farm_id, email, role, message, token, expires_at, created_at, invited_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      farm_id,
      email.toLowerCase().trim(),
      role,
      message || '',
      inviteToken,
      expiresAt.toISOString(),
      new Date().toISOString(),
      user.id
    ).run();

    // Send invitation email
    const emailService = new EmailService(env);
    await emailService.sendFarmInviteEmail(
      email.toLowerCase().trim(),
      inviteToken,
      farm.farm_name,
      user.name,
      role
    );

    return createSuccessResponse({ 
      message: "Invitation sent successfully",
      email: email.toLowerCase().trim(),
      farm_name: farm.farm_name,
      role: role
    });

  } catch (error) {
    console.error("Send invite error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestAcceptInvite(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);

  try {
    const body = await request.json();
    const { token, user_id } = body;

    if (!token) {
      return createErrorResponse("Invitation token is required", 400);
    }

    // Find and validate invitation
    const invite = await env.DB.prepare(`
      SELECT fi.*, f.farm_name, u.name as inviter_name
      FROM farm_invites fi
      JOIN farms f ON fi.farm_id = f.id
      LEFT JOIN users u ON fi.invited_by = u.id
      WHERE fi.token = ? AND fi.expires_at > ? AND fi.status = 'pending'
    `).bind(token, new Date().toISOString()).first();

    if (!invite) {
      return createErrorResponse("Invalid or expired invitation", 400);
    }

    let userId = user_id;

    // If user_id not provided, check if user exists by email
    if (!userId) {
      const existingUser = await userRepo.findByEmail(invite.email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return createErrorResponse("User not found. Please create an account first.", 404);
      }
    }

    // Check if user is already a member
    const existingMember = await env.DB.prepare(`
      SELECT * FROM farm_members WHERE farm_id = ? AND user_id = ?
    `).bind(invite.farm_id, userId).first();

    if (existingMember) {
      return createErrorResponse("User is already a member of this farm", 400);
    }

    // Add user to farm members
    await env.DB.prepare(`
      INSERT INTO farm_members (farm_id, user_id, role, joined_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      invite.farm_id,
      userId,
      invite.role,
      new Date().toISOString()
    ).run();

    // Mark invitation as accepted
    await env.DB.prepare(`
      UPDATE farm_invites SET status = 'accepted', accepted_at = ?, accepted_by = ?
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      userId,
      invite.id
    ).run();

    // Log audit event
    await auth.logAuditEvent(
      userId,
      "farm_invite_accepted",
      invite.farm_id,
      null,
      auth.getClientIP(request),
      true
    );

    return createSuccessResponse({ 
      message: "Invitation accepted successfully",
      farm_name: invite.farm_name,
      role: invite.role
    });

  } catch (error) {
    console.error("Accept invite error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestListInvites(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);

  try {
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const farmId = url.searchParams.get("farm_id");
    const status = url.searchParams.get("status") || "pending";

    if (!farmId) {
      return createErrorResponse("Farm ID is required", 400);
    }

    // Check if user has permission to view invites for this farm
    const farmAccess = await env.DB.prepare(`
      SELECT * FROM farm_members 
      WHERE farm_id = ? AND user_id = ? AND role IN ('owner', 'manager')
    `).bind(farmId, user.id).first();

    if (!farmAccess) {
      return createErrorResponse("You don't have permission to view invitations for this farm", 403);
    }

    // Get invitations
    const invites = await env.DB.prepare(`
      SELECT fi.*, u.name as inviter_name
      FROM farm_invites fi
      LEFT JOIN users u ON fi.invited_by = u.id
      WHERE fi.farm_id = ? AND fi.status = ?
      ORDER BY fi.created_at DESC
    `).bind(farmId, status).all();

    return createSuccessResponse(invites.results || []);

  } catch (error) {
    console.error("List invites error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestRevokeInvite(context) {
  const { request, env } = context;

  if (request.method !== "DELETE") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);

  try {
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const inviteId = url.searchParams.get("id");

    if (!inviteId) {
      return createErrorResponse("Invite ID is required", 400);
    }

    // Get invitation details and check permissions
    const invite = await env.DB.prepare(`
      SELECT fi.*, f.owner_id
      FROM farm_invites fi
      JOIN farms f ON fi.farm_id = f.id
      WHERE fi.id = ?
    `).bind(inviteId).first();

    if (!invite) {
      return createErrorResponse("Invitation not found", 404);
    }

    // Check if user has permission (farm owner or manager who sent the invite)
    const hasPermission = invite.owner_id === user.id || invite.invited_by === user.id;
    
    if (!hasPermission) {
      const managerCheck = await env.DB.prepare(`
        SELECT * FROM farm_members 
        WHERE farm_id = ? AND user_id = ? AND role = 'manager'
      `).bind(invite.farm_id, user.id).first();
      
      if (!managerCheck) {
        return createErrorResponse("You don't have permission to revoke this invitation", 403);
      }
    }

    // Revoke invitation
    await env.DB.prepare(`
      UPDATE farm_invites SET status = 'revoked', revoked_at = ?, revoked_by = ?
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      user.id,
      inviteId
    ).run();

    // Log audit event
    await auth.logAuditEvent(
      user.id,
      "farm_invite_revoked",
      invite.farm_id,
      null,
      auth.getClientIP(request),
      true
    );

    return createSuccessResponse({ 
      message: "Invitation revoked successfully"
    });

  } catch (error) {
    console.error("Revoke invite error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestMyInvites(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);

  try {
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // Get user's pending invitations
    const invites = await env.DB.prepare(`
      SELECT fi.*, f.farm_name, u.name as inviter_name
      FROM farm_invites fi
      JOIN farms f ON fi.farm_id = f.id
      LEFT JOIN users u ON fi.invited_by = u.id
      WHERE fi.email = ? AND fi.status = 'pending' AND fi.expires_at > ?
      ORDER BY fi.created_at DESC
    `).bind(user.email, new Date().toISOString()).all();

    return createSuccessResponse(invites.results || []);

  } catch (error) {
    console.error("My invites error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
