// Hash router and views. Routes:
//   #/                          landing page
//   #/c/<course>                levels and lessons of a course
//   #/u/<course>/<level>/<unit> a lesson
//   #/r/<course>                flashcard review of due cards
import { t, pick, uiLang, uiLangs, setUiLang } from './i18n.js';
import { loadCourses, findCourse, loadUnit, reviewables, resolveItems } from './data.js';
import * as store from './store.js';
import { speak } from './tts.js';
import { FIGURES } from './figures.js';

const main = document.getElementById('main');

// Minimal element builder: h('div', { class: 'x', onclick }, child, 'text', ...)
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') for (const [prop, val] of Object.entries(v)) el.style.setProperty(prop, val);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat(Infinity).filter(c => c != null && c !== false));
  return el;
}

const link = (href, props, ...children) => h('a', { href, ...props }, ...children);

function crumbs(...parts) {
  return h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
    parts.map(([href, label], i) => [i ? h('span', { class: 'sep' }, '›') : null,
      href ? link(href, {}, label) : h('span', {}, label)]));
}

function speakButton(text, lang) {
  return h('button', {
    class: 'speak', 'aria-label': 'Play audio', title: 'Play audio',
    onclick: e => { e.stopPropagation(); e.preventDefault(); if (!speak(text, lang)) alertNoVoice(); },
  }, '🔊');
}

function alertNoVoice() {
  const note = document.getElementById('voice-note');
  note.textContent = t('noVoice');
  note.hidden = false;
}

const pic = (image, cls = 'pic') => image ? h('span', { class: cls, 'aria-hidden': 'true' }, image) : null;

// Lesson kind, for icons and labels. Drama scenes are dialogues whose id starts with "drama-".
function kindOf(unit) {
  if (unit.type === 'dialogue' && unit.id.startsWith('drama-')) return 'drama';
  return unit.type;
}
const KIND = {
  letters: ['🔤', 'typeLetters'], vocab: ['📚', 'typeVocab'], dialogue: ['💬', 'typeDialogue'],
  story: ['📖', 'typeStory'], drama: ['🎬', 'typeDrama'],
};

// ---- Views ----

async function home() {
  const courses = await loadCourses();
  const steps = [['🔤', 'step1Title', 'step1Text'], ['🃏', 'step2Title', 'step2Text'], ['📖', 'step3Title', 'step3Text']];
  return h('div', { class: 'page' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('h1', {}, t('heroTitle')),
        h('p', {}, t('heroText')),
        link('#courses', { class: 'button' }, t('startLearning'))),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' },
        h('span', { class: 'bubble b1' }, '안녕'), h('span', { class: 'bubble b2' }, 'こんにちは'),
        h('span', { class: 'bubble b3' }, 'Hello'), h('span', { class: 'bubble b4' }, '🐇🐢'))),
    h('section', { id: 'courses', class: 'section' },
      h('h2', {}, t('courses')),
      h('div', { class: 'course-grid' }, courses.map(courseCard))),
    h('section', { class: 'section' },
      h('h2', {}, t('howItWorks')),
      h('ol', { class: 'steps' }, steps.map(([icon, title, text], i) =>
        h('li', {}, h('span', { class: 'step-icon' }, icon),
          h('h3', {}, `${i + 1}. ${t(title)}`), h('p', {}, t(text)))))));
}

function courseCard(c) {
  const count = c.levels.reduce((n, l) => n + l.units.length, 0);
  return link(`#/c/${c.id}`, { class: 'course-card', style: { '--course': c.color } },
    h('span', { class: 'course-glyph', lang: c.target }, c.glyph),
    h('div', {},
      h('h3', {}, pick(c.title, uiLang())),
      h('p', {}, pick(c.tagline, uiLang())),
      h('span', { class: 'muted' }, t('units', count))));
}

async function course(courseId) {
  const c = await findCourse(courseId);
  if (!c) return notFound();
  const due = store.dueIds(c.id).length;
  return h('div', { class: 'page' },
    h('section', { class: 'banner', style: { '--course': c.color } },
      h('span', { class: 'course-glyph', lang: c.target }, c.glyph),
      h('div', {},
        crumbs(['#/', t('home')], [null, pick(c.title, uiLang())]),
        h('h1', {}, pick(c.title, uiLang())),
        h('p', {}, pick(c.tagline, uiLang())),
        link(`#/r/${c.id}`, { class: 'button light' }, `🃏 ${t('review')} · ${t('dueCount', due)}`))),
    c.levels.map(level => h('section', { class: 'section' },
      h('h2', {}, pick(level.title, uiLang())),
      level.units.length
        ? h('div', { class: 'unit-grid' }, level.units.map((u, i) => {
            const [icon, label] = KIND[kindOf(u)];
            return link(`#/u/${c.id}/${level.id}/${u.id}`, { class: 'unit-card' },
              h('span', { class: 'unit-icon' }, icon),
              h('span', { class: 'unit-kind' }, `${i + 1} · ${t(label)}`),
              h('span', { class: 'unit-title' }, pick(u.title, uiLang())));
          }))
        : h('p', { class: 'muted soon' }, `🚧 ${t('comingSoon')}`))));
}

