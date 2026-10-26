// Bác sĩ nhí (SPEC-doctor.md): dữ liệu ca / bước, vùng chạm, khay, chọn ca, câu nói, mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CASES, CASE_BY_ID, TOOLS, TREATS, ITEM_BY_ID, REGIONS, SPOTS, PATIENTS, TRAY_SIZE, PLAYABLE_LEVEL,
  regionAt, stepsFor, casesFor, trayFor, pickCases, stepPrompt, wrongItemLine, doneLine, yesTouchLine, wrongTouchLine, askLine,
  cleanDoctorState, afterDoctorRound, afterHealed,
} from '../../app/js/doctor.js';

/** rng cố định để test lặp lại được. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('dữ liệu: mỗi ca có ≥ 1 bước ở mọi mức mà ca xuất hiện; vùng / đồ có thật, đúng loại; bước khám luôn từ mức 2', () => {
  for (const c of CASES) {
    for (let level = c.level; level <= 3; level++) assert.ok(stepsFor(c, level).length >= 1, `${c.id} mức ${level}`);
    for (const s of c.steps) {
      assert.ok(['touch', 'check', 'treat'].includes(s.type), c.id);
      if (s.type === 'touch') assert.ok(REGIONS[s.target], `${c.id}: ${s.target}`);
      else assert.equal(ITEM_BY_ID.get(s.item)?.kind, s.type, `${c.id}: ${s.item}`);
      if (s.type === 'check') assert.ok((s.from ?? 1) >= 2, `${c.id}: bước khám phải từ mức 2`);
    }
    assert.equal(c.say.length, 2);
    assert.equal(c.remind.length, 2);
  }
  assert.equal(CASES.length, 11);
  assert.deepEqual(casesFor(1).map((c) => c.id), ['cut-hand', 'cut-foot', 'tummy', 'runny-nose', 'tooth']);
  assert.equal(casesFor(2).length, 9);
  assert.equal(casesFor(3).length, 11);
  for (const item of [...TOOLS, ...TREATS]) {
    assert.ok(item.wrong && item.notThis && (item.ask || item.the), item.id);
    // Ảnh lưới + dùng lại ảnh có sẵn (mục 10).
    assert.ok(item.draw && !/'/.test(item.draw), item.id);
    assert.ok(item.reuse?.length && item.reuse.every((w) => w === w.toLowerCase().trim()), item.id);
  }
});

test('bước theo mức: tummy / tooth mức 1 không có khám, mức 2 có (DOC-01, DOC-02); ear-bug kết thúc bằng khám (DOC-03); sleepy, cough không có chạm (DOC-04)', () => {
  const types = (id, level) => stepsFor(CASE_BY_ID.get(id), level).map((s) => s.type);
  assert.deepEqual(types('tummy', 1), ['touch', 'treat']);
  assert.deepEqual(types('tooth', 1), ['touch', 'treat']);
  assert.deepEqual(types('tummy', 2), ['touch', 'check', 'treat']);
  assert.deepEqual(types('tooth', 2), ['touch', 'check', 'treat']);
  assert.deepEqual(types('ear-bug', 2), ['touch', 'check']);
  assert.deepEqual(types('sleepy', 2), ['treat']);
  assert.deepEqual(types('cough', 3), ['check', 'treat']);
  for (const c of casesFor(1)) assert.ok(!types(c.id, 1).includes('check'), c.id);
});

test('vùng chạm: mắt / mũi / miệng không trả về đầu; tay đè bụng là tay; hai bên tai đều là tai; ngoài người là null', () => {
  // Tâm mỗi vùng nhỏ (tầng 1) trả về đúng vùng đó. Tâm vùng đầu / bụng nằm trên mũi / không chồng — kiểm riêng bên dưới.
  for (const s of SPOTS.filter((x) => x.tier === 1)) assert.equal(regionAt(s.x, s.y), s.region, `${s.region} (${s.x}, ${s.y})`);
  assert.equal(regionAt(92, 88), 'eye');
  assert.equal(regionAt(120, 112), 'nose');
  assert.equal(regionAt(120, 140), 'mouth');
  assert.equal(regionAt(62, 38), 'ear');
  assert.equal(regionAt(178, 38), 'ear');
  assert.equal(regionAt(120, 40), 'head');
  assert.equal(regionAt(66, 214), 'hand'); // mép tay chồng lên bụng
  assert.equal(regionAt(120, 230), 'tummy');
  assert.equal(regionAt(2, 2), null);
  assert.equal(regionAt(238, 150), null);
});

test('khay: đúng số món theo mức, không trùng, đúng loại, có đúng một đồ đúng; số món lớn hơn số đồ cùng loại vẫn không thiếu (DOC-10)', () => {
  const rng = seeded(7);
  for (const c of CASES) for (let level = c.level; level <= 3; level++) {
    for (const step of stepsFor(c, level).filter((s) => s.type !== 'touch')) {
      for (let i = 0; i < 20; i++) {
        const tray = trayFor(step, level, { rng });
        const pool = step.type === 'check' ? TOOLS : TREATS;
        assert.equal(tray.length, Math.min(TRAY_SIZE[level][step.type], pool.length));
        assert.equal(new Set(tray).size, tray.length);
        assert.equal(tray.filter((id) => id === step.item).length, 1);
        assert.ok(tray.every((id) => ITEM_BY_ID.get(id).kind === step.type));
      }
    }
  }
  assert.equal(trayFor({ type: 'check', item: 'flashlight' }, 3).length, 3);
});

test('chọn ca: 3 ca khác nhau trong nhóm mức, 3 bạn thú khác nhau, ưu tiên ca ít gặp (tối đa 2), tránh hai ca cùng đồ chữa', () => {
  const rng = seeded(3);
  for (const level of [1, 2, 3]) {
    const allowed = new Set(casesFor(level).map((c) => c.id));
    for (let i = 0; i < 50; i++) {
      const picks = pickCases(level, { rng });
      assert.equal(picks.length, 3);
      assert.equal(new Set(picks.map((p) => p.id)).size, 3);
      assert.equal(new Set(picks.map((p) => p.patient)).size, 3);
      assert.ok(picks.every((p) => allowed.has(p.id) && PATIENTS.some((x) => x.id === p.patient)));
      const last = picks.map((p) => stepsFor(CASE_BY_ID.get(p.id), level).at(-1).item);
      assert.equal(new Set(last).size, 3, `mức ${level}: ${picks.map((p) => p.id)}`);
    }
  }
  // Ít gặp: 2 ca chưa gặp lần nào luôn có mặt.
  const seen = { 'cut-hand': 5, 'cut-foot': 5, tummy: 5 };
  for (let i = 0; i < 30; i++) {
    const ids = pickCases(1, { seen, rng }).map((p) => p.id);
    assert.ok(ids.includes('runny-nose') && ids.includes('tooth'), ids.join());
  }
});

test('chọn ca: dữ liệu không thể tránh trùng đồ chữa vẫn trả về 3 ca, không treo (DOC-11)', () => {
  const same = [1, 2, 3, 4].map((n) => ({ id: `x${n}`, level: 1, steps: [{ type: 'treat', item: 'bandage' }] }));
  const picks = pickCases(1, { pool: same, rng: seeded(9) });
  assert.equal(picks.length, 3);
  assert.equal(new Set(picks.map((p) => p.id)).size, 3);
});

test('câu: chạm đúng / nhầm chỗ, câu xin mức 1, câu nhầm đồ (có tên / không tên), eye drops dùng "those are" (DOC-09)', () => {
  assert.deepEqual(yesTouchLine(CASE_BY_ID.get('tummy'))[0], 'Yes! My tummy.');
  assert.deepEqual(yesTouchLine(CASE_BY_ID.get('tooth'))[0], 'Yes! My tooth.');
  assert.equal(wrongTouchLine('nose', CASE_BY_ID.get('tummy'))[0], "That's my nose! My tummy hurts!");
  assert.equal(askLine('bandage')[0], 'A bandage, please!');
  assert.equal(askLine('medicine')[0], 'Some medicine, please!');
  assert.equal(askLine('icepack')[0], 'An ice pack, please!');
  const treat = { type: 'treat', item: 'bandage' };
  assert.equal(wrongItemLine('toothbrush', treat, 1, 1).line[0], "Hmm, that's the toothbrush. I need a bandage!");
  assert.equal(wrongItemLine('drops', treat, 1, 1).line[0], 'Hmm, those are the eye drops. I need a bandage!');
  assert.equal(wrongItemLine('toothbrush', treat, 2, 1).line[0], 'Hmm, not the toothbrush.');
  assert.equal(wrongItemLine('toothbrush', treat, 2, 1).hint, false);
  assert.equal(wrongItemLine('toothbrush', treat, 2, 2).line[0], 'I need a bandage!');
  assert.equal(wrongItemLine('toothbrush', treat, 2, 2).hint, true);
  const check = { type: 'check', item: 'flashlight' };
  assert.deepEqual(wrongItemLine('stethoscope', check, 2, 1), {
    line: ["Hmm, that's the stethoscope. Use the flashlight!", 'Ừm, đó là ống nghe. Dùng đèn pin cơ!'], hint: true,
  });
  // Mọi cặp ca × vùng chạm nhầm / đồ nhầm sinh ra câu không rỗng, không có "undefined".
  for (const c of CASES) for (let level = c.level; level <= 3; level++) for (const step of stepsFor(c, level)) {
    const lines = [stepPrompt(step, level).line];
    if (step.type === 'touch') for (const r of Object.keys(REGIONS)) lines.push(wrongTouchLine(r, c));
    else {
      lines.push(doneLine(c, step).line);
      for (const t of [...TOOLS, ...TREATS].filter((x) => x.kind === step.type && x.id !== step.item)) {
        for (const w of [1, 2]) lines.push(wrongItemLine(t.id, step, level, w).line);
      }
    }
    for (const [en, vi] of lines) assert.ok(en && vi && !/undefined|null/.test(en + vi), `${c.id}: ${en} / ${vi}`);
  }
  assert.deepEqual(stepPrompt({ type: 'treat', item: 'bandage' }, 1), { who: 'patient', line: askLine('bandage') });
  assert.equal(stepPrompt({ type: 'treat', item: 'bandage' }, 2).line[0], 'How can we help?');
});

test('mức (D2): chơi được cả 3 mức; dữ liệu hỏng → mức 1; đủ 3 lượt thì lên một mức, mức 3 không lên thêm; khóa mức không đếm; seen chỉ giữ mã ca có thật', () => {
  assert.equal(PLAYABLE_LEVEL, 3);
  assert.deepEqual(cleanDoctorState(null), { level: 1, rounds: 0, lock: null, seen: {} });
  assert.deepEqual(cleanDoctorState({ level: 3, rounds: -1, lock: 7, seen: { tummy: 2, nope: 3, tooth: 'x' } }), { level: 3, rounds: 0, lock: null, seen: { tummy: 2 } });
  assert.equal(cleanDoctorState({ level: 9 }).level, 1);
  let t = cleanDoctorState({});
  for (let i = 0; i < 3; i++) t = afterDoctorRound(t);
  assert.deepEqual([t.level, t.rounds], [2, 0]);
  for (let i = 0; i < 6; i++) t = afterDoctorRound(t);
  assert.deepEqual([t.level, t.rounds], [3, 3]);
  assert.deepEqual(afterDoctorRound({ level: 2, rounds: 2, lock: 2, seen: {} }), { level: 2, rounds: 0, lock: 2, seen: {} });
  assert.deepEqual(afterHealed(afterHealed(t, 'tummy'), 'tummy').seen, { tummy: 2 });
});

test('giọng bạn thú: mỗi bạn một cao độ khác nhau, khác giọng thường của Bông (1)', () => {
  const pitches = PATIENTS.map((p) => p.pitch);
  assert.ok(pitches.every((x) => typeof x === 'number' && x !== 1 && x >= 0.5 && x <= 2));
  assert.equal(new Set(pitches).size, PATIENTS.length);
});
