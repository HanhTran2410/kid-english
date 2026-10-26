# SPEC — 🩺 Bác sĩ nhí: nhiệm vụ mới

> Phiên bản spec: **draft2** (sửa theo review, mục 12) · Ngày: 2026-10-26 · **DR1 (0.42.0), DR2 (0.43.0) đã làm**; DR3 chưa làm (D2 — bật mức 2–3 của trò Bác sĩ — xong ở 0.41.0). Bổ sung cho `SPEC-doctor.md` (11 ca bệnh, 3 loại bước chạm / khám / chữa, luật nhầm, mức, ảnh — **giữ nguyên**).
> Cùng hướng với Cứu hỏa (`SPEC-fire2.md`): thêm việc **trước khi khám**, **ca kiểu mới** xen với ca bệnh, và việc nhỏ **sau khi chữa**.

## 1. Mục tiêu
- Thêm việc cho bé ngoài "chạm chỗ đau → đưa đồ chữa", mỗi việc gắn với **từ / mẫu câu mới** và ôn bài đã có:
  - vệ sinh: *wash your hands, soap, water, towel, gloves*;
  - đo đạc + số: *tall, short, one… five*;
  - khám mắt: *Point to the fish!* — ôn từ con vật / đồ vật;
  - màu + hình: *a red star, please!* — ôn màu (Colors) và hình (Shapes).
- **Nguyên tắc nội dung của `SPEC-doctor.md` mục 1 giữ nguyên:** không kim tiêm, không máu, không thuốc viên, thuốc không bao giờ là "candy"; bạn thú không khóc to; **không có "sai"** — nhầm thì nói tên thứ bé vừa chọn rồi nhắc lại.
- **Luật chung giữ nguyên** (`jobs/kit.js` + `SPEC-doctor.md` mục 4.3–4.4, 7.3, 8–9), áp dụng **cho mọi bước mới** (rửa tay, sticker, đo chiều cao, khám mắt):
  - phụ đề có người nói;
  - nhắc sau 10 giây không thao tác, tối đa 2 lần mỗi bước;
  - nhầm 2 lần thì đáp án nhún; chạm nhầm cùng chỗ trong 0,4 giây gộp làm một;
  - nhận thao tác đúng ngay cả khi Bông đang nói;
  - 🧹 khám lại; ra nền rồi quay lại chơi tiếp đúng chỗ;
  - mức + khóa mức; 3 ca → Hoan hô + sticker.
- Code 11 ca bệnh cũ không đổi luật; test cũ phải qua nguyên vẹn.

## 2. Một lượt chơi mới

```
[Rửa tay (+ đeo găng từ mức 2)] → ca 1 → ca 2 → ca 3 → Hoan hô + sticker (của bé, một lần)
                                    └─ mỗi ca khỏi: [Tặng sticker cho bạn thú] → "Bye-bye!" → tự sang ca sau
```

| Mức | Mở đầu | 3 ca của lượt |
|---|---|---|
| 1 | Rửa tay 3 món (xà phòng, nước, khăn) — **thứ tự tùy bé**, không đeo găng | 2 ca bệnh (như cũ) + 1 ca **Đo chiều cao** (1–3 khối) |
| 2 | Rửa tay **đúng thứ tự** xà phòng → nước → khăn, rồi **đeo găng** | 2 ca bệnh + 1 ca mới: **Đo chiều cao** (2–5 khối, thẻ số) *hoặc* **Khám mắt** (3 hình) |
| 3 | như mức 2 | 2 ca bệnh + 1 ca mới: **Đo chiều cao** (hai bạn thú, ai cao hơn) *hoặc* **Khám mắt** (4 hình nhỏ hơn) |

