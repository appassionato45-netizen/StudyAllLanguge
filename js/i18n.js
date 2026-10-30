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
    glossary: 'Key words',
    home: 'Home',
    heroTitle: 'Learn Korean and Japanese, one step at a time',
    heroText: 'Short lessons with pictures and audio, spaced-repetition flashcards, and stories to read. Free, and no sign-up: your progress stays in this browser.',
    startLearning: 'Start learning',
    howItWorks: 'How it works',
    step1Title: 'Learn the letters',
    step1Text: 'Each letter comes with a picture word and its sound.',
    step2Title: 'Practice words',
    step2Text: 'Add words to review; flashcards come back just before you forget.',
    step3Title: 'Read and listen',
    step3Text: 'Conversations, drama scenes and stories with help you can hide.',
    units: n => `${n} lessons`,
    open: 'Open',
    reviewNow: 'Review now',
    typeLetters: 'Letters',
    typeVocab: 'Words',
    typeDialogue: 'Conversation',
    typeStory: 'Story',
    typeDrama: 'Drama scene',
    prev: '← Previous',
    next: 'Next →',
    footer: 'Study All Languages · Content is original or retold from the public domain.',
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
    glossary: '주요 단어',
    home: '홈',
    heroTitle: '한국어와 일본어, 한 걸음씩',
    heroText: '그림과 소리가 있는 짧은 레슨, 잊기 직전에 다시 나오는 복습 카드, 읽을거리까지. 무료이고 가입도 필요 없어요. 학습 기록은 이 브라우저에 저장돼요.',
    startLearning: '학습 시작하기',
    howItWorks: '이렇게 공부해요',
    step1Title: '글자 익히기',
    step1Text: '글자마다 그림 단어와 소리가 함께 나와요.',
    step2Title: '단어 연습',
    step2Text: '단어를 복습에 추가하면 잊을 때쯤 카드가 다시 나와요.',
    step3Title: '읽고 듣기',
    step3Text: '회화, 드라마 장면, 동화를 도움말을 켜고 끄며 읽어요.',
    units: n => `레슨 ${n}개`,
    open: '열기',
    reviewNow: '지금 복습하기',
    typeLetters: '글자',
    typeVocab: '단어',
    typeDialogue: '회화',
    typeStory: '동화',
    typeDrama: '드라마 장면',
    prev: '← 이전',
    next: '다음 →',
    footer: '모든 언어 공부 · 콘텐츠는 직접 쓰거나 저작권이 만료된 이야기를 다시 쓴 것이에요.',
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
