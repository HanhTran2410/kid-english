# SPEC — Đóng vai: hai bên rõ ràng, ai nói người đó sáng lên

> Phiên bản spec: **draft2** (sửa theo review, mục 8) · Ngày: 2026-10-27 · **Đã làm (0.55.0, mục 9: 0.56.0)**. Áp dụng cho **Bán hàng, Bác sĩ nhí, Cô giáo nhí**; Bưu tá, Cảnh sát, Cứu hỏa làm sau khi cơ chế chung chạy ổn.
> Lý do: hiện tại Bông không đứng trên sân khấu (chỉ có nút tròn nhỏ ở góc), phụ đề luôn ở giữa phía trên → bé khó biết **ai đang nói, tới lượt ai**.
> Không đổi: luật chơi, câu nói, giọng (0.54.1), tiến độ, dữ liệu lưu, nút Bông ở góc (chạm để nghe lại).

## 1. Bố cục mới (màn ngang — máy tính bảng / máy tính)
Sân khấu chia **hai bên**, như hai người đứng đối diện nhau:

| Trò | Bên trái — phía bé | Bên phải — phía bạn thú |
|---|---|---|
| 🛒 Bán hàng | **Bông bán hàng** đứng sau quầy (huy hiệu 🛒 trên áo) | **Khách** đứng trước quầy; bong bóng món muốn mua trên đầu khách |
| 🩺 Bác sĩ nhí | **Bông bác sĩ** (huy hiệu 🩺) | **Bệnh nhân**; ca 2 bạn (so cao) đứng cạnh nhau |
| 👩‍🏫 Cô giáo nhí | **Bàn cô giáo** (bé là cô giáo): bảng tên "👩‍🏫 Teacher" | **Lớp học**: Bông + các bạn, bảng đen ở giữa trên |

- Khu chơi (quầy, khay đồ, giường, bảng, thẻ…) **giữ nguyên chỗ**; chỉ thêm / dời nhân vật sang hai bên. Nhân vật không chiếm quá ~25% bề ngang sân khấu.
- **Màn dọc (điện thoại):** bạn thú ở trên, Bông nhỏ hơn ở góc dưới trái.
- Bông dùng hình có sẵn (`bongSvg`) + **huy hiệu emoji nhỏ** trên áo (đã chốt, không vẽ thêm tạp dề / ống nghe).

## 2. Ba trạng thái tách rời
| Trạng thái | Khi nào | Hiển thị |
|---|---|---|
| `speaking` | nhân vật / nhóm đang phát câu | phóng to nhẹ ×1.06, hào quang màu vai (Bông vàng, bạn thú xanh), thân nhún theo nhịp, 🔊 nhỏ trên đầu |
| `quiet` | nhân vật khác trong lúc có người nói | mờ nhẹ (0.7), đứng yên |
| (không lớp) | không ai nói | bình thường |
- `speaking` / `quiet` **chỉ gắn lên phần tử nhân vật** (hình Bông, khách, bệnh nhân, từng bạn trong lớp, bàn cô giáo) — **không** gắn lên khung chứa đồ vật, khay, quầy, bảng, thẻ, nút. Đồ cần chạm luôn giữ độ sáng / tương phản.
- **Chờ bé thao tác** là trạng thái của game (đã có: đồ / nút cần chạm nhún theo luật hiện tại) — không phụ thuộc lớp nói. Hết câu: bỏ `speaking` / `quiet`, phần "chờ bé" giữ nguyên.

## 3. Người nói → phần tử (một chỗ, trong `jobs/kit.js`)
- Mỗi trò khai báo `roles(who)` → **danh sách phần tử** của người nói (rỗng = không có hình, bỏ qua hiệu ứng, không lỗi):
  - một vai: `'bong'` → hình Bông; `'customer'` / `'patient'` → hình bạn thú;
  - một nhóm: `'class'` → mọi bạn trong lớp (phụ đề chỉ hiện **một lần**);
  - vai đại diện: `'teacher'` → **bàn cô giáo** (bé đóng vai, máy đọc giùm) — không làm sáng cả lớp / bảng.
- Phía của người nói (`left` / `right`) lấy theo vị trí phần tử trên màn (tâm phần tử ở nửa trái / phải sân khấu) — không cần khai báo cứng.
- Trò **chưa khai báo `roles`**: chạy như cũ (phụ đề giữa trên, không hiệu ứng).
- Dùng **đúng hàng nói hiện có** của kit (`talk`): mỗi câu bắt đầu → bỏ hiệu ứng câu trước, bật hiệu ứng câu này; câu bị thay / 🧹 / rời màn / ra nền (`cancelAll`, `onCleanup`) → dọn hết `speaking` / `quiet`. Không tạo bộ điều khiển âm thanh thứ hai.
- Chạm nút Bông nghe lại: câu nghe lại do vai nào nói thì vai đó sáng (cơ chế chung, không xử lý riêng).

## 4. Phụ đề về phía người nói, có vùng dự phòng
- Ở các trò Đóng vai, phụ đề nằm ở **dải dưới sân khấu** (giữa sân khấu và khay đồ) — không bao giờ đè lên khu chơi. *(Khi làm: thay cho "dải trên cùng sân khấu" của draft2 — dải trên đè lên bảng đen / mái hiên.)*
- Màn ngang đủ rộng (sân khấu ≥ 700px): phụ đề **lệch về phía người nói** (`data-side="left|right"`), **đuôi bong bóng chỉ lên** đúng chỗ người nói; không ra khỏi màn.
- Giới hạn: tự xuống dòng; viền vàng = Bông, xanh = vai khác.
- Vùng dự phòng `data-side="center"` (giữa, như cũ, giữ màu viền): màn dọc / sân khấu hẹp / nhóm cùng nói / người nói không có hình.
- Khu chơi / vùng chạm ưu tiên hơn phụ đề: phụ đề `pointer-events: none` (không chặn chạm).

