# SPEC — Mục mới "🧮 Toán" (Math): so sánh to – nhỏ, nhiều – ít bằng tiếng Anh

> Phiên bản spec: **draft3** · Ngày: 2026-11-10 · Dựa trên app 0.65.4
> Trạng thái: **đã làm đợt M-a trong app 0.66.0** (nút 🧮, L1 To – nhỏ, L4 Nhiều – ít, sao, mức, Góc bố mẹ). M-b chưa làm.
>
> **Ghi chú khi code (0.66.0):**
> - Mã bài có tiền tố như các loại bài khác: `math-l1`, `math-l4`. Khóa tiến độ vẫn là `math:l1`, `math:l4` (chữ thường, vì khóa tiến độ được chuẩn hóa).
> - Kiểu hay sai được **thêm 1 câu** so với chia đều (lấy bớt của kiểu khác); *the same* nhiều nhất 2 câu (mục 6.3).
> - Ở mức chỉ có một kiểu câu (L1 mức 1 chỉ hỏi *big*, L4 mức 1 chỉ hỏi *more*), luật "không quá 2 lần liền" không áp dụng.
> - Sao lưu: `readBackup` cũ coi bài không có danh sách từ / câu / số là file hỏng. 0.66.0 nhận thêm bài `kind: "math"`. **App bản cũ (≤ 0.65.x) vẫn báo hỏng** khi khôi phục file sao lưu có bài Toán: cập nhật app trên máy kia trước rồi mới khôi phục (mục 7.5).
> - Dấu bằng của nút *The same* viết bằng chữ "=" (emoji 🟰 không có trên một số máy).
> - "Thêm lại bài mẫu" vẫn thêm lại các bài mẫu **khác** như trước (có thể trùng); chỉ bài Toán là không bao giờ trùng.
>
> Spec chỉ dành cho bé **3–5 tuổi** của app này. Phần toán cho bé 6 tuổi (so sánh số, dấu > < =) làm riêng trong **Olly English** (`C:\kid-english-6\SPEC-math.md`). App này **không có** phần đó.
>
> **Draft3 sửa theo review draft2.** Giữ nguyên cấu trúc, sửa các điểm sau.
>
> Lỗi P0:
> - **L5** đổi bộ từ thành *small – medium – big* (mục 4.5).
> - Câu hỏi **theo mức** thống nhất cho L1, L2, L3, L6 (mục 4.1).
> - L1 nói *this / that* cho hai đồ.
> - L4 có đủ 3 trường hợp *more / fewer / the same*.
> - **Sao và mức** viết rõ (mục 6).
> - **Dữ liệu** có cấu hình bài, câu hỏi sinh ra, thống kê theo kiểu câu (mục 7).
> - **Học tiếp, nút ▶, hết giờ chờ, sai lần 2** viết rõ (mục 3.3–3.5).
>
> Điểm P1 bổ sung:
> - quy tắc hình cho từng bài (mục 4);
> - màn hình chính 10 nút trên iPhone SE (mục 2);
> - vùng chạm không chồng nhau, giảm chuyển động (mục 5);
> - thêm bài mẫu / xóa / thêm lại không trùng, tương thích sao lưu và Ôn tập (mục 7.4–7.5);
> - bảng test MATH-01…32 (mục 10).

**Phạm vi kỹ thuật:** một **mục học mới bên trong web app hiện tại**, làm giống mục Số đếm (SPEC-numbers.md).

Mục mới dùng chung với app:
- danh sách bài, tiến độ, sticker;
- Học tiếp / Học lại, giới hạn thời gian, sao lưu.

Mục mới dùng lại:
- khung học: 🏠, thanh tiến độ, Bông, nút ▶;
- giọng đọc và bong bóng lời thoại hai thứ tiếng;
- Hoan hô và hiệu ứng chọn đúng / sai.

## 1. Mục tiêu

- Bé học **từ vựng so sánh bằng tiếng Anh** bằng cách **nhìn và chạm**. Bé học **từ gốc trước, dạng so sánh *-er* sau** (mục 4.1):

  | Cặp | Từ gốc (mức 1–2) | Dạng so sánh (mức 3) |
  |---|---|---|
  | To – nhỏ | *big / small* | *bigger / smaller* |
  | Cao – thấp | *tall / short* | *taller / shorter* |
  | Dài – ngắn | *long / short* | *longer / shorter* |
  | Nặng – nhẹ | *heavy / light* | *heavier / lighter* |
  | Nhiều – ít | *more / fewer, the same* | — |
  | Xếp ba cỡ | *small / medium / big* | *the smallest / the biggest* |

