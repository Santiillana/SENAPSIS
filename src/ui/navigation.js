const SPACE_META = {
  home: { title: "Inicio", description: "La información compartida de tu ficha y recursos para repasar sus competencias." },
  hoy: { title: "Centro de control", description: "Tu agenda académica y lo que requiere tu atención." },
  clases: { title: "Clases", description: "Consulta tus clases por día, semana o mes." },
  actividades: { title: "Actividades", description: "Tus entregas, estados y retroalimentación." },
  biblioteca: { title: "Biblioteca", description: "Tus materiales y recursos de estudio." },
  learn: { title: "Lecciones", description: "Comprende cada figura, decisión y ciclo con ejemplos y escenas propias." },
  exercises: { title: "Ejercicios", description: "Elige un problema y revisa qué necesitas para resolverlo." },
  simulator: { title: "Simulador", description: "Observa el algoritmo paso a paso y entiende cada cambio." }
};

const FICHA_SPACES = new Set(["hoy", "clases", "actividades", "biblioteca"]);
const APRENDE_SPACES = new Set(["learn", "exercises", "simulator"]);
const DEFAULT_LAST = { ficha: "hoy", aprende: "learn", section: "aprende" };
const LAST_KEY = "senapsis:v4:last";
function readLastViews() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST_KEY) || "null");
    return {
      ficha: FICHA_SPACES.has(saved?.ficha) ? saved.ficha : DEFAULT_LAST.ficha,
      aprende: APRENDE_SPACES.has(saved?.aprende) ? saved.aprende : DEFAULT_LAST.aprende,
      section: saved?.section === "ficha" ? "ficha" : "aprende"
    };
  } catch {
    return { ...DEFAULT_LAST };
  }
}

function saveLastViews(value) {
  try { window.localStorage.setItem(LAST_KEY, JSON.stringify(value)); }
  catch { /* El almacenamiento puede estar bloqueado. */ }
}

function sectionForSpace(space) {
  if (space === "home") return "home";
  return FICHA_SPACES.has(space) ? "ficha" : "aprende";
}

export function initNavigation() {
  const root = document.documentElement;
  const nav = document.querySelector("#primary-nav");
  const header = document.querySelector("#hd");
  const views = [...document.querySelectorAll("[data-view]")];
  const buttons = [...document.querySelectorAll("#primary-nav [data-space]")];
  const sectionSwitches = [...document.querySelectorAll("[data-section-switch]")];
  const groups = [...document.querySelectorAll("[data-subnav-section]")];
  if (!nav || !views.length || !buttons.length || !sectionSwitches.length) return;

  const lastViews = readLastViews();

  function activate(space, options = {}) {
    const meta = SPACE_META[space];
    const target = views.find(view => view.dataset.view === space);
    if (!meta || !target) return;

    const section = sectionForSpace(space);
    for (const view of views) view.hidden = view !== target;
    for (const button of buttons) {
      const active = button.dataset.space === space;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    }
    for (const group of groups) {
      group.hidden = group.dataset.subnavSection !== section;
    }
    for (const button of sectionSwitches) {
      const active = button.dataset.sectionSwitch === section;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    root.dataset.section = section;
    document.body.dataset.activeSpace = space;
    document.body.dataset.activeSection = section;
    if (header) header.dataset.sectionSwitcherHidden = "false";
    document.title = meta.title + " · SENAPSIS";

    if (space !== "home") {
      lastViews[section] = space;
      lastViews.section = section;
      saveLastViews(lastViews);
    }

    if (options.focus) {
      const heading = target.querySelector("h1,h2,h3");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent("senapsis:space-change", {
      detail: { space, section }
    }));
  }

  for (const button of buttons) {
    button.addEventListener("click", () => activate(button.dataset.space));
  }
  for (const button of sectionSwitches) {
    button.addEventListener("click", () => {
      const section = button.dataset.sectionSwitch;
      activate(lastViews[section] || DEFAULT_LAST[section]);
    });
  }

  nav.addEventListener("keydown", event => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    const visibleButtons = buttons.filter(button => !button.closest("[data-subnav-section]")?.hidden);
    const current = visibleButtons.indexOf(document.activeElement);
    if (current < 0 || !visibleButtons.length) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? visibleButtons.length - 1 :
      event.key === "ArrowRight" ? (current + 1) % visibleButtons.length :
      (current - 1 + visibleButtons.length) % visibleButtons.length;
    visibleButtons[next].focus();
    activate(visibleButtons[next].dataset.space);
  });

  document.addEventListener("click", event => {
    const shortcut = event.target.closest("[data-go]");
    if (!shortcut) return;
    const space = shortcut.dataset.go;
    if (!SPACE_META[space]) return;
    if (shortcut instanceof HTMLAnchorElement) event.preventDefault();
    activate(space, { focus: true });
  });

  document.querySelectorAll(".home-card[data-go]").forEach(card => {
    card.addEventListener("keydown", event => {
      if (event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      card.click();
    });
  });
  activate("home");
}
