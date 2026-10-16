# SPEC — 🍌 Cho Bông ăn (Feed Bông)

> Phiên bản spec: **draft2** · Ngày: 2026-10-16 · **Đã làm cả F1–F3 trong app 0.18.0** (ghi chú khi code ở mục 12). Một trò mới trong Góc trò chơi (🎲 Play). **Ảnh trong game thay được** (mục 7).
> - draft1: bản đầu.
> - **draft2, sửa theo review:**
>   - định nghĩa **lượt / vòng / đơn vị ăn**; bụng tăng theo đơn vị;
>   - mức 3 chạm một lần = đưa một cái, có bộ đếm 1/2;
>   - **ngữ pháp theo loại danh từ** (đếm được / không đếm được / luôn số nhiều) cho câu xin và câu nhầm;
>   - **trạng thái game + khóa thao tác** (không nhận chồng, không để hẹn giờ cũ chạy sang vòng mới);
>   - âm thanh tách thành 3 loại; vùng thả và miệng há có vùng đệm;
>   - khay không cuộn;
>   - vòng đời ảnh: chọn ảnh dùng lại, cắt lưới có xem trước, sao lưu / chia sẻ;
>   - checklist QA bổ sung.

## 1. Mục tiêu
- Bé 3 tuổi học **tên đồ ăn, đồ uống** và mẫu câu xin, cho, cảm ơn: *"I'm hungry! I want a banana!"*, *"Yummy! Thank you!"*, *"I'm full!"*.
- Bé làm "người cho Bông ăn": **kéo** (hoặc **chạm**) đúng món vào miệng Bông. Bông phản ứng sinh động: há miệng, nhai, xoa bụng, ợ.
- Không có "sai": đưa nhầm món thì Bông lắc đầu dễ thương, nói tên món đó rồi xin lại. Không trừ gì, không có màn thua.
- Ôn **số đếm** (*"I want two cookies!"*) và từ vựng bé đã học ở bài Từ vựng (dùng lại ảnh có sẵn).

## 2. Màn hình
```
 🏠  🎲  🧹   🍌 Feed Bông                 🗨️ [🍪🍪 1/2]   ← bong bóng ý muốn
 ┌───────────────────────────────────────┐
 │              (Bông to, ngồi)           │
 │        😮 miệng há khi món vào vùng thả │   ← vùng thả: đầu + ngực Bông (mục 3.3)
 │        [bụng: 🟢🟢🟢⚪⚪]                │
 └───────────────────────────────────────┘
  [🍌] [🍎] [🥕] [🍪] [🥛]                    ← khay: tối đa 6 món, KHÔNG cuộn (điện thoại: 2 hàng)
```
- **🗨️ Bong bóng ý muốn:** hình món Bông đang muốn; ở mức 3 có thêm số lượng (🍪🍪) và bộ đếm **1/2**. Chạm vào thì Bông nói lại câu xin, món đó trong khay nhún nhẹ.
- **🧹** chơi lại từ đầu (mục 8.3).
- Phụ đề tiếng Việt cho **mọi câu** Bông nói.

## 3. Cách chơi

### 3.1 Khái niệm (dùng thống nhất trong spec và code)
| Từ | Nghĩa |
|---|---|
| **Đơn vị ăn** | Một món được Bông **nhận đúng**: một quả chuối, **một** chiếc bánh quy trong "two cookies", một ly sữa |
| **Lượt** | Một yêu cầu của Bông (*"I want a banana!"*, *"I want two cookies!"*). Lượt xong khi Bông nhận đủ số đơn vị yêu cầu |
| **Vòng** | Từ bụng rỗng đến **no bụng = 5 đơn vị ăn**. Đủ 5 thì vòng kết thúc, **không tạo lượt mới** cho tới vòng sau |
- Bụng chỉ tăng khi **nhận đúng** (mỗi đơn vị +1 nấc). Đưa nhầm, thả ra ngoài, đưa đồ không ăn được: bụng không đổi.
- Số lượng xin ở mức 3 **không vượt quá số nấc còn lại** của bụng (bụng 4/5 thì chỉ xin 1 cái).

