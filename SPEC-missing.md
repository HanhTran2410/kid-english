# SPEC — 🔍 Tìm đồ còn thiếu (What's missing?)

> Phiên bản spec: **draft2** · Ngày: 2026-10-19 · App **0.22.0** (0.22.1: Next luôn hiện, chạm đồ trong tranh nghe tên) · **Đã làm.**
> draft2 = draft1 + 3 câu hỏi đã chốt + review (mã ô riêng, vùng nhận chồng nhau, xem tranh đầy đủ ở cả 3 mức, bóng dự phòng, gợi ý không đếm lúc bận).
> Một trò trong **Góc trò chơi** (🎲 Play). Dùng **cả cảnh Dán tranh** (SPEC-scenes) **lẫn 4 cảnh riêng** (mâm cơm, giờ tắm, góc học bài, dã ngoại).

## 1. Mục tiêu
- Bé 3 tuổi **quan sát và ghi nhớ** một bức tranh quen thuộc rồi nhận ra **đồ vật còn thiếu**. Đây là trò **ghi nhớ**, không phải trò đoán theo bóng, nên mức nào bé cũng được xem tranh đầy đủ trước.
- Chỗ thiếu hiện thành **bóng trắng** đúng hình đồ vật. Bé **kéo** đồ đúng từ khay vào bóng; đủ đồ thì sang tranh khác.
- Học **tên đồ vật** bằng tiếng Anh và câu *"What's missing?"*.
- Không có "sai" nặng nề: kéo nhầm thì đồ nảy về khay, không trừ gì.

## 2. Màn hình
```
 🏠  🎲  🔁   🔍 What's missing?          2/5        🐰
 ┌─────────────────────────────────────────┐
 │  tranh (4:3)                             │
 │   🍎  🍌   ⬜(bóng thìa)   🥛  ⬜(bóng cốc)  │  ← bóng trắng đúng hình đồ thiếu
 └─────────────────────────────────────────┘
   phụ đề (hàng riêng, cao cố định 96 px)
  [🥄] [🧦] [🥛]   ➡️ Next                    ← khay: đồ thiếu + đồ lạ (mức 2–3), xáo thứ tự; Next luôn hiện
```
- Phụ đề tiếng Việt cho **mọi câu**, **nằm hàng riêng** (không đè lên tranh / khay).
- **🔁** làm lại tranh này (chọn lại đồ thiếu); **🐰 chạm Bông**: nghe lại *"What's missing?"* + bóng đầu tiên còn trống sáng lên một chút (không tính là gợi ý).
- **➡️ Next luôn hiện** (0.22.1): bé không thích tranh thì bấm Next để sang tranh khác ngay, kể cả lúc đang xem tranh đầy đủ.
  - Bỏ qua: không khen, không đọc lại tên, không ghi tiến độ cho đồ chưa đặt; tranh bỏ qua vẫn tính là 1 trong 5 tranh của lượt.
  - Đang chơi: nút nhỏ, hơi mờ. Xong tranh: nút to, nhún 3 lần mời bấm (giảm chuyển động: không nhún).
- Điện thoại dọc: tranh trên, khay dưới; đồ trong khay 72 px (máy tính bảng 84 px).

## 3. Cách chơi
| Lúc | App |
|---|---|
| Vào tranh | Tranh hiện **đầy đủ**, khay trống: **2 giây** (mức 1), **1,5 giây** (mức 2), **1 giây** (mức 3). Rồi đồ "bay mất" thành bóng trắng (tiếng "vút"): *"Oh no! Something is missing!"* (*Ôi! Có đồ bị mất rồi!*) |
| Hỏi | *"What's missing?"* (*Còn thiếu cái gì nhỉ?*). Bóng trắng nhấp nháy nhẹ (mức 1–2) |
| Kéo đồ **đúng** vào **bóng của nó** | Đồ bay vào chỗ, bóng biến mất, tiếng "tách": *"Yes! The spoon!"* (*Đúng rồi! Cái thìa!*) + câu kèm theo nếu có (*"We eat with a spoon!"*) |
| Kéo đồ thiếu vào **bóng của đồ thiếu khác** | Nảy về khay: *"Hmm, not there! Try again!"* (*Không phải chỗ này! Thử lại nhé!*) |
| Kéo **đồ lạ** (không thuộc tranh) vào tranh | Nảy về khay: *"That's a sock! It doesn't belong here!"* (*Đó là chiếc tất! Không ở đây đâu!*). Danh từ luôn số nhiều: *"Those are socks! They don't belong here!"* |
| Thả ra ngoài mọi bóng | Về khay, **không nói gì**, không tính sai |
| **Chạm** một đồ trong khay | Đồ nhún, Bông nói tên kèm mạo từ (*"A spoon!"*, *"An egg!"*, *"Milk!"*); không tự đặt |
| **Chạm một đồ đang có trong tranh** (đồ không thiếu, hoặc đồ vừa đặt) — 0.22.1 | Đồ nhún, Bông đọc tên (*"A cup!"*, *"Milk!"*). Không ghi tiến độ, không tính gợi ý; chạm được cả khi tranh đã xong |
| **Chạm một bóng** | Bóng nhún: *"What goes here?"* (*Cái gì ở đây nhỉ?*). Không tính sai, không tính gợi ý |
| Đủ hết | Tranh hoàn chỉnh, các đồ vừa tìm nhún, Bông đọc lại tên trần: *"Spoon! Cup! Everything is back! Great job!"* (*Đủ cả rồi! Giỏi quá!*). Kéo-thả khóa; **➡️ Next** to lên và nhún |