- **Không cần biết chữ số.** Bé so sánh bằng mắt. Ở bài nhiều – ít, bé chạm để đếm như mục Số đếm (tối đa 10).
- Bông luôn nói **cả câu**, dùng *this / that* để chỉ rõ đồ nào: *"This apple is big. That apple is small."*
- Giữ nguyên nguyên tắc của app:
  - **0 đồng**, chạy offline;
  - **không phạt bé**: không trừ sao, không nói "wrong", không tiếng báo sai;
  - **không cần ảnh AI**: hình vẽ bằng emoji / SVG có sẵn.

### Ngoài phạm vi
- Chữ số, dấu > < =, so sánh số: thuộc Olly English.
- Cộng, trừ, đo bằng đơn vị.
- Bố mẹ tự soạn bài.
- **Nói theo bằng mic**: bé chỉ nghe, nhìn, chạm. Sau này có thể thêm nút nói tự nguyện, không tính sao.
- **Đưa vào 🎲 Trò chơi tổng hợp / ⭐ Ôn tập**: để sau, khi đã có dữ liệu dùng thật.

## 2. Vị trí trong app

- Màn hình chính thêm nút **🧮 Math / Toán**, ngay sau **🔢 Numbers**. Màn hình chính sẽ có **10 nút**:

  | Màn hình | Hiện nay (9 nút) | Sau khi thêm |
  |---|---|---|
  | Màn rộng (iPad ngang, máy tính) | 5 + 4 | **5 × 2** |
  | Màn dọc (iPhone / iPad dọc) | 3 × 3 | **2 × 5** |

- **Không cuộn, và không thu vùng chạm quá nhỏ.** Nút cao **≥ 72 px**.
- Nếu không đủ chỗ thì bớt theo thứ tự:
  1. khoảng cách giữa các nút (tới 8 px);
  2. cỡ emoji (tới 32 px);
  3. chỗ của thỏ Bông chào ở dưới.

  Chữ tiếng Anh không nhỏ hơn 16 px. Chừa vùng an toàn (`safe-area-inset`).
- Phải kiểm tra trên iPhone SE (375 × 667), cả khi mở **trong Safari** (vùng hiện thấp hơn) lẫn khi mở **từ Màn hình chính** (standalone).
- Bấm **Toán** → danh sách bài, giống danh sách bài Số đếm: thẻ bài, ⭐, Học tiếp / Học lại.

## 3. Cách một bài diễn ra

Mỗi bài **khoảng** 4 phút. Đây là mục tiêu khi soạn, **không phải giới hạn cứng**: app không cắt câu đang nói, không bỏ câu vì bài dài. Giới hạn buổi học vẫn do `session.js` quản lý. Hết giờ thì lưu chỗ dừng như các mục khác.

### 3.1 Xem Bông làm mẫu (3 lượt)
- Mỗi lượt **chỉ giới thiệu một ý**. Bông đọc câu tiếng Anh, bong bóng có dòng tiếng Việt.
- Hiệu ứng chạy **đúng lúc** Bông đọc tới từ chính. Ví dụ: quả táo to phóng nhẹ khi đọc *big*, quả nhỏ thu lại khi đọc *small*.
- Chạm vào đồ vật thì Bông nói lại từ của đồ đó (*"Big!"*).
- Bé đang chạm thì không tự chuyển lượt. Hết lượt thì chờ bé bấm ▶.
- L4 (nhiều – ít): Bông **đếm mẫu một đĩa** (đồ to ra + đọc số) để bé biết cách đếm trước khi chơi.

### 3.2 Bé chơi (6 câu)
- Bông hỏi, bé **chạm chọn**. Riêng bài L5 thì bé **kéo**.
- **Đúng:** ding, sao bay lên, Bông nói câu mẫu theo mức (mục 4.1).
- **Sai lần 1:**
  - chỉ đồ bé chọn **lắc nhẹ**: không tiếng báo sai, không đổi màu đỏ cả màn;
  - Bông nói câu **mô tả trung tính, sinh theo đúng đồ bé chọn** (*"That one is small."*, *"This plate has fewer."*);
  - rồi Bông nhắc lại câu hỏi.
- **Sai lần 2:** xem 3.5.
- Trong lúc Bông đang khen / sửa và lúc chuyển câu, **chạm đồ vật không có tác dụng**. Hai lần chạm nhanh liên tiếp chỉ tính lần đầu.
- **Kết thúc 6 câu:** Hoan hô + sticker.

### 3.3 Nút ▶

| Đang ở | ▶ làm gì |
|---|---|
| Xem mẫu | Sang lượt mẫu tiếp theo (hết mẫu → câu 1) |
| Bé đang trả lời (chưa chọn, hoặc đã sai lần 1) | **Bỏ qua câu**: hiện đáp án như 3.5, rồi sang câu sau |
| Đã đúng / đang hiện đáp án | Sang câu sau ngay |
| Câu 6 xong | Sang Hoan hô |