async function unit(courseId, levelId, unitId) {
  const c = await findCourse(courseId);
  const level = c?.levels.find(l => l.id === levelId);
  const index = level?.units.findIndex(u => u.id === unitId) ?? -1;
  if (index < 0) return notFound();
  const meta = level.units[index];
  let data;
  try { data = await loadUnit(courseId, levelId, unitId); }
  catch { return h('div', { class: 'page' }, h('p', {}, t('loadError'))); }

  const body = { letters: lettersView, vocab: vocabView, dialogue: readerView, story: readerView }[data.type];
  const items = reviewables(data);
  const [icon, label] = KIND[kindOf(meta)];
  const href = u => `#/u/${courseId}/${levelId}/${u.id}`;
  const prev = level.units[index - 1], next = level.units[index + 1];

  return h('div', { class: 'page' },
    crumbs(['#/', t('home')], [`#/c/${courseId}`, pick(c.title, uiLang())], [null, pick(level.title, uiLang())]),
    h('header', { class: 'lesson-head' },
      h('span', { class: 'unit-kind' }, `${icon} ${t(label)}`),
      h('h1', {}, pick(meta.title, uiLang())),
      items.length ? addAllButton(items) : null),
    data.intro || data.figure ? introBox(data, c) : null,
    body ? body(data, c) : notFound(),
    h('nav', { class: 'pager' },
      prev ? link(href(prev), { class: 'button ghost' }, t('prev')) : h('span'),
      next ? link(href(next), { class: 'button' }, t('next')) : link(`#/c/${courseId}`, { class: 'button' }, pick(c.title, uiLang()))));
}

function introBox(data, c) {
  const fig = FIGURES[data.figure];
  const figure = fig ? h('figure', {}, svgNode(fig.svg()), h('figcaption', {}, pick(fig.caption, c.explain))) : null;
  return h('section', { class: 'intro' },
    data.intro ? h('p', {}, pick(data.intro, c.explain)) : null,
    figure);
}

function svgNode(markup) {
  const wrap = document.createElement('div');
  wrap.className = 'figure-art';
  wrap.innerHTML = markup; // static, trusted markup from figures.js
  return wrap;
}

function addAllButton(items) {
  const allAdded = () => items.every(i => store.has(i.id));
  const btn = h('button', {
    class: 'button ghost', disabled: allAdded(),
    onclick: () => { items.forEach(i => store.add(i.id)); btn.disabled = true; btn.textContent = `✓ ${t('added')}`; },
  }, allAdded() ? `✓ ${t('added')}` : `＋ ${t('addToReview')}`);
  return btn;
}

function example(ex, c) {
  return h('div', { class: 'example' },
    pic(ex.image, 'pic small'),
    h('div', {},
      h('span', { lang: c.target, class: 'ex-text' }, ex.text), speakButton(ex.text, c.target),
      h('div', { class: 'muted' }, `${ex.roman} · ${pick(ex.meaning, c.explain)}`)));
}

function lettersView(data, c) {
  return h('div', { class: 'card-grid letters' }, data.items.map(item =>
    h('article', { class: 'card' },
      h('div', { class: 'glyph-row' },
        h('span', { class: 'glyph', lang: c.target }, item.char), speakButton(item.char, c.target)),
      h('div', { class: 'roman' }, item.roman),
      h('p', {}, pick(item.note, c.explain)),
      (item.examples ?? []).map(ex => example(ex, c)))));
}

function vocabView(data, c) {
  return h('div', { class: 'card-grid vocab' }, data.items.map(item =>
    h('article', { class: 'card' },
      pic(item.image, 'pic big'),
      h('div', { class: 'word-row' },
        h('span', { class: 'word', lang: c.target }, item.text), speakButton(item.text, c.target)),
      h('div', { class: 'roman' }, item.roman),
      h('div', { class: 'meaning-text' }, pick(item.meaning, c.explain)),
      item.example ? example(item.example, c) : null)));
}

