// Fix corrupted user records with null IDs
// Run with: npx wrangler d1 execute farm-management-db --file=backend/fix-user-ids.js

export default {
  async fetch(request, env) {
    const db = env.DB;

    console.log("Checking for users with null IDs...");

    // Find users with null IDs using raw SQL since id is PRIMARY KEY
    const nullIdUsers = await db.prepare(
      "SELECT rowid, email, name FROM users WHERE id IS NULL"
    ).all();

    if (!nullIdUsers.results || nullIdUsers.results.length === 0) {
      console.log("No users with null IDs found.");
      return new Response("No corrupted users found.");
    }

    console.log(`Found ${nullIdUsers.results.length} users with null IDs`);

    // Delete corrupted users since we can't update PRIMARY KEY
    for (const user of nullIdUsers.results) {
      console.log(`Deleting corrupted user: ${user.email} (rowid: ${user.rowid})`);

      await db.prepare("DELETE FROM users WHERE rowid = ?").bind(user.rowid).run();
    }

    console.log("Corrupted users deleted. Users should sign up again with proper IDs.");

    return new Response(`Fixed ${nullIdUsers.results.length} corrupted user records. Please sign up again.`);
  }
};
