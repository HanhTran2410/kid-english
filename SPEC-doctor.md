# SPEC — 🩺 Bác sĩ nhí (Doctor)

> Phiên bản spec: **draft2** · Ngày: 2026-10-23 · **D1 đã làm ở app 0.28.0** (mức 1; ghi chú khi code ở mục 15), **ảnh (D3) ở 0.28.1** (mục 10), D2 chưa làm. Một trò mới trong Góc trò chơi (🎲 Play), trò đầu tiên của nhóm **"đóng vai nghề"** (mục 13).
> Bé làm **bác sĩ**, các bạn thú đến phòng khám. **Bông làm y tá** đứng cạnh, hướng dẫn bé. Bé chạm đúng chỗ đau, khám bằng dụng cụ, chữa bằng đồ chữa, bạn thú khỏe lại và cảm ơn.
> - draft1: bản đầu.
> - **draft2, sửa theo review:**
>   - mỗi ca khai báo **danh sách bước** (bước nào có từ mức nào), bỏ sơ đồ cố định *chạm → khám → chữa*; mức 1 không bao giờ có bước khám (mục 6.3);
>   - chọn **sai dụng cụ khám** xử lý như chọn sai đồ chữa; một luật gợi ý chung (4.3);
>   - bảng trạng thái: chạm bạn thú ở bước khám / chữa = nghe lại triệu chứng, không tính nhầm (8);
>   - **mã lượt + mã bước** cho mọi câu nói, hẹn giờ, hoạt ảnh, lượt kéo, ghi tiến độ; tiến độ ghi đúng một lần (8.1);
>   - khay: mỗi bước một `item` đúng, đồ gây nhiễu lấy từ phần còn lại (7.1); chọn 3 ca có thứ tự ưu tiên + dự phòng (7.2);
>   - câu nói: bảng theo **người nói**; câu nhầm đồ lưu sẵn cho từng đồ (*"Those are the eye drops"*); *"You feel warm!"* (6.4);
>   - ca ho **bỏ bước chạm** (không tách vùng ngực); ca buồn ngủ là "giúp bạn nghỉ", không gọi là bệnh;
>   - chốt 3 điểm mục 14; thêm test DOC-01…DOC-15.

## 1. Mục tiêu
- Bé 3 tuổi học **bộ phận cơ thể** (ôn bài Body, thêm *head, tummy, tooth*), **đồ dùng của bác sĩ** (*bandage, stethoscope, tissue…*) và mẫu câu: *"My tummy hurts!"*, *"Open wide! Say aah!"*, *"I feel better! Thank you, doctor!"*.
- Trẻ thích **được giúp đỡ** và **được làm người lớn**: bé là người chữa, bạn thú cảm ơn bé.
- Ôn cảm xúc (bài Feelings): bạn thú vào phòng mặt **buồn** 😢, ra về mặt **vui** 😊, có ca **buồn ngủ** 😴.
- Không có "sai": chạm nhầm hay đưa nhầm đồ thì bạn thú nói tên thứ đó rồi nhắc lại. Không trừ gì, không có màn thua.

**Nguyên tắc nội dung (bắt buộc):**
- **Đây là trò đóng vai với thú bông**, không phải hướng dẫn chữa bệnh thật. Không có câu nào dạy bé tự chữa cho mình hay cho người.
- **Không có kim tiêm, không có máu, không có vết thương đáng sợ.** Vết đau là vệt hồng nhạt, cục u tròn, má phồng.
- **Thuốc là si-rô trên thìa 🥄, chỉ là đồ chơi:** không có liều, không có lọ thuốc, không có viên thuốc 💊, không bao giờ gọi thuốc là "yummy" hay "candy". Chỉ bác sĩ (bé) đưa cho bạn thú.
- Bạn thú không khóc to, không la hét. Kêu đau thì chỉ *"Ouch!"* nhỏ, mặt buồn.

## 2. Vị trí trong app
- Thẻ mới ở Góc trò chơi: **🩺 Doctor / Bác sĩ nhí** (`games.js`, cạnh *Who says moo?*). **Từ 0.29.0:** vào qua thẻ **🧑‍⚕️ Jobs / Đóng vai** → trang chọn nghề (`SPEC-jobs.md`); 🎲 trong trò về trang chọn nghề.
- Không cần mic. Câu *"Say aah!"* chờ ~2 giây cho bé nói theo rồi đi tiếp, như *"Can you say moo?"* ở Ai kêu thế?.

## 3. Màn hình
```
 🏠  🎲  🧹   🩺 Doctor                     ca 2/3      [Bông y tá 🐰 mũ y tá]
 ┌──────────────────────────────────────────────┐
 │   🗨️ "My tummy hurts!"                        │
 │                                              │
 │          (bạn thú ngồi trên giường khám,      │   ← vùng chạm: đầu, mắt, tai, mũi,
 │           cả người, mặt buồn)                 │      miệng, bụng, tay, chân (mục 5)
 │                                              │
 └──────────────────────────────────────────────┘
  phụ đề (hàng riêng, cao cố định, có hình nhỏ người đang nói)
  [🩹] [🩺] [🧻]                                  ← khay: 2–4 món, không cuộn
```
- **Bông y tá** (Bông SVG có sẵn + mũ y tá vẽ thêm) ở góc. **Chạm Bông**: Bông nói lại câu của bước hiện tại.
- **🧹** khám lại từ ca đầu của lượt (9).
- Điện thoại dọc: bạn thú chiếm ~55% chiều cao, khay 1 hàng (tối đa 4 món nên luôn vừa).
- **Khay ẩn ở bước chạm** để bé nhìn vào bạn thú; trượt lên khi sang bước khám / chữa.