- Câu bị bỏ qua: **không tính là đúng ngay lần đầu**, cũng không tính là sai.
- Bấm ▶ khi Bông đang nói: **dừng câu đang nói** rồi mới làm, không phát chồng hai câu.

### 3.4 Bé không chạm
- Đếm **15 giây từ khi Bông đọc xong câu hỏi** (không phải từ lúc bắt đầu đọc).
- Hết 15 giây: Bông nhắc lại câu hỏi **một lần**.
- Sau khi nhắc **xong**, chờ thêm **10 giây**. Vẫn không chạm thì hiện đáp án như 3.5.
- Câu này: không tính sai, không tính đúng ngay lần đầu, không có tiếng báo sai.

### 3.5 Hiện đáp án (sai lần 2, bỏ qua, hết giờ chờ)
- Đáp án đúng **phát sáng** (viền vàng + sáng nền, không chỉ dựa vào chuyển động).
- Bông nói câu mẫu đúng.
- **Giữ nguyên 1,5 giây sau khi Bông nói xong** rồi mới sang câu sau. Không dùng hẹn giờ cố định, vì câu nói có thể dài hơn.

### 3.6 Học tiếp
- Lượt chơi đang dở lưu vào `lesson.resume` (như các mục khác). Nội dung: 6 câu đã sinh, câu đang ở, kết quả các câu đã xong.
- **Ghi sau mỗi lần đổi trạng thái:**
  - **Câu đã chốt kết quả** (đúng, hiện đáp án): `index` trỏ sang câu sau. Bé thoát rồi vào lại thì ở **câu sau**.
  - **Câu chưa chốt** (đang hỏi, mới sai lần 1): vào lại thì ở **đúng câu đó**, hỏi lại từ đầu, lần sai trước không tính.
- **Thoát giữa phần xem mẫu:** vào lại thì xem tiếp lượt mẫu đang dở.
- **Thoát giữa lượt:** không cộng sao. Sao chỉ cộng khi xong đủ 6 câu.

## 4. Các bài

| # | Bài | Bé làm gì |
|---|---|---|
| L1 | **🍎 Big and small** / To và nhỏ | Hai đồ **cùng loại**, khác cỡ. Chạm cái to / cái nhỏ |
| L2 | **🌳 Tall and short** / Cao và thấp | Hai cái cây / hai tháp khối. Chạm cái cao / thấp |
| L3 | **✏️ Long and short** / Dài và ngắn | Hai bút chì / hai con rắn / hai đoàn tàu. Chạm cái dài / ngắn |
| L4 | **🍓 More or fewer** / Nhiều hay ít | Hai đĩa đồ ăn, bé chạm đếm được. Chạm đĩa nhiều / ít hơn, hoặc nút *The same* |
| L5 | **🪆 Small, medium, big** / Nhỏ, vừa, to | **Kéo** 3 đồ vào 3 ô từ nhỏ đến to |
| L6 | **⚖️ Heavy and light** / Nặng và nhẹ | Bập bênh: bên nặng chúi xuống. Chạm đồ nặng / nhẹ |

### 4.1 Câu hỏi và câu mẫu theo mức (L1, L2, L3, L6)

| Mức | Câu hỏi | Câu Bông nói khi đúng | Chênh lệch cỡ (L1–L3) |
|---|---|---|---|
| 1 | Chỉ một chiều: *Which one is **big** / **tall** / **long** / **heavy**?* | *This apple is big. That apple is small.* | Gấp ≥ 2 lần |
| 2 | Cả hai chiều: thêm *small / short / light* | như mức 1 | ≥ 1,5 lần |
| 3 | Dạng so sánh: *Which one is **bigger** / **smaller** / **taller** / **shorter**…?* | *This apple is bigger.* (L6: *The watermelon is heavier than the grape.*) | ≥ 1,3 lần |

- Câu mẫu luôn nói về **đồ bé vừa chọn đúng trước** (*this*), rồi mới tới đồ còn lại (*that*).
- *short* dùng cho cả cao – thấp và dài – ngắn. Mỗi bài chỉ dùng một nghĩa, không trộn trong cùng một lượt.

### 4.2 L1 — To và nhỏ
- Hai đồ **cùng một emoji**, chỉ khác cỡ. Cùng góc nhìn, không thêm chi tiết.
- Đồ: quả táo, quả bóng, gấu bông, ngôi sao, con vịt, cái xe.
- Câu *"The elephant is bigger than the mouse."* chỉ có ở phần **xem mẫu** cho vui, **không hỏi** trong lượt chơi.

