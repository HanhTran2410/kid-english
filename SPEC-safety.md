# SPEC — 🦸 Siêu nhân an toàn: "Bông ơi, dừng lại!" (Safety Hero)

> Phiên bản spec: **draft5** (theo review cho bé 3+, mục 14) · Ngày: 2026-11-19 · Dựa trên app 0.83.0. **Đã làm S1 (0.84.0) và S2 (0.85.0)**, ghi chú mục 15.
> - **S2 (0.85.0), bố mẹ thêm:** thay được ảnh từng hình trong cảnh (Bông, mẹ, bố, đồ vật) và ảnh nền từng cảnh — mục 9.1.
> - **draft5:**
>   - **Review lại cho bé 3 tuổi (3+)**, không phải 6 tuổi (mục 14):
>     - câu ngắn hẳn: câu hỏi 3–7 từ, câu giải thích 2–7 từ, câu nhắc lại 1–4 từ;
>     - nút ✋ **No!** / 👍 **Yes!** thay Stop / OK;
>     - Bông đọc thêm **câu tiếng Việt bằng giọng** (bé chưa đọc phụ đề);
>     - ưu tiên chạm hơn kéo;
>     - bé không tự nhặt viên bi, không tự cài dây an toàn / quai mũ, đi cầu thang thì nắm tay mẹ;
>     - thuốc không gọi là kẹo;
>     - mức 3 chỉ mở khi bố mẹ tự bật, không tự lên.
>   - **Bố mẹ thêm (2026-11-19):**
>     - chủ đề **🚨 Khi có cháy** (cúi thấp, che miệng, không trốn, đi ra cùng mẹ, không quay vào), làm ở S1;
>     - **đồ rơi xuống ao / hồ thì gọi bố mẹ, không tự lấy** (`pond-toy`, chủ đề 💧, S2).
> - draft4: chủ đề **🌙 Thói quen tốt** (TV / YouTube, đi ngủ) + **Chủ đề ưu tiên** (mặc định 🌙).
> - draft3: sửa theo review đầu (an toàn nội dung, bốc tình huống, dữ liệu, kỹ thuật, test SAFE-16…25).
> - draft2: bố mẹ trả lời câu hỏi (mục 12). draft1: ý tưởng, 3 mức, tình huống, thưởng, Góc bố mẹ.
>
> Mục mới trong **Trò chơi**. Dạy bé việc **nên làm** và **không nên làm** trong cuộc sống.
> **Mục tiêu cho bé 3 tuổi:** không dạy bé tự xử lý nguy hiểm, mà dạy bé **nhận ra lúc cần dừng lại và tìm bố mẹ**: dừng lại, không chạm, lùi ra, nắm tay bố mẹ, gọi bố mẹ.
> **Nguyên tắc số một:** sau khi chơi, bé không được nhớ một quy tắc an toàn sai. Câu nào ngắn mà làm quy tắc sai thì chọn câu dài hơn một chút.

## 1. Ý tưởng — vì sao không gò ép

- **Bé là người giúp, không phải người bị dạy.** Người định làm việc nguy hiểm là **Bông** (hơi nghịch, khoác áo choàng siêu nhân). Bông hỏi *"Can I touch it?"*, bé là **Safety Hero** trả lời ✋ **No!** hoặc 👍 **Yes!**. Bé được làm người lớn, không bị mắng.
- **Không chỉ có "không".** Mỗi lượt có cả việc **nên làm** (đội mũ, nắm tay bố, rửa tay, tắt TV khi chuông kêu). Câu "No!" luôn kèm việc nên làm thay (*"No! Sharp! Call Mommy."*).
- **Chu trình 5 bước (review 3+):**
  1. **Nhìn** tình huống.
  2. **Nghe** câu tiếng Anh ngắn, rồi câu tiếng Việt.
  3. **Chạm chọn**.
  4. **Làm cùng Bông**: gọi mẹ, nắm tay, lùi ra, đội mũ.
  5. **Nghe nhắc lại** câu ngắn nhất (*"Stay back!"*, *"Hold hands!"*).
- **Hiểu trước, học tiếng Anh sau.** Bé phải hiểu quy tắc qua hình, giọng tiếng Việt và thao tác, kể cả khi chưa hiểu hết câu tiếng Anh. Không cần biết đọc, không cần nói.
- **Vui, không sợ.**
  - Không có cảnh bị thương, máu, khóc vì đau, tai nạn, nhà cháy có lửa (cảnh cháy chỉ có chuông + khói xám nhạt).
  - Sai thì Bông **đứng sững** ("Hmm… wait!") rồi hỏi lại; Bông **không bao giờ làm việc nguy hiểm** trên màn hình.
  - Người lạ vẽ bình thường, mỉm cười. Bài học là *"hỏi bố mẹ trước"*, không phải *"người lạ là xấu"*.
- **Ngắn.** Mỗi lượt tối đa 5 tình huống; thoát lúc nào cũng được, không phạt; ra nền quay lại thì chơi tiếp đúng chỗ.

## 2. Luật chung

- Vào từ **Trò chơi → 🦸 Safety Hero / Siêu nhân an toàn** (thẻ `.game-safety`, sau thẻ Đóng vai).
- **Mức** (dùng `jobs/levels.js`, cài đặt `safetyGame`):
  - mức 1 là trải nghiệm chính;
  - chơi đủ 3 lượt thì tự lên mức 2, bố mẹ khóa được mức 1;
  - **mức 3 không tự lên**, chỉ khi bố mẹ chọn (S2).