## 4. Cách chơi

### 4.1 Khái niệm
| Từ | Nghĩa |
|---|---|
| **Ca** | Một bạn thú cần giúp: vào phòng → làm lần lượt các bước của ca → khỏe, ra về. Phần lớn ca là bị đau; ca `sleepy` là giúp bạn **nghỉ ngơi**, không gọi là bệnh |
| **Bước** | Một việc bé phải làm. 3 loại: **`touch`** chạm chỗ đau, **`check`** đưa dụng cụ khám, **`treat`** đưa đồ chữa. Danh sách bước khai báo theo từng ca (6.3) |
| **Lượt** | **3 ca** liên tiếp, mỗi ca một bạn thú khác nhau → hoan hô + sticker |

### 4.2 Một ca
| Lúc | Người nói / App |
|---|---|
| **Vào phòng** | Chuông cửa *ding dong*, bạn thú đi vào (mặt buồn), ngồi lên giường. **Bông:** *"Hello! Come in!"* **Bạn thú:** *"Hello, doctor!"* + triệu chứng (*"My tummy hurts!"*). Rồi vào bước đầu tiên |
| **Bước `touch`** | **Bông:** *"Where does it hurt? Touch it!"* |
| Chạm **đúng** | Chỗ đó viền sáng nhẹ. **Bạn thú:** *"Yes! My tummy."* → bước sau |
| Chạm **chỗ khác** trên người | **Bạn thú:** *"That's my nose! My tummy hurts!"* → tính 1 lần nhầm của bước |
| Chạm ra ngoài người | Không có gì xảy ra |
| **Bước `check`** | **Bông** gọi tên dụng cụ: *"Let's check! Use the flashlight."* |
| **Bước `treat`** | Mức 1: **bạn thú** xin đồ có tên: *"A bandage, please!"*. Mức 2+: **Bông:** *"How can we help?"* (bé đoán theo dấu hiệu trên người bạn thú) |
| Đưa **đúng** (kéo hoặc chạm) | Đồ bay tới đúng chỗ, hoạt ảnh khám / chữa (6.1–6.2) + câu của bước → bước sau, hết bước thì **khỏe lại** |
| Đưa **đồ khác** | Bạn thú lắc đầu, đồ bay về khay, bước không đổi, tính 1 lần nhầm. Câu nhầm theo 4.3 |
| Chạm bạn thú ở bước `check` / `treat` | **Bạn thú** nói lại triệu chứng. **Không** tính nhầm, không đổi bước, không đặt lại số lần nhầm |
| **Khỏe lại** | Mặt vui, nhún nhảy, dấu hiệu biến mất. **Bạn thú:** *"I feel better! Thank you, doctor!"* **Bông:** *"Great job, doctor!"* **Bạn thú** vẫy tay: *"Bye-bye!"* → ca sau |
| Xong 3 ca | **Bông:** *"All better! You're a great doctor!"*, hoan hô + **sticker** (một lần) → về Góc trò chơi |

- **Thả đồ ở bất kỳ đâu trên người bạn thú là được.** Đồ tự bay tới đúng chỗ (bé 3 tuổi chưa thả chính xác được vào tai). Thả ra ngoài người thì đồ về khay, không tính nhầm.
- **Chạm một món trong khay** (không kéo) = đưa món đó, xử lý như kéo-thả (giống Cho Bông ăn).
- **Tai / mắt / tay / chân:** chạm **bên nào cũng đúng**. Dấu hiệu bệnh vẽ ở một bên cho tự nhiên, nhưng không bắt bé chọn đúng bên.

### 4.3 Nhầm, gợi ý và nhắc (một luật cho mọi bước)
Số lần nhầm đếm **riêng cho từng bước**, về 0 khi sang bước mới.

| Bước | Gợi ý có sẵn | Nhầm lần 1 | Nhầm lần 2 trở đi |
|---|---|---|---|
| `touch` mức 1 | chỗ đau nhấp nháy viền đỏ nhạt ngay từ đầu | câu nhầm chỗ | câu nhầm chỗ |
| `touch` mức 2–3 | chỉ có dấu hiệu vẽ (nếu ca có) | câu nhầm chỗ | câu nhầm chỗ + chỗ đau nhấp nháy |
| `check` (mọi mức, có tên) | Bông đã gọi tên | *"Hmm, that's the stethoscope. Use the flashlight!"* + dụng cụ đúng nhún | như lần 1 |
| `treat` mức 1 (có tên) | bạn thú đã xin tên | *"Hmm, that's the toothbrush. I need a bandage!"* + đồ đúng nhún | như lần 1 |
| `treat` mức 2–3 (không tên) | dấu hiệu vẽ | *"Hmm, not the toothbrush."* | *"I need a bandage!"* + đồ đúng nhún |

