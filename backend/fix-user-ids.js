// Fix corrupted user records with null IDs
// Run with: npx wrangler d1 execute farm-management-db --file=backend/fix-user-ids.js

import { DatabaseOperations } from "./api/_database.js";

export async function fixUserIds(env) {
  const db = new DatabaseOperations(env);

  console.log("Checking for users with null IDs...");

  // Find users with null IDs
  const nullIdUsers = await db.findMany("users", { id: null });

  if (nullIdUsers.length === 0) {
    console.log("No users with null IDs found.");
    return;
  }

  console.log(`Found ${nullIdUsers.length} users with null IDs`);

  for (const user of nullIdUsers) {
    const newId = crypto.randomUUID();
    console.log(`Updating user ${user.email} with new ID: ${newId}`);

    await db.updateById(
      "users",
      user.rowid || user.email,
      { id: newId },
      {
        userId: "system",
        skipRateLimit: true,
      }
    );
  }

  console.log("User ID fix completed.");
}

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // This would be run directly, but we need env
  console.log("Run this script via wrangler d1 execute");
}
