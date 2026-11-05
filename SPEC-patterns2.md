# SPEC — 🌸 Mẫu câu mở rộng: "Ai đang làm gì?" và "Gần – xa"

> Phiên bản spec: **draft2 (đã chốt)** · Ngày: 2026-11-04 · **Đã làm P1 trong app 0.64.0** (ghi chú khi code ở mục 11).
> Mở rộng mục **🌸 Sentences / Mẫu câu** (SPEC-patterns.md). Hai kiểu bài mới, **cách chơi khác** tấm tranh khung câu hiện có. Điểm chung: dạy qua **câu hỏi** — Bông hỏi, bé trả lời bằng cả câu.
>
> | Kiểu bài | Chỗ thay đổi trong câu | Ví dụ |
> |---|---|---|
> | Khung câu (đã có) | **đồ vật / tính từ** | *It is sunny. It is rainy.* |
> | **👨‍👩‍👧 Ai đang làm gì?** (mới) | **người làm** (và *is / am*, *his / her / my* đổi theo) | *Daddy is brushing his teeth. Mummy is brushing her teeth. → I am brushing my teeth!* |
> | **👉 Gần – xa** (mới) | **this / that** theo khoảng cách | *This is a flower. That is a tree.* |
>
> **draft2 (sau review)** — sửa 4 lỗi P0:
> - kích thước gần – xa trong prompt bị ngược (mục 6);
> - phần C "Who is…?" không còn bắt buộc 3 người, ô Me không là lựa chọn (mục 3.2);
> - câu hỏi về anh / chị dùng *your brother* thay vì *My brother* — người có trường riêng cho câu kể và câu hỏi (mục 3.3);
> - mạo từ lấy từ dữ liệu, không tự đoán (mục 4.4).
>
> Các điểm P1 bổ sung:
> - cách chọn người theo từng hành động, giữ cố định suốt bài (mục 3.1a);
> - câu hỏi chỉ hỏi về người có trên màn;
> - chạm / kéo ở "Bring it close!" có vùng đích rõ (mục 4.2);
> - câu "Who is…?" ghép theo quy tắc rõ + có thể ghi đè;
> - tiến độ lưu theo **từng người** (mục 5);
> - lưu đủ trạng thái lượt khi ra nền (mục 5.1);
> - hành động không có `motion` vẫn có tín hiệu nhìn thấy (mục 3.1);
> - vị trí và động tác của Bông là tín hiệu chính của gần – xa, cỡ hình chỉ hỗ trợ (mục 4.1);
> - bảng test mở rộng (mục 9);
> - mốc làm đổi: trò chơi để P3 (mục 8).
>
> Câu hỏi ở mục 10 bố mẹ đã xác nhận (thêm 3 câu: Bông là nữ, Hồ sơ thêm trai / gái, không tên gọi riêng).

## 1. Mục tiêu
- Bé nói được câu **hiện tại tiếp diễn** về người trong nhà và về chính mình: *Mummy is cooking. → I am cooking!*
- Bé **tự đổi chủ ngữ**: nghe về người khác rồi nói về mình (*is → am*, *his / her → my*). Đây là chỗ khó nhất với bé 3 tuổi, nên:
  - Bông luôn nói mẫu câu của người khác trước, câu của bé sau;
  - **không** bắt bé nói đủ ngay: nhận câu 3 mức, tối đa **một** lần mời nói lại, sau đó Bông nói mẫu rồi đi tiếp (mục 3.2).
- Bé hiểu và nói **this** (gần, chạm được) và **that** (xa, phải chỉ tay).
- Bé trả lời được các câu hỏi: *What is Daddy doing? · What are you doing? · Who is cooking? · What is this? · What is that?*
- **Không chấm sai** (như Mẫu câu): chạm nhầm thì Bông nói đúng tên rồi dẫn bé tới chỗ đúng; nói thiếu thì khen rồi nói mẫu cả câu. Bài học không được biến thành bài kiểm tra phát âm.

## 2. Vị trí
- Nằm **trong 🌸 Sentences / Mẫu câu**, không thêm nút ở màn hình chính (đã có 9 nút).
- Danh sách bài Mẫu câu chia **3 nhóm**, mỗi nhóm một hàng tiêu đề:
  - 🌸 **Khung câu** — 8 bài hiện có;
  - 👨‍👩‍👧 **Ai đang làm gì?** — bài mới, kiểu `doing`;
  - 👉 **Gần – xa** — bài mới, kiểu `nearFar`.
- Thẻ bài kiểu mới:
  - `doing`: 3–4 emoji hành động + dòng câu mẫu *"I am ___ing."*;
  - `nearFar`: emoji gần to, emoji xa nhỏ + *"This · That"*.

---

## 3. 👨‍👩‍👧 Ai đang làm gì? (`doing`)

### 3.1. Màn hình — "ngôi nhà nhiều ô cửa"
```
 🏠  ▶            🪥 Morning                      🐰
 ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
 │  👨    │  │  👩    │  │  👵    │  │   ✨ Me  │   ← ô "Me" khung vàng, to hơn
 │ Daddy  │  │ Mummy  │  │Grandma │  │  (bé)    │
 │  🪥 ↔  │  │        │  │        │  │          │
 └────────┘  └────────┘  └────────┘  └──────────┘
        Daddy is brushing his teeth.          ← câu, từ sáng theo nhịp
        Bố đang đánh răng.                     ← phụ đề
```
- **Mỗi người một ô cửa** của ngôi nhà vẽ SVG.
  - Người vẽ bằng `familySvg` (đã có ở Đóng vai — Xe buýt).
  - Bố mẹ đã thêm **ảnh thật** ở Hồ sơ của bé thì dùng ảnh thật (như bài "My family"); chưa có thì hình vẽ.
