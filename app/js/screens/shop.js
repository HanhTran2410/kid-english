// Trò Bán hàng (SPEC-jobs.md mục 3): khách (bạn thú) vào cửa hàng, gọi món; bé kéo / chạm món trên kệ để đưa.
// Đủ món: Bông "Here you are!"; từ mức 2 khách trả xu, bé bỏ từng xu vào két (Bông đếm). 3 khách → sticker.
// SPEC-jobs2 SH1: mở đầu lượt bày kệ (món trong thùng → giỏ Fruit / Drinks / Other food); cuối mỗi ca bỏ đồ vào túi,
// đưa túi cho khách, chào "Have a nice day!".
// Trạng thái: stock ⇄ busy → enter → order ⇄ busy → (coins) → bag → give → thanks → leave → khách sau | done.
// Khung chung (nói, nhắc, khay, đồ bay, lượt, ra nền) ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { allFoods } from '../feed.js';
import { loadFeedImages, foodFace } from './feed.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { JOBS_BG_IMAGES } from '../jobs/backgrounds.js';
import { SELLER_SVG, loadPersonImage } from '../jobs/people.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, FOOD_LESSON_WORDS, planRound, coinsFor, remaining, orderDone, orderLine, wrongLine, enoughLine, countLine, coinLine,
  WELCOME_LINE, HERE_YOU_ARE_LINE, MONEY_LINE, TAP_COINS_LINE, THANKS_LINE,
  GROUP_INFO, foodGroup, groupsFor, groupLine, wrongBasketLine, stockLine, OPEN_LINE,
  BAG_LINE, giveBagLine, NICE_DAY_LINE, YOU_TOO_LINE, BYE_LINE,
  SMOOTHIE_COLOR, smoothieOrderLine, wrongFruitLine, needFruitLine, BLEND_ASK_LINE, MILK_LINE, hereSmoothieLine, YUMMY_LINE,
} from '../jobs/shop.js';

const JOB = 'shop';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const SAY_BACK_MS = 2000; // "Here you are!": chờ bé nói theo
const ACTIVE = ['order', 'coins', 'stock', 'bag', 'give', 'blend-add', 'blend-ready'];
const BLEND_MS = 1100; // máy xay chạy
/** Túi giấy (một túi, quai cầm): thay emoji 🛍️ (emoji là hai túi chồng nhau, khó nhìn). */
const BAG_SVG = `<svg viewBox="0 0 64 72" aria-hidden="true">
  <path d="M22 24 C22 8 42 8 42 24" fill="none" stroke="#e64980" stroke-width="4" stroke-linecap="round"/>
  <path d="M10 22 H54 L58 68 H6 Z" fill="#fff" stroke="#3d2c5e" stroke-width="3" stroke-linejoin="round"/>
  <path d="M10.4 26 H53.6 L54.3 34 H9.7 Z" fill="#ff8fab"/>
  <circle cx="32" cy="50" r="7" fill="#ffd43b" stroke="#3d2c5e" stroke-width="2"/>
</svg>`;
const NICE_DAY_PAUSE_MS = 1000; // "Have a nice day!" — ngắt — "You too!"

