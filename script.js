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
  'PT Sans','Roboto','Neucha','Comfortaa','Russo One', // новые из твоей ссылки:
  'Comforter','Great Vibes','Manrope','Oi','Pixelify Sans','Rubik Iso','Rubik Puddles','Rubik Wet Paint',
  'Tektur','Viaoda Libre'
];

const SANS_POOL = [
  'Inter'
];

// === ШОРТКАТЫ ===
const stage       = document.getElementById('stage');
// ===== Размер шрифта по ширине stage =====
const FS_MIN = 20;   // было 36
const FS_MAX = 102;  // можно оставить 102
const FS_K   = 0.12; // 12% от ширины stage
const overlay     = document.getElementById('overlay');
const line1       = document.getElementById('line1');
const line2       = document.getElementById('line2');
const custom      = document.getElementById('custom');
const bgLayer     = document.getElementById('bgLayer'); // фон через background
const btnCringe   = document.getElementById('cringe');
const composition = document.getElementById('composition');

const roundBtn       = document.getElementById('round');

const silhouetteFill = document.getElementById('silhouetteFill');

const grain = document.getElementById('grain');

let noiseURL = '';          // кэш dataURL шума
let noiseIntensity = 0;     // 0..1
let noiseSizePx = 200;        // размер «зерна» в px (размер тайла)


const btnCrosses = document.getElementById('crosses');
const decors     = document.getElementById('decors');
// цвет/откат
const undoBtn      = document.getElementById('undoAll');
const colorBtn     = document.getElementById('colorToggle');
const colorModal   = document.getElementById('colorModal');
const colorPick    = document.getElementById('colorPick');
const colorAlpha   = document.getElementById('colorAlpha');
const colorClose   = document.getElementById('colorClose');
const colorDone    = document.getElementById('colorDone');

let currentInk   = '#111111';   // текущий цвет композиции/силуэта
let lastBaseHTML = '';          // «чистая» композиция сразу после Сгенерить






let currentBgUrl = ''; // для revokeObjectURL


function updateFontSize() {
  const w = stage?.getBoundingClientRect().width || 0;
  const size = Math.min(FS_MAX, Math.max(FS_MIN, w * FS_K));
  line1.style.fontSize = size + 'px';
  line2.style.fontSize = size + 'px';
}

// считать при старте, после генерации и при изменении размеров stage
const ro = new ResizeObserver(() => {
  requestAnimationFrame(updateFontSize);
});
ro.observe(stage);


// если шрифты грузятся — пересчитать после их готовности
document.fonts?.ready?.then(updateFontSize);

// === УТИЛЫ ===
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample  = (arr) => arr[rand(0, arr.length - 1)];
const shuffle = (arr) => arr.map(v=>[Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const pickFonts = () => shuffle([...FONT_POOL]).slice(0, rand(3,6));

function mixedCase(word){
  return Array.from(word).map(ch =>
    /[A-Za-zА-Яа-яЁё]/.test(ch) ? (Math.random() < 0.3 ? ch.toUpperCase() : ch.toLowerCase()) : ch
  ).join('');
}

function renderWord(el, word, fonts){
  el.innerHTML = '';
  const chunk = rand(1,3);

  // Определяем — мобилка или нет
  const isMobile = window.innerWidth <= 640;

  Array.from(word).forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'ch';
    const font = fonts[Math.floor(i / chunk) % fonts.length];
    span.style.fontFamily = `'${font}', sans-serif`;

    // Разный диапазон для мобилок и десктопа
    const scale = isMobile 
      ? rand(142, 242) / 100 // буквы чуть крупнее на мобилке
      : rand(82, 182) / 100; // оригинал для десктопа

    span.style.fontSize = scale + 'em';
    span.style.fontWeight = rand(1,3) ? 900 : 500;
    const skew = rand(-20, 5);
    span.style.transform = `rotate(0deg) skew(${skew}deg)`;
    span.textContent = ch;
    el.appendChild(span);
  });
}


function getCustomLines(){
  const t = (custom.value || '').trim();
  if (!t) return null;
  const parts = t.split(/\r?\n/).slice(0,2);
  if (parts.length === 1) return [parts[0], ''];
  return parts;
}

