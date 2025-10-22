
// === ДАННЫЕ ===
const PHRASES_RU = [
  ["монитора","блик"],["фотошопа","тень"],["клавиатуры","пыль"],
  ["диска","царапина"],["плеера","шум"],["кассеты","треск"],
  ["экрана","блик"],["обоев","градиент"],["баннера","пиксель"],
  ["джинсов","клёш"],["папино","молоко"], ["логотипа","отблеск"],["пейджера","сигнал"],
  ["дисковода","стук"],["обложки","блеск"],["модема","писк"],
  ["принтера","запах"],["сайта","фон"],["курсора","след"],
  ["обоев","узор"],["кассетника","скрип"],
];

const PHRASES_EN = [
  ["monitor","glare"],["photoshop","shadow"],["keyboard","dust"],
  ["disc","scratch"],["player","noise"],["cassette","creak"],
  ["screen","gloss"],["wallpaper","gradient"],["banner","pixel"],
  ["jeans","flare"],["dad’s","milk"],["logo","shine"],["pager","signal"],
  ["drive","knock"],["cover","sparkle"],["modem","beep"],
  ["printer","smell"],["site","background"],["cursor","trail"],
  ["wallpaper","pattern"],["tape","squeak"],
];

const PHRASES = PHRASES_RU; // Alias for backwards compatibility if needed

const FONT_POOL = [
  'Ruslan Display','Stalinist One','Yeseva One','Kelly Slab','Unbounded',
  'Forum','Alice','Kurale','Philosopher','Poiret One','Lobster','Marck Script',
  'IBM Plex Mono','JetBrains Mono','PT Mono','Noto Sans Mono','Anonymous Pro',
  'Oswald','Rubik','Montserrat','Exo 2','Play','Tenor Sans','Didact Gothic','Jura','Ubuntu',
  'Cormorant Garamond','Playfair Display','PT Serif','Noto Serif Display','Oranienbaum','Bitter',
  'PT Sans','Roboto','Neucha','Comfortaa','Russo One',
  'Comforter','Great Vibes','Manrope','Oi','Pixelify Sans','Rubik Iso','Rubik Puddles','Rubik Wet Paint',
  'Tektur','Viaoda Libre'
];

const SANS_POOL = [ 'Inter' ];

// === АВТО-ГЕНЕРАЦИЯ ===
let autoGenerateInterval = null;
const stopAutoGeneration = () => {
  if (autoGenerateInterval) {
    clearInterval(autoGenerateInterval);
    autoGenerateInterval = null;
  }
};


// === ШОРТКАТЫ ===

// --- Модалка мелкого текста ---
const microModal   = document.getElementById('microModal');
const microClose   = document.getElementById('microClose');
const microDone    = document.getElementById('microDone');
const microApply   = document.getElementById('microApply');
const microClear   = document.getElementById('microClear');
const microInput   = document.getElementById('microInput');
const microSize    = document.getElementById('microSize');
const microPosBtns = document.querySelectorAll('.micro-pos');
const stage         = document.getElementById('stage');
const overlay       = document.getElementById('overlay');
const composition   = document.getElementById('composition');
const line1         = document.getElementById('line1');
const line2         = document.getElementById('line2');
const decors        = document.getElementById('decors');
const custom        = document.getElementById('custom');
const bgLayer       = document.getElementById('bgLayer');
const grain         = document.getElementById('grain');

const silhouetteFill   = document.getElementById('silhouetteFill');
const silhouetteStroke = document.getElementById('silhouetteStroke');

const btnGenerate   = document.getElementById('btn');
const btnAiGenerate = document.getElementById('aiGenerate');
const btnRound      = document.getElementById('round');
const btnDownload   = document.getElementById('download');
const btnMoveUp     = document.getElementById('moveUp');
const btnMoveDown   = document.getElementById('moveDown');
const btnCringe     = document.getElementById('cringe');
const btnCrosses    = document.getElementById('crosses');
const btnMicro      = document.getElementById('micro');
const btnInvert     = document.getElementById('invert');
const btnBg         = document.getElementById('bgBtn');
const inpBgUpload   = document.getElementById('bgUpload');
const btnBgClear    = document.getElementById('bgClear');
const btnGradToggle = document.getElementById('gradToggle');
const btnGradClose  = document.getElementById('gradClose');
const btnGradDone   = document.getElementById('gradDone');
const btnGradClear  = document.getElementById('gradClear');
const btnUndo       = document.getElementById('undoAll');

const btnColorToggle = document.getElementById('colorToggle');
const colorModal     = document.getElementById('colorModal');
const colorPick      = document.getElementById('colorPick');
const colorAlpha     = document.getElementById('colorAlpha');
const colorClose     = document.getElementById('colorClose');
const colorDone      = document.getElementById('colorDone');

const strokeToggle        = document.getElementById('strokeToggle');
const strokeColorInput    = document.getElementById('strokeColor');
const strokeWidthInput    = document.getElementById('strokeWidth');
const strokeEnabledInput  = document.getElementById('strokeEnabled');

// Градиент-модалка
const gradModal   = document.getElementById('gradModal');
const gradA       = document.getElementById('gradA');
const gradB       = document.getElementById('gradB');
const gradC       = document.getElementById('gradC');
const gradAngle   = document.getElementById('gradAngle');
const gradBias1   = document.getElementById('gradBias1');
const gradBias2   = document.getElementById('gradBias2');
const gradNoise   = document.getElementById('gradNoise');
const gradNoiseSize = document.getElementById('gradNoiseSize');

const shadowModal   = document.getElementById('shadowModal');
const shadowToggle  = document.getElementById('shadowToggle');
const shadowClose   = document.getElementById('shadowClose');
const shadowDone    = document.getElementById('shadowDone');
const shadowApply   = document.getElementById('shadowApply');
const shadowClear   = document.getElementById('shadowClear');

const shadowColorInp = document.getElementById('shadowColor');
const shadowAlphaInp = document.getElementById('shadowAlpha');
const shadowBlurInp  = document.getElementById('shadowBlur');
const shadowInsetInp = document.getElementById('shadowInset');

const innerShadow   = document.getElementById('innerShadow');
const shadowOffsetXInp = document.getElementById('shadowOffsetX');
const shadowOffsetYInp = document.getElementById('shadowOffsetY');

let isFirstShadowClick = true;

let shadowParams = {
  color: '#B0B0B0',
  alpha: 1,
  blur:  11,
  inset: 30,
  offsetX: -10,
  offsetY: -15,
};

// ===== Размер шрифта по ширине stage =====
const FS_MIN = 20;
const FS_MAX = 102;
const FS_K   = 0.12;

let silAlpha = 1; // фактическая непрозрачность силуэта [0..1]

let currentInk   = '#111111';
let currentBgUrl = '';
let currentBgBlobUrl = '';

// ===== Состояния силуэта/обводки/шума =====
let isRounded       = false;
let maskURL         = '';
let liveStrokeOn    = false;
let strokeOnSil     = false;
let strokeColor     = '#00ff88';
let strokeWidthPx   = 10;
let strokeEnabled   = false;
let strokeMaskURL   = '';

let noiseURL        = '';
let noiseIntensity  = 0;
let noiseSizePx     = 480;

// ===== Сдвиг композиции =====
let compShiftState = 0;
const SHIFT_FACTOR = 0.35;