**Gợi ý** (tối đa **2 lần / tranh**):
- **Sai 2 lần** với cùng một đồ: bóng đúng của đồ đó **lấp lánh**, đồ đó trong khay nhún.
- **10 giây không làm gì**: bóng còn trống lấp lánh, ưu tiên đồ bé đã nhầm nhiều nhất, không thì bóng đầu tiên.
  - Không đếm khi Bông đang nói, bé đang kéo hoặc đồ đang bay; gặp lúc bận thì đếm lại từ đầu.
  - Sau mỗi lần gợi ý, đếm lại 10 giây.
- Chạm bóng / chạm Bông không làm tăng số lần gợi ý.

**Một lượt = 5 tranh** khác nhau. Xong thì hoan hô + **sticker** (một lần mỗi lượt) → về Góc trò chơi.

## 4. Bóng trắng (chỗ đồ thiếu)
- Bóng là **đúng hình đồ vật**, tạo từ chính ảnh / emoji của đồ: CSS `filter: brightness(0) invert(1)` (lấy theo kênh trong suốt của ảnh). `drop-shadow` vàng nhạt + tím mờ chỉ để **tăng tương phản** trên nền sáng; nó không quyết định hình bóng.
  - **Sticker Dán tranh** đã bỏ nền: bóng đúng dáng.
  - **Emoji**: bóng đúng dáng (bộ lọc áp được lên chữ).
  - **Ảnh không có nền trong suốt** (ví dụ ảnh bố mẹ chọn còn nền trắng): app xét viền ảnh thu nhỏ 24 × 24. Dưới một nửa điểm viền trong suốt thì **bóng dùng emoji** của đồ đó, không để thành ô chữ nhật trắng. Đồ trong khay vẫn dùng ảnh.
- Bóng **nằm đúng chỗ, đúng cỡ** đồ vật trong tranh đầy đủ.
- **Mức 3:** bóng mờ hơn (opacity 0.5), không nhấp nháy.
- **Giảm chuyển động:** không nhấp nháy / bay / nảy; gợi ý là viền cam đứng yên; đồ đặt thẳng vào chỗ.

## 5. Nội dung
### 5.1. Tranh = bố cục cố định
Mỗi tranh là `{ id, scene, en, vi, items: [{ item, x, y, size }] }` trên khung **400 × 300**:
- `item` là **mã ô riêng**, duy nhất trong tranh (đóng vai `instanceId`: bóng, kéo-thả và trạng thái đều theo mã này).
- **Tên tiếng Anh** (`name` của đồ trong cảnh) chỉ dùng để đọc, tìm ảnh và ghi tiến độ "đã gặp".
- Danh sách đồ của mỗi tranh **khai báo rõ** trong `missing.js`, không suy ra từ danh sách sticker hiện có.

**13 tranh:**

| Tranh | Cảnh | Nguồn |
|---|---|---|
| Bữa ăn, Tủ lạnh | nhà bếp | Dán tranh |
| Giờ đi ngủ, Góc đồ chơi | phòng ngủ | Dán tranh |
| Đi biển, Công viên, Nông trại, Rừng xanh, Vũ trụ | (mỗi cảnh 1 tranh) | Dán tranh |
| 🍚 Mâm cơm | bát, đũa, thìa, canh, cá, rau, chén trà | **cảnh riêng** |
| 🛁 Giờ tắm | bàn chải, xà phòng, vịt, bông tắm, dầu gội, xô | **cảnh riêng** |
| 📚 Góc học bài | sách, bút chì, bút sáp, thước, kéo, ba lô | **cảnh riêng** |
| 🧺 Dã ngoại | bánh mì kẹp, nước quả, chuối, bánh quy, giỏ, bóng, táo | **cảnh riêng** |

