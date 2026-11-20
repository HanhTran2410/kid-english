# SPEC — 🦸 Siêu nhân an toàn: chủ đề "Cơ thể của bé" (Body safety)

> Phiên bản spec: **draft3** (sửa theo review, mục 11) · Ngày: 2026-11-20 · Dựa trên app 0.86.0. **Bố mẹ đã chốt mục 9 (2026-11-20)**, đã duyệt. **Đã làm (0.87.0)**, ghi chú mục 13.
> Bổ sung cho `SPEC-safety.md` (khung trò, ⭐, huy hiệu, tiến độ, ảnh — **giữ nguyên**). Chủ đề thứ 10, mã `body`.

## 1. Mục tiêu
**Nguyên tắc xuyên suốt:** bé có quyền với cơ thể của mình, kể cả khi người giúp bé là người thân hoặc bác sĩ. Chăm sóc cơ thể phải cần thiết, được giải thích và tôn trọng cảm giác của bé. Mục tiêu là bé **tự tin nói Không, biết tìm người giúp, không thấy mình có lỗi** — không phải sợ bị chạm vào.

Quy tắc cho bé (4 điều):
1. **Chỗ đồ bơi che là chỗ riêng tư.** Cơ thể của bé là của bé.
2. **Bé được nói "Không"** khi không muốn bị chạm, ôm, hôn — kể cả người quen, người thân.
3. **Khi cần giúp tắm, thay đồ, khám bệnh**, người lớn giải thích và giúp bé nhẹ nhàng; bé vẫn được nói khi đau hoặc không thoải mái.
4. **Kể với bố mẹ** (hoặc người lớn bé tin) mọi điều làm bé bối rối, không thoải mái. Không có bí mật về cơ thể. **Không bao giờ là lỗi của bé.**

Hai trường hợp *được* (mẹ giúp rửa người, bác sĩ khám khi có bố) **không** có nghĩa bé mất quyền nói Không hoặc quyền được giải thích (mục 7, gợi ý cho bố mẹ).

## 2. Nguyên tắc (khác các chủ đề khác)
- **Mặc định tắt.** Chỉ chơi khi bố mẹ bật trong Cài đặt (hộp xác nhận, mục 7). Không bao giờ là chủ đề ưu tiên.
- **Không vẽ "người xấu", không vẽ cảnh chạm.** Không có hình người lạ / người lớn khác ngoài bố mẹ. Tình huống nói bằng lời + hình trừu tượng: Bông, bong bóng (❓ / 🤗 / 🤫), bố mẹ, đồ vật.
- **Bông là nhân vật chính của cả 6 tình huống**, luôn mặc quần áo hoặc đồ bơi.
- **Giọng nhẹ, không dọa.** Không dùng *bad, scary, hurt, stranger*. Câu luôn kết thúc bằng việc bé làm được (*Say No. Tell Mommy.*).
- **Luôn chơi kiểu No / Yes (mức 1)** ở mọi mức: không có cặp tranh "chưa an toàn", không có chuyện 2 bước. "Say it!" vẫn được ở mức 3 (câu nhắc lại tích cực).
- **Đáp án:** `private`, `bath-help`, `doctor` = 👍 Yes; `hug-no`, `secret`, `no-touch` = ✋ No.
- **Trình tự mỗi tình huống:** Bông nói câu tiếng Anh **chậm** (× 0.85) → câu tiếng Việt ngắn → bé chọn → Bông làm hành động minh họa → câu nhắc lại tiếng Anh ngắn.
- **Tiếng Việt luôn đọc ở chủ đề này**, kể cả khi bố mẹ tắt "giọng tiếng Việt" (bé phải hiểu, không cần hiểu hết tiếng Anh). Với `secret`, `no-touch`, câu tiếng Việt dài hơn, rõ hơn câu tiếng Anh.
- **Chọn nhầm:** như mọi chủ đề — không âm "sai", không biểu tượng sai, không trừ điểm; Bông dừng, giải thích nhẹ (câu `hint`, không trách), lần 2 gợi ý nút.

## 3. Tình huống (6: 3 ✅ + 3 🚫)

Câu hỏi ≤ 7 từ, giải thích ≤ 7 từ, nhắc lại ≤ 4 từ (luật 3+ của SPEC-safety; test kiểm tra).

