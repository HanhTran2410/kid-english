# SPEC — Mục mới "Số đếm" (Numbers)

> Phiên bản spec: **draft1** · Ngày: 2026-10-12 · Dựa trên app 0.2.6 (SPEC.md v0.12, SPEC-v1.0.md)
> Trạng thái: **đã chốt 2026-10-12** (mục 13 theo đề xuất) · **đã làm xong N-a và N-b trong app 0.3.0**.
> Ghi chú khi code: dữ liệu bài số nằm trong `js/numbers.js` (không cần file JSON riêng); thẻ bài trong danh sách hiện số lần học xong như các bài khác; bé chạm đếm được ngay cả khi Bông đang mời.

**Phạm vi kỹ thuật:** một **mục học mới bên trong web app hiện tại** (cùng link, cùng app trên Màn hình chính), giống cách thêm mục Câu nói. Dùng chung dữ liệu (danh sách bài, tiến độ, sticker, Học tiếp/Học lại, giới hạn thời gian, sao lưu) và dùng lại khung học (🏠, thanh tiến độ, Bông, nút ▶), giọng đọc, Hoan hô, hiệu ứng chọn đúng/sai.

## 1. Mục tiêu

- Bé 3 tuổi **nghe và nhận ra số 1–10 bằng tiếng Anh**, **đếm đồ vật** theo Bông (*one balloon, two crayons…*) và **nhận ra chữ số** (1, 2, 3…).
- Học bằng cách **nhìn đồ vật được đếm từng cái**: đếm tới cái nào thì cái đó **to ra** và có số nhỏ hiện dưới nó.
- Bé **tự chạm đếm** (mỗi lần chạm một đồ vật, Bông đọc số tiếp theo) — học bằng tay, không chỉ nghe.
- Có **trò chơi Chọn số** để ôn.
- Giữ nguyên nguyên tắc của app: **0 đồng**, không server, **chạy offline**, **không phạt bé** (không trừ sao, không nói "sai").

**Khác với bài từ vựng và bài câu:** bài số **có sẵn trong app**, bố mẹ **không cần dùng AI** hay tạo ảnh. Đồ vật là emoji (🎈 🖍️ 🍎…) nên hiện được ngay, không cần mạng.

### Ngoài phạm vi bản đầu
- Số 11–20, đếm theo chục, cộng trừ.
- Bé **nói** số để app nhận dạng (mic) — để sau (xem câu hỏi 13.3).
- Bố mẹ tự tạo bài số / đổi đồ vật — để sau.
- Đưa số vào **Ôn tập** chung — để sau.

## 2. Vị trí trong app

- Màn hình chính thêm nút **🔢 Numbers / Số đếm**.
- Bố cục mới: **lưới 2 cột × 3 hàng**: Bài học · Câu nói · **Số đếm** · Ôn tập · Học cùng Bông · Sticker (nút Sticker chuyển từ hàng dưới vào lưới để vẫn vừa màn hình iPhone dọc, không phải cuộn).
- Bấm **Số đếm** → **danh sách bài số** (giống danh sách bài câu: thẻ bài, số ⭐, Học tiếp/Học lại). Bản đầu có 2 thẻ:
  1. **🎈 Count 1–10 / Đếm từ 1 đến 10** — bài học đếm (mục 4).
  2. **🎯 Number game / Chọn số** — trò chơi (mục 5).

## 3. Đồ vật để đếm

Mỗi số dùng **một đồ vật khác nhau**, quen thuộc với bé, emoji rõ hình:

| Số | Đồ vật (emoji) | Bông nói |
|---|---|---|
| 1 | 🎈 balloon | *One balloon* |
| 2 | 🖍️ crayon | *Two crayons* |
| 3 | 🍎 apple | *Three apples* |
| 4 | 🦆 duck | *Four ducks* |
| 5 | ⭐ star | *Five stars* |
| 6 | 🐟 fish | *Six fish* |
| 7 | 🌸 flower | *Seven flowers* |
| 8 | 🚗 car | *Eight cars* |
| 9 | 🍌 banana | *Nine bananas* |
| 10 | 🧸 teddy bear | *Ten teddy bears* |

- Dữ liệu ghi rõ **số ít / số nhiều** (fish → fish) để Bông nói đúng ngữ pháp.
- Đồ vật xếp theo **hàng tối đa 5 cái** (6–10 thành 2 hàng: 5 + phần còn lại), giống "khung 10 ô" giáo viên mầm non hay dùng — bé dễ thấy 5 và "5 với mấy nữa".
- Đồ vật to vừa đủ để chạm (khoảng 56–64px trên iPhone dọc, to hơn trên iPad); 10 đồ vật vừa màn hình không tràn mép.