- Mỗi lượt **không lặp tình huống**. Lượt chuẩn 5 tình huống: **3 🚫 + 2 ✅**.
- **Câu nói** (review 3+):
  - Câu hỏi của Bông **3–7 từ**. Câu giải thích **2–7 từ**: *[No / Yes] + lý do 1–2 từ + việc nên làm*. Câu nhắc lại sau thao tác **1–4 từ**.
  - Từ khóa lặp lại: *sharp, hot, stop, stay back, stay here, hold hands, call Mommy, no thank you, helmet on, get low, go out, bedtime*.
  - Người lớn trong câu là *Mommy* / *Daddy* (không *a grown-up*). Người lạ: *that person* / *them*, không *he / she*.
  - **Giọng tiếng Việt** (Cài đặt, mặc định **bật**): sau câu tiếng Anh, Bông đọc câu tiếng Việt của câu hỏi, câu giải thích, câu gợi ý khi nhầm, việc cần làm. Câu nhắc lại ngắn chỉ tiếng Anh. Máy không có giọng Việt thì chỉ có phụ đề.
- **Tính nhầm** (chi tiết mục 7):
  - không có âm "sai"; Bông đứng sững, gợi ý rồi hỏi lại;
  - nhầm lần hai thì Bông nói đáp án (*"Tap No!"*), nút đúng nhún;
  - chạm nhầm liên tiếp trong 0,4 giây tính là một lần.
- **Không hẹn giờ ép bé.** Bông đi chậm về phía đồ vật trong lúc hỏi. Bé chưa chạm thì Bông **tự dừng trước đồ vật**, hỏi *"Should I?"*. Không làm gì 10 giây thì Bông hỏi lại, tối đa 2 lần.

### 2.1 Bốc tình huống cho một lượt
Nguồn bốc là mọi tình huống thuộc chủ đề **đang bật** và **có trong bản đã làm**. Gọi số tình huống đó là *N*. Luật đứng trước thắng luật đứng sau:
1. **Không bốc** chủ đề đã tắt.
2. **Không lặp**; độ dài lượt = min(5, *N*). *N* < 3 thì không vào lượt: Bông + *"Bố mẹ bật thêm chủ đề trong Cài đặt nhé"*.
3. **Tỉ lệ:** lượt 5 nhắm 3 🚫 + 2 ✅, lượt 3–4 nhắm ✅ = ⌊độ dài / 2⌋. Thiếu loại nào thì bù loại kia. Có ✅ thì ít nhất 1 ✅.
4. **Chủ đề ưu tiên** (`focus`, mặc định 🌙): nếu đang bật, lượt có **1 🚫 + 1 ✅ của chủ đề đó** (chủ đề chỉ có một loại thì 2 tình huống loại đó); tỉ lệ cả lượt vẫn giữ.
5. **Ít gặp trước** (`seen`); bằng nhau thì chủ đề chưa có trong lượt trước, rồi ngẫu nhiên.
6. **Xếp thứ tự** ít cặp liền nhau cùng chủ đề nhất (lượt ≤ 5 nên thử hết các cách xếp).

Ví dụ: chỉ bật 🚦 (2 🚫 + 3 ✅) → lượt 5 = 2 🚫 + 3 ✅; tắt hết → không vào lượt; bật cả 6 chủ đề S1 (28 tình huống) → lượt 5 đủ mọi luật.

## 3. Cách chơi theo mức

### 3.1 Mức 1 — "No or Yes?" (một chạm) — trải nghiệm chính
1. Cảnh theo chủ đề (bếp, phòng khách, phòng ngủ, đường, cửa nhà, công viên, nhà có khói). Bông bên trái, đồ vật bên phải; bố / mẹ thường đứng gần.
2. Âm mở đầu nếu có (chuông cửa, chuông báo cháy). Bông vừa đi chậm tới đồ vật vừa hỏi (*"A knife! Can I touch it?"* rồi câu tiếng Việt).
3. Hai nút to dưới màn, **hình + chữ** (không chỉ khác màu), ≥ 88 px: ✋ **No!** (đỏ) / 👍 **Yes!** (xanh).
4. Chạm đúng:
   - 🚫: Bông **phanh két** ngay chỗ đang đứng, *"Oops!"*, câu giải thích;
   - ✅: Bông nhảy vui, câu giải thích.
5. **Thao tác sửa** (mục 5) → ⭐ lên áo choàng → tình huống sau.

Chạm nhầm:
- 🚫 mà chạm 👍: Bông **đứng sững** ngay chỗ đang đứng (không đi tiếp, không chạm đồ), đồ vật lóe sáng, câu gợi ý (*"Hmm… wait! It's sharp!"*). Hai nút vẫn chọn được.
- ✅ mà chạm ✋: *"It's OK! A helmet keeps me safe."*. Hai nút vẫn chọn được.

### 3.2 Mức 2 — "Which one is safe?" (chọn một trong hai tranh)
- Bông hỏi câu của tình huống, rồi hai tranh to bằng nhau (màn ngang: cạnh nhau, mỗi tranh ≥ 40% bề ngang; màn dọc: trên dưới): *"Which one is safe?"*.
- **Tranh chưa an toàn:** Bông **một mình** đứng sát đồ vật, lúc **định làm** (không vẽ lúc đang làm hay hậu quả), **không có bố mẹ**. Việc nên làm: lúc chưa làm (chưa đội mũ, TV còn bật).
- **Tranh an toàn:** cảnh sau thao tác sửa (mẹ cất dao lên kệ, Bông nắm tay mẹ, mũ trên đầu…).
- Hai tranh khác nhau ở **hành động / có bố mẹ hay không**, nhìn là thấy; không khác chỉ ở màu hay chi tiết nhỏ.
- Chạm tranh an toàn: viền xanh, câu giải thích, rồi thao tác sửa. Chạm tranh kia: rung nhẹ, mờ đi, câu gợi ý (*"Hmm… alone? Look again!"*). Không có hoạt ảnh nguy hiểm.
- Tranh an toàn trái / phải cân bằng trong lượt (lệch tối đa 1).

