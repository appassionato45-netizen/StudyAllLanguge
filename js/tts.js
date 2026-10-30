// Pronunciation via the browser's built-in speech synthesis. No server, no API key.
// Voice availability depends on the learner's OS, so callers must handle `false`.
const LOCALES = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' };

let voices = [];
function refresh() { voices = window.speechSynthesis?.getVoices() ?? []; }
if ('speechSynthesis' in window) {
  refresh();
  speechSynthesis.addEventListener?.('voiceschanged', refresh);
}

function voiceFor(lang) {
  const locale = LOCALES[lang] ?? lang;
  return voices.find(v => v.lang === locale) ?? voices.find(v => v.lang.startsWith(lang));
}

export const canSpeak = lang => Boolean(voiceFor(lang));

export function speak(text, lang) {
  const voice = voiceFor(lang);
  if (!voice) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85;
  speechSynthesis.speak(u);
  return true;
}
