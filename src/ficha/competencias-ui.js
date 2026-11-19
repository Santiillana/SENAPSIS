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
  const color=/^#[0-9a-f]{6}$/i.test(competencia?.color??"")?` style="background:${competencia.color}"`:"";
  return `<span class="competence-marker competence-marker--${key} ${className}" data-forma="${forma}" data-competence="${key}"${color} aria-hidden="true"></span>`;
}

export function competenceLogo(id) {
  const key = competenceKey(id);
  const competence=competenciaPorId(id),color=/^#[0-9a-f]{6}$/i.test(competence?.color??"")?` style="--competence-color:${competence.color};--competence-tint:color-mix(in srgb,${competence.color} 13%,var(--card))"`:"";
  return `<span class="competence-emblem competence-emblem--${key}"${color} aria-hidden="true">${competenceMarker(id)}</span>`;
}