- **Ô "Me"** (ô cuối, khung vàng, to hơn) hiện theo thứ tự ưu tiên:
  1. ảnh thật của bé (nếu bố mẹ đã thêm);
  2. hình bé trai / bé gái vẽ sẵn (dùng lại nhân vật của Mặc đồ), theo mục mới **"Bé là: trai / gái"** ở Hồ sơ của bé;
  3. ✨ + tên bé.
- **Người đang làm** thì ô sáng lên (viền sáng + phóng nhẹ). Đồ vật của hành động (🪥, 🍳, 📖…) nằm **trong ô của người đó**.
  - Có `motion` → chuyển động theo bảng `MOTIONS` của Câu nói (`brush`, `wash`, `stir`, `dance`, `sleep`…).
  - `motion: "none"` → đồ vật **nảy nhẹ** một lần mỗi khi câu bắt đầu, ô vẫn sáng. Tín hiệu "ai đang làm, làm gì" không bao giờ mất.
  - Giảm chuyển động → không có hoạt ảnh; ô sáng + đồ vật đứng yên trong ô vẫn đủ để bé nhận ra.
- Chỉ người đang làm mới có đồ vật trong ô; ô khác để trống, không có đồ vật thừa.
- **Điện thoại dọc:** ô cửa xếp lưới 2 × 2, câu và phụ đề ở dưới.

### 3.1a. Ai có mặt (`cast`) và chọn người theo từng hành động
- **Cast** = những người bố mẹ đã tích ở **Hồ sơ của bé → Gia đình**, theo thứ tự trong `FAMILY`. Không kể ô Me.
  - Chưa tích ai → Daddy + Mummy.
  - Chỉ tích **một** người → thêm **Bông** (tên do bố mẹ đặt ở Cài đặt) làm người thứ hai. Bông nói và nghe như một người trong nhà: *"Bông is cooking."*; đại từ của Bông là *she*.
  - Nhiều hơn 3 người → màn chỉ hiện 3 người, chọn khi bắt đầu bài, ưu tiên người **ít sao hơn** ở bài này (mục 5).
- **Cố định khi bắt đầu bài:** cast lưu vào trạng thái lượt (mục 5.1). Bố mẹ sửa Hồ sơ giữa chừng thì lượt đang học không đổi; lần học sau mới dùng cast mới.
- **Mỗi hành động ở phần A** chọn **2 người** trong cast:
  1. ưu tiên **1 nam + 1 nữ**, để bé nghe cả *his* lẫn *her* trước khi nói *my*;
  2. không đủ một nam một nữ (chỉ toàn nam hoặc toàn nữ) → 2 người khác nhau bất kỳ;
  3. trong các cách chọn hợp lệ, ưu tiên người **chưa xuất hiện** ở hành động trước của bài, để mọi người trong cast đều được làm;
  4. cast chỉ có 2 người → luôn là 2 người đó.
- **Giới** của người dùng để chọn *he / she*, *his / her* lấy từ bảng mục 3.3, không đoán theo tên.

### 3.2. Luồng một bài (2–4 phút)
Mỗi bài có **3–4 hành động** (ví dụ Morning: đánh răng, rửa mặt, ăn sáng, mặc quần áo).

| Phần | Làm gì | Số lượt |
|---|---|---|
| A. Xem và nói theo | mỗi hành động: 2 người làm → đến lượt bé | mọi hành động |
| B. Hỏi – đáp | *What is Mummy doing?* → bé nói | 3 câu |
| C. Trò chơi "Who is…?" | nghe → chạm đúng người | 2 câu |
| Kết thúc | cả nhà cùng làm, bé nói *"We are …!"* (không chấm), sticker | 1 |

**Quy tắc chung khi nghe bé** (phần A và B):
- Mỗi câu Bông mời nói lại **tối đa một lần**.
- Bé im lặng hai lần liên tiếp (lần đầu + lần mời lại) → Bông tự nói mẫu cả câu rồi **đi tiếp**, không hỏi lại câu đó nữa.
- Không có vòng lặp chờ vô hạn; mic không có (bị từ chối / máy không hỗ trợ) → Bông nói mẫu rồi đi tiếp như "im lặng".

**A. Xem và nói theo** — với từng hành động:
1. Ô người thứ nhất sáng, đồ vật hiện trong ô (mục 3.1). Bông: *"Look! Daddy is brushing his teeth."*
2. Người thứ hai: *"Mummy is brushing her teeth."*
3. Ô **Me** sáng lên, Bông quay sang bé:
   - Bông: *"And you? What are you doing?"*;
   - đồ vật bay sang ô Me, phụ đề *"Con làm thử nào!"*;
   - bé (hoặc bố mẹ) làm động tác.
4. Bông nói mẫu chậm, theo cụm: *"I am … brushing my teeth!"*, rồi bật mic. Nhận câu chia 3 mức (mục 3.5):
   - **cả câu** → *"Great job! You are brushing your teeth!"* + sao;
   - **một phần câu / từ khóa** → khen rồi mời nói lại **một lần**: *"Say it with me: I am brushing my teeth!"*;
   - **im lặng** → *"Let's try! I am brushing my teeth!"*, chờ thêm một lần; vẫn im lặng thì đi tiếp.

**B. Hỏi – đáp** (3 câu):
- **Chỉ hỏi về người có trên màn** (cast + Me). Bài **không** ghi tên người trong câu hỏi; app tự ghép câu hỏi từ cast, nên không bao giờ hỏi về người không có mặt.
- Một người đang làm một hành động **đã học ở phần A**, chưa có câu nào được đọc trước.
- Bông hỏi bằng **tên dùng trong câu hỏi** (`ask`, mục 3.3): *"What is Grandma doing?"*, *"What is your brother doing?"*. Bé nói:
  - *"Grandma is cooking"* hoặc *"She is cooking"* đều là **cả câu**;
  - chỉ *"cooking"* là **từ khóa** → *"Yes! Grandma is cooking!"*.