// === УТИЛЫ ===
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample  = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => arr.map(v=>[Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const pickFonts = () => shuffle([...FONT_POOL]).slice(0, rand(3,6));
const clamp  = (v,min,max)=>Math.max(min,Math.min(max,v));
const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');


// ---- i18n ----
let currentLang = localStorage.getItem('lang') || 'en';

// Тексты
const I18N = {
  ru: {
    title: 'Генератор типографических композиций',
    generate: 'Сгенерить',
    placeholder: 'Ваш Текст',
    up: '▲',
    down: '▼',
    gradient: 'Градиент',
    invert: 'Белый / чёрный',
    micro: 'Мелкий текст',
    bubbles: 'Пузыри',
    crosses: 'Кресты',
    bg_on: 'Фон ✓',
    bg_off: 'Фон ×',
    color: 'Цвет',
    stroke: 'Обводка',
    silhouette: 'Силуэт',
    undo: 'Вернуть',
    download: 'Скачать',
    grad_title: 'Градиент фона',
    grad_c1: 'Цвет 1',
    grad_c2: 'Цвет 2',
    grad_c3: 'Цвет 3',
    grad_angle: 'Угол (°)',
    grad_bias1: 'Смещение между Цвет 1 и Цвет 2 (%)',
    grad_bias2: 'Смещение между Цвет 2 и Цвет 3 (%)',
    grad_noise: 'Шум (интенсивность %)',
    grad_noise_size: 'Размер зерна (px)',
    grad_random: '🎲 Зарандомить',
    grad_clear: 'Убрать градиент',
    done: 'Готово',
    color_title: 'Цвет композиции',
    color_fill: 'Цвет',
    color_alpha: 'Непрозрачность силуэта (%)',
    stroke_color: 'Цвет обводки',
    stroke_width: 'Толщина обводки (px)',
    stroke_enabled: 'Обводка включена',
    credit_label: 'Навайбкодил: ',
     credit_name: 'Олег Кривенко',
    questions: 'По вопросам сюда',
    micro_prompt_title: 'Мелкий текст (слова через пробел):',
micro_prompt_default: 'твой клёвый текст',
    bg_random: 'Рандом фон',
    shadow: 'Тень',
    glitch: 'Глитч',
    micro_title: 'Мелкий текст',
micro_text: 'Текст',
micro_position: 'Позиция',
pos_top_stage: 'Наверху',
pos_bottom_stage: 'Снизу',
pos_above_line1: 'Над текстом',
pos_below_line2: 'Под текстом',
micro_size: 'Размер (px)',
apply: 'Применить',
remove: 'Убрать',
    cringe_bar: 'Кринж: {current}/{max}',
    ultimate: 'Ультануть',
    ai_generate_label: 'Сгенерировать с ИИ',
  },
  en: {
    title: 'Typo Composition Generator',
    generate: 'Generate',
    placeholder: 'Your Text',
    up: '▲',
    down: '▼',
    gradient: 'Gradient',
    invert: 'White / Black',
    micro: 'Small text',
    bubbles: 'Bubbles',
    crosses: 'Crosses',
    bg_on: 'BG ✓',
    bg_off: 'BG ×',
    color: 'Color',
    stroke: 'Stroke',
    silhouette: 'Silhouette',
    undo: 'Undo',
    download: 'Download',
    grad_title: 'Background Gradient',
    grad_c1: 'Color 1',
    grad_c2: 'Color 2',
    grad_c3: 'Color 3',
    grad_angle: 'Angle (°)',
    grad_bias1: 'Offset between Color 1 & 2 (%)',
    grad_bias2: 'Offset between Color 2 & 3 (%)',
    grad_noise: 'Noise (intensity %)',
    grad_noise_size: 'Grain size (px)',
    grad_random: '🎲 Randomize',
    grad_clear: 'Remove gradient',
    done: 'Done',
    color_title: 'Composition Color',
    color_fill: 'Fill',
    color_alpha: 'Silhouette opacity (%)',
    stroke_color: 'Stroke color',
    stroke_width: 'Stroke width (px)',
    stroke_enabled: 'Stroke enabled',
    credit_label: 'Vibecoded by',
    credit_name: 'Oleg Krivenko',
    questions: 'Contact & Troubleshooting',
    micro_prompt_title: 'Small text (space-separated words):',
micro_prompt_default: 'your cool text',
    bg_random: 'Random BG',
    shadow: 'Shadow',
    glitch: 'Glitch',
    micro_title: 'Small text',
micro_text: 'Text',
micro_position: 'Position',
pos_top_stage: 'Top',
pos_bottom_stage: 'Bottom',
pos_above_line1: 'Above text',
pos_below_line2: 'Below text',
micro_size: 'Size (px)',
apply: 'Apply',
remove: 'Remove',
    cringe_bar: 'Cringe: {current}/{max}',
    ultimate: 'Ultimate',
    ai_generate_label: 'Generate with AI',
  }
};

const I18N_MAP = [
  ['.header h1','title'],
  ['#btn','generate'],
  ['#custom', 'placeholder', 'placeholder'],
  ['#moveUp','up'],
  ['#moveDown','down'],
  ['#gradToggle','gradient'],
  ['#invert','invert'],
  ['#micro','micro'],
  ['#cringe','bubbles'],
  ['#crosses','crosses'],
  ['#bgBtn','bg_on'],
  ['#bgClear','bg_off'],
  ['#colorToggle','color'],
  ['#strokeToggle','stroke'],
  ['#round','silhouette'],
  ['#undoAll','undo'],
  ['#download','download'],
  ['.who-3','credit_label'],
  ['a','credit_name'],
  ['.who-1 a','questions'],
  ['#bgRandom > span','bg_random'],
  ['#shadowToggle', 'shadow'],
  ['#gradTitle','grad_title'],
  ['label[for="gradA"]','grad_c1'],
  ['label[for="gradB"]','grad_c2'],
  ['label[for="gradC"]','grad_c3'],
  ['label[for="gradAngle"]','grad_angle'],
  ['label[for="gradBias1"]','grad_bias1'],
  ['label[for="gradBias2"]','grad_bias2'],
  ['label[for="gradNoise"]','grad_noise'],
  ['label[for="gradNoiseSize"]','grad_noise_size'],
  ['#gradRandom','grad_random'],
  ['#gradClear','grad_clear'],
  ['#gradDone','done'],
  ['#colorTitle','color_title'],
  ['label[for="colorPick"]','color_fill'],
  ['label[for="colorAlpha"]','color_alpha'],
  ['label[for="strokeColor"]','stroke_color'],
  ['label[for="strokeWidth"]','stroke_width'],
  ['label[for="strokeEnabled"]','stroke_enabled'],
  ['#microTitle','micro_title'],
  ['label[for="microInput"]','micro_text'],
  ['#microPosLabel','micro_position'],
  ['.micro-pos[data-pos="top-stage"]','pos_top_stage'],
  ['.micro-pos[data-pos="bottom-stage"]','pos_bottom_stage'],
  ['.micro-pos[data-pos="above-line1"]','pos_above_line1'],
  ['.micro-pos[data-pos="below-line2"]','pos_below_line2'],
  ['label[for="microSize"]','micro_size'],
  ['#microApply','apply'],
  ['#microClear','remove'],
  ['#microDone','done'],
  ['#ultimateBtn > span', 'ultimate'],
  ['#aiGenerate', 'ai_generate_label', 'aria-label']
];

// === ЗУМ ОСНОВНОЙ КОМПОЗИЦИИ ===
let mainZoom = 1;
let zoomBeforeRound = 1;
let lastShiftPx = 0;

let shiftBeforeRound = 0;
const ZOOM_MIN = 0.6, ZOOM_MAX = 1.8, ZOOM_STEP = 0.1;

const btnZoomIn  = document.getElementById('zoomIn');
const btnZoomOut = document.getElementById('zoomOut');

function clampZoom(z){ return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)); }

let baseLH1 = null, baseLH2 = null;

function readBaseLH(el){
  if (!el) return 1;
  const cs = getComputedStyle(el);
  const lh = parseFloat(cs.lineHeight);
  const fs = parseFloat(cs.fontSize);
  const ratio = (!isNaN(lh) && !isNaN(fs) && fs > 0) ? (lh / fs) : 1.2;
  return clamp(ratio, 0.6, 2.4);
}

async function applyMainZoom(){
  if (isRounded){
    overlay.style.transform = `translateY(${lastShiftPx}px) scale(${mainZoom})`;
  } else {
    if (baseLH1 === null) baseLH1 = readBaseLH(line1);
    if (baseLH2 === null) baseLH2 = readBaseLH(line2);

    const lh1 = (baseLH1 || 1) * mainZoom;
    const lh2 = (baseLH2 || 1) * mainZoom;

    if (line1){
      line1.style.transform   = `scale(${mainZoom})`;
      line1.style.lineHeight  = lh1;
      line1.style.transformOrigin = 'center center';
    }
    if (line2){
      line2.style.transform   = `scale(${mainZoom})`;
      line2.style.lineHeight  = lh2;
      line2.style.transformOrigin = 'center center';
    }
    
    if (innerShadow.classList.contains('active')) {
      await applyInnerShadow(false);
    }
  }
}

function setPlaceholder(el, text){
  if (el) el.setAttribute('placeholder', text);
}

const I18N_LABELS_BY_INPUT = {
  gradA: 'grad_c1',
  gradB: 'grad_c2',
  gradC: 'grad_c3',
  gradAngle: 'grad_angle',
  gradBias1: 'grad_bias1',
  gradBias2: 'grad_bias2',
  gradNoise: 'grad_noise',
  gradNoiseSize: 'grad_noise_size',
  colorPick: 'color_fill',
  colorAlpha: 'color_alpha',
  strokeColor: 'stroke_color',
  strokeWidth: 'stroke_width',
  strokeEnabled: 'stroke_enabled',
   microInput: 'micro_text',
  microSize:  'micro_size',
};

function setWrappingLabelText(inputId, text){
  const input = document.getElementById(inputId);
  if (!input) return;
  const label = input.closest('label');
  if (!label) return;

  for (const node of label.childNodes){
    if (node.nodeType === Node.TEXT_NODE){
      node.nodeValue = text + ' ';
      return;
    }
  }
  label.prepend(document.createTextNode(text + ' '));
}

function applyLang(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  const t = I18N[lang];

  I18N_MAP.forEach(([sel, key, attr])=>{
    const el = document.querySelector(sel);
    if (!el) return;

    if (sel.endsWith('::placeholder')){ // This case is now obsolete but kept for safety
      const realSel = sel.replace('::placeholder','');
      const realEl = document.querySelector(realSel);
      setPlaceholder(realEl, t[key]);
    } else if (attr) {
      el.setAttribute(attr, t[key]);
    } else {
      if (el.childElementCount === 0 || el.tagName === 'SPAN') {
        el.textContent = t[key];
      } else {
        let changed = false;
        for (const node of el.childNodes){
          if (node.nodeType === Node.TEXT_NODE){
            node.nodeValue = ' ' + t[key] + ' ';
            changed = true;
            break;
          }
        }
        if (!changed) el.prepend(document.createTextNode(t[key] + ' '));
      }
    }
  });

for (const [inputId, key] of Object.entries(I18N_LABELS_BY_INPUT)){
  setWrappingLabelText(inputId, t[key]);
}

    const mi = document.getElementById('microInput');
if (mi) mi.placeholder = I18N[lang]?.micro_prompt_default || mi.placeholder;

 document.querySelectorAll('.lang-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === lang);
  });
