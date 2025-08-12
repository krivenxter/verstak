// === ДАННЫЕ ===
const PHRASES = [
  ["монитора","блик"],["фотошопа","тень"],["клавиатуры","пыль"],
  ["диска","царапина"],["плеера","шум"],["кассеты","треск"],
  ["экрана","блик"],["обоев","градиент"],["баннера","пиксель"],
  ["джинсов","клёш"],["логотипа","отблеск"],["пейджера","сигнал"],
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
  'PT Sans','Roboto','Neucha','Comfortaa','Russo One'
];

const SANS_POOL = [
  'Roboto','PT Sans','Montserrat','Rubik','Oswald','Exo 2','Ubuntu',
  'Didact Gothic','Tenor Sans','Play','Unbounded'
];

// === ШОРТКАТЫ ===
const stage       = document.getElementById('stage');
const overlay     = document.getElementById('overlay');
const line1       = document.getElementById('line1');
const line2       = document.getElementById('line2');
const custom      = document.getElementById('custom');
const bgLayer     = document.getElementById('bgLayer'); // фон через background
const btnCringe   = document.getElementById('cringe');
const composition = document.getElementById('composition');

const roundBtn       = document.getElementById('round');
const menu           = document.getElementById('silhouetteMenu');
const actCutBg       = document.getElementById('actCutBg');
const actFill        = document.getElementById('actFill');
const actGrad        = document.getElementById('actGrad');
const silhouetteFill = document.getElementById('silhouetteFill');


let currentBgUrl = ''; // для revokeObjectURL

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
      ? rand(120, 222) / 100 // буквы чуть крупнее на мобилке
      : rand(92, 192) / 100; // оригинал для десктопа

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

function resetRoundState() {
  isRounded = false;
  roundedURL = '';
  maskURL = '';

  // Оверлей ДОЛЖЕН быть скрыт в обычном режиме
  overlay.hidden = true;
  overlay.style.backgroundImage = '';
  overlay.classList.remove('threshold-only');

  const btn = document.getElementById('round');
  if (btn) btn.textContent = 'Силуэт';

  clearSilhouetteFill();
  if (menu) menu.hidden = true;
}


const overlay = document.getElementById('overlay');
overlay.classList.remove('threshold-only');


// удалить мелкий текст
function removeMicro(){
  const m = composition.querySelector('.micro-row');
  if (m) m.remove();
}

// === ГЕНЕРАЦИЯ КОМПОЗИЦИИ ===
function generate(){
  resetRoundState();
  removeMicro();
  stage.querySelectorAll('.ch.outlined').forEach(n => n.classList.remove('outlined'));

  const customLines = getCustomLines();
  const [w1, w2] = customLines ?? sample(PHRASES);
  const fonts = pickFonts();

  renderWord(line1, mixedCase(w1), fonts);
  renderWord(line2, mixedCase(w2), fonts);

  document.querySelector('.l1').style.letterSpacing = rand(-3, -2) + 'px';
  document.querySelector('.l2').style.letterSpacing = rand(-3, -2) + 'px';

  applyCompositionShift(); // учесть текущее положение после перерисовки
}

