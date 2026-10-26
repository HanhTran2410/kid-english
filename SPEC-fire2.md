# SPEC — 🚒 Lính cứu hỏa: nhiệm vụ mới

> Phiên bản spec: **draft2** (sửa theo review, mục 12) · Ngày: 2026-10-26 · **FF1 đã làm (0.39.0); FF2 + FF3 đã làm (gộp vào 0.40.0).** Bổ sung cho `SPEC-jobs.md` mục 7 (dập lửa, đếm, gọi chỗ, cứu bạn trên cây — **giữ nguyên**).
> Đã có ở 0.38.1: chạm lính cứu hỏa / vòi để phun, tia nước bắn tới ngọn lửa, lửa nhận chạm ngay lúc Bông báo cháy.
> Bố mẹ chọn cả 4 nhiệm vụ: **Mặc đồ trước khi đi · Lái xe tới đúng nhà · Cứu bạn thú trong nhà · An toàn với lửa**.

## 1. Mục tiêu
- Thêm việc cho bé làm ngoài phun nước và đưa thang, mỗi việc gắn với **từ tiếng Anh mới**:
  - đồ lính cứu hỏa: *helmet, jacket, boots*;
  - màu nhà (ôn màu): *the red / blue / yellow / green house*;
  - cứu người: *knock, open the door, you're safe*;
  - an toàn: *hot, don't touch, it's safe, tell a grown-up, one-one-four*.
- Luật chung của các nghề **giữ nguyên** (`jobs/kit.js`): Bông nói + phụ đề, nhắc sau 10 giây, chọn nhầm theo luật nhầm chung (nhầm 2 lần thì đáp án đúng nhún), 🧹 chơi lại, ra nền rồi quay lại thì chơi tiếp đúng chỗ, mức tự lên sau vài lượt, khóa mức ở Cài đặt, 3 ca → Hoan hô + sticker.
- Một lượt vẫn ngắn (~2–3 phút) cho bé 3 tuổi.

## 2. Một lượt chơi mới

```
[Mặc đồ] → ca 1 → ca 2 → ca 3 → Hoan hô + sticker
             └─ ca dập lửa / cứu trong nhà: [Lái xe tới đúng nhà] → làm việc ở nhà đó
```

| Mức | Mở đầu | 3 ca của lượt |
|---|---|---|
| 1 | Mặc đồ — bé mặc **theo thứ tự tùy ý**, Bông gọi tên món bé vừa mặc | 2 ca dập lửa + 1 ca **An toàn** |
| 2 | Mặc đồ — Bông **gọi từng món** (*"Helmet first!"*) | 1 dập lửa (hỏi số) + 1 ca **cứu** (cây *hoặc* trong nhà, ngẫu nhiên) + 1 ca **An toàn** |
| 3 | Mặc đồ — Bông gọi từng món, khay có **thêm 1 món lạ** (vd. 🩱 đồ bơi — *"Not the swimsuit!"*) | 1 dập lửa (gọi chỗ) + 1 ca cứu + 1 ca **An toàn** có bước **gọi 114** |

- **Quy tắc sinh lượt** (lập một lần lúc bắt đầu lượt, lưu trong bản lưu chơi tiếp — ra nền quay lại không bốc lại; chỉ lập lại ở lượt mới / 🧹):
  - mức 1: đúng **2 ca dập lửa + 1 ca An toàn**;
  - mức 2–3: đúng **1 ca dập lửa + 1 ca cứu + 1 ca An toàn**;
  - ca An toàn **luôn ở vị trí 3**; chỉ xáo thứ tự các ca trước nó;
  - ca cứu: **cây** hoặc **trong nhà**, ưu tiên loại bé **ít gặp hơn** (`seen` của `fireGame`), bằng nhau thì ngẫu nhiên;
  - dữ liệu của ca (lửa, màu nhà + phố, đồ An toàn) sinh sẵn cùng lúc, mọi phần (lời thoại, màu tường, khói, đáp án) đọc từ cùng dữ liệu đó.