- Chưa nói được: sau 4 giây hiện **chữ mờ** của hành động (*cooking*) làm gợi ý; lần 2 thì Bông nói mẫu.
- Một trong 3 câu là câu hỏi về bé:
  - Bông hỏi *"What are you doing?"*, đồ vật nằm ở ô Me;
  - bé trả lời *"I am …"*.
- Cặp (hành động, người) được hỏi chọn theo "ít sao" (mục 5). Ba câu hỏi về ba cặp khác nhau; cast nhỏ thì được lặp người nhưng không lặp cặp.

**C. Trò chơi "Who is…?"** (2 câu):
- **Lựa chọn** = mọi người trong cast trên màn (**2–3 người**), **không** gồm ô Me. Ô Me mờ đi trong phần này.
- **Mỗi người một hành động khác nhau**, lấy từ các hành động của bài; bài có ít hành động hơn số người thì dùng thêm hành động của bài có sẵn khác cùng nhóm.
- Bông hỏi: *"Who is sleeping?"* (câu hỏi ghép theo mục 3.3). Bé chạm vào người:

| Bé chạm | Bông |
|---|---|
| Đúng | *"Yes! Grandpa is sleeping!"* + sao bay |
| Người khác, lần 1 | Người đó nảy nhẹ: *"That's Mummy. Mummy is cooking! Who is sleeping?"* |
| Người khác, lần 2 | *"Look! Grandpa is sleeping!"* — ô đúng sáng, đi tiếp |
| Ô Me (đã mờ) | Không phản hồi |
- Chạm trong lúc Bông đang nói câu "That's…" thì bỏ qua (khóa chạm như các trò khác, `WRONG_LOCK_MS`). Chạm lại cùng một người sai không tính là lần 2.

**Kết thúc:**
- Cả nhà (cast + Me) cùng làm **một** hành động. Bông: *"Everybody is dancing! We are dancing!"*
- Bé nói theo, không chấm. Sau đó đến màn hoan hô + sticker.

### 3.3. Ngữ pháp tự sinh (bài chỉ ghi hành động, app tự ghép câu)
**Mỗi người** có các trường riêng cho từng chỗ dùng (`PEOPLE` trong `patterns2.js`, mã người lấy theo `FAMILY` của `talk.js`):

| Người | `name` (câu kể) | `ask` (câu hỏi) | Giới | Đại từ | Sở hữu | to be | `vi` |
|---|---|---|---|---|---|---|---|
| daddy | Daddy | Daddy | nam | he | his | is | Bố |
| mummy | Mummy | Mummy | nữ | she | her | is | Mẹ |
| grandpa | Grandpa | Grandpa | nam | he | his | is | Ông |
| grandma | Grandma | Grandma | nữ | she | her | is | Bà |
| brother | My brother | **your brother** | nam | he | his | is | Anh / em trai |
| sister | My sister | **your sister** | nữ | she | her | is | Chị / em gái |
| bong | Bông (tên đặt ở Cài đặt) | Bông | nữ | she | her | is | Bông |
| **me** | **I** | **you** | — | I | **my** | **am** (câu hỏi: **are**) | **Con** |
| (cả nhà) | We / Everybody | — | — | we | our | are | Cả nhà |

- Tên viết hoa đầu câu do app lo: *"My brother is cooking."* đầu câu, *"…and my brother"* giữa câu.
- Phụ đề dùng tên chung trong bảng (*Anh / em trai*, *Bà*…); v1 không có tên gọi riêng từng người.

**Mỗi hành động** ghi:
- `en`: cụm *-ing* có `{pos}` ở chỗ sở hữu, ví dụ *brushing {pos} teeth*, *washing {pos} face*, *cooking*, *reading a book*;
- `base`: dạng nguyên mẫu, dùng làm từ khóa nhận dạng (*brush*, *wash*, *cook*, *read*);
- `vi`: tiếng Việt (*đánh răng*);
- `emoji`, `motion`;
- `who` *(không bắt buộc)*: câu hỏi "Who" viết sẵn, khi quy tắc mặc định nghe không tự nhiên.

**App ghép câu:**
| Câu | Quy tắc | Ví dụ |
|---|---|---|
| Câu kể | `name` + to be + `en` với `{pos}` = sở hữu | *Daddy is brushing his teeth.* / *I am brushing my teeth.* / *We are brushing our teeth.* |
| Câu tiếng Việt | `vi` của người + *đang* + `vi` của hành động | *Bố đang đánh răng.* / *Con đang đánh răng.* |
| What … doing? | *What is* + `ask` + *doing?* (Me: *What are you doing?*) | *What is your sister doing?* |
| Who is …? | có `who` thì dùng `who`; không có thì *Who is* + `en` với `{pos}` = **their**, giữ nguyên phần sau | *Who is brushing their teeth?* / *Who is reading a book?* / *Who is cooking?* |
- Câu "Who" dùng **their** để không lộ đáp án là nam hay nữ.
- **Không tự thêm -ing.** Dạng *-ing* viết sẵn trong bài để khỏi sai chính tả (*running*, *making*).
- **Kiểm tra bài** (bài có sẵn và bài bố mẹ dán vào):
  - `en` phải bắt đầu bằng một từ đuôi *-ing*;
  - `{pos}` xuất hiện tối đa một lần;
  - `base` là một từ;
  - `motion` thuộc bảng `MOTIONS`;
  - `base` không trùng giữa các hành động trong cùng bài.

