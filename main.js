/* =========================================================
   奶龙官方网站 · main.js
   一个“正常”的 IP 营销网站。请放心向下滚动。
   ========================================================= */
'use strict';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const f1 = (v) => (+v).toFixed(1);

const seen = localStorage.getItem('nlSeen') === '1';
let userName = localStorage.getItem('nlName') || '';

/* =========================================================
   1. 奶龙官方形象 + “变异”叠加层
   官方图片上叠加 SVG（眼睛、嘴巴、多余的眼睛），配合滤镜逐级变异
   ========================================================= */
const IMG = {
  nl: {
    src: 'images/nailong.png', w: 488, h: 473, s: 1, rot: -12,
    eyes: [[245, 107, 12, 14], [322, 90, 10, 12]], mouth: [306, 153],
    head: '148 8 232 232', face: '168 26 210 210',
    extra: [[300, 300, 12], [262, 360, 8], [345, 372, 9], [150, 180, 7], [392, 140, 7], [222, 55, 7],
      [292, 38, 6], [200, 150, 6], [218, 405, 6], [335, 412, 6], [252, 250, 7], [352, 245, 8]],
  },
  feast: {
    src: 'images/feast.jpg', w: 1280, h: 740, s: 1.35, rot: 7,
    eyes: [[617, 155, 16, 18], [720, 167, 15, 18]], mouth: [668, 224],
  },
  peek: {
    src: 'images/peek.png', w: 300, h: 300, s: 1.9, rot: 0,
    eyes: [[85, 160, 22, 24], [208, 158, 22, 24]], mouth: [143, 215],
  },
};

function teethSVG(x0, x1, y, ct, cb, n, big, s) {
  const X = (t) => x0 + (x1 - x0) * t;
  const T = (t) => y + 2 * t * (1 - t) * (ct - y);
  const B = (t) => y + 2 * t * (1 - t) * (cb - y);
  let out = '';
  for (let i = 1; i < n - 1; i++) {
    const a = i / n, b = (i + 1) / n, m = (a + b) / 2;
    const L1 = (big ? rand(9, 19) : rand(5, 9)) * s;
    const L2 = (big ? rand(8, 17) : rand(4, 8)) * s;
    out += `<path d="M${f1(X(a))} ${f1(T(a))} L${f1(X(b))} ${f1(T(b))} L${f1(X(m))} ${f1(T(m) + L1)} Z"/>`;
    out += `<path d="M${f1(X(a))} ${f1(B(a))} L${f1(X(b))} ${f1(B(b))} L${f1(X(m))} ${f1(B(m) - L2)} Z"/>`;
  }
  return `<g fill="#ece4c8" stroke="#3a2a10" stroke-width="${f1(0.8 * s)}">${out}</g>`;
}

function mouthSVG(I, big) {
  const s = I.s, [mx, my] = I.mouth;
  const x0 = mx - (big ? 54 : 38) * s, x1 = mx + (big ? 48 : 34) * s, y = my - 12 * s;
  const ct = y + (big ? 12 : 8) * s, cb = y + (big ? 82 : 52) * s, cx = (x0 + x1) / 2;
  return `<g transform="rotate(${I.rot} ${mx} ${my})">
    <path d="M${f1(x0)} ${f1(y)} Q${f1(cx)} ${f1(ct)} ${f1(x1)} ${f1(y)} Q${f1(cx)} ${f1(cb)} ${f1(x0)} ${f1(y)} Z" fill="#140000" stroke="#000" stroke-width="${f1(1.5 * s)}"/>
    ${teethSVG(x0, x1, y, ct, cb, big ? 16 : 11, big, s)}</g>`;
}

const sclera = (x, y, rx, ry, pr, look, s) =>
  `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#fbf8ee" stroke="#2a1a0a" stroke-width="${f1(1.5 * s)}"/>
   <g class="look" data-r="${f1(look)}"><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(pr)}" fill="#111"/></g>`;