### 3.3 Mức 3 — "Story time" (S2, **chỉ khi bố mẹ chọn**)
- Không tự lên mức 3. Bố mẹ chọn "Mức 3" trong Cài đặt khi bé đã quen.
- Chuyện 2 bước, **mỗi bước chơi được độc lập** (bé không phải nhớ nhiều từ bước trước; bước 2 có hình nhắc lại bước 1). Bước 1 sai thì không sang bước 2.
  - Một lượt = **2 chuyện × 2 bước = 4 tình huống (4 ⭐)**. Hai chuyện khác chủ đề; chủ đề ưu tiên (đang bật) có chuyện thì chuyện đó trước; còn lại ít gặp trước.
  - Mỗi bước chơi như mức 2 (chọn tranh an toàn → thao tác sửa). Bước 1: Bông *"Story time!"*; bước 2: *"What next?"* + hình nhỏ (góc trái trên) cảnh an toàn của bước 1, ẩn lúc hiện hai tranh để không che tranh.
  - Chuyện (`STORIES`): 📺 hẹn giờ → đi ngủ; xem thêm phim → chơi khuya; dao → rửa tay; nồi → thuốc; cầu thang → cửa sổ; viên bi → ổ điện; mũ bảo hiểm → nắm tay bố; bóng ra đường → qua đường; chuông cửa → kể với mẹ; kẹo → đi theo; cúi thấp → ra ngoài; không trốn → không quay vào; trốn ở siêu thị → bị lạc; bể bơi một mình → bơi cùng bố; ao → đồ rơi xuống ao. (🐕 chưa có chuyện.)
  - Bật dưới 2 chuyện (bố mẹ tắt gần hết chủ đề): lượt thường, vẫn chơi kiểu chọn tranh.
- **"Say it!"** hoàn toàn tùy chọn: dùng luật lượt nói SPEC-jobs5 mục 5; không ảnh hưởng ⭐, tiến độ, huy hiệu; không bắt phát âm đúng.
  - Cài đặt riêng *"Lượt Say it! ở mức 3"* (`safetyTalk`, mặc định tắt). Chỉ khi mic đã sẵn sàng từ trước (trò không xin quyền mic), không ghi âm.
  - Sau câu nhắc lại: Bông *"Say it!"* + câu ngắn; nghe ≤ 4 giây (cứng 6 giây). Khớp từ khóa (các từ ≥ 3 chữ cái của câu ngắn) → *"Great talking!"* + ⭐ bay (chỉ hiệu ứng); có tiếng → *"Good!"* + câu mẫu; im lặng → câu mẫu; lỗi → bỏ qua.

## 4. Chủ đề và tình huống

S1 (0.84.0) có 6 chủ đề, **28 tình huống (18 🚫 + 10 ✅)**. Câu tiếng Việt ở `jobs/safety.js`. S2 thêm 🛒 💧 🐕 (mục 4.7).

### 🌙 Thói quen tốt (`habits`) — bố mẹ ưu tiên (draft4)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `tv-long` | 🚫 | *"One more cartoon?"* | *"No! TV off. Let's play!"* | chạm TV → TV tắt, quả bóng lăn ra |
| `video-bed` | 🚫 | *"Videos in bed?"* | *"No more videos. Time to sleep."* | chạm máy tính bảng → lên kệ; Bông ôm gấu ngủ |
| `stay-up` | 🚫 | *"Play some more?"* | *"No! It's bedtime. Good night!"* | chạm giường → Bông lên giường, phòng tối |
| `tv-timer` | ✅ | *"Ding! TV off now?"* | *"Yes! TV off. Good job!"* | chạm TV → TV tắt, chuông im, có sách |
| `bedtime` | ✅ | *"I'm sleepy. Bed now?"* | *"Yes! Time for bed. Good night!"* | chạm đèn ngủ → tối dần, Bông ôm gấu ngủ "z Z" |

Không chê bé, không dọa ("mắt hỏng", "bị ốm"); Bông tắt TV / đi ngủ vui vẻ để bé bắt chước. Bé tắt TV, cất máy tính bảng là việc bé làm được.

### 🍳 Trong bếp (`kitchen`)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `knife` | 🚫 | *"A knife! Can I touch it?"* | *"No! Sharp! Call Mommy."* | chạm mẹ → mẹ cất dao lên kệ cao |
| `stove` | 🚫 | *"Can I touch the pot?"* | *"No! It's hot! Stay back."* | kéo Bông lùi ra vạch vàng (vùng thả to) |
| `medicine` | 🚫 | *"A pill! Can I eat it?"* | *"No! Ask Mommy first."* | chạm mẹ → mẹ cất thuốc lên kệ cao |
| `wash-hands` | ✅ | *"Wash my hands first?"* | *"Yes! Wash hands, then eat."* | chạm vòi nước → bọt xà phòng |

`medicine`: hình là viên thuốc, lời nói là *"A pill!"* (không gọi là kẹo). Câu tiếng Việt thêm *"Thuốc chỉ uống khi bố mẹ cho."*

### 🏠 Trong nhà (`home`)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `socket` | 🚫 | *"Can I touch it?"* | *"No! Don't touch! Call Mommy."* | chạm mẹ → mẹ đậy nắp an toàn |
| `window` | 🚫 | *"Can I climb up?"* | *"No! Get down. Call Mommy."* | chạm mẹ → mẹ tới, Bông xuống nắm tay mẹ |
| `fan` | 🚫 | *"Can I touch the fan?"* | *"No! Fingers away! Stay back."* | kéo Bông lùi ra tấm thảm (quạt có lồng) |
| `lighter` | 🚫 | *"Can I play with it?"* | *"No! Don't touch! Call Daddy."* | chạm bố → bố cất bật lửa lên kệ cao |
| `small-toy` | 🚫 | *"Can I put it in my mouth?"* | *"No! Not in your mouth. Call Daddy."* | chạm bố → bố cất viên bi vào hộp |
| `stairs` | ✅ | *"Stairs! Hold Mommy's hand?"* | *"Yes! Hold Mommy's hand. Walk slowly."* | chạm tay mẹ → hai người đi từng bậc |