document.documentElement.setAttribute('lang', lang);
  document.documentElement.classList.add('i18n-ready');
  updateCringeUI();
}

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.lang-btn');
  if (!btn) return;
  applyLang(btn.dataset.lang);
});



function mixedCase(word){
  return Array.from(word).map(ch =>
    /[A-Za-zА-Яа-яЁё]/.test(ch) ? (Math.random() < 0.3 ? ch.toUpperCase() : ch.toLowerCase()) : ch
  ).join('');
}

function renderWord(el, word, fonts){
  el.innerHTML = '';
  const chunk = rand(1,3);
  const isMobile = window.innerWidth <= 640;

  Array.from(word).forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'ch';
    const font = fonts[Math.floor(i / chunk) % fonts.length];
    span.style.fontFamily = `'${font}', sans-serif`;

    const scale = isMobile ? rand(142, 242) / 100 : rand(82, 182) / 100;
    span.style.fontSize = scale + 'em';
    span.style.fontWeight = rand(1,3) ? 900 : 500;
    const skew = rand(-20, 5);
    span.style.transform = `rotate(0deg) skew(${skew}deg)`;
    span.textContent = ch;
    el.appendChild(span);
  });
}

function getCustomLines(){
  const t = (custom?.value || '').trim();
  if (!t) return null;
  const parts = t.split(/\r?\n/).slice(0,2);
  return parts.length === 1 ? [parts[0], ''] : parts;
}

function updateFontSize() {
  const w = stage?.getBoundingClientRect().width || 0;
  const size = Math.min(FS_MAX, Math.max(FS_MIN, w * FS_K));
  if (line1) line1.style.fontSize = size + 'px';
  if (line2) line2.style.fontSize = size + 'px';
}