function overlaySVG(v, I) {
  if (v === 'happy') return '';
  const s = I.s;
  let o = '';
  if (v === 'stare') {
    I.eyes.forEach(([x, y, rx, ry]) => { o += sclera(x, y, rx * 1.3, ry * 1.2, rx * 0.28, rx * 0.7, s); });
    return o;
  }
  if (v === 'wrong') {
    const [[x0, y0, rx0, ry0], [x1, y1, rx1, ry1]] = I.eyes;
    o += sclera(x0, y0, rx0 * 1.8, ry0 * 1.6, rx0 * 0.2, rx0 * 1.2, s);
    o += sclera(x1, y1 - ry1 * 0.5, rx1, ry1 * 0.95, rx1 * 0.22, rx1 * 0.6, s);
    return o + mouthSVG(I, false);
  }
  // hollow / hollowMany / final
  const many = v === 'hollowMany' || v === 'final';
  const pupil = v === 'final' ? '#ff1a1a' : '#fff';
  if (many && I.extra) {
    I.extra.slice(0, v === 'final' ? 12 : 6).forEach(([x, y, r]) => {
      o += `<ellipse cx="${x}" cy="${y}" rx="${f1(r * 1.35)}" ry="${r}" fill="#efe8d0" stroke="#000" stroke-width="1.5"/>
        <g class="look" data-r="${f1(r * 0.7)}"><circle cx="${x}" cy="${y}" r="${f1(r * 0.42)}" fill="#000"/></g>`;
    });
  }
  o += mouthSVG(I, true);
  I.eyes.forEach(([x, y, rx, ry]) => {
    o += `<path d="M${f1(x - rx * 0.5)} ${f1(y + ry * 0.9)} C${f1(x - rx * 0.7)} ${f1(y + ry * 2.6)} ${f1(x - rx * 0.3)} ${f1(y + ry * 4.2)} ${f1(x - rx * 0.1)} ${f1(y + ry * 5.4)} C${f1(x + rx * 0.1)} ${f1(y + ry * 4)} ${f1(x + rx * 0.2)} ${f1(y + ry * 2.4)} ${f1(x + rx * 0.45)} ${f1(y + ry)} Z" fill="#000" opacity=".85"/>
      <ellipse cx="${x}" cy="${y}" rx="${f1(rx * 1.45)}" ry="${f1(ry * 1.45)}" fill="#000"/>
      <g class="look" data-r="${f1(rx * 0.7)}"><circle cx="${x}" cy="${y}" r="${f1(rx * (v === 'final' ? 0.3 : 0.2))}" fill="${pupil}"/></g>`;
  });
  return o;
}

/** 生成一个官方奶龙图像（可带变异） */
function onl(v = 'happy', key = 'nl', vb = null, par = 'xMidYMid meet') {
  const I = IMG[key];
  const fid = v === 'hollowMany' ? 'hollow' : v;
  const flt = v === 'happy' ? '' : `filter="url(#f-${fid})"`;
  return `<svg class="nl onl" viewBox="${vb || `0 0 ${I.w} ${I.h}`}" preserveAspectRatio="${par}" xmlns="http://www.w3.org/2000/svg">
    <image href="${I.src}" width="${I.w}" height="${I.h}" ${flt}/>${overlaySVG(v, I)}</svg>`;
}