- Lái xe chỉ có ở ca dập lửa và ca cứu trong nhà (ca cây ở công viên, không cần chọn nhà).

## 3. Mặc đồ trước khi đi (mốc FF1)
- Màn đầu lượt: **Bông** đứng giữa (hình Bông có sẵn), khay dưới có 3 món vẽ SVG: **mũ đỏ** (*helmet*), **áo khoác vàng có sọc phản quang** (*jacket*), **ủng đen** (*boots*).
- Bông: *"Let's get ready! Put on your helmet!"* (mức 1: *"Let's get ready!"* rồi bé mặc món nào trước cũng được).
- Bé **kéo hoặc chạm** món đồ (như khay đồ bác sĩ) → đồ bay lên đúng chỗ trên người Bông → Bông: *"Helmet on!"* / *"Jacket on!"* / *"Boots on!"*.
- Mức 2–3: món Bông chưa gọi → món đó lắc + *"That's the boots. Helmet first!"* (luật nhầm chung). Mức 3: món lạ → *"Not the swimsuit! We need the jacket!"*.
- Mặc đủ: Bông xoay một vòng, *"I'm ready! Let's go!"*, còi xe 🚒 → sang ca 1. Từ đây hình **Bông mặc đồ** thay chỗ 🧑‍🚒 cầm vòi (vẫn chạm được để phun).
- Học tiếp / ra nền giữa lúc mặc đồ: các món đã mặc giữ nguyên.

## 4. Lái xe tới đúng nhà (mốc FF1)
- Trước ca dập lửa / cứu trong nhà: con phố có **3 ngôi nhà khác màu** (trong 4 màu đỏ, xanh dương, vàng, xanh lá; một nhà là nhà của ca), xe cứu hỏa 🚒 ở đầu phố.
- Bông: *"Nee-naw! Go to the red house!"* — **mọi mức đều gọi màu**; khói chỉ là gợi ý thêm. Bé **chạm ngôi nhà** → xe chạy tới nhà đó, còi *nee naw* → màn ca như hiện nay (không kéo xe — chạm nhà là đủ cho bé 3 tuổi).
- Gợi ý theo mức:
  - mức 1–2: nhà đúng **có khói** bốc lên (hai nhà kia không);
  - mức 3: **không nhà nào có khói**, chỉ nghe màu.
- Chọn nhầm nhà: *"That's the blue house. Go to the red house!"* (luật nhầm chung; màu trong câu là nhà bé vừa chạm).
- Chọn đúng: nhận **một lần**, khóa chọn nhà ngay (chạm thêm không làm xe chạy / chuyển màn lần nữa).
- Chạm **nút còi** trên xe lúc nào cũng được: *"Nee-naw!"* (không tính đúng / sai, chỉ cho vui).
- Ngôi nhà của ca có màu đó luôn (tường cùng màu) để bé nhận ra.
- **Tiến độ:** dùng hàm ghi tiến độ có sẵn (như Bưu tá): màu nhà ghi "đã gặp" **chỉ khi đúng ngay lần đầu**; nhầm rồi đúng vẫn xong ca nhưng không ghi; bấm còi không ảnh hưởng; ra nền quay lại không ghi lặp (đã ghi lúc chọn đúng).

