import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../_auth.js";
import { DatabaseOperations } from "../_database.js";
import { FinanceRepository } from "../repositories/finance-repository.js";

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  try {
    // Initialize AuthUtils
    const auth = new AuthUtils(env);

    // Get user from token
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Initialize DatabaseOperations and FinanceRepository
    const db = new DatabaseOperations(env);
    const financeRepo = new FinanceRepository(db);

    if (method === "GET") {
      // List finance entries for user's farms
      try {
        const financeEntries = await financeRepo.findByUserAccess(
          user.id,
          {},
          {
            sortBy: "entry_date",
            sortDirection: "DESC",
          }
        );
        return createSuccessResponse(financeEntries || []);
      } catch (error) {
        console.error("Database error:", error);
        return createErrorResponse("Database error", 500);
      }
    } else if (method === "POST") {
      // Create finance entry
      const body = await request.json();

      if (!body.farm_id || !body.type || !body.amount) {
        return createErrorResponse("Farm ID, type, and amount required", 400);
      }

      try {
        const newEntry = await financeRepo.createTransaction(body, user.id);
        return createSuccessResponse(newEntry);
      } catch (error) {
        console.error("Create transaction error:", error);
        return createErrorResponse(error.message, 500);
      }
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Finance entries API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