### 3.4. Bài có sẵn
| # | Bài | Hành động (en · vi · emoji · motion) |
|---|---|---|
| 1 | 🪥 Morning | brushing {pos} teeth · đánh răng · 🪥 · brush — washing {pos} face · rửa mặt · 🧼 · wash — eating breakfast · ăn sáng · 🍞 · eat — getting dressed · mặc quần áo · 👕 · none |
| 2 | 🏠 At home | cooking · nấu ăn · 🍳 · stir — reading a book · đọc sách · 📖 · none — watching TV · xem ti vi · 📺 · none — cleaning · dọn dẹp · 🧹 · push |
| 3 | 🎈 Play time | playing ball · chơi bóng · ⚽ · kick — drawing · vẽ tranh · 🖍️ · none — singing · hát · 🎵 · dance — dancing · nhảy múa · 💃 · dance |
| 4 | 🌙 Bedtime | taking a bath · tắm · 🛁 · wash — drinking milk · uống sữa · 🥛 · drink — reading a story · đọc truyện · 📚 · none — sleeping · ngủ · 💤 · sleep |
- Câu cuối mỗi bài (*We are …*) lấy hành động **dễ làm theo nhất** của bài (`together`): Morning → brushing our teeth, At home → cooking, Play time → dancing, Bedtime → sleeping.

### 3.5. Nhận câu bé nói (3 mức, theo SPEC-patterns mục 4.4)
- **Chuẩn hóa** như Mẫu câu: mở rút gọn *I'm → I am*, *she's → she is*, *he's → he is*.
  - Từ khóa là `base` hoặc dạng *-ing* (*brush* = *brushing*).
- **Cả câu:**
  - câu về **bé**: có *I* + *am* + từ khóa (*"I'm brushing my teeth"* → cả câu);
  - câu về **người khác**: có (tên người — `name` hoặc `ask`, ví dụ *brother* — **hoặc** đại từ đúng) + *is* + từ khóa.
  - Phần sau từ khóa (*my teeth*, *a book*) **không bắt buộc**, vì nhận dạng hay mất.
- **Một phần câu:** có từ khóa + một trong các từ chính (*I*, *am*, tên, đại từ, *is*). Gồm cả:
  - **nhầm chủ ngữ** (*"I is brushing"*);
  - **nhầm đại từ** (*"he is cooking"* khi hỏi về Grandma).
  - Bông chỉ nói mẫu lại câu đúng, không giải thích ngữ pháp.
- **Từ khóa:** chỉ có từ khóa.

---

## 4. 👉 Gần – xa (`nearFar`)

### 4.1. Màn hình — tranh có chiều sâu
```
 🏠  ▶            🌳 In the park                     
            (xa, nhỏ)  🌳 ← 👉 · · · · · · ·
   ~~~~~~~~ đồi cỏ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                                   🐰 Bông
     (gần, to)  🌷 👇                         ← vòng sáng dưới chân đồ gần
        This is a flower.   That is a tree.
        Đây là bông hoa.    Kia là cái cây.
```
- **Nền:** dùng lại tranh vẽ sẵn của **Dán tranh** (park, farm, beach, garden, street…). Bố mẹ đã thay ảnh tranh thì dùng ảnh đó.
  - Chỉ có nền: **không** hiện sticker bé đã dán ở trò Dán tranh, nên không có gì che hai chỗ đặt đồ.
- **Hai vùng đặt đồ cố định cho từng tranh** (`NEAR_ZONE`, `FAR_ZONE`, ghi trong `patterns2.js` theo khung 400 × 300):
  - chọn ở **chỗ trống** của tranh: vùng gần ở tiền cảnh bên dưới, vùng xa ở đường chân trời / trên đồi;
  - hai vùng **cách nhau rõ** (vùng xa ở nửa trên, vùng gần ở phần ba dưới cùng; không chồng nhau);
  - kiểm tra bằng test: hai vùng nằm trong tranh, không chồng nhau, vùng xa cao hơn vùng gần;
  - chỗ đứng của Bông nằm ngoài cả hai vùng.
- **Tín hiệu chính là vị trí và động tác của Bông, cỡ hình chỉ hỗ trợ:**
  - **this** → Bông **đi tới đứng sát** đồ ở vùng gần, bàn tay 👇 **chạm** vào đồ, vòng sáng dưới chân đồ;
  - **that** → Bông **đứng yên ở chỗ của mình**, tay **chỉ** 👉 ra xa, **đường chấm** chạy từ tay Bông tới đồ ở vùng xa.
  - **Cỡ hình:** đồ ở vùng gần hiện **to**; đồ ở vùng xa hiện **nhỏ** (khoảng 40% cỡ đồ gần). Cỡ theo **vùng**, không theo đồ: kéo đồ từ xa về gần thì đồ to dần lên.
  - Hai chữ **This** / **That** trong câu có màu riêng, trùng màu vòng sáng (gần) và đường chấm (xa).
- **Giảm chuyển động:** Bông hiện **ngay** ở chỗ đứng đúng (sát đồ gần / chỗ của mình, tay chỉ), đường chấm vẽ sẵn, không có hoạt ảnh đi lại. Gần – xa vẫn phân biệt được bằng vị trí, bàn tay, đường chấm và màu chữ.
- Đồ vật lấy từ bộ sticker của tranh hoặc đồ thêm (mục 4.3); ảnh sticker bố mẹ đã thay dùng chung.

### 4.2. Luồng một bài (2–3 phút)
Mỗi bài có **3 cặp** (gần, xa), ví dụ Park: (flower, tree), (ball, kite), (dog, bird).

| Phần | Làm gì | Số lượt |
|---|---|---|
| A. Xem và nói theo | mỗi cặp: *This is …* rồi *That is …*, bé nói theo | 3 cặp |
| B. Hỏi – đáp | *What is this?* / *What is that?* → bé nói | 4 câu (2 this, 2 that) |
| C. Trò chơi "Bring it close!" | đưa đồ lại gần / ra xa theo câu Bông nói | 2 câu |
| Kết thúc | đọc nhanh các cặp như bài hát + sticker | 1 |