## 4. Bài học "Đếm từ 1 đến 10"

Với **từng số n từ 1 đến 10**, ba bước ngắn (~25 giây mỗi số, cả bài ~5 phút). Lưu chỗ dừng sau mỗi bước (Học tiếp).

**A. Xem Bông đếm**
1. Hiện **chữ số n to** ở trên, bên dưới là n đồ vật xuất hiện lần lượt (bay vào nhẹ).
2. Bông: *"Let's count!"* (chỉ nói ở số đầu tiên và khi bé quay lại bài; các số sau vào thẳng bước 3 để bớt lời).
3. Bông đếm **từng đồ vật từ trái sang phải, trên xuống dưới**: đếm tới cái nào thì **cái đó to ra** (phóng ~1,4 lần rồi về ~1,1 lần) và **hiện số nhỏ** (1, 2, 3…) bên dưới; số nhỏ giữ lại để bé thấy đã đếm tới đâu. Mỗi số cách nhau ~0,7 giây, khớp với lúc Bông đọc.
4. Đếm xong: **cả nhóm nhún nhẹ một lần**, chữ số n to phát sáng, Bông nói **"Two crayons!"** (với 1: *"One balloon!"*).
5. Chạm vào chữ số hoặc đồ vật thì Bông đếm lại từ đầu. Nút ▶ để sang bước sau.

**B. Bé chạm đếm**
1. Số nhỏ dưới đồ vật biến mất, đồ vật về cỡ thường. Bông: *"Your turn! Tap and count!"* — bé chạm được ngay cả khi Bông đang nói câu này (số đầu tiên cắt lời mời).
2. Bé chạm **bất kỳ đồ vật nào chưa đếm** → đồ vật đó to ra, hiện số tiếp theo, Bông đọc số đó (*"One!"*, *"Two!"*…). Chạm lại đồ vật đã đếm: không tính, đồ vật nhún nhẹ.
3. Đếm đủ n cái → Bông: *"Two! Great counting!"* + tiếng ding + sao bay lên.
4. Không chạm sau 15 giây → Bông đếm mẫu nốt các đồ vật còn lại rồi đi tiếp; không trừ gì. Bé chạm nhanh liên tiếp: mỗi chạm vẫn được đếm đúng thứ tự, Bông đọc kịp (cắt câu trước nếu cần).
5. Với n = 1: chạm 1 lần là xong.

**C. Chọn hình đúng** (sau số thứ 3 trở đi, mỗi số một lượt — xen kẽ để ôn ngay)
- Bông: *"Where are three apples?"* — hiện **2 nhóm** đồ vật cùng loại với số lượng khác nhau (ví dụ 3 và 1). Bé chạm nhóm đúng.
- Số nhóm còn lại chọn **chênh rõ** với n (chênh ≥ 2) để bé 3 tuổi phân biệt được bằng mắt.
- Đúng: ding, *"Yes! Three apples!"*. Sai: nhóm lắc nhẹ, Bông đếm nhóm đó (*"That's one apple."*), mời chọn lại; sai 2 lần thì nhóm đúng phát sáng, Bông đếm nhóm đúng rồi đi tiếp.

Kết thúc: **Hoan hô** + sticker như các bài khác.

## 5. Trò chơi "Chọn số"

Một lượt chơi = **8 câu**, khoảng 3 phút. Hai kiểu câu, xen kẽ:

**Kiểu 1 — Nghe số, chọn chữ số:** Bông: *"Find number three!"* → **3 thẻ chữ số to** (ví dụ 3, 7, 1). Bé chạm thẻ đúng.

**Kiểu 2 — Đếm rồi chọn số:** hiện một nhóm đồ vật (ví dụ 4 🦆), Bông: *"How many ducks?"* → bé có thể **chạm đồ vật để đếm** (to ra + Bông đọc số, như bước 4.B) rồi chạm **1 trong 3 thẻ chữ số**.

