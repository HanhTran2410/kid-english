# SPEC — 🖍️ Tô màu (Coloring)

> Phiên bản spec: **draft2** · Ngày: 2026-10-16 · Làm trong app 0.17.0
> - Một trò mới trong Góc trò chơi (🎲 Play), cạnh Dán tranh / Mặc đồ / Chọn từ.
> - **draft2 — sửa theo review draft1:**
>   - trắng = tẩy (phần về "chưa tô"); điều kiện xong hình;
>   - việc chỉ xong khi đúng phần + đúng màu;
>   - luật chọn việc: chỉ giao phần còn màu hợp lý khác màu đang có, hết thì tô tự do;
>   - chạm Bông = bỏ việc đang giao;
>   - mỗi lần chạm chỉ một chuỗi tiếng;
>   - luật vùng chạm SVG (mục 9), schema (mục 6), checklist QA (mục 8).
>
>   Đã làm cả trong 0.17.0.

## 1. Mục tiêu
- Bé 3 tuổi học **tên màu** (red, pink, yellow…) và **tên bộ phận** (wings, legs, tail, roof…) bằng tiếng Anh qua việc tô màu.
- Bông **giao việc bằng câu tiếng Anh đầy đủ**: *"Color the wings pink!"* (phụ đề: *Tô màu hồng cho cái cánh!*), *"Color the legs black!"*.
- Bé **chọn màu rồi chạm vào phần hình** là tô ngay (tô kín cả phần, không cần tô trong nét). Không có "sai": tô gì cũng được, Bông chỉ nhắc nhẹ.
- Ôn **số** (đếm sao) và **chữ cái** (chữ hoa / chữ thường) bằng cùng một cách chơi.

## 2. Vị trí và màn hình
1. **Góc trò chơi** thêm thẻ **🖍️ Coloring · Tô màu**.
2. **Chọn hình**:
   - Hàng 4 nhóm ở trên: 🐾 *Animals · Con vật*, 🧸 *Things · Đồ vật*, 🔢 *Numbers · Số*, 🔤 *Letters · Chữ cái*.
   - Bên dưới là lưới thẻ hình: hình thu nhỏ **đúng màu bé đã tô**, tên tiếng Anh + tiếng Việt, ✨ khi đã tô xong hết.
   - Nhớ nhóm đang xem.
3. **Màn tô**:
```
 🏠  🖍️  🧹   🖍️ Butterfly            🖌️  🐰
 ┌──────────────────────────────────┐
 │        hình nét đen, nền trắng    │  ← chạm phần nào tô phần đó
 └──────────────────────────────────┘
  🔴 🟠 🟡 🟢 🔵 🟣 🩷 🟤 ⚫ ⚪        ← hộp màu (bút sáp tròn to)
```
- **🖍️** về màn chọn hình.
- **🧹** tô lại từ đầu (hỏi ✔ / ✖ như Mặc đồ).
- **🖌️** nghe lại việc Bông đang giao (phần hình đó nhấp nháy).
- **Chạm Bông**: bỏ việc đang giao, nhận việc mới.
- Phụ đề tiếng Việt cho **mọi câu** Bông nói.

## 3. Cách chơi
| Bé làm | App |
|---|---|
| Vào hình | *"Let's color the butterfly!"* → Bông giao việc đầu: *"Color the wings pink!"* |
| Chạm một màu | Màu được chọn (nổi lên, viền đậm) + Bông đọc tên màu: *"Pink!"* (*Màu hồng!*) |
| Chạm một phần hình | Phần đó đổi màu (chuyển màu mượt + nảy nhẹ, tiếng pop) + *"The wings are pink!"* (*Cái cánh màu hồng!*) |
| Tô **đúng việc** (đúng phần, đúng màu) | 🎉 Tiếng hoan hô, Bông vỗ tay, **một câu** *"Yay! The wings are pink!"* (không đọc thêm câu tô thường). Sau đó giao việc tiếp: *"Now color the body black!"* (phần đó nhấp nháy). |
| Tô đúng phần nhưng **khác màu** | Vẫn tô và lưu (không phạt), **việc chưa xong**. Bông nói *"The wings are blue! Now try pink!"*. **Lúc này** màu cần tìm mới nhấp nháy trong hộp màu (gợi ý sau lần thử đầu). Việc giữ đến khi bé tô đúng hoặc chạm Bông. |
| Tô phần khác | Vẫn tô, đọc câu tô; việc đang giao giữ nguyên |
| Chạm Bông | **Bỏ** việc đang giao (không tính là xong), giao **đúng một** việc mới, hủy câu đang đọc |
| Mọi phần đều đã có màu (lần đầu) | ✨ *"Wow! A beautiful butterfly!"* (*Con bướm đẹp quá!*) + tiếng ta-da; hết việc thì *"Color anything you like!"* |

