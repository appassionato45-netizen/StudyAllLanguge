// Learning progress, persisted in localStorage as { [itemId]: [box, dueDay] }.
// Kept in memory and written back in one call per change; at ~25 bytes per card,
// 10,000 cards is ~250 KB, well under the ~5 MB localStorage quota.
import { newCard, grade, isDue, today } from './srs.js';

const KEY = 'sal.v1.progress';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
}

const cards = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cards)); } catch {}
}

export const has = id => id in cards;

export function add(id) {
  if (has(id)) return;
  cards[id] = newCard();
  save();
}

export function answer(id, correct) {
  if (!has(id)) return;
  cards[id] = grade(cards[id], correct);
  save();
}

// Ids are prefixed with the course id ("ko." / "ja."), so filtering by course is a prefix check.
export function dueIds(courseId, day = today()) {
  const prefix = courseId + '.';
  return Object.keys(cards).filter(id => id.startsWith(prefix) && isDue(cards[id], day));
}