**Quy tắc dữ liệu** (unit test kiểm tra):
- mỗi tranh có ≥ 5 đồ, mã ô không trùng;
- đồ nằm **trọn** trong khung, tính cả cỡ đồ;
- cỡ ≥ 36 / 400;
- hai đồ không đè nhau: khoảng cách tâm ≥ 0,85 × trung bình cạnh.

### 5.2. Đồ lạ (mức 2–3)
- Lấy từ **cảnh khác** (cả Dán tranh lẫn cảnh riêng).
- **Không trùng tên** với bất kỳ đồ nào trong tranh, và không trùng nhau.
- Đồ lạ không có bóng, nên không thể "đúng". Thả trong tranh thì sai, ngoài tranh thì không tính.

### 5.3. Chọn đồ thiếu
1. Xáo các ô của tranh, rồi xếp theo **số lần bé đã gặp** từ đó (ít gặp trước).
2. Lấy lần lượt, bỏ qua ô **cùng tên** với ô đã chọn hoặc **sát** một ô đã chọn.
   - Hai ô A, B gọi là **sát nhau** khi khoảng cách tâm < **1,2 × (cạnh A + cạnh B) / 2**, đo trên khung 400 × 300.
3. Không đủ ô thỏa điều kiện thì tranh đó **thiếu ít đồ hơn** (không chọn bóng sát nhau). Với 13 tranh hiện có, mức 3 luôn đủ 3 đồ (đã thử 2 000 lần mỗi tranh).
4. Một lượt 5 tranh không lặp tranh.

### 5.4. Câu nói
- **Mạo từ:**
  - *a / an* cho danh từ đếm được;
  - không mạo từ cho danh từ luôn số nhiều (*socks, chopsticks, sunglasses…*) và danh từ không đếm được (*milk, juice, soup, bread, soap…*);
  - đọc lại cuối tranh dùng **tên trần** (*"Spoon! Cup!"*).
- **Câu kèm theo** (ngắn, dùng lại được), mỗi câu có phụ đề:
  - *spoon:* "We eat with a spoon!"
  - *chopsticks:* "We eat with chopsticks!"
  - *bowl:* "A bowl of rice! Yummy!"
  - *cup:* "We drink with a cup!"
  - *socks:* "Socks go on your feet!"
  - *toothbrush:* "We brush our teeth!"
  - *soap:* "We wash our hands with soap!"
  - *pencil:* "We draw with a pencil!"
  - *teddy bear:* "Good night, teddy!"

### 5.5. Mức (tự lên ở lượt sau, bố mẹ khóa được)
| Mức | Xem tranh đầy đủ | Đồ thiếu | Đồ lạ | Bóng |
|---|---|---|---|---|
| **1** (mặc định) | 2 giây | 1 | 0 | rõ + nhấp nháy |
| **2** | 1,5 giây | 2 | 1 | rõ + nhấp nháy |
| **3** | 1 giây | 3 | 2 | mờ hơn, không nhấp nháy |
- **Cài đặt** `missingGame = { level, rounds, lock }`, cùng dạng với các trò trước.
  - `rounds` = số **lượt 5 tranh đã chơi xong** ở mức hiện tại.
  - Đủ **3 lượt** thì lên mức (tối đa 3) và `rounds` về 0.
  - `lock` (Góc bố mẹ → Cài đặt → *Mức chơi Tìm đồ còn thiếu*) giữ cố định mức.
  - Dữ liệu hỏng thì về mức 1.

## 6. Ảnh
| | Cảnh Dán tranh | Cảnh riêng |
|---|---|---|
| Đồ vật | sticker Dán tranh (`scene:stickers`, theo tên) → emoji | ảnh `missing:items` (theo mã đồ) → emoji |
| Nền | ảnh nền Dán tranh (`scene:bg`) → tranh vẽ sẵn | ảnh `missing:bg` → tranh vẽ sẵn (SVG) |
| Thay ở | Góc bố mẹ → Ảnh Dán tranh | Góc bố mẹ → **Ảnh Tìm đồ còn thiếu** |