// ===== Скругление: состояние =====
let maskURL = ''; // инвертированная маска (белое=видимо, чёрное=прозрачно)

const silhouetteStroke = document.getElementById('silhouetteStroke');

let strokeEnabled = true;
let strokeColor   = '#21d25a';
let strokeWidthPx = 14;      // толщина наружу, в пикселях рендера
let strokeMaskURL = '';      // dataURL для маски-кольца


function clearSilhouetteFill(){
  silhouetteFill?.classList.remove('active');
  if (silhouetteFill){
    silhouetteFill.style.background = '';
    silhouetteFill.style.backgroundImage = '';
    silhouetteFill.style.webkitMaskImage = '';
    silhouetteFill.style.maskImage = '';
  }
}


let isRounded = false;
let roundedURL = '';

function resetRoundState({force=false} = {}) {
  if (!force && isRounded) return;

  isRounded = false;
  maskURL = '';

  // слой-поверхность убираем
  overlay.hidden = true;
  overlay.style.backgroundImage = '';
  overlay.style.backgroundColor = '';
  overlay.classList.remove('threshold-only');
  overlay.style.transform = '';
  
  silhouetteStroke.classList.remove('active');
silhouetteStroke.style.background = '';
silhouetteStroke.style.webkitMaskImage = '';
silhouetteStroke.style.maskImage = '';
strokeMaskURL = '';


  // ребёнка-слоя чистим
  clearSilhouetteFill();

  // показываем «живую» композицию
  composition.style.visibility = 'visible';

  // кнопка «Вернуть»
  if (undoBtn) undoBtn.hidden = true;
}





overlay.classList.remove('threshold-only');


// удалить мелкий текст
function removeMicro(){
  const m = composition.querySelector('.micro-row');
  if (m) m.remove();
}

// === ГЕНЕРАЦИЯ КОМПОЗИЦИИ ===
function generate(){
  resetRoundState({force:true});
  removeMicro();
  stage.querySelectorAll('.ch.outlined').forEach(n => n.classList.remove('outlined'));

  const customLines = getCustomLines();
  const [w1, w2] = customLines ?? sample(PHRASES);
  const fonts = pickFonts();

  renderWord(line1, mixedCase(w1), fonts);
  renderWord(line2, mixedCase(w2), fonts);

  document.querySelector('.l1').style.letterSpacing = rand(-3, -2) + 'px';
  document.querySelector('.l2').style.letterSpacing = rand(-3, -2) + 'px';

  // вернём видимость «живой» композиции
  composition.style.visibility = 'visible';
  overlay.style.transform = ''; // сбросим на всякий

  applyCompositionShift();
  updateFontSize();

// зафиксировать базовый цвет под текущую тему (light/normal)
currentInk = stage.classList.contains('light') ? '#ffffff' : '#000000';
composition.style.color = currentInk;


undoBtn.hidden = true;

}

async function buildOuterStrokeMask(baseMaskURL, growPx){
  if (!baseMaskURL || growPx <= 0) return '';

  const img = await loadImage(baseMaskURL);
  const w = img.width, h = img.height;

  // базовый холст = раздутая маска
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // 1) положим исходную маску
  ctx.drawImage(img, 0, 0, w, h);

  // 2) раздуем ее блюром (growPx ≈ радиус)
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = `blur(${growPx}px)`;
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';

  // 3) превратим в «ч/б с альфой»: всё не-прозрачное → альфа 255
  const d = ctx.getImageData(0,0,w,h);
  const a = d.data;
  for (let i=0;i<a.length;i+=4){
    const alpha = a[i+3] > 0 ? 255 : 0;
    a[i]=255; a[i+1]=255; a[i+2]=255; a[i+3]=alpha;
  }
  ctx.putImageData(d,0,0);

  // 4) вычтем исходную маску → останется только внешнее кольцо
  const src = document.createElement('canvas');
  src.width = w; src.height = h;
  const sctx = src.getContext('2d');
  sctx.drawImage(img, 0, 0, w, h);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  return c.toDataURL('image/png');
}