### 4.3 L2 — Cao và thấp · L3 — Dài và ngắn
- Hai đồ **cùng loại, cùng một hình SVG**, chỉ khác chiều cao (L2) hoặc chiều dài (L3). Độ dày giữ nguyên, không xoay nghiêng.
- **L2:** hai đồ đứng **chung đường đáy**.
  - Bản đầu dùng **cây** và **tháp khối**. Hươu cao cổ để sau, vì bé dễ nhìn cổ thay vì chiều cao cả con.
  - Đồ cao không bị Bông hay bong bóng che (đo khung chữ nhật trong test).
- **L3:** hai đồ **thẳng đầu trái**.
  - Trên iPhone dọc đặt trên – dưới, vẫn chung điểm bắt đầu bên trái.

### 4.4 L4 — Nhiều hay ít

| Mức | Số đồ mỗi đĩa | Chênh | Câu hỏi | Cách xếp |
|---|---|---|---|---|
| 1 | 1–5 | ≥ 3 | Chỉ *Which plate has **more**?* | Hàng thẳng |
| 2 | 1–8 | ≥ 2 | *more* và *Which plate has **fewer**?* | Hàng thẳng (tối đa 5 / hàng) |
| 3 | 1–10 | ≥ 1, hoặc **bằng nhau** | *more*, *fewer*. Thêm **nút 🟰 The same** ở giữa hai đĩa | Rải lung tung, không chồng nhau |

- **Mức 1–2 không bao giờ sinh hai đĩa bằng nhau.**
- **Mức 3:**
  - khoảng 1 trong 6 câu hai đĩa bằng nhau; đáp án đúng là nút *The same*;
  - Bông: *"Yes! They are the same!"*;
  - nếu đĩa không bằng nhau mà bé chạm *The same*: *"Let's count! This plate has 4. That plate has 6."*
- Câu mẫu khi đúng: *"This plate has more apples."* / *"This plate has fewer apples."*
- Hai đĩa **cùng cỡ**, **cùng một loại đồ, cùng cỡ đồ**. Không có bẫy "ít mà to" (phần đó cho bé 6 tuổi).
- **Đếm:**
  - chạm một đồ → đồ to ra, hiện số nhỏ, Bông đọc số;
  - chạm lại đồ đã đếm → không đếm thêm, chỉ nhún nhẹ;
  - mỗi đĩa đếm riêng, bắt đầu từ 1;
  - chạm vào **đồ trong đĩa** là để đếm; chạm vào **viền / nền đĩa** là để chọn đĩa;
  - đĩa có **nút chọn rõ ràng** ở dưới (👆 dưới mỗi đĩa) để bé không nhầm hai việc.
- **10 đồ trên iPhone dọc:** hai đĩa đặt **trên – dưới**, mỗi đồ ≥ 44 px, vùng chạm các đồ **không chồng nhau**.

### 4.5 L5 — Nhỏ, vừa, to
- **Bộ từ:** *small – medium – big*, đều là từ gốc, cùng một dạng. Mức 3, khi xếp xong, Bông nói thêm: *"This one is the smallest. This one is the biggest!"*
- 3 đồ **cùng loại**, chênh cỡ rõ (tỉ lệ 1 : 1,5 : 2,2). 3 ô đích luôn **từ nhỏ đến to**, trái → phải.
- **Mức theo bóng mờ trong ô đích:**
  - mức 1: bóng mờ đúng cỡ;
  - mức 2: chỉ còn viền;
  - mức 3: không có gì.
- **Kéo thả:**
  - thả đúng ô → đồ nằm cố định, Bông nói từ của ô (*"Medium!"*);
  - thả sai ô, hoặc thả vào ô đã có đồ → **đồ bay về chỗ cũ**; một ô không bao giờ chứa hai đồ;
  - cách thả sai này tính như "sai" của mục 3.2;
  - ở L5, "một câu" là **xếp xong một bộ 3 đồ**.

### 4.6 L6 — Nặng và nhẹ
- Hai đồ đặt lên **bập bênh**, bập bênh **nghiêng hẳn về bên nặng**, góc nghiêng **luôn như nhau**, không theo cỡ hình.
- Bông giới thiệu trước (*"The rock is heavy. The feather is light."*), bé quan sát bập bênh dừng hẳn thì Bông mới hỏi.
- **Chỉ dùng cặp rõ ràng:** voi – lông vũ, dưa hấu – quả nho, hòn đá – lông vũ, quả bí ngô – quả dâu. Bỏ cặp phụ thuộc loại đồ (xe tải – quả bóng).
- Đổi bên ngẫu nhiên: đồ nặng có lúc bên trái, có lúc bên phải; bập bênh luôn nghiêng đúng bên nặng.

