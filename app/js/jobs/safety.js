// 🦸 Siêu nhân an toàn (SPEC-safety.md): Bông định làm việc nguy hiểm, bé chạm ✋ "Stop!" (hoặc 👍 với việc nên làm),
// Bông giải thích một câu ngắn rồi bé làm một thao tác sửa. File thuần: bảng tình huống, cảnh (hình đặt ở đâu), bốc lượt,
// dữ liệu lưu, câu nói — test được trong node. Màn chơi ở screens/safety.js.
//
// Cảnh: mỗi hình là { id, k, x, y, h, hidden?, cls? } — x là tâm ngang, y là đáy (phần trăm của khung), h là chiều cao
// (phần trăm chiều cao khung). Mức 2 dùng cùng cảnh, vẽ nhỏ trong thẻ: thẻ "nguy hiểm" là lúc Bông vừa đi tới (chưa làm gì),
// thẻ "an toàn" là cảnh sau thao tác sửa (`sceneAt`).

import { shuffle } from './levels.js';

export const MAX_LEVEL = 3; // mức 3 (chuyện 2 bước, S2) chỉ khi bố mẹ khóa mức 3 — không tự lên
export const AUTO_MAX_LEVEL = 2; // tự lên tới mức 2
export const ROUND_LEN = 5;
export const MIN_ROUND = 3;
export const DEFAULT_FOCUS = 'habits';

/** Chủ đề (thứ tự hiện ở Góc bố mẹ). S1: 🌙 🍳 🏠 🚦 🚪 🚨; S2: 🛒 💧 🐕; 0.87.0: 🫶 (SPEC-body, bố mẹ bật). `en`: tên huy hiệu. */
export const TOPICS = {
  habits: { emoji: '🌙', vi: 'Thói quen tốt (TV, đi ngủ)', en: 'Bedtime' },
  kitchen: { emoji: '🍳', vi: 'Trong bếp', en: 'Kitchen' },
  home: { emoji: '🏠', vi: 'Trong nhà', en: 'Home' },
  road: { emoji: '🚦', vi: 'Trên đường', en: 'Road' },
  stranger: { emoji: '🚪', vi: 'Người lạ', en: 'Stranger' },
  fire: { emoji: '🚨', vi: 'Khi có cháy', en: 'Fire' },
  shop: { emoji: '🛒', vi: 'Ở siêu thị', en: 'Shop' },
  water: { emoji: '💧', vi: 'Gần nước (bể bơi, ao hồ)', en: 'Water' },
  dog: { emoji: '🐕', vi: 'Chó lạ', en: 'Doggy' },
  body: { emoji: '🫶', vi: 'Cơ thể của bé', en: 'My body' },
};
export const TOPIC_IDS = Object.keys(TOPICS);
/**
 * Chủ đề bố mẹ phải tự bật (SPEC-body mục 8): chỉ chơi khi có trong `safetyGame.optIn` (không dùng `off`, để nâng cấp không
 * đụng lựa chọn bật / tắt cũ). Chưa bật thì không có trong lượt, album, "Bé đã học"; tắt lại không xóa tiến độ / huy hiệu.
 */
export const OPT_IN_TOPICS = ['body'];
/** Tối đa số tình huống của chủ đề này trong một lượt (trừ khi chỉ bật mỗi chủ đề đó). */
export const TOPIC_CAP = { body: 2 };

const S = (k, x, y, h, extra = {}) => ({ id: extra.id ?? k, k, x, y, h, ...extra });
const CALL_MOMMY = ['Call Mommy! Tap Mommy.', 'Gọi mẹ nào! Chạm vào mẹ nhé.'];
const CALL_DADDY = ['Call Daddy! Tap Daddy.', 'Gọi bố nào! Chạm vào bố nhé.'];

/**
 * Tình huống. `kind`: 'no' (🚫, đáp án ✋) | 'yes' (✅, đáp án 👍).
 * `ask` Bông hỏi · `why` câu giải thích khi bé chọn đúng · `short` câu ngắn nhắc lại sau thao tác sửa ·
 * `hint` mức 1 chọn nhầm · `look` mức 2 chọn thẻ nhầm · `set` các hình trong cảnh (Bông thêm sau, đứng ở x = 16) ·
 * `walk` chỗ Bông đi tới · `fix`: { how: 'tap' | 'drag', target, item? (hình được kéo), say } · `done`: việc xảy ra sau
 * thao tác sửa — ['move', id, x, y] | ['show', id] | ['hide', id] | ['add', id, cls] | ['scene', cls].
 * Bé không bao giờ kéo / cầm đồ nguy hiểm (mục 5): dao, bật lửa, thuốc, nồi, ổ điện, quạt — chạm gọi bố mẹ, hoặc kéo Bông ra xa.
 */