export function shopScreen(app, params = {}) {
  let progress = cleanJobState(app.settings.shopGame, { maxLevel: MAX_LEVEL });
  const level = progress.level;
  const foods = allFoods(app.settings.feedCustom);
  const foodById = (id) => foods.find((f) => f.id === id);
  let plan = null; // { shelf, cases }
  let caseIdx = 0;
  let got = {}; // mã món → số đã đưa
  let paid = 0; // số xu đã bỏ vào két
  let wrongs = 0;
  let nudges = 0;
  let state = 'start';
  let lastWrong = { key: '', at: 0 };
  let images = null;
  let wishShown = false;
  // Tiến độ đã ghi trong lượt này (mã ca:món): ra nền / 🧹 chơi lại không ghi lần hai.
  let recorded = new Set();
  let phase = 'order'; // bước đang lưu: stock | order | coins | bag | give
  let stocked = []; // món đã vào giỏ (bày kệ)
  let picked = null; // mức 2–3: món đã chạm, chờ chạm giỏ

  const cur = () => plan?.cases[caseIdx];
  const customer = () => PATIENT_BY_ID.get(cur()?.customer);
  const order = () => cur()?.order ?? [];
  const isSmoothie = () => cur()?.kind === 'smoothie';
  const fruitsLeft = () => remaining(order(), got).map((o) => foodById(o.id));
  const C = (line) => ({ who: 'customer', line });
  const B = (line) => ({ who: 'bong', line });

  const customerEl = h('div.sh-customer');
  const wish = h('div.sh-wish', { hidden: true, 'aria-label': 'Khách muốn mua' });
  const till = h('div.sh-till', { 'aria-label': 'Két tiền' }, h('span.sh-till-slot'), h('span.sh-till-count', { text: '' }));
  const coinsEl = h('div.sh-coins');
  const bagEl = h('button.sh-bag', { type: 'button', 'aria-label': 'Túi giấy', hidden: true, onclick: () => tapBag() }, h('span', { html: BAG_SVG }));
  // Đồ trên quầy: món bé đưa đặt lên quầy → chạm túi thì bay vào túi → đưa túi cho khách.
  const goodsEl = h('div.sh-goods', { 'aria-label': 'Đồ trên quầy' });
  // Thùng tiền đầu trái quầy, đồ bé đưa nằm đầu phải (gần khách).
  const counter = h('div.sh-counter', {}, till, coinsEl, bagEl, goodsEl);
  const basketsEl = h('div.sh-baskets', { hidden: true });
  // SPEC-jobs2 SH2: máy xay (cối có quả đã bỏ vào + nút) và ly sinh tố.
  const jar = h('div.sh-jar');
  const blendBtn = h('button.sh-blend-btn', { type: 'button', 'aria-label': 'Nút máy xay', onclick: () => pressBlend() }, h('span', { text: '▶' }));
  const blender = h('div.sh-blender', { hidden: true }, jar, h('div.sh-blender-base', {}, blendBtn));
  const cup = h('div.sh-cup', { hidden: true, 'aria-hidden': 'true' }, h('span.sh-cup-top'), h('span.sh-cup-bottom'));

  const kit = jobScreen(app, {
    job: JOB, background: { lessonId: JOBS_BG_IMAGES, word: JOB }, className: 'sh-play', stageClass: 'sh-stage', title: '🛒 Shop', helperLabel: 'Bông bán hàng', cap: 'shop',
    resetLabel: 'Bán lại', trayLabel: 'Kệ hàng',
    // SPEC-roles: Bông bán hàng đứng bên trái sau quầy, khách bên phải; ai nói người đó sáng.
    host: { svg: SELLER_SVG, label: 'seller' },
    roles: {
      of: (who) => (who === 'bong' ? kit.host : who === 'customer' ? customerEl : null),
      all: () => [kit.host, customerEl],
      dim: (el) => !(el === customerEl && state === 'give'), // lúc đưa túi bé phải chạm khách
    },
    // Câu của Bông do cô bán hàng bên trái nói (SPEC-roles mục 9): phụ đề hiện 👩.
    icon: (who) => (who === 'customer' ? customer()?.emoji ?? '' : '👩'),
    onTalk: (who) => customerEl.classList.toggle('talking', who === 'customer'),
    onReset: () => restart(),
    onHelper: () => repeatPrompt(),
    nudge: {
      ready: () => ACTIVE.includes(state) && nudges < MAX_NUDGES,
      key: () => stepKey(),
      fire: (rearm) => {
        nudges += 1;
        snap();
        if (state === 'coins') {
          for (const c of coinsEl.children) restartAnim(c, 'nudge');
          kit.talk([B(TAP_COINS_LINE)]).then(rearm);
          return;
        }
        if (state === 'stock') {
          const next = picked ?? plan.stock.find((id) => !stocked.includes(id));
          restartAnim(kit.trayItem(next), 'nudge');
          if (level >= 2) restartAnim(basketEl(foodGroup(foodById(next))), 'nudge');
          kit.talk([B(stockLine(level))]).then(rearm);
          return;
        }
        if (state === 'blend-add' || state === 'blend-ready') {
          if (state === 'blend-ready') restartAnim(blendBtn, 'nudge');
          else {
            showWish();
            restartAnim(kit.trayItem(remaining(order(), got)[0]?.id), 'nudge');
          }
          kit.talk(state === 'blend-ready' ? [B(BLEND_ASK_LINE)] : [C(smoothieOrderLine(order().map((o) => foodById(o.id))))]).then(rearm);
          return;
        }
        if (state === 'bag' || state === 'give') {
          restartAnim(state === 'bag' ? bagEl : customerEl, state === 'bag' ? 'nudge' : 'hop');
          kit.talk([B(state === 'bag' ? BAG_LINE : giveBagLine(customer().name))]).then(rearm);
          return;
        }
        showWish();
        restartAnim(kit.trayItem(remaining(order(), got)[0]?.id), 'nudge');
        kit.talk([C(orderLine(order(), foodById, got))]).then(rearm);
      },
    },
    tray: {
      face: (id) => foodFace(foodById(id), images, 'fd-face'),
      label: (id) => foodById(id)?.en ?? id,
      canGive: () => state === 'order' || state === 'stock' || state === 'blend-add',
      dropOk: (x, y) => (state === 'stock' ? Boolean(basketAt(x, y))
        : state === 'blend-add' ? inside(blender, x, y, 0.15) || inside(customerEl, x, y, 0.1)
          : inside(customerEl, x, y, 0.15) || inside(wish, x, y, 0.1) || inside(counter, x, y, 0)),
      give: (id, from) => (state === 'stock' ? stockGive(id, from) : state === 'blend-add' ? addFruit(id, from) : give(id, from)),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(customerEl, wish, counter, basketsEl, blender, cup);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${remaining(order(), got).length}:${paid}:${stocked.length}`;
  const basketEl = (g) => basketsEl.querySelector(`.sh-basket[data-group="${g}"]`);
  const basketAt = (x, y) => [...basketsEl.children].find((el) => inside(el, x, y, 0.08))?.dataset.group ?? null;

  function inside(el, x, y, grow) {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    const gx = r.width * grow;
    const gy = r.height * grow;
    return x >= r.left - gx && x <= r.right + gx && y >= r.top - gy && y <= r.bottom + gy;
  }
  function setState(s) {
    state = s;
    kit.setState(s, s === 'order' || s === 'stock' || s === 'blend-add');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, got, paid, wrongs, nudges, wishShown, recorded: [...recorded], phase, stocked });
  const saveProgress = () => app.setSetting('shopGame', progress).catch(() => {});

  // ---------- Vẽ ----------
  function renderCustomer() {
    const p = customer();
    customerEl.innerHTML = patientSvg(p.id, { mood: 'happy', title: p.name });
    customerEl.dataset.customer = p.id;
    count.textContent = `${caseIdx + 1}/${plan.cases.length}`;
  }
  /** Bong bóng món khách muốn: mức 1 luôn hiện; mức 2–3 hiện sau lần nhầm đầu / khi được nhắc. Món đủ thì có ✓. */
  function renderWish() {
    wish.hidden = !(level <= 1 || wishShown) || !order().length;
    wish.replaceChildren(...order().map((o) => {
      const food = foodById(o.id);
      const n = got[o.id] ?? 0;
      return h('span.sh-wish-item', { dataset: { food: o.id, done: String(n >= o.count) } },
        foodFace(food, images, 'sh-wish-face'),
        o.count > 1 ? h('span.sh-wish-count', { text: `${n}/${o.count}` }) : null,
        n >= o.count ? h('span.sh-wish-tick', { text: '✓' }) : null);
    }));
  }
  function showWish() {
    wishShown = true;
    renderWish();
  }
  function renderCoins() {
    const total = coinsFor(order(), level);
    coinsEl.replaceChildren(...Array.from({ length: state === 'coins' ? total - paid : 0 }, (_, i) => h('button.sh-coin', {
      type: 'button', 'aria-label': 'Đồng xu', dataset: { i: String(i) },
      onclick: (e) => payCoin(e.currentTarget),
    }, h('span', { text: '★', 'aria-hidden': 'true' }))));
    till.querySelector('.sh-till-count').textContent = paid ? String(paid) : '';
  }

  // ---------- Khách, món ----------
  async function startCase(resume = null) {
    const e = kit.epoch;
    got = resume?.got ?? {};
    paid = resume?.paid ?? 0;
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    wishShown = resume?.wishShown ?? false;
    phase = resume?.phase ?? 'order';
    basketsEl.hidden = true;
    customerEl.hidden = false;
    counter.hidden = false;
    bagEl.hidden = true;
    blender.hidden = !isSmoothie();
    cup.hidden = true;
    setState('enter');
    renderCustomer();
    renderWish();
    renderGoods();
    renderJar();
    kit.renderTray(isSmoothie() ? cur().tray : plan.shelf);
    renderCoins();
    snap();
    if (resume) {
      if (resume.phase === 'bag') startBag(true);
      else if (resume.phase === 'give') startGive(true);
      else if (resume.phase === 'blend') beginOrder(true);
      else if (resume.phase === 'coins' || orderDone(order(), got)) startCoins(true);
      else beginOrder(true);
      return;
    }
    customerEl.classList.remove('leave');
    restartAnim(customerEl, 'enter');
    play('ding');
    await wait(ENTER_MS);
    if (e !== kit.epoch) return;
    await talk([B(WELCOME_LINE)]);
    if (e !== kit.epoch) return;
    beginOrder();
  }

  async function beginOrder() {
    const e = kit.epoch;
    if (isSmoothie()) {
      beginBlend();
      return;
    }
    setState('order');
    phase = 'order';
    snap();
    await talk([C(orderLine(order(), foodById, got))]);
    if (e === kit.epoch) kit.armNudge();
  }

  /** Bé đưa một món (kéo vào khách / chạm trên kệ). Món cần + chưa đủ: nhận NGAY (một lần), rồi mới bay + nói. */
  async function give(id, from) {
    if (state !== 'order') return;
    const e = kit.epoch;
    const food = foodById(id);
    const need = remaining(order(), got).find((o) => o.id === id);
    if (!need) {
      if (!countWrong(`i:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      showWish();
      // Món có tên trong câu gọi: món cần nhún ngay sau lần nhầm đầu.
      const want = remaining(order(), got)[0]?.id;
      kit.setHint(want);
      restartAnim(kit.trayItem(want), 'nudge');
      const inOrder = order().some((o) => o.id === id);
      const k = stepKey();
      talk([C(inOrder ? enoughLine(order(), foodById, got) : wrongLine(food, order(), foodById, got))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    got = { ...got, [id]: (got[id] ?? 0) + 1 };
    // "Đã gặp" một lần cho mỗi món khi món đó đủ số (two apples: ghi khi đưa quả thứ hai), không ghi lại khi chơi lại.
    const key = `${caseIdx}:${id}`;
    if (got[id] >= need.count && FOOD_LESSON_WORDS.has(food.en) && !recorded.has(key)) {
      recorded.add(key);
      markPracticed(app, food.en, food.emoji);
    }
    const done = orderDone(order(), got);
    wrongs = 0;
    nudges = 0;
    snap();
    // Món bay ra đặt trên quầy (không đưa thẳng cho khách): đủ món thì bỏ vào túi rồi mới đưa.
    const ghost = await kit.flyTo(foodFace(food, images, 'fd-face'), from, goodsSpot());
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    renderGoods();
    restartAnim(goodsEl.lastElementChild, 'pop');
    renderWish();
    if (need.count > 1) await talk([B(countLine(got[id]))]);
    if (e !== kit.epoch) return;
    if (!done) {
      beginOrder();
      return;
    }
    await talk([B(HERE_YOU_ARE_LINE)]);
    if (e !== kit.epoch) return;
    await wait(SAY_BACK_MS);
    if (e !== kit.epoch) return;
    startCoins();
  }

  function countWrong(key) {
    const now = Date.now();
    if (key === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return false;
    lastWrong = { key, at: now };
    wrongs += 1;
    snap();
    kit.clearNudge();
    play('boing');
    restartAnim(customerEl, 'shake');
    return true;
  }

  /** Trả tiền (mức 2+): khách đặt xu lên quầy, bé bỏ từng xu vào két. Mức 1: cảm ơn luôn. */
  async function startCoins(resume = false) {
    const e = kit.epoch;
    const total = coinsFor(order(), level);
    if (paid >= total) {
      startBag();
      return;
    }
    setState('coins');
    phase = 'coins';
    renderCoins();
    snap();
    await talk(resume ? [B(TAP_COINS_LINE)] : [C(MONEY_LINE), B(TAP_COINS_LINE)]);
    if (e === kit.epoch) kit.armNudge();
  }

  async function payCoin(el) {
    if (state !== 'coins' || !el.isConnected) return;
    const e = kit.epoch;
    const total = coinsFor(order(), level);
    paid += 1;
    nudges = 0;
    snap();
    kit.clearNudge();
    const from = center(el.getBoundingClientRect());
    el.remove();
    const ghost = await kit.flyTo(h('span.sh-coin.sh-coin-fly', {}, h('span', { text: '★' })), from, center(till.getBoundingClientRect()));
    kit.removeGhost(ghost);
    play('ding');
    till.querySelector('.sh-till-count').textContent = String(paid);
    restartAnim(till, 'hop');
    const n = paid;
    const k = stepKey();
    await talk([B(coinLine(n))]);
    if (e !== kit.epoch) return;
    if (paid >= total && state === 'coins') {
      setState('busy');
      startBag();
    } else if (k === stepKey()) kit.armNudge();
  }

  /** Đồ bé đã đưa nằm trên quầy (tới lúc bỏ vào túi). Ca sinh tố: ly nằm cạnh máy xay, không ở đây. */
  function renderGoods() {
    const show = !isSmoothie() && ['order', 'coins', 'bag'].includes(phase);
    goodsEl.replaceChildren(...(show ? order().flatMap((o) => Array.from({ length: got[o.id] ?? 0 },
      () => h('span.sh-good', { dataset: { food: o.id } }, foodFace(foodById(o.id), images, 'sh-good-face')))) : []));
  }
  /** Chỗ món bay tới trên quầy: sau món cuối đang nằm (chưa có thì giữa khay). Khay ở đầu phải quầy nên thêm món
   *  thì cả hàng dịch sang trái nửa ô: món mới nằm sau món cuối nửa ô. */
  function goodsSpot() {
    const r = (goodsEl.lastElementChild ?? goodsEl).getBoundingClientRect();
    return goodsEl.lastElementChild ? { x: r.right - r.width / 2 + (r.width + 6) / 2, y: r.top + r.height / 2 } : center(r);
  }

  // ---------- Quầy sinh tố (SPEC-jobs2 mục 2.3) ----------
  function renderJar() {
    jar.replaceChildren(...order().filter((o) => (got[o.id] ?? 0) > 0).map((o) => foodFace(foodById(o.id), images, 'sh-jar-face')));
    blender.dataset.ready = String(isSmoothie() && orderDone(order(), got));
  }
  function renderCup() {
    const ids = order().map((o) => o.id);
    cup.style.setProperty('--c1', SMOOTHIE_COLOR[ids[0]] ?? '#fff');
    cup.style.setProperty('--c2', SMOOTHIE_COLOR[ids[1] ?? ids[0]] ?? '#fff');
    cup.dataset.fruits = ids.join(' '); // cho test
  }
  async function beginBlend() {
    const e = kit.epoch;
    const ready = orderDone(order(), got);
    setState(ready ? 'blend-ready' : 'blend-add');
    phase = 'blend';
    renderJar();
    snap();
    await talk(ready ? [B(BLEND_ASK_LINE)] : [C(smoothieOrderLine(order().map((o) => foodById(o.id))))]);
    if (e === kit.epoch && state.startsWith('blend')) kit.armNudge();
  }
  /** Bé kéo / chạm quả vào máy xay: quả của đơn còn thiếu → vào cối; quả sai → khách "That's an apple. I want banana!" (nhầm). */
  async function addFruit(id, from) {
    if (state !== 'blend-add') return;
    const e = kit.epoch;
    const food = foodById(id);
    const need = remaining(order(), got).find((o) => o.id === id);
    if (!need) {
      if (!countWrong(`f:${id}`)) return;
      restartAnim(kit.trayItem(id), 'shake');
      showWish();
      const want = remaining(order(), got)[0]?.id;
      kit.setHint(want);
      restartAnim(kit.trayItem(want), 'nudge');
      const k = stepKey();
      talk([C(wrongFruitLine(food, fruitsLeft()))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    setState('busy');
    kit.clearNudge();
    kit.setHint(null);
    got = { ...got, [id]: 1 };
    const key = `${caseIdx}:${id}`;
    if (wrongs === 0 && FOOD_LESSON_WORDS.has(food.en) && !recorded.has(key)) {
      recorded.add(key);
      markPracticed(app, food.en, food.emoji);
    }
    wrongs = 0;
    nudges = 0;
    snap();
    const ghost = await kit.flyTo(foodFace(food, images, 'fd-face'), from, center(jar.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    renderJar();
    renderWish();
    restartAnim(blender, 'hop');
    if (orderDone(order(), got)) beginBlend();
    else {
      setState('blend-add');
      snap();
      kit.armNudge();
    }
  }
  /** Nút máy xay: chưa đủ quả → máy rung + nhắc quả còn thiếu (không nhầm); đủ → sữa, xay, ly sinh tố. */
  async function pressBlend() {
    if (state === 'blend-add') {
      restartAnim(blender, 'shake');
      const k = stepKey();
      talk([B(needFruitLine(fruitsLeft()))]).then(() => k === stepKey() && kit.armNudge());
      return;
    }
    if (state !== 'blend-ready') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    phase = 'coins'; // ra nền sau lúc này: sang bước trả xu (không xay lại)
    snap();
    await talk([B(MILK_LINE)]);
    if (e !== kit.epoch) return;
    play('rumble');
    blender.classList.add('blending');
    await wait(BLEND_MS);
    blender.classList.remove('blending');
    if (e !== kit.epoch) return;
    got = Object.fromEntries(order().map((o) => [o.id, 1]));
    jar.replaceChildren();
    blender.dataset.ready = 'false';
    renderCup();
    cup.hidden = false;
    restartAnim(cup, 'pop');
    play('ding');
    await talk([B(hereSmoothieLine(order().map((o) => foodById(o.id))))]);
    if (e !== kit.epoch) return;
    restartAnim(customerEl, 'hop');
    await talk([C(YUMMY_LINE)]);
    if (e !== kit.epoch) return;
    startCoins();
  }

  // ---------- Đưa túi, chào khách (SPEC-jobs2 mục 2.4) ----------
  async function startBag(resume = false) {
    const e = kit.epoch;
    setState('bag');
    phase = 'bag';
    renderCoins();
    wish.hidden = true; // món đã đủ: không còn bong bóng món muốn mua
    bagEl.hidden = false;
    bagEl.classList.remove('full', 'gone');
    snap();
    if (!resume) restartAnim(bagEl, 'enter');
    await talk([B(BAG_LINE)]);
    if (e === kit.epoch && state === 'bag') kit.armNudge();
  }
  /** Chạm túi: món bay vào túi (lúc đưa túi: khách nhún — không nhầm). */
  async function tapBag() {
    if (state === 'give') {
      restartAnim(customerEl, 'hop');
      return;
    }
    if (state !== 'bag') return;
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    phase = 'give';
    nudges = 0;
    snap();
    const to = center(bagEl.getBoundingClientRect());
    // Đồ trên quầy (ly sinh tố: từ chỗ ly) lần lượt bay vào túi.
    const sources = isSmoothie()
      ? [{ face: h('span.sh-cup-fly', { text: '🥤' }), from: center((cup.hidden ? blender : cup).getBoundingClientRect()) }]
      : [...goodsEl.children].map((el) => ({ face: el.cloneNode(true), from: center(el.getBoundingClientRect()) }));
    cup.hidden = true;
    goodsEl.replaceChildren();
    await Promise.all(sources.map(async ({ face, from }, i) => {
      await wait(i * 150);
      const ghost = await kit.flyTo(face, from, to);
      kit.removeGhost(ghost);
    }));
    if (e !== kit.epoch) return;
    play('pop');
    startGive();
  }
  async function startGive(resume = false) {
    const e = kit.epoch;
    setState('give');
    phase = 'give';
    wish.hidden = true;
    bagEl.hidden = false;
    bagEl.classList.add('full');
    renderCoins();
    if (resume) snap();
    restartAnim(bagEl, 'hop');
    await talk([B(giveBagLine(customer().name))]);
    if (e === kit.epoch && state === 'give') kit.armNudge();
  }
  async function giveBag() {
    const e = kit.epoch;
    setState('busy');
    kit.clearNudge();
    const from = center(bagEl.getBoundingClientRect());
    bagEl.classList.add('gone');
    const ghost = await kit.flyTo(h('span.sh-bag-fly', { html: BAG_SVG }), from, center(customerEl.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    bagEl.hidden = true;
    restartAnim(customerEl, 'hop');
    thanks();
  }

  async function thanks() {
    const e = kit.epoch;
    setState('thanks');
    // Khách xong: lưu để chơi tiếp là khách sau.
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, got: {}, paid: 0, wrongs: 0, nudges: 0, wishShown: false, recorded: [...recorded], phase: 'order', stocked });
    play('sparkle');
    await talk([C(THANKS_LINE), B(NICE_DAY_LINE)]);
    if (e !== kit.epoch) return;
    await wait(NICE_DAY_PAUSE_MS);
    if (e !== kit.epoch) return;
    await talk([C(YOU_TOO_LINE), C(BYE_LINE)]);
    if (e !== kit.epoch) return;
    setState('leave');
    restartAnim(customerEl, 'leave');
    await wait(LEAVE_MS);
    if (e !== kit.epoch) return;
    caseIdx += 1;
    if (caseIdx >= plan.cases.length) finishRound();
    else startCase();
  }

  function finishRound() {
    if (state === 'done') return;
    setState('done');
    kit.finishRound(() => {
      clearSnap(JOB);
      progress = afterJobRound(progress, { maxLevel: MAX_LEVEL });
      saveProgress();
    });
  }

  function restart() {
    if (state === 'done' || !plan) return;
    kit.cancelAll();
    if (phase === 'stock') {
      stocked = [];
      startStock();
      return;
    }
    caseIdx = 0;
    startCase();
  }

  // ---------- Bày kệ (SPEC-jobs2 mục 2.2, mở đầu lượt) ----------
  function renderBaskets() {
    basketsEl.replaceChildren(...groupsFor(level).map((g) => h('button.sh-basket', {
      type: 'button', 'aria-label': `${GROUP_INFO[g].en} basket`, dataset: { group: g }, onclick: () => tapBasket(g),
    },
    h('span.sh-basket-label', {}, h('span.sh-basket-icon', { text: GROUP_INFO[g].emoji }), h('span', { text: GROUP_INFO[g].en })),
    h('span.sh-basket-in', {}, ...stocked.filter((id) => foodGroup(foodById(id)) === g).map((id) => foodFace(foodById(id), images, 'sh-basket-face'))))));
  }
  function renderCrate() {
    kit.renderTray(plan.stock.filter((id) => !stocked.includes(id)));
    for (const el of kit.trayEl.children) {
      el.dataset.group = foodGroup(foodById(el.dataset.item)) ?? ''; // cho test
      el.classList.toggle('picked', el.dataset.item === picked);
    }
  }
  async function startStock(resume = null) {
    const e = kit.epoch;
    stocked = (resume?.stocked ?? []).filter((id) => plan.stock.includes(id));
    wrongs = resume?.wrongs ?? 0;
    nudges = resume?.nudges ?? 0;
    picked = null;
    phase = 'stock';
    customerEl.hidden = true;
    wish.hidden = true;
    counter.hidden = true;
    basketsEl.hidden = false;
    count.textContent = '';
    setState('stock');
    renderBaskets();
    renderCrate();
    snap();
    if (!resume) restartAnim(basketsEl, 'enter');
    await talk([B(stockLine(level))]);
    if (e === kit.epoch && state === 'stock') kit.armNudge();
  }
  /** Món trong thùng: kéo thả vào giỏ, hoặc chạm (mức 1 tự bay vào giỏ đúng; mức 2–3 chọn món rồi chạm giỏ). */
  function stockGive(id, at) {
    if (state !== 'stock') return;
    const g = basketAt(at.x, at.y);
    if (level <= 1) {
      placeIn(id, foodGroup(foodById(id)), at);
      return;
    }
    if (g) {
      placeIn(id, g, at);
      return;
    }
    picked = picked === id ? null : id;
    renderCrate();
  }
  function tapBasket(g) {
    if (state !== 'stock') return;
    if (!picked) {
      // Chưa chọn món: món cần xếp nhún (không nhầm).
      restartAnim(kit.trayItem(plan.stock.find((id) => !stocked.includes(id))), 'nudge');
      return;
    }
    const item = kit.trayItem(picked);
    if (!item) return;
    placeIn(picked, g, center(item.getBoundingClientRect()));
  }
  async function placeIn(id, g, from) {
    const e = kit.epoch;
    const food = foodById(id);
    const want = foodGroup(food);
    if (g !== want) {
      const now = Date.now();
      if (`b:${id}:${g}` === lastWrong.key && now - lastWrong.at < WRONG_LOCK_MS) return;
      lastWrong = { key: `b:${id}:${g}`, at: now };
      wrongs += 1;
      snap();
      kit.clearNudge();
      play('boing');
      restartAnim(basketEl(g), 'shake');
      if (wrongs >= 2) restartAnim(basketEl(want), 'nudge');
      const k = stepKey();
      await talk([B(wrongBasketLine(food))]);
      if (k === stepKey()) kit.armNudge();
      return;
    }
    // Đúng: nhận NGAY (một lần) rồi mới bay + nói. "Đã gặp" món (mức 2–3, đúng ngay lần đầu, như bán hàng).
    setState('busy');
    kit.clearNudge();
    if (level >= 2 && wrongs === 0 && FOOD_LESSON_WORDS.has(food.en) && !recorded.has(`stock:${id}`)) {
      recorded.add(`stock:${id}`);
      markPracticed(app, food.en, food.emoji);
    }
    stocked = [...stocked, id];
    picked = null;
    wrongs = 0;
    nudges = 0;
    const last = plan.stock.every((x) => stocked.includes(x));
    snap();
    renderCrate();
    const ghost = await kit.flyTo(foodFace(food, images, 'fd-face'), from, center(basketEl(g).getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    renderBaskets();
    restartAnim(basketEl(g), 'hop');
    if (!last) setState('stock'); // món sau nhận ngay trong lúc Bông nói
    const k = stepKey();
    await talk([B(groupLine(food))]);
    if (e !== kit.epoch) return;
    if (!last) {
      if (k === stepKey()) kit.armNudge();
      return;
    }
    play('sparkle');
    await talk([B(OPEN_LINE)]);
    if (e !== kit.epoch) return;
    caseIdx = 0;
    startCase();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    const line = {
      coins: B(TAP_COINS_LINE), stock: B(stockLine(level)), bag: B(BAG_LINE), give: B(giveBagLine(customer()?.name ?? '')),
      'blend-ready': B(BLEND_ASK_LINE), 'blend-add': C(smoothieOrderLine(order().map((o) => foodById(o.id)))),
    }[state] ?? C(orderLine(order(), foodById, got));
    talk([line]).then(() => k === stepKey() && kit.armNudge());
  }

  // Chạm khách lúc đang gọi món: khách nói lại món muốn mua. Lúc đưa túi: túi bay tới khách; lúc bỏ túi: túi nhún.
  customerEl.addEventListener('pointerdown', () => {
    if (kit.pressing) return;
    if (state === 'give') {
      giveBag();
      return;
    }
    if (state === 'bag') {
      restartAnim(bagEl, 'nudge');
      return;
    }
    if (state === 'blend-add') {
      repeatPrompt();
      return;
    }
    if (state !== 'order') return;
    const k = stepKey();
    talk([C(orderLine(order(), foodById, got))]).then(() => k === stepKey() && kit.armNudge());
  }, { signal: kit.signal });

  loadFeedImages(app).catch(() => null).then((loaded) => {
    images = loaded;
    if (kit.signal.aborted) return;
    const s = takeSnap(JOB, { level, continueDirectly: params.continueDirectly });
    if (s) {
      plan = s.plan;
      caseIdx = s.caseIdx;
      recorded = new Set(s.recorded ?? []);
      stocked = s.stocked ?? [];
      if (s.phase === 'stock' && plan.stock?.length) {
        startStock(s);
        return;
      }
      if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        renderCustomer();
        finishRound();
      } else startCase(s);
      return;
    }
    plan = planRound(level, { foods });
    caseIdx = 0;
    startStock();
  });

  // Ảnh cô bán hàng bố mẹ thêm (nếu có) thay hình vẽ sẵn.
  loadPersonImage(app, 'shop').then((url) => {
    if (!url) return;
    if (kit.signal.aborted) URL.revokeObjectURL(url);
    else {
      kit.setHostImage(url);
      kit.onCleanup(() => URL.revokeObjectURL(url));
    }
  });
  kit.onCleanup(() => images?.revoke());
  return kit.cleanup;
}
