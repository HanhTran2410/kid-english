// Mục Toán (SPEC-math.md): bộ sinh câu hỏi, câu Bông nói, sao và mức, tương thích với Ôn tập / sao lưu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import JSZip from 'jszip';
import {
  MATH_ITEMS, MATH_ITEM, ORDER_WORDS, useOf, builtInMathLessons, isMathLesson, mathKey, isMathKey, lessonItems, typesFor, makeMathRound,
  pickSides, pickTypes, askLine, answerLine, wrongLine, applyMathRound, addMathType, weakType, SIZE_RATIO, COUNT_RANGE, SCATTER_CELLS,
} from '../../app/js/math.js';
import { lessonKind, isWordLesson } from '../../app/js/phrase.js';
import { wordRecords, emptyProgress, isLearned } from '../../app/js/progress.js';
import { collectItems } from '../../app/js/mix.js';
import { openDatabase } from '../../app/js/db.js';
import { createBackup, readBackup, applyBackup } from '../../app/js/backup.js';
import { createLessonRecord } from '../../app/js/lesson.js';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const [L1, L2, L3, L4, L5, L6] = builtInMathLessons();
const longestRun = (list) => list.reduce((acc, x, i) => {
  acc.run = i && x === list[i - 1] ? acc.run + 1 : 1;
  acc.best = Math.max(acc.best, acc.run);
  return acc;
}, { run: 0, best: 0 }).best;
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 10, 3);

test('MATH-07: bài có sẵn L1–L6; mọi itemIds có trong MATH_ITEMS và đúng `uses`', () => {
  assert.deepEqual(builtInMathLessons().map((l) => l.builtin), ['math-l1', 'math-l2', 'math-l3', 'math-l4', 'math-l5', 'math-l6']);
  assert.deepEqual(builtInMathLessons().map(useOf), ['size', 'tall', 'long', 'count', 'order', 'weight']);
  for (const lesson of builtInMathLessons()) {
    assert.ok(isMathLesson(lesson));
    for (const id of lesson.config.itemIds) {
      assert.ok(MATH_ITEM.has(id), id);
      assert.ok(MATH_ITEM.get(id).uses.includes(useOf(lesson)), `${id} dùng được cho ${useOf(lesson)}`);
      if (['tall', 'long'].includes(useOf(lesson))) assert.ok(MATH_ITEM.get(id).svg, `${id} có hình kéo giãn`);
    }
    assert.equal(lessonItems(lesson).length, lesson.config.itemIds.length);
  }
  assert.equal(new Set(MATH_ITEMS.map((x) => x.id)).size, MATH_ITEMS.length);
});

test('khóa tiến độ theo mã bài, không lẫn với từ vựng / số', () => {
  assert.equal(mathKey(L1), 'math:l1');
  assert.ok(isMathKey('math:l4'));
  assert.ok(!isMathKey('number:3'));
});

