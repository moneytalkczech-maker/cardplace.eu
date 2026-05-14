import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { getTheme } from "./lib/theme";

document.documentElement.setAttribute("data-theme", getTheme());

window.addEventListener("theme-change", ((e: CustomEvent) => {
  document.documentElement.setAttribute("data-theme", e.detail);
}) as EventListener);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