export const RULES = [
  // ---------- 🌙 Thói quen tốt (draft4, bố mẹ ưu tiên) ----------
  {
    id: 'tv-long', topic: 'habits', kind: 'no', scene: 'room', emoji: '📺',
    ask: ['One more cartoon?', 'Xem thêm một phim nữa nhé?'],
    why: ["No! TV off. Let's play!", 'Không! Tắt TV đi. Mình chơi nào!'],
    short: ['TV off!', 'Tắt TV!'],
    hint: ['Hmm… wait! TV time is over!', 'Ơ… khoan! Hết giờ xem TV rồi!'],
    look: ['Hmm… TV still on? Look again!', 'Ơ… TV vẫn bật à? Nhìn lại nhé!'],
    set: [S('tv', 72, 66, 34), S('ball', 40, 92, 12, { hidden: true })],
    walk: 50,
    fix: { how: 'tap', target: 'tv', say: ['Tap the TV!', 'Chạm vào TV để tắt nhé!'] },
    done: [['add', 'tv', 'off'], ['show', 'ball'], ['move', 'bong', 30, 94], ['add', 'bong', 'hop']],
  },
  {
    id: 'video-bed', topic: 'habits', kind: 'no', scene: 'bedroom', emoji: '📱',
    ask: ['Videos in bed?', 'Xem video trên giường nhé?'],
    why: ['No more videos. Time to sleep.', 'Không xem video nữa. Đến giờ ngủ rồi.'],
    short: ['Time to sleep!', 'Đi ngủ thôi!'],
    hint: ['Hmm… wait! Bed is for sleeping!', 'Ơ… khoan! Giường là để ngủ mà!'],
    look: ['Hmm… videos in bed? Look again!', 'Ơ… xem video trên giường à? Nhìn lại nhé!'],
    set: [S('bed', 62, 94, 26), S('tablet', 62, 76, 12), S('shelf', 86, 42, 8), S('teddy', 50, 80, 10, { hidden: true })],
    walk: 42,
    fix: { how: 'tap', target: 'tablet', say: ['Tap the tablet! Put it away.', 'Chạm vào máy tính bảng để cất đi nhé!'] },
    done: [['move', 'tablet', 86, 36], ['show', 'teddy'], ['move', 'bong', 48, 80], ['add', 'bong', 'sleep']],
  },
  {
    id: 'stay-up', topic: 'habits', kind: 'no', scene: 'bedroom', emoji: '🌙',
    ask: ['Play some more?', 'Chơi thêm nữa nhé?'],
    why: ["No! It's bedtime. Good night!", 'Không! Đến giờ ngủ rồi. Chúc ngủ ngon!'],
    short: ['Bedtime!', 'Đi ngủ thôi!'],
    hint: ['Hmm… wait! Look, the moon!', 'Ơ… khoan! Trăng lên rồi kìa!'],
    look: ['Hmm… playing at night? Look again!', 'Ơ… tối rồi còn chơi à? Nhìn lại nhé!'],
    set: [S('moon', 84, 26, 14), S('toys', 70, 92, 16), S('bed', 26, 94, 26)],
    walk: 54,
    fix: { how: 'tap', target: 'bed', say: ['Tap the bed!', 'Chạm vào giường nhé!'] },
    done: [['move', 'bong', 26, 80], ['add', 'bong', 'sleep'], ['scene', 'dark']],
  },
  {
    id: 'tv-timer', topic: 'habits', kind: 'yes', scene: 'room', emoji: '⏰',
    ask: ['Ding! TV off now?', 'Reng! Tắt TV bây giờ nhé?'],
    why: ['Yes! TV off. Good job!', 'Đúng rồi! Tắt TV. Giỏi lắm!'],
    short: ['Ding! TV off!', 'Reng! Tắt TV!'],
    hint: ["It's OK! The timer says TV off.", 'Không sao đâu! Chuông báo tắt TV mà.'],
    look: ['Hmm… TV still on? Look again!', 'Ơ… TV vẫn bật à? Nhìn lại nhé!'],
    set: [S('tv', 72, 66, 34), S('timer', 44, 40, 12, { cls: 'ring' }), S('book', 34, 92, 10, { hidden: true })],
    walk: 50,
    fix: { how: 'tap', target: 'tv', say: ['Tap the TV!', 'Chạm vào TV để tắt nhé!'] },
    done: [['add', 'tv', 'off'], ['add', 'timer', 'quiet'], ['show', 'book'], ['move', 'bong', 22, 94], ['add', 'bong', 'hop']],
  },
  {
    id: 'bedtime', topic: 'habits', kind: 'yes', scene: 'bedroom', emoji: '🛏️',
    ask: ["I'm sleepy. Bed now?", 'Tớ buồn ngủ rồi. Đi ngủ nhé?'],
    why: ['Yes! Time for bed. Good night!', 'Đúng rồi! Đến giờ ngủ. Chúc ngủ ngon!'],
    short: ['Good night!', 'Chúc ngủ ngon!'],
    hint: ["It's OK! Sleepy means bedtime.", 'Không sao đâu! Buồn ngủ thì đi ngủ thôi.'],
    look: ['Hmm… not sleeping? Look again!', 'Ơ… chưa ngủ à? Nhìn lại nhé!'],
    set: [S('bed', 54, 94, 26), S('lamp', 84, 74, 22), S('teddy', 64, 80, 10, { hidden: true })],
    walk: 36,
    fix: { how: 'tap', target: 'lamp', say: ['Tap the lamp!', 'Chạm vào đèn ngủ để tắt nhé!'] },
    done: [['add', 'lamp', 'off'], ['move', 'bong', 50, 80], ['show', 'teddy'], ['add', 'bong', 'sleep'], ['scene', 'dark']],
  },

  // ---------- 🍳 Trong bếp ----------
  {
    id: 'knife', topic: 'kitchen', kind: 'no', scene: 'kitchen', emoji: '🔪',
    ask: ['A knife! Can I touch it?', 'Con dao! Tớ sờ được không?'],
    why: ['No! Sharp! Call Mommy.', 'Không! Dao sắc lắm! Gọi mẹ nhé.'],
    short: ['Sharp! Call Mommy.', 'Sắc lắm! Gọi mẹ.'],
    hint: ["Hmm… wait! It's sharp!", 'Ơ… khoan! Sắc lắm đấy!'],
    look: ['Hmm… a knife? Look again!', 'Ơ… cầm dao à? Nhìn lại nhé!'],
    set: [S('counter', 64, 94, 30), S('knife', 64, 64, 12), S('shelf', 64, 28, 8), S('mummy', 90, 94, 52)],
    walk: 44,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 78, 94], ['move', 'knife', 64, 22]],
  },
  {
    id: 'stove', topic: 'kitchen', kind: 'no', scene: 'kitchen', emoji: '🍲',
    ask: ['Can I touch the pot?', 'Tớ sờ cái nồi được không?'],
    why: ["No! It's hot! Stay back.", 'Không! Nóng lắm! Lùi xa ra nhé.'],
    short: ['Hot! Stay back.', 'Nóng! Lùi xa ra.'],
    hint: ["Hmm… wait! Look, steam! It's hot!", 'Ơ… khoan! Bốc hơi kìa! Nóng đấy!'],
    look: ['Hmm… so close to the pot? Look again!', 'Ơ… đứng sát nồi à? Nhìn lại nhé!'],
    set: [S('counter', 72, 94, 30), S('pot', 72, 64, 16, { cls: 'steam' }), S('line', 22, 97, 4)],
    walk: 52,
    fix: { how: 'drag', item: 'bong', target: 'line', say: ['Move me back! To the yellow line.', 'Kéo tớ lùi lại, ra vạch vàng nhé!'] },
    done: [['move', 'bong', 18, 94]],
  },
  {
    id: 'medicine', topic: 'kitchen', kind: 'no', scene: 'kitchen', emoji: '💊',
    ask: ['A pill! Can I eat it?', 'Viên thuốc! Tớ ăn được không?'],
    why: ['No! Ask Mommy first.', 'Không! Hỏi mẹ trước nhé. Thuốc chỉ uống khi bố mẹ cho.'],
    short: ['Ask Mommy!', 'Hỏi mẹ!'],
    hint: ["Hmm… wait! It's medicine!", 'Ơ… khoan! Là thuốc đấy!'],
    look: ['Hmm… eating medicine? Look again!', 'Ơ… tự ăn thuốc à? Nhìn lại nhé!'],
    set: [S('counter', 64, 94, 30), S('medicine', 64, 64, 12), S('shelf', 64, 28, 8), S('mummy', 90, 94, 52)],
    walk: 44,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 78, 94], ['move', 'medicine', 64, 22]],
  },
  {
    id: 'wash-hands', topic: 'kitchen', kind: 'yes', scene: 'kitchen', emoji: '🧼',
    ask: ['Wash my hands first?', 'Rửa tay trước nhé?'],
    why: ['Yes! Wash hands, then eat.', 'Đúng rồi! Rửa tay rồi mới ăn.'],
    short: ['Clean hands!', 'Tay sạch!'],
    hint: ["It's OK! Washing hands is good.", 'Không sao đâu! Rửa tay là tốt mà.'],
    look: ['Hmm… dirty hands? Look again!', 'Ơ… tay bẩn à? Nhìn lại nhé!'],
    set: [S('sink', 66, 94, 34), S('tap', 66, 58, 12), S('soap', 80, 64, 8), S('bubbles', 56, 60, 14, { hidden: true })],
    walk: 48,
    fix: { how: 'tap', target: 'tap', say: ['Tap the water!', 'Chạm vào vòi nước nhé!'] },
    done: [['add', 'tap', 'on'], ['show', 'bubbles'], ['add', 'bong', 'hop']],
  },

  // ---------- 🏠 Trong nhà ----------
  {
    id: 'socket', topic: 'home', kind: 'no', scene: 'room', emoji: '🔌',
    ask: ['Can I touch it?', 'Tớ sờ ổ điện được không?'],
    why: ["No! Don't touch! Call Mommy.", 'Không! Đừng sờ ổ điện! Gọi mẹ nhé.'],
    short: ["Don't touch!", 'Đừng sờ!'],
    hint: ['Hmm… wait! Sockets are not toys!', 'Ơ… khoan! Ổ điện không phải đồ chơi!'],
    look: ['Hmm… touching the socket? Look again!', 'Ơ… sờ ổ điện à? Nhìn lại nhé!'],
    // Mẹ đậy nắp an toàn (bé không tự ấn đồ vào ổ điện, kể cả nắp nhựa).
    set: [S('socket', 66, 76, 12), S('cover', 66, 76, 12, { hidden: true }), S('mummy', 90, 94, 52)],
    walk: 50,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 78, 94], ['show', 'cover'], ['move', 'bong', 34, 94]],
  },
  {
    id: 'window', topic: 'home', kind: 'no', scene: 'room', emoji: '🪟',
    ask: ['Can I climb up?', 'Tớ trèo lên được không?'],
    why: ['No! Get down. Call Mommy.', 'Không! Xuống đi. Gọi mẹ nhé.'],
    short: ['Get down!', 'Xuống thôi!'],
    hint: ['Hmm… wait! The window is high!', 'Ơ… khoan! Cửa sổ cao lắm!'],
    look: ['Hmm… climbing? Look again!', 'Ơ… trèo à? Nhìn lại nhé!'],
    set: [S('window', 70, 58, 38), S('stool', 70, 94, 16), S('mummy', 92, 94, 52)],
    walk: 56,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 76, 94], ['move', 'bong', 50, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'fan', topic: 'home', kind: 'no', scene: 'room', emoji: '🌀',
    ask: ['Can I touch the fan?', 'Tớ sờ cái quạt được không?'],
    why: ['No! Fingers away! Stay back.', 'Không! Để tay xa quạt! Lùi ra nhé.'],
    short: ['Fingers away!', 'Tay để xa!'],
    hint: ["Hmm… wait! It's spinning fast!", 'Ơ… khoan! Quạt quay nhanh lắm!'],
    look: ['Hmm… so close to the fan? Look again!', 'Ơ… sát quạt thế à? Nhìn lại nhé!'],
    set: [S('fan', 72, 94, 44), S('rug', 22, 97, 5)],
    walk: 52,
    fix: { how: 'drag', item: 'bong', target: 'rug', say: ['Move me back! To the rug.', 'Kéo tớ lùi ra tấm thảm nhé!'] },
    done: [['move', 'bong', 22, 94]],
  },
  {
    id: 'lighter', topic: 'home', kind: 'no', scene: 'room', emoji: '🔥',
    ask: ['Can I play with it?', 'Tớ nghịch bật lửa được không?'],
    why: ["No! Don't touch! Call Daddy.", 'Không! Đừng sờ bật lửa! Gọi bố nhé.'],
    short: ["Don't touch! Call Daddy.", 'Đừng sờ! Gọi bố.'],
    hint: ['Hmm… wait! It makes fire!', 'Ơ… khoan! Nó ra lửa đấy!'],
    look: ['Hmm… a lighter? Look again!', 'Ơ… nghịch bật lửa à? Nhìn lại nhé!'],
    set: [S('table', 62, 94, 22), S('lighter', 62, 72, 10), S('shelf', 62, 30, 8), S('daddy', 90, 94, 54)],
    walk: 42,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'daddy', 78, 94], ['move', 'lighter', 62, 24]],
  },
  {
    id: 'small-toy', topic: 'home', kind: 'no', scene: 'room', emoji: '🔵',
    ask: ['Can I put it in my mouth?', 'Tớ cho vào miệng được không?'],
    why: ['No! Not in your mouth. Call Daddy.', 'Không! Không cho vào miệng. Gọi bố nhé.'],
    short: ['Not in your mouth!', 'Không cho vào miệng!'],
    hint: ["Hmm… wait! It's so small!", 'Ơ… khoan! Nó bé tí ấy!'],
    look: ['Hmm… in the mouth? Look again!', 'Ơ… cho vào miệng à? Nhìn lại nhé!'],
    // Bé không tự nhặt đồ nhỏ (dễ hóc): gọi bố tới cất.
    set: [S('marble', 58, 94, 7), S('toybox', 80, 94, 18), S('daddy', 94, 94, 54)],
    walk: 42,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'daddy', 68, 94], ['move', 'marble', 80, 82], ['hide', 'marble'], ['add', 'toybox', 'full']],
  },
  {
    id: 'stairs', topic: 'home', kind: 'yes', scene: 'room', emoji: '👣',
    ask: ["Stairs! Hold Mommy's hand?", 'Cầu thang! Nắm tay mẹ nhé?'],
    why: ["Yes! Hold Mommy's hand. Walk slowly.", 'Đúng rồi! Nắm tay mẹ. Đi chậm thôi.'],
    short: ['Hold hands! Slowly.', 'Nắm tay! Đi chậm.'],
    hint: ["It's OK! Mommy helps on the stairs.", 'Không sao đâu! Mẹ giúp tớ đi cầu thang mà.'],
    look: ['Hmm… stairs alone? Look again!', 'Ơ… đi cầu thang một mình à? Nhìn lại nhé!'],
    set: [S('stairs', 74, 94, 62), S('mummy', 26, 94, 52)],
    walk: 44,
    fix: { how: 'tap', target: 'mummy', say: ["Tap Mommy's hand!", 'Chạm tay mẹ nhé!'] },
    done: [['move', 'mummy', 34, 94], ['add', 'bong', 'hold'], ['move', 'mummy', 52, 90], ['move', 'bong', 60, 86]],
  },

  // ---------- 🚦 Trên đường (người lớn quyết định lúc qua; đèn xanh không có nghĩa là bé tự qua) ----------
  {
    id: 'cross-alone', topic: 'road', kind: 'no', scene: 'street', emoji: '🚸',
    ask: ['Can I cross the road?', 'Tớ qua đường được không?'],
    why: ["No! Hold Mommy's hand.", 'Không! Nắm tay mẹ, mẹ dắt qua nhé.'],
    short: ['Hold hands!', 'Nắm tay!'],
    hint: ['Hmm… wait! Cars on the road!', 'Ơ… khoan! Đường có xe mà!'],
    look: ['Hmm… alone? Look again!', 'Ơ… một mình à? Nhìn lại nhé!'],
    set: [S('car', 86, 66, 14), S('mummy', 10, 94, 52), S('hands', 19, 86, 9, { hidden: true })],
    walk: 40,
    fix: { how: 'tap', target: 'mummy', say: ["Tap Mommy's hand!", 'Chạm tay mẹ nhé!'] },
    done: [['move', 'bong', 28, 94], ['add', 'bong', 'hold'], ['show', 'hands']],
  },
  {
    id: 'ball-road', topic: 'road', kind: 'no', scene: 'street', emoji: '⚽',
    ask: ['My ball! Can I get it?', 'Bóng của tớ! Tớ chạy ra nhặt được không?'],
    why: ['Stop! Stay here! Ask Daddy.', 'Dừng lại! Đứng yên đây! Nhờ bố nhặt nhé.'],
    short: ['Stay here!', 'Đứng yên!'],
    hint: ['Hmm… wait! The ball is on the road!', 'Ơ… khoan! Bóng ở dưới đường!'],
    look: ['Hmm… running to the road? Look again!', 'Ơ… chạy ra đường à? Nhìn lại nhé!'],
    set: [S('ball', 62, 66, 10), S('daddy', 90, 94, 54)],
    walk: 40,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'daddy', 66, 94], ['move', 'ball', 52, 92]],
  },
  {
    id: 'helmet', topic: 'road', kind: 'yes', scene: 'street', emoji: '🛵',
    ask: ['Helmet on?', 'Đội mũ bảo hiểm nhé?'],
    why: ['Yes! Helmet on!', 'Đúng rồi! Đội mũ vào!'],
    short: ['Helmet on! Click!', 'Đội mũ! Cạch!'],
    hint: ["It's OK! A helmet keeps me safe.", 'Không sao đâu! Mũ bảo hiểm giữ tớ an toàn mà.'],
    look: ['Hmm… no helmet? Look again!', 'Ơ… không đội mũ à? Nhìn lại nhé!'],
    // Bé đội mũ cho Bông; bố cài quai ("click") — bé không phải tự kiểm tra quai.
    set: [S('scooter', 76, 94, 32), S('helmet', 26, 94, 14), S('daddy', 91, 94, 54)],
    walk: 50,
    fix: { how: 'drag', item: 'helmet', target: 'bong', say: ['Put the helmet on me!', 'Đội mũ cho tớ nhé!'] },
    done: [['move', 'helmet', 50, 72], ['add', 'helmet', 'worn'], ['move', 'daddy', 66, 94], ['add', 'helmet', 'click']],
  },
  {
    id: 'seat-belt', topic: 'road', kind: 'yes', scene: 'street', emoji: '🚗',
    ask: ['Seat belt on?', 'Thắt dây an toàn nhé?'],
    why: ['Yes! Daddy clicks it.', 'Đúng rồi! Bố thắt dây cho nhé.'],
    short: ['Seat belt on! Click!', 'Thắt dây! Cạch!'],
    hint: ["It's OK! A seat belt keeps me safe.", 'Không sao đâu! Dây an toàn giữ tớ an toàn mà.'],
    look: ['Hmm… no seat belt? Look again!', 'Ơ… không thắt dây à? Nhìn lại nhé!'],
    // Bố thắt dây (bé không phải tự cài).
    set: [S('carseat', 56, 94, 50), S('belt', 56, 92, 14, { hidden: true }), S('daddy', 92, 94, 54)],
    walk: 56,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'daddy', 78, 94], ['show', 'belt'], ['add', 'belt', 'worn']],
  },
  {
    id: 'hold-hands', topic: 'road', kind: 'yes', scene: 'street', emoji: '🤝',
    ask: ["Hold Daddy's hand?", 'Nắm tay bố nhé?'],
    why: ['Yes! Hold hands outside.', 'Đúng rồi! Ra đường thì nắm tay nhé.'],
    short: ['Hold hands!', 'Nắm tay!'],
    hint: ["It's OK! Holding hands keeps me safe.", 'Không sao đâu! Nắm tay bố là an toàn mà.'],
    look: ['Hmm… alone on the street? Look again!', 'Ơ… đi một mình à? Nhìn lại nhé!'],
    set: [S('daddy', 74, 94, 54), S('car', 86, 66, 14), S('hands', 65, 86, 9, { hidden: true })],
    walk: 44,
    fix: { how: 'tap', target: 'daddy', say: ["Tap Daddy's hand!", 'Chạm tay bố nhé!'] },
    done: [['move', 'bong', 56, 94], ['add', 'bong', 'hold'], ['show', 'hands']],
  },

  // ---------- 🚪 Người lạ (vẽ bình thường, mỉm cười; không dùng he / she; Mommy luôn ở gần) ----------
  {
    id: 'door', topic: 'stranger', kind: 'no', scene: 'hall', emoji: '🚪', sound: 'doorbell',
    ask: ['Ding dong! Open the door?', 'Kính coong! Tớ mở cửa nhé?'],
    why: ['No! Call Mommy first.', 'Không! Gọi mẹ trước nhé.'],
    short: ['Call Mommy first!', 'Gọi mẹ trước!'],
    hint: ['Hmm… wait! Who is it?', 'Ơ… khoan! Ai thế nhỉ?'],
    look: ['Hmm… opening the door alone? Look again!', 'Ơ… tự mở cửa à? Nhìn lại nhé!'],
    set: [S('door', 74, 94, 66), S('mummy', 10, 94, 52)],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 60, 94], ['move', 'bong', 30, 94]],
  },
  {
    id: 'candy', topic: 'stranger', kind: 'no', scene: 'park', emoji: '🍬',
    ask: ['Candy! Can I take it?', 'Kẹo! Tớ cầm được không?'],
    why: ['No, thank you! Ask Mommy first.', 'Không, cảm ơn! Hỏi mẹ trước đã.'],
    short: ['No, thank you!', 'Không, cảm ơn!'],
    hint: ["Hmm… wait! I don't know that person!", 'Ơ… khoan! Tớ không quen người đó!'],
    look: ['Hmm… taking the candy? Look again!', 'Ơ… cầm kẹo của người lạ à? Nhìn lại nhé!'],
    set: [S('stranger', 82, 94, 50), S('candy', 70, 62, 9), S('mummy', 8, 94, 52)],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'bong', 22, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'go-with', topic: 'stranger', kind: 'no', scene: 'park', emoji: '🙅',
    ask: ['Can I go with them?', 'Tớ đi theo người đó được không?'],
    why: ['No! Stay with Mommy.', 'Không! Ở cạnh mẹ nhé.'],
    short: ['Stay with Mommy!', 'Ở cạnh mẹ!'],
    hint: ["Hmm… wait! I don't know that person!", 'Ơ… khoan! Tớ không quen người đó!'],
    look: ['Hmm… going away from Mommy? Look again!', 'Ơ… rời mẹ đi à? Nhìn lại nhé!'],
    set: [S('stranger', 84, 94, 50), S('mummy', 8, 94, 52)],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'bong', 20, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'tell', topic: 'stranger', kind: 'yes', scene: 'hall', emoji: '🤗',
    ask: ['I feel scared. Tell Mommy?', 'Tớ thấy sợ. Kể với mẹ nhé?'],
    why: ['Yes! Tell Mommy. Mommy can help.', 'Đúng rồi! Kể với mẹ. Mẹ sẽ giúp.'],
    short: ['Tell Mommy!', 'Kể với mẹ!'],
    hint: ["It's OK! Mommy wants to know.", 'Không sao đâu! Mẹ muốn biết mà.'],
    look: ['Hmm… keeping it a secret? Look again!', 'Ơ… giấu không kể à? Nhìn lại nhé!'],
    set: [S('mummy', 74, 94, 54), S('hug', 62, 40, 12, { hidden: true })],
    walk: 46,
    fix: { how: 'tap', target: 'mummy', say: ['Tap Mommy!', 'Chạm vào mẹ nhé!'] },
    done: [['move', 'bong', 60, 94], ['show', 'hug'], ['add', 'bong', 'hop']],
  },
  // ---------- 🚨 Khi có cháy (bố mẹ thêm, draft5): không có lửa trên người / nhà cháy — chỉ chuông báo + khói xám ----------
  {
    id: 'fire-low', topic: 'fire', kind: 'yes', scene: 'smoke', emoji: '🚨', sound: 'alarm',
    ask: ['Beep beep! Smoke! Get low?', 'Bíp bíp! Có khói! Cúi thấp xuống nhé?'],
    why: ['Yes! Get low. Cover your mouth.', 'Đúng rồi! Cúi thấp. Che miệng lại.'],
    short: ['Get low!', 'Cúi thấp!'],
    hint: ["It's OK! Smoke goes up. Get low!", 'Không sao đâu! Khói bay lên cao, mình cúi thấp!'],
    look: ['Hmm… standing up tall? Look again!', 'Ơ… đứng thẳng à? Nhìn lại nhé!'],
    set: [S('alarm', 20, 22, 12, { cls: 'ring' }), S('door', 84, 94, 62), S('mummy', 68, 94, 52)],
    walk: 40,
    fix: { how: 'tap', target: 'bong', say: ['Tap me! Get low.', 'Chạm vào tớ để cúi thấp nhé!'] },
    done: [['add', 'bong', 'low']],
  },
  {
    id: 'fire-hide', topic: 'fire', kind: 'no', scene: 'smoke', emoji: '🛏️', sound: 'alarm',
    ask: ['Smoke! Can I hide under the bed?', 'Có khói! Tớ trốn dưới gầm giường được không?'],
    why: ["No! Don't hide. Go out with Mommy.", 'Không! Đừng trốn. Đi ra ngoài cùng mẹ nhé.'],
    short: ["Don't hide! Go out!", 'Đừng trốn! Ra ngoài!'],
    hint: ["Hmm… wait! Mommy can't find me there!", 'Ơ… khoan! Trốn thì mẹ không tìm thấy tớ!'],
    look: ['Hmm… hiding? Look again!', 'Ơ… trốn à? Nhìn lại nhé!'],
    set: [S('alarm', 20, 22, 12, { cls: 'ring' }), S('bed', 70, 94, 26), S('mummy', 8, 94, 52)],
    walk: 54,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 30, 94], ['add', 'bong', 'low'], ['move', 'bong', 40, 94], ['move', 'mummy', -20, 94], ['move', 'bong', -10, 94]],
    card: [['move', 'mummy', 30, 94], ['add', 'bong', 'low'], ['add', 'bong', 'hold'], ['move', 'bong', 42, 94]],
  },
  {
    id: 'fire-out', topic: 'fire', kind: 'yes', scene: 'smoke', emoji: '🚪', sound: 'alarm',
    ask: ['Go out with Mommy?', 'Đi ra ngoài cùng mẹ nhé?'],
    why: ['Yes! Follow Mommy out.', 'Đúng rồi! Theo mẹ ra ngoài. Cúi thấp nhé.'],
    short: ['Go out!', 'Ra ngoài!'],
    hint: ["It's OK! Outside is safe.", 'Không sao đâu! Ra ngoài là an toàn.'],
    look: ['Hmm… staying inside? Look again!', 'Ơ… ở lại trong nhà à? Nhìn lại nhé!'],
    set: [S('alarm', 20, 22, 12, { cls: 'ring' }), S('door', 84, 94, 62), S('exit', 84, 24, 10), S('mummy', 70, 94, 52)],
    walk: 42,
    fix: { how: 'tap', target: 'mummy', say: ["Tap Mommy's hand!", 'Chạm tay mẹ nhé!'] },
    done: [['add', 'bong', 'low'], ['add', 'bong', 'hold'], ['move', 'bong', 62, 94], ['move', 'mummy', 120, 94], ['move', 'bong', 112, 94]],
    card: [['add', 'bong', 'low'], ['add', 'bong', 'hold'], ['move', 'bong', 62, 94]],
  },
  {
    id: 'fire-back', topic: 'fire', kind: 'no', scene: 'yard', emoji: '🧸',
    ask: ['My teddy! Can I go back in?', 'Gấu bông của tớ! Tớ chạy vào lấy được không?'],
    why: ['No! Stay outside with Mommy.', 'Không! Ở ngoài cùng mẹ nhé. Chú lính cứu hỏa sẽ lo.'],
    short: ['Stay outside!', 'Ở ngoài!'],
    hint: ['Hmm… wait! Inside is smoky!', 'Ơ… khoan! Trong nhà toàn khói!'],
    look: ['Hmm… going back in? Look again!', 'Ơ… quay vào nhà à? Nhìn lại nhé!'],
    set: [S('house', 74, 94, 60), S('truck', 40, 94, 22), S('mummy', 8, 94, 52)],
    walk: 58,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'bong', 20, 94], ['add', 'bong', 'hold']],
  },

  // ---------- 🛒 Ở siêu thị (S2): đứng yên, nhờ cô ở quầy, không đi theo ai ----------
  {
    id: 'hide-shop', topic: 'shop', kind: 'no', scene: 'shop', emoji: '🙈',
    ask: ['Can I hide here?', 'Tớ trốn ở đây được không?'],
    why: ['No! Stay with Mommy.', 'Không! Ở cạnh mẹ nhé. Trốn thì mẹ không thấy tớ.'],
    short: ['Stay with Mommy!', 'Ở cạnh mẹ!'],
    hint: ["Hmm… wait! Mommy can't see me!", 'Ơ… khoan! Mẹ không nhìn thấy tớ!'],
    look: ['Hmm… hiding alone? Look again!', 'Ơ… trốn một mình à? Nhìn lại nhé!'],
    set: [S('aisle', 66, 94, 58, { cls: 'front' }), S('cart', 84, 94, 22), S('mummy', 92, 94, 52)],
    walk: 54,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 30, 94], ['move', 'cart', 44, 94], ['move', 'bong', 18, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'run-off', topic: 'shop', kind: 'no', scene: 'shop', emoji: '🏃',
    ask: ['Toys! Can I run there?', 'Đồ chơi kìa! Tớ chạy ra đó được không?'],
    why: ['No! Wait for Mommy.', 'Không! Chờ mẹ đi cùng nhé.'],
    short: ['Wait for Mommy!', 'Chờ mẹ!'],
    hint: ['Hmm… wait! Mommy is here!', 'Ơ… khoan! Mẹ ở đây mà!'],
    look: ['Hmm… running off alone? Look again!', 'Ơ… chạy đi một mình à? Nhìn lại nhé!'],
    set: [S('toyshelf', 82, 94, 46), S('mummy', 8, 94, 52)],
    walk: 50,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 30, 94], ['add', 'bong', 'hold'], ['move', 'mummy', 52, 94], ['move', 'bong', 62, 94]],
  },
  {
    id: 'lost', topic: 'shop', kind: 'yes', scene: 'shop', emoji: '🧍',
    ask: ["Where's Mommy? Stay here?", 'Mẹ đâu rồi? Tớ đứng yên đây nhé?'],
    why: ['Yes! Stay here. Ask for help.', 'Đúng rồi! Đứng yên đây. Nhờ cô ở quầy giúp.'],
    short: ['Stay here!', 'Đứng yên!'],
    hint: ["It's OK! Stay here. Mommy comes back.", 'Không sao đâu! Đứng yên thì mẹ sẽ quay lại tìm.'],
    look: ['Hmm… walking away? Look again!', 'Ơ… đi lung tung à? Nhìn lại nhé!'],
    // Quầy vẽ ngay cạnh Bông, cô đứng sau quầy (không dựa vào đồng phục); bé không đi theo ai.
    set: [S('cashier', 50, 70, 20), S('desk', 50, 94, 28), S('mummy', 120, 94, 52, { hidden: true })],
    walk: 30,
    fix: { how: 'tap', target: 'desk', say: ['Tap the desk! Ask for help.', 'Chạm vào quầy để nhờ cô giúp nhé!'] },
    done: [['add', 'cashier', 'hop'], ['show', 'mummy'], ['move', 'mummy', 78, 94], ['add', 'bong', 'hop']],
    // Tranh chưa an toàn: Bông đi lang thang xa quầy.
    risky: [['move', 'bong', 84, 94]],
  },

  // ---------- 💧 Gần nước (S2): không tự lại gần nước, không tự lấy đồ dưới nước; luôn sát bố mẹ ----------
  {
    id: 'pool-alone', topic: 'water', kind: 'no', scene: 'pool', emoji: '🏊',
    ask: ['Can I jump in?', 'Tớ nhảy xuống bể được không?'],
    why: ["No! Hold Daddy's hand near water.", 'Không! Gần nước thì nắm tay bố nhé.'],
    short: ['Hold hands near water!', 'Gần nước, nắm tay!'],
    hint: ['Hmm… wait! Where is Daddy?', 'Ơ… khoan! Bố đâu rồi?'],
    look: ['Hmm… alone by the water? Look again!', 'Ơ… một mình cạnh bể à? Nhìn lại nhé!'],
    set: [S('pool', 82, 100, 26, { cls: 'front' }), S('daddy', 8, 94, 54)],
    walk: 40,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'daddy', 18, 94], ['move', 'bong', 38, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'pond', topic: 'water', kind: 'no', scene: 'pond', emoji: '🐟',
    ask: ['Fish! Can I go close?', 'Cá kìa! Tớ lại gần được không?'],
    why: ["No! Stay back. Hold Mommy's hand.", 'Không! Đứng xa ra. Nắm tay mẹ nhé.'],
    short: ['Stay back!', 'Đứng xa ra!'],
    hint: ['Hmm… wait! The water is deep!', 'Ơ… khoan! Nước sâu lắm!'],
    look: ['Hmm… so close to the water? Look again!', 'Ơ… sát mép nước thế à? Nhìn lại nhé!'],
    set: [S('pondwater', 80, 100, 26, { cls: 'front' }), S('fish', 80, 86, 9, { cls: 'float' }), S('mummy', 8, 94, 52)],
    walk: 50,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'mummy', 22, 94], ['move', 'bong', 32, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'pond-toy', topic: 'water', kind: 'no', scene: 'pond', emoji: '⚽',
    ask: ['My toy! Can I get it?', 'Đồ chơi rơi xuống nước rồi! Tớ lấy được không?'],
    why: ['No! Stay back. Call Daddy.', 'Không! Đứng xa ra. Gọi bố lấy giúp nhé.'],
    short: ['Stay back! Call Daddy.', 'Đứng xa! Gọi bố.'],
    hint: ['Hmm… wait! The water is deep!', 'Ơ… khoan! Nước sâu lắm!'],
    look: ['Hmm… reaching into the water? Look again!', 'Ơ… với xuống nước à? Nhìn lại nhé!'],
    // Bố lấy đồ bằng cây sào; Bông đứng xa mép nước.
    set: [S('pondwater', 80, 100, 26, { cls: 'front' }), S('ball', 80, 90, 9, { id: 'toy', cls: 'float' }), S('pole', 65, 90, 24, { hidden: true }), S('daddy', 8, 94, 54)],
    walk: 48,
    fix: { how: 'tap', target: 'daddy', say: CALL_DADDY },
    done: [['move', 'bong', 18, 94], ['move', 'daddy', 46, 94], ['show', 'pole'], ['move', 'toy', 56, 94], ['hide', 'pole'], ['add', 'bong', 'hop']],
    card: [['move', 'bong', 18, 94], ['move', 'daddy', 46, 94], ['show', 'pole']],
  },
  {
    id: 'swim-with', topic: 'water', kind: 'yes', scene: 'pool', emoji: '🛟',
    ask: ['Swim with Daddy?', 'Bơi cùng bố nhé?'],
    why: ['Yes! Stay with Daddy.', 'Đúng rồi! Ở sát cạnh bố nhé.'],
    short: ['Stay with Daddy!', 'Ở cạnh bố!'],
    hint: ["It's OK! Daddy is with me.", 'Không sao đâu! Có bố ở cạnh mà.'],
    look: ['Hmm… swimming alone? Look again!', 'Ơ… bơi một mình à? Nhìn lại nhé!'],
    // Bố xuống bể trước, sát cạnh; phao tay chỉ minh họa (không thay được bố mẹ). Không có cảnh Bông một mình dưới nước.
    set: [S('pool', 82, 100, 26, { cls: 'front' }), S('daddy', 30, 94, 54), S('armbands', 66, 82, 6, { hidden: true })],
    walk: 42,
    fix: { how: 'tap', target: 'daddy', say: ["Tap Daddy's hand!", 'Chạm tay bố nhé!'] },
    done: [['move', 'daddy', 84, 98], ['move', 'bong', 66, 90], ['add', 'bong', 'hold'], ['show', 'armbands']],
  },

  // ---------- 🐕 Chó lạ (S2): chó vẽ thân thiện nhưng không quá dễ thương; đứng cạnh mẹ nhìn từ xa ----------
  {
    id: 'dog', topic: 'dog', kind: 'no', scene: 'park', emoji: '🐕',
    ask: ['A doggy! Can I pet it?', 'Chó kìa! Tớ vuốt được không?'],
    why: ['Wait! Stay with Mommy.', 'Khoan đã! Đứng cạnh mẹ, nhìn từ xa thôi.'],
    short: ['Wait! Stay with Mommy.', 'Khoan! Ở cạnh mẹ.'],
    hint: ["Hmm… wait! I don't know that doggy!", 'Ơ… khoan! Tớ không quen chú chó này!'],
    look: ['Hmm… touching the doggy? Look again!', 'Ơ… sờ chó lạ à? Nhìn lại nhé!'],
    set: [S('dog', 78, 94, 18), S('mummy', 8, 94, 52)],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'bong', 24, 94], ['add', 'bong', 'hold'], ['move', 'dog', 120, 94]],
    card: [['move', 'bong', 24, 94], ['add', 'bong', 'hold']],
  },
  {
    id: 'dog-eat', topic: 'dog', kind: 'no', scene: 'yard', emoji: '🦴',
    ask: ['Doggy is eating. Can I pet it?', 'Chú chó đang ăn. Tớ vuốt được không?'],
    why: ['No! Let the doggy eat.', 'Không! Để chú chó ăn yên nhé. Chó đang ăn dễ cắn lắm.'],
    short: ['Let it eat!', 'Để chó ăn!'],
    hint: ['Hmm… wait! The doggy is eating!', 'Ơ… khoan! Chú chó đang ăn mà!'],
    look: ['Hmm… touching an eating doggy? Look again!', 'Ơ… sờ chó đang ăn à? Nhìn lại nhé!'],
    set: [S('bowl', 70, 94, 7), S('dog', 79, 94, 18), S('mummy', 8, 94, 52), S('ball', 40, 92, 10, { hidden: true })],
    walk: 50,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['move', 'bong', 24, 94], ['add', 'bong', 'hold'], ['show', 'ball'], ['add', 'bong', 'hop']],
  },
  {
    // Chó chạy lại gần: đứng yên "như cái cây", không chạy, không la — bé chạm Bông; chó ngửi rồi đi, mẹ tới.
    id: 'dog-still', topic: 'dog', kind: 'yes', scene: 'park', emoji: '🌳',
    ask: ["Doggy's coming! Stand still?", 'Chó chạy lại kìa! Tớ đứng yên nhé?'],
    why: ['Yes! Stand still like a tree.', 'Đúng rồi! Đứng yên như cái cây. Không chạy, không hét.'],
    short: ['Stand still!', 'Đứng yên!'],
    hint: ["It's OK! Don't run. Stand still.", 'Không sao đâu! Đừng chạy. Đứng yên nhé.'],
    look: ['Hmm… running away? Look again!', 'Ơ… bỏ chạy à? Nhìn lại nhé!'],
    set: [S('dog', 64, 94, 18), S('mummy', 14, 94, 52, { hidden: true })],
    walk: 36,
    fix: { how: 'tap', target: 'bong', say: ['Tap me! Stand still.', 'Chạm vào tớ để đứng yên nhé!'] },
    done: [['add', 'bong', 'still'], ['move', 'dog', 120, 94], ['show', 'mummy']],
    card: [['add', 'bong', 'still'], ['show', 'mummy']],
    // Tranh chưa an toàn: Bông bỏ chạy (💨), chó đuổi theo.
    risky: [['move', 'bong', 22, 94], ['add', 'bong', 'run'], ['move', 'dog', 50, 94]],
  },

  // ---------- 🫶 Cơ thể của bé (SPEC-body, bố mẹ bật) ----------
  // `gentle`: luôn chơi kiểu No / Yes ở mọi mức (không có tranh "chưa an toàn"), câu hỏi tiếng Anh đọc chậm, tiếng Việt luôn đọc
  // (kể cả khi bố mẹ tắt giọng tiếng Việt), không "Oops!". Không có hình người lạ, không có bàn tay trên người Bông.
  // `after`: câu thêm sau câu nhắc lại (kể với bố mẹ là đúng, không phải lỗi của con).
  {
    id: 'private', topic: 'body', kind: 'yes', scene: 'bath', emoji: '🩱', gentle: true,
    ask: ['My swimsuit parts are just for me?', 'Chỗ đồ bơi che là của riêng tớ, đúng không?'],
    why: ['Yes! My body is mine.', 'Đúng rồi! Cơ thể của tớ là của tớ.'],
    short: ['My body is mine!', 'Cơ thể tớ là của tớ!'],
    hint: ["It's OK! My body is mine.", 'Không sao đâu! Cơ thể của tớ là của tớ mà.'],
    look: ['Hmm… my body is mine!', 'Ơ… cơ thể tớ là của tớ mà!'],
    set: [S('towel', 80, 70, 18), S('rack', 80, 76, 6)],
    walk: 46,
    bongCls: 'swim',
    fix: { how: 'drag', item: 'towel', target: 'bong', say: ['Put the towel on me!', 'Quấn khăn cho tớ nhé!'] },
    done: [['move', 'towel', 46, 96], ['add', 'towel', 'worn'], ['add', 'bong', 'hop']],
  },
  {
    id: 'bath-help', topic: 'body', kind: 'yes', scene: 'bath', emoji: '🛁', gentle: true,
    ask: ['Mommy helps me wash. OK?', 'Mẹ giúp tớ tắm, rửa người. Được không?'],
    why: ['Yes! Mommy helps me wash.', 'Được! Mẹ giúp tớ tắm khi tớ cần giúp.'],
    short: ['Mommy helps!', 'Mẹ giúp tớ!'],
    hint: ["It's OK! Mommy helps me wash.", 'Không sao đâu! Mẹ giúp tớ tắm mà.'],
    look: ['Hmm… Mommy helps!', 'Ơ… mẹ giúp tớ mà!'],
    // Bông ngồi trong bồn (bồn vẽ phía trước, chỉ thấy đầu); mẹ đứng cạnh bồn, mặt cười.
    set: [S('tub', 50, 98, 17, { cls: 'front' }), S('duck', 36, 84, 8, { cls: 'float' }), S('foam', 50, 88, 10, { hidden: true }), S('mummy', 84, 94, 52)],
    walk: 50,
    fix: { how: 'tap', target: 'duck', say: ['Tap the duck!', 'Chạm vào chú vịt nhé!'] },
    done: [['show', 'foam'], ['add', 'duck', 'hop'], ['add', 'bong', 'hop']],
  },
  {
    id: 'doctor', topic: 'body', kind: 'yes', scene: 'clinic', emoji: '🩺', gentle: true,
    ask: ['Doctor checks me. Daddy is here. OK?', 'Bác sĩ khám cho tớ, có bố ở cạnh. Được không?'],
    why: ['Yes! Daddy stays with me.', 'Được! Bố ở cạnh tớ. Đau thì tớ nói với bố.'],
    short: ['Daddy is here!', 'Có bố đây!'],
    hint: ["It's OK! Daddy is here.", 'Không sao đâu! Có bố ở đây mà.'],
    look: ['Hmm… Daddy is here!', 'Ơ… có bố ở đây mà!'],
    // Bông ngồi giữa, bố đứng cạnh; bác sĩ chỉ là ống nghe trên bàn (không vẽ người).
    set: [S('desk2', 80, 94, 22), S('stetho', 80, 74, 12), S('daddy', 22, 94, 54)],
    walk: 52,
    fix: { how: 'tap', target: 'daddy', say: ["Tap Daddy's hand!", 'Chạm tay bố nhé!'] },
    done: [['move', 'daddy', 36, 94], ['add', 'bong', 'hold'], ['add', 'stetho', 'hop']],
  },
  {
    id: 'hug-no', topic: 'body', kind: 'no', scene: 'room', emoji: '🙅', gentle: true,
    ask: ['Do I have to hug?', 'Tớ có phải ôm không?'],
    why: ['No! You can say no. High five?', 'Không! Không muốn thì con được nói không. Đập tay nhé?'],
    short: ['High five!', 'Đập tay!'],
    hint: ['Hmm… I can say no!', 'Ơ… tớ được nói không mà!'],
    look: ['Hmm… I can say no!', 'Ơ… tớ được nói không mà!'],
    // Không nói người hỏi là ai, không có hình người lớn; đập tay là một lựa chọn (gợi ý bố mẹ: vẫy tay, "bye" cũng được).
    set: [S('hugbub', 80, 56, 24), S('five', 68, 80, 12, { hidden: true })],
    reveal: ['five'],
    walk: 46,
    fix: { how: 'tap', target: 'five', say: ['High five! Tap the hand.', 'Đập tay nào! Chạm vào bàn tay nhé.'] },
    done: [['hide', 'hugbub'], ['add', 'five', 'hop'], ['add', 'bong', 'hop']],
  },
  {
    id: 'secret', topic: 'body', kind: 'no', scene: 'room', emoji: '🤫', gentle: true,
    ask: ["Someone says, 'Keep a secret.' OK?", 'Có người bảo: đừng kể với ai nhé. Được không?'],
    why: ['No! Tell Mommy.', 'Không! Ai bảo con giấu chuyện về cơ thể thì con kể với bố mẹ nhé.'],
    short: ['Tell Mommy!', 'Kể với mẹ!'],
    hint: ['Hmm… I can tell Mommy!', 'Ơ… tớ kể với mẹ được mà!'],
    look: ['Hmm… I can tell Mommy!', 'Ơ… tớ kể với mẹ được mà!'],
    set: [S('shhbub', 80, 56, 24), S('mummy', 10, 94, 52), S('hug', 26, 40, 12, { hidden: true })],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['hide', 'shhbub'], ['move', 'bong', 30, 94], ['show', 'hug'], ['add', 'bong', 'hop']],
    after: ["You did right. It's not your fault.", 'Con kể là đúng rồi. Không phải lỗi của con.'],
  },
  {
    id: 'no-touch', topic: 'body', kind: 'no', scene: 'yard', emoji: '🙋', gentle: true,
    ask: ['Someone touches my swimsuit parts. OK?', 'Có người chạm vào chỗ đồ bơi che của tớ. Được không?'],
    why: ['No! Say NO. Tell Mommy.', 'Không! Nói thật to: Không! Rồi kể với bố mẹ, hoặc người lớn con tin.'],
    short: ['No! Tell Mommy!', 'Không! Kể với mẹ!'],
    hint: ['Hmm… I can say NO!', 'Ơ… tớ được nói Không mà!'],
    look: ['Hmm… I can say NO!', 'Ơ… tớ được nói Không mà!'],
    // Chỉ Bông + bong bóng ❓ — không vẽ người kia, không vẽ cảnh chạm.
    set: [S('askbub', 80, 56, 24), S('mummy', 10, 94, 52), S('hug', 26, 40, 12, { hidden: true })],
    walk: 52,
    fix: { how: 'tap', target: 'mummy', say: CALL_MOMMY },
    done: [['hide', 'askbub'], ['move', 'bong', 30, 94], ['show', 'hug'], ['add', 'bong', 'hop']],
    after: ["You did right. It's not your fault.", 'Con kể là đúng rồi. Không phải lỗi của con.'],
  },
];
export const RULE_BY_ID = new Map(RULES.map((r) => [r.id, r]));
export const BONG_START = 16;

