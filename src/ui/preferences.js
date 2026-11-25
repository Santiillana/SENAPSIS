const STORAGE_KEYS = {
  legacyTheme: "traza:v2:theme",
  themePrefix: "traza:v4:theme:",
  motion: "traza:v2:motion"
};
const DEFAULT_THEMES = { ficha: "light" };

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readPreference(key, fallback, legacyKey) {
  try {
    return window.localStorage.getItem(key) ||
      (legacyKey ? window.localStorage.getItem(legacyKey) : null) || fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try { window.localStorage.setItem(key, value); }
  catch { /* El almacenamiento puede estar bloqueado. */ }
}

function readSectionTheme(section) {
  const saved = readPreference(STORAGE_KEYS.themePrefix + section, null);
  if (saved === "dark" || saved === "light") return saved;

  if (section === "aprende") {
    const legacy = readPreference(STORAGE_KEYS.legacyTheme, null, "traza-theme");
    if (legacy === "light" || legacy === "dark") return legacy;
  }
  return DEFAULT_THEMES[section] || systemTheme();
}

export function initPreferences() {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-action="toggle-theme"]');
  const motionButton = document.querySelector('[data-action="toggle-motion"]');
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let themeTransitionTimer = 0;

  function applyTheme(theme, section = root.dataset.section || "home") {
    const normalized = theme === "light" ? "light" : "dark";
    if (root.dataset.theme !== normalized) {
      root.dataset.themeChanging = "true";
      window.clearTimeout(themeTransitionTimer);
      themeTransitionTimer = window.setTimeout(() => delete root.dataset.themeChanging, 180);
    }
    root.dataset.theme = normalized;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", normalized === "light" ? "#F7F1E3" : "#0D1524"
    );
    savePreference(STORAGE_KEYS.themePrefix + section, normalized);

    if (themeButton) {
      const dark = normalized === "dark";
      themeButton.setAttribute("aria-pressed", String(dark));
      themeButton.setAttribute("aria-label", dark ? "Activar tema claro" : "Activar tema oscuro");
      themeButton.title = dark ? "Activar tema claro" : "Activar tema oscuro";
    }
  }

  function applyMotion(motion) {
    const normalized = ["full", "soft", "reduced"].includes(motion) ? motion : "full";
    root.dataset.motion = normalized;
    if (motionButton) {
      const labels = { full: "Movimiento completo", soft: "Movimiento suave", reduced: "Movimiento reducido" };
      motionButton.setAttribute("aria-pressed", String(normalized === "reduced"));
      motionButton.setAttribute("aria-label", "Nivel de movimiento: " + labels[normalized]);
      motionButton.title = labels[normalized];
    }
    savePreference(STORAGE_KEYS.motion, motion);
  }

  themeButton?.addEventListener("click", () => {
    const section = root.dataset.section || "home";
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", section);
  });
  motionButton?.addEventListener("click", () => {
    const levels = ["full", "soft", "reduced"];
    applyMotion(levels[(levels.indexOf(root.dataset.motion) + 1) % levels.length]);
  });

  document.addEventListener("traza:space-change", event => {
    const section = event.detail?.section || root.dataset.section || "home";
    applyTheme(readSectionTheme(section), section);
  });

  const initialSection = root.dataset.section || "home";
  applyTheme(readSectionTheme(initialSection), initialSection);
  applyMotion(readPreference(
    STORAGE_KEYS.motion,
    prefersReduced ? "reduced" : "full",
    "traza-motion"
  ) );
}