- **Kế hoạch lượt lập một lần** khi bắt đầu lượt (cùng chỗ đang chọn 3 ca bệnh): chọn ca mới, sinh luôn **dữ liệu của ca** (chiều cao, bộ sticker, bảng hình…) và lưu trong danh sách ca của lượt. Ra nền rồi quay lại **không chọn lại**; chỉ lập lại khi bắt đầu lượt mới hoặc bấm 🧹.
- **Ca mới thay 1 ca bệnh** (lượt vẫn 3 ca, ~2–3 phút). Thứ tự 3 ca xáo ngẫu nhiên.
- **Mức 2–3 chọn Đo chiều cao hay Khám mắt:** ưu tiên ca bé **ít gặp hơn** theo `seen` (`checkup`, `eyes`), bằng nhau thì ngẫu nhiên — cùng luật chọn ca bệnh (`SPEC-doctor.md` 7.2).

## 3. Rửa tay & đeo găng (mốc DR1)
- Màn đầu lượt: **bồn rửa tay** (SVG), hai bàn tay hoạt hình của "bác sĩ" (bé) ở giữa, khay dưới: 🧼 **soap**, 💧 **water**, 🧻 **towel**; mức 2–3 thêm 🧤 **gloves**.
- Bông y tá: *"Doctors wash their hands! Let's wash!"*.
- Bé **chạm** (hoặc kéo) món đồ → hoạt ảnh ngắn (≤ 1 giây, không chặn thao tác tiếp) trên hai bàn tay:
  - 🧼 → bọt xà phòng: *"Rub, rub, rub!"*;
  - 💧 → nước chảy, bọt trôi: *"Rinse!"*;
  - 🧻 → tay khô: *"Dry your hands!"*;
  - 🧤 (mức 2–3) → tay đeo găng xanh: *"Gloves on! Ready!"*.
- **Mỗi món tính một lần:** dùng xong thì món đó rời khay (không chạm lại được). Hoàn thành khi đã dùng **đủ các món của mức** (mức 1: 3 món; mức 2–3: 4 món) — không phải khi đủ số lần chạm.
- Mức 1: món nào trước cũng được.
- Mức 2–3: chỉ nhận **món tiếp theo** trong thứ tự xà phòng → nước → khăn → găng. Món khác: món đó lắc + *"Soap first!"* (luật nhầm chung) — không cộng bước, **không mất** các món đã dùng.
- Xong: *"Clean hands! Let's help our friends!"* → ca 1. Mục tiêu ~10–15 giây.
- **Ghi chú cho bố mẹ** chỉ nằm ở Góc bố mẹ → Bác sĩ nhí (không hiện trong màn chơi): *"Trò này giúp bé quen rửa tay; bố mẹ có thể nói lại 'Wash your hands!' trước bữa ăn."*

## 4. Tặng sticker cho bạn thú (mốc DR1)
Sau khi bạn thú khỏe lại (*"I feel better! Thank you, doctor!"*), trước khi ra về:
- Bạn thú: *"Can I have a sticker, please?"* — khay hiện sticker SVG (hình: **star, heart, circle, square**; màu: **red, blue, yellow, green**).
- **Bộ sticker và sticker cần chọn sinh sẵn khi lập kế hoạch lượt** (mục 2), dùng một hàm kiểm tra chung `matchesSticker(sticker, want)` cho mọi mức:
  - **Mức 1:** 3 sticker khác nhau, `want` rỗng → cái nào cũng đúng. Bạn thú nói theo **chính sticker bé chọn**: *"A blue star! I love it!"*.
  - **Mức 2:** 3 sticker **khác màu**, `want = { color }`: *"A blue one, please!"*.
  - **Mức 3:** 4 sticker, `want = { color, shape }`: *"A yellow star, please!"*. Bộ sticker có **đúng một** cái khớp cả màu lẫn hình, và có ít nhất một cái trùng màu (khác hình) + một cái trùng hình (khác màu) — để bé phải nghe cả hai.