### 3.2 Một lượt
| Lúc | App |
|---|---|
| Vòng mới | Bông xoa bụng, có tiếng bụng kêu "ọc ọc": *"I'm hungry!"* (*Bông đói quá!*), rồi câu xin của lượt đầu |
| Câu xin | Đồ ăn: *"I want a banana!"* (*Bông muốn ăn quả chuối!*). Đồ uống: *"I'm thirsty! I want some milk!"* (*Bông khát quá! Bông muốn uống sữa!*). Đây là **một câu xin liền**, không xen câu đồ ăn vào giữa |
| Bé bắt đầu kéo một món | Món to lên theo ngón tay. **Vào vùng thả thì Bông há miệng**, mắt nhìn theo món |
| Thả **đúng món** | Món bay vào miệng (chomp), Bông nhai (tiếng nhai, ~1 giây), bụng +1, *"Yummy! Thank you!"*. Lượt xong thì sang lượt mới (nếu bụng chưa no) |
| Thả **món khác** | Bông ngậm miệng, lắc đầu, nói câu nhầm (mục 6), món bay về khay. **Lần nhầm thứ 2 trong cùng lượt:** món cần tìm nhún và có viền sáng |
| Đưa **đồ không ăn được** | Bông nhăn mặt: *"Yuck! A sock! I can't eat a sock!"*, món bay về khay. Tính như một lần nhầm |
| Thả ra ngoài vùng thả | Món bay về khay, không nói gì, không tính nhầm |
| **Chạm** một món (không kéo) | Món tự bay vào miệng: **một lần chạm = một đơn vị**. Đúng / nhầm xử lý như kéo-thả |
| Chạm Bông hoặc bong bóng | Bông cười *"Hee hee!"* rồi nói lại câu xin. **Bỏ qua** khi Bông đang nhận món (3.4) |
| Bụng đủ 5 | Khóa nhận món ngay. Bông xoa bụng tròn: *"I'm full! Burp!"* (tiếng ợ vui) + *"Thank you!"*, ngáp, ngủ ~2 giây (zZz), tỉnh dậy: *"I'm hungry again!"*. Sau đó mới bắt đầu **vòng mới**: bụng về rỗng, khay xáo lại, chọn lượt đầu |

### 3.3 Vùng thả và miệng há
- **Vùng thả** là đầu + ngực Bông (khung bao mặt và thân trên, nới rộng thêm ~15% để bé dễ trúng). Thả vào thân dưới hoặc ra ngoài thì món về khay.
- **Miệng há có vùng đệm:** món vào vùng thả thì há miệng; chỉ ngậm lại khi món ra xa hơn vùng thả + 24 px. Ngón tay rung ở mép không làm miệng há / ngậm liên tục.

### 3.4 Khóa thao tác (một món một lần)
- Từ lúc thả đúng / nhầm đến khi xong hoạt ảnh và câu phản hồi (~1,5–2,5 giây), Bông ở trạng thái **đang nhận món**.
- Trong lúc đó, khay mờ nhẹ và **không nhận món mới**: kéo hay chạm đều không có tác dụng, món kéo dở bay về khay. Không xếp hàng chờ, nên một món không bao giờ được tính hai lần.
- Chạm liên tiếp cùng một món: chỉ lần đầu có tác dụng.
- Khi bụng đủ 5: khóa cho tới khi vòng mới bắt đầu (cả lúc Bông ngủ).

### 3.5 Nhắc khi bé chưa làm gì
- **12 giây không chạm / kéo:** Bông nhắc lại câu xin, món cần tìm nhún (gợi ý).
- **Tối đa 2 lần nhắc mỗi lượt.**
- Bộ đếm về 0 khi: bé chạm / kéo, sang lượt mới, quay lại app.
- Bộ đếm dừng khi: app ra nền, Bông đang nhận món, Bông đang ngủ.

