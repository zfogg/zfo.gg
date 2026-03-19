import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Log commit info on page load
const commitSha = import.meta.env.VITE_COMMIT_SHA || "unknown";
console.log(`%czfo.gg`, "font-size: 16px; font-weight: bold; color: #0066cc;");
console.log(`Commit: %c${commitSha}`, "font-family: monospace; color: #666;");
if (commitSha !== "unknown") {
  console.log(
    `%cView on GitHub`,
    "color: #0066cc; text-decoration: underline; cursor: pointer;",
    `https://github.com/zfogg/zfo.gg/commit/${commitSha}`,
  );
}

// Make commit SHA available globally for components
window.__COMMIT_SHA__ = commitSha;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