/** Hình người lớn (chỗ chạm "gọi bố mẹ"). */
export const ADULTS = new Set(['mummy', 'daddy']);
/** Đồ bé không bao giờ kéo / cầm (mục 5, review 3+): đồ nguy hiểm, đồ nhỏ dễ hóc, nắp ổ điện, dây an toàn (bố mẹ cài). */
export const DANGEROUS = new Set(['knife', 'pot', 'medicine', 'socket', 'cover', 'lighter', 'fan', 'marble', 'stranger', 'candy', 'belt']);

/** Các hình của cảnh lúc bắt đầu (Bông ở x = 16). */
export function sceneStart(rule) {
  return [...rule.set, ...(rule.extra ?? []), S('bong', BONG_START, 94, 44, rule.bongCls ? { cls: rule.bongCls } : {})].map((s) => ({ ...s }));
}
/** Áp một việc `done` lên danh sách hình (bản sao). Trả về { sprites, scene }. */
export function applyOps(sprites, ops, sceneCls = []) {
  const out = sprites.map((s) => ({ ...s, cls: s.cls }));
  const scene = [...sceneCls];
  const get = (id) => out.find((s) => s.id === id);
  for (const [op, id, a, b] of ops) {
    if (op === 'scene') scene.push(id);
    const s = get(id);
    if (!s) continue;
    if (op === 'move') Object.assign(s, { x: a, y: b });
    if (op === 'show') s.hidden = false;
    if (op === 'hide') s.hidden = true;
    if (op === 'add') s.cls = [s.cls, a].filter(Boolean).join(' ');
  }
  return { sprites: out, scene };
}
/**
 * Cảnh vẽ trong thẻ mức 2: 'risky' = Bông một mình vừa đi tới (lúc định làm, chưa làm gì; không có bố mẹ);
 * 'safe' = sau thao tác sửa. Việc nên làm (✅): 'risky' là chưa làm (chưa đội mũ, TV vẫn bật…).
 * Hai tranh khác nhau ở hành động / có bố mẹ hay không — nhìn là thấy (review 3+).
 */
