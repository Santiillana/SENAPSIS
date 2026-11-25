const ROUTE_KEYS = ["pestana", "competencia", "tema", "leccion", "ejercicio", "dificultad", "concepto"];
const VIEWS = new Set(["lecciones", "ejercicios", "simulador"]);

export function readLearnRoute(search = "") {
  const params = new URLSearchParams(search);
  if (!params.has("pestana")) return null;
  const view = params.get("pestana");
  if (!VIEWS.has(view)) return null;
  return {
    view,
    competenceId: params.get("competencia"),
    topicId: params.get("tema"),
    lessonId: params.get("leccion"),
    exerciseId: params.get("ejercicio"),
    difficulties: (params.get("dificultad") || "").split(",").filter(Boolean),
    concepts: (params.get("concepto") || "").split(",").filter(Boolean)
  };
}

export function writeLearnRoute(history, location, route, { replace = false } = {}) {
  const url = new URL(location.href);
  for (const key of ROUTE_KEYS) url.searchParams.delete(key);
  if (route.view !== "inicio") {
    url.searchParams.set("pestana", route.view);
    if (route.competenceId) url.searchParams.set("competencia", route.competenceId);
    if (route.topicId) url.searchParams.set("tema", route.topicId);
    if (route.lessonId) url.searchParams.set("leccion", route.lessonId);
    if (route.exerciseId) url.searchParams.set("ejercicio", route.exerciseId);
    if (route.difficulties?.length) url.searchParams.set("dificultad", route.difficulties.join(","));
    if (route.concepts?.length) url.searchParams.set("concepto", route.concepts.join(","));
  }
  const target = url.pathname + url.search + url.hash;
  const current = location.pathname + location.search + location.hash;
  if (target === current) return false;
  history[replace ? "replaceState" : "pushState"]({ senapsisAprende: true }, "", target);
  return true;
}