function loadImage(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function paintGradient(ctx, w, h, gradientStr){
  const m = gradientStr.match(/linear-gradient\(([-\d.]+)deg\s*,([\s\S]+)\)$/i);
  const angle = m ? parseFloat(m[1]) : 135;
  const stopsStr = m ? m[2] : '#000 0%, #fff 100%';

  const stopRegex = /(rgba?\([^)]+\)|#[0-9a-f]{3,8})\s*(\d+)%/ig;
  const stops = [];
  let s;
  while ((s = stopRegex.exec(stopsStr)) !== null){
    stops.push({ color: s[1], pos: Math.min(100, Math.max(0, parseFloat(s[2]))) });
  }
  if (!stops.length){ stops.push({color:'#000',pos:0},{color:'#fff',pos:100}); }

  const rad = angle * Math.PI/180;
  const L = Math.max(w, h);
  const cx = w/2, cy = h/2;
  const dx = Math.cos(rad)*L, dy = Math.sin(rad)*L;

  const g = ctx.createLinearGradient(cx-dx, cy-dy, cx+dx, cy+dy);
  stops.forEach(st=>g.addColorStop(st.pos/100, st.color));
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
}

function clearSilhouetteFill(){
  silhouetteFill?.classList.remove('active');
  if (silhouetteFill){
    silhouetteFill.style.background = '';
    silhouetteFill.style.backgroundImage = '';
    silhouetteFill.style.webkitMaskImage = '';
    silhouetteFill.style.maskImage = '';
  }
}

function resetRoundState({force=false} = {}) {
  if (!force && isRounded) return;

  isRounded = false;
  maskURL = '';

  if (overlay){
    overlay.hidden = true;
    overlay.style.backgroundImage = '';
    overlay.style.backgroundColor = '';
    overlay.classList.remove('threshold-only');
    overlay.style.transform = '';
  }

  if (silhouetteStroke){
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.background = '';
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
    silhouetteStroke.style.transform = '';
  }
  strokeMaskURL = '';

  clearSilhouetteFill();

  if (composition) composition.style.visibility = 'visible';
  if (btnUndo) btnUndo.hidden = true;
}

let microState = {
  text: '',
  pos: 'top-stage',
  sizePx: 14
};

function removeMicro(){
  composition?.querySelector('.micro-row')?.remove();
  stage?.querySelectorAll('.micro-floating').forEach(n => n.remove());
}

function makeMicroRow(words, sizePx){
  const row = document.createElement('div');
  row.className = 'micro-row';
  row.style.setProperty('--micro-fs', `${sizePx}px`);
  row.style.fontFamily = `'${sample(SANS_POOL)}', system-ui, sans-serif`;
  words.forEach(w=>{
    const chip = document.createElement('span');
    chip.className = 'micro-chip';
    chip.textContent = w;
    row.appendChild(chip);
  });
  return row;
}

function renderMicro(){
  removeMicro();
  const words = (microState.text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;

  if (microState.pos === 'top-stage' || microState.pos === 'bottom-stage'){
    const wrap = document.createElement('div');
    wrap.className = `micro-floating ${microState.pos === 'top-stage' ? 'top' : 'bottom'}`;
    wrap.style.color = currentInk || (stage.classList.contains('light') ? '#fff' : '#000');
    wrap.appendChild(makeMicroRow(words, microState.sizePx));
    stage.appendChild(wrap);
  } else {
    const row = makeMicroRow(words, microState.sizePx);
    if (microState.pos === 'above-line1'){
      composition.insertBefore(row, line1);
    } else {
      composition.insertBefore(row, line2.nextSibling);
    }
  }

  resetRoundState();
  applyCompositionShift();
}


function generate(){
  resetRoundState({force:true});
  removeMicro();
  stage?.querySelectorAll('.ch.outlined').forEach(n => n.classList.remove('outlined'));

  const customLines = getCustomLines();
 const pool = currentLang === 'en' ? PHRASES_EN : PHRASES_RU;
const [w1, w2] = customLines ?? sample(pool);
  const fonts = pickFonts();

  if (line1) renderWord(line1, mixedCase(w1), fonts);
  if (line2) renderWord(line2, mixedCase(w2), fonts);

  document.querySelector('.l1')?.style && (document.querySelector('.l1').style.letterSpacing = rand(-3, -2) + 'px');
  document.querySelector('.l2')?.style && (document.querySelector('.l2').style.letterSpacing = rand(-3, -2) + 'px');

  if (composition) composition.style.visibility = 'visible';
  if (overlay) overlay.style.transform = '';

  applyCompositionShift();
  updateFontSize();
  applyMainZoom();

  currentInk = stage?.classList.contains('light') ? '#ffffff' : '#000000';
  if (composition) composition.style.color = currentInk;

  if (btnUndo) btnUndo.hidden = true;
}

function applyLiveStroke(){
  if (!composition) return;
  if (liveStrokeOn){
    composition.classList.add('with-stroke');
    composition.style.setProperty('--stroke-color', strokeColor);
    composition.style.setProperty('--stroke-w', strokeWidthPx + 'px');
  } else {
    composition.classList.remove('with-stroke');
    composition.style.removeProperty('--stroke-color');
    composition.style.removeProperty('--stroke-w');
  }
}

async function buildOuterStrokeMask(baseMaskURL, growPx){
  if (!baseMaskURL || growPx <= 0) return '';
  const srcImg = await loadImage(baseMaskURL);
  const w = srcImg.width, h = srcImg.height;

  const c   = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const src = document.createElement('canvas'); src.width = w; src.height = h;
  const sctx = src.getContext('2d');
  sctx.drawImage(srcImg, 0, 0, w, h);

  const r = Math.max(1, Math.round(growPx * 1));
  const step = Math.max(1, Math.round(r / 3));
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(src, 0, 0);

  for (let dy = -r; dy <= r; dy += step){
    for (let dx = -r; dx <= r; dx += step){
      if (dx === 0 && dy === 0) continue;
      ctx.drawImage(src, dx, dy);
    }
  }

  const imgData = ctx.getImageData(0,0,w,h);
  const a = imgData.data;
  for (let i=0;i<a.length;i+=4){
    const alpha = a[i+3] > 0 ? 255 : 0;
    a[i]=255; a[i+1]=255; a[i+2]=255; a[i+3]=alpha;
  }
  ctx.putImageData(imgData,0,0);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  return c.toDataURL('image/png');
}

async function erodeMaskURL(maskURL, shrinkPx){
  if (!maskURL || shrinkPx <= 0) return maskURL;

  const srcImg = await loadImage(maskURL);
  const w = srcImg.width, h = srcImg.height;

  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation = 'destination-in';

  const r = Math.max(1, Math.round(shrinkPx));
  const step = Math.max(1, Math.round(r / 3));

  for (let dy = -r; dy <= r; dy += step){
    for (let dx = -r; dx <= r; dx += step){
      ctx.drawImage(srcImg, dx, dy);
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  return c.toDataURL('image/png');
}

async function buildInnerShadowPNG(maskURL, {color, alpha, blur, inset, offsetX=0, offsetY=0}) {
    if (!maskURL) return '';

    const erodedURL = inset > 0 ? await erodeMaskURL(maskURL, inset) : maskURL;
    const srcImg = await loadImage(maskURL);
    const eroImg = await loadImage(erodedURL);
    const w = srcImg.width, h = srcImg.height;

    // Create the "ring" shape to be blurred
    const ring = document.createElement('canvas');
    ring.width = w; ring.height = h;
    const rctx = ring.getContext('2d');
    rctx.drawImage(srcImg, 0, 0);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.drawImage(eroImg, 0, 0);
    rctx.globalCompositeOperation = 'source-over';

    let imageToDraw = ring; // By default, draw the un-blurred ring

    // If blur is needed, create a blurred version via a robust SVG filter
    if (blur > 0) {
        const ringURL = ring.toDataURL();
        const stdDeviation = blur / 2; // SVG blur parameter is roughly radius/2

        // Use a filter region larger than the canvas to prevent the blur from being clipped
        const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <defs>
          <filter id="shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="${stdDeviation}" />
          </filter>
        </defs>
        <image href="${ringURL}" width="${w}" height="${h}" filter="url(#shadow-blur)" />
      </svg>
    `;
        try {
            // Encode the SVG and load it as an image. This is highly compatible.
            const svgURL = 'data:image/svg+xml;base64,' + btoa(svgString);
            imageToDraw = await loadImage(svgURL);
        } catch (e) {
            console.error("Failed to create SVG blur, falling back to no blur.", e);
            imageToDraw = ring; // Fallback to un-blurred on error
        }
    }

    // Create the final output canvas
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const octx = out.getContext('2d');

    // Step 1: Fill with shadow color
    octx.fillStyle = color;
    octx.fillRect(0, 0, w, h);

    // Step 2: Mask with the (potentially blurred) ring shape
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(imageToDraw, offsetX, offsetY);
    octx.globalCompositeOperation = 'source-over';

    // Step 3: Apply overall transparency if needed
    if (alpha < 1) {
        octx.globalCompositeOperation = 'destination-in';
        octx.fillStyle = `rgba(0,0,0,${alpha})`;
        octx.fillRect(0, 0, w, h);
        octx.globalCompositeOperation = 'source-over';
    }

    // Step 4: Mask with the original silhouette to create the "inner" effect
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(srcImg, 0, 0);
    octx.globalCompositeOperation = 'source-over';

    return out.toDataURL('image/png');
}


function openShadow(){
  shadowModal.hidden = false;
  shadowColorInp.value = shadowParams.color;
  shadowAlphaInp.value = Math.round(shadowParams.alpha * 100);
  shadowBlurInp.value  = shadowParams.blur;
  shadowInsetInp.value = shadowParams.inset;
  shadowOffsetXInp.value = shadowParams.offsetX;
  shadowOffsetYInp.value = shadowParams.offsetY;
}

function randomizeShadowParams() {
    shadowParams.color = randomHex();
    shadowParams.alpha = (rand(25, 85) / 100);
    shadowParams.blur = rand(10, 50);
    shadowParams.inset = rand(5, 30);
    shadowParams.offsetX = rand(-25, 25);
    shadowParams.offsetY = rand(-25, 25);
}

async function randomizeAndApplyShadow() {
    randomizeShadowParams();
    // Update the input fields to match the new random parameters
    shadowColorInp.value = shadowParams.color;
    shadowAlphaInp.value = Math.round(shadowParams.alpha * 100);
    shadowBlurInp.value  = shadowParams.blur;
    shadowInsetInp.value = shadowParams.inset;
    shadowOffsetXInp.value = shadowParams.offsetX;
    shadowOffsetYInp.value = shadowParams.offsetY;
    // Apply the shadow using the parameters object
    await applyInnerShadow(false);
}


async function applyInnerShadow(readFromInputs = true){
  if (readFromInputs) {
      shadowParams.color  = shadowColorInp.value || shadowParams.color;
      shadowParams.alpha  = clamp(+shadowAlphaInp.value/100, 0, 1);
      shadowParams.blur   = Math.max(0, +shadowBlurInp.value || 0);
      shadowParams.inset  = Math.max(0, +shadowInsetInp.value || 0);
      shadowParams.offsetX = Math.round(+shadowOffsetXInp.value || 0);
      shadowParams.offsetY = Math.round(+shadowOffsetYInp.value || 0);
  }

  const baseMaskURL = isRounded && maskURL ? maskURL : await buildCurrentMaskURL();
  const pngURL = await buildInnerShadowPNG(baseMaskURL, shadowParams);

  if (pngURL){
    innerShadow.style.backgroundImage = `url(${pngURL})`;
    innerShadow.classList.add('active');
    overlay.hidden = false;
    overlay.style.background = 'transparent';
overlay.style.transform = isRounded
  ? `translateY(${lastShiftPx}px) scale(${mainZoom})`
  : '';
  } else {
    innerShadow.classList.remove('active');
    innerShadow.style.backgroundImage = '';
  }
}

function clearInnerShadow(){
  innerShadow.classList.remove('active');
  innerShadow.style.backgroundImage = '';
}

shadowToggle?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;

    if (isFirstShadowClick) {
        btn.disabled = true;
        btn.classList.add('loading');
        try {
            // First attempt to apply shadow and update inputs
            await randomizeAndApplyShadow();
            
            // Programmatically "click" the Apply button. This mimics the user's
            // manual action that forces the render on mobile.
            shadowApply.click(); 
            
            // Give the browser a moment to process the render triggered by the click.
            await sleep(100);

            isFirstShadowClick = false;
        } catch (err) {
            console.error("Error applying random shadow", err);
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
            openShadow(); // Now open the modal with the correct values shown
        }
    } else {
        openShadow();
    }
});
shadowClose?.addEventListener('click', ()=> shadowModal.hidden = true);
shadowDone?.addEventListener('click',  ()=> shadowModal.hidden = true);
shadowClear?.addEventListener('click', clearInnerShadow);
shadowApply?.addEventListener('click', () => applyInnerShadow(true));

[shadowColorInp, shadowAlphaInp, shadowBlurInp, shadowInsetInp, shadowOffsetXInp, shadowOffsetYInp]
  .forEach(inp => inp?.addEventListener('input', () => applyInnerShadow(true)));

document.querySelector('label[for="strokeEnabled"]')?.addEventListener('click', e=>{
  e.preventDefault();
  strokeEnabledInput.checked = !strokeEnabledInput.checked;
  strokeEnabledInput.dispatchEvent(new Event('change',{bubbles:true}));
});

function forceRepaint(el){
  if (!el) return;
  const prev = el.style.transform;
  el.style.transform = (prev ? prev + ' ' : '') + 'translateZ(0)';
  void el.offsetHeight;
  el.style.transform = prev || '';
}

async function applySilhouetteStroke(){
  if (!silhouetteStroke) return;

  if (!isRounded || !maskURL || !strokeOnSil || strokeWidthPx <= 0){
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.backgroundImage = '';
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
    while (silhouetteStroke.firstChild) silhouetteStroke.removeChild(silhouetteStroke.firstChild);
    return;
  }

  const coloredRingURL = await buildColoredRing(maskURL, Math.max(1, strokeWidthPx), strokeColor);
  if (!coloredRingURL){
    silhouetteStroke.classList.remove('active');
    while (silhouetteStroke.firstChild) silhouetteStroke.removeChild(silhouetteStroke.firstChild);
    return;
  }

  silhouetteStroke.style.webkitMaskImage = '';
  silhouetteStroke.style.maskImage = '';
  silhouetteStroke.style.backgroundImage = 'none';
  silhouetteStroke.style.background = 'transparent';

  let imgEl = silhouetteStroke.querySelector('img');
  if (!imgEl){
    imgEl = document.createElement('img');
    imgEl.alt = '';
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    silhouetteStroke.appendChild(imgEl);
  }

  imgEl.src = coloredRingURL + '#' + Date.now();
  silhouetteStroke.classList.add('active');
  silhouetteStroke.style.background = 'transparent';
  silhouetteStroke.style.transform += ' translateZ(0)';
  void silhouetteStroke.offsetHeight;
  silhouetteStroke.style.transform = silhouetteStroke.style.transform.replace(' translateZ(0)', '');
}

function makeNoiseTexture(tile=64, alpha=28) {
  const c = document.createElement('canvas');
  c.width = c.height = tile;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(tile, tile);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

function applyGrain() {
  if (!grain) return;
  if (noiseIntensity <= 0) {
    grain.hidden = true;
    grain.style.backgroundImage = '';
    return;
  }
  if (!noiseURL) noiseURL = makeNoiseTexture(512, 255);
  grain.style.backgroundImage = `url(${noiseURL})`;
  grain.style.backgroundSize = `${noiseSizePx}px ${noiseSizePx}px`;
  grain.style.opacity = noiseIntensity.toFixed(2);
  grain.hidden = false;
}

const FEATHER = 8;

function buildThreeStopGradient() {
  const a = gradA?.value || '#ff6b6b';
  const b = gradB?.value || '#4d96ff';
  const c = gradC?.value || '#00c9a7';
  const ang = Number(gradAngle?.value ?? 180);

  let p1 = Number(gradBias1?.value ?? 33);
  let p2 = Number(gradBias2?.value ?? 66);

  p1 = clamp(p1, 0, 100);
  p2 = clamp(p2, 0, 100);
  if (p2 < p1) p2 = p1;

  const f1 = Math.min(FEATHER, p1);
  const f2 = Math.min(FEATHER, 100 - p2);

  const css = `linear-gradient(${ang}deg,
    ${a} 0%, ${a} ${p1 - f1}%,
    ${b} ${p1 + f1}%, ${b} ${p2 - f2}%,
    ${c} ${p2 + f2}%, ${c} 100%)`;

  return css.replace(/\s+/g, ' ');
}

function applyGradientLive(){
  if (!bgLayer) return;
  bgLayer.style.backgroundImage = buildThreeStopGradient();
  bgLayer.hidden = false;
  applyGrain();
}

let gradWasOpened = false;

function openGrad(){
  if (!gradModal) return;
  gradModal.hidden = false;

  if (!gradWasOpened) {
    randomGradient();
    gradWasOpened = true;
  } else {
    applyGradientLive();
  }

  if (gradNoise)     gradNoise.value     = Math.round(noiseIntensity * 100);
  if (gradNoiseSize) gradNoiseSize.value = noiseSizePx;
}

function closeGrad(){
  if (!gradModal) return;
  gradModal.hidden = true;
}

function randomGradient() {
  gradA.value = randomHex();
  gradB.value = randomHex();
  gradC.value = randomHex();
  gradAngle.value = rand(0, 360);

  let p1 = rand(10, 45);
  let p2 = rand(p1 + 10, 90);
  gradBias1.value = p1;
  gradBias2.value = p2;

  noiseIntensity = Math.random() < .8 ? rand(5, 25) / 100 : 0;
  noiseSizePx    = rand(300, 800);
  if (gradNoise)     gradNoise.value     = Math.round(noiseIntensity * 100);
  if (gradNoiseSize) gradNoiseSize.value = noiseSizePx;

  applyGradientLive();
}

gradNoise?.addEventListener('input', () => {
  noiseIntensity = clamp(+gradNoise.value / 100, 0, 1);
  applyGrain();
});
gradNoiseSize?.addEventListener('input', () => {
  noiseSizePx = Math.max(1, +gradNoiseSize.value || 3);
  applyGrain();
});

function clearBackgroundAll(){
  if (bgLayer){
    bgLayer.style.backgroundImage   = '';
    bgLayer.style.backgroundSize    = '';
    bgLayer.style.backgroundRepeat  = '';
    bgLayer.style.backgroundPosition= '';
    bgLayer.hidden = true;
  }
  noiseIntensity = 0;
  noiseURL = '';
  applyGrain();
}

async function roundCorners() {
  const SCALE = 2;
  const { width, height } = stage.getBoundingClientRect();

  const wasRounded   = isRounded;
  const prevMaskURL  = maskURL;
  const wasStroke    = strokeOnSil;
  const prevAlpha    = Number.isFinite(silAlpha)
    ? silAlpha
    : (parseFloat(getComputedStyle(silhouetteFill).opacity) || 1);
const ty = lastShiftPx * SCALE;

  const snap = stage.cloneNode(true);
  const snapOverlay = snap.querySelector('#overlay');
  if (snapOverlay) snapOverlay.hidden = true;

  Object.assign(snap.style, {
    position: 'fixed', left: '-99999px', top: '0',
    width: width + 'px', height: height + 'px'
  });
  document.body.appendChild(snap);

  const overlayWasHidden = overlay.hidden;
  overlay.hidden = true;

  const baseCanvas = await html2canvas(snap, {
    backgroundColor: '#ffffff',
    scale: SCALE,
    useCORS: true,
    scrollX: 0, scrollY: 0,
    windowWidth: width, windowHeight: height
  });

  overlay.hidden = overlayWasHidden;
  document.body.removeChild(snap);

  const flat = document.createElement('canvas');
  flat.width  = baseCanvas.width;
  flat.height = baseCanvas.height;
  const fctx = flat.getContext('2d');
  fctx.drawImage(baseCanvas, 0, 0);

  if (wasRounded && prevMaskURL) {
    if (wasStroke) {
      let ringURL = (getComputedStyle(silhouetteStroke).webkitMaskImage ||
                     getComputedStyle(silhouetteStroke).maskImage || '').toString();
      if (ringURL.startsWith('url(')) {
        ringURL = ringURL.slice(4, -1).replaceAll('"','').replaceAll("'","");
      } else {
        ringURL = await buildOuterStrokeMask(prevMaskURL, Math.max(1, strokeWidthPx));
      }
      if (ringURL) {
        const ring = await loadImage(ringURL);
        const sCanvas = document.createElement('canvas');
        sCanvas.width = flat.width; sCanvas.height = flat.height;
        const sctx = sCanvas.getContext('2d');
        sctx.fillStyle = strokeColor;
        sctx.fillRect(0,0,sCanvas.width,sCanvas.height);
        sctx.globalCompositeOperation = 'destination-in';
        sctx.drawImage(ring, 0, 0, sCanvas.width, sCanvas.height);
        sctx.globalCompositeOperation = 'source-over';
        fctx.drawImage(sCanvas, 0, ty);
      }
    }

    const cs   = getComputedStyle(silhouetteFill);
    const bgImg= cs.backgroundImage;
    const bgCol= cs.backgroundColor;

    const fill = document.createElement('canvas');
    fill.width = flat.width; fill.height = flat.height;
    const ctx = fill.getContext('2d');

    if (bgImg && bgImg.startsWith('linear-gradient')) {
      paintGradient(ctx, fill.width, fill.height, bgImg);
    } else if (bgImg && bgImg.startsWith('url(')) {
      const url = bgImg.slice(4, -1).replaceAll('"','').replaceAll("'","");
      try {
        const img = await loadImage(url);
        ctx.drawImage(img, 0, 0, fill.width, fill.height);
      } catch {
        ctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000');
        ctx.fillRect(0,0,fill.width,fill.height);
      }
    } else {
      ctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000');
      ctx.fillRect(0,0,fill.width,fill.height);
    }

    const mImg = await loadImage(prevMaskURL);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mImg, 0, 0, fill.width, fill.height);
    ctx.globalCompositeOperation = 'source-over';

    if (prevAlpha < 1) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = `rgba(0,0,0,${prevAlpha})`;
      ctx.fillRect(0, 0, fill.width, fill.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    fctx.drawImage(fill, 0, ty);
  }

  const work = document.createElement('canvas');
  work.width = flat.width; work.height = flat.height;
  const wctx = work.getContext('2d');

  wctx.filter = 'blur(2.5px)';
  wctx.drawImage(flat, 0, 0);
  wctx.filter = 'none';

  const img = wctx.getImageData(0, 0, work.width, work.height);
  const d = img.data, THRESHOLD = 120;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const lum = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i] = d[i+1] = d[i+2] = 255;
    d[i+3] = lum < THRESHOLD ? 255 : 0;
  }
  wctx.putImageData(img, 0, 0);
  maskURL = work.toDataURL('image/png');

overlay.hidden = false;
overlay.style.background = 'transparent';

shiftBeforeRound = compShiftState;
compShiftState   = 0;
lastShiftPx      = 0;
overlay.style.transform = 'translateY(0) scale(1)'; // Explicitly set scale to 1

silhouetteFill.style.background = currentInk;
silhouetteFill.style.webkitMaskImage = `url(${maskURL})`;
silhouetteFill.style.maskImage      = `url(${maskURL})`;
silhouetteFill.classList.add('active');

zoomBeforeRound = mainZoom;
mainZoom = 1;

if (line1) line1.style.transform = '';
if (line2) line2.style.transform = '';
baseLH1 = baseLH2 = null;

applyCompositionShift();
applyMainZoom();

silAlpha = Number.isFinite(prevAlpha) ? prevAlpha : 1;
silhouetteFill.style.opacity = silAlpha.toFixed(2);

composition.style.visibility = 'hidden';

removeMicro();

await applySilhouetteStroke();
if (innerShadow.classList.contains('active')) {
  await applyInnerShadow(false);
}

if (liveStrokeOn) { liveStrokeOn = false; applyLiveStroke(); }
if (btnUndo) btnUndo.hidden = false;

  composition.style.visibility = 'hidden';

  removeMicro();

  await applySilhouetteStroke();

  if (liveStrokeOn) { liveStrokeOn = false; applyLiveStroke(); }

  isRounded = true;
  if (btnUndo) btnUndo.hidden = false;

if (innerShadow.classList.contains('active')) {
  await applyInnerShadow(false);
}
}

async function buildCurrentMaskURL(){
  const SCALE = 2;
  const { width, height } = stage.getBoundingClientRect();

  const snap = stage.cloneNode(true);
  const snapOverlay = snap.querySelector('#overlay');
  if (snapOverlay) snapOverlay.hidden = true;

  Object.assign(snap.style, {
    position:'fixed', left:'-99999px', top:'0',
    width: width + 'px', height: height + 'px'
  });
  document.body.appendChild(snap);

  const baseCanvas = await html2canvas(snap, {
    backgroundColor: '#ffffff',
    scale: SCALE,
    useCORS: true,
    scrollX: 0, scrollY: 0,
    windowWidth: width, windowHeight: height
  });

  document.body.removeChild(snap);

  const work = document.createElement('canvas');
  work.width = baseCanvas.width;
  work.height = baseCanvas.height;
  const wctx = work.getContext('2d');

  wctx.filter = 'blur(3.5px)';
  wctx.drawImage(baseCanvas, 0, 0);
  wctx.filter = 'none';

  const img = wctx.getImageData(0, 0, work.width, work.height);
  const d = img.data, THRESHOLD = 140;
  for (let i=0;i<d.length;i+=4){
    const r = d[i], g = d[i+1], b = d[i+2];
    const lum = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i]=255; d[i+1]=255; d[i+2]=255;
    d[i+3]= lum < THRESHOLD ? 255 : 0;
  }
  wctx.putImageData(img,0,0);

  return work.toDataURL('image/png');
}

function undoAll({ preserveCurrentState = false } = {}) {
  // Store the state we might want to preserve
  const currentZoom = mainZoom;
  const currentShift = compShiftState;

  if (composition) composition.style.visibility = 'visible';
  resetRoundState({ force: true });

  if (line1) line1.style.lineHeight = '';
  if (line2) line2.style.lineHeight = '';
  baseLH1 = baseLH2 = null;

  // If preserving, use current values. If not (standard "Undo"), restore pre-silhouette state.
  mainZoom = preserveCurrentState ? currentZoom : zoomBeforeRound;
  compShiftState = preserveCurrentState ? currentShift : shiftBeforeRound;

  applyCompositionShift();

  liveStrokeOn = false;
  strokeOnSil = false;
  applyLiveStroke();

  if (silhouetteStroke) {
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
  }
  if (overlay) {
    overlay.style.transform = '';
  }
  if (silhouetteFill) {
    silhouetteFill.style.transform = '';
  }
  if (btnUndo) btnUndo.hidden = true;

  clearInnerShadow();
  applyMainZoom(); // Apply the determined zoom level
}

function applyCompositionShift() {
  if (!composition) return;
  const baseRect = composition.getBoundingClientRect();
  const compH = baseRect.height || 0;
  const px = Math.round(compH * SHIFT_FACTOR);
  const offset = compShiftState === 1 ? -px : compShiftState === -1 ? px : 0;

  lastShiftPx = offset;

  const t = `translateY(${offset}px)`;
  composition.style.transform = t;

  if (isRounded) {
    overlay.style.transform = `${t} scale(${mainZoom})`;
    silhouetteFill.style.transform = '';
    if (silhouetteStroke) silhouetteStroke.style.transform = '';
  }
}

function getTranslateY(el){
  if (!el) return 0;
  const tr = getComputedStyle(el).transform;
  if (!tr || tr === 'none') return 0;
  const m = tr.match(/matrix\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map(v=>parseFloat(v));
    return p[5] || 0;
  }
  const t = tr.match(/translateY\((-?\d+(?:\.\d+)?)px\)/i);
  return t ? parseFloat(t[1]) : 0;
}

function kickSafariRepaint(el){
  if (!el) return;
  el.style.transform += ' rotate(0.0001deg)';
  void el.offsetHeight;
  el.style.transform = el.style.transform.replace(' rotate(0.0001deg)', '');
}

async function buildColoredRing(baseMaskURL, growPx, color){
  const ringMaskURL = await buildOuterStrokeMask(baseMaskURL, Math.max(1, growPx));
  if (!ringMaskURL) return '';

  const maskImg = await loadImage(ringMaskURL);
  const w = maskImg.width, h = maskImg.height;

  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = color;
  ctx.fillRect(0,0,w,h);

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskImg, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  return c.toDataURL('image/png');
}

async function downloadPng(){
  const SCALE = window.devicePixelRatio || 2;
  const { width, height } = stage.getBoundingClientRect();

  const baseClone = stage.cloneNode(true);
  const grainClone = baseClone.querySelector('#grain');
  if (grainClone) grainClone.hidden = true;
  const baseOv = baseClone.querySelector('#overlay');
  if (baseOv) baseOv.hidden = true;

  baseClone.classList.add('exporting');
  baseClone.style.border = '0';
  baseClone.style.borderRadius = '0';

  Object.assign(baseClone.style, {
    position:'fixed', left:'-99999px', top:'0',
    width: width + 'px', height: height + 'px'
  });
  document.body.appendChild(baseClone);

  const baseCanvas = await html2canvas(baseClone, {
    backgroundColor: null,
    scale: SCALE,
    useCORS: true,
    scrollX: 0, scrollY: 0,
    windowWidth: width, windowHeight: height
  });

  document.body.removeChild(baseClone);

  const out = document.createElement('canvas');
  out.width  = baseCanvas.width;
  out.height = baseCanvas.height;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;

  octx.drawImage(baseCanvas, 0, 0);

 const ty = lastShiftPx * SCALE;

if (isRounded && strokeOnSil && maskURL){
  let ringURL = silhouetteStroke?.querySelector('img')?.src || '';

  if (!ringURL || ringURL.startsWith('data:') === false){
    ringURL = await buildColoredRing(maskURL, Math.max(1, strokeWidthPx), strokeColor);
  }

  if (ringURL){
    const ringImg = await loadImage(ringURL);
    octx.drawImage(ringImg, 0, ty, out.width, out.height);
  }
}

  if (isRounded && silhouetteFill.classList.contains('active') && maskURL){
    const cs = getComputedStyle(silhouetteFill);
    const bgImg = cs.backgroundImage;
    const bgCol = cs.backgroundColor;
    const alpha = Number.isFinite(silAlpha) ? silAlpha : 1;

    const fill = document.createElement('canvas');
    fill.width = out.width; fill.height = out.height;
    const fctx = fill.getContext('2d');

    if (bgImg && bgImg.startsWith('linear-gradient')) {
      paintGradient(fctx, fill.width, fill.height, bgImg);
    } else if (bgImg && bgImg.startsWith('url(')) {
      const url = bgImg.slice(4, -1).replaceAll('"','').replaceAll("'","");
      try {
        const img = await loadImage(url);
        fctx.drawImage(img, 0, 0, fill.width, fill.height);
      } catch {
        fctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000');
        fctx.fillRect(0,0,fill.width,fill.height);
      }
    } else {
      fctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000');
      fctx.fillRect(0,0,fill.width,fill.height);
    }

const mImg = await loadImage(maskURL);
fctx.globalCompositeOperation = 'destination-in';
fctx.drawImage(mImg, 0, 0, fill.width, fill.height);
fctx.globalCompositeOperation = 'source-over';

if (alpha < 1) {
  fctx.globalCompositeOperation = 'destination-in';
  fctx.fillStyle = `rgba(0,0,0,${alpha})`;
  fctx.fillRect(0, 0, fill.width, fill.height);
  fctx.globalCompositeOperation = 'source-over';
}
octx.drawImage(fill, 0, ty);
  }

if (innerShadow.classList.contains('active')) {
  const bg = innerShadow.style.backgroundImage || '';
  const m = bg.match(/^url\(["']?(.+?)["']?\)/i);
  if (m && m[1]) {
    const shImg = await loadImage(m[1]);
    octx.drawImage(shImg, 0, ty, out.width, out.height);
  }
}

  if (noiseIntensity > 0) {
    if (!noiseURL) noiseURL = makeNoiseTexture(512, 255);
    try {
      const noiseImg = await loadImage(noiseURL);
      const scaleFactor = (noiseSizePx / noiseImg.width) * SCALE;
      const w = noiseImg.width * scaleFactor;
      const h = noiseImg.height * scaleFactor;

      octx.globalCompositeOperation = 'multiply';
      octx.globalAlpha = noiseIntensity;

      for (let y = 0; y < out.height; y += h) {
        for (let x = 0; x < out.width; x += w) {
          octx.drawImage(noiseImg, x, y, w, h);
        }
      }

      octx.globalCompositeOperation = 'source-over';
      octx.globalAlpha = 1.0;
    } catch (e) {
      console.error("Failed to apply grain during export", e);
      octx.globalCompositeOperation = 'source-over';
      octx.globalAlpha = 1.0;
    }
  }

  out.toBlob((blob)=>{
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'print.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function clearCrosses(){ if (decors) decors.innerHTML = ''; }

function toggleCrosses(){
  if (!decors) return;
  if (decors.childElementCount > 0){
    clearCrosses(); resetRoundState(); return;
  }
  const howMany = rand(1, 5);

  const textRect = composition.getBoundingClientRect();
  const l1Rect = line1.getBoundingClientRect();
  const l2Rect = line2.getBoundingClientRect();

  const minX = Math.min(l1Rect.left, l2Rect.left) - textRect.left;
  const maxX = Math.max(l1Rect.right, l2Rect.right) - textRect.left;
  const minY = Math.min(l1Rect.top, l2Rect.top) - textRect.top;
  const maxY = Math.max(l1Rect.bottom, l2Rect.bottom) - textRect.top;

  const pad = 40;
  const areaLeft   = Math.max(0, minX - pad);
  const areaTop    = Math.max(0, minY - pad);
  const areaRight  = Math.min(textRect.width, maxX + pad);
  const areaBottom = Math.min(textRect.height, maxY + pad);

  for (let i = 0; i < howMany; i++) {
    const s = rand(18, 42);
    const thickness = Math.max(4, Math.round(s * 0.08));
    const x = rand(areaLeft, areaRight - s);
    const y = rand(areaTop, areaBottom - s);

    const el = document.createElement('div');
    el.className = 'cross';
    el.style.setProperty('--cross-size', s + 'px');
    el.style.setProperty('--cross-thickness', thickness + 'px');
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.setProperty('--cross-opacity', (rand(100, 100) / 100).toString());

    decors.appendChild(el);
  }
  resetRoundState();
}

async function generateAiText() {
    if (!btnAiGenerate) return;
    btnAiGenerate.disabled = true;
    btnAiGenerate.classList.add('loading');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const langName = currentLang === 'ru' ? 'Russian' : 'English';
        const prompt = `Generate two short, impactful words for a typographic poster with a 'cyberpunk future' theme. The words should be in ${langName}. Provide only the two words separated by a newline. Do not add any other formatting or explanation.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = response.text;
        
        if (text && custom) {
            custom.value = text.trim();
            generate();
        }

    } catch (error) {
        console.error("AI text generation failed:", error);
        if (custom) {
             const fallbackText = currentLang === 'ru' ? "ОШИБКА\nAPI" : "API\nERROR";
             custom.value = fallbackText;
             generate();
        }
    } finally {
        btnAiGenerate.disabled = false;
        btnAiGenerate.classList.remove('loading');
    }
}

// === СОБЫТИЯ UI ===
// Stop auto-generation on any user interaction with a button (except language switch)
document.body.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button && !button.closest('.lang-switch')) {
    stopAutoGeneration();
  }
}, true); // Use capture phase to handle it first

btnGenerate?.addEventListener('click', generate);

btnAiGenerate?.addEventListener('click', generateAiText);

btnRound?.addEventListener('click', roundCorners);
btnDownload?.addEventListener('click', downloadPng);
btnUndo?.addEventListener('click', () => undoAll({ preserveCurrentState: false }));

btnMoveUp?.addEventListener('click', () => { compShiftState = Math.min(1, compShiftState + 1); applyCompositionShift(); });
btnMoveDown?.addEventListener('click', () => { compShiftState = Math.max(-1, compShiftState - 1); applyCompositionShift(); });


btnCringe?.addEventListener('click', () => {
  const outlined = stage.querySelectorAll('.ch.outlined');
  if (outlined.length) {
    outlined.forEach(n => n.classList.remove('outlined'));
  } else {
    const letters = [...line1.querySelectorAll('.ch'), ...line2.querySelectorAll('.ch')];
    if (letters.length) {
      const howMany = rand(1, Math.min(3, letters.length));
      const poolIdx = Array.from({length: letters.length}, (_, i) => i);
      shuffle(poolIdx).slice(0, howMany).forEach(i => letters[i].classList.add('outlined'));
    }
  }
  resetRoundState();
  applyCompositionShift();
});

btnCrosses?.addEventListener('click', toggleCrosses);

btnMicro?.addEventListener('click', () => {
  microInput.value = microState.text || (I18N[currentLang]?.micro_prompt_default ?? '');
  microSize.value  = microState.sizePx;
  microPosBtns.forEach(b => b.classList.toggle('active', b.dataset.pos === microState.pos));
  microModal.hidden = false;
});

microClose?.addEventListener('click', ()=> microModal.hidden = true);
microDone?.addEventListener('click',  ()=> microModal.hidden = true);

microPosBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    microPosBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    microState.pos = btn.dataset.pos;
  });
});

