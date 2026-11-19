import { FICHA } from "../content/ficha.js";

export function competenciaPorId(id) {
  return FICHA.competencias.find(item => item.id === id) ?? null;
}

export function competenceKey(id) {
  return competenciaPorId(id)?.id ?? "pendiente";
}

/** Forma compartida para distinguir visualmente la competencia en todas las vistas. */
export function competenceMarker(id, className = "") {
  const competencia = competenciaPorId(id);
  const forma = competencia?.forma ?? "circulo";
  const key = competenceKey(id);
  return `<span class="competence-marker competence-marker--${key} ${className}" data-forma="${forma}" data-competence="${key}" aria-hidden="true"></span>`;
}

export function competenceLogo(id) {
  const key = competenceKey(id);
  return `<span class="competence-emblem competence-emblem--${key}" aria-hidden="true">${competenceMarker(id)}</span>`;
}