**Một chuỗi tiếng mỗi lần chạm:** mỗi lần chạm (màu, phần hình, Bông, 🧹) hủy câu đang đọc hoặc đang chờ đọc, rồi bắt đầu chuỗi mới. Đổi màu liên tục chỉ nghe tên màu cuối.

**Luật chọn việc:**
- Phần **đủ điều kiện** khi:
  - chưa được giao trong vòng này, **và**
  - còn ít nhất một màu hợp lý **khác màu đang có** (lá đã xanh lá thì không bảo tô lá xanh lá nữa; chân bọ rùa đã đen thì thôi).

  Ưu tiên phần chưa tô.
- Màu: ngẫu nhiên trong các màu hợp lý của phần, khác màu đang có. **Không bao giờ giao màu trắng.**
- Phần đã giao (xong hoặc bị bỏ) không quay lại trong vòng này. Hết phần đủ điều kiện thì chuyển sang **tô tự do**: ẩn 🖌️, Bông nói *"Color anything you like!"*.
- Chạm Bông khi đã hết việc: bắt đầu **vòng mới** (giao lại từ đầu, tránh phần vừa giao). Vẫn không còn phần đủ điều kiện thì Bông nói *"Color anything you like!"*.

**Màu trắng là tẩy:**
- Tô trắng đưa phần về **chưa tô** (xóa khỏi dữ liệu, không lưu "white"). Vì vậy mỗi phần chỉ có 2 trạng thái: *chưa tô* hoặc *đã tô màu X*.
- **Xong hình** khi mọi phần đều đã tô (khác trắng). Tẩy một phần thì thẻ mất ✨.
- Tiếng hoan hô "xong hình" chỉ có một lần mỗi lượt mở hình (hoặc lại sau khi bấm 🧹).

**Tô cả phần một lần:** cả hai cánh, cả bốn chân, cả nhóm sao đổi màu cùng lúc. Bé 3 tuổi chạm một lần là thấy kết quả.

## 4. Nội dung
**Màu (10):** red · orange · yellow · green · blue · purple · pink · brown · black · white (đỏ, cam, vàng, xanh lá, xanh dương, tím, hồng, nâu, đen, trắng).

**Con vật (5)** và **đồ vật (6)** vẽ bằng SVG trong app (nét đen dày, hình to, phần to dễ chạm):
| Hình | Các phần (en · vi) — số nhiều in nghiêng |
|---|---|
| 🦋 butterfly · con bướm | *wings* · cái cánh, body · cái thân, head · cái đầu, *antennae* · cái râu |
| 🐦 bird · con chim | body, head, wing · cái cánh, tail · cái đuôi, beak · cái mỏ, *legs* · cái chân |
| 🐟 fish · con cá | body, tail, *fins* · cái vây |
| 🐱 cat · con mèo | head, *ears* · cái tai, body, tail |
| 🐞 ladybug · con bọ rùa | shell · cái lưng, *spots* · chấm tròn, head, *legs* |
| 🌸 flower · bông hoa | *petals* · cánh hoa, middle · nhụy hoa, stem · cuống hoa, *leaves* · cái lá |
| 🌳 tree · cái cây | *leaves* · tán lá, trunk · thân cây, *apples* · quả táo |
| ☀️ sun · ông mặt trời | sun · mặt trời, *rays* · tia nắng |
| 🏠 house · ngôi nhà | *walls* · bức tường, roof · mái nhà, door · cửa ra vào, *windows* · cửa sổ, chimney · ống khói |
| 🚗 car · ô tô | car · thân xe, *windows* · cửa sổ, *wheels* · bánh xe, light · cái đèn |
| 🍦 ice cream · cây kem | ice cream · viên kem, cone · ốc quế, cherry · quả anh đào |

