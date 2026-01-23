#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

function spawnProcess(command, args, opts = {}) {
  const p = spawn(command, args, { stdio: "inherit", shell: true, ...opts });
  p.on("error", (err) => console.error(`Failed to start ${command}:`, err));
  return p;
}

const BACKEND_PORT =
  process.env.BACKEND_PORT || process.env.BACKEND_PORT_DEFAULT || "8787";
const FRONTEND_PORT = process.env.FRONTEND_PORT || process.env.PORT || "3000";

// Start Wrangler dev (Cloudflare Workers)
console.log(`Starting Wrangler dev (backend) on port ${BACKEND_PORT}...`);
const wrangler = spawnProcess(
  "npx",
  [
    "wrangler",
    "dev",
    "--config",
    "wrangler.toml",
    "--local",
    "--port",
    BACKEND_PORT,
  ],
  {
    cwd: path.join(__dirname, "..", "backend"),
    env: { ...process.env, BACKEND_PORT },
  },
);

// After starting wrangler, wait for it to become ready then seed the local D1 database
setTimeout(() => {
  console.log("Seeding local D1 for E2E tests...");
  const seed = spawnProcess("node", ["backend/scripts/seed-e2e.js"]);
  seed.on("exit", (code) => {
    if (code !== 0) {
      console.error("Seeding script exited with code", code);
    } else {
      console.log("Seeding completed.");
    }
  });
}, 6000);

// Build frontend and start preview server
async function buildAndPreview() {
  console.log("Building frontend...");
  const build = spawnProcess("npm", ["run", "build"], {
    cwd: path.join(__dirname, "..", "frontend"),
  });
  await new Promise((res) => build.on("exit", res));

  console.log(`Starting frontend preview on port ${FRONTEND_PORT}...`);
  const preview = spawnProcess("node", ["server.js"], {
    cwd: path.join(__dirname, "..", "frontend"),
    env: { ...process.env, FRONTEND_PORT },
  });
  return preview;
}

buildAndPreview().catch((err) => {
  console.error("Failed to build or preview frontend:", err);
  process.exit(1);
});

// Ensure child processes are killed on exit
process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());

process.on("exit", () => {
  try {
    wrangler.kill();
  } catch (e) {}
});
