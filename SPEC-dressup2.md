# SPEC — 👗 Mặc đồ: ảnh quần áo tự tạo vừa khít người + kiểu "3D giả"

> Phiên bản spec: **draft2** (sửa theo review, mục 8) · Ngày: 2026-10-27 · **Đã làm (0.57.0)**. Khi làm thêm: ảnh áo / áo khoác / váy hạ mép trên 6px để cổ áo nằm dưới cằm. Bổ sung cho `SPEC-dressup.md` mục 11.
> **Giữ nguyên** mọi hành vi hiện có (cách chơi, tủ đồ, câu nói, xoay người, chia sẻ đồ, dữ liệu đã lưu). Phần mới chỉ là **xử lý ảnh, cách đặt ảnh lên người, căn chỉnh và hiệu ứng hiển thị**.

## 1. Vì sao ảnh tự tạo bị lệch (ảnh chụp 2026-10-27 11h46)
- Ảnh món đồ đặt **giữ nguyên tỉ lệ, căn giữa** (`meet`) trong khung món đó → ảnh áo gần vuông mà khung áo ngang (128 × 116) → áo thu nhỏ, lòi tay búp bê; ảnh quần thấp → quần ngắn, hở eo (lộ quần lót xám).
- Ảnh AI hay chừa lề; app đã bỏ nền trắng + cắt sát (chừa 4%) khi lưu, nhưng khung hình của món đồ trong ảnh vẫn khác khung trên người.
- Prompt chưa nói khung hình đúng của từng món.

## 2. Xử lý ảnh khi lưu (chọn ảnh / ảnh lưới / thêm đồ)
- Giữ cách bỏ nền hiện có: **loang từ mép ảnh** qua các điểm gần trắng (có dung sai) → chỉ nền nối với mép bị xóa; **áo trắng có viền đậm không bị mất** (vùng trắng trong viền không nối với mép). Ảnh PNG đã trong suốt: giữ nguyên, chỉ cắt sát.
- Đồ Mặc đồ: **chừa lề 1%** (thay 4%), cạnh dài tối đa **480px** (thay 320) cho nét hơn.
- Không tìm được hình (ảnh trắng / hỏng): **không lưu**, báo "Không thấy món đồ trong ảnh, hãy chọn ảnh khác" (như hiện nay).
- Ảnh đã lưu trước đây: dùng nguyên (đã cắt sát lúc lưu), chỉ đặt lên người theo mục 3.

## 3. Đặt ảnh lên người
- Khung đặt: khung hình vẽ sẵn của món (đồ có sẵn) / khung chỗ mặc (đồ thêm) — như hiện nay. Gọi tỉ lệ ảnh `ri = rộng / cao` (lấy từ kích thước ảnh đã lưu), tỉ lệ khung `rb`.
- **Độ lệch** `d = max(ri / rb, rb / ri) − 1` (0 = cùng tỉ lệ; 0,4 = một chiều dài hơn 40%).

| Nhóm | Chỗ mặc | d ≤ 0,4 | d > 0,4 |
|---|---|---|---|
| Đồ mặc thân | áo, áo khoác, váy liền, quần / chân váy, tất | **kéo vừa đúng khung** (phủ vai → cổ tay / eo → cổ chân) | giữ tỉ lệ, **căn trên giữa** (áo bám vai, quần bám eo); tất căn dưới |
| Phụ kiện | giày | giữ tỉ lệ, **căn dưới giữa** (chạm đất) | như bên trái |
| | mũ, nơ | giữ tỉ lệ, **căn dưới giữa** (vành mũ chạm đầu) | |
| | kính, khăn, ba lô, đồ cầm tay | giữ tỉ lệ, căn giữa (như hiện nay) | |
- **Thứ tự lớp không đổi** (`SPEC-dressup.md` mục 10): quần · giày · áo · váy · áo khoác…; khung áo (đến y = 220) đã chồng lên khung quần (từ y = 200) → kéo vừa khung là hết khe eo.
- Đồ vẽ sẵn (chưa thay ảnh): không đổi gì.

## 4. "Căn lại" từng món (Góc bố mẹ → Đồ Mặc đồ)
- Món **đã có ảnh** có nút **"Căn lại"** → mở khung xem trước: **búp bê mặc món đó** (bé gái / bé trai theo món) + nút **⬅️ ➡️ ⬆️ ⬇️** (4px / lần, tối đa ±40px), **➕ ➖** (5% / lần, 60%–160%), **↺ Mặc định**, **Lưu**, **Đóng**.
- Lưu ở cài đặt `dressUpFit[mã ảnh] = { dx, dy, scale, stamp }`, `stamp` = thời điểm lưu ảnh → **thay ảnh mới thì căn chỉnh cũ không áp dụng** (ảnh mới về mặc định). Không có mục căn chỉnh (dữ liệu cũ) = mặc định.
- Trò chơi, tủ đồ xem trước và khung căn lại dùng **cùng một hàm đặt ảnh** (mục 3 + căn chỉnh) → nhìn ở Góc bố mẹ thế nào thì trong trò chơi y như vậy.
- Căn chỉnh đi cùng file chia sẻ đồ (kèm cài đặt `dressUpFit` như `dressUpCustom`).