## 5. Cứu bạn thú trong nhà (mốc FF2)
Ca kiểu C (mức 2–3, thay chỗ ca cây một nửa số lần — mỗi lượt có **1 ca cứu**: cây hoặc trong nhà):
1. Lái xe tới đúng nhà (mục 4).
2. Bạn thú ở **cửa sổ**, mặt buồn: *"Help! The door is stuck!"*
3. Bông: *"Knock on the door!"* → bé chạm cửa → *"Knock, knock!"* (cửa rung, tiếng gõ).
4. Bông: *"Open the door!"* → bé chạm cửa lần nữa → cửa mở, bạn thú chạy ra.
5. Bạn thú: *"I'm safe! Thank you, firefighter!"* → rời màn → ca sau.
- Bé chạm cửa sổ / bạn thú thay vì cửa: cửa nhún (nhắc) — **ngoại lệ chủ động: không tính nhầm**, không tăng bộ đếm nhầm (chưa biết chữ "door" thì nhìn cửa nhún là hiểu).
- Cửa mở **đúng một lần**; ra nền quay lại: đã gõ thì ở bước mở cửa, đã mở thì bạn thú đã ra.
- **Không có lửa** trong ca này (bé 3 tuổi không cần cảnh có người kẹt trong đám cháy).

## 6. An toàn với lửa (mốc FF3)
Ca kiểu D — **ca cuối mỗi lượt**, ở mọi mức:
1. Bông mở đầu: *"Some things are hot. Let's be safe!"* — rồi hiện **lần lượt 3 đồ** (hình to giữa màn), mỗi đồ hỏi *"Can we touch it?"*, 2 nút 👍 *"Yes!"* / 👎 *"No!"*:
   - đồ nóng (2 trong): 🕯️ nến, 🔥 lửa trại, 🍳 chảo trên bếp, ☕ cốc nước nóng;
   - đồ an toàn (1 trong): 🧸 gấu bông, ⚽ quả bóng, 📚 quyển sách, 🍎 quả táo.
2. Đúng:
   - đồ nóng + 👎 → *"That's right! The candle is hot. Don't touch!"* (gọi đúng tên đồ đang hiện);
   - đồ an toàn + 👍 → *"Yes! You can touch the teddy!"* (gọi đúng tên đồ, không nói chung chung "it's safe").
3. Nhầm (luật nhầm chung, không dọa):
   - đồ nóng + 👍 → *"Oh no! It's hot! Don't touch!"* (hình hơi đỏ lên, không có cảnh bỏng);
   - đồ an toàn + 👎 → *"It's okay! You can touch the teddy!"*.
   - Mỗi đồ có sẵn câu tiếng Anh riêng trong dữ liệu (`hot` / `safe`, tên + mạo từ), không ghép từ tên hiển thị.
4. Kết ca: *"If you see a fire, tell a grown-up!"* (*Thấy lửa thì báo người lớn nhé!*).
5. **Mức 3 — gọi 114:** điện thoại hiện bàn phím to 0–9; Bông: *"Grown-ups call one… one… four!"* (ba số tách rõ) → bé bấm 1 → 1 → 4 (phím cần bấm sáng lên lần lượt). Bấm nhầm phím: **không tăng** số chữ số đã bấm, phím đúng nhún (luật nhầm chung). Đủ 1-1-4: chuông đổ, *"Fire station! We're coming!"* → xong ca. Ra nền giữa lúc bấm: quay lại đúng số chữ số đã bấm, **không tự hoàn tất** cuộc gọi.
   - Dưới bàn phím ghi rõ: *"Trò chơi — chỉ người lớn gọi 114 khi có cháy thật"* (khi làm: để ở điện thoại thay vì phụ đề — phụ đề dài bị cắt). Không có nút gọi thật (chỉ là hình trong trò chơi).
   - Mỗi phím đúng: Bông đọc số (*"One!"*); bấm nhầm: *"That's five. Press one!"*.
- Đồ được chọn ngẫu nhiên mỗi lượt; không lặp đồ trong một lượt.

## 7. Hình và âm thanh
- Đồ mặc, xe cứu hỏa, phố 3 nhà, cửa, điện thoại: **SVG vẽ sẵn** (như nhà / lửa hiện nay), không cần ảnh. Màu nhà là đáp án → không thay bằng ảnh.
- Đồ ca An toàn: emoji (thay được bằng ảnh như ảnh từ vựng nếu bố mẹ đã có ảnh của từ đó — *candle, teddy*…).
- Âm thanh: còi xe dùng lại `fire-truck.mp3`; tiếng gõ cửa, chuông điện thoại: Web Audio như các tiếng hiệu ứng khác (không cần file mới).

