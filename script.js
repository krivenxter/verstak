// === ДАННЫЕ ===
const PHRASES = [
  ["монитора","блик"],["фотошопа","тень"],["клавиатуры","пыль"],
  ["диска","царапина"],["плеера","шум"],["кассеты","треск"],
  ["экрана","блик"],["обоев","градиент"],["баннера","пиксель"],
  ["джинсов","клёш"],["папино","молоко"], ["логотипа","отблеск"],["пейджера","сигнал"],
  ["дисковода","стук"],["обложки","блеск"],["модема","писк"],
  ["принтера","запах"],["сайта","фон"],["курсора","след"],
  ["обоев","узор"],["кассетника","скрип"],
];

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

// === ШОРТКАТЫ ===
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
const strokeColorInput    = document.getElementById('strokeColor');     // опционально (если есть в модалке)
const strokeWidthInput    = document.getElementById('strokeWidth');     // опционально
const strokeEnabledInput  = document.getElementById('strokeEnabled');   // опционально

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

// ===== Размер шрифта по ширине stage =====
const FS_MIN = 20;
const FS_MAX = 102;
const FS_K   = 0.12;

let silAlpha = 1; // фактическая непрозрачность силуэта [0..1]

let currentInk   = '#111111';
let currentBgUrl = '';

// ===== Состояния силуэта/обводки/шума =====
let isRounded       = false;
let maskURL         = '';
let liveStrokeOn    = false;      // обводка на «живой» композиции до силуэта
let strokeOnSil     = false;      // обводка вокруг силуэта после «Силуэта»
let strokeColor     = '#00ff88';
let strokeWidthPx   = 10;
let strokeEnabled   = false;      // если используешь чекбокс в модалке
let strokeMaskURL   = '';         // кэш кольцевой маски

let noiseURL        = '';         // dataURL тайла шума
let noiseIntensity  = 0;          // 0..1
let noiseSizePx     = 480;        // ИЗНАЧАЛЬНЫЙ крупный тайл (px)

// ===== Сдвиг композиции =====
let compShiftState = 0;           // -1 = вниз, 0 = центр, 1 = вверх
const SHIFT_FACTOR = 0.35;

