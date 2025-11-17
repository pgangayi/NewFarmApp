// Simple, working signup endpoint for debugging - MIGRATED to DatabaseOperations
import { AuthUtils, createErrorResponse } from "../_auth.js";
import {
  DatabaseOperations,
  UserRepository,
  DB_ERROR_CODES,
} from "../_database.js";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  const { request, env } = context;

  // Initialize database operations
  const db = new DatabaseOperations(env);
  const userRepo = new UserRepository(db);

  try {
    // Parse request body
    const { email, password, name } = await request.json();

    console.log("=== SIMPLE SIGNUP DEBUG ===");
    console.log("Request data:", {
      email,
      name,
      passwordLength: password?.length,
    });

    // Basic validation
    if (!email || !password || !name) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({
          error: "Email, password, and name are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize auth utilities
    const auth = new AuthUtils(env);

    // Check if user already exists using UserRepository
    console.log("Checking for existing user...");
    let existingUsers = null;
    try {
      const result = await userRepo.findByEmail(email, { userId: "system" });
      if (result && result.data && result.data.length > 0) {
        existingUsers = result.data;
      }
    } catch (error) {
      if (error.code !== DB_ERROR_CODES.NOT_FOUND) {
        console.error("Error checking existing user:", error);
        return createErrorResponse("Database error", 500);
      }
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log("User already exists");
      return new Response(
        JSON.stringify({
          error: "User already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate user ID
    const userId = `simple_user_${Date.now()}`;
    console.log("Generated user ID:", userId);

    // Hash password
    console.log("Hashing password...");
    const passwordHash = await auth.hashPassword(password);
    console.log("Password hash length:", passwordHash?.length);

    // Prepare user data
    const userData = {
      id: userId,
      email,
      name,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create user using UserRepository
    console.log("Inserting user into database...");
    let createResult;
    try {
      createResult = await userRepo.createUser(userData, { userId: "system" });
    } catch (error) {
      console.error("Error creating user:", error);
      return createErrorResponse("Failed to create user", 500);
    }

    if (!createResult || !createResult.data) {
      console.error("User creation failed verification");
      return new Response(
        JSON.stringify({
          error: "User creation failed verification",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("User successfully inserted");
    const createdUser = createResult.data[0];

    // Verify by querying back using UserRepository
    console.log("Verifying user creation...");
    let verifyResult = null;
    try {
      const result = await userRepo.findById(userId, { userId: "system" });
      if (result && result.data && result.data.length > 0) {
        verifyResult = result.data[0];
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      return createErrorResponse("Database error", 500);
    }

    if (!verifyResult) {
      console.error("User not found after insertion!");
      return new Response(
        JSON.stringify({
          error: "User creation failed verification",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("User verified successfully");

    // Generate JWT token
    const token = auth.generateToken(userId, email);
    console.log("Token generated:", token?.substring(0, 20) + "...");

    // Create response data (exclude sensitive fields)
    const { password_hash, ...userWithoutPassword } = createdUser;
    const userDataResponse = {
      id: userId,
      email: createdUser.email,
      name: createdUser.name,
      created_at: createdUser.created_at,
    };

    console.log("=== SIMPLE SIGNUP SUCCESS ===");
    console.log("Returning success response");

    // Return success response with correct format
    return new Response(
      JSON.stringify({
        user: userDataResponse,
        token: token,
        message: "User created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== SIMPLE SIGNUP ERROR ===");
    console.error("Error details:", error);
    console.error("Stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error: " + error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