**A. Xem và nói theo** — với từng cặp:
1. Bông đi tới vùng gần, tay chạm: *"This is a flower."* Đồ gần nảy, chữ **This** tô đậm.
2. Bông về chỗ, chỉ tay: *"That is a tree."* Đường chấm chạy tới đồ xa, chữ **That** tô đậm.
3. Bé nói theo từng câu (3 mức, mục 4.5). Mời nói lại tối đa một lần, im lặng hai lần thì đi tiếp (như mục 3.2).
4. Phụ đề: *Đây là bông hoa. / Kia là cái cây.*

**B. Hỏi – đáp** (4 câu):
- Bông chạm đồ gần: *"What is this?"* → bé trả lời *"This is a ball."*
- Bông chỉ đồ xa: *"What is that?"* → bé trả lời *"That is a kite."*
- Bé nói *"It is a kite"* → tính **một phần câu**. Bông: *"Yes! That is a kite!"*, mời nói lại một lần.

**C. Trò chơi "Bring it close!"** (2 câu) — trò **bắt bé phải hiểu this / that**:
- Đồ đang ở **sai vùng** so với câu Bông nói.
  - Ví dụ 1: con chim đang ở vùng xa; Bông nói *"This is a bird!"* → *"Bring it close!"* → bé đưa con chim về vùng gần → Bông chạm vào chim: *"Yes! This is a bird!"*
  - Ví dụ 2: con mèo ở vùng gần; Bông nói *"That is a cat!"* → *"Put it far away!"* → bé đưa con mèo ra vùng xa.
- **Hai cách thao tác đều được:**
  - **chạm** vào đồ → đồ **tự bay** tới vùng đích của câu lệnh và lượt hoàn thành;
  - **kéo** đồ → chỉ hoàn thành khi **thả trong vùng đích**:
    - thả ở vùng còn lại (vùng sai) → đồ trôi về chỗ cũ, tính **một lần sai**;
    - thả ở chỗ khác (giữa hai vùng, ngoài tranh) → đồ trôi về chỗ cũ, **không tính** lần sai.
- **Sai lần 1** → Bông nói mẫu lại kèm động tác (đi lại gần / chỉ ra xa). **Sai lần 2** → Bông tự đưa đồ tới vùng đích rồi đi tiếp. Không có "Try again".
- **Trong lúc đồ đang bay / trôi** (và lúc Bông đang nói câu khen), mọi chạm / kéo đều bỏ qua.
- **Sao:** mỗi lượt chỉ cộng sao **một lần**, lúc đồ tới vùng đích lần đầu. Bé chạm lại đồ đã ở đúng vùng thì Bông chỉ đọc lại câu, không cộng thêm.

### 4.3. Bài có sẵn (đồ lấy từ bộ sticker của tranh)
| # | Bài | Tranh | 3 cặp (gần → xa) |
|---|---|---|---|
| 1 | 🌳 In the park | park | flower → tree\* · ball → kite · dog → bird |
| 2 | 🚜 On the farm | farm | chick → cow · egg → tractor · rabbit → horse |
| 3 | 🏖️ At the beach | beach | shell → boat · crab → dolphin · ball → palm tree |
| 4 | 🌻 In the garden | garden | ladybug → butterfly · strawberry → sunflower · snail → bird |
| 5 | 🚦 In the street | street | bicycle → bus · dog → helicopter · balloon → plane |

\* *tree* là đồ thêm (không có trong bộ sticker Park).
- **Chọn đồ hợp vùng:**
  - **đồ đặt ở vùng xa** là đồ **to / ở xa thật** ngoài đời (cây, xe buýt, máy bay…);
  - **đồ đặt ở vùng gần** là đồ nhỏ, cầm được (bông hoa, quả bóng, vỏ ốc…).
  - Như vậy ảnh "to ở gần, nhỏ ở xa" khớp với đời thật.
- **Không trùng đồ:** một đồ chỉ xuất hiện trong **một** cặp của bài.
- **Đồ thêm** (`EXTRA_ITEMS` trong `patterns2.js`): vài đồ xa hay gặp nhưng không phải sticker, dùng cho mọi tranh. Mỗi đồ khai báo đủ tên Anh, tiếng Việt, emoji, `article`:

| Mã | en | vi | emoji | article |
|---|---|---|---|---|
| tree | tree | cái cây | 🌳 | a |
| house | house | ngôi nhà | 🏠 | a |
| mountain | mountain | ngọn núi | ⛰️ | a |
| sun | sun | mặt trời | ☀️ | **the** |
| cloud | cloud | đám mây | ☁️ | a |
| rainbow | rainbow | cầu vồng | 🌈 | a |
- Ảnh đồ thêm lấy theo `concept` như bài từ vựng; chưa có ảnh thì dùng emoji.

### 4.4. Mạo từ (không tự đoán)
- Mỗi đồ dùng trong `nearFar` có `article`: `"a"` | `"an"` | `"the"` | `"none"`.
- **Mặc định:** sticker dùng bảng `ARTICLES` trong `patterns2.js`.
  - Bảng ghi **mọi** sticker dùng được trong bài Gần – xa.
  - Test kiểm tra mọi đồ của bài có sẵn đều có mạo từ trong bảng.
  - Ví dụ: *egg → an*, *ice cream → none* (*This is ice cream.*), *sun → the*.
- Bài bố mẹ dán vào ghi `article` riêng cho từng đồ được; không ghi thì lấy theo bảng; đồ không có trong bảng và không ghi `article` → **báo lỗi**, không đoán.
- Câu ghép:
  - `a` / `an` / `the` → *This is a flower.* / *That is an egg.* / *That is the sun.*;
  - `none` → *This is ice cream.*
- Bài có sẵn tránh đồ khó dùng mạo từ (bài Beach dùng *ball* thay cho *ice cream* ở draft1).
- v1 **không** dùng đồ số nhiều (`PLURAL` của Dán tranh: *grapes, socks, sunglasses, scissors*). Bài dán vào có đồ số nhiều → báo lỗi (*These / those* để sau).