export function sceneAt(rule, which) {
  const start = applyOps(sceneStart(rule), [['move', 'bong', rule.walk, 94]]);
  if (which === 'risky') {
    // `risky`: tranh chưa an toàn riêng của tình huống (vd. `lost`: Bông đi lang thang xa quầy).
    const r = applyOps(start.sprites, rule.risky ?? [], start.scene);
    return { ...r, sprites: r.sprites.map((s) => (ADULTS.has(s.k) ? { ...s, hidden: true } : s)) };
  }
  const fixOps = rule.fix.how === 'drag' ? dragOps(rule) : [];
  // `card`: cảnh an toàn vẽ trong thẻ khi `done` đưa người ra khỏi khung (đi ra ngoài lúc có cháy).
  return applyOps(start.sprites, [...fixOps, ...(rule.card ?? rule.done)], start.scene);
}
/** Kéo xong: đồ kéo về đúng chỗ đích (Bông về chỗ đích; mũ / dây lên người Bông được vẽ bằng class 'worn'). */
export function dragOps(rule) {
  const { item, target } = rule.fix;
  if (target === 'bong') return [];
  if (item === 'bong') return []; // vị trí cuối của Bông nằm trong `done`
  const t = [...rule.set, ...(rule.extra ?? [])].find((s) => s.id === target);
  return t ? [['move', item, t.x, t.y]] : [];
}