// === СКРУГЛИТЬ / ВЕРНУТЬ ===
async function roundCorners() {
  const btn = roundBtn;

  // При первом нажатии — рендерим, при повторном — возвращаемся
  if (!isRounded) {
    // Сначала прячем, чтобы не захватить старый overlay
    overlay.hidden = true;

    const canvas = await html2canvas(stage, { backgroundColor: null, scale: 2, useCORS: true });
    const w = canvas.width, h = canvas.height;

    // 1) Блюрим + делаем обычный threshold (для визуального превью)
    const work = document.createElement('canvas');
    work.width = w; work.height = h;
    const ctx  = work.getContext('2d');

    const BLUR_RADIUS = window.innerWidth <= 640 ? 4 : 4;
    ctx.filter = `blur(${BLUR_RADIUS}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

    const THRESHOLD = 135;
    const img = ctx.getImageData(0, 0, w, h);
    const d   = img.data;

    // Сохраним сразу вторую копию для маски
    const imgMask = ctx.getImageData(0, 0, w, h);
    const dm = imgMask.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const lum = 0.2126*r + 0.7152*g + 0.0722*b;

      // Вариант для визуального threshold-превью: чёрные буквы на белом
      const val = lum < THRESHOLD ? 0 : 255;
      d[i] = d[i+1] = d[i+2] = val; d[i+3] = 255;

      // Маска — наоборот: буквы белые (видимые), фон чёрный (прозрачный)
    // ДОЛЖНО БЫТЬ (альфа-маска):
const mval = lum < THRESHOLD ? 255 : 0;
  dm[i] = dm[i+1] = dm[i+2] = 255;
      dm[i+3] = mval;
    }

    ctx.putImageData(img, 0, 0);
    roundedURL = work.toDataURL('image/png');

    // Соберём maskURL
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w; maskCanvas.height = h;
    const mctx = maskCanvas.getContext('2d');
    mctx.putImageData(imgMask, 0, 0);
    maskURL = maskCanvas.toDataURL('image/png');

    // Показать threshold как фон overlay и повесить маску для заливки
overlay.hidden = false;
overlay.style.backgroundImage = `url(${roundedURL})`;
overlay.classList.add('threshold-only');

clearSilhouetteFill();
if (silhouetteFill){
  silhouetteFill.style.webkitMaskImage = `url(${maskURL})`;
  silhouetteFill.style.maskImage = `url(${maskURL})`;
}

    // Показать threshold как фон 

    isRounded = true;
    if (btn) btn.textContent = 'Вернуть';

    // Показать меню действий рядом с кнопкой
    openSilhouetteMenu();

  } else {
    // Возврат
    overlay.hidden = true;
    isRounded = false;
    if (btn) btn.textContent = 'Силуэт';
    if (menu) menu.hidden = true;
  }
}


function openSilhouetteMenu(){
  if (!menu || !roundBtn) return;
  const btnRect = roundBtn.getBoundingClientRect();
  // позиционируем относительно окна
  menu.style.left = Math.round(btnRect.left) + 'px';
  menu.style.top  = Math.round(btnRect.bottom + 8) + 'px';
  menu.hidden = false;
}


function closeSilhouetteMenu(){
  if (menu) menu.hidden = true;
}


document.addEventListener('click', (e)=>{
  if (menu?.hidden) return;
  const isClickInsideMenu = menu?.contains(e.target);
  const isRoundBtn = e.target === roundBtn;
  if (!isClickInsideMenu && !isRoundBtn) closeSilhouetteMenu();
});


function applyCutBg(){
  if (!isRounded || !silhouetteFill) return;

  const bg = getComputedStyle(bgLayer).backgroundImage;
  if (!bg || bg === 'none'){
    alert('Фоновой картинки нет — выбери Фон, а потом «Вырезать фон».');
    return;
  }
  
  // 1) кладём фон внутрь силуэта
  silhouetteFill.style.background = '';
  silhouetteFill.style.backgroundImage = bg;
  silhouetteFill.classList.add('active');
  
    bgLayer.hidden = true;
  
 // 3) убираем ч/б превью, чтобы не мешало
  overlay.style.backgroundImage = 'none';
  overlay.classList.remove('threshold-only');

  closeSilhouetteMenu();
}

function applyFillColor(){
  if (!isRounded || !silhouetteFill) return;
  const color = prompt('Цвет силуэта (hex, rgb, etc):', '#111111');
  if (!color) return;

  silhouetteFill.style.backgroundImage = '';
  silhouetteFill.style.background = color;
  silhouetteFill.classList.add('active');

  overlay.style.backgroundImage = 'none';
  overlay.classList.remove('threshold-only');

  closeSilhouetteMenu();
}

function applyFillGradient(){
  if (!isRounded || !silhouetteFill) return;

  const g = 'linear-gradient(135deg, #4d70ff 0%, #ff75bf 100%)';
  silhouetteFill.style.backgroundImage = '';
  silhouetteFill.style.background = g;
  silhouetteFill.classList.add('active');

  overlay.style.backgroundImage = 'none';
  overlay.classList.remove('threshold-only');

  closeSilhouetteMenu();
}


actCutBg?.addEventListener('click', applyCutBg);
actFill ?.addEventListener('click', applyFillColor);
actGrad ?.addEventListener('click', applyFillGradient);


// === СКАЧАТЬ PNG: все эффекты, но без UI-рамки/радиуса ===
async function downloadPng() {
  const clone = stage.cloneNode(true);
  const { width, height } = stage.getBoundingClientRect();
  clone.style.width  = width + 'px';
  clone.style.height = height + 'px';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';

  const cloneOverlay = clone.querySelector('.overlay');
  if (cloneOverlay) cloneOverlay.style.borderRadius = '0';

  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top  = '0';
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    backgroundColor: null,
    scale: 2,
    useCORS: true
  });

  document.body.removeChild(clone);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'print.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

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
  bgLayer.style.backgroundImage = buildThreeStopGradient(); // ← используем мягкую сборку
  bgLayer.hidden = false;
  resetRoundState();
}


function openGrad(){
  if (!gradModal) return;
  gradModal.hidden = false;
  // document.body.style.overflow = 'hidden'; // убрали
  applyGradientLive(); // сразу показать текущий градиент
}


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

// Живое превью
[gradA, gradB, gradC, gradAngle, gradBias1, gradBias2].forEach(el=>{
  el?.addEventListener('input', applyGradientLive);
});

// Убрать градиент
gradClear?.addEventListener('click', ()=>{
  bgLayer.style.backgroundImage = '';
  bgLayer.hidden = true;
  resetRoundState();
});

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

// ==== ПОЛНАЯ ЗАМЕНА downloadPng ====
async function downloadPng(){
  const scale = 2;
  const { width, height } = stage.getBoundingClientRect();

  // 1) БАЗА: клон сцены, overlay скрыт (маски html2canvas не осилит)
  const baseClone = stage.cloneNode(true);
  const baseOverlay = baseClone.querySelector('#overlay');
  if (baseOverlay) baseOverlay.hidden = true;
  baseClone.style.position = 'fixed';
  baseClone.style.left = '-99999px';
  baseClone.style.top  = '0';
  baseClone.style.width  = width + 'px';
  baseClone.style.height = height + 'px';
  document.body.appendChild(baseClone);

  const baseCanvas = await html2canvas(baseClone, {
    backgroundColor: null,
    scale,
    useCORS: true
  });
  document.body.removeChild(baseClone);

  // 2) Готовим итоговый канвас
  const out = document.createElement('canvas');
  out.width  = baseCanvas.width;
  out.height = baseCanvas.height;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;

  // белый фон карточки
  octx.fillStyle = '#fff';
  octx.fillRect(0,0,out.width,out.height);

  // базовая сцена (bgLayer в своём текущем состоянии, композиция, и т.д.)
  octx.drawImage(baseCanvas, 0, 0);
  
  // Если включён "Силуэт" — в живом UI всё перекрывает белый overlay.
// В экспорте делаем так же: сначала белим, потом рисуем threshold/заливку.
if (isRounded) {
  octx.fillStyle = '#fff';
  octx.fillRect(0, 0, out.width, out.height);
}


  // 3) Если «Силуэт» не активен — сразу сохраняем
  if (!isRounded){
    return out.toBlob(saveBlob, 'image/png');
  }

  // 4) Если показывается ч/б превью без заливки — дорисуем поверх
  const overlayBg = overlay.style.backgroundImage || '';
  const onlyThreshold = overlayBg && overlayBg.includes('data:image') && !silhouetteFill.classList.contains('active');
  if (onlyThreshold){
    try {
      const th = await loadImage(roundedURL);
      octx.drawImage(th, 0, 0, out.width, out.height);
    } catch(e) {/* ок, пропустим */}
  }

  // 5) Если выбрана ЗАЛИВКА/ВЫРЕЗАНИЕ — рисуем ЕЁ СВЕРХУ по альфа-маске
  if (silhouetteFill.classList.contains('active')){
    const fillStr = getComputedStyle(silhouetteFill).backgroundImage;
    const fillCol = getComputedStyle(silhouetteFill).backgroundColor;

    // 5.1 соберём слой заливки
    const fill = document.createElement('canvas');
    fill.width = out.width; fill.height = out.height;
    const fctx = fill.getContext('2d');

    if (fillStr && fillStr.startsWith('linear-gradient')){
      paintGradient(fctx, fill.width, fill.height, fillStr);
    } else if (fillStr && fillStr.startsWith('url(')){
      const url = fillStr.slice(4, -1).replaceAll('"','').replaceAll("'","");
      try {
        const img = await loadImage(url);
        fctx.drawImage(img, 0, 0, fill.width, fill.height);
      } catch(e){
        // фолбэк — цвет, если картинка не подтянулась
        fctx.fillStyle = (fillCol && fillCol !== 'rgba(0, 0, 0, 0)') ? fillCol : '#000';
        fctx.fillRect(0,0,fill.width,fill.height);
      }
    } else {
      fctx.fillStyle = (fillCol && fillCol !== 'rgba(0, 0, 0, 0)') ? fillCol : '#000';
      fctx.fillRect(0,0,fill.width,fill.height);
    }

    // 5.2 применим альфа-маску (maskURL уже в масштабе сцены)
    try{
      const mImg = await loadImage(maskURL);
      fctx.globalCompositeOperation = 'destination-in'; // оставить только внутри маски
      fctx.drawImage(mImg, 0, 0, fill.width, fill.height);
      fctx.globalCompositeOperation = 'source-over';
    } catch(e){ /* если вдруг маска не загрузилась — просто не обрежем */ }

    // 5.3 поверх базы (строго последним слоем, как overlay в DOM)
    octx.drawImage(fill, 0, 0);
  }

  // 6) Сохранить
  out.toBlob(saveBlob, 'image/png');

  function saveBlob(blob){
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'print.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
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
  stage.classList.toggle('light');
  resetRoundState();
});

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

// === СДВИГ КОМПОЗИЦИИ (вверх/центр/вниз) ===
let compShiftState = 0;                  // -1 = вниз, 0 = центр, 1 = вверх
const SHIFT_FACTOR = 0.35;                // ~ «200px» как доля высоты composition

function applyCompositionShift() {
  const compH = composition.getBoundingClientRect().height || 0;
  const px = Math.round(compH * SHIFT_FACTOR);
  const offset = compShiftState === 1 ? -px : compShiftState === -1 ? px : 0;
  composition.style.transform = `translateY(${offset}px)`;
  resetRoundState();
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