### 4.5. Nhận câu bé nói
- **Cả câu:** đúng *this* / *that* + *is* + từ khóa (*This is a ball*). Mạo từ không bắt buộc, như Mẫu câu.
- **Một phần câu:**
  - có từ khóa + *is* hoặc *it* (*"It is a kite"*);
  - hoặc nói **nhầm** this / that (*"That is a ball"* khi đồ ở gần): Bông nói mẫu lại đúng kèm động tác chạm / chỉ. Không chấm sai.
- **Từ khóa:** chỉ có tên đồ.

### 4.6. Để sau (không làm ở draft này)
- *These / those* (số nhiều: *These are apples. Those are trees.*).
- *Here / there* (*The ball is here. The bird is there.*).
- *Is this a …? — Yes, it is. / No, it isn't.*

---

## 5. Tiến độ, ghi âm
- **Sao câu** (chỉ khi bé nói **cả câu** hoặc chạm / đưa đồ đúng ở trò chơi), **lưu theo từng người cụ thể**:
  - `doing:<base>|<personId>` — ví dụ `doing:cook|grandpa`, `doing:cook|me`. Daddy và Grandpa có tiến độ riêng dù cùng *he*.
  - `near:<this|that>|<concept>`.
- **Màn tổng hợp nhóm lại** ở Góc bố mẹ → Tiến độ:
  - nhóm theo *I am* (me) / *he is* (người nam) / *she is* (người nữ);
  - **sao khung** gộp mọi bài: `frame:i am ___ing`, `frame:he is ___ing`, `frame:she is ___ing`, `frame:this is {a} ___`, `frame:that is {a} ___`;
  - ví dụ: *"Bé nói được **I am …ing** với 9 hành động; **That is …** với 6 đồ."*
  - Sao khung là số **hành động / đồ khác nhau** đã có ít nhất một sao câu thuộc khung đó, tính lại từ sao câu (không lưu riêng), nên không lệch nhau.
- **Chọn lượt "ít sao"** như SPEC-patterns mục 4.5:
  - phần B của `doing` ưu tiên cặp (hành động, **người**) chưa có sao, trong cast của lượt;
  - phần B của `nearFar` ưu tiên (this / that, đồ) chưa có sao.
- **Từ vựng:** tên đồ trong `nearFar` ghi "đã luyện" cho `concept` ở kho chung.
- **Ghi âm:** mỗi câu tối đa 1 bản / ngày, như Mẫu câu. Góc bố mẹ → Nghe lại giọng bé, lọc theo bài.
- **Không mất tiến độ cũ:** sao câu / sao khung của 8 bài Khung câu giữ nguyên khóa cũ (`pattern:…`, `frame:…`). Khóa mới không trùng khóa cũ.

### 5.1. Học tiếp (ra nền, quay lại, Học tiếp lần sau)
Lưu **trạng thái của lượt đang học** sau mỗi bước, như `saveSnap` của Đóng vai. Quay lại thì dựng lại đúng màn đó, **không chọn ngẫu nhiên lại**:
- **Chung:** phần đang học, chỉ số câu / cặp / hành động, các câu đã xong và sao đã nhận trong lượt (không cộng sao hai lần).
- **`doing`:**
  - cast của lượt;
  - 2 người của từng hành động ở phần A;
  - danh sách 3 câu hỏi phần B (người + hành động);
  - 2 câu phần C (ai làm gì, ai được hỏi);
  - số lần mời nói lại / số lần chạm sai của câu đang dở.
- **`nearFar`:**
  - vị trí hiện tại của từng đồ (vùng gần / xa);
  - danh sách 4 câu phần B;
  - 2 câu phần C (đồ nào, câu lệnh *this* hay *that*);
  - số lần sai của câu đang dở.
- Câu đang dở khi ra nền → quay lại thì Bông **nói lại câu đó từ đầu** (câu hỏi / câu lệnh), giữ số lần đã sai.

## 6. Bố mẹ tạo bài
Góc bố mẹ → **Tạo bài mẫu câu** thêm lựa chọn kiểu bài: *Khung câu* (đã có) · *Ai đang làm gì?* · *Gần – xa*.
- **Ai đang làm gì?:**
  - bố mẹ chọn chủ đề (gợi ý: At school, In the kitchen, At the park, Helping at home…);
  - AI trả **3–4 hành động** dạng `{ en, base, vi, emoji, motion, who? }`, `en` có `{pos}` nếu có sở hữu;
  - prompt dặn:
    - chỉ dùng hành động **bé làm theo được**, dạng *-ing* viết đúng chính tả;
    - **không** ghi tên người (app tự ghép theo gia đình của bé);
    - `motion` chọn trong danh sách app gửi kèm.
- **Gần – xa:**
  - bố mẹ chọn tranh (một trong 14 tranh Dán tranh);
  - AI chọn **3 cặp** `{ near, far }` từ bộ sticker của tranh đó và đồ thêm (app gửi danh sách mã kèm `article`);
  - prompt dặn:
    - đồ đặt ở vùng **xa** là đồ **to / ở xa thật** ngoài đời (cây, xe buýt, máy bay…);
    - đồ đặt ở vùng **gần** là đồ **nhỏ, cầm được** (bông hoa, quả bóng…);
    - trên màn hình app tự hiện đồ gần **to hơn**, đồ xa **nhỏ hơn** (khoảng 40% đồ gần), AI không cần ghi cỡ;
    - không trùng đồ giữa các cặp; không dùng đồ số nhiều.
- **Báo lỗi rõ, không tự sửa:**
  - *"Bài có 5 hành động. Mỗi bài 3–4 hành động."*;
  - *"`motion` "fly" không có. Chọn một trong: brush, wash, …"*;
  - *""cooked" không phải dạng -ing. Viết "cooking"."*;
  - *"Hai hành động trùng `base` "read"."*;
  - *"Sticker "unicorn" không có trong tranh Park (và không phải đồ thêm)."*;
  - *""flower" có ở 2 cặp. Mỗi đồ chỉ dùng một lần."*;
  - *""grapes" là số nhiều — chưa dùng được ở Gần – xa."*.

