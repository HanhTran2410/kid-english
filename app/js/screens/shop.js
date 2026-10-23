// Trò Bán hàng (SPEC-jobs.md mục 3): khách (bạn thú) vào cửa hàng, gọi món; bé kéo / chạm món trên kệ để đưa.
// Đủ món: Bông "Here you are!"; từ mức 2 khách trả xu, bé bỏ từng xu vào két (Bông đếm). 3 khách → sticker.
// Trạng thái: enter → order ⇄ busy → (coins) → thanks → leave → khách sau | done.
// Khung chung (nói, nhắc, khay, đồ bay, lượt, ra nền) ở jobs/kit.js.

import { h } from '../ui.js';
import { play } from '../speech/sfx.js';
import { markPracticed } from '../player/track.js';
import { patientSvg } from '../patients.js';
import { PATIENT_BY_ID } from '../doctor.js';
import { allFoods } from '../feed.js';
import { loadFeedImages, foodFace } from './feed.js';
import { cleanJobState, afterJobRound } from '../jobs/levels.js';
import { jobScreen, saveSnap, takeSnap, clearSnap, restartAnim, center, wait, WRONG_LOCK_MS, MAX_NUDGES } from '../jobs/kit.js';
import {
  MAX_LEVEL, FOOD_LESSON_WORDS, planRound, coinsFor, remaining, orderDone, orderLine, wrongLine, enoughLine, countLine, coinLine,
  WELCOME_LINE, HERE_YOU_ARE_LINE, MONEY_LINE, TAP_COINS_LINE, THANKS_LINE,
} from '../jobs/shop.js';

const JOB = 'shop';
const ENTER_MS = 650;
const LEAVE_MS = 600;
const SAY_BACK_MS = 2000; // "Here you are!": chờ bé nói theo
const ACTIVE = ['order', 'coins'];

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

  const cur = () => plan?.cases[caseIdx];
  const customer = () => PATIENT_BY_ID.get(cur()?.customer);
  const order = () => cur()?.order ?? [];
  const C = (line) => ({ who: 'customer', line });
  const B = (line) => ({ who: 'bong', line });

  const customerEl = h('div.sh-customer');
  const wish = h('div.sh-wish', { hidden: true, 'aria-label': 'Khách muốn mua' });
  const till = h('div.sh-till', { 'aria-label': 'Két tiền' }, h('span.sh-till-slot'), h('span.sh-till-count', { text: '' }));
  const coinsEl = h('div.sh-coins');
  const counter = h('div.sh-counter', {}, coinsEl, till);

  const kit = jobScreen(app, {
    job: JOB, className: 'sh-play', stageClass: 'sh-stage', title: '🛒 Shop', helperLabel: 'Bông bán hàng', cap: 'shop',
    resetLabel: 'Bán lại', trayLabel: 'Kệ hàng',
    icon: (who) => (who === 'customer' ? customer()?.emoji ?? '' : '🐰'),
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
        showWish();
        restartAnim(kit.trayItem(remaining(order(), got)[0]?.id), 'nudge');
        kit.talk([C(orderLine(order(), foodById, got))]).then(rearm);
      },
    },
    tray: {
      face: (id) => foodFace(foodById(id), images, 'fd-face'),
      label: (id) => foodById(id)?.en ?? id,
      canGive: () => state === 'order',
      dropOk: (x, y) => inside(customerEl, x, y, 0.15) || inside(wish, x, y, 0.1),
      give: (id, from) => give(id, from),
    },
  });
  const { stage, count, talk } = kit;
  stage.append(customerEl, wish, counter);
  const stepKey = () => `${kit.epoch}:${caseIdx}:${state}:${remaining(order(), got).length}:${paid}`;

  function inside(el, x, y, grow) {
    if (!el || el.hidden) return false;
    const r = el.getBoundingClientRect();
    const gx = r.width * grow;
    const gy = r.height * grow;
    return x >= r.left - gx && x <= r.right + gx && y >= r.top - gy && y <= r.bottom + gy;
  }
  function setState(s) {
    state = s;
    kit.setState(s, s === 'order');
  }
  const snap = () => saveSnap(JOB, { level, plan, caseIdx, got, paid, wrongs, nudges, wishShown, recorded: [...recorded], phase: state === 'coins' ? 'coins' : 'order' });
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
    setState('enter');
    renderCustomer();
    renderWish();
    kit.renderTray(plan.shelf);
    renderCoins();
    snap();
    if (resume) {
      if (resume.phase === 'coins' || orderDone(order(), got)) startCoins(true);
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
    setState('order');
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
    const ghost = await kit.flyTo(foodFace(food, images, 'fd-face'), from, center(customerEl.getBoundingClientRect()));
    kit.removeGhost(ghost);
    if (e !== kit.epoch) return;
    play('pop');
    restartAnim(customerEl, 'hop');
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
      thanks();
      return;
    }
    setState('coins');
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
      thanks();
    } else if (k === stepKey()) kit.armNudge();
  }

  async function thanks() {
    const e = kit.epoch;
    setState('thanks');
    // Khách xong: lưu để chơi tiếp là khách sau.
    saveSnap(JOB, { level, plan, caseIdx: caseIdx + 1, got: {}, paid: 0, wrongs: 0, nudges: 0, wishShown: false, recorded: [...recorded], phase: 'order' });
    play('sparkle');
    await talk([C(THANKS_LINE)]);
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
    caseIdx = 0;
    startCase();
  }

  function repeatPrompt() {
    if (!ACTIVE.includes(state)) return;
    const k = stepKey();
    talk([state === 'coins' ? B(TAP_COINS_LINE) : C(orderLine(order(), foodById, got))]).then(() => k === stepKey() && kit.armNudge());
  }

  // Chạm khách lúc đang gọi món: khách nói lại món muốn mua.
  customerEl.addEventListener('pointerdown', () => {
    if (kit.pressing || state !== 'order') return;
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
      if (caseIdx >= plan.cases.length) {
        caseIdx = plan.cases.length - 1;
        renderCustomer();
        finishRound();
      } else startCase(s);
      return;
    }
    plan = planRound(level, { foods });
    caseIdx = 0;
    startCase();
  });

  kit.onCleanup(() => images?.revoke());
  return kit.cleanup;
}
