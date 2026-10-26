# SPEC — 🎨 Hình đẹp hơn: Rửa tay (Bác sĩ nhí) và Mặc đồ (Lính cứu hỏa)

> Phiên bản spec: **draft1** · Ngày: 2026-10-26 · **Chưa làm**. Bổ sung cho `SPEC-doctor2.md` mục 3 (rửa tay) và `SPEC-fire2.md` mục 3 (mặc đồ). **Cách chơi, câu nói, luật không đổi** — chỉ đổi hình và hiệu ứng.
> Lý do: bố mẹ thấy hình vẽ hiện tại xấu — bàn tay rửa tay không giống thật; Bông mặc đồ lính cứu hỏa lệch, không cân đối.
> Bố mẹ chọn: **ảnh bố mẹ thêm (nhờ AI vẽ theo prompt của app) + hiệu ứng ghép ảnh**; nhân vật mặc đồ là **chú lính cứu hỏa** (không phải Bông).

## 1. Nguyên tắc
- **Chạy được ngay không cần ảnh:** chưa có ảnh thì dùng **hình vẽ sẵn vẽ lại đẹp hơn** (mục 4). Có ảnh bố mẹ thêm thì dùng ảnh.
- **Ảnh lưới (một lần vẽ ra nhiều ô):** mỗi cảnh **một ảnh lưới 3 × 2 = 6 ô**, cùng một nhân vật / đôi tay, cùng góc nhìn — AI vẽ trong một lần nên các ô **khớp nhau** hơn vẽ riêng từng ảnh. App tự cắt 6 ô và bỏ nền trắng (như ảnh lưới của Ảnh Bác sĩ nhí).
- **Hiệu ứng là của app** (bọt bay, nước chảy, lấp lánh, ảnh chuyển mờ dần…), dùng chung cho cả ảnh và hình vẽ sẵn.
- **Chỗ bé chạm và luật không đổi:** khay đồ, nhận / nhầm, nhắc, lưu chơi tiếp như hiện nay.
- Ảnh có chia sẻ / sao lưu như các ảnh Đóng vai khác. Không dùng ảnh người thật (chỉ ảnh hoạt hình do AI vẽ).

## 2. 🧼 Rửa tay (Bác sĩ nhí)

### 2.1 Ảnh lưới 6 ô (Góc bố mẹ → Ảnh Bác sĩ nhí → mục "🧼 Rửa tay")
| Ô | Mã | Hình |
|---|---|---|
| 1 | `dirty` | hai bàn tay trẻ con giơ trên bồn rửa, lấm tấm vài chấm bẩn |
| 2 | `soapy` | cùng đôi tay đầy bọt xà phòng |
| 3 | `rinse` | cùng đôi tay dưới vòi nước đang chảy, bọt trôi đi |
| 4 | `clean` | đôi tay sạch, khô, lấp lánh |
| 5 | `gloves` | đôi tay đeo găng y tế xanh |
| 6 | `ready` | đôi tay đeo găng giơ ngón cái 👍 |
- **Prompt có sẵn** (Copy prompt): *"A 3×2 grid of six square pictures on a plain white background. All six show the SAME pair of small child hands from the front, same size and position, above the SAME white sink with a tap: 1) hands with a few small mud spots; 2) hands covered in white soap foam; 3) hands under running water from the tap, foam washing away; 4) clean dry hands with small sparkles; 5) hands wearing light-blue medical gloves; 6) gloved hands giving a thumbs-up. Soft cartoon style for a toddler game, thick soft outlines, pastel colours, no text, no faces."*
- Nút: **Copy prompt** · **Chọn ảnh lưới** (cắt 6 ô, xem trước 6 ô) · **Dùng hình vẽ sẵn**.