// ---------- Dữ liệu lưu (mục 7, 8.1) ----------
/** `safetyGame` → { level, rounds, lock, seen, firstOk, off, focus, optIn }; dữ liệu hỏng thì về mặc định, mã lạ bị bỏ. */
export function cleanSafetyState(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const okLevel = (n) => Number.isInteger(n) && n >= 1 && n <= AUTO_MAX_LEVEL;
  // Mức 3 chỉ có qua khóa mức (bố mẹ chọn); mức tự lên tối đa 2.
  const lock = Number.isInteger(s.lock) && s.lock >= 1 && s.lock <= MAX_LEVEL ? s.lock : null;
  const seen = {};
  if (s.seen && typeof s.seen === 'object') {
    for (const [id, n] of Object.entries(s.seen)) if (RULE_BY_ID.has(id) && Number.isInteger(n) && n > 0) seen[id] = n;
  }
  const firstOk = {};
  if (s.firstOk && typeof s.firstOk === 'object') {
    for (const [id, v] of Object.entries(s.firstOk)) if (RULE_BY_ID.has(id) && v === true) firstOk[id] = true;
  }
  const off = Array.isArray(s.off) ? [...new Set(s.off.filter((t) => TOPIC_IDS.includes(t)))] : [];
  // Chủ đề bố mẹ tự bật không bao giờ là chủ đề ưu tiên.
  const focus = s.focus === null ? null : TOPIC_IDS.includes(s.focus) && !OPT_IN_TOPICS.includes(s.focus) ? s.focus : DEFAULT_FOCUS;
  const optIn = Array.isArray(s.optIn) ? [...new Set(s.optIn.filter((t) => OPT_IN_TOPICS.includes(t)))] : [];
  return {
    level: lock ?? (okLevel(s.level) ? s.level : 1),
    rounds: Number.isInteger(s.rounds) && s.rounds >= 0 ? s.rounds : 0,
    lock, seen, firstOk, off, focus, optIn,
  };
}
/** Chủ đề đang hiện (album, "Bé đã học"): mọi chủ đề thường + chủ đề bố mẹ đã bật. */
export const topicShown = (state, t) => !OPT_IN_TOPICS.includes(t) || (state.optIn ?? []).includes(t);
export const shownTopics = (state) => TOPIC_IDS.filter((t) => topicShown(state, t));
/** Chủ đề không chơi khi bốc lượt: `off` + chủ đề bố mẹ chưa bật. */
export const offTopics = (state) => [...new Set([...(state.off ?? []), ...OPT_IN_TOPICS.filter((t) => !topicShown(state, t))])];
/** Tình huống xong hẳn (đã chọn đúng + làm xong thao tác sửa): `seen` +1 đúng một lần; đúng ngay lần đầu thì `firstOk`. */
export function afterRule(state, id, { firstTry }) {
  return {
    ...state,
    seen: { ...state.seen, [id]: (state.seen[id] ?? 0) + 1 },
    firstOk: firstTry || state.firstOk[id] ? { ...state.firstOk, [id]: true } : state.firstOk,
  };
}
/** Huy hiệu chủ đề (S2 hiện album): mọi tình huống của chủ đề đã `firstOk`. Tích lũy — không bao giờ mất. */
export const badgeOf = (state, topic, rules = RULES) => {
  const list = rules.filter((r) => r.topic === topic);
  return list.length > 0 && list.every((r) => state.firstOk[r.id] === true);
};