- Nhầm (mức 2–3): *"That's a green heart. A blue one, please!"* (luật nhầm chung; tên trong câu luôn là sticker bé vừa chạm).
- Đúng: sticker bay lên dán vào ngực bạn thú (*pop*, ~1 giây) → bạn thú: câu cảm ơn → *"Bye-bye!"* → **tự sang ca sau** (không có nút "Tiếp tục").
- **Một lần mỗi ca:** đã dán thì ghi vào bản lưu; ra nền rồi quay lại sau khi dán → không hỏi lại, đi thẳng tới ca sau.
- **Tiến độ:** mức 2 ghi màu, mức 3 ghi màu + hình "đã gặp" **chỉ khi chọn đúng ngay lần đầu** (mục 8).

## 5. Ca mới: Đo chiều cao (mốc DR2)
- Bạn thú: *"Hello, doctor! Am I growing?"* — đứng cạnh **thước đo là chồng khối màu**.
- **Chiều cao (số khối) sinh sẵn khi lập kế hoạch:** mức 1: 1–3; mức 2: 2–5; mức 3: hai bạn thú, chiều cao **khác nhau** trong 2–5. Đỉnh đầu bạn thú vẽ ngang khối trên cùng.
- Bông: *"Let's measure! Count the blocks!"* → bé **chạm từng khối từ dưới lên**, khối sáng lên + Bông đếm *"One! Two! Three!"*.
- Chạm khối **không phải khối tiếp theo** (bỏ khối / chạm khối đã đếm): **không tăng số đếm**; khối tiếp theo nhún + *"From the bottom! One…"* (mức 1 không tính nhầm; mức 2–3 tính theo luật nhầm chung).
- Đếm xong: *"You're three blocks tall!"* (số = đúng chiều cao đã sinh) → *"I'm growing!"*.
- Mức 1: khối cần chạm tiếp nhấp nháy sẵn.
- Mức 2: không nhấp nháy; đếm xong Bông hỏi *"How many blocks?"* → 3 thẻ số khác nhau trong 1–5, đúng một thẻ là chiều cao (như *"How many fires?"* của Cứu hỏa).
- Mức 3: đếm lần lượt hai bạn, rồi *"Who is taller?"* → bé chạm bạn cao hơn → *"Teddy is taller! Kitty is shorter!"* (tên + taller / shorter sinh từ dữ liệu thật).
- **Tiến độ:** số (`number:` như bài Đếm số) ghi "đã gặp" khi chọn đúng thẻ số ngay lần đầu (mức 2).

## 6. Ca mới: Khám mắt bằng bảng hình (mốc DR3)
- Bạn thú: *"Hello, doctor! Can you check my eyes?"* — **bảng hình** treo tường: 3 hình (mức 2) / 4 hình nhỏ hơn (mức 3).
- **Nguồn hình** (sinh sẵn khi lập kế hoạch, lưu cùng ca):
  - "đã học" = từ trong các **bài từ vựng có trên máy** mà bé đã gặp (`practiceCount > 0`), chỉ lấy từ có emoji hoặc ảnh;
  - mỗi hình: ảnh bố mẹ đã thêm nếu có và đọc được, không thì emoji;
  - thiếu từ: bổ sung từ **bộ mặc định** (cat, dog, fish, apple, ball, car) cho đủ;
  - không lặp từ trên một bảng; 3 câu hỏi là 3 hình **khác nhau** đều có trên bảng.
- Bông đưa bạn thú cái **che mắt**: *"Cover one eye!"* (bạn thú che một mắt — chỉ là hoạt ảnh).
- Bông: *"Point to the fish!"* → bé chạm hình → bạn thú: *"I see the fish!"*. 3 lượt chỉ hình.
- Nhầm: *"That's the cat. Where's the fish?"* (luật nhầm chung).
- Xong 3 lượt: Bông đưa **kính** 👓 (chạm / kéo từ khay — một món) → bạn thú đeo kính: *"Wow! Now I can see better!"* → khỏe lại → tặng sticker (mục 4).
- Lời của trò chơi chỉ nói về **bạn thú này** (*"Teddy needs glasses."*), không có câu kiểu "đeo kính là khỏi" chung chung.
- **Tiến độ:** từ được hỏi ghi "đã gặp" khi bé chạm đúng ngay lần đầu.