## 8. Tiến độ, lưu, mức
- **Dùng bản lưu chơi tiếp đang có** của Cứu hỏa (đã có `plan`, `caseIdx`, `out`…), mở rộng thêm trường — không tạo cơ chế khôi phục mới:
  - `plan` chứa toàn bộ dữ liệu sinh sẵn (đồ mặc + món lạ, nhà + phố, ca cứu, đồ An toàn);
  - FF1 (đã có): `worn` (món đã mặc), `dressed` (mặc xong), `drove` (đã tới nhà của ca);
  - FF2: `knocked` (đã gõ cửa); cửa đã mở thì ca đã xong (lưu sang ca sau);
  - FF3: `safetyIdx` (đồ thứ mấy), `dialed` (đã bấm mấy số);
  - quay lại: hiện trạng thái ổn định cuối cùng của bước, chỉ nói lại câu hỏi; không phát lại phần thưởng, không tăng `rounds` / số ca lần thứ hai.
- Mức, số lượt lên mức, khóa mức ở Cài đặt: **giữ nguyên**.
- Từ ghi "đã gặp": màu nhà (mục 4); *helmet, jacket, boots, hot* **không** ghi (chưa có bài từ vựng tương ứng).

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **FF1** (0.39.0) | Mặc đồ + Lái xe tới đúng nhà; Bông mặc đồ cầm vòi | Unit (kế hoạch lượt theo mức, chọn nhà / đồ) + UI mục 10 |
| FF2 (0.40.0, đã làm) | Ca cứu bạn thú trong nhà | Gõ cửa → mở cửa → bạn thú ra; ra nền giữa ca chơi tiếp đúng bước |
| FF3 (0.40.0, đã làm) | Ca An toàn + gọi 114 (mức 3) | 3 đồ đúng / nhầm, bàn phím 1-1-4 |

## 10. Kiểm thử
- **Unit:** kế hoạch lượt theo mức (bảng mục 2: số ca từng loại, ca An toàn cuối, mỗi lượt đúng 1 ca cứu ở mức 2–3); phố có 3 nhà khác màu, đúng 1 nhà của ca; đồ An toàn 2 nóng + 1 an toàn, không lặp; câu nói không có chỗ trống.
- **UI:**
  - mặc đồ mức 1 (thứ tự tùy ý) / mức 2 (sai món → *"… first!"*) / mức 3 (món lạ);
  - chọn nhà đúng / nhầm; mức 3 không có khói; nút còi không tính lượt;
  - ca cứu trong nhà: chạm cửa sổ → cửa nhún, gõ → mở → *"I'm safe!"*;
  - ca An toàn: đúng / nhầm cả 2 kiểu, câu kết *"tell a grown-up"*; mức 3 bấm 1-1-4, bấm nhầm thì phím đúng nhún;
  - ra nền giữa mỗi bước rồi quay lại → chơi tiếp đúng bước;
  - hết 3 ca → sticker; test cũ của dập lửa / cây vẫn qua.
- Bảng test theo review (FF-T01…T12, mục 12) đưa vào các mốc tương ứng.
- **Bảng tính nhầm theo loại thao tác:**

  | Thao tác | Tính nhầm? |
  |---|---|
  | Mặc món chưa tới lượt / món lạ (mức 2–3) | Có (luật nhầm chung) |
  | Chọn nhà sai màu | Có |
  | Chạm ngọn lửa khác ngọn Bông gọi (mức 3) | Có (như cũ) |
  | Chọn thẻ số sai, chọn 👍/👎 sai ở ca An toàn, bấm sai phím 114 | Có |
  | Bấm còi xe, chạm Bông / vòi, chạm cửa sổ / bạn thú ở ca cứu | **Không** — chỉ để khám phá / nhắc |