microApply?.addEventListener('click', ()=>{
  microState.text = (microInput.value || '').trim();
  microState.sizePx = Math.max(10, Math.min(36, +microSize.value || 14));
  renderMicro();
});

microSize?.addEventListener('input', () => {
    microState.sizePx = Math.max(10, Math.min(36, +microSize.value || 14));
    renderMicro();
});

microClear?.addEventListener('click', ()=>{
  microState.text = '';
  removeMicro();
});

btnInvert?.addEventListener('click', () => {
  const toLight = !stage.classList.contains('light');
  stage.classList.toggle('light');
  currentInk = toLight ? '#ffffff' : '#000000';
  if (isRounded) silhouetteFill.style.background = currentInk;
  else composition.style.color = currentInk;
});

btnBg?.addEventListener('click', () => inpBgUpload?.click());
inpBgUpload?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (currentBgUrl) { URL.revokeObjectURL(currentBgUrl); currentBgUrl=''; }
  if (currentBgBlobUrl) { URL.revokeObjectURL(currentBgBlobUrl); currentBgBlobUrl=''; }
  currentBgUrl = URL.createObjectURL(file);
  if (bgLayer){
    bgLayer.style.backgroundImage = `url(${currentBgUrl})`;
    bgLayer.hidden = false;
  }
});
btnBgClear?.addEventListener('click', clearBackgroundAll);