async function applyStrokeLayer(){
  if (!isRounded || !maskURL || !strokeEnabled || strokeWidthPx <= 0){
    silhouetteStroke.classList.remove('active');
    silhouetteStroke.style.webkitMaskImage = '';
    silhouetteStroke.style.maskImage = '';
    return;
  }
  // пересчитать маску-кольцо, если нет или менялась толщина
  strokeMaskURL = await buildOuterStrokeMask(maskURL, strokeWidthPx);

  silhouetteStroke.style.background = strokeColor;
  silhouetteStroke.style.opacity = 1;
  silhouetteStroke.style.webkitMaskImage = `url(${strokeMaskURL})`;
  silhouetteStroke.style.maskImage      = `url(${strokeMaskURL})`;
  silhouetteStroke.classList.add('active');
}


// === СКРУГЛИТЬ / ВЕРНУТЬ ===
async function roundCorners() {
  if (isRounded) { undoAll(); return; }

  // оффскрин-клон, чтобы не моргала страница
  const snap = stage.cloneNode(true);
  const r = stage.getBoundingClientRect();
  snap.style.position = 'fixed';
  snap.style.left = '-99999px';
  snap.style.top  = '0';
  snap.style.width  = r.width + 'px';
  snap.style.height = r.height + 'px';

  // в клоне убираем старую маску, чтобы не удвоить
  const snapSil = snap.querySelector('#silhouetteFill');
  if (snapSil) {
    snapSil.style.webkitMaskImage = '';
    snapSil.style.maskImage = '';
    snapSil.classList.remove('active');
  }

  document.body.appendChild(snap);

  const canvas = await html2canvas(snap, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true
  });

  document.body.removeChild(snap);

  // собираем альфа-маску
  const w = canvas.width, h = canvas.height;
  const work = document.createElement('canvas');
  work.width = w; work.height = h;
  const ctx = work.getContext('2d');

  ctx.filter = 'blur(3.5px)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data, THRESHOLD = 140;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const lum = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i] = d[i+1] = d[i+2] = 255;   // белое
    d[i+3] = lum < THRESHOLD ? 255 : 0; // альфа
  }
  ctx.putImageData(img, 0, 0);
  maskURL = work.toDataURL('image/png');
  
  

  // включаем слой-заливку по маске
  const ink = currentInk || (stage.classList.contains('light') ? '#ffffff' : '#000000');
  silhouetteFill.style.background = ink;
  silhouetteFill.style.opacity = 1;
  silhouetteFill.style.webkitMaskImage = `url(${maskURL})`;
  silhouetteFill.style.maskImage      = `url(${maskURL})`;
  silhouetteFill.classList.add('active');
  
  await applyStrokeLayer();  // построим/покажем обводку, если включена


  overlay.style.background = 'transparent';
  overlay.hidden = false;

  // прячем «живую»
  composition.style.visibility = 'hidden';

  // переносим текущее смещение
// ВАЖНО: НЕ переносим смещение, оно уже "запечено" в маске
overlay.style.transform = '';
silhouetteFill.style.transform = '';
  silhouetteStroke.style.transform = '';


  isRounded = true;
  if (undoBtn) undoBtn.hidden = false;
}








function undoAll(){
  composition.style.visibility = 'visible';
  resetRoundState({force:true});

  overlay.style.transform = '';
  silhouetteFill.style.transform = '';

  if (undoBtn) undoBtn.hidden = true;
}




document.getElementById('undoAll')?.addEventListener('click', undoAll);


function openColor(){ 
  colorModal.hidden = false;
  colorPick.value = currentInk;
  colorAlpha.value = 100;
}
function closeColor(){ colorModal.hidden = true; }

colorBtn?.addEventListener('click', openColor);
colorClose?.addEventListener('click', closeColor);
colorDone?.addEventListener('click', closeColor);
colorModal?.addEventListener('click', e=>{ if(e.target===e.currentTarget) closeColor(); });
const strokeColorInput   = document.getElementById('strokeColor');
const strokeWidthInput   = document.getElementById('strokeWidth');
const strokeEnabledInput = document.getElementById('strokeEnabled');

