import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateQuestion } from '../../app/js/captions.js';

test('phụ đề tiếng Việt cho mọi mẫu câu hỏi của app (kèm nghĩa nếu có)', () => {
  const cases = [
    ['Where is the cow?', 'con bò', '"cow" (con bò) ở đâu? Bé chạm vào hình đúng.'],
    ['Which one is red?', 'màu đỏ', 'Cái nào là "red" (màu đỏ)? Bé chạm vào hình đúng.'],
    ['Which one is: Wash your face?', 'Rửa mặt', 'Hình nào là "Wash your face" (Rửa mặt)? Bé chạm vào hình đúng.'],
    ['Your turn! Wash your face!', 'Rửa mặt', 'Đến lượt bé! Làm theo: "Wash your face" (Rửa mặt). Làm xong thì chạm ✔.'],
    ['Stand up!', 'Đứng lên', 'Làm theo: "Stand up" (Đứng lên). Làm xong thì chạm ✔.'],
    ['Your turn! Tap and count!', '', 'Đến lượt bé! Chạm vào từng đồ vật để đếm.'],
    ['Ten! Your turn! Tap and count!', '', 'Mười! Đến lượt bé: chạm vào từng đồ vật còn lại để đếm tiếp.'],
    ['Where are three apples?', '', 'Nhóm nào có 3 apples? Bé chạm vào nhóm đúng.'],
    ['Find number fifteen!', '', 'Tìm số 15!'],
    ['How many ducks?', '', 'Có bao nhiêu ducks? Bé đếm rồi chọn số đúng.'],
    ['Which one starts with A?', '', 'Hình nào bắt đầu bằng chữ A?'],
    ['Which one has X?', '', 'Hình nào có chữ X?'],
    ['Big F. Find the small F!', '', 'Đây là chữ F hoa. Bé tìm chữ f thường!'],
    ['Fork! Which letter?', '', '"Fork" — từ này có chữ cái nào? Bé chọn chữ đúng.'],
    ['Pop the B!', '', 'Chạm vào quả bóng có chữ B!'],
    ['Your turn! Tap a picture!', '', 'Đến lượt bé! Chạm vào một hình để nghe từ đó.'],
  ];
  for (const [en, vi, want] of cases) assert.equal(translateQuestion(en, vi), want, en);
  assert.equal(translateQuestion('Something else?'), '');
  assert.equal(translateQuestion('Which one says moo?', 'con bò'), 'Nghĩa: con bò');
});
