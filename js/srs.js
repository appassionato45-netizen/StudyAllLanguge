// Leitner spaced repetition. A card is [box, dueDay]; days are integers since the epoch,
// so stored progress stays tiny (~25 bytes per card) and comparisons need no Date parsing.
export const INTERVALS = [0, 1, 3, 7, 14, 30]; // days until next review, indexed by box
const MAX_BOX = INTERVALS.length - 1;
const DAY_MS = 86_400_000;

export function today(now = Date.now()) {
  // Local midnight, so a card due "tomorrow" turns over at the learner's midnight, not UTC's.
  const offset = new Date(now).getTimezoneOffset() * 60_000;
  return Math.floor((now - offset) / DAY_MS);
}

export function newCard(day = today()) {
  return [0, day];
}

export function grade(card, correct, day = today()) {
  const box = correct ? Math.min(card[0] + 1, MAX_BOX) : 0;
  return [box, day + INTERVALS[box]];
}

export const isDue = (card, day = today()) => card[1] <= day;