strokeColorInput?.addEventListener('input', async ()=>{
  strokeColor = strokeColorInput.value;
  if (isRounded) {
    await applyStrokeLayer();
  }
});

strokeWidthInput?.addEventListener('input', async ()=>{
  strokeWidthPx = Math.max(0, +strokeWidthInput.value|0);
  if (isRounded) {
    await applyStrokeLayer();
  }
});

strokeEnabledInput?.addEventListener('change', async ()=>{
  strokeEnabled = !!strokeEnabledInput.checked;
  if (isRounded) {
    await applyStrokeLayer();
  }
});

// При открытии модалки синхронизируй текущие значения:
function openColor(){ 
  colorModal.hidden = false;
  colorPick.value      = currentInk;
  colorAlpha.value     = 100;
  strokeColorInput.value   = strokeColor;
  strokeWidthInput.value   = strokeWidthPx;
  strokeEnabledInput.checked = strokeEnabled;
}


// лайв-превью цвета
colorPick?.addEventListener('input', ()=>{
  currentInk = colorPick.value;
  if (isRounded && silhouetteFill.classList.contains('active')) {
    silhouetteFill.style.background = currentInk; // красим финальный силуэт
  } else {
    composition.style.color = currentInk;        // красим буквы/микро/кресты
  }
});


// прозрачность только для силуэта (не трогаем обычный режим)
colorAlpha?.addEventListener('input', ()=>{
  if (isRounded && silhouetteFill.classList.contains('active')) {
    silhouetteFill.style.opacity = (+colorAlpha.value/100).toFixed(2);
  }
});





// === ГРАДИЕНТ — МОДАЛКА (3 цвета, 2 смещения) ===
const gradToggle = document.getElementById('gradToggle');
const gradModal  = document.getElementById('gradModal');
const gradClose  = document.getElementById('gradClose');
const gradDone   = document.getElementById('gradDone');
const gradClear  = document.getElementById('gradClear');

const gradA      = document.getElementById('gradA');
const gradB      = document.getElementById('gradB');
const gradC      = document.getElementById('gradC');        // НОВОЕ
const gradAngle  = document.getElementById('gradAngle');
const gradBias1  = document.getElementById('gradBias1');    // НОВОЕ
const gradBias2  = document.getElementById('gradBias2');    // НОВОЕ

const gradNoise     = document.getElementById('gradNoise');
const gradNoiseSize = document.getElementById('gradNoiseSize');


// «перо» в процентах, сколько оставить на смешение вокруг границ
const FEATHER = 8; // можешь 1..5 подобрать по вкусу

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function buildThreeStopGradient() {
  const a = gradA?.value || '#ff6b6b';
  const b = gradB?.value || '#4d96ff';
  const c = gradC?.value || '#00c9a7';
  const ang = Number(gradAngle?.value ?? 180);

  let p1 = Number(gradBias1?.value ?? 33);
  let p2 = Number(gradBias2?.value ?? 66);

  // гарантируем порядок и рамки
  p1 = clamp(p1, 0, 100);
  p2 = clamp(p2, 0, 100);
  if (p2 < p1) p2 = p1;

  // рассчитываем «перо» около границ, чтобы не перейти диапазоны
  const f1 = Math.min(FEATHER, p1);          // слева от p1 есть место?
  const f2 = Math.min(FEATHER, 100 - p2);    // справа от p2 есть место?

  // плавные стыки: A до (p1 - f1), B от (p1 + f1) и до (p2 - f2), C от (p2 + f2)
  const css = `linear-gradient(${ang}deg,
    ${a} 0%, ${a} ${p1 - f1}%,
    ${b} ${p1 + f1}%, ${b} ${p2 - f2}%,
    ${c} ${p2 + f2}%, ${c} 100%)`;

  return css.replace(/\s+/g, ' ');
}

function applyGradientLive(){
  bgLayer.style.backgroundImage = buildThreeStopGradient();
  bgLayer.hidden = false;
  resetRoundState();
  applyGrain(); // ← чтобы интенсивность/размер сразу применялись
}