### 4.7 Sinh câu hỏi (chung)
- **Mỗi kiểu bài một bộ sinh riêng:**
  - `size` cho L1–L3;
  - `count` cho L4;
  - `order` cho L5;
  - `weight` cho L6.

  L1 và L4 **không dùng chung** bộ sinh. Thêm L2–L6 không phải sửa bộ sinh đã có.
- Trong một lượt 6 câu:
  - đáp án đúng ở bên trái / phải **gần đều nhau** (không quá 4 / 6 cùng một bên, không quá 3 câu liền cùng một bên);
  - **đổi đồ vật** giữa các câu; một cặp (đồ + cỡ) không lặp quá 2 lần;
  - một kiểu câu không hỏi quá 2 lần liền.
- **Ưu tiên kiểu câu hay sai** (mục 6.3): tối đa 2 / 6 câu.

## 5. Hình vẽ, bố cục, chuyển động

| Thứ | Cách làm |
|---|---|
| To – nhỏ | Emoji cùng một ký tự, khác `font-size` |
| Cao – thấp, dài – ngắn | SVG kéo giãn theo một chiều (cây, tháp khối, bút chì, rắn, tàu), không kéo giãn emoji |
| Nhiều – ít | Đồ vật + cách chạm đếm của Số đếm |
| Xếp cỡ | Kéo – thả như các trò kéo hiện có |
| Bập bênh | SVG xoay quanh điểm giữa (~0,6 giây) |
| Đúng / sai | Hiệu ứng có sẵn (sao bay / lắc nhẹ) |

- **Vùng chạm:**
  - mỗi đồ có vùng chạm **≥ 64 px**, có thể to hơn hình (đồ "nhỏ" ở L1 vẫn có vùng chạm 64 px);
  - vùng chạm của hai đồ **không chồng nhau**;
  - chỉ đồ được chọn mới có hiệu ứng.
- **Bố cục:**
  - hai đồ đặt trái – phải, trừ L3 và L4 trên iPhone dọc (trên – dưới);
  - Bông ở góc, **không đè lên đồ**: kiểm tra iPad ngang / dọc như bài Đầu bếp nhí.
- **Giảm chuyển động** (cài đặt của máy, `prefers-reduced-motion`):
  - bỏ nhún và phóng to;
  - lắc khi sai đổi thành **viền cam** trên đồ được chọn;
  - bập bênh nghiêng ngay, không quay.
- **Mọi lúc:**
  - không có hiệu ứng nhấp nháy liên tục;
  - đúng / sai **không chỉ báo bằng chuyển động**: luôn có câu của Bông + đổi viền / màu.

## 6. Tiến độ, sao và mức

### 6.1 Sao (tích lũy theo bài)
- Mỗi bài có **một bản ghi tiến độ** trong kho `progress`, khóa `word: "math:l1"` … `"math:l6"`. Dùng các trường sẵn có:
  - `mastery` = số sao, 0–5;
  - `practiceCount`, `lastPracticedAt`.

  Thêm `level`, `starDay`, `starsToday`, `types` (mục 6.3).
- Chỉ cộng sao khi **xong đủ 6 câu**:
  - +1 vì xong lượt;
  - +1 nữa nếu **≥ 5 câu đúng ngay lần đầu**. Câu bỏ qua / hết giờ chờ / hiện đáp án không tính là đúng ngay.
- **Mỗi bài tối đa +2 sao một ngày** (`starsToday`, đặt lại khi sang ngày mới). Đã đủ +2 thì chơi tiếp vẫn được, vẫn Hoan hô + sticker, nhưng không cộng sao.
- **Không bao giờ trừ sao.** Tối đa 5⭐ như các mục khác.

Ví dụ:

| Lượt | Kết quả | Sao cộng | Tổng |
|---|---|---|---|
| Ngày 1, lượt 1 | Xong, 4/6 đúng ngay | +1 | 1 |
| Ngày 1, lượt 2 | Xong, 5/6 đúng ngay | +1 (đủ +2 hôm nay) | 2 |
| Ngày 1, lượt 3 | Xong, 6/6 đúng ngay | 0 (hết +2 hôm nay) | 2 |
| Ngày 2, lượt 1 | Thoát ở câu 4 | 0 | 2 |
| Ngày 2, lượt 2 | Xong, 6/6 đúng ngay | +2 | 4 |