### 🚦 Trên đường (`road`)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `cross-alone` | 🚫 | *"Can I cross the road?"* | *"No! Hold Mommy's hand."* | chạm tay mẹ → nắm tay (🤝) |
| `ball-road` | 🚫 | *"My ball! Can I get it?"* | *"Stop! Stay here! Ask Daddy."* | chạm bố → bố nhặt bóng; Bông đứng yên trên vỉa hè |
| `helmet` | ✅ | *"Helmet on?"* | *"Yes! Helmet on!"* | kéo mũ lên đầu Bông → bố tới cài quai "click" |
| `seat-belt` | ✅ | *"Seat belt on?"* | *"Yes! Daddy clicks it."* | chạm bố → bố thắt dây "click" |
| `hold-hands` | ✅ | *"Hold Daddy's hand?"* | *"Yes! Hold hands outside."* | chạm tay bố → nắm tay |

**Người lớn quyết định lúc qua đường.** Đèn xanh không có nghĩa là bé tự qua; luôn nắm tay và người lớn nhìn xe. Không có cảnh Bông xuống đường, kể cả khi chạy theo bóng.

### 🚪 Người lạ (`stranger`)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `door` | 🚫 | *"Ding dong! Open the door?"* | *"No! Call Mommy first."* | chạm mẹ → mẹ ra cửa |
| `candy` | 🚫 | *"Candy! Can I take it?"* | *"No, thank you! Ask Mommy first."* | chạm mẹ → Bông về nắm tay mẹ |
| `go-with` | 🚫 | *"Can I go with them?"* | *"No! Stay with Mommy."* | chạm mẹ → Bông về nắm tay mẹ |
| `tell` | ✅ | *"I feel scared. Tell Mommy?"* | *"Yes! Tell Mommy. Mommy can help."* | chạm mẹ → mẹ ôm 🤗 |

Mẹ luôn đứng gần trong cảnh (bé thấy rõ Bông không rời mẹ). `tell` là kỹ năng chủ động tìm người giúp: có gì làm bé sợ thì kể với bố mẹ.

### 🚨 Khi có cháy (`fire`) — bố mẹ thêm (draft5)
| Mã | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|
| `fire-low` | ✅ | *"Beep beep! Smoke! Get low?"* | *"Yes! Get low. Cover your mouth."* | chạm Bông → Bông cúi thấp, tay che miệng |
| `fire-hide` | 🚫 | *"Smoke! Can I hide under the bed?"* | *"No! Don't hide. Go out with Mommy."* | chạm mẹ → hai người cúi thấp đi ra |
| `fire-out` | ✅ | *"Go out with Mommy?"* | *"Yes! Follow Mommy out."* | chạm tay mẹ → cúi thấp theo mẹ ra cửa (biển EXIT) |
| `fire-back` | 🚫 | *"My teddy! Can I go back in?"* | *"No! Stay outside with Mommy."* | chạm mẹ → Bông nắm tay mẹ ở ngoài |

- Không có lửa trên màn hình: chuông báo 🚨 + khói xám nhạt trên trần (khói bay lên cao, sát sàn thì sạch, nên "get low").
- *"Cover your mouth"* là lấy tay / khăn che miệng. Không nói "khăn ướt" ở bản cho 3 tuổi.
- "Chạy ra ngoài theo chỉ dẫn" = **theo mẹ / người lớn** ra cửa. Bé 3 tuổi không tự tìm lối thoát. Câu tiếng Việt của `fire-back`: *"Chú lính cứu hỏa sẽ lo."*
- Trùng ý với Lính cứu hỏa mức 1 ("an toàn với lửa", SPEC-fire2) là có chủ đích: ở đây Bông là người được cứu.

### 4.7 Chủ đề S2 (0.85.0) — câu đã rút ngắn theo review 3+
| Mã | Chủ đề | Loại | Bông hỏi | Câu giải thích | Thao tác sửa |
|---|---|---|---|---|---|
| `hide-shop` | 🛒 | 🚫 | *"Can I hide here?"* (sau kệ siêu thị) | *"No! Stay with Mommy."* | chạm mẹ → Bông nắm xe đẩy cạnh mẹ |
| `run-off` | 🛒 | 🚫 | *"Toys! Can I run there?"* | *"No! Wait for Mommy."* | chạm mẹ → hai người cùng đi |
| `lost` | 🛒 | ✅ | *"Where's Mommy? Stay here?"* | *"Yes! Stay here. Ask for help."* | chạm quầy thu ngân (gần Bông) → cô thu ngân ở lại quầy, mẹ tới đón |
| `pool-alone` | 💧 | 🚫 | *"Can I jump in?"* (bể bơi) | *"No! Hold Daddy's hand near water."* (bố ở cảnh) | chạm bố → bố đứng sát Bông, Bông ở ngoài mép bể |
| `pond` | 💧 | 🚫 | *"Fish! Can I go close?"* (ao / hồ) | *"No! Stay back. Hold Mommy's hand."* | chạm mẹ → nắm tay, lùi xa mép ao |
| `pond-toy` | 💧 | 🚫 | *"My toy! Can I get it?"* (8 từ thì quá dài; tiếng Việt nói rõ "rơi xuống nước") | *"No! Stay back. Call Daddy."* | chạm bố → bố lấy đồ chơi bằng cây sào; Bông đứng xa mép nước |
| `swim-with` | 💧 | ✅ | *"Swim with Daddy?"* | *"Yes! Stay with Daddy."* | chạm bố → bố xuống bể trước, sát cạnh; phao tay chỉ minh họa |
| `dog` | 🐕 | 🚫 | *"A doggy! Can I pet it?"* | *"Wait! Stay with Mommy."* | chạm mẹ → đứng cạnh mẹ nhìn từ xa, chó đi qua |

