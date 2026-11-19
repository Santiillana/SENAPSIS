const STORAGE_KEY = "traza:v1:sheet-theme";
const SHEET_SELECTOR = ".sheet-theme-surface";

function readPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch { return null; }
}

function resolvedTheme(preference = readPreference()) {
  return preference ?? (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
}

function applySheet(sheet, preference = readPreference()) {
  const theme = resolvedTheme(preference);
  sheet.dataset.sheetTheme = theme;
  const toggle = sheet.querySelector("[data-sheet-theme-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.setAttribute("aria-label", `Usar cuadrícula ${theme === "dark" ? "clara" : "oscura"}`);
    toggle.querySelector("[data-sheet-theme-icon]").textContent = theme === "dark" ? "☼" : "◐";
  }
}

export function syncSheetThemes(root = document) {
  const preference = readPreference();
  root.querySelectorAll(SHEET_SELECTOR).forEach(sheet => applySheet(sheet, preference));
}

export function initSheetThemes(root = document) {
  root.addEventListener("click", event => {
    if (!event.target.closest("[data-sheet-theme-toggle]")) return;
    const sheet = event.target.closest(SHEET_SELECTOR);
    if (!sheet) return;
    const next = sheet.dataset.sheetTheme === "dark" ? "light" : "dark";
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Se mantiene la elección hasta cerrar la vista. */ }
    syncSheetThemes(root);
  });

  const observer = new MutationObserver(() => syncSheetThemes(root));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  syncSheetThemes(root);
}