Quy tắc chung:
- **Đúng:** ding, thẻ đúng to ra, Bông: *"Yes! Three!"* (kiểu 2: *"Yes! Four ducks!"*).
- **Sai:** thẻ lắc nhẹ, Bông đọc số của thẻ đó: *"That's seven. Try again!"*; sai 2 lần thì thẻ đúng phát sáng, Bông nói số đúng, sang câu sau. Không bao giờ nói "wrong", không trừ sao.
- **Chọn số để hỏi:** ưu tiên số bé **ít sao** hơn; mỗi lượt chơi có đủ số dễ (1–5) và khó (6–10); không hỏi một số quá 2 lần một lượt.
- **Thẻ nhiễu:** không trùng nhau; tránh để **6 và 9** cùng xuất hiện (bé dễ nhầm hình); bé chưa có sao nào ở số 6–10 thì thẻ nhiễu chỉ lấy từ 1–5.
- Thẻ chữ số: số to, mỗi số **một màu cố định** (1 đỏ, 2 cam, 3 vàng…) dùng thống nhất ở cả bài học và trò chơi.
- Không chạm sau 15 giây: Bông nhắc lại câu hỏi một lần; vẫn không chạm thì thẻ đúng phát sáng, sang câu sau. Nút ▶ luôn bỏ qua được.
- Kết thúc: Hoan hô + sticker. Trò chơi chơi lại bao nhiêu lần cũng được.

## 6. Tiến độ (sao)

- Mỗi số có tiến độ riêng, khóa **`number:<n>`** (ví dụ `number:3`), lưu trong kho `progress` hiện có, **không lẫn với từ vựng** (từ "three" trong bài từ vựng Colors không bị ảnh hưởng).
- Giống mục Câu nói, **không bao giờ trừ sao**:
  - **Bé chạm đếm đủ** (4.B): +1, tối đa một lần mỗi số mỗi ngày, chỉ đưa tới tối đa 2⭐.
  - **Chọn đúng ngay lần đầu** (4.C hoặc trò chơi): +1, tối đa một lần mỗi số mỗi lượt học/chơi.
  - Muốn 3⭐ trở lên phải chọn đúng (không chỉ chạm đếm).
- Chọn sai: không trừ, chỉ ghi `attempts` (đúng ngay / sai) để bố mẹ xem và để trò chơi ưu tiên số khó.
- Thẻ bài trong danh sách hiện số lần học xong (⭐) như bài khác; sao của từng số xem ở Góc bố mẹ.

## 7. Dữ liệu

- **Không nâng cấp IndexedDB.** Bài số lưu trong kho `lessons` hiện có với `kind: "numbers"`, được **thêm tự động một lần** khi mở app (cờ `numberSamplesSeeded`, giống bài mẫu Câu nói). Nhờ vậy dùng lại danh sách bài, Học tiếp, số lần học, sao lưu.
- Dữ liệu bài nằm trong code của app (`js/numbers.js` → `builtInNumberLessons()`), không cần tải file; "Thêm lại bài mẫu" ở Góc bố mẹ thêm lại cả bài số.

```json
{
  "version": 2,
  "kind": "numbers",
  "mode": "count",
  "title": "Count 1–10",
  "titleVi": "Đếm từ 1 đến 10",
  "emoji": "🎈",
  "numbers": [
    { "n": 1, "word": "one", "item": "balloon", "items": "balloons", "emoji": "🎈" },
    { "n": 2, "word": "two", "item": "crayon", "items": "crayons", "emoji": "🖍️" }
  ]
}
```

```json
{ "version": 2, "kind": "numbers", "mode": "game", "title": "Number game", "titleVi": "Chọn số", "emoji": "🎯", "from": 1, "to": 10, "rounds": 8 }
```

- Kiểm tra JSON: `numbers` có 1–10 phần tử, `n` từ 1 đến 10 không trùng, `emoji` bắt buộc; thiếu `items` thì thêm "s".
- Góc bố mẹ: bài số hiện trong danh sách bài (không cho sửa nội dung ở bản đầu), có **xem tiến độ từng số** (⭐ + đúng/sai) và **Xóa / Thêm lại bài số**.
- App cũ gặp bài `kind: "numbers"` (khi khôi phục sao lưu) thì bỏ qua bài đó như đã làm với loại bài lạ.

## 8. Hiệu ứng và giao diện

| Hiệu ứng | Cách làm |
|---|---|
| Đồ vật xuất hiện | Bay vào lần lượt, mỗi cái cách ~80ms |
| **Đang đếm tới** | Phóng to ~1,4× trong 0,3 giây rồi về ~1,1×, số nhỏ hiện dưới (màu của số) |
| Đếm xong | Cả nhóm nhún một lần; chữ số to phát sáng |
| Chạm lại cái đã đếm | Nhún nhẹ, không đọc số |
| Chọn đúng / sai | Dùng lại hiệu ứng của trò chọn hình hiện có (sao bay / lắc nhẹ) |