## 5. Prompt mới
- Mỗi món nói rõ khung hình theo khung trên người (ví dụ áo *"wide landscape about 1.1 : 1, sleeves straight down"*, quần *"tall portrait about 1 : 2, legs straight down, waistband at the very top edge"*, giày *"a pair side by side, wide landscape"*), *"the item fills the whole image edge to edge with no empty margin"*, *"front view, flat lay"*, nền trắng.
- Nút **"Prompt 3D"** bên cạnh "Copy prompt": cùng nội dung + *"soft 3D cartoon render, clay / plastic toy look, gentle studio lighting, no cast shadow on the background"*.

## 6. "3D giả" (không phải 3D thật)
- 3D thật (mô hình xoay được) không làm: quá nặng cho điện thoại, khó cho bé 3 tuổi.
- Công tắc **"Hình 3D giả"** ở Góc bố mẹ → Đồ Mặc đồ (cài đặt `dressUp3d`, **mặc định bật**).
- Bật: búp bê + mọi món đồ (vẽ sẵn **và** ảnh) có **lớp sáng mềm phía trên trái** (như ánh đèn) + **bóng đổ nhẹ** xuống người; bóng mờ dưới chân búp bê.
- Làm bằng **bộ lọc hiển thị (SVG filter / CSS)**, **không sửa ảnh gốc**; bật / tắt chỉ đổi một lớp trên khung búp bê → bật tắt bao nhiêu lần cũng không cộng dồn, ảnh không tối dần. Độ mạnh nhẹ (sáng ≤ 35%, bóng ≤ 20%).

## 7. Kiểm thử
| ID | Trường hợp | Mong đợi |
|---|---|---|
| D01 | Áo trắng viền đậm trên nền trắng | không mất thân / tay áo |
| D02 | PNG nền trong suốt | cắt sát hình, không viền giả |
| D03 | Ảnh có bóng mờ nhạt | không cắt mất phần áo thật (bóng nhạt gần trắng thì bỏ) |
| D04 | Áo vuông, khung áo ngang (d ≈ 0,1) | kéo vừa khung áo — rộng đúng khung, che hết tay búp bê |
| D05 | Quần thấp (d > 0,4) | giữ tỉ lệ, cạp bám eo (căn trên) |
| D06 | Căn lại một món, sang màn khác, vào trò chơi | căn chỉnh giữ nguyên, trò chơi đặt y như xem trước |
| D07 | Bật / tắt 3D giả nhiều lần | không cộng dồn, ảnh không tối dần |
| D08 | Ảnh cũ (trước bản này), chưa có căn chỉnh | vẫn hiện, đặt theo mục 3, căn lại được |
| D09 | Thay ảnh mới cho món đã căn | ảnh mới về mặc định |
| D10 | Ảnh trắng / không có hình | không lưu, báo chọn ảnh khác |
- Unit: hàm đặt ảnh (độ lệch, kéo / giữ tỉ lệ, căn theo nhóm, căn chỉnh dx / dy / scale), prompt theo khung.
- Ảnh chụp: áo sơ mi + quần bò tự tạo trước / sau; 3D giả bật / tắt.

## 8. Trả lời review (draft2)
- P1 cắt sát ≠ vừa khít → mục 3 (đặt theo nhóm + kéo vừa khung có điều kiện) + mục 4 (căn tay); nền trắng / áo trắng → mục 2 (loang từ mép).
- P1 ngưỡng 40% → công thức `d` ở mục 3.
- P1 thứ tự lớp → mục 3 (giữ thứ tự hiện có, khung áo đã chồng khung quần).
- P2 "Căn lại" quá thô → mục 4 (dịch 4 hướng, phóng to / thu nhỏ, mặc định, lưu theo món, cùng hàm đặt ảnh).
- P2 3D giả làm tối ảnh → mục 6 (bộ lọc hiển thị, không sửa ảnh, độ mạnh nhẹ, bật tắt không cộng dồn).
- Test bổ sung D01–D10 → mục 7. Dữ liệu cũ → mục 2, 4 (mặc định khi chưa có căn chỉnh).
- Đã chốt theo review: kéo giãn có điều kiện; có "Căn lại"; 3D giả bật mặc định.