- **Bố cục không phụ thuộc ảnh.** Thay sticker / ảnh nền không đổi mã ô, vị trí hay cỡ; không có ảnh thì emoji vẫn đúng chỗ, đúng vùng nhận.
  - App **không tự nhận diện** đồ trong ảnh nền mới, nên ảnh nền phải chừa trống đúng các khung đặt đồ (nói rõ trong trang Góc bố mẹ).
- **Trang Ảnh Tìm đồ còn thiếu** (mỗi cảnh riêng một mục):
  - ảnh nền kèm **khung chỗ đặt đồ**, tải **ảnh bố cục mẫu**, chép **prompt** tạo ảnh nền (chừa trống đúng chỗ, không vẽ đồ, không chữ);
  - chọn ảnh nền → xem với khung → **✔ Khớp — lưu ảnh này** / **✖ Chưa khớp** (không lưu); **Dùng tranh vẽ sẵn**;
  - từng đồ vật: chọn ảnh, **Ảnh có sẵn (n)…** (sticker Dán tranh + ảnh bài học cùng tên, kèm nguồn), **Dùng emoji**.
- **♻️ Dùng lại ảnh đã có (n món):** chép một lần cho mọi đồ chưa có ảnh.
  - Sticker Dán tranh **sao chép nguyên** (đã bỏ nền); ảnh bài học được **bỏ nền trắng**.
  - Sửa / xóa ảnh gốc không ảnh hưởng bản sao.
- **Chia sẻ** ảnh `missing:bg` + `missing:items` qua file; nhập ở trang này hoặc Quản lý bài (ảnh mới hơn thắng).
- Bộ lọc "ảnh trò chơi" (`db.latestImageForWord`, gợi ý ảnh bài học) có thêm tiền tố `missing:`, nên bản sao không bị gợi ý như ảnh bài học.

## 7. Kéo-thả, trạng thái
- **Điểm thả = vị trí ngón tay**, đổi sang khung 400 × 300 (như Ghép hình; không dùng khung của hình kéo, vì giảm chuyển động làm nó lệch).
- **Vùng nhận** của bóng: bán kính = max(**28**, 0,45 × cạnh đồ), tính bằng **đơn vị khung 400 × 300**, không phải px màn hình.
- **Phán đoán:**
  - xét các bóng **còn trống** có điểm thả trong vùng nhận;
  - nếu chồng nhau, lấy bóng có **khoảng cách chuẩn hóa** (khoảng cách / bán kính) **nhỏ nhất**, nên thứ tự mảng không quyết định;
  - bóng đó của chính đồ → **đúng**; của đồ khác → **sai**;
  - không trúng bóng nào → **không tính** (đồ lạ thả trong tranh → sai).
- **Một lần một đồ:**
  - đang bay / đang nảy thì thả đồ khác chỉ cho nó về khay;
  - ngón thứ hai bỏ qua;
  - chạm (di < 8 px) là "nghe tên", không phải kéo.
- **Mã lượt:** 🔁, ➡️ Next, 🏠, 🎲 đều tăng mã. Hẹn giờ / câu nói / hoạt ảnh cũ không đổi tranh mới; rời màn thì hủy mọi hẹn giờ.
- **Next bấm liên tục:** chỉ nhận một lần.
- **App ra nền rồi quay lại** (≤ 10 phút, cùng mức): giữ thứ tự 5 tranh, tranh đang chơi, các đồ đã đặt và đồ lạ trong khay; Bông hỏi lại *"What's missing?"*.
- **Tiến độ:** đặt **đúng** một đồ thì ghi **"đã gặp"** từ đó (như Chọn từ). Chạm khay để nghe tên **không** tính. Mỗi bóng chỉ đặt đúng được một lần nên không cộng hai lần. Không tính sao trò chơi.

## 8. Mốc làm (0.22.0, làm một lần)
- **Góc trò chơi:**
  - thẻ 🔍 *What's missing?*, 13 tranh, mức 1–3, bóng trắng + dự phòng emoji;
  - kéo đúng / sai / không tính, đồ lạ, gợi ý, tranh hoàn chỉnh + đọc lại tên;
  - 5 tranh + sticker, tự lên mức / khóa mức, ra nền giữ trạng thái.
- **Góc bố mẹ:** trang Ảnh Tìm đồ còn thiếu, dùng lại ảnh, chia sẻ, nhập ở Quản lý bài; Cài đặt có mục *Mức chơi Tìm đồ còn thiếu*.