- Vẽ bằng CSS + emoji, không cần ảnh. Máy bật **giảm chuyển động** thì chỉ đổi màu nền đồ vật thay vì phóng to.
- Nhịp đếm **khớp với giọng đọc**: số tiếp theo chỉ phóng to khi Bông bắt đầu đọc số đó; giọng đọc lỗi/không có thì vẫn chạy theo thời gian (~0,7 giây/số) và hiện chữ số to.
- Màn hình hẹp (iPhone dọc): chữ số to ở trên, đồ vật ở giữa, Bông ở góc dưới như hiện tại; 10 đồ vật (2 hàng × 5) vừa màn hình không cuộn.

## 9. Offline và giọng đọc

- Toàn bộ code, dữ liệu, emoji nằm trong app (service worker) → học và chơi được khi không có mạng.
- Không cần mic, không cần nhận dạng giọng nói.
- Không có giọng tiếng Anh: chữ số và từ (*three apples*) hiện to, mỗi bước chờ thêm vài giây rồi đi tiếp.

## 10. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Bài 1–10 dài với bé 3 tuổi | Mỗi số ngắn (~25 giây); Học tiếp từ đúng số đang dừng; nút ▶ bỏ qua; xem câu hỏi 13.1 |
| Bé chạm lung tung, chạm nhanh | Chỉ đồ vật chưa đếm mới tính; mỗi chạm đếm đúng thứ tự; giọng đọc cắt câu trước để kịp |
| Giọng đọc iOS chậm/kẹt làm lệch nhịp đếm | Nhịp theo sự kiện bắt đầu đọc, có thời gian dự phòng; không chờ vô hạn |
| Emoji khác nhau giữa các máy | Chỉ dùng emoji phổ biến (có từ iOS 14); 🖍️ thiếu thì dùng ✏️ |
| Bé nhầm 6 và 9 | Không cho 6 và 9 cùng làm thẻ nhiễu |

## 11. Kế hoạch làm

| Bước | Nội dung | Phiên bản |
|---|---|---|
| N-a | Nút Số đếm + bố cục 2×3; danh sách bài số; bài **Đếm 1–10** (A, B, C); tiến độ `number:n`; thêm bài tự động | 0.3.0 |
| N-b | Trò **Chọn số** (2 kiểu câu, chọn số theo sao); Góc bố mẹ xem tiến độ số | 0.3.1 |
| Sau | 11–20; bé nói số (mic); bố mẹ đổi đồ vật; số trong Ôn tập; bài số do AI tạo | spec riêng |

Có thể làm N-a và N-b cùng lúc nếu bố mẹ muốn thử cả hai một lượt.

## 12. Kế hoạch test

**Tự động:**

| Nhóm | Test |
|---|---|
| Dữ liệu | Kiểm tra JSON bài số; số ít/số nhiều (*one balloon*, *six fish*); bài số được thêm đúng một lần; bài từ vựng/câu không đổi |
| Bài đếm | Học hết 1–10 → Hoan hô; Bông đọc *"One"… "Three apples!"*; số nhỏ hiện đúng thứ tự; chạm lại cái đã đếm không tính; hết 15 giây tự đếm nốt; Học tiếp đúng số |
| Chọn hình (4.C) | Nhóm nhiễu chênh ≥ 2; sai 2 lần thì hiện đáp án; không trừ sao |
| Trò chơi | 8 câu; không hỏi một số quá 2 lần; không có 6 và 9 cùng lúc; thẻ không trùng; ưu tiên số ít sao |
| Tiến độ | Chạm đếm +1 tối đa một lần/ngày, tối đa 2⭐; 3⭐ cần chọn đúng; khóa `number:` không lẫn từ vựng |
| Hồi quy | Màn hình chính 2×3 vừa iPhone dọc; bài từ vựng, câu, sticker, sao lưu/khôi phục |

**Thủ công trên iPhone:** nhịp phóng to khớp với giọng đọc; bé tự chạm đếm được; 10 đồ vật vừa màn hình; bé có thích trò chơi không.

## 13. Câu hỏi cần bố mẹ chốt

| # | Câu hỏi | Đề xuất |
|---|---|---|
| 1 | Bài đầu là **1–10 một bài**, hay chia **1–5** và **6–10** cho ngắn? | Giữ **1–10 một bài** như bố mẹ muốn; mỗi số ngắn và có Học tiếp. Nếu bé chán giữa chừng thì chia sau |
| 2 | Trò Chọn số là **thẻ bài riêng**, hay tự chạy cuối bài đếm? | **Thẻ riêng** (chơi lại nhiều lần được); bài đếm đã có bước 4.C để ôn ngay |
| 3 | Bé có **nói số** để app nghe không? | **Chưa** ở bản đầu (đếm bằng chạm là chính, mic trên iPhone cần mạng) |
| 4 | Danh sách đồ vật ở mục 3 có ổn không? | Bố mẹ đổi tùy ý, ví dụ đồ vật bé có ở nhà |
| 5 | Bố cục màn hình chính 2×3 (Sticker vào lưới) | Đồng ý |