- 🛒 `lost`: nhiều bước với bé 3 tuổi, nên chỉ giữ cốt lõi "đứng yên, nhờ cô ở quầy, không đi theo ai". Quầy vẽ ngay cạnh Bông, cô đứng **sau quầy**; không dựa vào đồng phục.
- 💧 Thông điệp chung: không tự lại gần nước, không tự lấy đồ dưới nước, luôn nắm tay / ở sát bố mẹ. Phao tay không thay được bố mẹ. Không có cảnh Bông ở dưới nước một mình.
- 🐕 Chó vẽ thân thiện nhưng không quá dễ thương (để bé không muốn chạy tới ôm).

Emoji: kiểm tra trên Windows, iPad, Android (bài học quả ô liu 🫒). Không dùng emoji mới (🪜 🪑 🫧 🪥 🧑‍🚒): vẽ SVG hoặc chọn emoji cũ.

## 5. Thao tác sửa

- Một thao tác mỗi tình huống. **Ưu tiên chạm**: chạm mẹ / bố ("gọi bố mẹ"), chạm TV / đèn / giường / vòi nước / Bông.
- **Kéo chỉ còn 3 chỗ**, đều đoạn ngắn và vùng thả to (thả gần đích, thêm 50% mỗi phía): kéo Bông lùi ra (`stove`, `fan`), kéo mũ lên đầu Bông (`helmet`). **Chạm (không kéo) vào thứ cần kéo cũng được.**
- **Bé không bao giờ cầm / kéo:** dao, bật lửa, thuốc, nồi, ổ điện, nắp ổ điện, quạt, viên bi (đồ nhỏ dễ hóc), dây an toàn, kẹo của người lạ. Với những thứ này: **gọi bố mẹ**, bố mẹ tới làm.
- Bé không tự cài dây an toàn, không tự kiểm tra quai mũ: bố cài "click".
- Mức 1: chỗ cần chạm sáng viền + bàn tay 👆 chỉ. Mức 2: chỉ sáng viền.
- Chạm chỗ khác **không tính nhầm**; Bông nhắc lại việc cần làm (kèm tiếng Việt).
- **Bé không làm gì:** sau 6 giây Bông nhắc, chỗ cần chạm nhún; nhắc tối đa 3 lần, cách 8 giây, rồi chỉ nhún. Không làm hộ, không tính nhầm.
- Làm xong: hiệu ứng nhỏ (✨, "click", tắt đèn, z Z…), Bông nhắc **câu ngắn nhất** (*"Sharp! Call Mommy."*, *"Get low!"*).

## 6. Thưởng

- Mỗi tình huống xong: một ⭐ lên hàng sao áo choàng (số ⭐ = độ dài lượt, 3–5).
- Đủ ⭐: Bông bay một vòng, *"Thank you, Safety Hero!"*, sticker như các trò khác.
- **Album "🦸 Safety Hero"** (S2): mỗi chủ đề một huy hiệu. Huy hiệu là **thành tích chơi game**, không phải chứng nhận bé đã có kỹ năng an toàn ngoài đời.
- Không trừ sao, không có màn "thua".

## 7. Tiến độ và dữ liệu

| Dữ liệu | Dùng để | Khi nào ghi |
|---|---|---|
| `seen[<id>]` | cân bằng bốc tình huống | **+1 đúng một lần** khi tình huống **xong hẳn** (chọn đúng + làm xong thao tác sửa) |
| `firstOk[<id>]` | huy hiệu | `true` khi lần xuất hiện này đúng ngay lần chọn đầu. Đã `true` thì **không bao giờ xóa** |
| progress `safe:<id>` | Góc bố mẹ → Bé đã học (S2: nhóm "Siêu nhân an toàn") | khi xong tình huống: ghi đúng / sai (`attempts`), **+1 chỉ khi đúng ngay lần đầu, không bao giờ trừ** |

- Lượt nói "Say it!" không ghi gì. Nhầm ở bước sửa không tính.
- Thoát giữa chừng trước khi tình huống xong: không ghi gì. Khôi phục từ bản lưu: không ghi thêm, cờ `missed` giữ nguyên.
- Huy hiệu tích lũy: mở khi mọi tình huống của chủ đề có `firstOk`; không mất khi chơi sai, tắt / bật chủ đề; bản sau thêm tình huống vào chủ đề chưa mở thì cần cả tình huống mới.
- `safe:` không tính là từ vựng (không vào Ôn tập, không làm sáng nút ⭐ Ôn tập, không vào prompt tạo bài).

## 8. Kỹ thuật

### 8.1 Lưu trạng thái
```js
safetyGame = {
  level: 1 | 2,              // S2: 3 (chỉ qua khóa mức)
  rounds, lock,              // levels.js
  seen: { [ruleId]: number },
  firstOk: { [ruleId]: true },
  off: [topicId],            // chủ đề tắt; mặc định []
  focus: topicId | null,     // chủ đề ưu tiên; mặc định 'habits'
}
safetyVi: true               // giọng tiếng Việt (cài đặt riêng)
```
`cleanSafetyState` bỏ mã lạ / hỏng. Bản lưu lượt (khi app ra nền): `{ level, plan: [{ id, safeLeft }], idx, stars, missed, nudges, step: 'ask' | 'fix' }`.
- Không lưu hoạt ảnh. Quay lại: cảnh tĩnh của bước (Bông đứng trước đồ vật), đọc lại câu hỏi / việc cần làm từ đầu.
- Bản lưu có mã tình huống không còn trong bảng: bỏ, vào lượt mới.