### 3.6 Âm thanh (3 loại)
| Loại | Gồm | Luật |
|---|---|---|
| **Câu xin** | câu xin, nhắc lại, *Hee hee!* + câu xin | Câu mới hủy câu xin cũ |
| **Phản hồi** | Yummy / câu nhầm / Yuck / One… two / I'm full | **Được nói hết**: không bị cắt vì thao tác của bé, vì món mới bị khóa trong lúc này (3.4) |
| **Hiệu ứng** | nhai, chomp, ợ, bụng kêu, pop | Phát song song, nhỏ hơn lời nói, không chặn lời nói |
- 🧹, 🏠, 🎲 và app ra nền thì **hủy hết** (lời nói, hiệu ứng, hẹn giờ).

## 4. Mức chơi (tự lên, bố mẹ khóa được trong Cài đặt)
| Mức | Khay | Lượt | Lên mức khi |
|---|---|---|---|
| **1 — Làm quen** | 3 món dễ (banana, apple, carrot, cookie, egg, bread…) | Một món: *I want a banana!* | Xong 2 vòng |
| **2 — Nhiều món** | 5 món, có đồ uống; có thể có **1 đồ không ăn được** | *I want some grapes!*, *I'm thirsty! I want some milk!* | Xong 2 vòng |
| **3 — Đếm** | 4 món **đếm được** (không có đồ uống, không có đồ không ăn được) | *I want two cookies!* | — |

**Mức 3 chi tiết:**
- Vòng đầu ở mức 3: chỉ xin **2**. Từ vòng sau: xin **2 hoặc 3** (đôi khi 1), luôn ≤ số nấc bụng còn lại.
- Ví dụ *"I want two cookies!"*: bong bóng hiện 🍪🍪 **0/2**.
- **Mỗi lần nhận đúng một cái:** Bông nói số (*"One!"*), bộ đếm thành **1/2**, bụng +1, Bông vẫn chờ.
  - Bé không làm gì: nhắc *"One more cookie, please!"* (2 cái), hoặc *"Two more cookies, please!"* (còn 2 trong 3).
- **Cái cuối:** *"Two! Yummy! Thank you!"*, bộ đếm **2/2**, lượt xong.
- **Đưa món khác giữa chừng:** như thả nhầm. Số đã đếm **giữ nguyên**, câu nhầm nhắc lại phần còn thiếu: *"Hmm, that's an apple! I want one more cookie!"*.
- **Chạm** = đưa đúng **một** cái; không bao giờ tự đưa cái thứ hai.

**Bất ngờ vui** (Cài đặt, bật mặc định):
- Chỉ ở **mức 2**, tối đa 1 đồ không ăn được trong khay mỗi vòng.
- Không phải món Bông xin, không tính đơn vị ăn.
- Đồ không ăn được phải là danh từ đếm được số ít (*a sock, a shoe, a teddy, a ball*).

## 5. Nội dung và ngữ pháp
**Đồ ăn có sẵn (18):** banana, apple, orange, grapes, strawberry, watermelon, carrot, corn, bread, egg, cheese, cookie, cake, ice cream, pizza, rice, noodles, fish.
**Đồ uống (3):** milk, juice, water (từ mức 2).
**Đồ không ăn được (4):** sock, shoe, teddy, ball.

Mỗi món khai báo **loại danh từ**; câu ghép từ loại này, **không đoán theo chữ cái**:
| `grammar` | Cần thêm | Cụm xin | Câu nhầm | Đếm (mức 3) | Ví dụ |
|---|---|---|---|---|---|
| `count` (đếm được) | `article: 'a'\|'an'`, `plural` | a banana / an apple | that's an apple | ✅ two apples | banana, apple, orange, strawberry, carrot, egg, cookie, cake, ice cream, pizza, sandwich… |
| `mass` (không đếm được) | — | some milk | that's milk | ❌ | milk, juice, water, rice, bread, cheese, watermelon*, corn*, fish* |
| `plural` (luôn số nhiều) | — | some grapes | those are grapes | ❌ | grapes, noodles |

