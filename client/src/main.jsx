import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Log commit info on page load
console.log(`%czfo.gg`, "font-size: 16px; font-weight: bold; color: #0066cc;");
console.log(`Commit: %c${__COMMIT_SHA__}`, "font-family: monospace; color: #666;");
if (__COMMIT_SHA__ !== "unknown") {
  console.log(
    `%cView on GitHub`,
    "color: #0066cc; text-decoration: underline; cursor: pointer;",
    `https://github.com/zfogg/zfo.gg/commit/${__COMMIT_SHA__}`,
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
