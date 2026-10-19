# SPEC — 🔺 Đếm hình (Count the shapes)

> Phiên bản spec: **draft1 (đã chốt)** · Ngày: 2026-10-19 · **Đã làm S1 + S2 trong app 0.21.0** (ghi chú khi code ở mục 12).
> - **Câu hỏi đã chốt (theo đề xuất):** chỉ ở Số đếm; mức 1 không có bước chọn số; có câu khởi động *"Find a circle!"* ở mức 1 khi bé chưa gặp loại hình.
> Thẻ mới trong mục **🔢 Số đếm**, cạnh *Đếm từ 1 đến 10*, *Đếm từ 11 đến 20*, *Chọn số* (SPEC-numbers).

## 1. Mục tiêu
- Bé 3 tuổi **đếm** (1–5, rồi đến 10) và học **tên hình học** bằng tiếng Anh: *circle, square, triangle* (mức 1), thêm *rectangle, star, heart* (mức 2).
- Mỗi tranh là **một đồ vật quen thuộc ghép từ các hình** (thuyền, nhà, ô tô, người tuyết…). Bông hỏi *"How many triangles?"*.
- Bé **chạm từng hình tam giác** để đếm: hình sáng lên, hiện số, Bông đếm *"One! Two! Three!"*.
  - Ví dụ thuyền: 2 cánh buồm + 1 lá cờ = **3 hình tam giác**.
- Bé thấy hình học có ở khắp nơi ("lá buồm là hình tam giác!").
- Không có "sai": chạm nhầm hình khác thì Bông **nói tên hình đó** (*"That's a circle!"*), cũng là học. Không trừ sao, không bao giờ nói "wrong".

## 2. Vị trí và màn hình
- **Số đếm** → thêm thẻ **🔺 Count the shapes / Đếm hình** (sau *Chọn số*).
- Một lượt chơi = **5 câu** (~3–4 phút), xong thì hoan hô + sticker như *Chọn số*.
```
 🏠  ▶                      Câu 2/5            🐰
 ┌──────────────────────────────┐   [ 🔺 ]   ← thẻ "hình cần đếm": hình mẫu to + tên
 │      tranh ghép từ hình        │   0 / ?   ← bộ đếm (số bé đã chạm)
 │      (thuyền, nhà, xe…)        │
 └──────────────────────────────┘
   phụ đề (hàng riêng, cao cố định)
```
- **Thẻ hình cần đếm** luôn hiện **hình mẫu** (không chỉ chữ / màu): bé biết đang tìm hình gì. Chạm thẻ thì Bông nhắc lại câu hỏi.
- **Bộ đếm** hiện số đã chạm (1, 2, 3…), không hiện đáp án trước.
- Phụ đề tiếng Việt cho mọi câu, **nằm hàng riêng** (không đè lên tranh, bài học từ Trốn tìm / Ghép hình).
- **▶** bỏ qua câu (như mọi bài); 🏠 thoát.

## 3. Cách chơi một câu
| Lúc | App |
|---|---|
| Mở tranh | *"Look! A boat!"* (*Nhìn này! Cái thuyền!*). Lần đầu gặp một loại hình trong lượt: *"This is a triangle!"*, thẻ hình mẫu nảy lên |
| Hỏi | *"How many triangles?"* (*Có bao nhiêu hình tam giác?*) |
| Chạm **hình đúng loại**, chưa đếm | Hình sáng viền + hiện **huy hiệu số** (1, 2, 3… màu cố định của số như bài Số đếm), tiếng "pop" cao dần, Bông: *"One!"*, *"Two!"*… Bộ đếm tăng |
| Chạm lại hình **đã đếm** | Hình nảy nhẹ, **không đếm lại**; Bông đọc lại số của nó (*"That's two!"*) |
| Chạm **hình khác loại** | Hình lắc nhẹ, Bông: *"That's a circle!"* (*Đó là hình tròn!*). Không đếm, không tính sai |
| Chạm chỗ trống / nét trang trí | Không có gì |
| Đếm **đủ** | Mọi hình đúng loại nhấp nháy theo thứ tự 1 → N, Bông: *"Three triangles! Great counting!"* (*Ba hình tam giác! Con đếm giỏi quá!*), ding |
| **Mức 2** — bước chọn số | Sau khi đếm đủ: *"How many triangles?"* + **3 thẻ chữ số** (như *Chọn số*). Đúng: *"Yes! Three!"*; sai: *"That's five. Try again!"*, sai 2 lần thì thẻ đúng sáng |
| Sang câu sau | Tranh mới (hoặc cùng tranh, hỏi loại hình thứ hai — mức 2) |