/* 商品图（全部使用官方形象） */
const RND = 'images/nailong-round.png';
const PROD = {
  plush: () => `<img src="images/nailong.png" alt="奶龙毛绒公仔" />`,
  box: () => `<svg viewBox="0 0 200 200">
      <rect x="42" y="80" width="116" height="94" rx="10" fill="#FF8FAB"/>
      <rect x="34" y="62" width="132" height="30" rx="8" fill="#FF6F98"/>
      <rect x="92" y="62" width="16" height="112" fill="#FFD43B"/>
      <path d="M100 62 C78 30 56 48 100 62 C144 48 122 30 100 62Z" fill="#FFD43B" stroke="#D99A00" stroke-width="3"/>
      <image href="${RND}" x="46" y="104" width="46" height="46"/>
      <text x="133" y="146" font-size="44" fill="#fff" font-weight="900" text-anchor="middle" font-family="Arial">?</text></svg>`,
  pillow: () => `<svg viewBox="0 0 200 200">
      <rect x="18" y="32" width="164" height="136" rx="54" fill="#FFD43B" stroke="#D99A00" stroke-width="4"/>
      <path d="M40 40 Q100 52 160 40" fill="none" stroke="#E8B400" stroke-width="3" opacity=".6"/>
      <image href="${RND}" x="45" y="45" width="110" height="110"/></svg>`,
  cup: () => `<svg viewBox="0 0 200 200">
      <path d="M145 72 Q182 76 172 112 Q164 136 138 130" fill="none" stroke="#D99A00" stroke-width="9" stroke-linecap="round"/>
      <path d="M55 40 H145 L135 180 Q100 190 65 180 Z" fill="#FFE27A" stroke="#D99A00" stroke-width="4" stroke-linejoin="round"/>
      <rect x="48" y="28" width="104" height="18" rx="6" fill="#FF8FAB"/>
      <image href="${RND}" x="60" y="72" width="80" height="80"/></svg>`,
  stickers: () => `<svg viewBox="0 0 200 200">
      <image href="${RND}" x="8" y="12" width="96" height="96" transform="rotate(-12 56 60)"/>
      <image href="${RND}" x="98" y="6" width="92" height="92" transform="rotate(10 144 52)"/>
      <image href="${RND}" x="52" y="96" width="98" height="98" transform="rotate(-4 101 145)"/></svg>`,
  night: () => `<svg viewBox="0 0 200 200">
      <defs>
        <radialGradient id="nlGlow"><stop offset="0" stop-color="#FFF6C8" stop-opacity=".8"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></radialGradient>
        <clipPath id="domeClip"><path d="M50 160 Q50 50 100 50 Q150 50 150 160 Z"/></clipPath>
      </defs>
      <circle cx="100" cy="105" r="98" fill="url(#nlGlow)"/>
      <rect x="40" y="50" width="120" height="112" fill="#FFF3C4" clip-path="url(#domeClip)"/>
      <image href="images/peek.png" x="30" y="58" width="140" height="140" clip-path="url(#domeClip)"/>
      <path d="M50 160 Q50 50 100 50 Q150 50 150 160 Z" fill="rgba(255,250,220,.18)" stroke="#D99A00" stroke-width="4"/>
      <rect x="40" y="158" width="120" height="22" rx="8" fill="#FFB300"/></svg>`,
};

/* =========================================================
   2. 声音引擎（Web Audio，全部实时合成）
   ========================================================= */