### 8.2 Đổi mức / tắt chủ đề
- Bản lưu chỉ dùng khi app ra nền rồi quay lại (như Đóng vai). Lượt dở **chơi nốt đúng kế hoạch và mức đã lưu**, kể cả khi bố mẹ vừa đổi mức / tắt chủ đề. Thay đổi áp dụng từ lượt sau.
- Vào Góc bố mẹ là rời màn chơi: lượt sau bốc mới theo cài đặt mới.

### 8.3 Giọng đọc, âm thanh
- Giọng và tốc độ chung của app. Câu tiếng Việt dùng giọng tiếng Việt của máy.
- Ra nền khi đang đọc: dừng đọc; quay lại đọc lại câu của bước, không đọc chồng.
- Âm thanh: chuông cửa, chuông báo (ngắn, vừa tai), "click", ✨. Nhầm: không có âm "sai".

### 8.4 Offline, trợ năng
- Mọi hình là SVG / emoji trong app; file mới có trong danh sách cache của service worker.
- Nút ≥ 88 px, có hình + chữ + `aria-label` (*No* / *Yes*); tranh mức 2 có `aria-label` tiếng Việt.
- Màn dọc: cảnh giữ khung ngang 4 : 3 ở giữa (hình không bị to, đè nhau); hai tranh xếp trên dưới.
- `prefers-reduced-motion`: bỏ đi bộ / bay / rung / khói chạy.

## 9. Góc bố mẹ

- **Cài đặt → Siêu nhân an toàn:**
  - ☑ *Bông nói thêm câu tiếng Việt* (mặc định bật);
  - **Mức chơi**: tự lên / khóa mức 1 / mức 2 (S2: + mức 3);
  - **Chủ đề ưu tiên**: một chủ đề (mặc định 🌙) hoặc "Không ưu tiên";
  - **Chủ đề**: bật / tắt từng chủ đề;
  - dòng nhắc *"App chỉ giúp bé nhớ câu và việc nên làm; bố mẹ vẫn là người dạy và trông bé."*
- **"Nói thêm với bé"** (S2): trang chữ, mỗi tình huống một gợi ý luyện ngoài đời. Ví dụ:
  - qua đường: nói *"Hold hands!"*, người lớn quyết định lúc qua;
  - TV: hẹn giờ trước khi xem, chuông kêu thì *"Ding! TV off. Let's play!"*;
  - đi ngủ: cùng một nếp mỗi tối;
  - cháy: tập "cúi thấp, che miệng, theo mẹ ra cửa" như trò chơi, chỉ chỗ tập trung bên ngoài;
  - nước: luôn ở sát bé, trong tầm với; đồ rơi xuống nước thì bố mẹ lấy;
  - siêu thị: chỉ cho bé quầy thu ngân.

## 10. Mốc làm và kiểm thử

| Bản | Mốc | Nội dung |
|---|---|---|
| 0.84.0 | **S1** | Thẻ Trò chơi; mức 1–2; 6 chủ đề 🌙 🍳 🏠 🚦 🚪 🚨 (28 tình huống); nút No / Yes; giọng tiếng Việt; chủ đề ưu tiên; bật / tắt chủ đề; thao tác sửa; ⭐; ghi `seen`, `firstOk`, tiến độ; bản lưu |
| 0.85.0 | **S2** | 🛒 💧 🐕 (có `pond-toy`); mức 3 (bố mẹ bật) + Say it!; album huy hiệu; trang "Nói thêm với bé"; nhóm tiến độ |

**Unit** (`safety.test.js`):
- bảng: 6 chủ đề, 28 tình huống (18 🚫 + 10 ✅), chủ đề nào cũng có cả hai loại;
- 500 seed: lượt 5, 3 🚫 + 2 ✅, không lặp, không hai chủ đề liền nhau; tranh an toàn trái / phải lệch ≤ 1;
- chủ đề ưu tiên (SAFE-26): đúng 1 🌙 🚫 + 1 🌙 ✅; ưu tiên đang tắt thì không áp dụng; "Không ưu tiên" có lượt không có 🌙 (SAFE-27);
- chỉ bật một chủ đề: độ dài = min(5, *N*), bù loại thiếu, có ✅ thì ≥ 1 ✅; *N* < 3 → không có lượt (SAFE-11, 17, 18);
- tắt ngẫu nhiên: trùng chủ đề liền nhau chỉ khi không tránh được;
- 6 lượt liền (không ưu tiên) gặp đủ 28 tình huống;
- `cleanSafetyState`, `afterRule` (seen +1, firstOk không mất — SAFE-23), `badgeOf` (SAFE-14);
- câu nói 3+: câu hỏi ≤ 7 từ, giải thích ≤ 7 từ, nhắc lại ≤ 4 từ; không *grown-up*; người lạ không *he / she*; thuốc không gọi là kẹo;
- thao tác sửa: chỉ kéo Bông / mũ; không đụng đồ nguy hiểm (trừ chạm bố mẹ);
- mức 2: tranh chưa an toàn không có bố mẹ; hai tranh khác nhau; không ai ra ngoài khung.

**UI** (`safety.spec.js`):