## 7. Dữ liệu
- Bài lưu chung kho `lessons` với `kind: 'patterns'` như Mẫu câu, thêm trường `style`:
  - `'frame'` (mặc định; bài cũ không có `style` coi như `frame` — test);
  - `'doing'`;
  - `'nearFar'`.
- **Ví dụ bài `doing`:**
```json
{ "kind": "patterns", "style": "doing", "title": "Morning", "titleVi": "Buổi sáng", "emoji": "🪥",
  "actions": [
    { "en": "brushing {pos} teeth", "base": "brush", "vi": "đánh răng", "emoji": "🪥", "motion": "brush" },
    { "en": "washing {pos} face", "base": "wash", "vi": "rửa mặt", "emoji": "🧼", "motion": "wash" }
  ],
  "together": "brush" }
```
- **Ví dụ bài `nearFar`:**
```json
{ "kind": "patterns", "style": "nearFar", "title": "In the park", "titleVi": "Ở công viên", "scene": "park",
  "pairs": [ { "near": "flower", "far": "tree" }, { "near": "ball", "far": "kite" }, { "near": "dog", "far": "bird" } ] }
```
- **Bảng dữ liệu trong `patterns2.js`** (module mới):

| Bảng | Nội dung |
|---|---|
| `PEOPLE` | theo mã `FAMILY` + `me` + `bong`: `name`, `ask`, giới, đại từ, sở hữu, to be, `vi` (mục 3.3) |
| `NEAR_FAR_ZONES` | mỗi tranh dùng được: `NEAR_ZONE`, `FAR_ZONE`, chỗ đứng của Bông (khung 400 × 300) |
| `ARTICLES` | mạo từ của sticker dùng được (mục 4.4) |
| `EXTRA_ITEMS` | đồ thêm: `en`, `vi`, emoji, `article` (mục 4.3) |
- `nearFar.pairs[].near / far` là **mã sticker** của Dán tranh (`ITEM_BY_ID`) **hoặc** mã đồ thêm. Tranh chỉ dùng được cho Gần – xa khi có trong `NEAR_FAR_ZONES` (v1: park, farm, beach, garden, street; tranh khác thêm dần).
- **Kiểm tra bài** (`doing`: mục 3.3; `nearFar`):
  - đúng 3 cặp;
  - đồ tồn tại trong tranh / đồ thêm, có emoji (hoặc ảnh) và mạo từ;
  - không trùng đồ, không đồ số nhiều;
  - `scene` có trong `NEAR_FAR_ZONES`.
- Sao lưu / khôi phục, chia sẻ bài như bài Mẫu câu (đã có).

## 8. Mốc làm
| Mốc | Nội dung |
|---|---|
| **P1** | `doing` phần A + B, 4 bài có sẵn, ghép câu, nhận câu 3 mức, cast + chọn người, sao câu theo người, học tiếp (mục 5.1). Danh sách Mẫu câu chia 3 nhóm. |
| **P2** | `nearFar` phần A + B, 5 bài có sẵn, hai vùng cố định theo tranh, Bông đi lại / chỉ tay, mạo từ theo bảng, ghép câu, nhận câu, học tiếp. |
| **P3** | `doing` phần C "Who is…?" + kết thúc *We are…*; `nearFar` phần C "Bring it close!" (chạm / kéo); bố mẹ tạo 2 kiểu bài mới bằng prompt; sao khung ở Góc bố mẹ → Tiến độ. |
- Lý do: kiểm chứng phần học cơ bản (xem – nói – hỏi đáp) chạy tốt trước khi thêm trò chơi tương tác.