btnGradToggle?.addEventListener('click', openGrad);
btnGradClose?.addEventListener('click', closeGrad);
btnGradDone?.addEventListener('click', closeGrad);
btnGradClear?.addEventListener('click', clearBackgroundAll);

document.getElementById('gradRandom')?.addEventListener('click', randomGradient);
[gradA, gradB, gradC, gradAngle, gradBias1, gradBias2].forEach(el=>{
  el?.addEventListener('input', applyGradientLive);
});

gradNoise?.addEventListener('input', () => {
  noiseIntensity = clamp(+gradNoise.value / 100, 0, 1);
  applyGrain();
});
gradNoiseSize?.addEventListener('input', () => {
  noiseSizePx = Math.max(1, +gradNoiseSize.value || 3);
  applyGrain();
});

btnColorToggle?.addEventListener('click', openColor);
colorClose?.addEventListener('click', ()=> colorModal.hidden = true);
colorDone?.addEventListener('click', ()=> colorModal.hidden = true);
colorModal?.addEventListener('click', e=>{ if(e.target===e.currentTarget) colorModal.hidden = true; });

function openColor(){
  colorModal.hidden = false;
  if (colorPick)  colorPick.value  = currentInk;
  if (colorAlpha) colorAlpha.value = Math.round((silAlpha ?? 1) * 100);
  if (strokeColorInput)    strokeColorInput.value    = strokeColor;
  if (strokeWidthInput)    strokeWidthInput.value    = strokeWidthPx;
  if (strokeEnabledInput)  strokeEnabledInput.checked = !!strokeOnSil;
}