- **Gộp chạm liên tục:** các lần chạm nhầm **cùng một vùng / cùng một đồ** trong 0,4 giây kể từ lần nhầm trước được gộp thành một lần nhầm (không nói lại câu, không tăng đếm). **Chạm đúng luôn được xử lý ngay**, kể cả trong 0,4 giây đó.
- **Nhắc khi 10 giây không thao tác:** nói lại câu của bước, phần cần làm nhún / nhấp nháy. **Tối đa 2 lần nhắc mỗi bước.** Chỉ đếm khi không ai đang nói; dừng khi app ra nền hay đang xử lý; đếm lại khi bé thao tác.

### 4.4 Khóa thao tác
- Từ lúc nhận một thao tác **đúng** đến khi xong hoạt ảnh và câu phản hồi, ca ở trạng thái **`busy`**: khay mờ nhẹ, chạm người và kéo đồ không có tác dụng, món kéo dở về khay. Không xếp hàng chờ (như `SPEC-feed.md` mục 3.4).
- Thao tác **nhầm** không khóa: bé làm đúng ngay trong lúc bạn thú đang nói câu nhầm thì được nhận luôn, câu nhầm bị câu mới thay (như Ai kêu thế?). Nhầm liên tục cùng chỗ / cùng đồ thì gộp theo 4.3.
- Lúc bạn thú đi vào / ra về / khỏe lại: khóa hết.

### 4.5 Âm thanh
- Theo 3 loại như Cho Bông ăn: **câu hỏi / nhắc** (câu mới hủy câu cũ), **phản hồi** (được nói hết, vì đang khóa thao tác), **hiệu ứng** (chuông cửa, *thump thump*, *honk*, chải răng, *boing*): phát song song, nhỏ hơn lời nói.
- **Hai giọng:** Bông y tá dùng giọng đọc thường. Bạn thú dùng cùng giọng nhưng **cao độ khác** cho mỗi bạn (nếu máy hỗ trợ `pitch`; không thì giọng thường). Phụ đề có hình nhỏ của người đang nói.
- Giọng đọc lỗi: phụ đề vẫn hiện từng câu, thao tác đúng vẫn đi tiếp. Bé không bị kẹt.

## 5. Bạn thú và vùng chạm
- **Một khung thân chung** vẽ bằng SVG (`app/js/patients.js`): thân tròn kiểu thú bông, ngồi trên giường, hai tay, hai chân, bụng to rõ.
  - Mỗi bạn thú khác nhau ở **đầu** (tai, mõm, màu lông). Tất cả dùng chung tọa độ vùng chạm.
  - Mặt có 3 trạng thái: `sad` (vào phòng), `happy` (khỏe), `sleep` (ca buồn ngủ). Dùng lại cách vẽ mắt / miệng của `bong.js`.
- **4 bạn thú:** 🐻 gấu (*Teddy*), 🐱 mèo (*Kitty*), 🐶 cún (*Puppy*), 🐷 heo (*Piggy*). Mỗi lượt 3 bạn khác nhau.
- **8 vùng chạm** (khung trong `viewBox`, nới rộng ~15%; **mỗi vùng ≥ 56 px CSS** cả chiều ngang lẫn dọc ở màn hình nhỏ nhất app hỗ trợ):

| Vùng | Từ trong game | Từ bài Body (ghi tiến độ) |
|---|---|---|
| đầu (trán, đỉnh đầu) | head | — |
| mắt (2 bên) | eye | eyes |
| tai (2 bên) | ear | ears |
| mũi | nose | nose |
| miệng | mouth / tooth | mouth |
| bụng | tummy | — |
| tay (2 bên) | hand | hands |
| chân (2 bên) | foot | feet |

- **Vùng chồng nhau** (mũi, mắt, miệng nằm trong đầu; tay đè lên bụng): **vùng có diện tích nhỏ hơn thắng**, áp dụng cho mọi cặp chồng nhau.
- **Không tách vùng ngực:** ca ho không có bước chạm (6.3), nên *tummy* chỉ dùng cho bụng.

## 6. Dụng cụ, đồ chữa, ca, câu nói

### 6.1 Dụng cụ khám (bước `check`)
| Mã | Emoji | Tên | Câu nhầm (*"Hmm, … "*) | Hoạt ảnh khám |
|---|---|---|---|---|
| `stethoscope` | 🩺 | the stethoscope | that's the stethoscope | Đặt lên bụng, tiếng *thump thump* |
| `thermometer` | 🌡️ | the thermometer | that's the thermometer | Kẹp nách, vạch đỏ dâng lên (~1,5 giây) |
| `flashlight` | 🔦 | the flashlight | that's the flashlight | Chiếu vào tai / miệng |

### 6.2 Đồ chữa (bước `treat`)
| Mã | Emoji | Câu xin / đưa | Câu nhầm (*"Hmm, … "*) | Câu "không phải" (mức 2+) |
|---|---|---|---|---|
| `bandage` | 🩹 | a bandage | that's the bandage | not the bandage |
| `medicine` | 🥄 | some medicine | that's the medicine | not the medicine |
| `tissue` | 🧻 | a tissue | that's the tissue | not the tissue |
| `toothbrush` | 🪥 | a toothbrush | that's the toothbrush | not the toothbrush |
| `icepack` | 🧊 | an ice pack | that's the ice pack | not the ice pack |
| `drops` | 💧 | some eye drops | **those are** the eye drops | not the eye drops |
| `water` | 🍵 | some warm water | that's the warm water | not the warm water |
| `blanket` | 🛏️ | a blanket | that's the blanket | not the blanket |