function openGrad(){
  if (!gradModal) return;
  gradModal.hidden = false;
  // текущие значения в UI
  if (gradNoise)     gradNoise.value     = Math.round(noiseIntensity * 100);
  if (gradNoiseSize) gradNoiseSize.value = noiseSizePx;
  applyGradientLive(); // показать
}

gradNoise?.addEventListener('input', () => {
  noiseIntensity = Math.max(0, Math.min(1, +gradNoise.value / 100));
  applyGrain();
});

gradNoiseSize?.addEventListener('input', () => {
  noiseSizePx = Math.max(1, +gradNoiseSize.value || 3);
  applyGrain();
});





function closeGrad(){
  if (!gradModal) return;
  gradModal.hidden = true;
  // document.body.style.overflow = ''; // убрали
}

gradToggle?.addEventListener('click', openGrad);
gradClose?.addEventListener('click', closeGrad);
gradDone?.addEventListener('click', closeGrad);

// Закрытие по клику на подложку (только по backdrop)
gradModal?.addEventListener('click', (e)=>{
  if (e.target === e.currentTarget) closeGrad();
});
// Esc — закрыть
document.addEventListener('keydown', (e)=>{
  if (!gradModal?.hidden && e.key === 'Escape') closeGrad();
});

function randomGradient() {
  // Генерация случайного цвета в hex
  const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

  // Случайные цвета
  gradA.value = randomColor();
  gradB.value = randomColor();
  gradC.value = randomColor();

  // Случайный угол от 0 до 360
  gradAngle.value = rand(0, 360);

  // Смещения (p1 < p2, но с отступом, чтобы был видимый B)
  let p1 = rand(10, 45);
  let p2 = rand(p1 + 10, 90);
  gradBias1.value = p1;
  gradBias2.value = p2;

  noiseIntensity = Math.random() < .8 ? rand(5, 30) / 100 : 0; // иногда без шума
  noiseSizePx = rand(300, 800);
  if (gradNoise)     gradNoise.value     = Math.round(noiseIntensity * 90);
  if (gradNoiseSize) gradNoiseSize.value = noiseSizePx;

  applyGradientLive();
}

document.getElementById('gradRandom')?.addEventListener('click', randomGradient);


// Живое превью
[gradA, gradB, gradC, gradAngle, gradBias1, gradBias2].forEach(el=>{
  el?.addEventListener('input', applyGradientLive);
});



function clearBackgroundAll(){
  // фон/градиент
  bgLayer.style.backgroundImage   = '';
  bgLayer.style.backgroundSize    = '';
  bgLayer.style.backgroundRepeat  = '';
  bgLayer.style.backgroundPosition= '';
  bgLayer.hidden = true;

  // шум
  noiseIntensity = 0;
  noiseURL = '';                  // сброс кеша (на всякий случай)
  applyGrain();                   // ← реально спрятать слой шума

  resetRoundState();
}

// обе кнопки чистят всё
document.getElementById('gradClear')?.addEventListener('click', clearBackgroundAll);
document.getElementById('bgClear')?.addEventListener('click', clearBackgroundAll);



// ==== helpers (можно оставить твои прежние) ====
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


function getTranslateY(el){
  const tr = getComputedStyle(el).transform;
  if (!tr || tr === 'none') return 0;
  // matrix(a,b,c,d,tx,ty)
  const m = tr.match(/matrix\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map(v=>parseFloat(v)); return p[5] || 0; }
  const t = tr.match(/translateY\((-?\d+(\.\d+)?)px\)/i);
  return t ? parseFloat(t[1]) : 0;
}