| Mã | Ca | Mong đợi |
|---|---|---|
| SAFE-01, 13 | Mức 1 `knife`, chạm ✋ No | *"Oops!"* + *"No! Sharp! Call Mommy."* + câu tiếng Việt → chạm mẹ → ⭐; seen 1, firstOk, tiến độ +1 |
| SAFE-02, 13 | `knife`, chạm 👍 Yes (2 lần) | Bông đứng sững, không tới dao; gợi ý; lần 2 *"Tap No!"*; xong thì seen 1, không firstOk, ghi sai, **không trừ** |
| SAFE-03 | `helmet`, chạm ✋ | *"It's OK! A helmet keeps me safe."*; 👍 → kéo mũ thật lên đầu Bông → `worn` |
| SAFE-04 | Bé không chạm | *"Should I?"*; không tính nhầm |
| SAFE-05, 25 | Bước sửa: chạm chỗ khác / không làm gì | nhắc việc cần làm; nhắc ≤ 3 lần; không làm hộ; không tính nhầm |
| SAFE-06 | Mức 2 `cross-alone` | hai tranh bằng nhau; tranh chưa an toàn không có mẹ; chạm → mờ + *"Hmm… alone? Look again!"*; không có nút No / Yes |
| SAFE-09 | Bốc thật, đủ lượt (ưu tiên 🌙) | 5 ⭐, *"Thank you, Safety Hero!"*, sticker; rounds 1; có 2 tình huống 🌙 |
| SAFE-10, 11, 18 | Tắt 🚪 / tắt hết | không gặp người lạ / thẻ báo bố mẹ, không có nút |
| SAFE-12, 20, 24 | Ra nền ở bước sửa, bố mẹ khóa mức 2 lúc đó | quay lại đúng tình huống, đúng bước; lượt dở vẫn mức 1; seen chỉ +1 |
| SAFE-21, 32 | Ra nền khi Bông đang nói | đọc lại câu hỏi đúng một lần, không kẹt |
| SAFE-29 | Tắt giọng tiếng Việt; cảnh cháy | chỉ tiếng Anh; cảnh khói; chạm Bông → cúi thấp |
| SAFE-15, 33 | Màn 390 px | nút ≥ 88 px không tràn, cảnh không đè nút; hai tranh không tràn |
| Cài đặt | Mục Siêu nhân an toàn | tắt chủ đề, chủ đề ưu tiên, khóa mức, giọng tiếng Việt lưu đúng |

Review 3+ SAFE-28…35:
- 28 (không cần biết chữ): nút có hình, câu nào cũng có giọng; mọi test UI chơi không đọc chữ.
- 30 / 31 (chạm nhầm liên tiếp / nhiều chỗ): gộp trong 0,4 giây, trạng thái chỉ đổi khi đúng (SAFE-02, 05).
- 34 (không nói): S1 không có lượt nói; S2 Say it! như SAFE-08.
- 35 (bé không hiểu câu hỏi): câu tiếng Việt + đồ vật lóe sáng khi nhầm + Bông tự dừng hỏi *"Should I?"*.

Ảnh chụp iPad và điện thoại 390 px.

### 9.1 Ảnh của bố mẹ (S2, bố mẹ thêm)
- **Góc bố mẹ → 🦸 Ảnh Siêu nhân an toàn** (cũng mở từ Cài đặt → Siêu nhân an toàn):
  - **Bông, mẹ, bố**: mỗi người một ảnh (copy prompt, chọn ảnh nền trắng, app tự bỏ nền). Áo choàng đỏ của Bông app vẽ thêm.
  - **Đồ vật trong cảnh** (dao, TV, cửa, chó, bể bơi…): chọn từng ảnh, hoặc ảnh lưới AI cho nhiều đồ một lần. Hiệu ứng nhỏ (vạch vàng, thảm, bong bóng, nắp ổ điện, tay nắm tay, dây an toàn, 🤗, biển lối ra) vẫn là hình vẽ.
  - **Ảnh nền từng cảnh** (bếp, phòng khách, phòng ngủ, cửa nhà, đường, công viên, sân, nhà có khói, siêu thị, bể bơi, ao).
  - Ảnh nằm gọn trong khung của hình vẽ (`object-fit: contain`, chân chạm đáy) nên **chỗ chạm / chỗ thả không đổi** (bài học ảnh AI lệch chỗ chạm). Chưa có ảnh thì dùng hình vẽ; "Dùng hình vẽ sẵn" để bỏ ảnh.
  - Chia sẻ sang máy khác bằng file (như Ảnh Đóng vai); Quản lý bài → "Nhập bài từ file" cũng nhận được.
- Lưu: `images` với `lessonId` = `safety:people` / `safety:items` / `safety:bg`, `word` = mã người / mã hình (`k`) / mã cảnh.

## 11. Ngoài phạm vi (để sau)
- Ảnh AI cho từng cảnh (như SPEC-art); chỗ chạm trên ảnh AI hay lệch, nên S1 dùng SVG / emoji.
- Bài hát / vè (*"Stop, look, hold hands!"*).
- Số điện thoại, tên bố mẹ (bố mẹ tự dạy, app không lưu).
- An toàn cơ thể (body safety): nhạy cảm, bố mẹ quyết định riêng.
- Bản cho Olly English (6 tuổi): câu dài hơn, thêm "khăn ướt", lối thoát hiểm…

## 12. Đã chốt (2026-11-19 — bố mẹ trả lời)
1. Thẻ trong **Trò chơi**, sau thẻ Đóng vai; trang chủ giữ 10 nút.
2. Tên *Safety Hero / Siêu nhân an toàn* (🦸).
3. Người lớn trong câu: *Mommy / Daddy*.
4. Người lạ: giữ cả 4 tình huống.
5. Nước: bể bơi + ao / hồ; thêm đồ rơi xuống ao (draft5).
6. Thêm chủ đề 🌙 Thói quen tốt (ưu tiên) và 🚨 Khi có cháy.

## 13. Trả lời review đầu (draft3)
Đã xử lý ở draft3: `lost` (quầy thu ngân, không đi theo ai), `dog` (hỏi bố mẹ, không hỏi chủ), phao tay không là điều kiện xuống nước, giám sát sát bên ở chủ đề nước, `ball-road` đứng yên trên vỉa hè, bé không cầm đồ nguy hiểm, thứ tự bốc tình huống, tách `seen` / tiến độ / huy hiệu, mục kỹ thuật, test SAFE-16…25.