- **Mọi cụm câu lưu sẵn trong dữ liệu từng đồ** (`ask`, `wrong`, `notThis`), không sinh từ mạo từ hay đoán theo chữ cái. Đồ bố mẹ thêm (sau này) cũng phải khai đủ 3 trường.

### 6.3 Ca và bước
Mỗi ca khai báo `steps`; mỗi bước có `type`, đích (`target` vùng chạm hoặc `item` đồ) và **`from` = mức thấp nhất có bước này** (mặc định 1). Ở một mức, ca chỉ gồm các bước có `from ≤ mức`. **Mức 1 không bao giờ có bước `check`** (mọi bước `check` có `from: 2`).

| Mã | Có từ mức | Triệu chứng (bạn thú) | Dấu hiệu vẽ | Bước ở mức 1 | Bước ở mức 2–3 |
|---|---|---|---|---|---|
| `cut-hand` | 1 | *"Ouch! My hand hurts!"* | vệt hồng trên tay | touch hand → treat 🩹 | như mức 1 |
| `cut-foot` | 1 | *"Ouch! My foot hurts!"* | vệt hồng trên chân | touch foot → treat 🩹 | như mức 1 |
| `tummy` | 1 | *"My tummy hurts!"* | vệt xoắn hồng trên bụng | touch tummy → treat 🥄 | touch tummy → check 🩺 → treat 🥄 |
| `runny-nose` | 1 | *"Achoo! My nose!"* | giọt nước mũi xanh nhạt | touch nose → treat 🧻 | như mức 1 |
| `tooth` | 1 | *"My tooth hurts!"* | má phồng | touch mouth → treat 🪥 | touch mouth → check 🔦 → treat 🪥 |
| `ear-bug` | 2 | *"My ear feels funny!"* | — | (không có) | touch ear → check 🔦 → **khỏi luôn** (bọ rùa bay ra) |
| `eye` | 2 | *"Something in my eye!"* | mắt nheo một bên | (không có) | touch eye → treat 💧 |
| `bump` | 2 | *"Ouch! I bumped my head!"* | cục u tròn hồng | (không có) | touch head → treat 🧊 |
| `sleepy` | 2 | *"I'm so sleepy…"* (ngáp) | mắt lờ đờ | (không có) | treat 🛏️ (không chạm, không khám) |
| `fever` | 3 | *"I feel hot. My head hurts."* | má đỏ, giọt mồ hôi | (không có) | touch head → check 🌡️ → treat 🧊 |
| `cough` | 3 | *"Cough! Cough!"* | chữ *cough* bay ra | (không có) | check 🩺 → treat 🍵 (không chạm) |

- **Hết bước là khỏe lại**, kể cả khi bước cuối là `check` (`ear-bug`). Không có loại bước "khỏi" riêng.
- Ví dụ dữ liệu (`app/js/doctor.js`, minh họa):
  ```js
  { id: 'tooth', level: 1, face: 'cheek', steps: [
      { type: 'touch', target: 'mouth' },
      { type: 'check', item: 'flashlight', from: 2 },
      { type: 'treat', item: 'toothbrush' } ] }
  { id: 'ear-bug', level: 2, steps: [
      { type: 'touch', target: 'ear' },
      { type: 'check', item: 'flashlight', effect: 'bug' } ] }
  { id: 'sleepy', level: 2, face: 'sleep', steps: [{ type: 'treat', item: 'blanket' }] }
  ```
- Kiểm tra dữ liệu lúc chạy test: mỗi ca có ≥ 1 bước ở mọi mức mà ca xuất hiện; `target` là vùng có thật; `item` đúng loại với `type`; bước `check` luôn có `from ≥ 2`.

### 6.4 Câu nói theo người nói
| Người nói | Lúc | Câu |
|---|---|---|
| **Bông** | bạn thú vào | *"Hello! Come in!"* |
| **Bạn thú** | vào | *"Hello, doctor!"* + triệu chứng (6.3) |
| **Bông** | bước `touch` | *"Where does it hurt? Touch it!"* |
| **Bạn thú** | chạm đúng | *"Yes! My [vùng]."* (*my tooth* cho ca răng) |
| **Bạn thú** | chạm nhầm | *"That's my [vùng chạm]! My [vùng đau] hurts!"* (ca răng: *"My tooth hurts!"*) |
| **Bông** | bước `check` | *"Let's check! Use the [dụng cụ]."* |
| **Bông** | khám 🩺 | *"Listen! Thump, thump."* (ca ho: *"Breathe in… breathe out."*) |
| **Bông** | khám 🌡️ | *"You feel warm!"* |
| **Bông** | khám 🔦 ca răng | *"Open wide! Say aah!"* → chờ ~2 giây |
| **Bông** | khám 🔦 ca tai | *"Let me look… A little bug! Bye-bye, bug!"* |
| **Bạn thú** | bước `treat` mức 1 | *"[ask], please!"* (*"A bandage, please!"*) |
| **Bông** | bước `treat` mức 2+ | *"How can we help?"* |
| **Bạn thú** | nhầm đồ | theo 4.3 + 6.1 / 6.2 |
| **Bông** / **bạn thú** | chữa đúng | 🩹 *"A bandage! Thank you!"* · 🥄 Bông: *"Here's your medicine."* · 🧻 *"Blow!"* → *honk* · 🪥 *"Brush, brush!"* · 💧 *"Blink, blink!"* · 🧊 *"Nice and cool!"* · 🍵 *"Mmm, warm water."* · 🛏️ Bông: *"Time to rest."* (zZz 2 giây) |
| **Bạn thú** | khỏe lại | *"I feel better! Thank you, doctor!"* (ca `sleepy`: *"I feel great! Thank you, doctor!"*) |
| **Bông** | khỏe lại | *"Great job, doctor!"* |
| **Bạn thú** | ra về | *"Bye-bye!"* |
| **Bông** | xong 3 ca | *"All better! You're a great doctor!"* |