const AE = {
  ctx: null, on: false, muted: false, p: 0, stage: 0, step: 0, timer: null, beatTimer: null,
  MEL: [523.25, 659.25, 783.99, 659.25, 698.46, 880, 783.99, 0, 659.25, 783.99, 1046.5, 783.99, 698.46, 659.25, 587.33, 523.25],
  BASS: [130.81, 0, 196, 0, 174.61, 0, 196, 0, 130.81, 0, 196, 0, 146.83, 0, 130.81, 0],

  build() {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return false;
    const c = (this.ctx = new C());
    this.comp = c.createDynamicsCompressor();
    this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0.6; this.master.connect(this.comp);
    this.beatOut = c.createGain(); this.beatOut.gain.value = 0.9; this.beatOut.connect(this.comp);
    this.mel = c.createGain(); this.mel.gain.value = 0.22; this.mel.connect(this.master);
    // 低频嗡鸣
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 160;
    this.droneG = c.createGain(); this.droneG.gain.value = 0;
    [43.65, 46.25, 87.9, 61.7].forEach((fr) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(this.lp); o.start();
    });
    this.lp.connect(this.droneG); this.droneG.connect(this.master);
    // 噪声
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    this.hissG = c.createGain(); this.hissG.gain.value = 0;
    n.connect(hp).connect(this.hissG).connect(this.master); n.start();
    return true;
  },
  start() {
    if (!this.ctx && !this.build()) return;
    this.ctx.resume(); this.on = true;
    clearTimeout(this.timer); clearTimeout(this.beatTimer);
    this.update(this.p, this.stage);
    this.loop(); this.beatLoop();
  },
  stop() { this.on = false; clearTimeout(this.timer); clearTimeout(this.beatTimer); if (this.ctx) this.ctx.suspend(); },

  loop() {
    if (!this.on) return;
    const p = this.p, i = this.step % 16;
    const fr = this.MEL[i];
    if (fr && !(p > 0.45 && Math.random() < (p - 0.45) * 1.3)) this.note(fr, 0.18, 1);
    if (this.BASS[i]) this.note(this.BASS[i], 0.32, 0.55);
    this.step++;
    this.timer = setTimeout(() => this.loop(), 230 * (1 + p * p * 2.6));
  },
  note(freq, len, vol) {
    const c = this.ctx, p = this.p, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    const det = -p * p * 700 + (Math.random() - 0.5) * p * p * 520;
    o.detune.setValueAtTime(det, t);
    const L = len * (1 + p * 3);
    if (p > 0.35) o.detune.linearRampToValueAtTime(det - p * 260, t + L);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    o.connect(g).connect(this.mel); o.start(t); o.stop(t + L + 0.05);
  },
  beatLoop() {
    if (!this.on) return;
    if (this.stage >= 7) { this.thump(0); this.thump(0.2); }
    this.beatTimer = setTimeout(() => this.beatLoop(), lerp(1100, 620, smooth(0.7, 1, this.p)));
  },
  thump(dt) {
    const c = this.ctx, t = c.currentTime + dt;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.8, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(this.beatOut); o.start(t); o.stop(t + 0.26);
  },
  update(p, stage) {
    this.p = p; this.stage = stage;
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    this.mel.gain.setTargetAtTime(0.22 * (1 - smooth(0.58, 0.82, p)), t, 0.3);
    this.droneG.gain.setTargetAtTime(smooth(0.3, 0.85, p) * 0.32, t, 0.6);
    this.lp.frequency.setTargetAtTime(120 + p * 420, t, 0.6);
    this.hissG.gain.setTargetAtTime(smooth(0.5, 1, p) * 0.035, t, 0.6);
  },
  silence(on) {
    if (!this.ctx || this.muted === on) return;
    this.muted = on;
    this.master.gain.setTargetAtTime(on ? 0 : 0.6, this.ctx.currentTime, on ? 0.12 : 0.6);
  },
  blip() {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime;
    const n = c.createBufferSource(); n.buffer = this.noiseBuf;
    const g = c.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(g).connect(this.master); n.start(t, Math.random()); n.stop(t + 0.13);
  },
  sting() {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    g.connect(this.master);
    [196, 207.65, 277.18, 293.66, 415.3].forEach((fr) => {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr;
      o.detune.linearRampToValueAtTime(-120, t + 2);
      const og = c.createGain(); og.gain.value = 0.16;
      o.connect(og).connect(g); o.start(t); o.stop(t + 2.3);
    });
    this.thump(0);
  },
  scream() {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime;
    this.muted = false;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(1, t);
    this.mel.gain.setValueAtTime(0, t); this.droneG.gain.setValueAtTime(0, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.02);
    g.gain.setValueAtTime(1, t + 1.0); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    g.connect(this.master);
    const n = c.createBufferSource(); n.buffer = this.noiseBuf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2800, t + 0.25); bp.frequency.exponentialRampToValueAtTime(380, t + 1.6);
    n.connect(bp).connect(g); n.start(t); n.stop(t + 1.8);
    [220, 233.08, 311.13, 466.16, 622.25, 739.99].forEach((fr) => {
      const o = c.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(fr * 1.4, t); o.frequency.exponentialRampToValueAtTime(fr * 0.45, t + 1.6);
      const og = c.createGain(); og.gain.value = 0.11;
      o.connect(og).connect(g); o.start(t); o.stop(t + 1.8);
    });
  },
};

/* =========================================================
   3. 初始化页面内容
   ========================================================= */
if (seen) {
  $('.hero-nl').dataset.nl = 'stare';
  $('#heroSub').innerHTML = '欢迎回来。<br />奶龙一直在等你 💛';
  $('.speech').textContent = '你回来了。';
}
$$('[data-nl]').forEach((el) => { el.innerHTML = onl(el.dataset.nl); });
$$('[data-prod]').forEach((el) => { el.innerHTML = PROD[el.dataset.prod](); });
const setScene = (v) => { $('#scene').innerHTML = onl(v, 'feast', null, 'xMidYMid slice'); };
setScene('happy');
$('#peekWin').innerHTML = onl('stare', 'peek');

// 漂浮泡泡
(() => {
  const b = $('#bubbles'); let h = '';
  for (let i = 0; i < 16; i++) {
    const s = rand(10, 52);
    h += `<span style="width:${s}px;height:${s}px;left:${rand(0, 100)}%;animation-duration:${rand(9, 20)}s;animation-delay:-${rand(0, 20)}s"></span>`;
  }
  b.innerHTML = h;
})();

