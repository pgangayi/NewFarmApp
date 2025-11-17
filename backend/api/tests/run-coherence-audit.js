// Coherence Audit Runner
// Runs the Phase 4 comprehensive test suite to verify system coherence

import { Phase4TestRunner } from "./phase4-comprehensive-test-suite.js";

async function runCoherenceAudit() {
  console.log("🔍 Starting Coherence Audit...\n");

  try {
    const testRunner = new Phase4TestRunner();
    const results = await testRunner.runAllTests();

    console.log("\n✅ Coherence Audit Complete");
    console.log(`Status: ${results.summary.status}`);
    console.log(`Pass Rate: ${results.summary.pass_rate}%`);
    console.log(`Total Tests: ${results.summary.total_tests}`);
    console.log(`Duration: ${results.summary.duration_formatted}`);

    if (results.summary.status === "PASSED") {
      console.log("\n🎉 System coherence verified - all tests passed!");
      process.exit(0);
    } else {
      console.log("\n⚠️ Coherence issues detected - review failed tests above");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Coherence audit failed:", error);
    process.exit(1);
  }
}

runCoherenceAudit();