## 7. Mức, khay, chọn ca

| Mức | Ca | Khay `check` | Khay `treat` | Đồ chữa có tên? | Chỗ đau nhấp nháy sẵn? |
|---|---|---|---|---|---|
| **1** (mặc định) | 5 ca mức 1 | — | 2 món | có | có |
| **2** | + 4 ca mức 2 (9) | 3 món | 3 món | không | không |
| **3** | + 2 ca mức 3 (11) | 3 món | 4 món | không | không |

### 7.1 Khay của một bước
- Bước có đúng **một `item` đúng**. Đồ gây nhiễu chọn ngẫu nhiên, không trùng, từ **cùng loại** (dụng cụ khám cho `check`, đồ chữa cho `treat`) **trừ `item` đúng**. Rồi xáo vị trí.
- Khay chỉ có một đáp án vì luật chỉ nhận đúng `item` của bước, không có "đồ cũng đúng". Đồ đúng cho ca khác (🩹 khi ca này cần 🧊) vẫn là đồ gây nhiễu hợp lệ.
- Số món = `min(số món theo mức, số đồ cùng loại)`. Có 3 dụng cụ khám và 8 đồ chữa nên luôn đủ; test vẫn kiểm (DOC-10).

### 7.2 Chọn 3 ca của một lượt
Theo thứ tự ưu tiên, **không bao giờ lặp vô hạn**:
1. **Bắt buộc:** 3 ca **khác nhau** trong nhóm của mức (mức 1 có 5 ca nên luôn đủ).
2. Tối đa **2 ca bé ít gặp nhất** (theo `seen`, bằng nhau thì ngẫu nhiên); ca còn lại ngẫu nhiên.
3. **Nên có:** không có hai ca cùng đồ chữa cuối (hai ca 🩹 liền nhau thì chán). Cách làm: thử tối đa 20 bộ ngẫu nhiên theo (1)–(2); không bộ nào đạt (3) thì dùng bộ cuối cùng.
4. Thứ tự 3 ca xáo trộn; 3 bạn thú khác nhau, ngẫu nhiên.

### 7.3 Lên mức, cài đặt, tiến độ
- **Cài đặt** `doctorGame = { level, rounds, lock, seen }`, quy tắc như `soundsGame`:
  - `rounds`: số lượt đã xong ở mức hiện tại; đủ **3 lượt** thì lên một mức, mức 3 không lên thêm;
  - `lock`: bố mẹ khóa mức (*Cài đặt → Mức chơi Bác sĩ nhí*), khóa thì không đếm lượt;
  - `seen`: `{ [mã ca]: số lần ca đó **khỏi** }`, ghi lúc khỏe lại;
  - dữ liệu hỏng → mức 1, 0 lượt, không khóa, `seen` rỗng.
- **Hai loại tiến độ lưu riêng, mỗi cái ghi đúng một lần:**

  | Tiến độ | Ghi lúc | Ở đâu | Rời game giữa ca |
  |---|---|---|---|
  | Từ bài Body "đã gặp" | chạm **đúng** ở bước `touch` (vùng có từ trong bài) | tiến độ từ vựng (`practiceCount` +1) | đã ghi thì giữ |
  | `seen` của ca | ca **khỏe lại** | `doctorGame.seen` | chưa khỏi thì không ghi |
  | `rounds` + sticker | xong ca 3 | `doctorGame`, sticker | chưa xong thì không ghi |
- **Đổi mức trong lúc chơi:** 3 ca và các bước của lượt đang chơi **không đổi**; mức mới áp dụng từ lượt sau.

## 8. Trạng thái game
```
enter ─► step[0] ─► step[1] … ─► healed ─► leave ─┬─► enter (ca sau)
          ▲  │                                    └─► done (sau ca 3)
          └ busy (đang xử lý thao tác)
```
`step` là trạng thái của bước hiện tại: `touch`, `check` hoặc `treat`.

| Trạng thái | Chạm bạn thú | Chạm / kéo đồ trong khay | Chạm Bông | Nhắc 10 giây |
|---|---|---|---|---|
| `touch` | nhận diện vùng → đúng / nhầm | khay ẩn | nói lại câu bước | ✅ |
| `check` / `treat` | nói lại triệu chứng (không tính nhầm, không đổi bước) | đúng / nhầm | nói lại câu bước | ✅ |
| `busy` | không nhận | không nhận, món kéo dở về khay | không nhận | ❌ |
| `enter` / `healed` / `leave` / `done` | không nhận | không nhận | không nhận | ❌ |