// 数字滚动
const countIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  countIO.unobserve(e.target);
  const el = e.target, to = +el.dataset.to, dec = +(el.dataset.dec || 0), unit = el.dataset.unit || '';
  const t0 = performance.now();
  const tick = (now) => {
    const k = clamp((now - t0) / 1600), ease = 1 - Math.pow(1 - k, 3);
    el.textContent = (to * ease).toFixed(dec) + unit;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
$$('[data-to]').forEach((el) => countIO.observe(el));

// Toast
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// 购物车
let cart = 0;
$$('.add').forEach((b) => b.addEventListener('click', () => {
  cart++; if (curStage < 7) $('#cartCount').textContent = cart;
  toast(pick(['已加入购物车！奶龙很开心～ 💛', '加入成功！奶龙会尽快到你家～', '奶龙：谢谢你选我！我会好好陪着你的。']));
}));

// 声音按钮
const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  if (AE.on) { AE.stop(); soundBtn.textContent = '🎵 播放奶龙主题曲'; soundBtn.classList.remove('on'); }
  else { AE.start(); soundBtn.textContent = '⏸ 暂停主题曲'; soundBtn.classList.add('on'); }
});

/* =========================================================
   4. 噪点 & 眼睛跟随
   ========================================================= */
const noiseCv = $('#noise'), tvCv = $('#tvStatic');
let noiseOp = 0, tvOn = false;
function drawNoise(cv, w, h) {
  if (cv.width !== w) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}
setInterval(() => {
  if (noiseOp > 0.004) drawNoise(noiseCv, 180, 110);
  if (tvOn) drawNoise(tvCv, 160, 90);
}, 70);

let mx = innerWidth / 2, my = innerHeight / 2, lookEls = [], lookQueued = false;
function refreshLook() { lookEls = $$('.look'); queueLook(); }
function queueLook() { if (!lookQueued) { lookQueued = true; requestAnimationFrame(doLook); } }
function doLook() {
  lookQueued = false;
  for (const g of lookEls) {
    const r = g.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50 || !r.width) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
    const max = +g.dataset.r, k = Math.min(1, d / 260);
    g.setAttribute('transform', `translate(${f1(dx / d * max * k)} ${f1(dy / d * max * k)})`);
  }
}
addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; queueLook(); });
addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) { mx = t.clientX; my = t.clientY; queueLook(); } }, { passive: true });

/* =========================================================
   5. 文字故障（Zalgo）
   ========================================================= */
function zalgo(s, n = 3) {
  return [...s].map((ch) => {
    if (ch === ' ') return ch;
    let o = ch; const k = Math.floor(Math.random() * n) + 1;
    for (let i = 0; i < k; i++) o += String.fromCharCode(0x300 + Math.floor(Math.random() * 0x6f));
    return o;
  }).join('');
}
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
setInterval(() => {
  if (curStage < 3 || jumped) return;
  if (Math.random() > (H - 0.28) * 1.1) return;
  const c = $$('[data-glitch]').filter((el) => +el.dataset.glitch <= curStage && !el.dataset.busy && inView(el));
  if (!c.length) return;
  const el = pick(c);
  el.dataset.orig = el.dataset.orig || el.textContent;
  el.dataset.busy = '1';
  el.textContent = zalgo(el.dataset.orig, 2 + Math.floor(H * 6));
  setTimeout(() => { el.textContent = el.dataset.orig; delete el.dataset.busy; }, rand(90, 280));
}, 170);

/* =========================================================
   6. 剧场
   ========================================================= */