// Dialogues and stories share one reader with toggles, so learners can hide help text and test themselves.
function readerView(data, c) {
  const root = h('div', { class: 'reader show-roman show-meaning' });
  const toggle = (cls, label) => h('label', { class: 'toggle' },
    h('input', { type: 'checkbox', checked: true, onchange: e => root.classList.toggle(cls, e.target.checked) }),
    label);
  const speakers = [...new Set(data.items.map(l => l.speaker).filter(Boolean))];
  root.append(
    h('div', { class: 'toggles' }, toggle('show-roman', t('showRoman')), toggle('show-meaning', t('showMeaning'))),
    ...data.items.map(line => {
      const side = speakers.indexOf(line.speaker) % 2 === 1 ? 'right' : 'left';
      return h('div', { class: `line ${line.speaker ? 'chat ' + side : 'para'}` },
        line.speaker ? h('span', { class: 'speaker' }, line.speaker) : pic(line.image, 'scene'),
        h('div', { class: 'line-body' },
          h('div', { lang: c.target, class: 'line-text' }, line.text, speakButton(line.text, c.target)),
          h('div', { class: 'roman' }, line.roman),
          h('div', { class: 'meaning' }, pick(line.meaning, c.explain))));
    }));
  if (data.glossary?.length) root.append(h('h2', {}, t('glossary')), vocabView({ items: data.glossary }, c));
  if (data.source) root.append(h('p', { class: 'muted source' }, data.source));
  return root;
}

async function review(courseId) {
  const c = await findCourse(courseId);
  if (!c) return notFound();
  const queue = await resolveItems(c, store.dueIds(c.id));
  const stage = h('div', { class: 'flashcard' });
  const page = h('div', { class: 'page narrow' },
    crumbs(['#/', t('home')], [`#/c/${courseId}`, pick(c.title, uiLang())], [null, t('review')]),
    h('h1', {}, `🃏 ${t('review')}`), stage);

  function next() {
    stage.replaceChildren();
    const item = queue.shift();
    if (!item) {
      stage.append(h('p', { class: 'done' }, '🎉'), h('p', {}, t('nothingDue')),
        link(`#/c/${courseId}`, { class: 'button' }, pick(c.title, uiLang())));
      return;
    }
    const front = item.char ?? item.text;
    const answer = h('div', { class: 'answer', hidden: true },
      pic(item.image ?? item.examples?.[0]?.image, 'pic big'),
      h('div', { class: 'roman' }, item.roman),
      h('div', {}, pick(item.meaning ?? item.note, c.explain)));
    const grade = correct => () => {
      store.answer(item.id, correct);
      if (!correct) queue.push(item); // see it again this session
      next();
    };
    const controls = h('div', { class: 'controls' },
      h('button', { class: 'button', onclick: () => { answer.hidden = false; controls.replaceChildren(
        h('button', { class: 'button ghost', onclick: grade(false) }, t('again')),
        h('button', { class: 'button', onclick: grade(true) }, t('good'))); } }, t('showAnswer')));
    stage.append(
      h('div', { class: 'front', lang: c.target }, front, speakButton(front, c.target)),
      answer, controls,
      h('p', { class: 'muted' }, t('dueCount', queue.length + 1)));
  }
  next();
  return page;
}

const notFound = () => h('div', { class: 'page' }, link('#/', {}, t('home')), h('p', {}, '404'));

// ---- Router ----

async function render() {
  const hash = location.hash;
  if (hash === '#courses') { // in-page anchor on the landing page
    document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
    if (document.getElementById('courses')) return;
  }
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [route, ...args] = parts;
  const view = { undefined: home, courses: home, c: course, u: unit, r: review }[route] ?? notFound;
  try {
    main.replaceChildren(await view(...args));
  } catch (err) {
    console.error(err);
    main.replaceChildren(h('p', {}, t('loadError')));
  }
  document.documentElement.lang = uiLang();
  document.title = t('appTitle');
  document.getElementById('app-title').textContent = t('appTitle');
  document.getElementById('footer-text').textContent = t('footer');
  await renderNav();
  if (route === 'courses') document.getElementById('courses')?.scrollIntoView();
  else window.scrollTo(0, 0);
}

async function renderNav() {
  const courses = await loadCourses();
  document.getElementById('nav-links').replaceChildren(...courses.map(c =>
    link(`#/c/${c.id}`, { class: location.hash.startsWith(`#/c/${c.id}`) || location.hash.includes(`/${c.id}/`) ? 'active' : '' },
      h('span', { lang: c.target }, c.glyph), ' ', pick(c.title, uiLang()))));
}

function langSwitcher() {
  const sel = document.getElementById('ui-lang');
  sel.replaceChildren(...uiLangs.map(l => h('option', { value: l, selected: l === uiLang() }, l === 'ko' ? '한국어' : 'English')));
  sel.addEventListener('change', () => { setUiLang(sel.value); render(); });
}

langSwitcher();
window.addEventListener('hashchange', render);
render();