| Mã | Đáp án | Bông hỏi | Đúng → Bông nói | Nhắc lại | Thao tác sửa | Cảnh |
|---|---|---|---|---|---|---|
| `private` | 👍 | *"My swimsuit parts are just for me?"* | *"Yes! My body is mine."* | *"My body is mine!"* | kéo khăn tắm lên người Bông | phòng tắm, Bông mặc đồ bơi |
| `bath-help` | 👍 | *"Mommy helps me wash. OK?"* | *"Yes! Mommy helps me wash."* | *"Mommy helps!"* | chạm vịt cao su → bọt xà phòng | phòng tắm, mẹ cạnh bồn, Bông trong bồn (bọt che tới vai) |
| `doctor` | 👍 | *"Doctor checks me. Daddy is here. OK?"* | *"Yes! Daddy stays with me."* | *"Daddy is here!"* | chạm tay bố (nắm tay) | phòng khám: Bông ngồi giữa, bố đứng cạnh, ống nghe 🩺 (không vẽ bác sĩ) |
| `hug-no` | ✋ | *"Do I have to hug?"* | *"No! You can say no. High five?"* | *"High five!"* | chạm ✋ → đập tay | phòng khách, Bông + bong bóng 🤗 |
| `secret` | ✋ | *"Someone says, 'Keep a secret.' OK?"* | *"No! Tell Mommy."* | *"Tell Mommy!"* | chạm mẹ → Bông thì thầm, mẹ gật, ôm | phòng khách, Bông + bong bóng 🤫, mẹ |
| `no-touch` | ✋ | *"Someone touches my swimsuit parts. OK?"* | *"No! Say NO. Tell Mommy."* | *"No! Tell Mommy!"* | chạm mẹ → mẹ ôm Bông | Bông + bong bóng ❓, mẹ (không vẽ người kia) |

**Tiếng Việt** (Bông đọc sau câu tiếng Anh):
- `private` hỏi: *"Chỗ đồ bơi che là của riêng tớ, đúng không?"* · đúng: *"Đúng rồi! Cơ thể của tớ là của tớ."*
- `bath-help` hỏi: *"Mẹ giúp tớ tắm, rửa người. Được không?"* · đúng: *"Được! Mẹ giúp tớ tắm khi tớ cần giúp."*
- `doctor` hỏi: *"Bác sĩ khám cho tớ, có bố ở cạnh. Được không?"* · đúng: *"Được! Bố ở cạnh tớ. Đau thì tớ nói với bố."*
- `hug-no` hỏi: *"Tớ có phải ôm không?"* · đúng: *"Không! Không muốn thì con được nói không. Đập tay nhé?"*
- `secret` hỏi: *"Có người bảo: đừng kể với ai nhé. Được không?"* · đúng: *"Không! Ai bảo con giấu chuyện về cơ thể thì con kể với bố mẹ nhé."*
- `no-touch` hỏi: *"Có người chạm vào chỗ đồ bơi che của tớ. Được không?"* · đúng: *"Không! Nói thật to: Không! Rồi kể với bố mẹ, hoặc người lớn con tin."*
- Sau `secret`, `no-touch` (lúc mẹ ôm): *"Con kể là đúng rồi. Không phải lỗi của con."*
- Câu nhắc khi chọn nhầm (`hint`, nhẹ): `private` *"It's OK! My body is mine."* · `bath-help` *"It's OK! Mommy helps me wash."* · `doctor` *"It's OK! Daddy is here."* · `hug-no` *"Hmm… I can say no!"* · `secret` *"Hmm… I can tell Mommy!"* · `no-touch` *"Hmm… I can say NO!"* (kèm tiếng Việt tương ứng).
- `hug-no`: **đập tay là một lựa chọn, không bắt buộc**; không nói người hỏi là ai. Gợi ý cho bố mẹ nói rõ: không muốn đập tay cũng được (vẫy tay, nói "bye" — mục 7).
- Surprise / secret: game **không** dạy phân biệt; để bố mẹ giải thích ngoài đời (mục 7).

## 4. Xếp lượt
- Bật chủ đề: tình huống `body` vào bốc lượt như các chủ đề khác (ít gặp trước, hai tình huống liền nhau khác chủ đề).
- **Tối đa 2 tình huống `body` mỗi lượt**, trừ khi bố mẹ chỉ bật mỗi chủ đề này (lượt 5 tình huống, 3 ✋ + 2 👍 như luật chung, **không có 3 ✋ liền nhau**).
- Bản lưu lượt (ra nền rồi vào lại) giữ đúng kế hoạch đã bốc, nên giới hạn 2 vẫn đúng khi học tiếp.
- Mức 2–3: tình huống `body` trong lượt vẫn hiện nút No / Yes (không có thẻ tranh). Kế hoạch chuyện mức 3 bỏ qua `body`; chỉ bật `body` thì dùng lượt thường.