### 2.2 Hình theo bước + hiệu ứng
| Lúc | Hình (chuyển mờ dần ~0,4 giây) | Hiệu ứng thêm |
|---|---|---|
| Bắt đầu | `dirty` | — |
| Dùng 🧼 | `soapy` | **bọt bay lên** (5–8 bong bóng nhỏ trôi lên rồi vỡ), tay rung nhẹ "xoa xoa" |
| Dùng 💧 | `rinse` | **dòng nước chảy động** từ vòi + giọt nước bắn, tiếng nước |
| Dùng khăn | `clean` | **lấp lánh** ✨ quanh tay (3–5 tia) |
| Dùng 🧤 (mức 2–3) | `gloves` | găng "bật" vào (phóng nhẹ), viền sáng xanh |
| Xong | `ready` (mức 1: `clean` + 👍 vẽ) | **pháo giấy nhỏ** + *"Clean hands!"* |
- Mức 1 dùng thứ tự tùy bé: hình theo **trạng thái đã có** (đã có bọt chưa rửa → `soapy`; đã rửa → `rinse`; đã lau → `clean`); dùng khăn trước khi rửa → vẫn `clean` (trò chơi không bắt lỗi ở mức 1).
- Ra nền quay lại: hiện hình của trạng thái hiện tại, không chạy lại hiệu ứng.

## 3. 🧑‍🚒 Mặc đồ (Lính cứu hỏa) — chú lính cứu hỏa thay Bông

### 3.1 Ảnh lưới 6 ô (Góc bố mẹ → Ảnh Đóng vai → mục "🧑‍🚒 Chú lính cứu hỏa")
| Ô | Mã | Hình |
|---|---|---|
| 1 | `plain` | chú lính cứu hỏa (người, hoạt hình thân thiện) đứng thẳng, nhìn thẳng, mặc áo phông + quần jean, đi giày thể thao, chưa đội mũ |
| 2 | `full` | **cùng chú** mặc đủ đồ: mũ đỏ, áo khoác vàng sọc phản quang, ủng đen |
| 3 | `helmet` | chỉ cái mũ đỏ |
| 4 | `jacket` | chỉ cái áo khoác vàng |
| 5 | `boots` | chỉ đôi ủng đen |
| 6 | `spray` | **cùng chú** mặc đủ đồ, cầm vòi phun nước hướng sang phải |
- **Prompt có sẵn:** *"A 3×2 grid of six square pictures on a plain white background, soft cartoon style for a toddler game, thick soft outlines, pastel colours, no text. The SAME friendly firefighter man appears in pictures 1, 2 and 6, full body, standing straight, facing the viewer, same size and position: 1) wearing a plain t-shirt, jeans and sneakers, no helmet; 2) wearing full gear: red firefighter helmet, yellow fire jacket with silver reflective stripes, black boots; 3) only the red firefighter helmet; 4) only the yellow fire jacket; 5) only a pair of black boots; 6) in full gear holding a fire hose nozzle in both hands, pointing to the right."*
- Nút như 2.1. Ảnh nền Cứu hỏa (đã có) giữ nguyên.

### 3.2 Ghép ảnh khi mặc đồ
- Màn mặc đồ: chú `plain` đứng giữa; khay là ảnh `helmet` / `jacket` / `boots` (thay hình vẽ món đồ hiện nay; món lạ mức 3 vẫn emoji).
- Mặc một món: món bay tới **đúng chỗ trên người** (mũ → đầu, áo → thân, ủng → chân) và **dán đè lên** ảnh `plain` (ghép kiểu sticker, có viền trắng mỏng do cắt nền), kèm **lấp lánh** nhỏ.
  - Chỗ đặt theo **khung cố định theo tỉ lệ** của ô `plain` (đầu: phần trên ~0–22%, thân ~22–62%, chân ~85–100%), món co theo bề ngang khung.
- Mặc đủ 3 món: **xoay nhẹ + lấp lánh**, ảnh ghép **chuyển mờ dần sang ảnh `full`** (cùng chú, đồ khớp sẵn) → *"I'm ready! Let's go!"*.
- Ở các ca (dập lửa, cứu cây / trong nhà): người cầm vòi là ảnh **`spray`** (thay 🧑‍🚒 / Bông mặc đồ); **tia nước bắn từ đầu vòi** (điểm phải-giữa của ảnh, chỉnh theo khung ô), giật nhẹ khi phun như hiện nay; chạm vẫn phun.
- Ra nền quay lại giữa lúc mặc: hiện `plain` + các món đã dán; đã mặc xong thì `full` / `spray`.

