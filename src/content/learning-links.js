export function createLearningLinks(lessons, exercises, conceptsForLesson, conceptsForExercise) {
  const lessonIds = new Set(lessons.map(item => item.id));
  const exerciseIds = new Set(exercises.map(item => item.id));
  const exercisesByLesson = new Map();
  const lessonsByExercise = new Map();
  const uncovered = [];

  for (const lesson of lessons) {
    const concepts = new Set(conceptsForLesson(lesson));
    const matches = exercises.filter(exercise =>
      conceptsForExercise(exercise).some(concept => concepts.has(concept))
    );
    exercisesByLesson.set(lesson.id, matches.filter(item => exerciseIds.has(item.id)));
  }

  for (const exercise of exercises) {
    const concepts = new Set(conceptsForExercise(exercise));
    const matches = lessons.filter(lesson =>
      conceptsForLesson(lesson).some(concept => concepts.has(concept))
    );
    const valid = matches.filter(item => lessonIds.has(item.id));
    lessonsByExercise.set(exercise.id, valid);
    if (!valid.length) uncovered.push(exercise);
  }

  return { exercisesByLesson, lessonsByExercise, uncovered };
}
