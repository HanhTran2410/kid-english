# SPEC — Mở rộng nội dung có sẵn

> App **0.23.0 → 0.25.0** · Ngày: 2026-10-20 · **Đã làm.**
> Thêm nội dung cho các phần đã có (không thêm trò mới): máy chơi đã đủ, thêm tranh / chủ đề thì bé thấy mới mà ít rủi ro.
> Chi tiết từng phần nằm ở spec của phần đó; file này là tổng hợp.

## 1. Tô màu + Ghép hình (0.23.0)
- **Tô màu:**
  - con vật 5 → **15**: dog, cow, pig, duck, rabbit, elephant, lion, giraffe, turtle, frog;
  - đồ vật 6 → **11**: bus, train, plane, boat, cake.
- **Ghép bộ phận** và nhóm *Con vật và đồ vật* của Ghép cả bức tranh: 10 → **25 hình**. Tự có vì dùng chung tranh Tô màu.
- Chi tiết: SPEC-coloring mục 9, SPEC-puzzle "Thêm hình".

## 2. Dán tranh + Tìm đồ còn thiếu (0.24.0)
- **Dán tranh 7 → 10 tranh:** 🚦 Đường phố (xe cộ), 🎂 Sinh nhật, ⛄ Mùa đông tuyết. Mỗi tranh 16 sticker.
  - Thay "Dưới biển" / "Khu vườn" của đề xuất ban đầu, vì Bãi biển / Công viên đã có gần hết các con vật đó.
- **Bông hỏi ngược** *"Where is the cow?"*, xen kẽ với việc dán.
- **Sửa lỗi:** *ball* 🏐 ở Bãi biển dán vào lại hiện ⚽.
- **Tìm đồ còn thiếu:** 13 → **16 tranh**. Tranh tuyết dùng bóng xám đậm.
- Chi tiết: SPEC-scenes mục 11, SPEC-missing mục 11.

## 3. Bài học có sẵn (0.25.0)
**6 bài từ vựng mới.** Mỗi bài có 6 từ, 12 lượt hội thoại, 6 câu hỏi, truyện 3 câu và prompt ảnh cho từng từ.

| Bài | Từ |
|---|---|
| 👀 Body — Cơ thể | eyes, nose, mouth, ears, hands, feet |
| 👨‍👩‍👧 Family — Gia đình | mummy, daddy, baby, grandma, grandpa, sister |
| 🍚 Food — Đồ ăn | rice, bread, egg, banana, milk, water |
| 🚗 Vehicles — Xe cộ | car, bus, train, plane, boat, bike |
| 😊 Feelings — Cảm xúc | happy, sad, angry, sleepy, hungry, scared |
| 🌦️ Weather — Thời tiết | sunny, rainy, cloudy, windy, hot, cold |

- **Tự thêm một lần** (cờ `vocabSamplesAdded`, theo từng file):
  - máy đã dùng bản cũ cũng nhận được;
  - bố mẹ xóa bài nào thì bài đó không tự quay lại;
  - nút *Thêm lại bài mẫu* thêm lại cả 6 bài.
- Service worker lưu sẵn 6 file để học offline.
- Hội thoại của Body là làm theo (*"Touch your nose!"*). Feelings / Weather là tính từ, nên câu hỏi dạng *"Which one is happy?"*, *"Is it sunny?"*.
- Bài Food dùng cùng tên với món của Cho Bông ăn (rice, bread, egg, banana, milk, water): bố mẹ thêm ảnh ở bài học thì **Dùng lại ảnh đã có** của Cho Bông ăn lấy được.

## 4. Cho Bông ăn: món Việt (0.25.0)
- 25 → **31 món**. Thêm: mango 🥭, coconut 🥥, sweet potato 🍠, rice ball 🍙 (nắm xôi), dumpling 🥟 (bánh bao), soup 🍲 (canh).
- Không thêm *phở*: trùng emoji 🍜 với *noodles* đã có, bé khó phân biệt.
- *Soup* là danh từ không đếm được: chỉ xuất hiện ở mức 1–2 (mức đếm chỉ chọn món đếm được, như rice / milk).

## 5. Kiểm thử
- **Unit:**
  - số tranh / nhóm Tô màu, 25 hình ghép (mảnh ≥ 20 / 200, phủ đủ phần);
  - 10 tranh Dán tranh (chỗ, giới từ, prompt); sticker cùng mã thì cùng emoji;
  - hỏi ngược (`findSentence`, `pickFind`, ≥ 3 loại);
  - 16 tranh Tìm đồ còn thiếu (trong khung, không đè, mức 3 đủ 3 đồ không sát nhau);
  - 6 bài mới hợp lệ, không cảnh báo (kiểm tra bằng `parseLesson` khi làm).
- **UI:**
  - danh sách Tô màu 15 con vật, Ghép hình 25 hình;
  - Dán tranh 10 tranh, hỏi ngược (nhầm → nhắc, nhầm 2 lần → nhún, đúng → khen);
  - Từ vựng 8 bài có sẵn;
  - loại trừ từ theo chủ đề tính cả bài có sẵn;
  - Học cùng Bông lấy từ cả bài mới.

## 6. Có thể làm tiếp
- Thêm cảnh riêng cho Tìm đồ còn thiếu (chợ, lớp học).
- Bài từ vựng có sẵn khác: toys, fruits, clothes, colors 2.
- Thống kê bé chơi trò nào (đề xuất trước đó), để biết nên mở rộng phần nào tiếp.
