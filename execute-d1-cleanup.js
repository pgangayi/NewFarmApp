#!/usr/bin/env node

// Direct D1 Database Cleanup Executor
// Executes the cleanup SQL directly against the D1 database
// Date: November 15, 2025

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { execSync } = require("child_process");
const fs = require("fs");

async function executeDatabaseCleanup() {
  console.log("🧹 Starting Database Cleanup Execution...\n");

  try {
    // Read the cleanup SQL
    const cleanupSQL = fs.readFileSync("complete-database-cleanup.sql", "utf8");

    console.log("📋 Executing cleanup SQL script...");
    console.log("This will permanently delete ALL data from the database!");
    console.log("Database: farmers-boot-local");
    console.log("");

    // Method 1: Try using wrangler directly
    try {
      console.log("🔄 Attempting cleanup via Wrangler CLI...");

      // Write SQL to temp file for wrangler
      const tempFile = "temp-cleanup.sql";
      fs.writeFileSync(tempFile, cleanupSQL);

      const command = `cd backend && npx wrangler d1 execute farmers-boot-local --file=../${tempFile} --local`;

      const result = execSync(command, {
        encoding: "utf8",
        stdio: "pipe",
      });

      console.log("✅ Database cleanup completed successfully!");
      console.log("Result:", result);

      // Clean up temp file
      fs.unlinkSync(tempFile);

      return { success: true, method: "wrangler", result };
    } catch (wranglerError) {
      console.log("⚠️  Wrangler execution failed:", wranglerError.message);
      console.log("🔄 Trying alternative method...\n");
    }

    // Method 2: Try Cloudflare API (if available)
    try {
      console.log("🔄 Attempting cleanup via Cloudflare API...");

      // This would require CF_API_TOKEN and CF_API_EMAIL
      // For now, provide manual instructions

      return {
        success: false,
        method: "manual_required",
        reason: "Wrangler CLI not available. Manual execution required.",
        instructions: [
          "1. Go to Cloudflare Dashboard → D1",
          "2. Select database: farmers-boot-local",
          "3. Open Query Editor",
          "4. Copy and paste complete-database-cleanup.sql",
          "5. Execute to clean all data",
        ],
      };
    } catch (apiError) {
      console.log("⚠️  Cloudflare API execution failed:", apiError.message);
    }

    // Method 3: Create batch script for manual execution
    console.log("🔄 Creating batch execution script...");

    const batchScript = `# Database Cleanup Batch Script
# Execute this script to clean the D1 database

echo "🧹 Database Cleanup Script for farmers-boot-local"
echo "=================================================="
echo ""
echo "⚠️  This will permanently delete ALL data!"
echo "📋 Database: farmers-boot-local"
echo ""

# Option 1: Wrangler CLI (if installed)
if command -v wrangler &> /dev/null; then
    echo "🔄 Using Wrangler CLI to execute cleanup..."
    wrangler d1 execute farmers-boot-local --file=complete-database-cleanup.sql --local
    echo "✅ Cleanup completed via Wrangler!"
else
    echo "❌ Wrangler CLI not found"
    echo ""
    echo "Manual execution required:"
    echo "1. Open Cloudflare Dashboard → D1"
    echo "2. Select database: farmers-boot-local"
    echo "3. Open Query Editor"  
    echo "4. Copy and paste the contents of complete-database-cleanup.sql"
    echo "5. Execute to clean all data"
fi

echo ""
echo "🗄️  Database cleanup process completed!"
echo "Check the verification results to confirm cleanup success."
`;

    fs.writeFileSync("cleanup-d1-database.bat", batchScript);
    fs.writeFileSync(
      "cleanup-d1-database.sh",
      batchScript.replace("#!/bin/bash", "#!/bin/bash")
    );

    console.log("✅ Batch scripts created for cleanup execution");
    console.log("   - cleanup-d1-database.bat (Windows)");
    console.log("   - cleanup-d1-database.sh (Unix/Linux/Mac)");

    return {
      success: false,
      method: "scripts_created",
      reason:
        "Direct database execution not available. Scripts created for manual execution.",
      files: ["cleanup-d1-database.bat", "cleanup-d1-database.sh"],
      instructions: [
        "1. Run the appropriate batch script for your system",
        "2. Or manually execute complete-database-cleanup.sql in Cloudflare D1",
        "3. Monitor the output for cleanup progress",
      ],
    };
  } catch (error) {
    console.error("❌ Cleanup execution failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Execute cleanup
executeDatabaseCleanup()
  .then((result) => {
    console.log("\n📊 Cleanup Execution Summary:");
    console.log("=".repeat(50));
    console.log("Success:", result.success);
    console.log("Method:", result.method);

    if (result.success) {
      console.log("🎉 Database has been cleaned successfully!");
    } else {
      console.log("📝 Next steps required:");
      result.instructions?.forEach((instruction, index) => {
        console.log(`   ${index + 1}. ${instruction}`);
      });
    }

    console.log("=".repeat(50));
  })
  .catch(console.error);