- **Thử tay với bé:** lượt có dài quá không (nếu dài thì mặc đồ chỉ ở lượt đầu mỗi lần mở trò — đổi thiết kế thì hỏi bố mẹ trước).

## 11. Đã chốt (2026-10-26)
1. **Mặc đồ ở đầu mọi lượt.**
2. **Ca An toàn thay 1 ca dập lửa** (lượt vẫn 3 ca).
3. **Giữ gọi 114** ở mức 3 (ghi rõ "chỉ người lớn gọi khi cháy thật").

**Ghi chú khi làm FF1:** khay đồ ẩn thì không giữ chỗ (sân khấu cao hơn trên màn ngang điện thoại); nhà trên phố co theo chiều cao sân khấu.

## 12. Trả lời review (draft2)
| Điểm review | Xử lý |
|---|---|
| P1-1 Sinh lượt / ca An toàn luôn cuối | Quy tắc sinh lượt rõ theo mức, An toàn cố định ở vị trí 3, ca cứu theo `seen`, lập một lần + lưu (mục 2); unit: không lượt nào 2 ca An toàn / thiếu ca bắt buộc |
| P1-2 Màu nhà mục tiêu, khói, mức 1 có gọi màu không | Màu + phố sinh từ một dữ liệu (đã làm ở FF1: `house.color`, `street`, `smoke`); **mọi mức đều gọi màu**, khói mức 1–2; chọn đúng khóa ngay (mục 4) |
| P1-3 Món lạ mức 3 phải khớp món đang cần | Đã đúng ở FF1: câu dùng món đang cần (*"Not the swimsuit! We need the helmet!"*); món lạ chọn từ danh sách cố định (đồ bơi, dép tông), không trùng đồ cứu hỏa |
| P1-4 Trạng thái khôi phục | Mở rộng bản lưu có sẵn (mục 8); FF1 đã có `worn`, `dressed`, `drove` + test ra nền lúc mặc đồ và lúc ở phố; đã mặc xong thì quay lại không mặc lại |
| P2-5 Câu ca An toàn | Mở đầu *"Some things are hot. Let's be safe!"*; đúng / nhầm gọi đúng tên đồ (*"You can touch the teddy!"*, *"The candle is hot."*) (mục 6) |
| P2-6 Tính nhầm theo loại thao tác | Bảng ở mục 10; chạm cửa sổ, còi, Bông không tính nhầm |
| P2-7 Số ít / nhiều, câu lưu trong dữ liệu | Đã có: *"Those are the boots"*, câu từng món trong `GEAR_INFO`; đồ An toàn khai câu riêng; 114 đọc tách *"one… one… four"* |
| P2-8 Tiến độ màu | Dùng hàm ghi tiến độ có sẵn, chỉ đúng ngay lần đầu, không ghi lặp (mục 4) |
| Hồi quy FF1 | Đã có test: mặc đồ 3 mức, món lạ, phố 3 nhà / khói / còi, nhầm nhà, ghi màu, ra nền khi mặc đồ / ở phố, kích thước 5 màn hình |

**Ghi chú khi làm FF2 + FF3 (0.40.0):**
- Ca cứu trong nhà: bạn thú ló ở cửa sổ phải (chạm được → cửa nhún); cửa là nút phủ đúng chỗ cửa vẽ, mở ra thấy khoảng tối; `seen.tree` / `seen.house` cộng khi xong lượt.
- Ca An toàn: nhầm thì Bông nói câu đúng ngay (*"Oh no! The candle is hot. Don't touch!"*) và nút đúng nhún liền (không đợi nhầm lần 2) — vì câu đã nói đáp án; bé chạm nút đúng để đi tiếp.
- Ca An toàn không có bạn thú, không lái xe; Bông lính cứu hỏa ẩn trong ca này.
