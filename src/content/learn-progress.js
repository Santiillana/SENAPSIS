export function normalizeLearnProgress(value, validLessonIds = [], validTopicIds = []) {
  const firstLesson = validLessonIds[0] ?? null;
  if (!value || value.version !== 2 || !Array.isArray(value.completed)) {
    return { version: 2, completed: [], current: firstLesson, screen: 0, theme: null, activityDays: [] };
  }
  const current = validLessonIds.includes(value.current) ? value.current : firstLesson;
  return {
    version: 2,
    completed: [...new Set(value.completed.filter(id => validLessonIds.includes(id)))],
    current,
    screen: Number.isInteger(value.screen) ? Math.max(0, Math.min(4, value.screen)) : 0,
    theme: validTopicIds.includes(value.theme) ? value.theme : null,
    activityDays: Array.isArray(value.activityDays) ? [...new Set(value.activityDays.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)))].slice(-60) : []
  };
}

/** Calcula el avance solo a partir de lecciones completadas y lecciones del tema. */
export function calculateLessonProgress(lessonIds = [], completedIds = []) {
  const lessonSet = new Set(lessonIds);
  const completedSet = new Set(completedIds);
  const total = lessonSet.size;
  const completed = [...lessonSet].filter(id => completedSet.has(id)).length;
  return { completed, total, percentage: total ? Math.round(completed / total * 100) : 0 };
}

/** Devuelve un estado de finalización nuevo sin mutar el progreso persistido. */
export function setLessonCompleted(completedIds = [], lessonId, isComplete = true) {
  const completed = [...new Set(completedIds)];
  const index = completed.indexOf(lessonId);
  if (isComplete && index < 0) completed.push(lessonId);
  if (!isComplete && index >= 0) completed.splice(index, 1);
  return completed;
}

export function dateInBogota(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function currentStreak(days, today = dateInBogota()) {
  const set = new Set(days);
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - (set.has(today) ? 0 : 1)));
  let count = 0;
  while (set.has(date.toISOString().slice(0, 10))) { count++; date.setUTCDate(date.getUTCDate() - 1); }
  return count;
}
