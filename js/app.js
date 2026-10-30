// Hash router and views. Routes:
//   #/                         course list
//   #/c/<course>               levels and units of a course
//   #/u/<course>/<level>/<unit> a lesson
//   #/r/<course>               flashcard review of due cards
import { t, pick, uiLang, uiLangs, setUiLang } from './i18n.js';
import { loadCourses, findCourse, loadUnit, reviewables, resolveItems } from './data.js';
import * as store from './store.js';
import { speak, canSpeak } from './tts.js';

const main = document.getElementById('main');

// Minimal element builder: h('div', { class: 'x', onclick }, child, 'text', ...)
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter(c => c != null && c !== false));
  return el;
}

const link = (href, ...children) => h('a', { href }, ...children);
const back = href => link(href, t('back'));

function speakButton(text, lang) {
  return h('button', {
    class: 'speak', 'aria-label': 'Play audio', lang,
    onclick: e => { e.stopPropagation(); if (!speak(text, lang)) alertNoVoice(); },
  }, '🔊');
}

function alertNoVoice() {
  const note = document.getElementById('voice-note');
  note.textContent = t('noVoice');
  note.hidden = false;
}

// ---- Views ----

async function home() {
  const courses = await loadCourses();
  return h('section', {},
    h('h1', {}, t('courses')),
    h('ul', { class: 'cards' }, courses.map(c =>
      h('li', {}, link(`#/c/${c.id}`, h('span', { class: 'big' }, pick(c.title, uiLang())))))));
}

async function course(courseId) {
  const c = await findCourse(courseId);
  if (!c) return notFound();
  const due = store.dueIds(c.id).length;
  return h('section', {},
    back('#/'),
    h('h1', {}, pick(c.title, uiLang())),
    h('p', {}, link(`#/r/${c.id}`, `${t('review')}: ${t('dueCount', due)}`)),
    c.levels.map(level => h('div', { class: 'level' },
      h('h2', {}, pick(level.title, uiLang())),
      level.units.length
        ? h('ul', { class: 'cards' }, level.units.map(u =>
            h('li', {}, link(`#/u/${c.id}/${level.id}/${u.id}`, pick(u.title, uiLang())))))
        : h('p', { class: 'muted' }, t('comingSoon')))));
}

async function unit(courseId, levelId, unitId) {
  const c = await findCourse(courseId);
  if (!c) return notFound();
  let data;
  try { data = await loadUnit(courseId, levelId, unitId); }
  catch { return h('section', {}, back(`#/c/${courseId}`), h('p', {}, t('loadError'))); }
  const meta = c.levels.find(l => l.id === levelId)?.units.find(u => u.id === unitId);
  const body = { letters: lettersView, vocab: vocabView, dialogue: readerView, story: readerView }[data.type];
  const items = reviewables(data);
  return h('section', {},
    back(`#/c/${courseId}`),
    h('h1', {}, pick(meta?.title, uiLang())),
    items.length ? addAllButton(items) : null,
    body ? body(data, c) : notFound());
}

function addAllButton(items) {
  const allAdded = () => items.every(i => store.has(i.id));
  const btn = h('button', {
    class: 'secondary', disabled: allAdded(),
    onclick: () => { items.forEach(i => store.add(i.id)); btn.disabled = true; btn.textContent = t('added'); },
  }, allAdded() ? t('added') : t('addToReview'));
  return btn;
}

function lettersView(data, c) {
  return h('ul', { class: 'letters' }, data.items.map(item =>
    h('li', {},
      h('div', { class: 'glyph', lang: c.target }, item.char, speakButton(item.char, c.target)),
      h('div', { class: 'roman' }, item.roman),
      h('p', {}, pick(item.note, c.explain)),
      (item.examples ?? []).map(ex => h('p', { class: 'example' },
        h('span', { lang: c.target }, ex.text), ' ', speakButton(ex.text, c.target),
        h('span', { class: 'muted' }, ` ${ex.roman} · ${pick(ex.meaning, c.explain)}`))))));
}

