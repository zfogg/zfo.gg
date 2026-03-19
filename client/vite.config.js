import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";
import { execSync } from "child_process";

const getCommitSha = () => {
  // Check deployment platform environment variables
  const envVars = [
    process.env?.SOURCE_COMMIT, // Docker build arg
    process.env?.VERCEL_GIT_COMMIT_SHA, // Vercel
    process.env?.GITHUB_SHA, // GitHub Actions
    process.env?.CI_COMMIT_SHA, // GitLab
  ];

  for (const envVar of envVars) {
    if (envVar) {
      return envVar;
    }
  }

  // Fall back to git command for local development
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

const commitSha = getCommitSha();
console.log("[vite.config.js] Commit SHA:", commitSha);

// https://vite.dev/config/
export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
  plugins: [
    react(),
    sitemap({
      hostname: "https://zfo.gg",
      dynamicRoutes: ["/bitcoin", "/thing/gravity"],
    }),
  ],
});