## 5. Thưởng, tiến độ, huy hiệu
- ⭐, `seen`, `firstOk`, tiến độ `safe:<mã>` như mọi tình huống.
- Huy hiệu 🫶 *"My body"* — **chỉ hiện trong album khi chủ đề đang bật** (album 9 hoặc 10 ô).
- **Tắt lại chủ đề:** biến mất khỏi lượt chơi, album, nhóm "Bé đã học"; **không xóa** `seen`, `firstOk`, tiến độ, huy hiệu — bật lại thì hiện như cũ.

## 6. Hình
- Cảnh mới: `bath` (phòng tắm), `clinic` (phòng khám).
- Đồ: `tub` bồn tắm, `duck` vịt, `towel` khăn tắm, `stetho` ống nghe, `bubble` bong bóng có emoji (🤗 / 🤫 / ❓).
- **Đồ bơi** (lớp `swimsuit` trên Bông): mảng màu che kín thân từ ngực tới đùi, **không tạo hình dáng cơ thể, không chi tiết**.
- **Không có hình bàn tay đặt lên người Bông** (kể cả trừu tượng). "Nắm tay bố", "đập tay" là tay ở ngang tay, cạnh người Bông.
- Bố mẹ trong cảnh tắm / phòng khám: mặt cười, đứng cạnh, **không nhìn / chỉ vào người Bông**.
- Ảnh của bố mẹ (trang 🦸 Ảnh Siêu nhân an toàn): thay được ảnh nền 2 cảnh mới và các đồ vật (bồn tắm, vịt, khăn, ống nghe). **Không có mục ảnh** cho bong bóng ❓ / 🤗 / 🤫 và lớp đồ bơi. Ảnh chỉ thay hình, **không đổi câu, đáp án, thao tác**.

## 7. Góc bố mẹ
- Cài đặt → Siêu nhân an toàn → Chủ đề: dòng **"🫶 Cơ thể của bé (tắt — bố mẹ bật khi sẵn sàng)"**. Bật → hộp: *"Chủ đề này dạy bé: cơ thể của bé là của bé, được nói Không, không giấu chuyện về cơ thể, kể với bố mẹ. Nên đọc gợi ý và nói chuyện cùng bé."* — [Đọc gợi ý] [Bật] [Thôi]. Tắt: không hỏi.
- "Nói thêm với bé": mỗi tình huống một gợi ý (`TIPS`), trong đó:
  - `bath-help`: nói với bé mẹ giúp rửa là để chăm sóc cơ thể; khi bé lớn dần thì để bé tự rửa, hỏi bé trước khi giúp.
  - `doctor`: giải thích cho bé trước khi khám; bố mẹ ở cạnh; bác sĩ chỉ khám chỗ cần; bé được nói khi đau hoặc không thoải mái; bố mẹ là người giải thích và bảo vệ bé.
  - `hug-no`: không ép bé ôm / hôn ai, kể cả ông bà; bé có thể đập tay, vẫy tay, nói "bye" — hoặc không làm gì.
  - `secret`: bất ngờ (quà sinh nhật) thì sẽ kể sau; chuyện làm bé lo hoặc về cơ thể thì không cần giữ kín.
  - `no-touch`: cùng bé kể tên những người lớn bé tin (bố, mẹ, ông bà, cô giáo…) — bé được kể với họ khi bố mẹ không ở đó.
- Khối **"Nếu bé kể với bạn"**:
  1. Bình tĩnh lắng nghe, không tỏ ra hoảng sợ.
  2. Cảm ơn bé vì đã kể.
  3. Nói: "Con làm đúng khi kể với bố mẹ."
  4. Nói: "Không phải lỗi của con."
  5. Không hỏi dồn, không hỏi theo hướng dẫn dắt câu trả lời.
  6. Không trách móc, nghi ngờ, không bắt bé kể đi kể lại nhiều lần.
  7. Ghi lại những gì bé tự kể, bằng lời của bé.
  8. Nếu có dấu hiệu bé bị xâm hại: ưu tiên bảo vệ bé, tìm hỗ trợ từ chuyên gia hoặc cơ quan có thẩm quyền (ở Việt Nam: Tổng đài quốc gia bảo vệ trẻ em **111**, miễn phí, 24/7).