function vocabView(data, c) {
  return h('ul', { class: 'vocab' }, data.items.map(item =>
    h('li', {},
      h('div', {}, h('span', { class: 'word', lang: c.target }, item.text), speakButton(item.text, c.target)),
      h('div', { class: 'muted' }, item.roman),
      h('div', {}, pick(item.meaning, c.explain)),
      item.example ? h('p', { class: 'example' },
        h('span', { lang: c.target }, item.example.text), ' ', speakButton(item.example.text, c.target),
        h('br'), h('span', { class: 'muted' }, pick(item.example.meaning, c.explain))) : null)));
}

// Dialogues and stories share one reader with toggles, so learners can hide help text and test themselves.
function readerView(data, c) {
  const root = h('div', { class: 'reader show-roman show-meaning' });
  const toggle = (cls, label) => h('label', { class: 'toggle' },
    h('input', { type: 'checkbox', checked: true, onchange: e => root.classList.toggle(cls, e.target.checked) }),
    label);
  root.append(
    h('div', { class: 'toggles' }, toggle('show-roman', t('showRoman')), toggle('show-meaning', t('showMeaning'))),
    ...data.items.map(line => h('div', { class: 'line' },
      line.speaker ? h('span', { class: 'speaker' }, line.speaker) : null,
      h('div', {},
        h('div', { lang: c.target }, line.text, speakButton(line.text, c.target)),
        h('div', { class: 'roman muted' }, line.roman),
        h('div', { class: 'meaning' }, pick(line.meaning, c.explain))))));
  if (data.glossary?.length) root.append(h('h2', {}, t('glossary')), vocabView({ items: data.glossary }, c));
  if (data.source) root.append(h('p', { class: 'muted' }, data.source));
  return root;
}

async function review(courseId) {
  const c = await findCourse(courseId);
  if (!c) return notFound();
  const queue = await resolveItems(c, store.dueIds(c.id));
  const section = h('section', {}, back(`#/c/${courseId}`), h('h1', {}, t('review')));
  const stage = h('div', { class: 'flashcard' });
  section.append(stage);

  function next() {
    stage.replaceChildren();
    const item = queue.shift();
    if (!item) { stage.append(h('p', {}, t('nothingDue'))); return; }
    const front = item.char ?? item.text;
    const answer = h('div', { class: 'answer', hidden: true },
      h('div', { class: 'roman' }, item.roman),
      h('div', {}, pick(item.meaning ?? item.note, c.explain)));
    const grade = correct => () => {
      store.answer(item.id, correct);
      if (!correct) queue.push(item); // see it again this session
      next();
    };
    const controls = h('div', { class: 'controls' },
      h('button', { onclick: () => { answer.hidden = false; controls.replaceChildren(
        h('button', { class: 'secondary', onclick: grade(false) }, t('again')),
        h('button', { onclick: grade(true) }, t('good'))); } }, t('showAnswer')));
    stage.append(
      h('div', { class: 'front', lang: c.target }, front, speakButton(front, c.target)),
      answer, controls,
      h('p', { class: 'muted' }, t('dueCount', queue.length + 1)));
  }
  next();
  return section;
}

const notFound = () => h('section', {}, back('#/'), h('p', {}, '404'));

// ---- Router ----

async function render() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, ...args] = parts;
  const view = { undefined: home, c: course, u: unit, r: review }[route] ?? notFound;
  try {
    main.replaceChildren(await view(...args));
  } catch (err) {
    console.error(err);
    main.replaceChildren(h('p', {}, t('loadError')));
  }
  document.documentElement.lang = uiLang();
  document.title = t('appTitle');
  document.getElementById('app-title').textContent = t('appTitle');
  window.scrollTo(0, 0);
}

function langSwitcher() {
  const sel = document.getElementById('ui-lang');
  sel.replaceChildren(...uiLangs.map(l => h('option', { value: l, selected: l === uiLang() }, l === 'ko' ? '한국어' : 'English')));
  sel.addEventListener('change', () => { setUiLang(sel.value); render(); });
}

langSwitcher();
window.addEventListener('hashchange', render);
render();