### 3.3 Hình vẽ sẵn (chưa có ảnh)
- **Vẽ lại SVG "chú lính cứu hỏa" người** (không phải Bông), **cân đối hai bên**: đầu tròn, mũ đội giữa đầu (vành ngang), áo khoác đối xứng hai tay buông, quần + **hai ủng tách rời**, tỉ lệ đứng thẳng như ô `plain` / `full`. Các lớp mặc đồ bật như hiện nay nhưng **vừa khít** từng phần.
- Bản cầm vòi (`spray`) vẽ cùng nhân vật, hai tay cầm vòi hướng phải.

## 4. Hình vẽ sẵn mới cho rửa tay (chưa có ảnh)
- Vẽ lại đôi tay **giống thật hơn**: có cổ tay + ống tay áo, lòng bàn tay, 4 ngón dài ngắn tự nhiên + ngón cái chéo vào trong, bóng nhẹ; bồn rửa có vòi cong, chậu sứ.
- Các trạng thái `dirty / soapy / rinse / clean / gloves / ready` vẽ bằng lớp (chấm bẩn, bọt, dòng nước, lấp lánh, găng) — dùng chung hiệu ứng ở 2.2.

## 5. Lưu ảnh
- Rửa tay: kho ảnh `lessonId = 'doctor:wash'`, `word` = mã ô (`dirty`…`ready`) — đi kèm chia sẻ / sao lưu "Ảnh Bác sĩ nhí".
- Chú lính cứu hỏa: `lessonId = 'jobs:fire-gear'`, `word` = mã ô (`plain`…`spray`) — đi kèm chia sẻ / sao lưu "Ảnh Đóng vai".
- Thiếu ô nào (ảnh lỗi / bố mẹ xóa) → **cả cảnh đó dùng hình vẽ sẵn** (không trộn ảnh với hình vẽ trong cùng cảnh, tránh lệch kiểu).

## 6. Mốc làm
| Mốc | Nội dung |
|---|---|
| **ART1** | Rửa tay: hình vẽ sẵn mới + hiệu ứng (bọt bay, nước chảy, lấp lánh, chuyển hình) + mục ảnh lưới ở Ảnh Bác sĩ nhí |
| **ART2** | Mặc đồ: chú lính cứu hỏa vẽ sẵn (cân đối) + ảnh lưới ở Ảnh Đóng vai + ghép món lên người + chuyển sang `full` + `spray` cầm vòi ở các ca |

## 7. Kiểm thử
- **Unit:** cắt ảnh lưới 3 × 2 ra đúng 6 ô theo thứ tự mã; đủ / thiếu ô → dùng ảnh / hình vẽ sẵn; trạng thái → hình (bảng 2.2, cả thứ tự tùy ý mức 1).
- **UI:** thêm ảnh lưới (ảnh thử 6 màu) → màn rửa tay / mặc đồ dùng đúng ô theo từng bước; xóa ảnh → về hình vẽ sẵn; hiệu ứng có xuất hiện (bọt / nước / lấp lánh); mặc đủ → ảnh `full`; ca dập lửa dùng `spray`, tia nước vẫn bắn tới lửa; ra nền quay lại đúng hình; chia sẻ / sao lưu có ảnh mới; **test cũ rửa tay / mặc đồ vẫn qua** (luật không đổi).
- **Thử tay:** bố mẹ nhờ AI vẽ theo prompt, xem 6 ô có khớp nhau không; nếu AI vẽ lệch nhiều thì chỉnh prompt.

## 8. Cần bố mẹ chốt
1. Ảnh lưới **6 ô cho mỗi cảnh** (đề xuất) — hay tách thành từng ảnh riêng?
2. Làm **ART1 (rửa tay) trước rồi ART2 (mặc đồ)** — hay ngược lại?
3. Trong lúc chờ: tiếp tục **DR3 (khám mắt)** rồi mới làm ART1–ART2, hay **làm ART trước** (đề xuất: làm ART trước vì bé đang chơi thấy hình xấu)?
