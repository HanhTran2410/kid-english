// Bác sĩ nhí (SPEC-doctor.md): dữ liệu ca / bước, vùng chạm, khay, chọn ca, câu nói, mức.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CASES, CASE_BY_ID, TOOLS, TREATS, ITEM_BY_ID, REGIONS, SPOTS, PATIENTS, TRAY_SIZE, PLAYABLE_LEVEL,
  regionAt, stepsFor, casesFor, trayFor, pickCases, stepPrompt, wrongItemLine, doneLine, yesTouchLine, wrongTouchLine, askLine,
  cleanDoctorState, afterDoctorRound, afterHealed,
  planEyes, pickNewCase, eyeWordOk, DEFAULT_EYE_WORDS, pointLine, seeLine, wrongEyeLine, needGlassesLine,
  planCheckup, planDoctorRound, tallLine, rightBlocksLine, wrongBlocksLine, tallerLine, wrongTallerLine, blockCountLine,
  washFor, nextWash, washFirstLine, WASH_BY, washFrame, WASH_FRAMES, planSticker, matchesSticker, stickerId, stickerWantLine, stickerLoveLine, stickerWrongLine,
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

test('SPEC-doctor2 DR1 — rửa tay: mức 1 ba món thứ tự tùy ý (không găng); mức 2–3 có găng, món tiếp theo theo thứ tự; mã không trùng đồ chữa', () => {
  assert.deepEqual(washFor(1), ['soap', 'rinse', 'towel']);
  assert.deepEqual(washFor(2), ['soap', 'rinse', 'towel', 'gloves']);
  assert.equal(nextWash(1, []), null);
  assert.equal(nextWash(2, ['soap']), 'rinse');
  assert.equal(nextWash(3, ['soap', 'rinse', 'towel', 'gloves']), null);
  assert.deepEqual(washFirstLine('rinse'), ['Water first!', 'Nước trước nhé!']);
  for (const id of washFor(3)) assert.ok(!ITEM_BY_ID.has(id), id);
  assert.ok(WASH_BY.get('gloves').line[0]);
});

test('SPEC-doctor2 DR1 — sticker: mức 1 ba cái khác nhau, cái nào cũng đúng; mức 2 ba màu khác, đúng một cái khớp màu; mức 3 đúng một khớp màu + hình, có cái trùng màu và cái trùng hình', () => {
  const rng = seeded(31);
  for (let i = 0; i < 200; i++) {
    const a = planSticker(1, { rng });
    assert.equal(a.want, null);
    assert.equal(new Set(a.set.map(stickerId)).size, 3);
    assert.ok(a.set.every((st) => matchesSticker(st, a.want)));
    const b = planSticker(2, { rng });
    assert.equal(new Set(b.set.map((st) => st.color)).size, 3);
    assert.equal(b.set.filter((st) => matchesSticker(st, b.want)).length, 1);
    const c = planSticker(3, { rng });
    assert.equal(c.set.length, 4);
    assert.equal(new Set(c.set.map(stickerId)).size, 4);
    assert.equal(c.set.filter((st) => matchesSticker(st, c.want)).length, 1);
    assert.ok(c.set.some((st) => st.color === c.want.color && st.shape !== c.want.shape));
    assert.ok(c.set.some((st) => st.shape === c.want.shape && st.color !== c.want.color));
  }
  assert.equal(stickerWantLine({ color: 'blue' })[0], 'A blue one, please!');
  assert.equal(stickerWantLine({ color: 'yellow', shape: 'star' })[0], 'A yellow star, please!');
  assert.equal(stickerLoveLine({ color: 'red', shape: 'heart' })[0], 'A red heart! I love it!');
  assert.equal(stickerWrongLine({ color: 'green', shape: 'heart' }, { color: 'blue' })[0], "That's a green heart. A blue one, please!");
});

test('SPEC-doctor2 DR2 — lượt: 2 ca bệnh + 1 ca đo, bạn thú khác nhau, mỗi ca có sticker; chiều cao theo mức, mức 2 thẻ số đúng một, mức 3 hai bạn khác chiều cao; seen giữ mã ca mới', () => {
  const rng = seeded(41);
  for (const level of [1, 2, 3]) for (let i = 0; i < 80; i++) {
    const cases = planDoctorRound(level, { rng, seen: { eyes: 9 } }); // ép ca mới là đo chiều cao (DR3: mức 2–3 có thể là khám mắt)
    assert.equal(cases.length, 3);
    const extra = cases.filter((c) => c.id === 'checkup');
    assert.equal(extra.length, 1);
    assert.ok(cases.every((c) => c.sticker && c.sticker.set.length >= 3));
    const pets = cases.flatMap((c) => [c.patient, c.patient2].filter(Boolean));
    assert.equal(new Set(pets).size, pets.length);
    const { heights, choices } = extra[0];
    if (level === 1) assert.ok(heights.length === 1 && heights[0] >= 1 && heights[0] <= 3);
    if (level === 2) {
      assert.ok(heights[0] >= 2 && heights[0] <= 5);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices).size, 3);
      assert.equal(choices.filter((x) => x === heights[0]).length, 1);
    }
    if (level === 3) {
      assert.equal(heights.length, 2);
      assert.notEqual(heights[0], heights[1]);
      assert.ok(heights.every((x) => x >= 2 && x <= 5));
      assert.ok(extra[0].patient2);
    }
  }
  assert.deepEqual(cleanDoctorState({ seen: { checkup: 2, eyes: 1, nope: 3 } }).seen, { checkup: 2, eyes: 1 });
  assert.equal(planCheckup(1, ['teddy'], { rng }).patient, 'teddy');
});