- Khối **"Bố mẹ không nên nói"**: *"Sao con không chạy đi?"* · *"Sao con không nói sớm hơn?"* · *"Chắc người ta chỉ đùa thôi."* · *"Không được kể chuyện này với ai ngoài bố mẹ."* (bé cần biết có thể tìm người lớn đáng tin khác khi bố mẹ không ở đó).
- Không bao giờ hiện chủ đề này trong thông báo / màn chính cho bé.

## 8. Kỹ thuật
- **Bật chủ đề lưu riêng:** `safetyGame.optIn` (danh sách chủ đề bố mẹ đã bật; hiện chỉ có `body`). Chủ đề `body` chơi khi `optIn` có `body` **và** `off` không có `body`. Không đụng tới `off` khi nâng cấp:
  - Cài mới: không có `optIn` → `body` tắt.
  - Máy cũ (0.86.0): không có `optIn` → `body` tắt; `off`, `focus`, mức, tiến độ các chủ đề khác giữ nguyên.
  - Bố mẹ bật: thêm `body` vào `optIn`, giữ sau mọi lần nâng cấp. Tắt: bỏ khỏi `optIn` (không xóa tiến độ).
  - `cleanSafetyState` chỉ nhận mã chủ đề opt-in hợp lệ.
- Câu tiếng Việt luôn đọc: cờ `viAlways` trên tình huống.
- Danh sách tình huống thường (`RULES`) giữ nguyên; tình huống `body` có `topic: 'body'`; mọi chỗ đếm "N tình huống", album, nhóm tiến độ dùng danh sách **đang bật**.

## 9. Đã chốt (2026-11-20 — bố mẹ trả lời)
1. **Mặc định tắt**, bố mẹ tự bật (hộp xác nhận, mục 7).
2. **Gọi tên:** "chỗ đồ bơi che" / *swimsuit parts*, không dùng tên bộ phận (review gợi ý *private parts* tự nhiên hơn — giữ lựa chọn của bố mẹ).
3. **Giữ `no-touch`** — không vẽ cảnh, chỉ dạy *"Say NO. Tell Mommy."* + "không phải lỗi của con".
4. **Cả mẹ và bố:** `bath-help` với mẹ, `doctor` với bố.

## 10. Test
**Unit:**
- 6 tình huống (3 👍 + 3 ✋, đúng đáp án mục 2); câu theo luật 3+ (hỏi ≤ 7, giải thích ≤ 7, nhắc lại ≤ 4 từ); không có *bad / scary / hurt / stranger*; `set` không có người ngoài bố mẹ; không có `stranger`.
- Nâng cấp: state 0.86.0 (có `off`, `focus`, `seen`…, không có `optIn`) → `body` tắt, các trường khác giữ nguyên; `optIn: ['body']` giữ qua `cleanSafetyState`; mã lạ trong `optIn` bị bỏ.
- 500 seed: bật đủ + `body` → ≤ 2 tình huống `body` / lượt; chỉ bật `body` → 5 tình huống, 3 ✋ + 2 👍, không 3 ✋ liền nhau; chưa bật → không bao giờ có `body`; `planStory` không có `body`.
- Huy hiệu `body` chỉ tính khi đang bật; tắt rồi bật lại → huy hiệu, `firstOk` còn nguyên.

**UI:**
- BODY-01: mặc định không gặp chủ đề; Cài đặt có dòng tắt; bật → hộp xác nhận → [Bật] → `optIn` có `body`; [Thôi] → vẫn tắt.
- BODY-02: `no-touch` mức 1 → câu Việt đọc dù tắt "giọng tiếng Việt" → ✋ → *"No! Say NO. Tell Mommy."* → chạm mẹ → ôm + "Không phải lỗi của con."
- BODY-03: `hug-no` → ✋ → đập tay; `private` → 👍 → kéo khăn; chọn nhầm → câu `hint`, không âm sai.
- BODY-04: mức 2 với tình huống `body` → vẫn nút No / Yes, không thẻ tranh.
- BODY-05: album chưa bật = 9 ô, bật = 10 ô; tắt lại = 9 ô, bật lại thì huy hiệu còn; "Nói thêm với bé" có khối "Nếu bé kể với bạn", "Bố mẹ không nên nói".
- BODY-06: ra nền giữa lượt có 2 tình huống `body` → vào lại đúng tình huống, kế hoạch giữ nguyên.
- BODY-07: ảnh bố mẹ thay bồn tắm / nền phòng tắm → câu, đáp án, thao tác không đổi.