\* *watermelon, corn, fish* dùng như món ăn trên đĩa (*some watermelon*). Không ép vào mức đếm, để câu tự nhiên.

**Món bố mẹ thêm** cũng phải chọn loại danh từ. Thiếu trường bắt buộc (ví dụ `count` mà không có `plural`) thì không lưu được, và bị bỏ qua khi đọc.

**Tiếng Việt:** mỗi món có `vi`. Món đếm được viết sẵn **cả từ chỉ loại** (*quả chuối*, *chiếc bánh quy*, *cây kem*), nên câu đếm chỉ cần thêm số: *2 chiếc bánh quy*.

## 6. Câu nói
| Lúc | Tiếng Anh | Phụ đề |
|---|---|---|
| Đói (đầu vòng) | I'm hungry! | Bông đói quá! |
| Xin đồ ăn | I want {cụm xin}! | Bông muốn ăn {vi}! |
| Xin đồ uống | I'm thirsty! I want {some milk}! | Bông khát quá! Bông muốn uống {vi}! |
| Xin nhiều | I want {two} {cookies}! | Bông muốn ăn {2} {viUnit} {vi}! |
| Nhận đúng | Yummy! Thank you! | Ngon quá! Cảm ơn con! |
| Đếm (chưa đủ) | One! | Một! |
| Đếm (đủ) | Two! Yummy! Thank you! | Hai! Ngon quá! Cảm ơn con! |
| Nhắc còn thiếu | One more cookie, please! / Two more cookies, please! | Thêm 1 chiếc bánh quy nữa nhé! |
| Đưa nhầm | Hmm, {câu nhầm}! I want {cụm xin / phần còn thiếu}! | Đó là {vi món nhầm}! Bông muốn ăn {vi} cơ! |
| Đồ không ăn được | Yuck! A sock! I can't eat a sock! | Eo ơi! Cái tất! Bông không ăn cái tất được! |
| No | I'm full! Burp! Thank you! | Bông no rồi! Ợ! Cảm ơn con! |
| Tỉnh dậy | I'm hungry again! | Bông lại đói rồi! |
| Chạm Bông | Hee hee! (+ câu xin) | Hi hi! |
- Câu nhầm theo loại danh từ: *Hmm, that's an apple!* · *Hmm, that's milk!* · *Hmm, those are grapes!*
- Đồ uống bị đưa nhầm khi Bông xin đồ ăn (và ngược lại): vẫn dùng câu nhầm như trên.

## 7. Ảnh thay được
Mặc định chạy bằng **emoji + Bông SVG**, không cần ảnh, chạy offline. **Không bao giờ phải có ảnh mới chơi được.** Bố mẹ thay dần ở Góc bố mẹ → **🍌 Ảnh Cho Bông ăn**.

### 7.1 Ảnh món (`images`: `lessonId = 'feed:food'`, `word = mã món`)
- **Khóa theo mã món**, không theo vị trí trong khay hay tên hiển thị. Món bố mẹ thêm có mã riêng (`custom-…`).
- **Từng món:** 📷 đổi ảnh (tự cắt vuông, bỏ nền trắng), 🗑 xóa (về emoji).
- **Dùng lại ảnh có sẵn:**
  - Tìm ảnh bố mẹ đã thêm ở các bài học (Từ vựng, Số, Phonics, Hội thoại) có **đúng từ tiếng Anh sau khi chuẩn hóa** (chữ thường, bỏ khoảng trắng thừa, số nhiều về số ít như *grapes / grape*).
  - Nút chung *"Dùng lại ảnh đã có (n món)"* lấy **ảnh mới nhất** của mỗi từ. Từng món có nút **"Chọn ảnh khác…"** liệt kê mọi ảnh trùng từ (ghi tên bài) để bố mẹ chọn.
  - Dùng lại = **sao chép** ảnh (bỏ nền) vào `feed:food`. Xóa hay thay ảnh ở bài học **không ảnh hưởng** game, và ngược lại.