## 9. Kiểm thử
**Unit** (`tests/unit/missing.test.js`)
- 13 tranh (9 cảnh Dán tranh + 4 cảnh riêng): đồ có trong cảnh, mã không trùng, trọn trong khung, cỡ ≥ 36, không đè nhau.
- Chọn đồ thiếu theo mức 1 / 2 / 3 (mọi tranh, nhiều lần):
  - không cùng tên, không sát nhau (ngưỡng 1,2);
  - ưu tiên đồ ít gặp;
  - bố cục quá chật thì chọn ít hơn.
- Đồ lạ: luôn từ cảnh khác, không trùng tên với tranh, không trùng nhau.
- Phán đoán thả:
  - đúng / sai / không tính;
  - vùng nhận chồng nhau theo bóng gần nhất (đảo thứ tự mảng vẫn cùng kết quả);
  - bóng đã đặt không còn là chỗ sai.
- Câu nói: mạo từ, số nhiều, không đếm được, đọc lại tên.
- Lượt 5 tranh không lặp; lên mức sau 3 lượt; khóa mức; dữ liệu hỏng.
- Prompt ảnh nền cảnh riêng.

**UI** (`tests/ui/missing.spec.js`, chế độ nhanh)
- Mức 1: một bóng, khay một đồ → *"Oh no!…"*, *"What's missing?"* → kéo vào bóng → *"Yes! The …!"* → *"Everything is back!"* → Next sang 2/5.
- Mức 2:
  - vào bóng khác → *"Hmm, not there!"*; lần 2 thì bóng đúng sáng;
  - đồ lạ → *"… belong here!"*; thả ra ngoài thì im lặng;
  - chạm khay → tên; chạm bóng → *"What goes here?"*.
- Chạm đồ đang có trong tranh → đồ nhún, Bông đọc tên; không ghi tiến độ.
- Next luôn hiện: bấm lúc đang chơi / đang xem tranh → tranh khác, không khen, không ghi tiến độ; xong tranh thì Next nhún.
- Gợi ý 10 giây.
- 5 tranh → sticker, `rounds` = 1, có tiến độ từ.
- Mức 3: xem tranh đầy đủ trước (chưa có bóng, khay trống), rồi 3 bóng mờ + 2 đồ lạ.
- Ra nền rồi quay lại: giữ tranh và đồ đã đặt.
- Ảnh:
  - sticker Dán tranh / ảnh `missing:items` / emoji;
  - ảnh nền đục thì bóng dùng emoji.
- Góc bố mẹ: 4 cảnh riêng, dùng lại sticker, ảnh nền ✖ không lưu / ✔ lưu.
- Giảm chuyển động: bóng không nhấp nháy.

**Thử tay với bé:**
- bóng trắng có đủ rõ trên ảnh nền sáng / tối không;
- 2 giây xem tranh ở mức 1 có đủ không;
- bé có hiểu kéo (không phải chạm) để đặt đồ không.

## 10. Đã chốt
1. **Góc trò chơi** (cạnh Dán tranh, Ghép hình).
2. **Xem tranh đầy đủ trước ở cả 3 mức:** 2 / 1,5 / 1 giây. Theo review, thay cho đề xuất "mức 3 vào thẳng": trò này là ghi nhớ, nên mức 3 khó hơn nhờ nhiều đồ thiếu, có đồ lạ và bóng mờ.
3. **Cả cảnh Dán tranh lẫn cảnh riêng** (mâm cơm, giờ tắm, góc học bài, dã ngoại). Cảnh riêng chạy ngay bằng tranh vẽ sẵn + emoji; bố mẹ thay ảnh ở Góc bố mẹ.

**Không làm theo review (ghi lại lý do):**
- *Đổi tên `rounds` thành `completedSessionsAtLevel`*: giữ `rounds` cho cùng dạng với `feedGame`, `shapeGame`; nghĩa đã ghi ở mục 5.5.
- *Thêm trường `instanceId` riêng*: mã ô `item` đã duy nhất trong tranh và tách khỏi tên tiếng Anh (`name`), nên đúng vai trò đó.

## 11. Thêm tranh (app 0.24.0)
- **3 tranh mới** theo 3 cảnh Dán tranh mới: đường phố, tiệc sinh nhật, ngày tuyết rơi. Tổng 16 tranh.
- **Tranh tuyết** nền gần như trắng nên bóng trắng khó thấy: tranh có `ghost: 'dark'` thì bóng màu **xám đậm** (opacity 0.45; mức 3 là 0.3), viền trắng, gợi ý vẫn lấp lánh vàng.