// ==== ПОЛНАЯ ЗАМЕНА downloadPng ====
// ==== ПРАВИЛЬНЫЙ экспорт PNG с силуэтом и фоном ====
async function downloadPng(){
  const SCALE = window.devicePixelRatio || 2;
  const { width, height } = stage.getBoundingClientRect();

  // 1) база: клон без overlay (он у нас рисуется отдельно)
  const baseClone = stage.cloneNode(true);
  const baseOv = baseClone.querySelector('#overlay');
  if (baseOv) baseOv.hidden = true;

  baseClone.style.position = 'fixed';
  baseClone.style.left = '-99999px';
  baseClone.style.top  = '0';
  baseClone.style.width  = width + 'px';
  baseClone.style.height = height + 'px';
  document.body.appendChild(baseClone);

  const baseCanvas = await html2canvas(baseClone, {
    backgroundColor: null,
    scale: SCALE,
    useCORS: true,
    scrollX: 0,
    scrollY: 0,
    windowWidth: width,
    windowHeight: height
  });

  document.body.removeChild(baseClone);

  // 2) итоговый холст
  const out = document.createElement('canvas');
  out.width  = baseCanvas.width;
  out.height = baseCanvas.height;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;

  // рисуем базу (фон, градиент и т.д.)
  octx.drawImage(baseCanvas, 0, 0);

  // === 3а) если включена обводка — рисуем её первой (под силуэтом)
if (isRounded && strokeEnabled && strokeMaskURL){
  const strokeCanvas = document.createElement('canvas');
  strokeCanvas.width = out.width; strokeCanvas.height = out.height;
  const sctx = strokeCanvas.getContext('2d');

  // заливаем цветом обводки
  sctx.fillStyle = strokeColor;
  sctx.fillRect(0,0,strokeCanvas.width, strokeCanvas.height);

  // применяем альфа-маску-кольцо
  const ring = await loadImage(strokeMaskURL);
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(ring, 0, 0, strokeCanvas.width, strokeCanvas.height);
  sctx.globalCompositeOperation = 'source-over';

  // смещение overlay учесть не нужно — маска делалась со «впаянным» положением
  octx.drawImage(strokeCanvas, 0, 0);
}

  
  // 3) если «Силуэт» активен — докладываем его по маске
  if (isRounded && silhouetteFill.classList.contains('active') && maskURL){
    const fill = document.createElement('canvas');
    fill.width = out.width; fill.height = out.height;
    const fctx = fill.getContext('2d');

    const bgImg = getComputedStyle(silhouetteFill).backgroundImage;
    const bgCol = getComputedStyle(silhouetteFill).backgroundColor;

    if (bgImg && bgImg.startsWith('linear-gradient')) {
      paintGradient(fctx, fill.width, fill.height, bgImg);
    } else if (bgImg && bgImg.startsWith('url(')) {
      const url = bgImg.slice(4, -1).replaceAll('"','').replaceAll("'","");
      try { const img = await loadImage(url); fctx.drawImage(img, 0, 0, fill.width, fill.height); }
      catch { fctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000'); fctx.fillRect(0,0,fill.width,fill.height); }
    } else {
      fctx.fillStyle = (bgCol && bgCol !== 'rgba(0, 0, 0, 0)') ? bgCol : (currentInk || '#000');
      fctx.fillRect(0,0,fill.width,fill.height);
    }

    // альфа-маска
    const mImg = await loadImage(maskURL);
    fctx.globalCompositeOperation = 'destination-in';
    fctx.drawImage(mImg, 0, 0, fill.width, fill.height);
    fctx.globalCompositeOperation = 'source-over';

    // учитываем смещение overlay (translateY) и непрозрачность
    const ty = (getTranslateY(overlay) || 0) * SCALE;
    octx.globalAlpha = parseFloat(getComputedStyle(silhouetteFill).opacity) || 1;
    octx.drawImage(fill, 0, ty);
    octx.globalAlpha = 1;
  }

  // 4) сохранить файл
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





// === ФОН: загрузка ===
document.getElementById('bgBtn')?.addEventListener('click', () => {
  document.getElementById('bgUpload').click();
});
document.getElementById('bgUpload')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (currentBgUrl) { URL.revokeObjectURL(currentBgUrl); currentBgUrl=''; }
  currentBgUrl = URL.createObjectURL(file);
  bgLayer.style.backgroundImage = `url(${currentBgUrl})`;
  bgLayer.hidden = false;
  resetRoundState();
});
document.getElementById('bgClear')?.addEventListener('click', () => {
  if (currentBgUrl) { URL.revokeObjectURL(currentBgUrl); currentBgUrl=''; }
  bgLayer.style.backgroundImage = '';
  bgLayer.hidden = true;
  resetRoundState();
});