- **Ảnh lưới:**
  - 📋 Copy prompt cho các món chưa có ảnh. Prompt liệt kê **tên từng ô theo thứ tự**: nền trắng, mỗi ô một món, không chữ.
  - ✂️ Cắt lưới, rồi **xem trước** từng ô kèm tên món sẽ gán. Bố mẹ bỏ chọn ô hỏng, rồi **Lưu**.
  - Ô lỗi / bỏ chọn: món đó giữ ảnh cũ (hoặc emoji). Các ô khác vẫn lưu.
- **Hiển thị:** ảnh món luôn vẽ trong khung vuông, `object-fit: contain`, nền trong suốt. Cùng một ảnh dùng ở khay, khi kéo, khi bay vào miệng và trong bong bóng ý muốn.
- **Thêm món riêng:** tên tiếng Anh, tên Việt, loại (đồ ăn / đồ uống / không ăn được), loại danh từ (+ a/an, số nhiều nếu đếm được), ảnh (không bắt buộc, không có thì 🍽️). Lưu trong cài đặt `feedCustom`. **Xóa món** thì xóa luôn ảnh của nó.

### 7.2 Ảnh Bông (`lessonId = 'feed:bong'`, tùy chọn)
- **5 tư thế:** `hungry` (xoa bụng), `open` (há miệng), `chew` (nhai), `no` (lắc đầu / yuck), `full` (bụng tròn).
- **Prompt ảnh lưới 5 ô** dùng mô tả Bông chuẩn của app (`BONG_FULL_BODY`): cùng nhân vật, cùng cỡ, đứng giữa ô, nền trắng. Cắt lưới có xem trước như 7.1.
- **Khung cố định:** mọi tư thế vẽ trong cùng một khung (`contain`, căn đáy giữa), nên đổi tư thế không làm Bông nhảy vị trí.
- **Thời điểm đổi tư thế:**
  - `open` theo vùng đệm 3.3;
  - `chew` hiện **ít nhất 900 ms** rồi mới về tư thế thường;
  - `no` hiện trong lúc lắc đầu;
  - `full` hiện lúc no và lúc ngủ.
- **Thiếu tư thế nào thì dùng Bông SVG** cho tư thế đó, không để khung trống. Bông SVG có thêm nét mặt **há miệng** và **nhai** (`bong.js`).

### 7.3 Ảnh nền (`lessonId = 'feed:bg'`, tùy chọn)
- Một ảnh bàn ăn / bếp. Có prompt (*chừa trống giữa khung cho Bông, màu nhạt*).
- Ảnh nền chỉ nằm sau Bông. **Khay luôn có nền trắng riêng**, nên món vẫn rõ dù ảnh nền đậm.
- Không có ảnh thì dùng nền màu mặc định.

### 7.4 Quy tắc chung, sao lưu, chia sẻ
- Ảnh `feed:` **không** bị dùng lại làm ảnh từ vựng: thêm `feed:` vào bộ lọc của `latestImageForWord`.
- **Ảnh hỏng hoặc không tải được** (lỗi đọc, lỗi giải mã): dùng emoji / Bông SVG; không có ô ảnh vỡ.
- **Bản sao lưu đầy đủ** có:
  - cài đặt `feed`, `feedSilly`, `feedCustom`;
  - mọi ảnh `feed:food`, `feed:bong`, `feed:bg` (ảnh nằm trong file zip, không chỉ tên).
- **Chia sẻ** (file / Google Drive / link, khối `mediaShareSection` chung, như Mặc đồ):
  - gói **có cả file ảnh** + `feedCustom`;
  - nhập ở trang này hoặc ở Quản lý bài;
  - khi gộp: ảnh mới hơn thắng theo mã món; món thêm gộp theo mã (trùng tên tiếng Anh thì giữ cả hai như "kiểu khác"; không ghi đè món của máy này);
  - ảnh hỏng trong gói thì bỏ qua ảnh đó.