## 9. Kiểm thử
| ID | Trường hợp | Kết quả mong đợi |
|---|---|---|
| DO-01 | Hồ sơ chưa tích ai | Cast = Daddy + Mummy; phần C chơi được với 2 người |
| DO-02 | Chỉ tích người nam (Daddy, Grandpa) | Không lỗi; phần A chọn 2 người nam khác nhau; không có *her* |
| DO-03 | Tích 2 nam + 1 nữ | Mỗi hành động 1 nam + 1 nữ; hai người nam luân phiên qua các hành động |
| DO-04 | Có Brother / Sister | Câu kể *My brother is…*; câu hỏi *What is your brother doing?* |
| DO-05 | Không tích Grandma | Không có câu nào nhắc Grandma |
| DO-06 | Bé nói *"I'm brushing my teeth"* | Cả câu |
| DO-07 | Bé nói *"I is brushing"* | Một phần câu, Bông nói mẫu đúng |
| DO-08 | Bé im lặng liên tục | Mỗi câu tối đa 1 lần mời lại, rồi đi tiếp; bài kết thúc được |
| DO-09 | Ra nền lúc đang hỏi phần B | Quay lại đúng câu hỏi, cùng người, cùng hành động, giữ số lần đã mời |
| DO-10 | Người không có ảnh thật | Hiện hình vẽ `familySvg`; ô Me không có ảnh → hình bé theo Hồ sơ → ✨ tên |
| DO-11 | Chỉ tích 1 người (Mummy) | Thêm Bông làm người thứ hai: *Bông is cooking.* |
| DO-12 | Sửa Hồ sơ giữa lượt | Lượt đang học giữ cast cũ; lần sau dùng cast mới |
| DO-13 | Ghép câu mọi người × mọi hành động có sẵn | Đúng *is / am / are*, *his / her / my / our / their*; *Who is reading a book?*; phụ đề *Bố đang… / Con đang…* |
| DO-14 | Phần C: chạm người sai lần 1, lần 2 | *"That's Mummy. Mummy is cooking! Who is…"* → tự chỉ đáp án; không "Try again"; ô Me không chạm được |
| DO-15 | Hành động `motion: none` | Ô sáng + đồ vật nảy nhẹ; giảm chuyển động → ô sáng + đồ vật đứng yên |
| DO-16 | Tiến độ theo người | Sao `doing:cook|daddy` không làm `doing:cook|grandpa` thành có sao |
| NF-01 | Bố trí đồ | Đồ ở vùng gần to hơn đồ ở vùng xa (≈ 40%); kéo về gần thì to lên |
| NF-02 | Vùng của 5 tranh | Trong tranh, không chồng nhau, vùng xa cao hơn vùng gần, chỗ Bông ngoài hai vùng |
| NF-03 | Câu *this* / *that* | *This* luôn kèm Bông đứng sát + chạm đồ ở vùng gần; *That* luôn kèm chỉ tay + đường chấm tới đồ ở vùng xa |
| NF-04 | Đồ có `article: none` / `the` | *This is ice cream.* / *That is the sun.* |
| NF-05 | Bé nói *"It is a kite"* | Một phần câu, Bông nói mẫu *That is a kite* |
| NF-06 | Bé nói nhầm *this* / *that* | Một phần câu, Bông làm mẫu lại kèm động tác, không chấm sai |
| NF-07 | Kéo đồ thả giữa hai vùng | Đồ trôi về, không hoàn thành, không tính lần sai |
| NF-08 | Chạm đồ thay vì kéo | Đồ tự bay tới vùng đích, hoàn thành |
| NF-09 | Chạm lại đồ đã ở đúng vùng | Chỉ đọc lại câu, không cộng sao thêm |
| NF-10 | Giảm chuyển động | Vẫn phân biệt gần – xa (vị trí Bông, bàn tay, đường chấm, màu chữ) |
| NF-11 | Ra nền lúc đồ đã được kéo về gần | Quay lại: đồ vẫn ở vùng gần, cùng câu lệnh |
| NF-12 | Chạm / kéo lúc đồ đang bay | Bỏ qua |
| DATA-01 | Bài dán vào có `motion` lạ | Báo lỗi rõ, kèm danh sách `motion` hợp lệ |
| DATA-02 | Sticker không có trong tranh | Báo lỗi rõ |
| DATA-03 | Bài cũ không có `style` | Mở bằng kiểu `frame` như cũ |
| DATA-04 | Sao Khung câu có từ trước | Giữ nguyên sau khi nâng cấp |
| DATA-05 | Đồ trùng giữa các cặp / đồ số nhiều / đồ không có mạo từ | Báo lỗi rõ |
| DATA-06 | `en` không đuôi -ing, `base` trùng | Báo lỗi rõ |
| DATA-07 | Mọi đồ của 5 bài có sẵn | Có trong bộ sticker của tranh hoặc đồ thêm, có mạo từ |

## 10. Câu hỏi đã chốt (bố mẹ xác nhận 2026-11-04)
1. **Vị trí:** trong 🌸 Mẫu câu, danh sách chia 3 nhóm.
2. **Ô "Me":** ảnh thật của bé → hình bé trai / bé gái theo Hồ sơ → ✨ + tên bé.
3. **He / she:** chưa làm bài riêng. Phần A dùng tên, phần B chấp nhận cả tên lẫn đại từ.
4. **Gần – xa:** v1 chỉ *this / that* số ít; *these / those*, *here / there* để sau.
5. **Thứ tự:** `doing` trước, `nearFar` sau; trò chơi của cả hai để P3.
6. **Bông là nữ:** đại từ *she / her* khi Bông vào làm người trong nhà.
7. **Hồ sơ của bé thêm "Bé là: trai / gái"** (mặc định chưa chọn): dùng cho ô Me. Chưa chọn và chưa có ảnh thật thì ô Me hiện ✨ + tên bé.
8. **Không có tên gọi riêng từng người** ở v1: phụ đề dùng tên chung (*Bố, Mẹ, Anh / em trai…*).

## 11. Ghi chú khi code (P1, app 0.64.0)
- **3 nhóm của Mẫu câu** dùng thanh tab chủ đề sẵn có của danh sách bài (⭐ All · Sentences · 👨‍👩‍👧 Who is doing?) thay cho hàng tiêu đề: bài có sẵn kiểu `doing` có `topic: "Who is doing?"`; bài bố mẹ dán vào kiểu `doing` cũng tự vào tab này.
- Module mới `patterns2.js` (người, ghép câu, chọn người, câu hỏi, nhận câu, kiểm tra bài, 4 bài có sẵn) và màn `player/doing-player.js`. Bài có sẵn tự thêm một lần cùng cờ `patternLessonsSeeded` của Mẫu câu.
- Kế hoạch lượt (`cast`, `pairs`, `questions`) lưu trong `lesson.doingPlan` cùng `lesson.resume`; Học tiếp dùng lại nếu còn hợp lệ.
- `base` là từ khóa nhận dạng, thường là động từ nguyên mẫu; bài Bedtime dùng `bath` cho *taking a bath*, `story` cho *reading a story* (bé hay nói từ đó).
- Hồ sơ của bé thêm `kid: 'boy' | 'girl' | ''`. Thêm hình **anh / em trai** (`familySvg('brother')`) — trước đây anh trai dùng tạm hình bố (cả ở Xe buýt).
- Tiến độ `doing:` không lẫn vào danh sách từ vựng (`wordRecords`). Trang bài ở Quản lý bài: sao từng hành động theo *I am / he is / she is* và từng người.
- Ảnh bìa bài Morning dùng 🌅 (🪥 không hiện trên Windows 10; hành động đánh răng vẫn dùng 🪥).
- Chưa làm (P2, P3): Gần – xa; phần C "Who is…?"; kết thúc *We are…*; tạo bài bằng prompt (dán bài JSON kiểu `doing` thì đã nhận và có xem trước).