## 14. Mở rộng (app 0.5.0): bài Đếm 11–20 và ảnh đồ vật

> Chốt 2026-10-12: 11–20 **đếm tiếp từ 10**; ảnh đồ vật do AI vẽ (ảnh lưới như bài từ vựng), không có ảnh thì dùng emoji. **Đã làm xong trong app 0.5.0.** Danh sách bài số xếp theo số bài (1–10 trước 11–20).

### 14.1. Bài "Count 11–20 / Đếm từ 11 đến 20"
| Số | Đồ vật | Số | Đồ vật |
|---|---|---|---|
| 11 | 🐝 bee | 16 | 🐚 shell |
| 12 | 🥚 egg | 17 | 🍬 candy (candies) |
| 13 | 🍪 cookie | 18 | ⚽ ball |
| 14 | 🍓 strawberry (strawberries) | 19 | 🧁 cupcake |
| 15 | 🦋 butterfly (butterflies) | 20 | 🍃 leaf (leaves) |

- **Khung 10:** 10 đồ vật đầu xếp 2 hàng × 5 trong **một khung có viền và nhãn "10"**; phần còn lại xếp hàng tối đa 5 bên dưới.
- **A. Bông đếm:** khung 10 sáng lên, Bông nói *"Ten!"*, rồi đếm tiếp từng cái còn lại *"Eleven, twelve…"* (to ra + số nhỏ như bài 1–10), cuối cùng *"Fifteen butterflies!"*.
- **B. Bé chạm đếm:** khung 10 đã đếm sẵn (hiện "10"); Bông: *"Ten! Your turn! Tap and count!"* — bé chỉ chạm **phần thêm**, mỗi chạm Bông đọc số tiếp theo từ eleven.
- **C. Chọn nhóm đúng:** 2 nhóm (đều có khung 10 thu nhỏ) chênh nhau ít nhất 2, ví dụ 12 và 17.
- Bài được **thêm tự động một lần** cho máy đã có bài 1–10 (cờ riêng); bố mẹ xóa rồi thì không tự thêm lại (dùng "Thêm lại bài mẫu").
- Trò **Chọn số** (thẻ "Number game") vẫn là 1–10; **thẻ riêng "Chọn số 11–20"** (app 0.5.1, chốt 2026-10-12) — cùng luật, 8 câu, nửa 11–15 nửa 16–20, đồ vật của bài 11–20. Số 11–20 cũng có trong **Ôn tập** và **Trò chơi tổng hợp**. Thẻ sai của số 11–20 lấy trong 11–20, của số 1–10 lấy trong 1–10.
- Trò Chọn số dùng **ảnh đồ vật** bố mẹ đã thêm ở bài đếm cùng khoảng số (ảnh mới nhất của đồ vật đó).

### 14.2. Ảnh đồ vật (thay emoji)
- Trang bài số trong Góc bố mẹ có mục **"Ảnh đồ vật — 1 ảnh lưới cho cả bài"**, dùng lại đúng phần ảnh lưới của bài từ vựng: **Copy prompt** → AI vẽ 1 ảnh lưới (mỗi ô **một đồ vật đơn lẻ**, nền trắng, không có Bông) → **Chọn ảnh** → app cắt, bố mẹ gán từng ô → **Lưu**.
- Ảnh lưu trong kho `images` (như từ vựng) theo bài + tên đồ vật; **không nâng cấp IndexedDB**, sao lưu / chia sẻ bài mang theo ảnh như bài từ vựng.
- Thẻ bài trong danh sách Số đếm dùng **ảnh đồ vật đầu tiên** làm ảnh bìa, chưa có ảnh thì emoji (app 0.6.8). Thẻ **trò chơi** lấy **ngẫu nhiên ảnh của một đồ vật khác** đồ vật đầu tiên (không trùng thẻ bài đếm) và có **huy hiệu 🎯** ở góc (app 0.6.10).
- Khi học / chơi: đồ vật có ảnh thì **lặp lại ảnh đó n lần** thay cho emoji; ảnh lỗi hoặc chưa có thì dùng emoji. Ở Ôn tập / Trò chơi tổng hợp dùng ảnh mới nhất của đồ vật đó.