## 7. Hình và âm thanh
- Bồn rửa tay, bàn tay, bọt, găng, sticker (sao / tim / tròn / vuông), thước khối, bảng hình, kính: **SVG vẽ sẵn**. Màu / hình sticker là đáp án → không thay bằng ảnh.
- Hình trên bảng khám mắt: ảnh từ vựng bố mẹ đã thêm (như Ôn tập), không có thì emoji.
- Âm thanh: nước, bọt (*whoosh* nhỏ), dán sticker (*pop*), khối sáng (*ding*) — hiệu ứng Web Audio có sẵn, nhỏ hơn giọng đọc; thao tác nhanh liên tiếp chỉ phát một tiếng cho mỗi thao tác được nhận (thao tác bị bỏ qua không có tiếng).

## 8. Lưu, tiến độ, mức
- `doctorGame = { level, rounds, lock, seen }` **giữ nguyên**; `seen` thêm mã `checkup`, `eyes` (ghi khi ca khỏi, như ca bệnh).
- **Không thêm cơ chế lưu mới** — mở rộng bản lưu chơi tiếp đang có của Bác sĩ (`cases`, `caseIdx`, `stepIdx`, `recorded`…):
  - `cases` chứa luôn dữ liệu sinh sẵn của từng ca: bộ sticker + `want`, chiều cao, bảng hình + 3 câu hỏi;
  - thêm `washed` (các món đã dùng), `sub` (vị trí trong bước nhiều lượt: khối đã đếm, bạn thú thứ mấy, câu hỏi khám mắt thứ mấy, đã đeo kính chưa), `stickered` (ca đã dán sticker);
  - quay lại: hiện **trạng thái ổn định cuối cùng** của bước (khối đã đếm sáng sẵn, đồ đã dùng rời khay), chỉ nói lại câu hỏi của bước, không phát lại hoạt ảnh đã xong.
- **Tiến độ "đã gặp" một luật cho mọi việc mới** (dùng hàm ghi tiến độ đang có, tập `recorded` chặn ghi hai lần):
  - đúng ngay lần đầu → ghi (màu / hình / số / từ);
  - nhầm rồi mới đúng, hoặc đúng sau khi đáp án đã nhún → hoàn thành bước nhưng **không** ghi;
  - ra nền rồi quay lại / 🧹 khám lại cùng lượt → không ghi lần nữa.
- **Không lặp phần thưởng:** sticker của bạn thú một lần mỗi ca; `seen`, `rounds` và sticker cuối lượt của bé ghi một lần như hiện nay.
- 🧹 khám lại: làm lại từ rửa tay (cùng 3 ca của lượt, như hiện nay).

## 9. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **DR1** ✅ (0.42.0) | Rửa tay (+ găng từ mức 2) + Tặng sticker cho bạn thú | Unit + UI mục 10 (phần DR1) |
| DR2 ✅ (0.43.0) | Ca Đo chiều cao (đếm, thẻ số, so cao / thấp) | Unit + UI mục 10 (phần DR2) |
| DR3 | Ca Khám mắt (bảng hình từ bài đã học + bộ mặc định, kính) | Unit + UI mục 10 (phần DR3) |

## 10. Kiểm thử
**Unit**
- Kế hoạch lượt: mỗi mức đúng 3 ca = 2 ca bệnh + 1 ca mới đúng loại theo mức (DR-T01); mức 2–3 ca mới ưu tiên ít gặp theo `seen` (DR-T02).
- Sticker: mức 1 ba cái khác nhau; mức 2 ba màu khác nhau, đúng một khớp màu; mức 3 **đúng một** khớp cả màu và hình, có cái trùng màu và cái trùng hình — chạy với nhiều seed (DR-T06).
- Chiều cao trong khoảng theo mức; mức 3 hai bạn khác chiều cao; thẻ số đúng một đáp án (DR-T08).
- Bảng hình: không lặp, câu hỏi có trên bảng, máy mới dùng bộ mặc định đủ hình (DR-T09).
- Câu nói không có chỗ trống, khớp sticker / số / tên thật (DR-T05).