### 6.2 Mức
- **Mức không tính trực tiếp từ sao.** Mức là số lưu riêng (`level`, 1–3), **chỉ tăng ở cuối một lượt xong đủ 6 câu**, khi cả hai điều kiện đúng:
  - tổng sao đạt ngưỡng: **≥ 2⭐** để lên mức 2, **≥ 4⭐** để lên mức 3;
  - lượt vừa chơi có **≥ 4 / 6 câu đúng ngay lần đầu** (bé thật sự làm được ở mức hiện tại).
- Mỗi lần chỉ tăng **một** mức. Mức **không tự tụt**.
- Bố mẹ **đặt lại mức** bài được (Góc bố mẹ, mục 8). Lượt đang dở vẫn giữ mức cũ, lượt sau mới dùng mức mới.

### 6.3 Thống kê theo kiểu câu
- Lưu trong bản ghi của bài: `types: { "big": {asked, first, wrong}, "small": {...}, "same": {...} }`.
  - `asked`: số lần hỏi;
  - `first`: số lần đúng ngay;
  - `wrong`: số lần chạm sai.
  - Kiểu câu: `big`, `small`, `bigger`, `smaller`, `more`, `fewer`, `same`, `order`, `heavy`, `light`…
- **Kiểu "hay sai"** tính theo **tỉ lệ** `first / asked` thấp nhất, chỉ xét kiểu đã hỏi **≥ 3 lần**.
- Lượt sau, kiểu hay sai được **thêm 1 câu** so với chia đều (lấy bớt của kiểu khác; *the same* nhiều nhất 2 câu). Các kiểu khác vẫn xuất hiện, và chỉ chọn kiểu có ở mức hiện tại.
- **Không bỏ trường `attempts` cũ** của app, chỉ thêm `types`.

## 7. Dữ liệu

### 7.1 Bài (kho `lessons`, không nâng cấp IndexedDB)
Bài lưu với `kind: "math"`. Nội dung có sẵn trong `js/math.js` → `builtInMathLessons()`. Bài chỉ chứa **cấu hình**, không chứa câu hỏi:

```json
{ "version": 2, "kind": "math", "builtin": "math-l4", "title": "More or fewer", "titleVi": "Nhiều hay ít",
  "emoji": "🍓", "skill": "count", "rounds": 6,
  "config": { "itemIds": ["apple", "strawberry", "duck", "star", "cookie"], "plates": 2 } }
```

```json
{ "version": 2, "kind": "math", "builtin": "math-l1", "title": "Big and small", "titleVi": "To và nhỏ",
  "emoji": "🍎", "skill": "size", "rounds": 6,
  "config": { "dimension": "size", "itemIds": ["apple", "ball", "teddy", "star", "duck", "car"] } }
```

- Phạm vi số, chênh lệch, kiểu câu theo mức (bảng mục 4) nằm **trong code của bộ sinh**, không trong dữ liệu bài. Như vậy sửa luật không cần sửa bài đã lưu trên máy.

### 7.2 Đồ vật (`MATH_ITEMS` trong `js/math.js`)
Mỗi đồ khai báo **dùng được ở bài nào**. Mỗi bài chỉ lấy đồ trong `itemIds` của mình, không tự lấy hết đồ của Số đếm:

```json
{ "id": "apple", "en": "apple", "plural": "apples", "vi": "quả táo", "emoji": "🍎", "uses": ["size", "count", "order"] }
{ "id": "tree", "en": "tree", "plural": "trees", "vi": "cái cây", "svg": "tree", "uses": ["tall"] }
{ "id": "rock", "en": "rock", "vi": "hòn đá", "emoji": "🪨", "uses": ["weight"], "weight": 3 }
```

- `weight`: hạng nặng tương đối (1 nhẹ … 5 nặng) để bộ sinh L6 chỉ ghép cặp chênh ≥ 2 hạng.
- Test kiểm tra mọi `itemIds` của bài đều có trong `MATH_ITEMS` và có đúng `uses`.

### 7.3 Một câu hỏi đã sinh (chỉ nằm trong `lesson.resume` của lượt đang chơi)

```json
{ "type": "more", "level": 1, "item": "apple", "left": { "count": 4 }, "right": { "count": 1 }, "answer": "left" }
{ "type": "bigger", "level": 3, "item": "ball", "left": { "scale": 1 }, "right": { "scale": 1.35 }, "answer": "right" }
```

```json
{ "phase": "play", "demoIndex": 3, "index": 2, "questions": [ … 6 câu … ],
  "results": [ { "first": true }, { "first": false, "revealed": true } ] }
```

- Câu hỏi **không** lưu vào bài. Lượt mới sinh 6 câu mới.
- Câu Bông nói (Anh + Việt) là **mẫu câu theo kiểu câu**, ghép tên đồ từ `MATH_ITEMS` (*"This {item} is big."* / *"{Item} này to."*). Mỗi mẫu có bản tiếng Việt viết sẵn.

