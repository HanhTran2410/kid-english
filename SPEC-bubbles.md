# SPEC — 🫧 Bắt bong bóng (Pop the bubbles)

> App **0.26.0**, draft2 ở **0.26.1** (theo review QA) · Ngày: 2026-10-20 · **Đã làm.** Một trò trong Góc trò chơi.
> Bong bóng bay lên, Bông nói cần bắt quả nào, bé chạm cho vỡ. Phản hồi nhanh, vui tay; ôn màu, số và từ của mọi bài.

## 1. Chọn kiểu bong bóng
- 3 thẻ to: **🎨 Colors / Màu sắc**, **🔢 Numbers / Số**, **🐱 Words / Từ vựng**.
- **Từ vựng** lấy từ các **bài từ vựng** (không lấy bài câu / số / chữ cái / nói chuyện), theo thứ tự:
  1. Gom từ của mọi bài, **bỏ từ không có emoji**.
  2. **Bỏ từ trùng theo từ tiếng Anh** (không phân biệt hoa / thường), không theo emoji: hai từ khác nhau dùng cùng emoji vẫn là hai từ.
  3. Trong số còn lại, bé **đã học ≥ 4 từ** thì chỉ dùng từ đã học (ôn bài), chưa đủ thì dùng hết.
  4. Còn **< 4 từ** thì thẻ Từ vựng mờ, không chọn được.
- Số từ dùng được ít hơn số loại của mức thì ván dùng hết số từ có.
- **"Loại"** = một giá trị cụ thể cần bắt: một màu (*red*), một số (*3*), một từ (*cat*).

## 2. Màn hình
```
 🏠  🫧   🫧 Colors        [🔴 cần bắt]     🐰
              ● ● ● ○ ○ ○ ○ ○                ← đã bắt 3 / 8
 ┌─────────────────────────────────────────┐
 │     (🟡)          (🔴)                   │
 │            (🔵)            (🟢)          │  ← bong bóng bay từ dưới lên, lắc nhẹ
 └─────────────────────────────────────────┘
   phụ đề (hàng riêng)
```
- **Thẻ cần bắt** (góc trên) và **chạm Bông**: nghe lại câu.
- Bong bóng **màu**: tô màu cả quả. **Số**: chữ số to. **Từ**: **ảnh bố mẹ đã thêm cho từ đó ở bài học** (ảnh mới nhất, tròn trong quả; 0.27.0), chưa có / hỏng thì emoji. Thẻ cần bắt cũng vậy.

## 3. Cách chơi
| Lúc | App |
|---|---|
| Vào | *"Let's pop the bubbles!"* → *"Pop the red one!"* / *"Pop number three!"* / *"Pop the cat!"* |
| Chạm **đúng** | "Bụp", quả vỡ, chấm đếm sáng: *"Yes! Red!"* / *"Yes! Number three!"* / *"Yes! The cat!"* → câu cần bắt mới |
| Chạm **nhầm** | Quả **vẫn vỡ** (vui tay), Bông nói tên nó: *"Blue!"*. Nhầm lần 2, 4… thì nhắc lại câu cần bắt. Không trừ gì |
| 10 giây không bắt được | Quả cần bắt **lấp lánh** (viền vàng), Bông nhắc lại |
| Bắt đủ **8 lần** | *"Pop, pop, pop! Great job!"* → Hoan hô + **sticker** → về Góc trò chơi |

- **Một ván** = bắt **đúng** đủ 8 lần.
- **Danh sách 8 lần cần bắt** lập lúc vào ván. Quy tắc theo thứ tự ưu tiên (gặp mâu thuẫn thì quy tắc trước thắng):
  1. đủ 8 lần;
  2. mỗi loại của ván có ít nhất một lần;
  3. không cùng loại hai lần liền (khi còn loại khác);
  4. các loại của ván ưu tiên thứ bé ít gặp (theo số lần "đã gặp" trong tiến độ, bằng nhau thì ngẫu nhiên).
- "Mỗi loại ít nhất một lần" tính theo **lần cần bắt**, không theo số quả được thả.
- **Bong bóng** (kiểm tra mỗi ~0,9 giây; xác suất 30% chỉ quyết định các quả phụ):
  - **đầy** (bằng số tối đa của mức) thì bỏ lượt thả đó; không bao giờ xóa quả cũ để lấy chỗ;
  - trên màn **chưa có quả cần bắt** thì quả mới chắc chắn là quả cần bắt;
  - **luôn chừa một chỗ cho quả cần bắt**: đã có quả cần bắt mà chỉ còn 1 chỗ trống thì không thả quả khác;
    - nhờ vậy, quả cần bắt bay mất (hoặc bị bắt) thì lần thả sau (≤ 0,9 giây) chắc chắn có quả thay thế;
    - quả bay mất **không** tính sai, **không** tăng tiến độ;
  - đã có quả cần bắt thì quả mới là quả cần bắt với xác suất 30%, **tối đa 2 quả cần bắt** cùng lúc (quả nào cũng tính đúng);
  - thả theo 5 làn ngang, không trùng làn của 2 quả vừa thả, luôn nằm trọn trong khung;
  - bay hết màn trong 7–9 giây rồi biến mất.