**Gợi ý khi bé chưa tìm ra:**
- **10 giây không chạm** (tính từ khi Bông hỏi xong): một hình đúng loại **chưa đếm** lấp lánh.
- Tối đa 2 lần gợi ý mỗi câu; lần 2 lấp lánh cả các hình còn lại.
- Lần chạm nhầm thứ 3 trong câu: Bông nói *"Find the triangles!"* + thẻ hình mẫu nảy.
- Không tự kết thúc câu khi bé chưa đếm đủ; ▶ luôn bỏ qua được.

**Câu nói:**
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Mở tranh | Look! A boat! | Nhìn này! Cái thuyền! |
| Giới thiệu hình | This is a triangle! | Đây là hình tam giác! |
| Hỏi | How many triangles? | Có bao nhiêu hình tam giác? |
| Đếm | One! / Two! / … | 1! / 2! … (huy hiệu số) |
| Chạm hình khác | That's a circle! | Đó là hình tròn! |
| Chạm lại hình đã đếm | That's two! | Hình này là số 2! |
| Nhắc | Find the triangles! | Tìm hình tam giác nào! |
| Đủ | Three triangles! Great counting! / One triangle! Great counting! | Ba hình tam giác! Con đếm giỏi quá! |
| Mức 2 chọn số | (như *Chọn số*: *Yes! Three!* / *That's five. Try again!*) | |
- Câu hỏi luôn số nhiều (*How many circles?*, kể cả khi đáp án là 1); câu tổng kết theo số: *One circle! / Two circles!*.
- **Số đọc ở một nhịp**: chạm nhanh liên tiếp thì câu số mới **thay** câu số cũ (không xếp hàng). Huy hiệu vẫn hiện đủ, nên bé không mất số nào.

## 4. Nội dung

### 4.1 Hình học
| Hình | en | vi | Mức |
|---|---|---|---|
| ⚪ | circle | hình tròn | 1 |
| 🟥 | square | hình vuông | 1 |
| 🔺 | triangle | hình tam giác | 1 |
| ▬ | rectangle | hình chữ nhật | 2 |
| ⭐ | star | ngôi sao | 2 |
| ❤️ | heart | trái tim | 2 |
- **Hình vuông và hình chữ nhật** dễ nhầm. Ở mức 1 không bao giờ hỏi hình vuông trong tranh có hình chữ nhật gần giống vuông. Trong dữ liệu, hình chữ nhật có tỉ lệ cạnh **≥ 1,6**.

### 4.2 Tranh (vẽ SVG, mỗi vùng là đúng **một** hình học)
| Tranh | Hình (số lượng) | Hỏi ở mức 1 | Hỏi ở mức 2 |
|---|---|---|---|
| ⛵ boat | tam giác 3 (2 buồm + cờ), tròn 2 (cửa sổ), chữ nhật 1 (thân); cột buồm, sóng là nét | triangles 3 | triangles 3, circles 2 |
| 🏠 house | vuông 1 (tường), tam giác 1 (mái), chữ nhật 2 (ống khói, cửa), tròn 3 (2 cửa sổ + mặt trời) | circles 3 / triangles 1 | circles 3, rectangles 2 |
| 🚗 car | chữ nhật 2 (khoang, thân), vuông 2 (cửa kính), tròn 3 (2 bánh + đèn) | circles 3 / squares 2 | circles 3, squares 2 |
| ⛄ snowman | tròn 3 (thân), chữ nhật 1 (mũ), tam giác 1 (mũi); mắt, cúc áo là chấm | circles 3 / triangles 1 | circles 3, triangles 1 |
| 🚀 rocket | tam giác 3 (mũi + 2 cánh), tròn 2 (cửa sổ), chữ nhật 1 (thân), sao 4 | triangles 3 / circles 2 | triangles 3, stars 4 |
| 🤖 robot | vuông 2 (đầu, thân), tròn 2 (mắt), tam giác 1 (ăng-ten), chữ nhật 4 (2 tay, 2 chân) | circles 2 / squares 2 | rectangles 4, squares 2 |
| 🌲 trees | tam giác 6 (2 cây × 3 tầng), chữ nhật 2 (thân cây), tròn 1 (mặt trời) | — | triangles 6 |
| 🚂 train | chữ nhật 2 (toa), vuông 4 (cửa sổ), tròn 6 (bánh) | squares 4 | squares 4, circles 6 |
| 🎂 cake | chữ nhật 3 (đĩa + 2 tầng), tim 3, sao 2, tròn 5 (anh đào) | circles 5 | hearts 3, stars 2 |
| 🎈 party | tròn 4 (bóng bay), tam giác 3 (mũ), sao 5, tim 2; dây bóng là nét | triangles 3 / circles 4 | stars 5, circles 4 |
| 🏰 castle | chữ nhật 1 (tường), vuông 3 (tháp), tam giác 3 (mái tháp), tim 1 (cờ) | triangles 3 / squares 3 | squares 3, triangles 3 |
| 🐟 fish | tròn 1 (thân), tam giác 2 (đuôi, vây); mắt là chấm | triangles 2 | triangles 2 |
- Mức 1 mỗi tranh hỏi **một** loại (chọn trong danh sách); mức 2 hỏi tối đa 2 loại liền nhau trên cùng tranh.
- Đáp án ở mức 1 trải đều 1–5 (không dồn vào số 3).
- **Quy tắc vẽ để đếm không mơ hồ:**
  - mỗi vùng tô màu là đúng **một hình học trọn vẹn**, không có hình méo / bầu dục / hình thang;
  - **không lồng hình cùng loại vào nhau** (cửa sổ vuông nằm trong tường chữ nhật thì được; vuông trong vuông thì không);
  - **mắt, miệng, sóng, dây** là **nét trang trí**: không chạm được, không tính;
  - hình nhỏ nhất ≥ **24/200** cạnh ngắn; nếu nhỏ hơn thì vùng chạm nới thêm (vùng chạm vô hình ≥ 44 pt trên iPad).
- Dữ liệu ghi rõ số lượng từng loại; **unit test đếm lại** từ hình vẽ, để không bao giờ hỏi sai đáp án.

### 4.3 Mức (tự lên, bố mẹ khóa được — như Ghép hình)
| Mức | Hình hỏi | Đáp án | Mỗi tranh | Bước chọn số |
|---|---|---|---|---|
| **1** (mặc định) | circle, square, triangle | 1–5 | hỏi 1 loại | không |
| **2** | + rectangle, star, heart | 1–10 | hỏi 1–2 loại | có (3 thẻ số) |
- Lên mức 2 sau **3 lượt chơi xong** ở mức 1. Áp dụng từ **lượt sau**.
- Bố mẹ khóa mức trong Cài đặt.
- **Chọn câu trong một lượt:**
  - không lặp tranh;
  - mỗi loại hình xuất hiện ít nhất một lần nếu có thể;
  - ưu tiên số bé ít sao (như *Chọn số*);
  - không hỏi cùng một đáp án quá 2 lần.

## 5. Tiến độ, phần thưởng
- **Sao số:** đếm đủ một câu thì ghi tiến độ cho **số N** (đáp án), như *Chọn số*.
  - Mức 2 chọn đúng thẻ ngay lần đầu thì thêm sao như *Chọn số*.
  - Không bao giờ trừ sao.
- **Từ hình học:** ghi "đã gặp" từ *triangle, circle…* (kho tiến độ chung), để xem trong Góc bố mẹ như từ vựng.
- Hết 5 câu: hoan hô + **sticker** (dùng màn quà sẵn có). Chơi lại bao nhiêu lần cũng được.
- Thẻ trong danh sách Số đếm hiện số lần chơi xong như các thẻ khác.

## 6. Ảnh
- Tranh **vẽ bằng SVG trong app**: chạy offline, không cần ảnh. Hình học phải được định nghĩa chính xác để đếm, nên **không thay bằng ảnh AI**: ảnh không biết vùng nào là hình nào.
- Màu các hình: tươi, mỗi hình một màu, **hình cùng loại không cùng màu hết**. Bé phải nhận ra hình bằng **dáng**, không phải bằng màu.

## 7. Trạng thái và ca biên
```
intro → asking → counting (chạm) → complete → [mức 2: chọnSố] → next … → reward
```
- **Mã lượt** (như các game gần đây): ▶, 🏠, câu mới thì hẹn giờ / câu nói / hoạt ảnh cũ không đổi trạng thái.
- **Chạm nhanh nhiều hình:** mỗi hình chỉ đếm **một lần**. Hai ngón chạm cùng lúc thì xử lý lần lượt, không đếm trùng.
- **Chạm trong lúc "đếm đủ"** (đang nhấp nháy tổng kết): bỏ qua.
- **App ra nền rồi quay lại:** giữ câu hiện tại và các hình đã đếm (giữ trong bộ nhớ); Bông hỏi lại câu.
- **Giảm chuyển động:** không lắc / nảy / lấp lánh động; dùng viền đậm đứng yên + huy hiệu số.
- **Không có mic:** không cần mic.
- **Điện thoại dọc:** tranh trên, thẻ hình + bộ đếm một hàng dưới tranh.

## 8. Dữ liệu (`app/js/shapes.js`)
```js
{ id: 'boat', en: 'boat', vi: 'cái thuyền', emoji: '⛵',
  shapes: [ // thứ tự vẽ; mỗi mục là đúng một hình học
    { id: 'sail1', kind: 'triangle', points: [[100, 30], [100, 120], [40, 120]], color: '#74c0fc' },
    { id: 'hull', kind: 'rectangle', rect: [30, 125, 140, 30], color: '#e8590c' },
    { id: 'port1', kind: 'circle', c: [70, 140], r: 9, color: '#fff3bf' }, … ],
  details: '<path …/>',     // nét trang trí, không chạm
  ask: { 1: ['triangle'], 2: ['triangle', 'circle'] } } // hỏi gì ở mức nào
```
- Đáp án = **đếm `shapes` theo `kind`**, không ghi tay riêng.
- Cài đặt `shapeCount = { level, rounds, lock }`.

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **S1** | Thẻ trong Số đếm; mức 1 (tròn / vuông / tam giác, đáp án 1–5); 8 tranh; chạm đếm, huy hiệu số, chạm nhầm nói tên hình, gợi ý, tổng kết, 5 câu + sticker; tiến độ số | Chạm nhanh / chạm lại không đếm trùng; đáp án luôn đúng với hình vẽ |
| **S2** | Mức 2 (chữ nhật / sao / tim, đến 10, bước chọn số), thêm 4 tranh, tự lên mức, khóa mức | Câu hỏi đa dạng, không lặp; chọn số như *Chọn số* |

## 10. Kiểm thử
**Unit**
- Mỗi tranh: mọi `kind` hợp lệ; đáp án hỏi ở mỗi mức = số hình loại đó, trong 1–5 (mức 1) / 1–10 (mức 2).
- Hình chữ nhật có tỉ lệ ≥ 1,6; không có hai hình cùng loại lồng nhau; hình nhỏ nhất ≥ 24/200 hoặc có vùng chạm nới.
- Chọn câu: không lặp tranh, không quá 2 lần cùng đáp án, có đủ loại hình.
- Câu nói số ít / nhiều (*One triangle / Three triangles*).

**UI (chế độ nhanh)**
- Thuyền: *How many triangles?* → chạm 3 tam giác → huy hiệu 1, 2, 3 → *Three triangles! Great counting!*.
- Chạm hình tròn → *That's a circle!*, bộ đếm không đổi.
- Chạm lại tam giác đã đếm → *That's two!*, không tăng.
- Chạm 3 hình liên tiếp thật nhanh → đếm đúng 3, không trùng.
- 10 giây không chạm → một tam giác chưa đếm lấp lánh.
- Mức 2: đếm xong → 3 thẻ số → đúng thì *Yes! Three!*.
- 5 câu → sticker; tiến độ số tăng.
- Ra nền rồi quay lại: các hình đã đếm vẫn còn.
- Giảm chuyển động: không có animation lắc / nảy.

**Thử tay với bé:** bé có nhận ra lá buồm là tam giác không; hình nhỏ (cửa sổ, đèn xe) chạm có dễ không; 5 câu có quá dài không.

## 11. Câu hỏi cần chốt
1. Đặt game ở **Số đếm** (như yêu cầu) hay **cả Góc trò chơi**? (Đề xuất: **chỉ ở Số đếm**, vì mục tiêu chính là đếm.)
2. Mức 1 có cần **bước chọn số** không? (Đề xuất: **không**. Bé 3 tuổi chỉ cần chạm đếm, Bông đọc tổng; mức 2 mới chọn số.)
3. Có thêm **"tìm hình" không đếm** (*"Find a circle!"*, chạm một hình là xong) làm bước khởi động cho bé chưa biết tên hình không? (Đề xuất: **có**, chỉ câu đầu mỗi lượt ở mức 1 khi bé chưa gặp loại hình đó.)

## 12. Ghi chú khi code (0.21.0)
- **Vị trí:** bài có sẵn `mode: 'shapes'` trong Số đếm (tự thêm vào máy cũ một lần, như các bài số khác). Dùng chung trình phát bài số: nút ▶, màn hoan hô + sticker, tiến độ số, thẻ chữ số và cách ghi sao của *Chọn số*.
- **Phụ đề** theo quy ước của bài học (chạm 🔊 / thẻ hình mẫu để xem câu hỏi + tiếng Việt), không phải hàng phụ đề riêng như các trò ở Góc trò chơi.
- **Đáp án ở mức 1 dồn vào số 3** ở bản dữ liệu đầu (test bắt được): thêm câu đáp án 1, 2, 4, 5 (tam giác của nhà / người tuyết, 4 bóng bay, 5 quả anh đào…).
- **Vùng chạm nới nằm dưới các hình:** anh đào sát nhau, vùng nới của quả bên cạnh nằm trên thì bé chạm quả 2 bị tính quả 3. Giờ chạm trúng hình nào là hình đó.
- **Người tuyết:** các hình tròn và mũ chỉ chạm nhau, không đè lên nhau, để hình nào cũng trọn vẹn.
- **App ra nền rồi quay lại:** chơi tiếp **đúng câu đang làm**. Các hình đã đếm trong câu đó được đếm lại từ đầu (câu ngắn, 1–10 hình).