// === Инверт цвета ===
document.getElementById('invert')?.addEventListener('click', () => {
  const toLight = !stage.classList.contains('light'); // что будет после toggle
  stage.classList.toggle('light');

  if (isRounded) {
    currentInk = toLight ? '#ffffff' : '#000000';
    silhouetteFill.style.background = currentInk;
  } else {
    currentInk = toLight ? '#ffffff' : '#000000';
    composition.style.color = currentInk;
  }
});

function makeNoiseTexture(tile=64, alpha=28) {
  const c = document.createElement('canvas');
  c.width = c.height = tile;
  const ctx = c.getContext('2d', { willReadFrequently: false });

  const img = ctx.createImageData(tile, tile);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0; // 0..255
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = alpha; // прозрачность точки
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

function applyGrain() {
  if (!grain) return;                // защита
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




// === Мелкий текст ===
document.getElementById('micro')?.addEventListener('click', () => {
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
  applyCompositionShift(); // высота изменилась
});

// === КОЛОБКИ (рамки у букв) ===
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


// === КРЕСТЫ ===
function clearCrosses(){
  if (!decors) return;
  decors.innerHTML = '';
}

function toggleCrosses(){
  if (!decors) return;

  // если уже есть кресты — выключаем
  if (decors.childElementCount > 0){
    clearCrosses();
    resetRoundState();
    return;
  }

  const howMany = rand(1, 5);

  // 1. Берём габариты всей типографической группы
  const textRect = composition.getBoundingClientRect();
  const l1Rect = line1.getBoundingClientRect();
  const l2Rect = line2.getBoundingClientRect();

  // границы буквенной композиции (верх по верхней строке, низ по нижней строке)
  const minX = Math.min(l1Rect.left, l2Rect.left) - textRect.left;
  const maxX = Math.max(l1Rect.right, l2Rect.right) - textRect.left;
  const minY = Math.min(l1Rect.top, l2Rect.top) - textRect.top;
  const maxY = Math.max(l1Rect.bottom, l2Rect.bottom) - textRect.top;

  // 2. Делаем отступ вокруг букв
  const pad = 40;
  const areaLeft   = Math.max(0, minX - pad);
  const areaTop    = Math.max(0, minY - pad);
  const areaRight  = Math.min(textRect.width, maxX + pad);
  const areaBottom = Math.min(textRect.height, maxY + pad);

  // 3. Генерация крестов в этом ограниченном прямоугольнике
  for (let i = 0; i < howMany; i++) {
    const s = rand(18, 42); // размер плюса
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


btnCrosses?.addEventListener('click', toggleCrosses);


// === СДВИГ КОМПОЗИЦИИ (вверх/центр/вниз) ===
let compShiftState = 0;                  // -1 = вниз, 0 = центр, 1 = вверх
const SHIFT_FACTOR = 0.35;                // ~ «200px» как доля высоты composition

function applyCompositionShift() {
  const baseRect = composition.getBoundingClientRect();
  const compH = baseRect.height || 0;
  const px = Math.round(compH * SHIFT_FACTOR);
  const offset = compShiftState === 1 ? -px : compShiftState === -1 ? px : 0;

  const t = `translateY(${offset}px)`;
  composition.style.transform = t;

  if (isRounded) {
    overlay.style.transform = t;     // двигаем контейнер
    silhouetteFill.style.transform = ''; // ребёнка НЕ дублируем
  }
}







document.getElementById('moveUp')?.addEventListener('click', () => {
  compShiftState = Math.min(1, compShiftState + 1); // вниз -> центр -> вверх
  applyCompositionShift();
});
document.getElementById('moveDown')?.addEventListener('click', () => {
  compShiftState = Math.max(-1, compShiftState - 1); // вверх -> центр -> вниз
  applyCompositionShift();
});

window.addEventListener('resize', applyCompositionShift);

// === СОБЫТИЯ ===
document.getElementById('btn').addEventListener('click', generate);
document.getElementById('round').addEventListener('click', roundCorners);
document.getElementById('download').addEventListener('click', downloadPng);

// первичный рендер
generate();
 