### 8.1 Chống việc cũ chạy sang việc mới
- Mỗi lượt có **mã lượt**; mỗi bước có **mã bước** (`lượt:ca:bước`). **Mọi** việc chạy sau gắn mã: hết câu nói, hẹn giờ, hết hoạt ảnh, thả ngón tay, nhắc 10 giây, ghi tiến độ.
- Khi việc chạy xong mà mã đã đổi (🧹, rời game, ra nền rồi quay lại, sang bước khác): **bỏ qua**, không đổi bước, không nói, không ghi.
- **Nhận một thao tác đúng = chuyển bước ngay** (trong cùng lúc nhận, trước khi hoạt ảnh chạy): ghi tiến độ, đánh dấu bước xong. Hoạt ảnh và câu nói chỉ để trình diễn. Vì vậy ra nền hay 🧹 giữa hoạt ảnh không làm mất hay lặp kết quả.
- Ghi tiến độ có khóa theo mã bước (Body) / mã ca (`seen`) / mã lượt (`rounds`, sticker): ghi lần hai cùng mã thì bỏ qua.

## 9. Ca biên
- **App ra nền rồi quay lại** (≤ 10 phút, cùng mức):
  - hủy câu nói, hiệu ứng, lượt kéo dở (món về khay), hoạt ảnh đang chạy;
  - chơi tiếp **đúng ca và đúng bước** (bước đã nhận thao tác đúng thì là bước sau), giữ số lần nhầm / nhắc của bước;
  - người nói câu của bước đó nói lại (bước `touch`: bạn thú nói triệu chứng rồi Bông hỏi);
  - ra nền lúc khỏe lại / ra về: quay lại là ca sau. Sau ca 3: hoan hô + sticker luôn (chỉ một lần).
- **Rời game** (🏠 / 🎲): hủy hết, lượt dở không lưu (tiến độ Body đã ghi thì giữ).
- **🧹:** đổi mã lượt, khám lại từ ca 1 với **cùng 3 ca** và cùng bạn thú (bé hay muốn chơi lại ca vừa thích). Chơi lại **không** ghi lại `seen` / "đã gặp" của ca đã ghi trong lượt (từ 0.29.0, theo `SPEC-jobs.md` 2.2); `rounds` chỉ tăng khi xong ca 3.
- **Nhiều ngón:** chỉ nhận ngón đầu tiên. Đang kéo đồ bằng ngón 1 mà ngón 2 chạm bạn thú: **bỏ qua ngón 2** (không nói triệu chứng, không tính nhầm).
- **Giảm chuyển động:** đồ hiện thẳng ở chỗ đau, bạn thú không nhún, ra vào bằng mờ dần. **Vẫn giữ** viền sáng chỗ chạm đúng, đổi mặt buồn → vui, dấu hiệu bệnh biến mất, để bé biết bước đã xong.

## 10. Ảnh (làm ở 0.28.1, trước D2)
- **Không bao giờ phải có ảnh mới chơi được:** mặc định là bạn thú vẽ SVG + emoji + nền vẽ sẵn, chạy offline.
- **Ảnh đồ** (8 đồ chữa + 3 dụng cụ khám, `images`: `lessonId = 'doctor:items'`, `word = mã đồ`) ở *Góc bố mẹ → 🩺 Ảnh Bác sĩ nhí*:
  - từng đồ: **Chọn / Thay ảnh** (app bỏ nền trắng), **Dùng emoji** (xóa ảnh);
  - **dùng lại ảnh có sẵn** trùng một trong các tên `reuse` của đồ (*medicine ← spoon*, *warm water ← water, cup*, *flashlight ← torch*…):
    - ảnh đồ vật của các trò khác trước — sticker Dán tranh, Cho Bông ăn, Trốn tìm, Tìm đồ còn thiếu, Ai kêu thế? (đã bỏ nền, chép nguyên ảnh);
    - rồi ảnh bài học (mới nhất trước, bỏ nền trắng khi chép);
    - nút chung *"Dùng lại ảnh đã có (n đồ)"* cho các đồ chưa có ảnh (lấy ảnh đầu tiên); từng đồ có *"Ảnh có sẵn (n)…"* để chọn ảnh khác;
    - dùng lại = **sao chép**: sửa / xóa ảnh gốc không ảnh hưởng trò này, và ngược lại;
  - **ảnh lưới** 3 × 3 cho các đồ chưa có ảnh (prompt có mô tả `draw` từng đồ, nền trắng, không kim tiêm / viên thuốc), xem trước rồi lưu.
- **Ảnh nền phòng khám** (`lessonId = 'doctor:bg'`, `word = 'room'`, tùy chọn): có prompt (giường khám ở giữa phía dưới, chừa trống giữa khung). Có ảnh nền thì ẩn giường vẽ sẵn; khay luôn có nền trắng riêng.
- Ảnh hiện ở khay, khi kéo, khi bay tới bạn thú; băng dán dán lên người cũng dùng ảnh. Ảnh hỏng → emoji.
- **Ảnh bạn thú không thay được:** vùng chạm (mắt, tai, tay…) gắn với hình vẽ sẵn; ảnh khác lệch vị trí thì bé chạm tai lại tính là đầu.
- Ảnh `doctor:` không bị dùng làm ảnh từ vựng (bộ lọc ảnh trò chơi trong `db.js`, `parent/feed.js`). Có trong bản sao lưu đầy đủ; **chia sẻ** qua khối chung (file / Drive / link), nhập ở trang này hoặc ở Quản lý bài; ảnh mới hơn thắng.