// ---------- Bốc lượt (mục 2.1) ----------
/** Ít gặp trước: sắp theo `seen`, bằng nhau thì ngẫu nhiên (xáo trước rồi sắp ổn định). */
const bySeen = (list, seen, rng) => shuffle(list, rng).sort((a, b) => (seen[a.id] ?? 0) - (seen[b.id] ?? 0));

/**
 * Kế hoạch một lượt: [{ id, safeLeft }] hoặc null (dưới 3 tình huống — báo bố mẹ bật thêm chủ đề).
 * Thứ tự ưu tiên: (1) bỏ chủ đề tắt; (2) không lặp, độ dài = min(5, N); (3) 3 🚫 + 2 ✅ (lượt 3–4: ✅ = ⌊độ dài / 2⌋),
 * thiếu loại nào bù loại kia, có ✅ thì ít nhất 1 ✅; (4) chủ đề ưu tiên: 2 tình huống (1 🚫 + 1 ✅ nếu có);
 * (5) ít gặp trước; (6) tránh hai tình huống liền nhau cùng chủ đề.
 * `safeLeft`: thẻ an toàn bên trái (mức 2), cân bằng trong lượt.
 */
export function planRound({ off = OPT_IN_TOPICS, focus = null, seen = {}, rng = Math.random, rules = RULES } = {}) {
  const pool = rules.filter((r) => !off.includes(r.topic));
  // Chủ đề có giới hạn (🫶 tối đa 2 / lượt), trừ khi chỉ bật mỗi chủ đề đó.
  const capOf = (t) => (pool.every((r) => r.topic === t) ? Infinity : TOPIC_CAP[t] ?? Infinity);
  const usable = [...new Set(pool.map((r) => r.topic))].reduce((n, t) => n + Math.min(pool.filter((r) => r.topic === t).length, capOf(t)), 0);
  if (usable < MIN_ROUND) return null;
  const len = Math.min(ROUND_LEN, usable);
  const nos = pool.filter((r) => r.kind === 'no');
  const yeses = pool.filter((r) => r.kind === 'yes');
  let wantYes = Math.min(yeses.length, len === ROUND_LEN ? 2 : Math.floor(len / 2));
  if (yeses.length) wantYes = Math.max(1, wantYes);
  wantYes = Math.max(wantYes, len - nos.length); // thiếu 🚫 thì bù ✅
  const wantNo = len - wantYes;

  const picked = [];
  /** Lấy `n` tình huống: ít gặp trước; bằng nhau thì chủ đề chưa có trong lượt trước (dễ xếp xen kẽ), rồi ngẫu nhiên. */
  const take = (list, n) => {
    const topicCount = (t) => picked.filter((r) => r.topic === t).length;
    for (; n > 0; n--) {
      const left = list.filter((r) => !picked.includes(r) && topicCount(r.topic) < capOf(r.topic));
      if (!left.length) return;
      const key = (r) => (seen[r.id] ?? 0) * 100 + topicCount(r.topic);
      picked.push(left.reduce((best, r) => (key(r) < key(best) ? r : best)));
    }
  };
  const count = (kind) => picked.filter((r) => r.kind === kind).length;
  // Chủ đề ưu tiên (đang bật): 2 tình huống của chủ đề đó trước — 1 🚫 + 1 ✅ nếu có (ít gặp trước),
  // trong giới hạn số 🚫 / ✅ của lượt; chủ đề chỉ có một loại thì 2 tình huống loại đó.
  const focusOn = Boolean(focus) && !off.includes(focus);
  if (focusOn) {
    const fNo = bySeen(nos.filter((r) => r.topic === focus), seen, rng);
    const fYes = bySeen(yeses.filter((r) => r.topic === focus), seen, rng);
    if (wantNo > 0) take(fNo, 1);
    if (wantYes > 0) take(fYes, 1);
    if (picked.length < 2) take(fNo, Math.min(2 - picked.length, wantNo - count('no')));
    if (picked.length < 2) take(fYes, Math.min(2 - picked.length, wantYes - count('yes')));
  }
  const notFocus = (r) => !focusOn || r.topic !== focus;
  take(bySeen(nos.filter(notFocus), seen, rng), wantNo - count('no'));
  take(bySeen(yeses.filter(notFocus), seen, rng), wantYes - count('yes'));
  // Thiếu (chủ đề ưu tiên chiếm nhiều loại…): bù từ phần còn lại, ít gặp trước.
  if (picked.length < len) take(bySeen(pool, seen, rng), len - picked.length);

  const order = arrange(picked, rng);
  const sides = shuffle(order.map((_, i) => i % 2 === 0), rng);
  return order.map((r, i) => ({ id: r.id, safeLeft: sides[i] }));
}
/**
 * Xếp thứ tự ít cặp liền nhau cùng chủ đề nhất (rồi ít chuỗi 3 tình huống liền cùng loại 🚫 / ✅ — lượt chỉ có 🫶):
 * lượt ≤ 5 nên thử hết hoán vị (≤ 120), bắt đầu từ thứ tự ngẫu nhiên.
 */
