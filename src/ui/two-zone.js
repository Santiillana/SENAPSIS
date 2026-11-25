const STATES = {
  empty: { title: "Aún no hay contenido", message: "Cuando haya elementos disponibles, aparecerán en esta lista." },
  loading: { title: "Cargando contenido", message: "Espera un momento mientras se prepara la información." },
  error: { title: "No se pudo cargar", message: "Intenta de nuevo más tarde." }
};

export function setTwoZoneState(panel, state, message) {
  if (!panel || !STATES[state]) return;
  const copy = STATES[state];
  const status = document.createElement("section");
  status.className = `two-zone-state two-zone-state--${state}`;
  status.setAttribute("role", state === "error" ? "alert" : "status");
  status.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
  const title = document.createElement("h3");
  title.textContent = copy.title;
  const description = document.createElement("p");
  description.textContent = message || copy.message;
  status.append(title, description);
  panel.dataset.state = state;
  panel.replaceChildren(status);
}

export function initTwoZoneWorkspace({ root, list, detail, toggleSelector, itemSelector }) {
  if (!root || !list || !detail) return { closeList() {}, openList() {} };

  root.classList.add("two-zone-layout");
  list.classList.add("two-zone-list");
  detail.classList.add("two-zone-detail");
  list.id ||= `${root.id || "two-zone"}-list`;
  detail.tabIndex = -1;
  root.dataset.state = "ready";
  list.setAttribute("aria-label", list.getAttribute("aria-label") || "Elementos disponibles");
  detail.setAttribute("aria-label", detail.getAttribute("aria-label") || "Contenido seleccionado");

  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "two-zone-backdrop";
  backdrop.setAttribute("aria-label", "Cerrar lista");
  backdrop.hidden = true;
  root.prepend(backdrop);

  const toggle = event => event.target.closest(toggleSelector);
  const isOpen = () => root.classList.contains("is-list-open");
  const mobile = () => window.matchMedia("(max-width: 800px)").matches;
  const updateToggle = () => {
    const button = root.querySelector(toggleSelector);
    button?.setAttribute("aria-controls", list.id);
    button?.setAttribute("aria-expanded", String(isOpen()));
    detail.inert = isOpen() && mobile();
    list.setAttribute("role", isOpen() && mobile() ? "dialog" : "region");
    if (isOpen() && mobile()) list.setAttribute("aria-modal", "true");
    else list.removeAttribute("aria-modal");
  };
  const closeList = ({ focus = false } = {}) => {
    root.classList.remove("is-list-open");
    backdrop.hidden = true;
    updateToggle();
    if (focus) root.querySelector(toggleSelector)?.focus({ preventScroll: true });
  };
  const openList = () => {
    root.classList.add("is-list-open");
    backdrop.hidden = false;
    updateToggle();
    list.querySelector(itemSelector)?.focus({ preventScroll: true });
  };

  root.addEventListener("click", event => {
    if (toggle(event)) {
      event.preventDefault();
      isOpen() ? closeList({ focus: true }) : openList();
      return;
    }
    if (event.target === backdrop) closeList({ focus: true });
    else if (event.target.closest(itemSelector) && isOpen()) {
      closeList();
      detail.focus({ preventScroll: true });
    }
  });
  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      closeList({ focus: true });
      return;
    }
    if (event.key === "Tab" && isOpen() && mobile()) {
      const focusable = [...list.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),summary,[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  root.addEventListener("focusin", updateToggle);
  updateToggle();
  return { closeList, openList };
}