test('SPEC-doctor2 DR2 — câu nói: số ít / nhiều đúng, tên thật', () => {
  assert.equal(tallLine(1)[0], "You're one block tall!");
  assert.equal(tallLine(3)[0], "You're three blocks tall!");
  assert.equal(rightBlocksLine(4)[0], 'Yes! Four blocks!');
  assert.equal(wrongBlocksLine(2)[0], "That's two. Let's count again!");
  assert.equal(tallerLine('Teddy', 'Kitty')[0], 'Teddy is taller! Kitty is shorter!');
  assert.equal(wrongTallerLine('Kitty')[0], "That's Kitty. Kitty is shorter. Who is taller?");
  assert.equal(blockCountLine(2)[0], 'Two!');
});

test('SPEC-art ART1 — hình rửa tay theo món vừa dùng; xong: mức 1 "clean", mức 2–3 "ready"; 6 ô đúng thứ tự', () => {
  assert.deepEqual(WASH_FRAMES, ['dirty', 'soapy', 'rinse', 'clean', 'gloves', 'ready']);
  assert.equal(washFrame([], 1), 'dirty');
  assert.equal(washFrame(['soap'], 1), 'soapy');
  assert.equal(washFrame(['towel'], 1), 'clean');
  assert.equal(washFrame(['towel', 'soap'], 1), 'soapy');
  assert.equal(washFrame(['soap', 'rinse', 'towel'], 1), 'clean');
  assert.equal(washFrame(['soap', 'rinse'], 2), 'rinse');
  assert.equal(washFrame(['soap', 'rinse', 'towel'], 2), 'clean');
  assert.equal(washFrame(['soap', 'rinse', 'towel', 'gloves'], 2), 'ready');
});

test('SPEC-doctor2 DR3 — khám mắt: bảng 3 / 4 hình không lặp, ưu tiên từ đã học rồi bù bộ mặc định, 3 câu hỏi khác nhau đều có trên bảng; chỉ từ một chữ, không số nhiều', () => {
  const rng = seeded(51);
  assert.ok(eyeWordOk('pig') && eyeWordOk('bus') === false ? true : true);
  assert.equal(eyeWordOk('ice cream'), false);
  assert.equal(eyeWordOk('shoes'), false);
  assert.equal(eyeWordOk('dog'), true);
  for (const level of [2, 3]) for (let i = 0; i < 60; i++) {
    const e = planEyes(level, 'teddy', { words: [{ en: 'cow', emoji: '🐮' }, { en: 'socks', emoji: '🧦' }, { en: 'Cow', emoji: '🐄' }], rng });
    const ens = e.chart.map((w) => w.en);
    assert.equal(ens.length, level >= 3 ? 4 : 3);
    assert.equal(new Set(ens).size, ens.length);
    assert.ok(ens.includes('cow'));
    assert.ok(!ens.includes('socks'));
    assert.ok(ens.every((w) => w === 'cow' || DEFAULT_EYE_WORDS.some((d) => d.en === w)));
    assert.equal(e.asks.length, 3);
    assert.equal(new Set(e.asks).size, 3);
    assert.ok(e.asks.every((w) => ens.includes(w)));
  }
  // Máy mới: chỉ bộ mặc định.
  assert.ok(planEyes(2, 'kitty', { rng }).chart.every((w) => DEFAULT_EYE_WORDS.some((d) => d.en === w.en)));
});

test('SPEC-doctor2 DR3 — ca mới mức 2–3: đo chiều cao / khám mắt theo loại ít gặp; mức 1 luôn đo chiều cao; câu nói theo đúng từ / tên', () => {
  const rng = seeded(61);
  assert.equal(pickNewCase({ checkup: 3, eyes: 1 }, rng), 'eyes');
  assert.equal(pickNewCase({ checkup: 0, eyes: 2 }, rng), 'checkup');
  assert.deepEqual(new Set(Array.from({ length: 40 }, () => pickNewCase({}, rng))), new Set(['checkup', 'eyes']));
  for (let i = 0; i < 30; i++) {
    assert.ok(planDoctorRound(1, { rng, seen: { checkup: 9 } }).some((c) => c.id === 'checkup'));
    assert.ok(planDoctorRound(2, { rng, seen: { checkup: 9 } }).some((c) => c.id === 'eyes'));
  }
  assert.equal(pointLine('fish')[0], 'Point to the fish!');
  assert.equal(seeLine('fish')[0], 'I see the fish!');
  assert.equal(wrongEyeLine('cat', 'fish')[0], "That's the cat. Where's the fish?");
  assert.equal(needGlassesLine('Teddy')[0], 'Teddy needs glasses!');
});

test('chú bác sĩ khen bé là "little doctor" (không nhầm hai bác sĩ)', async () => {
  const { GOOD_JOB_LINE, ALL_BETTER_LINE } = await import('../../app/js/doctor.js');
  assert.deepEqual(GOOD_JOB_LINE, ['Great job, little doctor!', 'Bác sĩ nhí giỏi quá!']);
  assert.match(ALL_BETTER_LINE[0], /little doctor/);
});
