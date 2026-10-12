# SPEC — Ôn tập chung, Học cùng Bông chung và Trò chơi tổng hợp

> Phiên bản spec: **draft1** · Ngày: 2026-10-12 · Dựa trên app 0.3.3 (SPEC.md, SPEC-v1.0.md, SPEC-numbers.md)
> Trạng thái: **đã chốt 2026-10-12** (mục 6 theo đề xuất: nút 🎲 thứ 7 ở màn hình chính, 10 câu, Ôn tập 8 câu) · **đã làm xong trong app 0.4.0**.
> Ghi chú khi code: màn hình chính 7 nút — 4 cột trên màn rộng, 2 cột × 4 hàng trên iPhone/iPad dọc, hàng cuối lẻ thì căn giữa. Lượt số ở Học cùng Bông không cho chạm đếm (mic đang nghe).

Hiện **Ôn tập** và **Học cùng Bông** chỉ dùng từ vựng; câu nói và số đếm chỉ được ôn khi học lại đúng bài đó. Bản này:
1. Đưa **câu nói** và **số đếm** vào **Ôn tập** (mục 2) và **Học cùng Bông** (mục 3).
2. Thêm **Trò chơi tổng hợp** (mục 4): lấy ngẫu nhiên từ **tất cả các bài, kể cả bài chưa học**, nhiều câu hơn, **chỉ chạm chọn đáp án, không bắt nói**.

Nguyên tắc giữ nguyên: 0 đồng, chạy offline, không phạt bé, nút ▶ và 🔊 nghe lại câu hỏi có ở mọi câu.

## 1. Ba "loại mục" dùng chung

| Loại | Khóa tiến độ | Hình | Câu hỏi chọn đáp án |
|---|---|---|---|
| Từ vựng | `cow` | ảnh của từ, không có thì emoji | *"Where is the cow?"* — chọn 1 trong 3 hình |
| Câu nói | `phrase:wash your face` | flipbook nếu có, không thì cảnh Bông + emoji | *"Which one is: Wash your face?"* — chọn 1 trong 3 cảnh |
| Số đếm | `number:3` | chữ số / nhóm đồ vật | *"Find number three!"* hoặc *"How many ducks?"* — chọn 1 trong 3 thẻ số |

- Lựa chọn sai lấy **cùng loại** (từ với từ, câu với câu, số với số), ưu tiên cùng bài cho từ và câu (dễ hiểu hơn), thiếu thì lấy bài khác.
- Dùng lại đúng màn chọn đáp án đang có (hiệu ứng đúng/sai, sai 2 lần thì đáp án phát sáng, nút 🔊).

## 2. Ôn tập (⭐) — chung từ, câu, số

- **8 câu** mỗi lượt (trước là 6), lấy từ các mục **đã học** (`practiceCount > 0`) của cả 3 loại, ưu tiên như cũ: **chưa thuộc** (< 3⭐) → **lâu chưa gặp** (> 7 ngày) → ngẫu nhiên.
- Trộn loại: không để 3 câu liền nhau cùng loại khi còn loại khác; mỗi loại đã học có ít nhất 1 câu.
- Cách hỏi theo loại:
  - Từ vựng: xen kẽ **"Find the…"** (chọn) và **"What's this?"** (bé nói) như hiện tại.
  - Câu nói: **chọn cảnh đúng câu** (*"Which one is: …?"*).
  - Số đếm: **"Find number …!"** hoặc **"How many …?"** (chọn thẻ số).
- Sao: giữ luật của từng loại — từ vựng như cũ (đúng ngay +1, sai −1); câu và số **không bao giờ trừ** (đúng ngay +1, tối đa một lần mỗi mục mỗi lượt).
- Nút ⭐ sáng khi bé đã học **bất kỳ loại nào** (trước: chỉ khi đã học từ vựng).

## 3. Học cùng Bông — thêm câu và số (có nói, như hiện tại)