colorPick?.addEventListener('input', ()=>{
  currentInk = colorPick.value;
  if (isRounded && silhouetteFill.classList.contains('active')) {
    silhouetteFill.style.background = currentInk;
  } else {
    composition.style.color = currentInk;
  }
});
colorAlpha?.addEventListener('input', ()=>{
  if (isRounded && silhouetteFill.classList.contains('active')) {
    const a = (+colorAlpha.value/100);
    silAlpha = a;
    silhouetteFill.style.opacity = a.toFixed(2);
  }
});
strokeColorInput?.addEventListener('input', async ()=>{
  strokeColor = strokeColorInput.value || strokeColor;
  applyLiveStroke();
  await applySilhouetteStroke();
});
strokeWidthInput?.addEventListener('input', async ()=>{
  strokeWidthPx = Math.max(1, +strokeWidthInput.value || 10);
  applyLiveStroke();
  await applySilhouetteStroke();
});
strokeEnabledInput?.addEventListener('change', async ()=>{
  strokeEnabled = !!strokeEnabledInput.checked;
  if (isRounded){
    strokeOnSil = strokeEnabled;
    await applySilhouetteStroke();
  }
});


btnZoomIn?.addEventListener('click', async ()=>{
  mainZoom = clampZoom( +(mainZoom + ZOOM_STEP).toFixed(2) );
  await applyMainZoom();
});
btnZoomOut?.addEventListener('click', async ()=>{
  mainZoom = clampZoom( +(mainZoom - ZOOM_STEP).toFixed(2) );
  await applyMainZoom();
});

const btnBgPin = document.getElementById('bgPin');

async function randomPinterestBg(){
  try {
    const workerURL = 'https://<твоя_зона>.workers.dev/?q=' + encodeURIComponent('weirdcore aesthetic') + '&_=' + Date.now();
    bgLayer.style.backgroundImage = `url(${workerURL})`;
    bgLayer.hidden = false;
  } catch (e) {
    console.error(e);
    await setRandomBg();
  }
}

btnBgPin?.addEventListener('click', randomPinterestBg);

let strokeWasRandomized = false;

strokeToggle?.addEventListener('click', async ()=>{
  if (!isRounded){
    const turningOn = !liveStrokeOn;
    if (turningOn && !strokeWasRandomized){
      strokeColor   = randomHex();
      strokeWidthPx = Math.max(1, rand(6, 24));
      strokeWasRandomized = true;
    }
    liveStrokeOn = !liveStrokeOn;
    applyLiveStroke();
  } else {
    const turningOn = !strokeOnSil;
    if (turningOn && !strokeWasRandomized){
      strokeColor   = randomHex();
      strokeWidthPx = Math.max(1, rand(6, 24));
      strokeWasRandomized = true;
    }
    strokeOnSil = !strokeOnSil;
    overlay.hidden = false;
    await applySilhouetteStroke();
  }

  if (strokeColorInput)   strokeColorInput.value   = strokeColor;
  if (strokeWidthInput)   strokeWidthInput.value   = strokeWidthPx;
  if (strokeEnabledInput) strokeEnabledInput.checked = !!strokeOnSil;
});