### 7.4 Thêm bài mẫu, xóa, thêm lại
Làm giống bài Số đếm (`samples.js`): danh sách `mathLessonsSeeded` gồm **mã `builtin`** đã từng thêm.

| Tình huống | Kết quả |
|---|---|
| Mở app lần đầu sau khi cập nhật | Thêm các bài M-a (L1, L4), ghi mã vào `mathLessonsSeeded` |
| Mở app lần sau | Không thêm trùng |
| Bố mẹ xóa L1 | Lần mở sau **không** tự thêm lại |
| Bản cập nhật M-b có thêm L2, L3, L5, L6 | Chỉ thêm các mã mới, không nhân bản L1 / L4 |
| Bấm "Thêm lại bài mẫu" (một hay nhiều lần) | Chỉ thêm bài Math **đang không có trên máy** (so theo `builtin`), không tạo bản trùng |

- **Tiến độ gắn với mã bài** (`math:l1`), không gắn với id bản ghi. Xóa bài **không** xóa tiến độ, thêm lại thì sao cũ còn nguyên.
- Muốn xóa sao: dùng "Đặt lại tiến độ" của bài ở Góc bố mẹ (mục 8).

### 7.5 Tương thích với phần còn lại của app
- **Ôn tập, Học cùng Bông, prompt AI:** `wordRecords()` trong `progress.js` phải loại thêm tiền tố `math:`. Nếu không, Ôn tập sẽ lấy "math:l1" làm một "từ".
- **Danh sách bài của các mục khác** (Từ vựng, Câu nói, Số đếm…) và **🎲 Trò chơi tổng hợp:** bài `kind: "math"` không xuất hiện.
- **Học tiếp** của mục khác không mở nhầm bài Math.
- **Sao lưu / khôi phục:**
  - `applyBackup` chép bài và tiến độ **nguyên bản ghi**, không lọc theo `kind`;
  - nhưng `readBackup` (kiểm tra file trước khi ghi) của bản ≤ 0.65.x coi bài không có từ / câu / số là **file hỏng** và từ chối cả file. 0.66.0 nhận thêm bài `kind: "math"`;
  - nên khôi phục trên 0.66.0 trở lên giữ được bài Math và `math:*`; máy còn bản cũ phải **cập nhật app trước** khi khôi phục file sao lưu mới.

  Test MATH-05, MATH-06.

## 8. Góc bố mẹ

- **Tiến độ Toán:**
  - mỗi bài: ⭐, mức hiện tại;
  - các kiểu câu bé hay sai (tỉ lệ đúng ngay, ví dụ *"small: 3/7 đúng ngay"*).
- Mỗi bài có:
  - **Đặt mức** (1 / 2 / 3);
  - **Đặt lại tiến độ** (về 0⭐, mức 1, xóa thống kê; hỏi xác nhận).
- Bài Math hiện trong danh sách bài của Góc bố mẹ, có **Xóa**. **Thêm lại bài mẫu** theo mục 7.4.

## 9. Chia đợt làm

| Đợt | Nội dung | Bản |
|---|---|---|
| **M-a** | Nút 🧮 (10 nút ở màn hình chính) + danh sách bài · khung lượt chơi chung (xem mẫu, 6 câu, ▶, chờ, hiện đáp án, Học tiếp) · **L1 To – nhỏ** (bộ sinh `size`) · **L4 Nhiều – ít** (bộ sinh `count`) · sao, mức, thống kê kiểu câu · Góc bố mẹ | 0.66.0 |
| **M-b** | L2 Cao – thấp, L3 Dài – ngắn (dùng `size`, thêm SVG) · L5 Nhỏ – vừa – to (`order`) · L6 Nặng – nhẹ (`weight`) | 0.67.0 |

## 10. Test

**Dữ liệu và tương thích**

| ID | Kiểm tra | Mong đợi |
|---|---|---|
| MATH-01 | Mở app lần đầu sau cập nhật | Có L1, L4, không trùng |
| MATH-02 | Mở app lần hai | Không thêm bài trùng |
| MATH-03 | Xóa L1 rồi mở lại app | L1 không tự xuất hiện lại |
| MATH-04 | "Thêm lại bài mẫu" 2 lần | Chỉ thêm bài Math còn thiếu, không trùng; sao cũ còn |
| MATH-05 | Tiến độ có `math:l1` | Ôn tập / Học cùng Bông / prompt AI không lấy `math:*`; danh sách mục khác không có bài Math |
| MATH-06 | Sao lưu rồi khôi phục (gộp và thay toàn bộ) | Bài Math và `math:*` giữ nguyên |
| MATH-07 | `itemIds` của mọi bài | Có trong `MATH_ITEMS`, đúng `uses` |