## 11. Trả lời review (draft3, 2026-11-20)
| Review | Sửa |
|---|---|
| P0 — chưa nói rõ quyền từ chối khi được chăm sóc | Mục 1: nguyên tắc xuyên suốt + 4 quy tắc; được giúp ≠ mất quyền nói Không |
| P0 — `bath-help` quá rộng | *"Mommy helps me wash."*; tiếng Việt "khi tớ cần giúp"; gợi ý bố mẹ |
| P0 — `doctor`: có bố ≠ mọi thứ đều được | *"Yes! Daddy stays with me."*; tiếng Việt "đau thì tớ nói"; gợi ý bố mẹ 5 ý |
| P0 — hướng dẫn khi bé kể | Mục 7: 8 bước + "Bố mẹ không nên nói" + tổng đài 111 |
| P1 — *"A big hug. Must I?"* không tự nhiên | *"Do I have to hug?"*; đập tay không bắt buộc |
| P1 — *"body secret"* trừu tượng | *"Someone says, 'Keep a secret.' OK?"* → *"No! Tell Mommy."*; tiếng Việt giải thích; không dạy surprise / secret trong game |
| `no-touch` cần ưu tiên tiếng Việt | Tiếng Việt luôn đọc, dài và rõ hơn; thêm "người lớn con tin" |
| Bé 3 tuổi không cần hiểu hết tiếng Anh | Trình tự: tiếng Anh chậm → tiếng Việt → chọn → hành động → nhắc lại |
| Hình: đồ bơi, bàn tay, bố mẹ | Mục 6: 3 lưu ý; Bông là nhân vật chính cả 6 cảnh (`doctor` có Bông ngồi giữa) |
| Logic: đáp án, thứ tự, chọn nhầm, ≤ 4 từ, resume | Mục 2, 3, 4; test |
| Tắt lại không mất tiến độ / huy hiệu | Mục 5 |
| Migration không được reset `off` | Mục 8: `optIn` riêng, không đụng `off` |
| Ảnh tùy chỉnh không đổi quy tắc | Mục 6; BODY-07 |
| *private parts* tự nhiên hơn | Giữ *swimsuit parts* theo bố mẹ chốt (mục 9) |

## 12. Mốc
| Bản | Nội dung |
|---|---|
| 0.87.0 | Chủ đề `body` (6 tình huống), `optIn` + hộp xác nhận, tiếng Việt luôn đọc, cảnh / đồ / đồ bơi, gợi ý bố mẹ + "Nếu bé kể với bạn", huy hiệu khi bật, test |

## 13. Ghi chú khi làm (0.87.0)
- Tình huống 🫶 có cờ `gentle` (gộp `viAlways` ở mục 8): luôn No / Yes ở mọi mức, câu hỏi tiếng Anh đọc chậm (× 0.85, cả khi bé bấm 🔊 hỏi lại), tiếng Việt luôn đọc, không *"Oops!"*. `after`: câu *"You did right. It's not your fault."* / *"Con kể là đúng rồi. Không phải lỗi của con."* sau `secret`, `no-touch`.
- Bốc lượt: `planRound` / `planStory` mặc định `off = OPT_IN_TOPICS`; màn chơi truyền `offTopics(state)`. `TOPIC_CAP.body = 2` (bỏ giới hạn khi chỉ còn 🫶). Xếp thứ tự: ít cặp cùng chủ đề trước, rồi ít chuỗi 3 cùng loại (`kindRuns`).
- Hình: đồ bơi là emoji 🩱 trên áo choàng Bông (class `swim`), khăn tắm kéo lên Bông (`worn`), bồn tắm vẽ phía trước (chỉ thấy đầu Bông), bong bóng 🤗 / 🤫 / ❓, bàn tay 🖐️ hiện khi tới bước sửa (đứng riêng, không chạm Bông). Ảnh thay được: khăn, giá khăn, bồn tắm, vịt, bọt, bàn khám, ống nghe, nền `bath` / `clinic`.
- Cài đặt: dòng 🫶 riêng dưới các chủ đề; bật → hộp [Thôi] [Đọc gợi ý] [Bật] (`confirmDialog` có `extraText`); không có trong "Chủ đề ưu tiên". Trang "Nói thêm với bé" luôn có 🫶 (bố mẹ đọc trước khi bật).
- Test: unit BODY (bảng, nâng cấp, 500 seed, huy hiệu), UI BODY-01…07.
