import { execSync } from "child_process";
import { spawn } from "child_process";

// Get current commit SHA - use env var if set (from Docker build arg),
// otherwise try git, fallback to 'unknown'
let commitSha = process.env.VITE_COMMIT_SHA;
if (!commitSha || commitSha === "unknown") {
  try {
    commitSha = execSync("git rev-parse HEAD").toString().trim();
  } catch {
    commitSha = "unknown";
  }
}

// Set environment variable and run vite build
const env = { ...process.env, VITE_COMMIT_SHA: commitSha };

const build = spawn("vite", ["build"], { env, stdio: "inherit" });
build.on("exit", (code) => process.exit(code));