## 8. Trạng thái game
```
start ─► hungry ─► requesting ⇄ dragging
                     │  ▲
           thả/chạm  ▼  │ xong phản hồi, lượt chưa xong / sang lượt mới (bụng < 5)
                  processing (eat | refuse | yuck | count)
                     │
                     ▼ bụng = 5
                    full ─► sleeping ─► hungry (vòng mới)
```
| Trạng thái | Nhận kéo / chạm món? | Chạm Bông? | Nhắc 12 giây? |
|---|---|---|---|
| hungry (câu mở vòng) | ✅ (câu xin đã nói) | ✅ | ✅ |
| requesting / dragging | ✅ | ✅ | ✅ |
| processing | ❌ (món về khay) | ❌ | ❌ |
| full / sleeping | ❌ | ❌ | ❌ |

**8.1 Chống thao tác chồng:**
- Mỗi vòng có **mã vòng**; mọi hẹn giờ / hoạt ảnh / câu nói gắn mã vòng. Khi mã vòng đã đổi (🧹, vòng mới, rời game) thì **không được** đổi bụng, đổi lượt hay nói gì nữa.
- Mỗi lần nhận món chỉ chạy **một** lần xử lý: lượt kéo bị hủy (pointercancel) hoặc thả hai lần thì không tính lại.

**8.2 Chọn lượt:**
- Chọn ngẫu nhiên trong các món ăn được của khay, **không lặp món vừa xin**. Mức 3 chỉ chọn món `count`.
- Khay luôn có món cần tìm. Thứ tự khay **xáo lại mỗi lượt**, để món đúng không cố định một chỗ.
- Khay mới (món khác) chỉ ở **đầu vòng**.

**8.3 🧹 Chơi lại:** hủy lời nói, hiệu ứng, hẹn giờ, lượt kéo dở; tạo mã vòng mới; bụng rỗng; khay mới; lượt mới.

**8.4 Lưu:**
- Chỉ lưu **mức** (`feed = { level, roundsAtLevel, lockLevel? }`).
- Rời game giữa vòng: vòng dở không lưu. Vào lại thì bắt đầu vòng mới.
- Không tính sao học, không ghi tiến độ từ (như các trò khác trong Góc trò chơi).

**8.5 Dữ liệu món** (`app/js/feed.js`):
`{ id, en, vi, kind: 'food'|'drink'|'silly', grammar: 'count'|'mass'|'plural', article?: 'a'|'an', plural?, emoji, draw, easy? }`
- `draw`: mô tả để AI vẽ món.
- `easy`: món được dùng ở mức 1.

## 9. Ca biên
- **Kéo nhiều ngón:** chỉ nhận ngón đầu tiên. Hai món cùng lúc thì chỉ món đầu được kéo.
- **App ra nền:** hủy lời nói, hiệu ứng, lượt kéo dở (món về khay); **dừng** hẹn giờ nhắc.
  - Quay lại giữa lượt: Bông nói lại câu xin hiện tại.
  - Quay lại đúng lúc đang nhận món: món đã vào miệng thì **giữ kết quả** (bụng / bộ đếm đã cập nhật), không phát lại tiếng, rồi nói câu xin tiếp. Món còn đang bay thì không tính.
  - Quay lại đúng lúc đang no / ngủ: vào thẳng vòng mới.
- **Rời game** (🏠 / 🎲): như 🧹 nhưng không bắt đầu vòng mới.
- **Món bố mẹ thêm lỗi** (thiếu tên, thiếu loại danh từ, trùng mã): bỏ qua. Nếu cả khay không đủ món ở một mức thì dùng món có sẵn bù vào.
- **Máy bật "giảm chuyển động":** món đi thẳng vào miệng, không bay vòng; Bông không nảy / lắc. Vùng thả và khóa thao tác giữ nguyên.

