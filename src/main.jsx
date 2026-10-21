import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import { reloadOnce } from "./lib/reloadOnce.js";

/* Vite's own signal that a preloaded chunk or stylesheet failed — it fires
 * before React sees anything, so it gets the same one reload the boundary
 * gives a failed lazy import. */
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnce()) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