## 5. Giảm chuyển động
Không phóng to, không nhún, không chuyển động lặp, không nhấp nháy. Giữ: hào quang tĩnh, độ mờ nhẹ, 🔊 tĩnh trong lúc nói (đủ để nhận ra người nói khi không có chuyển động).

## 6. Kiểm thử
| ID | Trường hợp | Mong đợi |
|---|---|---|
| ROLE-01 | Bông nói rồi tới khách / bệnh nhân | Bông `speaking` trước, khách sau; không còn lớp cũ |
| ROLE-02 | Chạm nút Bông nghe lại | vai của câu nghe lại sáng; không hai vai cùng sáng |
| ROLE-03 | Câu mới bắt đầu khi câu cũ chưa xong (🧹 / chạm nhanh) | chỉ vai của câu mới sáng |
| ROLE-04 | Cả lớp nói | mọi bạn trong lớp `speaking`; một phụ đề |
| ROLE-05 | Cô giáo nói | bàn cô giáo `speaking`, lớp không sáng |
| ROLE-06 | Tới lượt bé chạm | đồ cần chạm không bị mờ, vẫn nhún đúng luật |
| ROLE-07 | Phụ đề dài | xuống dòng, không chặn chạm; thiếu chỗ → giữa trên |
| ROLE-08 | Màn dọc 390×760 | phụ đề giữa trên, không tràn, không che khu chơi |
| ROLE-09 | Giảm chuyển động | không phóng to / nhún; vẫn có hào quang + 🔊 |
| ROLE-10 | Ra nền khi đang nói, quay lại | không nhân vật nào sáng kẹt |
| ROLE-11 | Trò chưa khai báo `roles` (Bưu tá…) | như cũ |
| ROLE-12 | Toàn bộ test ba trò + cả bộ | luật chơi, giọng, nút Bông, tiến độ không đổi |
- Ảnh chụp 1920×990, 1180×820, 390×760: nhân vật / phụ đề không che khu chơi; nhân vật không chiếm quá nhiều diện tích.

## 7. Đã chốt
1. Đồ nghề Bông: huy hiệu emoji nhỏ trên áo.
2. Phạm vi: Bán hàng, Bác sĩ nhí, Cô giáo nhí trước; ba nghề còn lại sau.
3. Phụ đề cạnh người nói, có vùng dự phòng giữa trên (và luôn giữa trên ở màn dọc).

## 8. Trả lời review (draft2)
- P1-1 tách trạng thái nói / chờ bé → mục 2 (chờ bé là trạng thái game, không bị lớp nói ghi đè).
- P1-2 ngắt câu, nghe lại, nhóm, ra nền → mục 3 (dùng hàng nói sẵn có, dọn khi `cancelAll` / rời màn).
- P1-3 phụ đề che khu chơi → mục 4 (vùng phụ đề theo phía + vùng dự phòng, không chặn chạm).
- P2-4 màn dọc → mục 4 (luôn giữa trên).
- P2-5 không làm mờ đồ vật → mục 2 (chỉ phần tử nhân vật).
- P2-6, P2-7 vai đại diện / nhóm → mục 3 (`roles(who)` trả danh sách phần tử; `teacher` → bàn cô giáo).
- P2-8 giảm chuyển động → mục 5.
- Kiểm thử bổ sung → mục 6 (ROLE-01…12).

## 9. Người thật thay Bông ở vai nghề (0.56.0, theo yêu cầu sau khi chơi thử)
| Trò | Bên trái / vai | Hình vẽ sẵn | Phụ đề |
|---|---|---|---|
| 🛒 Bán hàng | cô bán hàng (sau quầy) | tóc dài, áo vàng, tạp dề hồng | 👩 |
| 🩺 Bác sĩ nhí | chú bác sĩ | áo blouse trắng, ống nghe | 👨‍⚕️ |
| 👩‍🏫 Cô giáo nhí | cô giáo (bàn cô giáo — bé đóng vai) | tóc dài, kính, áo len tím | 👩‍🏫 |
| 👩‍🏫 Cô giáo nhí | bạn học sinh (vai học trò kiêm lớp trưởng, trước là Bông) | tóc ngắn, áo trắng, khăn quàng đỏ | 🧒 |
- Bố mẹ thay bằng ảnh riêng: Góc bố mẹ → **Ảnh Đóng vai** (cô bán hàng, cô giáo, bạn học sinh — kho `jobs:people`) / **Ảnh Bác sĩ nhí** (chú bác sĩ — `doctor:bg`, mã `doctor`). Có prompt nhờ AI vẽ (nền trắng, app tự bỏ nền), "Dùng hình vẽ sẵn" để quay về. **Ảnh chỉ lưu trên máy** (và khi bố mẹ chia sẻ file sang máy khác), không đưa lên GitHub; khuyên dùng hình vẽ, không dùng ảnh chụp người thật.
- Giọng không đổi (câu của vai bên trái vẫn giọng chính). Nút Bông ở góc giữ nguyên (chạm để nghe lại).
- Bố cục Bán hàng (màn ngang): quầy chỉ nửa trái, cô bán hàng sau quầy, khách đứng trên sàn bên phải, bong bóng món trên đầu khách, máy xay trên đầu quầy. Bưu tá — cảnh tới nhà: nhà đứng trọn trên cỏ, hộp ở bậc cửa, 👍 / 👎 cạnh nhà. Cứu hỏa — ca đưa thang: cây to có cành, thang vẽ dựng từ đất lên cành, chú lính cứu hỏa (không cầm vòi) đứng cạnh, bạn thú trèo xuống đứng dưới gốc.