const screen = $('#screen'), scene = $('#scene'), smsg = $('#screenMsg'), dur = $('#dur');
let ep = 1, playT = null, clockT = null;
const EP_TITLES = ['', '奶龙的早餐', '奶龙去公园', '奶龙交了新朋友', '新朋友去哪了？', '奶龙不饿了', '██████'];
function resetScreen() {
  clearTimeout(playT); clearInterval(clockT);
  screen.classList.remove('playing', 'static'); tvOn = false;
  scene.className = 'scene';
  setScene('happy');
  smsg.textContent = ''; smsg.className = 'screen-msg';
  dur.textContent = '00:00 / 11:24';
}
function staticBurst(ms, cb) {
  screen.classList.add('static'); tvOn = true; AE.blip();
  setTimeout(() => { screen.classList.remove('static'); tvOn = false; if (cb) cb(); }, ms);
}
function play() {
  resetScreen(); screen.classList.add('playing');
  let s = 0;
  clockT = setInterval(() => { s++; dur.textContent = `00:${String(s % 60).padStart(2, '0')} / 11:24`; }, 1000);
  if (ep <= 3) {
    smsg.textContent = ['', '奶龙：早上好呀！今天吃什么呢～', '奶龙：公园里有好多小朋友！', '奶龙：你愿意做我的朋友吗？'][ep];
    playT = setTimeout(() => {
      setScene('hollow'); refreshLook(); AE.blip();
      smsg.textContent = '奶龙：你为什么不笑？';
      setTimeout(() => staticBurst(240, () => { setScene('happy'); smsg.textContent = ''; refreshLook(); }), 420);
    }, rand(3500, 6000));
  } else if (ep === 4) {
    scene.classList.add('night'); setScene('stare');
    smsg.textContent = '（本集没有对白）';
  } else if (ep === 5) {
    scene.classList.add('grey'); setScene('wrong');
    smsg.textContent = '奶龙不饿了。\n它吃得很饱，很饱。';
  } else {
    clearInterval(clockT); dur.textContent = '--:-- / --:--';
    screen.classList.add('static'); tvOn = true; AE.blip();
    smsg.classList.add('red'); smsg.textContent = '该集已被永久删除。\n请不要再搜索它。';
  }
  refreshLook();
}
$('#playBtn').addEventListener('click', play);
$$('#episodes li').forEach((li) => li.addEventListener('click', () => {
  $$('#episodes li').forEach((x) => x.classList.remove('active'));
  li.classList.add('active'); ep = +li.dataset.ep;
  $('#nowTitle').textContent = `第${ep}集 · ${EP_TITLES[ep]}`;
  play();
}));

/* =========================================================
   7. 捉迷藏
   ========================================================= */
const boxes = $$('.box'), gameMsg = $('#gameMsg');
const GAME_LINES = ['不在这里哦～', '也不在这里～', '嘻嘻，再找找', '它不在盒子里', '它从来都不在盒子里'];
let clicks = 0, gameOver = false;
function eyePair() {
  const r = rand(10, 16), m = f1(r * 0.55);
  return `<svg viewBox="0 0 100 60">
    <ellipse cx="30" cy="30" rx="${f1(r)}" ry="${f1(r)}" fill="#f2ecd6"/><g class="look" data-r="${m}"><circle cx="30" cy="30" r="4" fill="#000"/></g>
    <ellipse cx="70" cy="30" rx="${f1(r)}" ry="${f1(r)}" fill="#f2ecd6"/><g class="look" data-r="${m}"><circle cx="70" cy="30" r="4" fill="#000"/></g></svg>`;
}
function flashRed() { const f = $('#flash'); f.classList.add('red'); setTimeout(() => f.classList.remove('red'), 250); }
function revealGame(silent) {
  if (gameOver) return; gameOver = true;
  boxes.forEach((b, i) => setTimeout(() => {
    b.classList.add('open', 'eyes'); b.querySelector('.box-in').innerHTML = eyePair(); refreshLook();
  }, silent ? 0 : i * 90));
  gameMsg.textContent = '现在，轮到奶龙来找你了。'; gameMsg.classList.add('red');
  if (!silent) { flashRed(); AE.sting(); }
}
boxes.forEach((b) => b.addEventListener('click', () => {
  if (gameOver || b.classList.contains('open')) return;
  b.classList.add('open');
  b.querySelector('.box-in').textContent = GAME_LINES[clicks];
  clicks++;
  if (clicks >= GAME_LINES.length) setTimeout(() => revealGame(false), 900);
}));

/* =========================================================
   8. “我是奶龙”墙 & 文字显现
   ========================================================= */