**Số 1–10:**
- Chữ số to + đúng số ngôi sao bên dưới.
- Phần: *number three* · *số 3*, và *three stars* · *3 ngôi sao*. Số 1 dùng *star* · *ngôi sao* (số ít).
- Cả nhóm sao là **một phần**: chạm một sao là tô cả nhóm. Bông đếm: *"One, two, three! The three stars are yellow!"*.

**Chữ cái A–Z:**
- Chữ hoa to + chữ thường, là **hai phần tô riêng**.
- Phần: *big A* · *chữ A hoa*, và *small a* · *chữ a thường*.
- Giọng đọc đọc **tên chữ cái** (*"big A"*). Trò này **không dạy âm phonics**.

## 5. Câu nói (ghép từ dữ liệu; is / are theo trường `plural` của phần)
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Vào hình | Let's color the {picture}! | Mình tô {vi} nhé! |
| Giao việc | Color the {part} {color}! | Tô màu {màu} cho {phần}! |
| Việc tiếp | Now color the {part} {color}! | Giờ tô màu {màu} cho {phần}! |
| Chọn màu | {Color}! | Màu {màu}! |
| Tô | The {part} is / are {color}! | {Phần} màu {màu}! |
| Đúng việc | Yay! The {part} is / are {color}! | Giỏi quá! {Phần} màu {màu}! |
| Đúng phần, khác màu | (câu tô) + Now try {color}! | Giờ thử màu {màu} nhé! |
| Xong hình | Wow! A beautiful {picture}! | {Vi} đẹp quá! |
| Hết việc | Color anything you like! | Con thích tô gì thì tô nhé! |
| Tô lại | Let's start again! | Mình tô lại từ đầu nhé! |

## 6. Dữ liệu
- Hình, phần và màu nằm trong code (`app/js/coloring.js`), **không cần ảnh, chạy offline**. Schema:
```js
{ id: 'butterfly', group: 'animals', emoji: '🦋', en: 'butterfly', vi: 'con bướm',
  parts: [ // thứ tự = thứ tự vẽ (phần sau nằm trên)
    { id: 'wings', en: 'wings', vi: 'cái cánh',
      plural: true,                                      // is / are lấy từ đây, không đoán theo chữ "s"
      colors: ['pink', 'purple', 'blue', 'orange', 'yellow'], // màu hợp lý để Bông giao (không có white)
      shapes: '<ellipse …/>…',                           // vùng tô (SVG, không màu)
      line: false,  // true: phần là nét (râu, chân, tia nắng)
      glyph: false, // true: chữ / số
      count: undefined }, // số sao để Bông đếm
  ],
  details: '<path …/>' } // nét trang trí (mắt, miệng), không chạm được
```
- Mã hình, mã phần, mã màu **ổn định**; không dùng tên hiển thị làm khóa. **Mọi phần đều tính** vào điều kiện xong hình.
- Màu: `{ id, en, vi, hex }`, 10 màu ở mục 4.
- Câu tiếng Việt ghép từ **mẫu cố định** ở mục 5. Tên phần tiếng Việt viết sẵn trong dữ liệu (*cái cánh*, *3 ngôi sao*).
- Màu bé đã tô lưu trong cài đặt `coloring` = `{ [mã hình]: { [mã phần]: mã màu } }` (có trong sao lưu):
  - ghi **ngay sau mỗi lần tô hoặc tẩy**;
  - màn chọn hình vẽ thẻ từ dữ liệu này mỗi lần mở (không cần tải lại app);
  - mã hình, mã phần, mã màu lạ hoặc "white" (bản cũ, dữ liệu hỏng) bị bỏ khi đọc: phần đó hiện như chưa tô, thẻ vẫn hiện, không lỗi.
- Nhớ nhóm đang xem (`coloringGroup`) và màu đang chọn (`coloringColor`).
- Không tính sao hay tiến độ học (giống các trò khác trong Góc trò chơi).