// === УТИЛЫ ===
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample  = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => arr.map(v=>[Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const pickFonts = () => shuffle([...FONT_POOL]).slice(0, rand(3,6));
const clamp  = (v,min,max)=>Math.max(min,Math.min(max,v));

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

// считать при старте, после генерации и при изменении размеров stage
if (stage){
  const ro = new ResizeObserver(() => requestAnimationFrame(updateFontSize));
  ro.observe(stage);
}
document.fonts?.ready?.then(updateFontSize);

// ===== ВСПОМОГАТЕЛЬНОЕ ДЛЯ ЭКСПОРТА =====
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

// === СИЛУЭТ: СБРОС ===
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

// === ГЕНЕРАЦИЯ КОМПОЗИЦИИ ===
function removeMicro(){
  const m = composition?.querySelector('.micro-row');
  if (m) m.remove();
}

function generate(){
  resetRoundState({force:true});
  removeMicro();
  stage?.querySelectorAll('.ch.outlined').forEach(n => n.classList.remove('outlined'));

  const customLines = getCustomLines();
  const [w1, w2] = customLines ?? sample(PHRASES);
  const fonts = pickFonts();

  if (line1) renderWord(line1, mixedCase(w1), fonts);
  if (line2) renderWord(line2, mixedCase(w2), fonts);

  document.querySelector('.l1')?.style && (document.querySelector('.l1').style.letterSpacing = rand(-3, -2) + 'px');
  document.querySelector('.l2')?.style && (document.querySelector('.l2').style.letterSpacing = rand(-3, -2) + 'px');

  if (composition) composition.style.visibility = 'visible';
  if (overlay) overlay.style.transform = '';

  applyCompositionShift();
  updateFontSize();

  currentInk = stage?.classList.contains('light') ? '#ffffff' : '#000000';
  if (composition) composition.style.color = currentInk;

  if (btnUndo) btnUndo.hidden = true;
}

// === ОБВОДКА (ЖИВАЯ) ДО СИЛУЭТА ===
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

// === ПОСТРОЕНИЕ КОЛЬЦЕВОЙ МАСКИ (для обводки вокруг силуэта) ===
async function buildOuterStrokeMask(baseMaskURL, growPx){
  if (!baseMaskURL || growPx <= 0) return '';
  const img = await loadImage(baseMaskURL);
  const w = img.width, h = img.height;

  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // исходник
  ctx.drawImage(img, 0, 0, w, h);

  // расширяем блюром
  ctx.filter = `blur(${growPx}px)`;
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';

  // бинаризуем альфу
  const d = ctx.getImageData(0,0,w,h); const a = d.data;
  for (let i=0;i<a.length;i+=4){
    const alpha = a[i+3] > 0 ? 255 : 0;
    a[i]=255; a[i+1]=255; a[i+2]=255; a[i+3]=alpha;
  }
  ctx.putImageData(d,0,0);

  // вычесть исходник → остаётся кольцо
  const src = document.createElement('canvas'); src.width=w; src.height=h;
  src.getContext('2d').drawImage(img, 0, 0, w, h);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  return c.toDataURL('image/png');
}

// === ОБВОДКА ВОКРУГ СИЛУЭТА ===
async function applySilhouetteStroke(){
  if (!silhouetteStroke) return;

  if (!isRounded || !maskURL || !strokeOnSil || strokeWidthPx <= 0){
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
    return;
  }

  strokeMaskURL = await buildOuterStrokeMask(maskURL, strokeWidthPx);

  silhouetteStroke.style.background = strokeColor;
  silhouetteStroke.style.opacity = 1;
  silhouetteStroke.style.webkitMaskImage = `url(${strokeMaskURL})`;
  silhouetteStroke.style.maskImage      = `url(${strokeMaskURL})`;
  silhouetteStroke.classList.add('active');
  silhouetteStroke.style.transform = ''; // двигается как overlay
}

// === ШУМ ДЛЯ ГРАДИЕНТА ===
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
  if (!noiseURL) noiseURL = makeNoiseTexture(512, 255); // крупный тайл по дефолту
  grain.style.backgroundImage = `url(${noiseURL})`;
  grain.style.backgroundSize = `${noiseSizePx}px ${noiseSizePx}px`;
  grain.style.opacity = noiseIntensity.toFixed(2);
  grain.hidden = false;
}

// === ГРАДИЕНТ ===
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

function openGrad(){
  if (!gradModal) return;
  gradModal.hidden = false;
  if (gradNoise)     gradNoise.value     = Math.round(noiseIntensity * 100);
  if (gradNoiseSize) gradNoiseSize.value = noiseSizePx;
  applyGradientLive();
}

function closeGrad(){
  if (!gradModal) return;
  gradModal.hidden = true;
}

function randomGradient() {
  const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

  gradA.value = randomColor();
  gradB.value = randomColor();
  gradC.value = randomColor();
  gradAngle.value = rand(0, 360);

  let p1 = rand(10, 45);
  let p2 = rand(p1 + 10, 90);
  gradBias1.value = p1;
  gradBias2.value = p2;

  // рандом шума
  noiseIntensity = Math.random() < .8 ? rand(5, 30) / 100 : 0; // 0..0.3
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

// === СИЛУЭТ ===
async function roundCorners() {
  // можно нажимать бесконечно: каждый раз запекаем то, что видно на сцене сейчас

  const SCALE = 2;
  const { width, height } = stage.getBoundingClientRect();

  // запомним текущее состояние силуэта/обводки
  const wasRounded   = isRounded;
  const prevMaskURL  = maskURL;
  const wasStroke    = strokeOnSil;
  const prevAlpha    = Number.isFinite(silAlpha)
    ? silAlpha
    : (parseFloat(getComputedStyle(silhouetteFill).opacity) || 1);
  const ty           = (getTranslateY(overlay) || 0) * SCALE;

  // 1) Снапим сцену БЕЗ overlay (html2canvas не любит css-mask)
  const snap = stage.cloneNode(true);
  const snapOverlay = snap.querySelector('#overlay');
  if (snapOverlay) snapOverlay.hidden = true;

  Object.assign(snap.style, {
    position: 'fixed', left: '-99999px', top: '0',
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

  // 2) Дорисуем на копию всё, что overlay показывал раньше (заливку и обводку)
  const flat = document.createElement('canvas');
  flat.width  = baseCanvas.width;
  flat.height = baseCanvas.height;
  const fctx = flat.getContext('2d');
  fctx.drawImage(baseCanvas, 0, 0);

  if (wasRounded && prevMaskURL) {
    // 2а) старая обводка вокруг силуэта (если была включена)
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

    // 2б) старая заливка силуэта (с учётом прозрачности)
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

    if (prevAlpha < 1) {                // применяем прежнюю прозрачность
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = `rgba(0,0,0,${prevAlpha})`;
      ctx.fillRect(0, 0, fill.width, fill.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    fctx.drawImage(fill, 0, ty);
  }

  // 3) Из «плоской» картинки строим НОВУЮ маску (порогом)
  const work = document.createElement('canvas');
  work.width = flat.width; work.height = flat.height;
  const wctx = work.getContext('2d');

  wctx.filter = 'blur(3.5px)';
  wctx.drawImage(flat, 0, 0);
  wctx.filter = 'none';

  const img = wctx.getImageData(0, 0, work.width, work.height);
  const d = img.data, THRESHOLD = 140;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const lum = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i] = d[i+1] = d[i+2] = 255;
    d[i+3] = lum < THRESHOLD ? 255 : 0;
  }
  wctx.putImageData(img, 0, 0);
  maskURL = work.toDataURL('image/png');

  // 4) Подменяем overlay на НОВЫЙ силуэт, сохраняя прежние настройки
  overlay.hidden = false;
  overlay.style.background = 'transparent';
  overlay.style.transform = '';

  silhouetteFill.style.background = currentInk;
  silhouetteFill.style.webkitMaskImage = `url(${maskURL})`;
  silhouetteFill.style.maskImage      = `url(${maskURL})`;
  silhouetteFill.classList.add('active');

  // возвращаем прежнюю фактическую альфу силуэта (важно для «только обводка»)
  if (Number.isFinite(prevAlpha)) {
    silAlpha = prevAlpha;
    silhouetteFill.style.opacity = prevAlpha.toFixed(2);
  }

  // композицию прячем
  composition.style.visibility = 'hidden';

  // ВАЖНО: не трогаем флаг обводки — если была включена, остаётся включённой
  await applySilhouetteStroke();

  // лайв-обводку не включаем (она уже запекается при повторных снапах)
  if (liveStrokeOn) { liveStrokeOn = false; applyLiveStroke(); }

  isRounded = true;
  if (btnUndo) btnUndo.hidden = false;
}




function undoAll(){
  if (composition) composition.style.visibility = 'visible';
  resetRoundState({force:true});

  liveStrokeOn = false;
  strokeOnSil  = false;
  applyLiveStroke();

  if (silhouetteStroke){
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
  }
  if (overlay){
    overlay.style.transform = '';
  }
  if (silhouetteFill){
    silhouetteFill.style.transform = '';
  }
  if (btnUndo) btnUndo.hidden = true;
}

// === ДВИЖЕНИЕ КОМПОЗИЦИИ ===
function applyCompositionShift() {
  if (!composition) return;
  const baseRect = composition.getBoundingClientRect();
  const compH = baseRect.height || 0;
  const px = Math.round(compH * SHIFT_FACTOR);
  const offset = compShiftState === 1 ? -px : compShiftState === -1 ? px : 0;

  const t = `translateY(${offset}px)`;
  composition.style.transform = t;

  if (isRounded) {
    overlay.style.transform = t;
    silhouetteFill.style.transform = '';
    if (silhouetteStroke) silhouetteStroke.style.transform = '';
  }
}

// хелпер: вытащить translateY(px) из transform
function getTranslateY(el){
  if (!el) return 0;
  const tr = getComputedStyle(el).transform;
  if (!tr || tr === 'none') return 0;
  // matrix(a,b,c,d,tx,ty)
  const m = tr.match(/matrix\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map(v=>parseFloat(v));
    return p[5] || 0;
  }
  const t = tr.match(/translateY\((-?\d+(?:\.\d+)?)px\)/i);
  return t ? parseFloat(t[1]) : 0;
}

// хелпер остаётся твой:
// function getTranslateY(el){ ... }

async function downloadPng(){
  const SCALE = window.devicePixelRatio || 2;
  const { width, height } = stage.getBoundingClientRect();

  // 1) база: клон сцены БЕЗ overlay, БЕЗ скруглений рамки
  const baseClone = stage.cloneNode(true);
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

  // 2) итоговый холст
  const out = document.createElement('canvas');
  out.width  = baseCanvas.width;
  out.height = baseCanvas.height;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;

  // база (фон/градиент/шум/живая типографика и т.п.)
  octx.drawImage(baseCanvas, 0, 0);

  // вычислим сдвиг силуэта (px в рендер-скейле)
  const ty = (getTranslateY(overlay) || 0) * SCALE;

  // 3) ОБВОДКА вокруг силуэта (если включена)
  if (isRounded && strokeOnSil && maskURL){
    // есть ли готовая маска-ободок? если нет — построим на лету
    let ringURL = (silhouetteStroke && (getComputedStyle(silhouetteStroke).webkitMaskImage || getComputedStyle(silhouetteStroke).maskImage) || '').toString();
    if (ringURL.startsWith('url(')) {
      ringURL = ringURL.slice(4,-1).replaceAll('"','').replaceAll("'","");
    } else {
      // запасной вариант: пересчёт
      const tmp = await buildOuterStrokeMask(maskURL, Math.max(1, strokeWidthPx));
      ringURL = tmp;
    }

    if (ringURL){
      const ring = await loadImage(ringURL);
      const sCanvas = document.createElement('canvas');
      sCanvas.width = out.width; sCanvas.height = out.height;
      const sctx = sCanvas.getContext('2d');

      // цвет обводки
      sctx.fillStyle = strokeColor;
      sctx.fillRect(0,0,sCanvas.width,sCanvas.height);

      // вырезаем по кольцевой маске
      sctx.globalCompositeOperation = 'destination-in';
      sctx.drawImage(ring, 0, 0, sCanvas.width, sCanvas.height);
      sctx.globalCompositeOperation = 'source-over';

      // учитываем сдвиг вверх/вниз
      octx.drawImage(sCanvas, 0, ty);
    }
  }

  // 4) ЗАЛИВКА силуэта (если активна)
  if (isRounded && silhouetteFill.classList.contains('active') && maskURL){
    const cs = getComputedStyle(silhouetteFill);
    const bgImg = cs.backgroundImage;
    const bgCol = cs.backgroundColor;
    const alpha = Number.isFinite(silAlpha) ? silAlpha : 1;

    const fill = document.createElement('canvas');
    fill.width = out.width; fill.height = out.height;
    const fctx = fill.getContext('2d');

    // фон заливки: градиент / картинка / цвет
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

// ...
// 3б) применяем альфа-маску силуэта
const mImg = await loadImage(maskURL);
fctx.globalCompositeOperation = 'destination-in';
fctx.drawImage(mImg, 0, 0, fill.width, fill.height);
fctx.globalCompositeOperation = 'source-over';

// 3в) применяем ОПАСИТИ силуэта (без getImageData)
// ...после того как ты сделал destination-in маской mImg:
if (alpha < 1) {
  fctx.globalCompositeOperation = 'destination-in';
  fctx.fillStyle = `rgba(0,0,0,${alpha})`;
  fctx.fillRect(0, 0, fill.width, fill.height);
  fctx.globalCompositeOperation = 'source-over';
}

// рисуем со сдвигом
octx.drawImage(fill, 0, ty);


  }

  // 5) сохранить PNG
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


// === КРЕСТЫ/МИКРО/ПУЗЫРИ ===
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

// === СОБЫТИЯ UI ===
btnGenerate?.addEventListener('click', generate);
btnRound?.addEventListener('click', roundCorners);
btnDownload?.addEventListener('click', downloadPng);
btnUndo?.addEventListener('click', undoAll);

btnMoveUp?.addEventListener('click', () => { compShiftState = Math.min(1, compShiftState + 1); applyCompositionShift(); });
btnMoveDown?.addEventListener('click', () => { compShiftState = Math.max(-1, compShiftState - 1); applyCompositionShift(); });
window.addEventListener('resize', applyCompositionShift);

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
  const txt = prompt('Мелкий текст (слова через пробел):', 'шёпот под буквами');
  if (!txt) return;
  removeMicro();
  const words = txt.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const row = document.createElement('div');
  row.className = 'micro-row';
  row.dataset.size = ['sm','md','lg'][rand(0,2)];
  row.style.fontFamily = `'${sample(SANS_POOL)}', system-ui, sans-serif`;
  for (const w of words){
    const chip = document.createElement('span');
    chip.className = 'micro-chip';
    chip.textContent = w;
    row.appendChild(chip);
  }
  if (words.length === 1) row.style.justifyContent = 'center';
  if (Math.random() < 0.5) {
    composition.insertBefore(row, line1);
  } else {
    composition.insertBefore(row, line2.nextSibling);
  }
  resetRoundState();
  applyCompositionShift();
});

btnInvert?.addEventListener('click', () => {
  const toLight = !stage.classList.contains('light');
  stage.classList.toggle('light');
  currentInk = toLight ? '#ffffff' : '#000000';
  if (isRounded) silhouetteFill.style.background = currentInk;
  else composition.style.color = currentInk;
});

// фон
btnBg?.addEventListener('click', () => inpBgUpload?.click());
inpBgUpload?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (currentBgUrl) { URL.revokeObjectURL(currentBgUrl); currentBgUrl=''; }
  currentBgUrl = URL.createObjectURL(file);
  if (bgLayer){
    bgLayer.style.backgroundImage = `url(${currentBgUrl})`;
    bgLayer.hidden = false;
  }
});
btnBgClear?.addEventListener('click', clearBackgroundAll);

// градиент
btnGradToggle?.addEventListener('click', openGrad);
btnGradClose?.addEventListener('click', closeGrad);
btnGradDone?.addEventListener('click', closeGrad);
btnGradClear?.addEventListener('click', clearBackgroundAll);

document.getElementById('gradRandom')?.addEventListener('click', randomGradient);
[gradA, gradB, gradC, gradAngle, gradBias1, gradBias2].forEach(el=>{
  el?.addEventListener('input', applyGradientLive);
});

// шум (ползунки)
gradNoise?.addEventListener('input', () => {
  noiseIntensity = clamp(+gradNoise.value / 100, 0, 1);
  applyGrain();
});
gradNoiseSize?.addEventListener('input', () => {
  noiseSizePx = Math.max(1, +gradNoiseSize.value || 3);
  applyGrain();
});

// цвет/альфа + опциональные инпуты обводки в модалке
btnColorToggle?.addEventListener('click', openColor);
colorClose?.addEventListener('click', ()=> colorModal.hidden = true);
colorDone?.addEventListener('click', ()=> colorModal.hidden = true);
colorModal?.addEventListener('click', e=>{ if(e.target===e.currentTarget) colorModal.hidden = true; });

function openColor(){ 
  colorModal.hidden = false;
  if (colorPick)  colorPick.value  = currentInk;
  if (colorAlpha) colorAlpha.value = 100;
  if (strokeColorInput)    strokeColorInput.value    = strokeColor;
  if (strokeWidthInput)    strokeWidthInput.value    = strokeWidthPx;
  if (strokeEnabledInput)  strokeEnabledInput.checked = strokeEnabled;
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
    silAlpha = a;                             // ← сохраняем
    silhouetteFill.style.opacity = a.toFixed(2); // визуально в UI
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
  // если хочешь привязать к круговой обводке — синхронизируй с кнопкой:
  if (isRounded){
    strokeOnSil = strokeEnabled;
    await applySilhouetteStroke();
  }
});

// одна кнопка «Обводка» — и до, и после силуэта
strokeToggle?.addEventListener('click', async ()=>{
  if (!isRounded){
    liveStrokeOn = !liveStrokeOn;
    applyLiveStroke();
  } else {
    strokeOnSil = !strokeOnSil;
    await applySilhouetteStroke();
  }
});

// первичный рендер
generate();