export function arrange(list, rng = Math.random) {
  const score = (l) => adjacentSame(l) * 10 + kindRuns(l);
  let best = shuffle(list, rng);
  let bestBad = score(best);
  const walk = (prefix, rest) => {
    if (bestBad === 0) return;
    if (!rest.length) {
      const bad = score(prefix);
      if (bad < bestBad) [best, bestBad] = [prefix, bad];
      return;
    }
    for (let i = 0; i < rest.length; i++) walk([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
  };
  walk([], best);
  return best;
}
export const adjacentSame = (list) => list.slice(1).filter((r, i) => r.topic === list[i].topic).length;
/** Số chuỗi 3 tình huống liền nhau cùng loại (🚫 🚫 🚫 hoặc ✅ ✅ ✅). */
export const kindRuns = (list) => list.slice(2).filter((r, i) => r.kind === list[i].kind && r.kind === list[i + 1].kind).length;

// ---------- Câu nói chung ----------
// Bông hỏi "Can I…?" nên bé trả lời No / Yes (review 3+: nhất quán hơn Stop / OK).
export const NO_BTN = ['No!', 'Không!'];
export const YES_BTN = ['Yes!', 'Có!'];
export const SHOULD_I_LINE = ['Should I?', 'Có nên không nhỉ?'];
export const OOPS_LINE = ['Oops!', 'Ối!'];
export const WHICH_LINE = ['Which one is safe?', 'Tranh nào an toàn?'];
export const ANSWER_NO_LINE = ['Tap No!', 'Chạm nút Không nhé!'];
export const ANSWER_YES_LINE = ['Tap Yes!', 'Chạm nút Có nhé!'];
export const ANSWER_CARD_LINE = ['This one is safe. Tap it!', 'Tranh này an toàn. Chạm vào nhé!'];
export const THANKS_LINE = ['Thank you, Safety Hero!', 'Cảm ơn Siêu nhân an toàn!'];
/** Câu khi chọn đúng: 🚫 "Oops!" rồi câu giải thích; ✅ chỉ câu giải thích. */
export const rightLines = (rule) => (rule.kind === 'no' && !rule.gentle ? [OOPS_LINE, rule.why] : [rule.why]);
/** Mọi câu của một tình huống (test: không rỗng, không dùng he / she cho người lạ, không dùng grown-up). */
export const allLines = (rule) => [rule.ask, rule.why, rule.short, rule.hint, rule.look, rule.fix.say];

// ---------- Huy hiệu (S2, mục 6) ----------
/** Các chủ đề đang hiện đã có huy hiệu (thứ tự TOPIC_IDS); 🫶 chưa bật thì không tính (vẫn giữ `firstOk`). */
export const badgesOf = (state, rules = RULES) => shownTopics(state).filter((t) => badgeOf(state, t, rules));
export const NEW_BADGE_LINE = ['A new badge!', 'Huy hiệu mới!'];

// ---------- Mức 3 — "Story time" (S2, mục 3.3; chỉ khi bố mẹ khóa mức 3) ----------
/**
 * Chuyện 2 bước: hai tình huống cùng chủ đề nối nhau. Mỗi bước chơi như mức 2 (chọn tranh an toàn), độc lập với bước
 * trước; bước 2 có hình nhỏ nhắc lại bước 1. Bước 1 chưa đúng thì chưa sang bước 2 (như mọi tình huống).
 */
export const STORIES = [
  ['tv-timer', 'bedtime'], ['tv-long', 'stay-up'],
  ['knife', 'wash-hands'], ['stove', 'medicine'],
  ['stairs', 'window'], ['small-toy', 'socket'],
  ['helmet', 'hold-hands'], ['ball-road', 'cross-alone'],
  ['door', 'tell'], ['candy', 'go-with'],
  ['fire-low', 'fire-out'], ['fire-hide', 'fire-back'],
  ['hide-shop', 'lost'],
  ['pool-alone', 'swim-with'], ['pond', 'pond-toy'],
  ['dog', 'dog-still'],
];
export const STORY_COUNT = 2; // một lượt mức 3 = 2 chuyện = 4 bước (4 ⭐)
export const STORY_LINE = ['Story time!', 'Kể chuyện nào!'];
export const NEXT_LINE = ['What next?', 'Rồi sao nữa nhỉ?'];

/**
 * Kế hoạch lượt mức 3: [{ id, safeLeft, story, step }] hoặc null (ít hơn 2 chuyện có cả hai bước đang bật — màn chơi
 * dùng lượt thường). Chủ đề ưu tiên (đang bật) có chuyện thì chuyện đó trước; còn lại ít gặp trước (tổng `seen`), khác chủ đề.
 */
export function planStory({ off = OPT_IN_TOPICS, focus = null, seen = {}, rng = Math.random, stories = STORIES } = {}) {
  const ok = stories.filter((p) => p.every((id) => RULE_BY_ID.has(id) && !off.includes(RULE_BY_ID.get(id).topic)));
  const topic = (p) => RULE_BY_ID.get(p[0]).topic;
  const cost = (p) => p.reduce((n, id) => n + (seen[id] ?? 0), 0);
  const order = shuffle(ok, rng).sort((a, b) => cost(a) - cost(b));
  const picked = [];
  const focusOn = Boolean(focus) && !off.includes(focus);
  const first = focusOn ? order.find((p) => topic(p) === focus) : null;
  if (first) picked.push(first);
  for (const p of order) {
    if (picked.length >= STORY_COUNT) break;
    if (!picked.includes(p) && !picked.some((q) => topic(q) === topic(p))) picked.push(p);
  }
  if (picked.length < STORY_COUNT) return null;
  const sides = shuffle(picked.flatMap(() => [true, false]), rng);
  return picked.flatMap((p, story) => p.map((id, i) => ({ id, safeLeft: sides[story * 2 + i], story, step: i + 1 })));
}

// ---------- "Say it!" (S2, mức 3, tùy chọn — luật lượt nói SPEC-jobs5 mục 5; không ghi gì) ----------
export const SAY_IT_LINE = ['Say it!', 'Con nói theo nhé!'];
export const GREAT_TALK_LINE = ['Great talking!', 'Con nói giỏi quá!'];
export const GOOD_LINE = ['Good!', 'Tốt lắm!'];
const SAY_SKIP = new Set(['the', 'and', 'for', 'your', 'with']);
/** Từ khóa nghe của câu nhắc lại ngắn: các từ ≥ 3 chữ cái, bỏ từ nối ("Stay back! Call Daddy." → stay, back, call, daddy). */
export const sayKeywords = (rule) => [...new Set(rule.short[0].toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/)
  .filter((w) => w.length >= 3 && !SAY_SKIP.has(w)))];

// ---------- "Nói thêm với bé" (S2, mục 9): mỗi tình huống một gợi ý luyện ngoài đời cho bố mẹ ----------
export const TIPS = {
  'tv-long': 'Hẹn trước số tập ("hai tập thôi nhé"); hết tập thì cùng bé tắt TV và rủ chơi ngay một trò, nói "TV off. Let\'s play!".',
  'video-bed': 'Để máy tính bảng / điện thoại ngoài phòng ngủ. Trước giờ ngủ đọc sách hoặc ôm gấu thay cho video.',
  'stay-up': 'Giữ một nếp ngủ giống nhau mỗi tối (tắm → đánh răng → đọc truyện → tắt đèn). Nói "It\'s bedtime. Good night!".',
  'tv-timer': 'Đặt hẹn giờ trước khi xem. Chuông kêu thì để bé tự bấm tắt TV, khen ngay: "Ding! TV off. Good job!".',
  'bedtime': 'Dạy bé nhận ra lúc buồn ngủ (dụi mắt, ngáp) và tự nói "I\'m sleepy". Khen khi bé tự lên giường.',
  'knife': 'Cất dao, kéo ở chỗ cao. Khi nấu ăn, chỉ cho bé "Sharp! Call Mommy." — bé muốn giúp thì giao việc an toàn (rửa rau, bóc trứng).',
  'stove': 'Vẽ hoặc dán một vạch trên sàn bếp: lúc bếp đang nấu, bé đứng sau vạch. Tập "Hot! Stay back." như trò chơi.',
  'medicine': 'Cất thuốc thật cao, có khóa. Không gọi thuốc là kẹo. Chỉ uống thuốc khi bố mẹ đưa.',
  'wash-hands': 'Rửa tay cùng bé trước mỗi bữa ăn, vừa rửa vừa hát. Để xà phòng trong tầm tay bé.',
  'socket': 'Lắp nắp che ổ điện. Bé chỉ vào ổ điện thì nhắc "Don\'t touch! Call Mommy." — bố mẹ là người đậy nắp.',
  'window': 'Không để ghế, đồ chơi cao cạnh cửa sổ, ban công. Lắp chốt / lưới an toàn. Bé trèo lên thì bế xuống, nói "Get down".',
  'fan': 'Dùng quạt có lưới dày. Tập "Fingers away!" khi đi qua quạt.',
  'lighter': 'Cất bật lửa, diêm thật cao. Bé nhìn thấy thì không cầm, gọi bố mẹ: "Don\'t touch! Call Daddy."',
  'small-toy': 'Cất đồ nhỏ (bi, pin cúc áo, nam châm) xa tầm tay bé. Bé thấy đồ nhỏ trên sàn thì gọi bố mẹ nhặt, không tự nhặt cho vào miệng.',
  'stairs': 'Lắp chắn cầu thang. Đi cầu thang luôn nắm tay bé, từng bậc một: "Hold hands! Slowly."',
  'cross-alone': 'Ra đường luôn nắm tay. Người lớn quyết định lúc qua đường; đèn xanh không có nghĩa bé tự qua.',
  'ball-road': 'Tập trò "bóng lăn ra đường": bé đứng yên trên vỉa hè và gọi bố mẹ: "Stay here! Ask Daddy."',
  'helmet': 'Đội mũ bảo hiểm mọi lần lên xe máy, xe đạp. Bố mẹ cài quai và kiểm tra ("click!").',
  'seat-belt': 'Ngồi ghế ô tô trẻ em, bố mẹ thắt dây mỗi lần đi. Để bé nói "Click!" cùng bố mẹ.',
  'hold-hands': 'Ra khỏi nhà là nắm tay. Đông người thì bé nắm tay hoặc nắm vạt áo bố mẹ.',
  'door': 'Tập trò "kính coong": bé không tự mở cửa, chạy đi gọi bố mẹ: "Call Mommy first!".',
  'candy': 'Tập nói "No, thank you!" với đồ ăn của người lạ, rồi quay về với bố mẹ. Người lạ không phải người xấu; chỉ cần hỏi bố mẹ trước.',
  'go-with': 'Bé không đi theo ai khi chưa hỏi bố mẹ, kể cả người tỏ ra quen. Bố mẹ thống nhất với bé những ai được đón bé.',
  'tell': 'Hỏi bé mỗi tối "Hôm nay có gì làm con sợ không?". Khen bé khi bé kể, không mắng.',
  'fire-low': 'Tập "cúi thấp, che miệng" như trò chơi bò qua đường hầm. Cho bé nghe thử tiếng chuông báo cháy.',
  'fire-hide': 'Nói rõ: khi có khói không trốn (gầm giường, tủ) — trốn thì bố mẹ không tìm thấy. Đi ra cùng bố mẹ.',
  'fire-out': 'Cùng bé đi thử đường ra khỏi nhà; chỉ chỗ tập trung bên ngoài (gốc cây, cổng).',
  'fire-back': 'Ra ngoài rồi thì không quay vào lấy đồ, kể cả đồ chơi yêu thích. Chú lính cứu hỏa sẽ lo.',
  'hide-shop': 'Ở siêu thị không chơi trốn tìm. Cho bé nắm tay hoặc nắm xe đẩy cạnh bố mẹ.',
  'run-off': 'Hẹn trước khi vào siêu thị: muốn xem đồ chơi thì gọi bố mẹ đi cùng: "Wait for Mommy!".',
  'lost': 'Chỉ cho bé quầy thu ngân ở mỗi siêu thị. Lạc thì đứng yên, nhờ cô ở quầy; không đi theo ai ra ngoài.',
  'pool-alone': 'Ở gần nước luôn ở sát bé, trong tầm với. Bé chỉ xuống bể khi bố mẹ đã xuống trước.',
  'pond': 'Đi dạo ao hồ thì nắm tay, đứng xa mép nước. Ngắm cá từ xa.',
  'pond-toy': 'Đồ rơi xuống nước thì bố mẹ lấy (bằng sào, vợt) hoặc bỏ luôn. Bé đứng xa mép nước, gọi bố mẹ.',
  'swim-with': 'Phao tay không thay được bố mẹ: luôn ở sát cạnh bé khi bé ở dưới nước.',
  'dog': 'Gặp chó lạ: đứng cạnh bố mẹ, nhìn từ xa, không chạy, không vuốt. Muốn vuốt chó quen thì bố mẹ hỏi chủ trước.',
  'dog-eat': 'Không lại gần chó đang ăn, đang ngủ hay đang gặm xương, kể cả chó nhà. Để chó ăn xong rồi mới chơi.',
  'dog-still': 'Tập trò "làm cái cây": đứng yên, tay khoanh trước ngực, nhìn xuống chân. Chó chạy lại thì làm cây, không chạy, không hét, chờ bố mẹ.',
  'private': 'Nói với bé: chỗ đồ bơi che là chỗ riêng tư, cơ thể của con là của con. Lúc thay đồ, tắm, nhắc nhẹ như một điều bình thường — không làm bé xấu hổ.',
  'bath-help': 'Nói với bé mẹ giúp rửa là để chăm sóc cơ thể con. Hỏi bé trước khi giúp ("Mẹ rửa giúp con nhé?"); bé lớn dần thì để bé tự rửa chỗ riêng tư.',
  'doctor': 'Giải thích cho bé trước khi khám; bố mẹ luôn ở cạnh; bác sĩ chỉ khám chỗ cần khám. Bé được nói khi đau hoặc không thoải mái — bố mẹ là người giải thích và bảo vệ bé.',
  'hug-no': 'Không ép bé ôm / hôn ai, kể cả ông bà, họ hàng. Bé có thể đập tay, vẫy tay, nói "bye" — hoặc không làm gì cũng được. Bố mẹ nói đỡ cho bé với người lớn.',
  'secret': 'Bất ngờ (quà sinh nhật) là chuyện vui, sẽ kể sau. Chuyện làm bé lo, hoặc chuyện về cơ thể, thì không cần giữ kín — kể với bố mẹ. Hỏi bé mỗi tối "Hôm nay có chuyện gì không?".',
  'no-touch': 'Cùng bé kể tên những người lớn bé tin (bố, mẹ, ông bà, cô giáo…) — bé được kể với họ khi bố mẹ không ở đó. Tập nói thật to "Không!" như một trò chơi.',
};

// ---------- 🫶 Góc bố mẹ (SPEC-body mục 7) ----------
export const BODY_IF_TOLD = [
  'Bình tĩnh lắng nghe, không tỏ ra hoảng sợ.',
  'Cảm ơn bé vì đã kể.',
  'Nói: "Con làm đúng khi kể với bố mẹ."',
  'Nói: "Không phải lỗi của con."',
  'Không hỏi dồn, không hỏi theo hướng dẫn dắt câu trả lời.',
  'Không trách móc, nghi ngờ, không bắt bé kể đi kể lại nhiều lần.',
  'Ghi lại những gì bé tự kể, bằng lời của bé.',
  'Nếu có dấu hiệu bé bị xâm hại: ưu tiên bảo vệ bé, tìm hỗ trợ từ chuyên gia hoặc cơ quan có thẩm quyền — ở Việt Nam: Tổng đài quốc gia bảo vệ trẻ em 111 (miễn phí, 24/7).',
];
export const BODY_DONT_SAY = [
  '"Sao con không chạy đi?"',
  '"Sao con không nói sớm hơn?"',
  '"Chắc người ta chỉ đùa thôi."',
  '"Không được kể chuyện này với ai ngoài bố mẹ." — bé cần biết có thể tìm người lớn đáng tin khác khi bố mẹ không ở đó.',
];
export const BODY_ENABLE_MSG = 'Chủ đề này dạy bé: cơ thể của bé là của bé, được nói Không, không giấu chuyện về cơ thể, kể với bố mẹ. Nên đọc gợi ý và nói chuyện cùng bé.';

// ---------- Ảnh của bố mẹ (S2): thay từng hình trong cảnh, ảnh nền từng cảnh; chưa có ảnh thì dùng hình vẽ ----------
export const SAFETY_PEOPLE_IMAGES = 'safety:people';
export const SAFETY_ITEM_IMAGES = 'safety:items';
export const SAFETY_BG_IMAGES = 'safety:bg';
const PERSON_RULES = 'Full body, standing, facing the viewer, cheerful, cute children\'s picture-book style, thick dark outline, soft flat colors. Pure flat white (#FFFFFF) background, no shadow, no scenery, no text.';
/** Người: Bông (áo choàng đỏ vẽ thêm trong app), mẹ, bố. */
export const SAFETY_PEOPLE = [
  { id: 'bong', vi: 'Bông', emoji: '🐰', prompt: `A small cute plush bunny character named Bong for a toddler app. ${PERSON_RULES} No cape (the app adds a red superhero cape).` },
  { id: 'mummy', vi: 'Mẹ', emoji: '👩', prompt: `A friendly young Vietnamese mom in casual clothes, smiling. ${PERSON_RULES}` },
  { id: 'daddy', vi: 'Bố', emoji: '👨', prompt: `A friendly young Vietnamese dad in casual clothes, smiling. ${PERSON_RULES}` },
];
/** Đồ trong cảnh (theo `k` của hình). `draw`: mô tả cho prompt ảnh lưới. */
export const SAFETY_ITEMS = [
  ['tv', 'TV', 'TV', 'a TV showing a cartoon'], ['tablet', 'tablet', 'máy tính bảng', 'a tablet computer'],
  ['bed', 'bed', 'giường', 'a small bed seen from the side'], ['lamp', 'lamp', 'đèn ngủ', 'a bedside lamp'],
  ['teddy', 'teddy', 'gấu bông', 'a teddy bear'], ['toys', 'toys', 'đồ chơi', 'a pile of toys'],
  ['moon', 'moon', 'mặt trăng', 'a crescent moon'], ['timer', 'timer', 'đồng hồ hẹn giờ', 'an alarm clock'],
  ['book', 'book', 'sách', 'a picture book'], ['ball', 'ball', 'quả bóng', 'a ball'],
  ['counter', 'counter', 'tủ bếp', 'a kitchen counter cabinet seen from the front'], ['shelf', 'shelf', 'kệ', 'a plain wall shelf'],
  ['knife', 'knife', 'dao', 'a kitchen knife'], ['pot', 'pot', 'nồi', 'a cooking pot with steam'],
  ['medicine', 'medicine', 'thuốc', 'a medicine pill'], ['sink', 'sink', 'bồn rửa', 'a kitchen sink cabinet seen from the front'],
  ['tap', 'tap', 'vòi nước', 'a water tap'], ['soap', 'soap', 'xà phòng', 'a bar of soap'],
  ['socket', 'socket', 'ổ điện', 'a wall power socket'], ['window', 'window', 'cửa sổ', 'a window'],
  ['stool', 'stool', 'ghế đẩu', 'a small stool'], ['fan', 'fan', 'quạt', 'a standing electric fan'],
  ['table', 'table', 'bàn', 'a low table'], ['lighter', 'lighter', 'bật lửa', 'a lighter'],
  ['marble', 'marble', 'viên bi', 'a glass marble'], ['toybox', 'toy box', 'hộp đồ chơi', 'a toy box'],
  ['stairs', 'stairs', 'cầu thang', 'indoor stairs with a handrail, seen from the side'],
  ['car', 'car', 'ô tô', 'a small car'], ['scooter', 'scooter', 'xe máy', 'a motorbike scooter'],
  ['helmet', 'helmet', 'mũ bảo hiểm', 'a child bike helmet'], ['carseat', 'car seat', 'ghế ô tô trẻ em', 'a child car seat'],
  ['door', 'door', 'cửa ra vào', 'a front door'], ['stranger', 'person', 'người lạ', 'a smiling adult (ordinary clothes)'],
  ['candy', 'candy', 'kẹo', 'a wrapped candy'], ['alarm', 'alarm', 'chuông báo cháy', 'a smoke alarm with a red light'],
  ['house', 'house', 'ngôi nhà', 'a small house with a little grey smoke'], ['truck', 'fire truck', 'xe cứu hỏa', 'a fire truck'],
  ['aisle', 'shop shelf', 'kệ siêu thị', 'a tall supermarket shelf full of products'], ['cart', 'cart', 'xe đẩy', 'a shopping cart'],
  ['toyshelf', 'toy shelf', 'kệ đồ chơi', 'a shop shelf full of toys'], ['desk', 'checkout', 'quầy thu ngân', 'a shop checkout counter seen from the front'],
  ['cashier', 'cashier', 'cô thu ngân', 'a smiling shop lady, upper body only'],
  ['pool', 'pool', 'bể bơi', 'a wide strip of swimming pool water seen from the side'], ['pondwater', 'pond', 'ao', 'a wide strip of pond water with reeds'],
  ['fish', 'fish', 'cá', 'a fish jumping'], ['pole', 'pole', 'cây sào', 'a long pole with a small net'],
  ['armbands', 'armbands', 'phao tay', 'a pair of inflatable swim armbands'], ['dog', 'dog', 'chó', 'a medium dog standing, calm'],
  ['bowl', 'dog bowl', 'bát ăn của chó', 'a dog food bowl with kibble'],
  ['towel', 'towel', 'khăn tắm', 'a folded striped bath towel'], ['rack', 'towel rack', 'giá treo khăn', 'a small wall towel rail'],
  ['tub', 'bathtub', 'bồn tắm', 'a wide bathtub seen from the side, full of water'], ['duck', 'duck', 'vịt cao su', 'a yellow rubber duck'],
  ['foam', 'foam', 'bọt xà phòng', 'a big cloud of soap bubbles'], ['desk2', 'table', 'bàn khám', 'a small doctor office table'],
  ['stetho', 'stethoscope', 'ống nghe', 'a stethoscope'],
].map(([id, en, vi, draw]) => ({ id, en, vi, draw }));
/** Cảnh (ảnh nền): chỉ là nền, mọi hình vẫn đặt lên trên. */
export const SAFETY_SCENES = [
  ['kitchen', 'Bếp', 'a bright kitchen'], ['room', 'Phòng khách', 'a living room'], ['bedroom', 'Phòng ngủ', 'a child bedroom'],
  ['hall', 'Cửa nhà', 'a home entrance hall'], ['street', 'Đường phố', 'a quiet street with a sidewalk in the lower part'],
  ['park', 'Công viên', 'a park lawn'], ['yard', 'Sân trước nhà', 'a front yard'], ['smoke', 'Nhà có khói', 'a living room with light grey smoke near the ceiling, no fire'],
  ['shop', 'Siêu thị', 'a supermarket'], ['pool', 'Bể bơi', 'a swimming pool area'], ['pond', 'Ao / hồ', 'a park by a pond'],
  ['bath', 'Phòng tắm', 'a bright bathroom with tiles'], ['clinic', 'Phòng khám', 'a friendly children\'s doctor office'],
].map(([id, vi, draw]) => ({
  id, vi,
  prompt: `A wide 4:3 background picture of ${draw} for a toddler app, cute children's picture-book style, soft flat colors. EMPTY: no people, no animals, no text. Keep the lower third plain floor / ground (the app places characters there).`,
}));
