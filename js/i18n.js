// UI strings. Content text is localized in the JSON files, not here.
const STRINGS = {
  en: {
    appTitle: 'Study All Languages',
    courses: 'Courses',
    review: 'Review',
    dueCount: n => `${n} card${n === 1 ? '' : 's'} due`,
    nothingDue: 'Nothing due. Come back later!',
    showAnswer: 'Show answer',
    again: 'Again',
    good: 'Good',
    showRoman: 'Romanization',
    showMeaning: 'Meaning',
    comingSoon: 'Coming soon',
    back: '← Back',
    noVoice: 'No voice for this language is installed in your browser, so audio is unavailable.',
    addToReview: 'Add to review',
    added: 'Added',
    loadError: 'Could not load this lesson.',
  },
  ko: {
    appTitle: '모든 언어 공부',
    courses: '과정',
    review: '복습',
    dueCount: n => `복습할 카드 ${n}장`,
    nothingDue: '지금 복습할 카드가 없어요.',
    showAnswer: '정답 보기',
    again: '다시',
    good: '알아요',
    showRoman: '발음 표기',
    showMeaning: '뜻',
    comingSoon: '준비 중',
    back: '← 뒤로',
    noVoice: '브라우저에 이 언어의 음성이 없어서 소리를 들을 수 없어요.',
    addToReview: '복습에 추가',
    added: '추가됨',
    loadError: '레슨을 불러오지 못했어요.',
  },
};

const KEY = 'sal.v1.uiLang';

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch {}
  return navigator.language?.startsWith('ko') ? 'ko' : 'en';
}

let lang = initialLang();

export const uiLang = () => lang;
export const uiLangs = Object.keys(STRINGS);

export function setUiLang(next) {
  if (!STRINGS[next]) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch {}
}

export function t(key, ...args) {
  const v = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}

// Pick text from a localized object: preferred language, then UI language, then anything.
export function pick(obj, preferred) {
  if (obj == null || typeof obj === 'string') return obj ?? '';
  return obj[preferred] ?? obj[lang] ?? Object.values(obj)[0] ?? '';
}