for (const level of [1, 2, 3]) {
  test(`MATH-08–10: L1 mức ${level} — 500 lượt: đáp án cân bằng, chênh lệch đúng, kiểu câu đúng mức`, () => {
    const rng = seeded(level * 7);
    const [lo, hi] = SIZE_RATIO[level];
    for (let run = 0; run < 500; run++) {
      const qs = makeMathRound(L1, level, { rng });
      assert.equal(qs.length, 6);
      const sides = qs.map((q) => q.answer);
      assert.ok(sides.filter((s) => s === 'left').length <= 4 && sides.filter((s) => s === 'right').length <= 4, 'tối đa 4/6 cùng một bên');
      assert.ok(longestRun(sides) <= 3, 'tối đa 3 câu liền cùng bên');
      const types = qs.map((q) => q.type);
      for (const t of types) assert.ok(typesFor(L1, level).includes(t));
      if (level === 1) assert.ok(types.every((t) => t === 'big'), 'mức 1 chỉ hỏi big');
      if (level === 3) assert.ok(types.every((t) => t === 'bigger' || t === 'smaller'), 'mức 3 chỉ dạng -er');
      if (typesFor(L1, level).length > 1) assert.ok(longestRun(types) <= 2, 'một kiểu câu không quá 2 lần liền');
      const pairs = new Map();
      for (const [i, q] of qs.entries()) {
        const ratio = Math.max(q.left.scale, q.right.scale) / Math.min(q.left.scale, q.right.scale);
        assert.ok(ratio >= lo - 1e-9 && ratio <= hi + 1e-9, `tỉ lệ ${ratio} ở mức ${level}`);
        const bigSide = q.left.scale > q.right.scale ? 'left' : 'right';
        assert.equal(q.answer === bigSide, ['big', 'bigger'].includes(q.type), 'đáp án đúng bên to / nhỏ');
        if (i) assert.notEqual(q.item, qs[i - 1].item, 'hai câu liền nhau đổi đồ');
        const key = `${q.item}|${q.left.scale}|${q.right.scale}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
      assert.ok(Math.max(...pairs.values()) <= 2, 'một cặp không lặp quá 2 lần');
    }
  });

  test(`MATH-11/12: L4 mức ${level} — 500 lượt: phạm vi, chênh lệch, bằng nhau chỉ ở mức 3`, () => {
    const rng = seeded(level * 13);
    const { max, diff } = COUNT_RANGE[level];
    let sames = 0;
    for (let run = 0; run < 500; run++) {
      const qs = makeMathRound(L4, level, { rng });
      assert.equal(qs.length, 6);
      const sided = qs.filter((q) => q.answer !== 'same').map((q) => q.answer);
      assert.ok(longestRun(sided) <= 3);
      assert.ok(sided.filter((s) => s === 'left').length <= 4 && sided.filter((s) => s === 'right').length <= 4);
      for (const q of qs) {
        const { count: l } = q.left;
        const { count: r } = q.right;
        assert.ok(l >= 1 && l <= max && r >= 1 && r <= max, `số đồ ${l}, ${r} trong 1–${max}`);
        if (q.type === 'same') {
          sames++;
          assert.equal(level, 3, 'hai đĩa bằng nhau chỉ ở mức 3');
          assert.equal(l, r);
          assert.equal(q.answer, 'same');
          assert.ok(['more', 'fewer'].includes(q.ask));
        } else {
          assert.ok(Math.abs(l - r) >= diff, `chênh ${Math.abs(l - r)} ≥ ${diff}`);
          const moreSide = l > r ? 'left' : 'right';
          assert.equal(q.answer === moreSide, q.type === 'more');
        }
        if (level === 3) {
          for (const side of ['left', 'right']) {
            const cells = q[side].cells;
            assert.equal(cells.length, q[side].count);
            assert.equal(new Set(cells).size, cells.length, 'mỗi ô tối đa một đồ (không chồng nhau)');
            assert.ok(cells.every((c) => c >= 0 && c < SCATTER_CELLS));
          }
        } else {
          assert.equal(q.left.cells, undefined, 'mức 1–2: đồ xếp hàng thẳng');
        }
      }
      if (level === 1) assert.ok(qs.every((q) => q.type === 'more'), 'mức 1 chỉ hỏi more');
    }
    if (level === 3) assert.equal(sames, 500, 'mức 3: đúng 1 câu bằng nhau mỗi lượt');
  });
}

test('MATH-13: kiểu hay sai được thêm 1 câu (lấy bớt của kiểu khác), "the same" tối đa 2', () => {
  const rng = seeded(5);
  for (let i = 0; i < 300; i++) {
    const t = pickTypes(['big', 'small'], 6, rng, 'small');
    assert.equal(t.filter((x) => x === 'small').length, 4);
    assert.ok(longestRun(t) <= 2);
    const c = pickTypes(['more', 'fewer', 'same'], 6, rng, 'same');
    assert.equal(c.filter((x) => x === 'same').length, 2);
    const plain = pickTypes(['more', 'fewer', 'same'], 6, rng);
    assert.equal(plain.filter((x) => x === 'same').length, 1);
  }
  // Mức chỉ có một kiểu: không đổi gì.
  assert.deepEqual(pickTypes(['big'], 6, rng, 'big'), Array(6).fill('big'));
});

test('kiểu hay sai: tỉ lệ đúng ngay thấp nhất, chỉ kiểu đã hỏi ≥ 3 lần, chỉ kiểu của mức', () => {
  const rec = { types: { big: { asked: 10, first: 6, wrong: 4 }, small: { asked: 3, first: 1, wrong: 2 }, more: { asked: 2, first: 0, wrong: 2 } } };
  assert.equal(weakType(rec, ['big', 'small']), 'small');
  assert.equal(weakType(rec, ['big']), 'big');
  assert.equal(weakType(rec, ['more', 'fewer']), null, 'more mới hỏi 2 lần');
  assert.equal(weakType({ types: { big: { asked: 5, first: 5, wrong: 0 } } }, ['big']), null, 'chưa sai bao giờ');
  assert.equal(weakType(emptyProgress('math:l1'), ['big']), null);
});

test('pickSides: gần đều trái / phải, ≤ 3 liền', () => {
  const rng = seeded(9);
  for (let i = 0; i < 300; i++) {
    for (const n of [5, 6]) {
      const s = pickSides(n, rng);
      assert.equal(s.length, n);
      assert.ok(Math.abs(s.filter((x) => x === 'left').length - s.filter((x) => x === 'right').length) <= 1);
      assert.ok(longestRun(s) <= 3);
    }
  }
});

test('câu Bông nói: this / that, mức 3 dạng -er, câu sai mô tả đúng đồ bé chọn', () => {
  const q = { type: 'big', level: 1, item: 'apple', left: { scale: 2.2 }, right: { scale: 1 }, answer: 'left' };
  assert.equal(askLine(q).en, 'Which one is big?');
  assert.equal(answerLine(q).en, 'This apple is big. That apple is small.');
  assert.equal(wrongLine(q, 'right').en, 'That one is small.');
  const s = { ...q, type: 'small', answer: 'right' };
  assert.equal(answerLine(s).en, 'This apple is small. That apple is big.');
  assert.equal(wrongLine(s, 'left').en, 'That one is big.');
  const er = { ...q, type: 'smaller', level: 3, answer: 'right' };
  assert.equal(askLine(er).en, 'Which one is smaller?');
  assert.equal(answerLine(er).en, 'This apple is smaller.');
  assert.equal(wrongLine(er, 'left').en, 'That one is bigger.');

  const c = { type: 'fewer', level: 2, item: 'duck', left: { count: 2 }, right: { count: 6 }, answer: 'left' };
  assert.equal(askLine(c).en, 'Which plate has fewer?');
  assert.equal(answerLine(c).en, 'This plate has fewer ducks.');
  assert.equal(wrongLine(c, 'right').en, 'That plate has more.');
  assert.equal(wrongLine({ ...c, level: 3 }, 'same').en, "Let's count! This plate has two. That plate has six.");
  const same = { type: 'same', ask: 'more', level: 3, item: 'cookie', left: { count: 4 }, right: { count: 4 }, answer: 'same' };
  assert.equal(askLine(same).en, 'Which plate has more?');
  assert.equal(answerLine(same).en, 'They are the same!');
  assert.equal(wrongLine(same, 'left').en, "Let's count! This plate has four. That plate has four, too.");
  for (const line of [answerLine(q), wrongLine(c, 'right'), askLine(same)]) assert.ok(line.vi, 'có tiếng Việt viết sẵn');
});

test('MATH-28: sao — +1 xong lượt, +1 nếu ≥ 5 đúng ngay, tối đa +2 / bài / ngày, tối đa 5, không trừ', () => {
  let rec = emptyProgress('math:l1');
  rec = applyMathRound(rec, 4, NOW); // ngày 1, lượt 1
  assert.equal(rec.mastery, 1);
  rec = applyMathRound(rec, 5, NOW + 1000); // ngày 1, lượt 2: +1 (đủ +2 hôm nay)
  assert.equal(rec.mastery, 2);
  rec = applyMathRound(rec, 6, NOW + 2000); // ngày 1, lượt 3: hết +2 hôm nay
  assert.equal(rec.mastery, 2);
  assert.equal(rec.practiceCount, 3);
  rec = applyMathRound(rec, 6, NOW + DAY); // ngày 2: +2
  assert.equal(rec.mastery, 4);
  rec = applyMathRound(rec, 6, NOW + 2 * DAY);
  rec = applyMathRound(rec, 6, NOW + 3 * DAY);
  assert.equal(rec.mastery, 5, 'tối đa 5 sao');
  rec = applyMathRound(rec, 0, NOW + 4 * DAY);
  assert.equal(rec.mastery, 5, 'không bao giờ trừ');
  assert.ok(isLearned(rec));
});

test('MATH-29: mức — lên 2 ở ≥ 2⭐ VÀ lượt ≥ 4/6 đúng ngay; lên 3 ở ≥ 4⭐; mỗi lần một mức; không tự tụt', () => {
  let rec = emptyProgress('math:l1');
  rec = applyMathRound(rec, 6, NOW); // 2⭐, 6/6 → mức 2
  assert.equal(rec.level, 2);
  rec = { ...emptyProgress('math:l4') };
  rec = applyMathRound(rec, 3, NOW); // 1⭐
  rec = applyMathRound(rec, 3, NOW + 1); // 2⭐ nhưng lượt chỉ 3/6 đúng ngay → giữ mức 1
  assert.equal(rec.mastery, 2);
  assert.equal(rec.level, 1);
  rec = applyMathRound(rec, 4, NOW + DAY); // 3⭐, 4/6 → mức 2
  assert.equal(rec.level, 2);
  rec = applyMathRound(rec, 6, NOW + 2 * DAY); // 5⭐ → mức 3 (chỉ một mức mỗi lần)
  assert.equal(rec.level, 3);
  rec = applyMathRound(rec, 0, NOW + 3 * DAY);
  assert.equal(rec.level, 3, 'không tự tụt');
  // Bố mẹ đặt lại mức 1: lượt sau đủ điều kiện thì lại lên từng mức.
  rec = applyMathRound({ ...rec, level: 1 }, 6, NOW + 4 * DAY);
  assert.equal(rec.level, 2);
});

test('thống kê kiểu câu: hỏi / đúng ngay / số lần chạm sai', () => {
  let rec = emptyProgress('math:l1');
  rec = addMathType(rec, 'big', { first: true, wrong: 0 });
  rec = addMathType(rec, 'big', { first: false, wrong: 2 });
  rec = addMathType(rec, 'small', { first: false, wrong: 0 }); // bỏ qua / hết giờ: không đúng, không sai
  assert.deepEqual(rec.types, { big: { asked: 2, first: 1, wrong: 2 }, small: { asked: 1, first: 0, wrong: 0 } });
});

test('MATH-05: bài Toán không phải bài từ vựng; Ôn tập / Học cùng Bông không lấy bài và tiến độ math:*', () => {
  const rec = createLessonRecord(L1);
  assert.equal(lessonKind(rec), 'math');
  assert.ok(!isWordLesson(rec));
  assert.deepEqual(collectItems([rec]), []);
  const records = [{ ...emptyProgress('math:l1'), practiceCount: 2, mastery: 2 }, { ...emptyProgress('cow'), practiceCount: 1 }];
  assert.deepEqual(wordRecords(records).map((r) => r.word), ['cow']);
});

test('MATH-06: sao lưu → khôi phục (gộp và thay toàn bộ) giữ nguyên bài Toán và tiến độ math:*', async () => {
  const src = await openDatabase('math-src', new IDBFactory());
  const lesson = { ...createLessonRecord(L4), id: 'm4', resume: null };
  await src.put('lessons', lesson);
  await src.put('progress', { ...emptyProgress('math:l4'), mastery: 3, level: 2, types: { more: { asked: 4, first: 3, wrong: 1 } } });
  const zip = await createBackup(src, { JSZip, now: NOW });
  for (const mode of ['merge', 'replace']) {
    const dst = await openDatabase(`math-dst-${mode}`, new IDBFactory());
    await applyBackup(dst, await readBackup(zip.blob ?? zip, { JSZip }), mode);
    const got = await dst.get('lessons', 'm4');
    assert.equal(got.kind, 'math');
    assert.deepEqual(got.config, L4.config);
    const p = await dst.get('progress', 'math:l4');
    assert.equal(p.mastery, 3);
    assert.equal(p.level, 2);
    assert.deepEqual(p.types.more, { asked: 4, first: 3, wrong: 1 });
  }
});

// ---------- Đợt M-b: Cao – thấp, Dài – ngắn, Nhỏ – vừa – to, Nặng – nhẹ ----------

for (const [lesson, pos, er] of [[L2, 'tall', ['taller', 'shorter']], [L3, 'long', ['longer', 'shorter']]]) {
  test(`MATH-15: ${lesson.title} — 500 lượt mỗi mức: kiểu câu theo mức, chênh lệch, cái "hơn" đúng bên`, () => {
    for (const level of [1, 2, 3]) {
      const rng = seeded(level * 31);
      const [lo, hi] = SIZE_RATIO[level];
      for (let run = 0; run < 500; run++) {
        const qs = makeMathRound(lesson, level, { rng });
        assert.ok(longestRun(qs.map((q) => q.answer)) <= 3);
        for (const q of qs) {
          assert.equal(q.dim, useOf(lesson));
          assert.ok(typesFor(lesson, level).includes(q.type));
          if (level === 1) assert.equal(q.type, pos);
          if (level === 3) assert.ok(er.includes(q.type));
          const ratio = Math.max(q.left.scale, q.right.scale) / Math.min(q.left.scale, q.right.scale);
          assert.ok(ratio >= lo - 1e-9 && ratio <= hi + 1e-9);
          const bigSide = q.left.scale > q.right.scale ? 'left' : 'right';
          assert.equal(q.answer === bigSide, [pos, er[0]].includes(q.type));
          assert.ok(MATH_ITEM.get(q.item).svg);
        }
      }
    }
  });
}

test('L5 Nhỏ – vừa – to — khay không bao giờ xếp sẵn đúng, đổi đồ giữa các câu, một bộ không lặp quá 2 lần', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 41);
    for (let run = 0; run < 500; run++) {
      const qs = makeMathRound(L5, level, { rng });
      assert.equal(qs.length, 6);
      const seen = new Map();
      for (const [i, q] of qs.entries()) {
        assert.equal(q.type, 'order');
        assert.equal(q.answer, 'order');
        assert.deepEqual([...q.tray].sort(), [0, 1, 2]);
        assert.notEqual(q.tray.join(), '0,1,2');
        if (i) assert.notEqual(q.item, qs[i - 1].item);
        const key = `${q.item}|${q.tray}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      assert.ok(Math.max(...seen.values()) <= 2);
    }
  }
});

test('MATH-14: L6 Nặng – nhẹ — luôn ghép đồ rất nặng với đồ rất nhẹ; đáp án đúng bên; đổi bên; kiểu câu theo mức', () => {
  for (const level of [1, 2, 3]) {
    const rng = seeded(level * 53);
    for (let run = 0; run < 500; run++) {
      const qs = makeMathRound(L6, level, { rng });
      const sides = qs.map((q) => q.answer);
      assert.ok(longestRun(sides) <= 3);
      assert.ok(sides.filter((s) => s === 'left').length <= 4 && sides.filter((s) => s === 'right').length <= 4);
      for (const q of qs) {
        assert.ok(typesFor(L6, level).includes(q.type));
        const heavy = MATH_ITEM.get(q.heavy);
        const light = MATH_ITEM.get(q.light);
        assert.ok(heavy.weight >= 4 && light.weight <= 1, `${heavy.id} – ${light.id}`);
        const heavySide = q.left.item === q.heavy ? 'left' : 'right';
        assert.equal(q[heavySide === 'left' ? 'right' : 'left'].item, q.light);
        assert.equal(q.answer === heavySide, ['heavy', 'heavier'].includes(q.type));
      }
    }
  }
});

test('câu Bông nói — cao / dài / nặng / xếp cỡ: đúng từ, câu sai mô tả đồ bé chọn', () => {
  const tall = { type: 'short', dim: 'tall', level: 2, item: 'tree', left: { scale: 1 }, right: { scale: 1.6 }, answer: 'left' };
  assert.equal(askLine(tall).en, 'Which one is short?');
  assert.equal(askLine(tall).vi, 'Cái nào thấp?');
  assert.equal(answerLine(tall).en, 'This tree is short. That tree is tall.');
  assert.equal(wrongLine(tall, 'right').en, 'That one is tall.');
  const long = { type: 'longer', dim: 'long', level: 3, item: 'snake', left: { scale: 1.4 }, right: { scale: 1 }, answer: 'left' };
  assert.equal(askLine(long).en, 'Which one is longer?');
  assert.equal(askLine(long).vi, 'Cái nào dài hơn?');
  assert.equal(answerLine(long).en, 'This snake is longer.');
  assert.equal(wrongLine(long, 'right').en, 'That one is shorter.');
  const w = { type: 'light', dim: 'weight', level: 2, heavy: 'watermelon', light: 'grape', left: { item: 'grape' }, right: { item: 'watermelon' }, answer: 'left' };
  assert.equal(askLine(w).en, 'Which one is light?');
  assert.equal(answerLine(w).en, 'The grape is light. The watermelon is heavy.');
  assert.equal(wrongLine(w, 'right').en, 'The watermelon is heavy.');
  const w3 = { ...w, type: 'heavier', level: 3, answer: 'right' };
  assert.equal(answerLine(w3).en, 'The watermelon is heavier than the grape.');
  assert.equal(wrongLine(w3, 'left').en, 'The grape is lighter.');
  const o = { type: 'order', level: 1, item: 'teddy', tray: [2, 0, 1], answer: 'order' };
  assert.equal(askLine(o).en, 'Put them in order: small, medium, big!');
  assert.equal(answerLine(o).en, 'Small, medium, big!');
  assert.deepEqual(ORDER_WORDS.map((_, r) => wrongLine(o, r).en), ['That one is small.', 'That one is medium.', 'That one is big.']);
  // Câu To – nhỏ lưu từ 0.66.0 (chưa có `dim`) vẫn ra câu đúng.
  const old = { type: 'big', level: 1, item: 'apple', left: { scale: 2.2 }, right: { scale: 1 }, answer: 'left' };
  assert.equal(wrongLine(old, 'right').en, 'That one is small.');
  assert.equal(answerLine(old).en, 'This apple is big. That apple is small.');
});