const btnBgRandom = document.getElementById('bgRandom');

const loadImageAndSet = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      if (currentBgBlobUrl) {
        URL.revokeObjectURL(currentBgBlobUrl);
        currentBgBlobUrl = '';
      }
      if (currentBgUrl) {
          URL.revokeObjectURL(currentBgUrl);
          currentBgUrl = '';
      }

      bgLayer.style.backgroundImage = `url(${src})`;
      bgLayer.hidden = false;
      // Defer resolving until the next paint cycle to sync with render
      requestAnimationFrame(() => {
        resolve();
      });
    };
    img.onerror = (err) => {
      console.error(`Failed to load image from ${src}`, err);
      reject(err);
    };
    img.src = src;
  });
};

async function loadRandomBg() {
    try {
        const page = rand(1, 200);
        const apiResponse = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=1`);
        if (!apiResponse.ok) throw new Error('Picsum API request failed');
        const images = await apiResponse.json();
        if (!images || !images.length) throw new Error('No images from Picsum API');
        const imageUrl = `https://picsum.photos/id/${images[0].id}/1080/1440`;
        await loadImageAndSet(imageUrl);
    } catch (e) {
        console.error('bg load failed, trying fallback', e);
        const fallback = `https://picsum.photos/seed/${Date.now()}/1080/1440`;
        try {
            await loadImageAndSet(fallback);
        } catch (fallbackErr) {
            console.error("Fallback BG also failed", fallbackErr);
            throw fallbackErr;
        }
    }
}

async function setRandomBg() {
  const btn = document.getElementById('bgRandom');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
  }

  try {
    await loadRandomBg();
  } catch(e) {
    // Error already logged
  } finally {
    await sleep(500); // Add delay
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }
}


btnBgRandom?.addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;
    awardCringePoints(e.currentTarget, e);
    setRandomBg();
});


const footerEl = document.querySelector('footer');
const stageEl  = document.getElementById('stage');
let footerHomeParent = footerEl?.parentElement || null;
let footerHomeNext   = footerEl?.nextSibling || null;

function placeFooterByViewport(){
  if (!footerEl || !stageEl) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    if (stageEl.nextElementSibling !== footerEl) stageEl.after(footerEl);
    footerEl.style.display = '';
  } else {
    if (footerHomeParent && !footerHomeParent.contains(footerEl)) {
      if (footerHomeNext) footerHomeParent.insertBefore(footerEl, footerHomeNext);
      else footerHomeParent.appendChild(footerEl);
    }
  }
}

// === GAMIFICATION LOGIC ===
let currentCringe = 0;
const MAX_CRINGE = 1000;

const cringeBarProgress = document.getElementById('cringe-bar-progress');
const cringeLabel = document.getElementById('cringe-label');
const ultimateBtn = document.getElementById('ultimateBtn');

function saveProgress() {
  localStorage.setItem('typo_current_cringe', currentCringe);
}

function loadProgress() {
  const savedCringe = localStorage.getItem('typo_current_cringe');
  if (savedCringe) {
    currentCringe = parseInt(savedCringe, 10) || 0;
  }
}

function updateCringeUI() {
  if (!cringeBarProgress || !cringeLabel) return;
  const progressPercent = (currentCringe / MAX_CRINGE) * 100;
  cringeBarProgress.style.width = `${progressPercent}%`;

  const t = I18N[currentLang] || I18N['en'];
  cringeLabel.textContent = t.cringe_bar
      .replace('{current}', currentCringe)
      .replace('{max}', MAX_CRINGE);

  if (ultimateBtn) {
      ultimateBtn.hidden = currentCringe < MAX_CRINGE;
      if (!ultimateBtn.disabled) {
          const span = ultimateBtn.querySelector('span');
          if(span) span.textContent = t.ultimate;
      }
  }
}

function addCringe(amount) {
  if (currentCringe >= MAX_CRINGE) return;
  currentCringe = Math.min(MAX_CRINGE, currentCringe + amount);
  saveProgress();
  updateCringeUI();
}

function showFloatingPoints(amount, event) {
    const pointsEl = document.createElement('div');
    pointsEl.textContent = `+${amount}`;
    pointsEl.className = 'cringe-points-popup';
    pointsEl.style.left = `${event.clientX}px`;
    pointsEl.style.top = `${event.clientY}px`;
    document.body.appendChild(pointsEl);

    pointsEl.addEventListener('animationend', () => {
        pointsEl.remove();
    });
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function performUltimate() {
    if (!ultimateBtn) return;
    ultimateBtn.disabled = true;
    ultimateBtn.classList.add('loading');
    
    // Clear all effects but preserve the user's current zoom level.
    // This prevents the composition from visually snapping to a different size.
    undoAll({ preserveCurrentState: true });
    await sleep(250);

    // 1. Small Text: Use existing if available, otherwise generate random.
    if (!microState.text || microState.text.trim() === '') {
        const phrasePool = currentLang === 'en' ? PHRASES_EN : PHRASES_RU;
        microState.text = sample(phrasePool).join(' ');
    }
    microState.pos = sample(['top-stage', 'bottom-stage', 'above-line1', 'below-line2']);
    renderMicro();
    await sleep(250);

    // 2. Bubbles
    btnCringe.click();
    await sleep(250);

    // 3. Crosses
    btnCrosses.click();
    await sleep(250);

    // 4. RANDOM BG (and wait for it to load)
    try {
        await loadRandomBg(); 
    } catch(e) {}
    await sleep(500); // Artificial delay for ultimate spinner

    // 5. Silhouette: The composition is already at the correct user-defined zoom.
    // roundCorners will capture it as-is, then internally reset zoom to 1 for the now-hidden text lines.
    // The resulting overlay will have a "baked-in" zoom and a CSS scale of 1, preserving the exact size.
    await roundCorners();
    await sleep(250);

    // 6. Stroke (with random thickness and color)
    strokeOnSil = true;
    strokeColor = randomHex();
    strokeWidthPx = rand(8, 20);
    await applySilhouetteStroke();
    await sleep(250);
    
    // 7. Shadow
    // First apply attempt + update inputs.
    await randomizeAndApplyShadow();
    // Programmatically "click" apply to force re-render, mimicking manual fix.
    shadowApply.click(); 
    isFirstShadowClick = false; // Sync state

    // Give browser a moment to render the shadow from the synthetic click.
    await sleep(300); // A bit longer here due to many preceding operations.

    // 8. Color
    currentInk = randomHex();
    if (isRounded && silhouetteFill.classList.contains('active')) {
        silhouetteFill.style.backgroundColor = currentInk;
        silhouetteFill.style.backgroundImage = ''; // Clear any previous gradient
    }
    await sleep(250);

    // 9. Gradient as the cherry on top
    randomGradient();
    if (isRounded) {
        silhouetteFill.style.backgroundImage = buildThreeStopGradient();
    }
    await sleep(250);

    currentCringe = 0;
    saveProgress();
    updateCringeUI();

    ultimateBtn.disabled = false;
    ultimateBtn.classList.remove('loading');
    const t = I18N[currentLang] || I18N['en'];
    const span = ultimateBtn.querySelector('span');
    if(span) span.textContent = t.ultimate;
}


function awardCringePoints(button, event) {
  if (!button || button.disabled) return;

  const id = button.id;
  const POINTS_MAP = {
    round: 169,
    gradToggle: 88, cringe: 88, micro: 88, crosses: 88,
    bgRandom: 88, bgBtn: 88, strokeToggle: 88, shadowToggle: 88,
    moveUp: 40, moveDown: 40, zoomIn: 40, zoomOut: 40,
    btn: 40, invert: 40, bgClear: 40, colorToggle: 40, undoAll: 40, download: 40,
    aiGenerate: 150, // Points for using AI
  };

  const noPointsButtons = [
    'ultimateBtn', 'gradRandom', 'gradClear', 'gradDone', 'colorDone',
    'shadowApply', 'shadowClear', 'shadowDone', 'microClear', 'microApply',
    'microDone', 'gradClose', 'colorClose', 'shadowClose', 'microClose'
  ];

  if (noPointsButtons.includes(id) || button.classList.contains('micro-pos') || button.classList.contains('lang-btn')) {
    return;
  }

  const points = POINTS_MAP[id];
  if (points) {
    addCringe(points);
    showFloatingPoints(points, event);
  }
}

ultimateBtn?.addEventListener('click', performUltimate);

document.body.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button?.id === 'bgRandom') return; // Handled separately to award points before disabling
    awardCringePoints(button, e);
});

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    applyLang(currentLang);

    if (stage) {
        const ro = new ResizeObserver(() => requestAnimationFrame(updateFontSize));
        ro.observe(stage);
    }
    document.fonts?.ready?.then(updateFontSize);

    generate();
    
    // Start auto-generation loop
    autoGenerateInterval = setInterval(generate, 450);

    window.addEventListener('resize', applyCompositionShift);

    placeFooterByViewport();
    window.addEventListener('resize', placeFooterByViewport);

    loadProgress();
    updateCringeUI();
});