(() => {
  let s = '';
  for (let i = 0; i < 700; i++) s += `<span>${i % 41 === 17 ? '救救我' : '我是奶龙'}</span>`;
  $('#wall').innerHTML = s;
})();
const wallSpans = $('#wall').children;
setInterval(() => {
  if (curStage < 6 || curStage > 8) return;
  for (let k = 0; k < 4; k++) {
    const s = wallSpans[(Math.random() * wallSpans.length) | 0];
    s.classList.add('lit'); setTimeout(() => s.classList.remove('lit'), rand(200, 1300));
  }
}, 260);
const revIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); }
}), { threshold: 0.6 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 0.15}s`; revIO.observe(el); });

/* =========================================================
   9. 联系表单
   ========================================================= */
const fName = $('#fName');
fName.addEventListener('input', () => {
  const v = fName.value.trim();
  $('#echo').textContent = v ? `它在学你的名字：${zalgo(v, 2)} ${zalgo(v, 3)} ${zalgo(v, 4)}` : '';
});
$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = fName.value.trim();
  if (v) { userName = v; localStorage.setItem('nlName', v); }
  $('#formResult').textContent = `谢谢你${userName ? '，' + userName : ''}。它已经出发了。\n请不要锁门，它不喜欢等。`;
  flashRed(); AE.sting();
  if (curStage === 8) helperSay(HELPER[8][1]());
});

/* =========================================================
   10. 小助手
   ========================================================= */
const HELPER = [
  ['happy', () => (seen ? '你回来了。我就知道你会回来的 💛' : '嗨～我是奶龙小助手！欢迎来到奶龙官网 🎉')],
  ['happy', () => '快来认识我吧！我最喜欢交朋友啦～'],
  ['happy', () => '看中哪个了吗？买回家，我就能一直陪着你啦 💛'],
  ['stare', () => '第六集……我们不看第六集。'],
  ['stare', () => '别看那些评论了。'],
  ['wrong', () => '天黑了。你家的门锁好了吗？'],
  ['wrong', () => '找 到 你 了'],
  ['hollow', () => '我饿了我饿了我饿了我饿了我饿了我饿了'],
  ['hollow', () => (userName ? `${userName}，你的手在发抖。` : '你的手在发抖。')],
  [null, () => ''],
];
const helper = $('#helper'), bubble = $('#helperBubble'), avatar = $('#helperAvatar');
let typeT, helperVariant = '';
function helperSay(text) {
  clearInterval(typeT); bubble.textContent = '';
  if (!text) { bubble.style.opacity = 0; return; }
  bubble.style.opacity = 1;
  const chars = [...text]; let i = 0;
  typeT = setInterval(() => { bubble.textContent += chars[i++]; if (i >= chars.length) clearInterval(typeT); }, curStage >= 7 ? 30 : 45);
}
avatar.addEventListener('click', () => {
  if (curStage >= 7) { helperSay('别碰我。'); return; }
  if (curStage >= 4) { helperSay(pick(['……', '继续往下看。', '你在怕什么？'])); return; }
  helperSay(pick(['我是奶龙！', '摸摸头～好舒服 💛', '肚子饿了，有好吃的吗？', '你今天也很可爱哦！']));
});

/* =========================================================
   11. 舞台控制（滚动 → 恐怖程度）
   ========================================================= */
const TITLES = [
  '奶龙官方网站 - 快乐每一天！', '认识奶龙 | 奶龙官方网站', '周边商城 | 奶龙官方网站', '奶龙剧场 | 奶龙官方网站',
  '粉丝留言 | 奶龙官网', '奶龙的一天', '找到你了', '我饿了', '你是一个人吗', '回头看看',
];
const NAV_NORMAL = ['首页', '认识奶龙', '周边商城', '动画剧场', '粉丝互动', '联系我们'];
const NAV_WEIRD = ['它', '在', '你', '身', '后', '。'];
const nav = $('#nav'), navLinks = $$('#navLinks a'), secs = $$('main > section');
let curStage = -1, H = 0, jumped = false;

function setFavicon(dark) {
  if (!dark) { $('#favicon').href = 'images/nailong-round.png'; return; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#000"/><circle cx="22" cy="28" r="5" fill="#f00"/><circle cx="42" cy="28" r="5" fill="#f00"/></svg>`;
  $('#favicon').href = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function setStage(i) {
  curStage = i;
  document.body.dataset.stage = i;
  document.body.classList.toggle('lvl-dim', i >= 3);
  document.body.classList.toggle('lvl-dark', i >= 5);
  document.body.classList.toggle('lvl-horror', i >= 7);
  document.title = TITLES[i];
  setFavicon(i >= 6);

  const [v, msg] = HELPER[i];
  if (v) {
    helper.classList.remove('gone');
    if (helperVariant !== v) { avatar.innerHTML = onl(v, 'nl', IMG.nl.head); helperVariant = v; }
    helperSay(msg());
  } else { helper.classList.add('gone'); helperSay(''); }

  nav.className = i >= 9 ? 'dark gone' : i >= 6 ? 'dark' : i >= 4 ? 'dim' : '';
  navLinks.forEach((a, k) => { a.textContent = i >= 6 ? NAV_WEIRD[k] : NAV_NORMAL[k]; });
  $('#cartCount').textContent = i >= 7 ? '∞' : cart;

  if (i >= 7) revealGame(true);
  if (i === 9) {
    $$('#endLines p').forEach((p) => { p.textContent = p.dataset.tpl.replace('{name}', userName ? userName + '，' : ''); });
  }
  refreshLook();
}