- **8 lượt** mỗi buổi (trước là 7): phần lớn vẫn là hỏi đáp từ vựng; thêm **tối đa 2 lượt câu** và **tối đa 2 lượt số** nếu bé đã học câu/số. Chưa học loại nào thì không có loại đó.
- **Lượt câu nói:** hiện cảnh của câu, Bông: *"Show me! Wash your face!"* → bé làm động tác (chạm ✔ hoặc tự đi tiếp sau 15 giây) → Bông: *"Now you say it!"* → nghe bé → khen / đọc mẫu một lần (giống bước B + C của bài câu).
- **Lượt số đếm:** hiện nhóm đồ vật (ví dụ 3 🍎), Bông: *"How many apples?"* → bé có thể **chạm đếm** (đồ vật to ra, Bông đọc số) → nghe bé nói → nghe ra số đúng thì *"Yes! Three apples!"*; không thì Bông đếm mẫu rồi nói *"Three apples!"*.
- Mic / nhận dạng giọng nói không có: chạy như chế độ chỉ nghe hiện tại (không bao giờ kẹt).

## 4. Trò chơi tổng hợp (mới) — chỉ chạm chọn, không nói

### 4.1. Nội dung
- Lấy từ **tất cả các bài trên máy** (từ vựng, câu, số), **kể cả mục bé chưa học**.
- **10 câu** mỗi lượt, khoảng 4–5 phút. Hết lượt: Hoan hô + sticker, rồi chơi lại bao nhiêu lần cũng được (mỗi lượt câu hỏi khác).
- Chọn mục: khoảng **một nửa từ mục đã học** (ưu tiên chưa thuộc) và **một nửa ngẫu nhiên** trong tất cả (kể cả chưa học) — để vừa ôn vừa có cái mới, bất ngờ.
- Tỉ lệ loại theo số mục có trên máy (nhiều từ vựng thì nhiều câu từ vựng hơn), nhưng mỗi loại có ít nhất 1 câu nếu có; không lặp lại một mục trong cùng lượt.
- **Chỉ có câu hỏi chọn đáp án** (mục 1). Không có bước nói, không bật mic.

### 4.2. Mục bé chưa học
- Vẫn hỏi như bình thường (bé đoán, chọn sai không sao). Sau khi chọn xong (đúng hoặc sau 2 lần sai), Bông **giới thiệu** mục đó: *"This is a cow!"* / *"Wash your face!"* / *"Three apples!"* — biến câu hỏi thành một lần học.
- Mục chưa học được ghi là **đã gặp** (`practiceCount` +1) để sau đó vào được Ôn tập.

### 4.3. Sao
- **Không bao giờ trừ sao** ở trò này (kể cả từ vựng), vì có mục bé chưa học.
- Chọn đúng ngay lần đầu: +1, **chỉ với mục đã học trước lượt này**, tối đa một lần mỗi mục mỗi lượt (mục chưa học đoán đúng không cộng, tránh "đoán trúng" thành thuộc).
- Mọi lượt chọn đều ghi `attempts` (đúng ngay / sai) để bố mẹ xem.

### 4.4. Vị trí trong app
Xem câu hỏi 6.1.

## 5. Kế hoạch test

| Nhóm | Test |
|---|---|
| Chọn mục | Ôn tập 8 câu chỉ từ mục đã học, có đủ loại đã học, không 3 câu liền cùng loại; Trò chơi tổng hợp 10 câu, có mục chưa học, không lặp mục |
| Lựa chọn sai | Cùng loại, không trùng đáp án đúng, ưu tiên cùng bài |
| Sao | Ôn tập: từ −1 khi sai, câu/số không trừ; Trò chơi tổng hợp: không trừ, mục chưa học đoán đúng không cộng nhưng được ghi đã gặp |
| Giao diện | Chơi hết Ôn tập / Học cùng Bông / Trò chơi tổng hợp → Hoan hô; nút ⭐ sáng khi chỉ học câu; nút 🔊 đọc lại câu hỏi |
| Hồi quy | Bài từ vựng, câu, số; màn hình chính vừa iPhone dọc |

## 6. Câu hỏi cần bố mẹ chốt

| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Nút **Trò chơi tổng hợp** đặt ở đâu? | Nút thứ 7 **🎲 Play / Trò chơi** trên màn hình chính; lưới 2 cột × 4 hàng trên iPhone dọc (nút nhỏ lại một chút) |
| 2 | Số câu mỗi lượt Trò chơi tổng hợp | **10 câu** |
| 3 | Ôn tập tăng từ 6 lên 8 câu | Đồng ý |