## 14. Trả lời review cho bé 3+ (draft5, 2026-11-19)
| Góp ý | Xử lý |
|---|---|
| Câu quá dài với bé 3 tuổi | Viết lại mọi câu: hỏi ≤ 7 từ, giải thích ≤ 7 từ, nhắc lại ≤ 4 từ (unit test kiểm tra) |
| Phụ đề tiếng Việt không đủ (bé chưa đọc) | Bông **đọc** câu tiếng Việt sau câu tiếng Anh (mặc định bật, tắt được) |
| Mức 3 quá khó | Mức 3 chỉ khi bố mẹ chọn, không tự lên; mỗi bước chơi độc lập; Say it! tùy chọn |
| Stop / OK không nhất quán với *"Can I…?"* | Nút ✋ **No!** / 👍 **Yes!** |
| Ưu tiên chạm hơn kéo; không kéo viên bi; nắp ổ điện | Chỉ còn 3 thao tác kéo (Bông lùi, đội mũ), chạm thay kéo cũng được; viên bi, nắp ổ điện, dây an toàn: gọi bố mẹ |
| `medicine` hình thuốc nhưng nói "kẹo" | *"A pill! Can I eat it?"* → *"No! Ask Mommy first."* |
| `socket` *poke*, `window` *feet on the floor*, `lighter` *fire is hot* | *"Can I touch it?"*; *"Get down. Call Mommy."*; *"Don't touch! Call Daddy."* |
| `stairs`: chỉ tay vịn chưa đủ | Nắm tay mẹ đi từng bậc |
| `helmet` / `seat-belt`: bé không tự cài | Bố cài quai / thắt dây "click" |
| Qua đường: người lớn quyết định | Ghi rõ ở 🚦; đèn xanh không có nghĩa tự qua |
| `candy`, `go-with`, `tell` | *"Candy! Can I take it?"*; mẹ luôn ở gần, Bông về với mẹ; *"I feel scared. Tell Mommy?"* |
| Nước, chó (S2) | *"Hold Mommy's hand near water."*; *"Wait! Stay with Mommy."*, nhìn từ xa (4.7) |
| 🌙 *all day*, *no screens in bed*, *sleep makes you strong* | *"One more cartoon?"*, *"No more videos. Time to sleep."*, *"It's bedtime. Good night!"* |
| Mức 2 hình phải rõ | Tranh chưa an toàn: Bông một mình, không có bố mẹ; tranh an toàn: có bố mẹ / đã làm đúng |
| Không bắt chơi đủ 5, không phạt bỏ dở | Thoát lúc nào cũng được; ra nền chơi tiếp đúng chỗ. Lượt 3 tình huống cho bé mới: để S2 nếu bố mẹ thấy 5 vẫn dài |
| Huy hiệu ≠ hiểu quy tắc | Ghi rõ ở mục 6; trang "Nói thêm với bé" giữ nguyên |
| SAFE-28…35 | Mục 10 |

## 15. Ghi chú khi làm (0.84.0 — S1)
- Code: `jobs/safety.js` (bảng, cảnh, bốc lượt, dữ liệu), `screens/safety.js` (màn), `kit.js` thêm `viVoice` (đọc câu tiếng Việt), `backTo` (🎲 về Trò chơi), `takeSnap` không cần khớp mức.
- Cảnh vẽ: mỗi hình `{ k, x, y, h }` (x tâm, y đáy, h chiều cao theo % khung); tranh mức 2 dùng lại cùng cảnh (`sceneAt`).
- Tiến độ dùng `markPhrasePick` (ghi đúng / sai, chỉ +1 khi đúng ngay lần đầu, không trừ).
- Test UI cố định tình huống bằng `window.__kidTest.safetyPlan`.

**0.85.0 — S2:**
- Thêm 🛒 `hide-shop`, `run-off`, `lost` (✅, chạm quầy; tranh chưa an toàn riêng `risky`: Bông đi lang thang xa quầy), 💧 `pool-alone`, `pond`, `pond-toy`, `swim-with` (✅), 🐕 `dog` → **9 chủ đề, 36 tình huống (24 🚫 + 12 ✅)**. 🐕 chỉ có 🚫; chỉ bật 🐕 thì dưới 3 tình huống, báo bố mẹ.
- Nước vẽ "phía trước" (`front`) nên người đứng trong bể chỉ thấy nửa trên; Bông không bao giờ ở dưới nước một mình.
- Mức: `MAX_LEVEL` 3 (chỉ qua khóa mức), `AUTO_MAX_LEVEL` 2 (tự lên tối đa 2). Kế hoạch mức 3: `planStory`; bản lưu lượt giữ `story` / `step`.
- Album: hết lượt (sau *"Thank you, Safety Hero!"*), nếu đã có ít nhất một huy hiệu thì hiện 9 huy hiệu; huy hiệu mới nảy lên + *"A new badge!"*. Huy hiệu cũng hiện ở Cài đặt và Bé đã học.
- "Nói thêm với bé": Góc bố mẹ → 💬 (và nút trong Cài đặt), mỗi tình huống một gợi ý (`TIPS`).
- Bé đã học: nhóm "🦸 Siêu nhân an toàn" — số tình huống đã chơi, huy hiệu, mỗi tình huống: câu ngắn, ⭐, số lần đúng ngay / sai.
- Không chơi lại được tình huống đã ghi xong (nút "Chơi lại tình huống" bỏ qua lúc đang nói câu nhắc lại / "Say it!").
- Test: unit (bảng 36, mức 3, `planStory` 500 seed, từ khóa Say it!, huy hiệu, gợi ý / ảnh), UI SAFE-S2-01…07.
