export function initBrandSplash() {
  const splash = document.querySelector("#brand-splash");
  const app = document.querySelector("#app-shell");
  const enter = document.querySelector("#brand-enter");
  if (!splash || !app || !enter) return;

  enter.addEventListener("click", () => {
    if (enter.disabled) return;
    enter.disabled = true;

    const revealApp = () => {
      if (!splash.isConnected) return;
      splash.remove();
      app.inert = false;
      app.removeAttribute("aria-hidden");
      document.querySelector("#main-content")?.focus({ preventScroll: true });
    };

    if (document.documentElement.dataset.motion === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealApp();
      return;
    }

    splash.classList.add("is-exiting");
    splash.addEventListener("animationend", event => {
      if (event.target === splash && event.animationName === "senapsis-splash-exit") revealApp();
    });
    window.setTimeout(revealApp, 900);
  });
}