**UI**
| ID | Ca | Kết quả mong đợi |
|---|---|---|
| DR-T03 | Rửa tay: chạm lặp một món | Món đã dùng rời khay, không tính trùng |
| DR-T04 | Rửa tay mức 2: sai thứ tự | *"Soap first!"*, không mất món đã dùng; có găng |
| DR-T05 | Sticker mức 1 | Câu cảm ơn khớp đúng màu + hình bé chọn |
| DR-T06/07 | Sticker mức 2 / 3: nhầm rồi đúng | Câu nhầm nói tên sticker vừa chạm; đúng → dán, tự sang ca sau; không ghi tiến độ (đã nhầm) |
| DR-T07 | Đo chiều cao: chạm bỏ khối | Không tăng số đếm, khối tiếp theo nhún |
| DR-T08 | Mức 2 thẻ số; mức 3 *"Who is taller?"* | Đúng câu theo dữ liệu |
| DR-T09 | Khám mắt máy mới / có bài đã học | Đủ hình, hình hỏi có trên bảng; nhầm / đúng; kính → *"Wow! Now I can see better!"* |
| DR-T10/11 | Ra nền ở từng bước mới (rửa tay, sticker trước / sau khi dán, đang đếm, đang khám mắt) | Quay lại đúng ca, bước, vị trí; không hỏi lại sticker đã dán; không ghi lặp |
| DR-T12 | 🧹 khám lại giữa lượt | Làm lại từ rửa tay, không ghi lặp tiến độ |
| DR-T13 | Chơi hết lượt | Đúng 3 ca, sticker cuối lượt của bé một lần |
| DR-T14 | Test cũ 11 ca bệnh | Qua nguyên vẹn (luật nhầm, khám lại, khóa mức, tiến độ Body) |

- **Thử tay với bé:** đo thời lượng một lượt thật. Nếu quá dài, phương án dự phòng (tặng sticker chỉ ca cuối) là **đổi thiết kế** — hỏi bố mẹ trước, không tự áp dụng khi code.

## 11. Đã chốt (2026-10-26)
1. Làm **cả 4 việc**: rửa tay & đeo găng, tặng sticker, đo chiều cao, khám mắt.
2. **Ca mới thay 1 ca bệnh** — lượt vẫn 3 ca.
3. **Tặng sticker sau mọi ca** — tự sang ca sau, không có nút "Tiếp tục".
4. Làm **sau khi xong Cứu hỏa FF2–FF3**.
5. (draft2) **Mức 1 không đeo găng**; găng từ mức 2.
6. (draft2) Mức 2–3 chọn Đo chiều cao / Khám mắt theo **ca ít gặp** (`seen`), bằng nhau thì ngẫu nhiên.
7. (draft2) **Dùng bản lưu chơi tiếp đang có** của Bác sĩ, mở rộng thêm trường — không tạo cơ chế khôi phục mới.