## 11. Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **D1** | Khung thân bạn thú + 4 đầu (SVG), vùng chạm, Bông y tá; dữ liệu ca theo `steps`; mức 1 (5 ca, `touch` + `treat`), kéo / chạm đồ, nhầm, gợi ý, nhắc, khóa thao tác, mã lượt / bước, lượt 3 ca + sticker, ra nền, tiến độ Body | Bé 3 tuổi chơi hết một lượt không cần người lớn; chạm nhanh không tính trùng. **Thử với bé trước khi làm D2** |
| **D2** ✅ (0.41.0) | Mức 2–3 (bước `check`, 6 ca thêm, khay 3–4 món), giọng bạn thú khác cao độ, tự lên mức, khóa mức, chọn ca ít gặp | Mọi câu sinh ra đúng ngữ pháp (unit) |
| **D3** | ✅ đã làm ở 0.28.1 (mục 10): ảnh đồ thay được / dùng lại ảnh có sẵn, ảnh nền, chia sẻ / sao lưu | Như các trò có ảnh trước |

## 12. Kiểm thử
**Unit**
- Dữ liệu: kiểm tra ở 6.3 cho mọi ca × mức; mỗi đồ có đủ `ask` / `wrong` / `notThis`.
- Bước theo mức: `tummy`, `tooth` mức 1 không có `check`, mức 2 có (DOC-01, DOC-02); `ear-bug` kết thúc bằng `check` (DOC-03); `sleepy`, `cough` không có `touch` (DOC-04).
- Câu: mọi cặp ca × vùng chạm nhầm, mọi đồ × ca (câu nhầm có tên / không tên); *eye drops* dùng *"those are"* (DOC-09).
- Khay: đúng số món theo mức, không trùng, đúng loại, có đúng một `item` đúng; kể cả khi số món yêu cầu lớn hơn số đồ cùng loại (DOC-10).
- Chọn lượt: 3 ca khác nhau, đúng nhóm mức, tối đa 2 ca ít gặp; dữ liệu giả không thể tránh trùng đồ chữa vẫn trả về 3 ca, không treo (DOC-11).
- Vùng chạm: điểm trong mũi / mắt / miệng không trả về `head`; tay đè bụng trả về `hand`; hai bên tai đều là `ear`.
- Lên mức / khóa mức như `soundsGame`; `seen` hỏng → rỗng.

**UI (chế độ nhanh)**
| Mã | Ca | Mong đợi |
|---|---|---|
| — | Mức 1: chạm nhầm → chạm đúng → khay hiện → kéo nhầm → kéo đúng → ca 2 | câu nhầm chỗ, đồ đúng nhún sau nhầm 1, khỏe lại |
| DOC-01 / 02 | mức 1 `tummy` / `tooth` | đi thẳng từ chạm sang chữa |
| DOC-03 | mức 2 `ear-bug` | khỏi sau bước 🔦, không có khay chữa |
| DOC-04 | mức 2 `sleepy` | không có bước chạm; 🛏️ → khỏe |
| DOC-05 | mức 2, bước `check`, đưa 🩺 khi cần 🔦 | câu nhầm có tên, 🩺 về khay, 🔦 nhún, bước không đổi |
| DOC-06 | chạm bạn thú ở bước `check` / `treat` | nói lại triệu chứng; nhầm thêm 1 đồ vẫn ra câu "lần 1" (mức 2+) |
| DOC-07 | 🧹 lúc đang nói câu khỏe lại | không nhảy ca / không ghi `rounds` của lượt mới |
| DOC-08 | ra nền ngay sau khi đưa đồ đúng, quay lại | ở bước sau; Body / `seen` ghi đúng một lần |
| DOC-12 | xong ca 3, chạm liên tục / ra nền lúc hoan hô | sticker và `rounds` +1 đúng một lần |
| DOC-13 | đổi mức trong Cài đặt giữa lượt | 3 ca và bước không đổi; lượt sau theo mức mới |
| DOC-14 | giảm chuyển động | không có chuyển động bị tắt; vẫn thấy viền sáng, mặt vui; chơi hết lượt |
| DOC-15 | kéo đồ bằng ngón 1, ngón 2 chạm bạn thú | ngón 2 bị bỏ qua |
| — | giọng đọc lỗi | phụ đề vẫn hiện, chơi hết lượt được |
| — | 3 ca → sticker; ca `cut-hand` ghi "đã gặp" cho *hands* | |

**Thử tay trên iPad / điện thoại**
- Vùng tai, mắt, mũi đủ to cho ngón tay bé; không chạm nhầm sang vùng bên cạnh.
- Hoạt ảnh chữa không quá 2 giây (bé mất kiên nhẫn).
- Bé có sợ ca nào không (vết đau, cục u): nếu có thì vẽ nhẹ hơn.

