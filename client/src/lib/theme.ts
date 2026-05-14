export type Theme = "dark" | "light";

export function getTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) || "dark";
}

export function setTheme(theme: Theme) {
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}