## 12. Trả lời review (draft2)
| Điểm review | Xử lý |
|---|---|
| P1-1 Kế hoạch lượt mức 2–3, đổi ca khi quay lại | Lập một lần lúc bắt đầu lượt, sinh sẵn dữ liệu ca, lưu trong `cases` của bản lưu (code hiện tại đã lưu `cases`); chọn theo `seen` (mục 2, 11.6) |
| P1-2 Sticker sau mọi ca làm lượt dài | Giữ quyết định; hoạt ảnh ~1 giây, không nút "Tiếp tục", tự sang ca sau, không hỏi lại khi quay lại; đo thời lượng khi thử với bé, phương án dự phòng phải hỏi bố mẹ (mục 4, 10) |
| P1-3 Rửa tay mức 1 vs 2–3; chạm lặp; găng mức 1 | Mỗi món một lần (rời khay), xong khi đủ món; mức 2–3 chỉ nhận món tiếp theo, sai không mất bước; mức 1 không găng (mục 3, 11.5) |
| P1-4 Trạng thái lưu chưa đủ | Mở rộng bản lưu có sẵn: dữ liệu ca trong `cases`, thêm `washed`, `sub`, `stickered`; quay lại hiện trạng thái ổn định, không phát lại thưởng (mục 8) |
| P2-5 Câu sticker mức 1 phải khớp sticker thật; mức 3 đúng một đáp án | Câu sinh từ sticker bé chọn; `matchesSticker` dùng chung; mức 3 đúng một khớp cả hai + test nhiều seed (mục 4, 10) |
| P2-6 Chiều cao / câu trả lời | Chiều cao sinh sẵn, câu theo số thật; *"How many blocks?"* thay *"How tall?"*; mức 3 tên + taller / shorter từ dữ liệu (mục 5) |
| P2-7 Hình khám mắt, dữ liệu thiếu, ý nghĩa kính | Định nghĩa "đã học", ảnh → emoji, bổ sung bộ mặc định, không lặp, lưu bảng; câu chỉ nói về bạn thú, *"Now I can see better!"* (mục 6) |
| P2-8 Tiến độ "đúng ngay lần đầu" | Một luật cho mọi việc mới, dùng hàm + `recorded` có sẵn (mục 8) |
| Thời lượng rửa tay, chạm thay kéo | Chạm là đủ, hoạt ảnh ≤ 1 giây không chặn thao tác, mục tiêu 10–15 giây (mục 3) |
| Nhắc 10 giây áp dụng cho bước mới | Có — ghi ở mục 1 |
| Âm thanh chồng nhau | Một tiếng mỗi thao tác được nhận, nhỏ hơn giọng đọc (mục 7) |
| Ghi chú rửa tay chỉ ở Góc bố mẹ | Có (mục 3) |
| Bảng test DR-T01…T14 | Đưa vào mục 10 |

## 13. Ghi chú khi làm DR1 (0.42.0)
- Mã món rửa tay: `soap`, `rinse` (đọc là *water* — mã `water` đã dùng cho nước ấm của ca ho), `towel` (khăn vẽ SVG, không có emoji khăn), `gloves`.
- Bồn rửa + hai bàn tay vẽ SVG; lớp bọt / nước chảy / ✨ khô / găng xanh bật theo món đã dùng (ra nền quay lại vẽ đúng trạng thái).
- Ca khỏi bệnh: bản lưu chuyển sang bước `sticker` của **cùng ca** (trước đây nhảy sang ca sau); dán xong mới lưu là ca sau.
- Sticker dán lên bụng bạn thú (lớp `dr-applied`, ở lại tới khi ra về).
- Ghi chú rửa tay cho bố mẹ ở Góc bố mẹ → Ảnh Bác sĩ nhí.

## 14. Ghi chú khi làm DR2 (0.43.0)
- Lượt = 2 ca bệnh (chọn như cũ) + ca **đo chiều cao** ở vị trí ngẫu nhiên (`planDoctorRound`); tới DR3 thì ca mới ở mức 2–3 chọn giữa đo chiều cao / khám mắt theo `seen`. Hiện mức 2–3 luôn là đo chiều cao.
- Màn đo: thước là chồng khối màu (đỏ, vàng, xanh lá, xanh dương, tím từ dưới lên), bạn thú đứng cạnh, cao đúng bằng số khối; khối đếm rồi sáng và hiện số. Mức 3 hai cặp thước + bạn thú.
- Đo xong bạn thú lên giường nhận sticker như ca bệnh; `seen.checkup` ghi một lần.
- Chạm khối ở thước của bạn chưa tới lượt (mức 3) xử lý như chạm bỏ khối.
- Test UI cố định chỗ ca mới bằng `window.__kidTest.doctorNewAt` (chỉ test đặt; bình thường ngẫu nhiên).