## 13. Sau này: nhóm "đóng vai nghề"
- Khi có trò nghề thứ hai: thay thẻ Bác sĩ nhí bằng thẻ **🧑‍⚕️ Jobs / Đóng vai**, mở ra trang **"What do you want to be today?"** chọn nghề. Bé "mặc đồng phục" (dùng lại Thay đồ: áo blouse, mũ cảnh sát, kính cô giáo) trước khi vào trò.
- Dùng chung khung của spec này: **ca** (một người cần giúp) → **danh sách bước** (chạm / đưa đồ) → **cảm ơn** → lượt 3 ca → sticker; cùng luật nhầm / gợi ý, khóa thao tác, mã lượt / bước, mức, ra nền.
- Nghề dự kiến (mỗi nghề một spec riêng):
  - **👮 Cảnh sát giúp bạn:** tìm bạn bị lạc theo màu / cỡ (*"It's small and brown"*, dùng lại Trốn tìm), đèn giao thông cho xe bài Vehicles. Không có bắt người xấu.
  - **👩‍🏫 Cô giáo nhí:** đảo vai, Bông làm học trò cố tình nói sai, bé chấm ✅ / ❌ và dán sao.
  - **🧑‍🍳 Bán hàng / đầu bếp** (bài Food), **🚒 cứu hỏa** (đếm số), **📮 bưu tá** (màu, số nhà).
- **Bác sĩ thú y**: cùng khung, bệnh nhân là sticker con vật, cần vẽ vùng chạm riêng cho từng con nên để sau.

## 14. Đã chốt (draft2)
1. **Bệnh nhân là 4 bạn thú, Bông làm y tá.**
2. **Giữ si-rô 🥄** như đồ chơi đóng vai (nguyên tắc ở mục 1). Muốn bỏ thì đổi ca `tummy` sang 🍵 + *"Drink some warm water and rest."*: chỉ sửa dữ liệu ca, không đổi luật.
3. **Giữ ca `sleepy`**, gọi là giúp bạn nghỉ ngơi, không gọi là bệnh.

## 15. Ghi chú khi code D1 (0.28.0)
- **File:** `app/js/doctor.js` (dữ liệu ca / đồ / vùng chạm, luật khay, chọn ca, câu nói, mức — chạy được trong node), `app/js/patients.js` (SVG bạn thú, mặt, dấu hiệu), `app/js/screens/doctor.js` (màn chơi). Thẻ 🩺 *Doctor / Bác sĩ nhí* ở Góc trò chơi, màn `doctor`.
- **Dữ liệu đủ 11 ca** (cả mức 2–3, có unit test), nhưng `PLAYABLE_LEVEL = 1`: chưa lên mức, `doctorGame.level` / `lock` > 1 bị đưa về 1. D2 chỉ cần tăng hằng số này + làm hoạt ảnh bước khám, dấu hiệu / đồ chữa của ca mức 2–3, mục Cài đặt *Mức chơi Bác sĩ nhí*, giọng bạn thú khác cao độ (`Speaker.speak` chưa có `pitch`).
- **Vùng chạm** là các hình tròn trong viewBox 240 × 300 (`SPOTS`): tầng 1 (mắt, mũi, miệng, tai, tay, chân) thắng bụng, bụng thắng đầu; cùng tầng thì tâm gần nhất thắng. Trên iPad (1180 × 820) mắt / mũi rộng ~55–65 px CSS. SVG co vừa khung (`meet`), tọa độ đổi bằng `getScreenCTM()`.
- **Điểm chạm vô hình** `.dr-spot[data-region]` ở tâm mỗi vùng: test UI chạm vào đó; trên máy thật không cần.
- **Ghi một lần:** nhận thao tác đúng thì `stepIdx` tăng ngay và lưu snapshot (ca khỏi: ghi `seen`, snapshot trỏ ca sau); mọi việc chạy sau kiểm `epoch` (🧹 / rời màn / chơi tiếp đổi mã).
- **Tiếng hiệu ứng mới** (`sfx.js`): `doorbell`, `honk`, `brush`.
- **Test:** `tests/unit/doctor.test.js` (DOC-01…04, 09…11 và dữ liệu), `tests/ui/doctor.spec.js` (luồng mức 1, DOC-06…08, 12, 15, giọng đọc lỗi). DOC-05, 13, 14 thuộc D2 (bước khám, đổi mức) / thử tay.

## 16. Ghi chú khi code D2 (0.41.0)
- `PLAYABLE_LEVEL = 3`: tự lên mức sau 3 lượt; **Cài đặt → Đóng vai nghề → Mức chơi Bác sĩ nhí** khóa mức 1 / 2 / 3.
- **Giọng bạn thú:** `Speaker.speak(text, { pitch })` (Web Speech `pitch`), khung nghề nhận `pitch(who)`; Teddy 0,75 · Piggy 0,9 · Puppy 1,25 · Kitty 1,45; Bông y tá giọng thường. Máy không hỗ trợ `pitch` thì đọc giọng thường.
- **Hoạt ảnh mức 2–3:** nhiệt kế kẹp tay có vạch đỏ dâng lên; nhỏ mắt (giọt nhún), túi đá / nhiệt kế lắc, nước ấm (uống), chăn → mặt ngủ + 💤 2 giây; ca tai: soi đèn → bọ rùa 🐞 bay ra (1,2 giây).
- **Test:** unit mức + cao độ; UI mức 2 (bước khám, "How can we help?", không xin đồ có tên, giọng bạn thú khác Bông, ca tai có bọ), mức 3 (sốt + ho), Cài đặt khóa mức.
