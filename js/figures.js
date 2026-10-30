// Explanatory diagrams, drawn as inline SVG so they need no image files and follow the theme colors.
// A unit opts in with "figure": "<name>" in its JSON. Captions are localized like other content.

const W = 'xmlns="http://www.w3.org/2000/svg" role="img"';

// One syllable block: cells are [text, x, y, w, h] in a 100x100 box.
function block(x, cells, label) {
  const parts = cells.map(([t, cx, cy, w, h]) => `
    <rect x="${x + cx}" y="${cy}" width="${w}" height="${h}" rx="6" class="fig-cell"/>
    <text x="${x + cx + w / 2}" y="${cy + h / 2}" class="fig-jamo">${t}</text>`).join('');
  return `<g>${parts}
    <text x="${x + 50}" y="128" class="fig-label">${label}</text></g>`;
}

const plus = (x, y = 50) => `<text x="${x}" y="${y}" class="fig-op">+</text>`;
const arrow = (x, y = 50) => `<text x="${x}" y="${y}" class="fig-op">→</text>`;
const big = (x, t, label = '') => `<text x="${x}" y="54" class="fig-result">${t}</text>
  ${label ? `<text x="${x}" y="128" class="fig-label">${label}</text>` : ''}`;

export const FIGURES = {
  // 천지인: the three strokes every basic vowel is built from.
  'vowel-strokes': {
    caption: {
      en: 'Basic vowels are built from three strokes: a dot for heaven (·), a flat line for earth (ㅡ), and a standing line for a person (ㅣ). Put the dot to the right of ㅣ and you get ㅏ; above ㅡ and you get ㅗ.',
      ko: '기본 모음은 하늘(·), 땅(ㅡ), 사람(ㅣ) 세 획으로 만들어요. ㅣ 오른쪽에 점을 찍으면 ㅏ, ㅡ 위에 찍으면 ㅗ가 돼요.',
    },
    svg: () => `<svg ${W} viewBox="0 0 520 160" aria-label="Heaven, earth and person strokes">
      <circle cx="40" cy="50" r="10" class="fig-accent"/>
      <text x="40" y="122" class="fig-label">heaven</text><text x="40" y="146" class="fig-label">하늘</text>
      <rect x="100" y="45" width="80" height="10" rx="5" class="fig-ink"/>
      <text x="140" y="122" class="fig-label">earth</text><text x="140" y="146" class="fig-label">땅</text>
      <rect x="225" y="10" width="10" height="80" rx="5" class="fig-ink"/>
      <text x="230" y="122" class="fig-label">person</text><text x="230" y="146" class="fig-label">사람</text>
      ${arrow(285)}
      <rect x="330" y="10" width="10" height="80" rx="5" class="fig-ink"/><circle cx="360" cy="50" r="9" class="fig-accent"/>
      <text x="345" y="122" class="fig-label">ㅏ</text>
      <circle cx="460" cy="30" r="9" class="fig-accent"/><rect x="420" y="60" width="80" height="10" rx="5" class="fig-ink"/>
      <text x="460" y="122" class="fig-label">ㅗ</text>
    </svg>`,
  },

  'syllable-blocks': {
    caption: {
      en: 'Letters are stacked into square blocks, one block per syllable. Tall vowels go to the right of the consonant, flat vowels go below it, and a final consonant (batchim) sits at the bottom.',
      ko: '글자는 음절마다 네모 칸 하나에 모아 써요. 세로 모음은 자음 오른쪽, 가로 모음은 자음 아래, 받침은 맨 아래에 놓여요.',
    },
    svg: () => `<svg ${W} viewBox="0 0 520 140" aria-label="Syllable block layouts">
      ${block(0, [['ㄱ', 0, 0, 48, 100], ['ㅏ', 52, 0, 48, 100]], '가 = ㄱ + ㅏ')}
      ${block(140, [['ㄱ', 0, 0, 100, 48], ['ㅗ', 0, 52, 100, 48]], '고 = ㄱ + ㅗ')}
      ${block(280, [['ㅎ', 0, 0, 48, 56], ['ㅏ', 52, 0, 48, 56], ['ㄴ', 0, 60, 100, 40]], '한 = ㅎ + ㅏ + ㄴ')}
      ${block(420, [['ㄱ', 0, 0, 100, 30], ['ㅡ', 0, 34, 100, 26], ['ㄹ', 0, 64, 100, 36]], '글 = ㄱ + ㅡ + ㄹ')}
    </svg>`,
  },

  'batchim': {
    caption: {
      en: 'A batchim is the consonant at the bottom of a block. Many letters share one of only seven end sounds: k, n, t, l, m, p, ng.',
      ko: '받침은 칸 맨 아래 자음이에요. 여러 글자가 k, n, t, l, m, p, ng 일곱 가지 소리 중 하나로 발음돼요.',
    },
    svg: () => `<svg ${W} viewBox="0 0 520 140" aria-label="Batchim position">
      ${block(60, [['ㅂ', 0, 0, 48, 56], ['ㅏ', 52, 0, 48, 56], ['ㅂ', 0, 60, 100, 40]], '밥 bap')}
      ${arrow(220)}
      <text x="370" y="40" class="fig-label fig-left">ㅂ ㅍ → p</text>
      <text x="370" y="70" class="fig-label fig-left">ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ ㅆ → t</text>
      <text x="370" y="100" class="fig-label fig-left">ㄱ ㅋ ㄲ → k</text>
    </svg>`,
  },

  'dakuten': {
    caption: {
      en: 'Two small strokes (゛) make a sound voiced; a small circle (゜) turns h into p.',
      ko: '탁점(゛)을 붙이면 성대가 울리는 소리가 되고, 반탁점(゜)을 붙이면 h가 p로 바뀌어요.',
    },
    svg: () => `<svg ${W} viewBox="0 0 700 140" aria-label="Dakuten and handakuten">
      ${big(45, 'か', 'ka')}${plus(110)}<text x="160" y="54" class="fig-result fig-accent-text">゛</text>${arrow(215)}${big(280, 'が', 'ga')}
      <line x1="345" y1="10" x2="345" y2="120" class="fig-rule"/>
      ${big(410, 'は', 'ha')}${plus(475)}<text x="525" y="54" class="fig-result fig-accent-text">゜</text>${arrow(580)}${big(645, 'ぱ', 'pa')}
    </svg>`,
  },

  'youon': {
    caption: {
      en: 'A small ゃ, ゅ or ょ after an i-sound kana merges with it into one beat: き + ゃ = きゃ (kya).',
      ko: 'い단 글자 뒤에 작은 ゃ·ゅ·ょ가 오면 한 박자로 합쳐져요: き + ゃ = きゃ(캬).',
    },
    svg: () => `<svg ${W} viewBox="0 0 520 140" aria-label="Combined kana">
      ${big(60, 'き', 'ki')}${plus(130)}<text x="200" y="54" class="fig-small fig-accent-text">ゃ</text>
      <text x="200" y="128" class="fig-label">small ya</text>${arrow(270)}
      <text x="370" y="54" class="fig-result">き<tspan class="fig-small fig-accent-text">ゃ</tspan></text>
      <text x="380" y="128" class="fig-label">kya · 1 beat</text>
    </svg>`,
  },
};
