// Content loading. Only courses.json is fetched up front; unit files load on demand
// and are cached for the session, so navigating back and forth costs no extra requests.
const cache = new Map();

async function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then(r => {
      if (!r.ok) throw new Error(`${r.status} ${path}`);
      return r.json();
    }).catch(err => { cache.delete(path); throw err; }));
  }
  return cache.get(path);
}

export const loadCourses = () => getJSON('data/courses.json').then(d => d.courses);

export const loadUnit = (courseId, levelId, unitId) =>
  getJSON(`data/${courseId}/${levelId}/${unitId}.json`);

export async function findCourse(courseId) {
  return (await loadCourses()).find(c => c.id === courseId);
}

// Reviewable items for a unit: letters and vocab items, plus a story's glossary.
export function reviewables(unit) {
  if (unit.type === 'letters' || unit.type === 'vocab') return unit.items;
  return unit.glossary ?? [];
}

// Resolves item ids ("<course>.<unit>.<slug>") to items, fetching only the units those ids
// belong to, so review cost scales with what is due rather than with the size of the course.
export async function resolveItems(course, ids) {
  const levelOf = new Map(course.levels.flatMap(l => l.units.map(u => [u.id, l.id])));
  const unitIds = new Set(ids.map(id => id.split('.')[1]));
  const index = new Map();
  await Promise.all([...unitIds].filter(u => levelOf.has(u)).map(u =>
    loadUnit(course.id, levelOf.get(u), u).then(unit => {
      for (const item of reviewables(unit)) index.set(item.id, item);
    }).catch(() => {})));
  return ids.map(id => index.get(id)).filter(Boolean);
}