**Bộ sinh câu hỏi (unit, chạy 500 lượt ngẫu nhiên mỗi mức)**

| ID | Kiểm tra | Mong đợi |
|---|---|---|
| MATH-08 | L1 đáp án trái / phải | ≤ 4 / 6 cùng một bên, ≤ 3 câu liền cùng bên |
| MATH-09 | L1 một lượt | Một cặp không lặp quá 2 lần; một kiểu câu không quá 2 lần liền |
| MATH-10 | L1 chênh lệch | Đúng ngưỡng theo mức; mức 1 chỉ *big*; mức 3 chỉ dạng *-er* |
| MATH-11 | L4 mức 1–2 | Không bao giờ bằng nhau; đúng phạm vi và chênh |
| MATH-12 | L4 mức 3 | Có câu bằng nhau; có nút *The same* |
| MATH-13 | Ưu tiên kiểu hay sai | Thêm 1 câu so với chia đều; *the same* ≤ 2; chỉ kiểu đã hỏi ≥ 3 lần |
| MATH-14 | L6 (M-b) | Cặp chênh ≥ 2 hạng; bập bênh nghiêng đúng bên nặng khi đổi bên |
| MATH-15 | L2 / L3 (M-b) | Chung đường đáy / thẳng đầu trái (đo khung SVG) |

**Lượt chơi (UI)**

| ID | Kiểm tra | Mong đợi |
|---|---|---|
| MATH-16 | Đúng | Câu mẫu theo mức, nói về đồ đã chọn (*this*) trước |
| MATH-17 | Sai lần 1 | Câu mô tả **đúng đồ bé chọn**; không tiếng báo sai; nhắc lại câu hỏi |
| MATH-18 | Sai lần 2 | Đáp án sáng, Bông nói câu mẫu, giữ ≥ 1,5 giây sau khi nói xong |
| MATH-19 | Không chạm | 15 giây sau khi đọc xong → nhắc **một lần** → 10 giây → hiện đáp án; không tính đúng / sai |
| MATH-20 | ▶ khi đang hỏi | Bỏ qua, hiện đáp án, không tính đúng ngay |
| MATH-21 | ▶ khi Bông đang nói | Câu đang nói dừng, không phát chồng |
| MATH-22 | Chạm nhanh hai đồ liên tiếp | Chỉ tính lần chạm đầu |
| MATH-23 | L4 chạm một đồ nhiều lần | Không đếm trùng; mỗi đĩa đếm riêng từ 1 |
| MATH-24 | L4 10 đồ trên 375 × 667 | Mọi đồ ≥ 44 px, vùng chạm không chồng nhau, chạm được hết |
| MATH-25 | L5 (M-b) thả sai / thả vào ô có đồ | Đồ bay về chỗ cũ; một ô không bao giờ có 2 đồ |
| MATH-26 | Thoát khi câu chưa chốt | Vào lại đúng câu đó |
| MATH-27 | Thoát khi câu vừa chốt | Vào lại câu sau |

**Sao, mức, bố cục**

| ID | Kiểm tra | Mong đợi |
|---|---|---|
| MATH-28 | Sao | +1 xong lượt, +1 nếu ≥ 5 đúng ngay; tối đa +2 / bài / ngày; thoát giữa lượt 0; không trừ |
| MATH-29 | Mức | Lên 2 ở ≥ 2⭐ **và** lượt ≥ 4/6 đúng ngay; lên 3 ở ≥ 4⭐; mỗi lần một mức; không tự tụt; bố mẹ đặt lại được |
| MATH-30 | Màn hình chính | 10 nút, nút ≥ 72 px, không cuộn ở 375 × 667, 820 × 1180, 1180 × 820 |
| MATH-31 | Bông không đè đồ | iPad ngang / dọc, đo khung chữ nhật |
| MATH-32 | Giảm chuyển động | Không nhún / lắc / quay; sai = viền cam; không nhấp nháy |

## 11. Đã chốt

1. **Tên nút:** 🧮 Math / Toán (2026-11-10).
2. **Nhiều – ít:** *more / fewer / the same* (đồ luôn đếm được), không dùng *less*. Bông làm mẫu *fewer* nhiều lần, không bắt bé nói.
3. **Không có nói theo bằng mic** ở M-a / M-b.
4. **Chưa đưa vào Trò chơi tổng hợp / Ôn tập.** Tính lại sau khi có dữ liệu dùng thật.
5. **L5** dùng bộ từ *small – medium – big* (draft3).