## 7. Ngoài phạm vi (để sau)
- Bố mẹ thêm hình tô màu riêng (ảnh nét vẽ AI): cần tách vùng tự động, khó làm trên điện thoại.
- Bút vẽ tự do, tô từng chấm nhỏ; lưu ảnh tranh vào album.
- Học màu trắng như một màu thật (cần phân biệt "tô trắng" với "chưa tô").

## 8. Kiểm thử (checklist theo review; ✅ = có test tự động)
**Logic việc**
- ✅ Đúng phần + đúng màu: xong đúng một việc, một câu "Yay! …", có việc mới (UI)
- ✅ Đúng phần, khác màu: lưu màu, việc chưa xong, "Now try …", màu cần tìm nhấp nháy (UI)
- ✅ Tô phần khác: việc không đổi (UI)
- ✅ Chạm Bông: đúng một việc mới mỗi lần chạm, việc cũ không tính (UI)
- ✅ Hết phần đủ điều kiện thì tô tự do, không kẹt (UI + unit); không giao lại màu đang có, không giao màu trắng (unit)

**SVG và vùng chạm**
- ✅ Chạm cửa sổ chỉ tô cửa sổ, chạm thân xe tô thân xe (UI, chuột thật)
- ✅ Chạm nét trang trí tô phần bên dưới; chạm nền không tô gì (UI)
- ✅ Phần nhiều đối tượng (hai bánh, bốn cánh, nhóm sao) đổi màu cùng lúc (UI)

**Màu, lưu dữ liệu**
- ✅ Màu đang chọn: nổi lên + viền đậm, không chỉ dựa vào màu (UI kiểm tra aria-checked)
- ✅ Trắng là tẩy: phần về chưa tô, không lưu "white" (UI + unit)
- ✅ Thẻ hình cập nhật ngay, có ✨ khi xong (UI)
- ✅ Mở lại app vẫn đúng màu (UI)
- ✅ Dữ liệu hỏng hoặc mã lạ không gây lỗi (UI + unit)

**Số, chữ, âm thanh**
- ✅ Số 1–10 đúng số sao (unit); chạm một sao tô cả nhóm, Bông đếm (UI)
- ✅ Chữ hoa và chữ thường tô riêng (UI)
- ✅ is / are và phụ đề đúng số ít / nhiều (unit)
- Tô nhanh, đổi màu liên tục không đọc chồng: mỗi lần chạm hủy chuỗi cũ (theo thiết kế); cần thử tay trên iPad

**Màn hình**
- ✅ 🖍️ về, 🧹 tô lại, 🖌️ nghe lại, chạm Bông (UI); ✅ nhớ nhóm đang xem (UI)
- Hộp màu ≥ 50 px trên điện thoại, 64 px trên iPad; hình vừa khung trên điện thoại (đã chụp màn hình kiểm tra)

## 9. Vùng chạm (hit-test)
- Mỗi phần là một nhóm SVG `<g data-part="…">` riêng. Chạm vào bất kỳ hình nào trong nhóm (kể cả viền của nó) là tô **cả nhóm**.
- **Chồng nhau:** phần vẽ sau nằm trên và nhận chạm (cửa sổ trên thân xe, đầu trên thân bướm, chấm trên lưng bọ rùa). Thứ tự vẽ trong dữ liệu chính là thứ tự ưu tiên.
- **Nét trang trí** (mắt, miệng, ria mèo, nét cửa) có `pointer-events="none"`: chạm vào đó là chạm phần bên dưới.
- **Nền, chỗ trống** ngoài hình: không tô gì.
- **Phần nét** (râu bướm, chân chim và bọ rùa, tia nắng): vùng chạm là nét dày 13 (viền đen) để dễ trúng; màu tô là nét bên trong.
- **Chữ, số:** viền vẽ trước, phần tô vẽ đè lên để che các nét chồng bên trong phông chữ. Chạm vào thân chữ là tô.
- Phần nhỏ nhất (đèn xe, quả anh đào) ≥ 18/200 khung hình (khoảng 50 px trên iPad).
