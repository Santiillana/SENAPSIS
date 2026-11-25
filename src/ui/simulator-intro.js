export const INTRO_PREFERENCE_KEY = "senapsis:v1:simulator-intro";

export function readIntroPreference(storage) {
  try {
    storage ??= globalThis.localStorage;
    const value = JSON.parse(storage?.getItem(INTRO_PREFERENCE_KEY) ?? "null");
    return {
      skip: value?.skip === true,
      seen: Array.isArray(value?.seen) ? [...new Set(value.seen.map(Number).filter(Number.isInteger))] : []
    };
  } catch {
    return { skip: false, seen: [] };
  }
}

export function shouldShowIntro(exerciseId, preference) {
  return !preference?.skip && !preference?.seen?.includes(Number(exerciseId));
}

export function rememberIntro(exerciseId, preference, skip = false) {
  const seen = new Set(preference?.seen ?? []);
  const id = Number(exerciseId);
  if (Number.isInteger(id)) seen.add(id);
  return { skip: Boolean(skip || preference?.skip), seen: [...seen] };
}

export function saveIntroPreference(preference, storage) {
  try { (storage ?? globalThis.localStorage)?.setItem(INTRO_PREFERENCE_KEY, JSON.stringify(preference)); }
  catch { /* La preferencia es opcional cuando el almacenamiento no está disponible. */ }
}