- **Bắt đúng:** chỉ một lần bắt; mỗi quả chỉ nhận **lần chạm đầu tiên** (vỡ rồi thì chạm tiếp không tính).
  - Thứ cần bắt **đổi ngay**. Quả còn lại của thứ cũ thành quả thường (chạm vào là nhầm).
  - Bộ đếm gợi ý 10 giây tính lại.
- **Chạm nhầm:** không tăng tiến độ, không đổi thứ cần bắt, không ghi "đã gặp". Bông chỉ nói tên (*"Blue!"*), không khen.
  - Nhắc lại câu cần bắt ở lần nhầm 2, 4, 6… **của thứ cần bắt hiện tại** (bắt đúng thì đếm lại).
- **Gợi ý 10 giây:**
  - tính từ lúc Bông nói xong câu cần bắt;
  - gặp lúc Bông đang nói thì đếm lại từ đầu;
  - dừng khi tạm nghỉ (2 phút không chạm) hoặc app ra nền;
  - đổi thứ cần bắt thì tính lại.
- **Bé không phải chờ nghe hết câu:** chạm được ngay.
- **Một hàng nói duy nhất:** câu mới (*"Yes!…"*, tên quả nhầm) thay câu đang đọc, không đọc chồng.
- **Giọng đọc lỗi / tắt tiếng:** vẫn chơi được bằng **thẻ cần bắt** (góc trên: quả màu / chữ số / emoji), phụ đề và chấm đếm.
- **Bắt đủ 8:** khóa mọi chạm, thưởng **một lần**.
- **App ra nền rồi quay lại** (≤ 10 phút, cùng kiểu, cùng mức): chơi tiếp đúng ván, gồm cùng các loại, cùng thứ tự cần bắt và **số đã bắt**.
- **Tiến độ:** bắt đúng thì ghi **"đã gặp"**:
  - màu theo tên màu (*red*, chung với bài Colors);
  - số theo `number:n` (chung với bài số);
  - từ theo từ của bài.
- **Giảm chuyển động:** bong bóng không bay; hiện đứng yên ở 8 ô cố định (không đè nhau), sống 7–9 giây.

## 4. Mức
| Mức | Số loại / lượt | Số | Bay hết màn | Tối đa trên màn |
|---|---|---|---|---|
| 1 (mặc định) | 3 | 1–5 | 9 giây | 5 |
| 2 | 4 | 1–10 | 8 giây | 6 |
| 3 | 6 | 1–10 | 7 giây | 7 |
- **Cài đặt** `bubblesGame = { level, rounds, lock }`:

  | Trường | Ý nghĩa | Mặc định / dữ liệu hỏng |
  |---|---|---|
  | `level` | mức đang chơi, 1–3 | 1 |
  | `rounds` | số **ván hoàn thành** (đủ 8 lần bắt đúng) ở mức hiện tại, **mọi kiểu bong bóng đếm chung** (đổi kiểu không reset) | 0 |
  | `lock` | `null` = tự lên mức; 1 / 2 / 3 = bố mẹ khóa ở mức đó | `null` |
- **Tự lên mức:**
  - đủ **3 ván hoàn thành** → lên **một** mức (tối đa 3), `rounds` về 0;
  - ván bỏ dở không tính.
- **Khóa mức:** giữ đúng mức, **không đếm ván**. Mở khóa thì tiếp tục từ mức đang khóa, đếm lại từ 0.
- **Đổi mức trong lúc chơi:** áp dụng **từ ván sau** (phạm vi số, số loại, tốc độ không đổi giữa ván).

## 5. Kiểm thử (draft2: thêm ca của review QA)
- **Unit:**
  - 7 màu tươi; số 1–5 / 1–10 theo mức; từ có emoji, không trùng;
  - kế hoạch lượt (số loại, 8 lần, mỗi loại ít nhất một lần, không lặp liền, ưu tiên ít gặp);
  - quả mới luôn đảm bảo có quả cần bắt;
  - câu nói; khóa tiến độ; lên mức / khóa mức.
- **UI (chế độ nhanh, giảm chuyển động):**
  - màu: nhầm → nói tên màu, chấm không đổi; đúng → khen, chấm sáng;
  - 8 lần → sticker, đếm lượt, ghi tiến độ màu;
  - số: mức 1 chỉ 1–5, ghi `number:n`;
  - từ: emoji của bài;
  - gợi ý 10 giây;
  - **BG-05:** chạm nhiều lần cùng một quả đúng → chỉ 1 lần bắt;
  - **BG-10:** ra nền rồi quay lại → giữ số đã bắt và thứ cần bắt;
  - **BG-11:** giọng đọc lỗi → vẫn bắt được, chấm đếm sáng;
  - Từ vựng dùng ảnh bài học (0.27.0).
- **Unit thêm:**
  - **BG-02:** đầy thì không thả;
  - **BG-01:** quả cần bắt bay mất → lần thả sau là quả thay thế; luôn chừa một chỗ;
  - **BG-03:** tối đa 2 quả cần bắt;
  - khóa mức không đếm ván.
- **Các ca review đã có trong code nhưng chưa có test tự động:**
  - BG-06: thưởng một lần, khóa chạm sau ván;
  - BG-07: mức mới từ ván sau;
  - BG-08: giảm chuyển động đứng yên ở ô (UI test chạy ở chế độ giảm chuyển động);
  - BG-09: thẻ Từ vựng mờ khi < 4 từ;
  - BG-12: đổi kiểu không reset bộ đếm (một cài đặt chung).