## 10. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **F1** | Mức 1–2 (emoji + Bông SVG há miệng / nhai), kéo / chạm, đúng / nhầm, gợi ý, nhắc, bụng, no / ngủ, vòng mới; trạng thái + khóa thao tác | Thao tác nhanh không tính trùng, không kẹt; không cần mic |
| **F2** | Mức 3 (đếm, bộ đếm 1/2), bất ngờ vui, tự lên mức, Cài đặt | Câu theo loại danh từ đúng với mọi món (unit) |
| **F3** | Ảnh: từng món, dùng lại ảnh (chọn được), lưới + xem trước, ảnh Bông, nền, thêm món, chia sẻ / sao lưu | Ảnh hiện ở khay, khi kéo, khi bay vào miệng; chia sẻ sang máy khác đủ ảnh + món thêm |

## 11. Kiểm thử
**Unit**
- Cụm xin / câu nhầm / Yuck đúng cho **mọi** món có sẵn theo loại danh từ (apple, grapes, milk, rice…).
- Đếm: câu nhắc còn thiếu (one more cookie / two more cookies).
- Chọn lượt không lặp; khay luôn có món đúng; mức 3 chỉ món `count`; số xin ≤ số nấc còn lại.
- Đọc `feedCustom` bỏ món hỏng; tự lên mức sau 2 vòng.

**UI (chế độ nhanh) — logic**
- Kéo đúng → *Yummy! Thank you!*, bụng +1.
- **Thả / chạm liên tiếp trong lúc nhận món không làm bụng tăng hai lần.**
- Chạm liên tiếp cùng một món chỉ tính một lần.
- Kéo nhầm → câu nhầm, món về khay; **lần 2 trong cùng lượt** mới có gợi ý, sang lượt mới thì hết gợi ý.
- Thả ra ngoài: không gì xảy ra.
- 5 đơn vị → khóa → *I'm full! Burp!* → vòng mới, bụng rỗng.
- Mức 3: nhận từng cái, bộ đếm 1/2, chưa đủ thì không cảm ơn; nhầm giữa chừng giữ số đã đếm.
- 🧹 / rời game giữa lúc nhận món: hẹn giờ cũ không đổi bụng của vòng mới.
- Bất ngờ vui → *Yuck!*, bụng không đổi.

**UI — ảnh**
- Không có ảnh vẫn chơi đủ.
- Ảnh món thay mới hiện ở khay và bong bóng.
- Dùng lại ảnh "banana" của bài Từ vựng (sao chép: xóa ảnh bài học thì game vẫn còn ảnh).
- Ảnh `feed:` không lẫn vào ảnh từ vựng.
- Chia sẻ rồi nhập lại có đủ ảnh + món thêm.
- Ảnh hỏng hiện emoji.

**Thử tay trên iPad**
- Kéo bằng ngón tay mượt; vùng thả đủ rộng; miệng không há / ngậm liên tục ở mép.
- Tiếng nhai / ợ không đè lời nói.
- Ra nền rồi vào lại không có tiếng trùng.

## 12. Ghi chú khi code (0.18.0)
- **Khay là "nguồn" món:** món trong khay không mất đi khi đưa. Mỗi lần đưa là một bản sao bay vào miệng, nên mức 3 đưa được nhiều chiếc bánh quy.
- **Ảnh lưới chỉ dành cho món có sẵn** (2 lưới 3 × 3 + 1 lưới cho phần còn lại; ô gán theo mã món, chọn lại / bỏ qua từng ô trước khi lưu). Món bố mẹ thêm đổi ảnh từng món.
- **Ảnh Bông:** ảnh lưới 5 tư thế + đổi từng tư thế. Tư thế ngủ dùng ảnh `full`.
- **Dùng lại ảnh:** tìm cả dạng số ít / số nhiều (*grapes* / *grape*); nút "Ảnh bài học (n)…" ở từng món hiện mọi ảnh trùng từ kèm tên bài để chọn.
- **Quay lại sau khi app ra nền:** app dựng lại màn chơi, nên vòng đang chơi được giữ trong bộ nhớ (tối đa 10 phút, cùng mức) để chơi tiếp đúng lượt.
- **Lỗi tìm ra khi viết test:** Bông được vẽ trước khi ảnh nạp xong nên ảnh tư thế không hiện; đã sửa (vẽ lại sau khi nạp ảnh).