const endSec = $('#end'), endEyes = $('#endEyes'), endLines = $$('#endLines p');
function updateEnd() {
  if (jumped) return;
  const r = endSec.getBoundingClientRect();
  const ep = clamp(-r.top / (r.height - innerHeight));
  const vis = ep > 0.02 && ep < 0.8;
  endEyes.style.opacity = vis ? smooth(0.02, 0.12, ep) : 0;
  endEyes.style.transform = `translate(-50%, -50%) scale(${f1(lerp(0.25, 2.4, smooth(0.04, 0.8, ep)))})`;
  endLines.forEach((l) => { const a = +l.dataset.at; l.classList.toggle('show', ep >= a && ep < a + 0.11); });
  AE.silence(ep > 0.8);
  if (ep >= 0.985) jumpscare();
}

function jumpscare() {
  if (jumped) return;
  jumped = true;
  localStorage.setItem('nlSeen', '1');
  const js = $('#jumpscare');
  $('#jsFace').innerHTML = onl('final', 'nl', IMG.nl.face);
  js.classList.add('go');
  document.documentElement.style.overflow = 'hidden';
  AE.scream();
  if (navigator.vibrate) navigator.vibrate([400, 100, 400]);
  helper.classList.add('gone');
  setTimeout(() => {
    js.classList.remove('go');
    $('#endSticky').classList.add('done');
    document.documentElement.style.overflow = '';
    AE.stop();
    makeDrips();
  }, 1500);
}

function makeDrips() {
  const t = $('#dripText');
  for (let i = 0; i < 9; i++) {
    const d = document.createElement('span');
    d.className = 'drip';
    d.style.left = `${rand(4, 94)}%`;
    d.style.width = `${rand(4, 9)}px`;
    d.style.setProperty('--len', `${rand(40, 260)}px`);
    d.style.animationDelay = `${rand(0, 2.5)}s`;
    t.appendChild(d);
  }
}

$('#backBtn').addEventListener('click', () => {
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  location.reload();
});

// 偶发：闪烁 / 潜意识画面
function subliminal() {
  const s = $('#subliminal');
  s.innerHTML = onl(curStage >= 7 ? 'final' : 'hollow', 'nl', IMG.nl.head);
  const w = rand(140, 420);
  s.style.width = `${w}px`;
  s.style.left = `${rand(0, Math.max(0, innerWidth - w))}px`;
  s.style.top = `${rand(60, Math.max(80, innerHeight - w))}px`;
  s.style.display = 'block';
  AE.blip();
  setTimeout(() => { s.style.display = 'none'; }, 75);
}
function flicker() {
  const f = $('#flash');
  f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 80);
  if (curStage >= 7 && Math.random() < 0.5) setTimeout(() => { f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); }, 220);
}
(function weird() {
  setTimeout(() => {
    if (curStage >= 4 && curStage < 9 && !jumped) (Math.random() < 0.45 ? subliminal : flicker)();
    weird();
  }, rand(3500, 9000) * (1.4 - H));
})();

// 主循环
let scrollQueued = false;
function update() {
  scrollQueued = false;
  const mid = innerHeight * 0.5;
  let idx = 0, fr = 0;
  for (let i = 0; i < secs.length; i++) {
    const r = secs[i].getBoundingClientRect();
    if (r.top <= mid) { idx = i; fr = clamp((mid - r.top) / r.height); }
  }
  H = (idx + fr) / secs.length;
  noiseOp = smooth(0.3, 1, H) * 0.2;
  noiseCv.style.opacity = noiseOp;
  $('#vignette').style.opacity = smooth(0.22, 0.85, H);
  $('#scanlines').style.opacity = smooth(0.6, 0.9, H) * 0.5;
  if (idx !== curStage) setStage(idx);
  AE.update(H, idx);
  updateEnd();
  queueLook();
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(update); } }, { passive: true });
addEventListener('resize', update);
update();
