# SPEC v1.0 — Mục mới "Câu nói hằng ngày" (Phrases)

> Phiên bản spec: **1.0 (đã chốt)** · Ngày: 2026-10-09 · Dựa trên app hiện tại (SPEC.md v0.12, app 0.1.15)
> - draft2: video bố mẹ quay chuyển sang bản 1.1.
> - draft3: sửa theo review — offline/giọng nói, từ khóa bắt buộc, định danh câu và lưu ảnh/khung hình, hiệu ứng theo loại hình, không trừ sao, thu nhỏ phạm vi 1.0-a, bổ sung test.
> - Chốt 2026-10-09: các câu hỏi mục 13 theo đề xuất.
> - **1.0-a đã làm xong (app 0.2.0)**: nút Phrases, danh sách bài câu, tạo bài câu, xem trước, trang bài câu (đổi hiệu ứng, Câu dùng trong ngày), cảnh Bông + emoji với 18 hiệu ứng, luồng A–D, tiến độ câu, bài mẫu Morning. Ghi chú kỹ thuật: 1.0-a chưa cần kho mới nên **chưa nâng cấp IndexedDB**; kho `phraseImages`/`frameSets` sẽ thêm cùng 1.0-b.

**Phạm vi kỹ thuật:** đây là một **mục học mới bên trong web app hiện tại** (cùng link GitHub Pages, cùng app trên Màn hình chính), không phải app riêng. Dùng chung dữ liệu (tiến độ, sticker, giới hạn thời gian, Góc bố mẹ, sao lưu, chia sẻ bài) và dùng lại khung học, Bông, giọng đọc, mic, nút ▶, Học tiếp/Học lại, Hoan hô, cắt ảnh lưới.

Bản nâng cấp này **thêm một mục học mới** bên cạnh bài học từ vựng hiện có. Mục từ vựng giữ nguyên, dùng chung danh sách bài, tiến độ, sticker, Học tiếp/Học lại, chia sẻ bài và sao lưu.

## 1. Mục tiêu

- Bé 3 tuổi học **câu ngắn dùng hằng ngày** thay vì từ đơn: *Open the door*, *Put on your shirt*, *Wash your face*, *Brush your teeth*…
- **Mục tiêu học chính là hiểu và làm theo** (nghe "Clap your hands!" → bé vỗ tay), nói lại được là mục tiêu phụ. Bé chưa nói được cả câu vẫn là học tốt.
- Giữ nguyên các nguyên tắc của app: **0 đồng**, không server, **không có mạng vẫn học được trọn bài**, AI chỉ là công cụ soạn bài cho bố mẹ, **không bao giờ phạt bé** vì nói sai, chọn sai hay im lặng — kể cả trong trò chơi, tiến độ và ôn tập.

**Tiêu chí thành công của 1.0-a:** học được một bài câu từ đầu đến cuối **chỉ với emoji + hiệu ứng chuyển động**, không cần tạo ảnh, không có mạng vẫn không bị kẹt; và bé hiểu, làm theo được.

### Ngoài phạm vi 1.0
- Video bố mẹ quay / chọn video → bản **1.1** (chưa thiết kế dữ liệu, sẽ làm spec riêng khi cần).
- Câu kể / câu trả lời của bé (*I'm washing my face*) → bản 1.1.
- App tự gọi AI tạo video hoặc ảnh (cần API trả phí).
- Câu dài trên 5 từ, ngữ pháp, chấm điểm phát âm.

## 2. Hình chuyển động

| Phương án | Quyết định |
|---|---|
| **Hiệu ứng chuyển động có sẵn** (mục 2.2) trên emoji/ảnh | ✅ **Mặc định cho mọi câu**, có ngay từ 1.0-a |
| **Ảnh tĩnh** do AI vẽ (Bông làm hành động) | ✅ 1.0-b |
| **Truyện tranh lật nhanh (flipbook)** từ 1 ảnh lưới 2–4 khung | ✅ 1.0-b, khuyên dùng |
| AI tạo video | ❌ Không dựa vào (giới hạn bản miễn phí) |
| Video bố mẹ quay | ⏳ Bản 1.1 |

**Thứ tự hiển thị cho mỗi câu:** flipbook (nếu có) → ảnh tĩnh (nếu có) → emoji. Hiệu ứng chuyển động áp theo loại hình đang hiển thị (mục 2.2).

### 2.1. Thỏ Bông làm "diễn viên"
- Ảnh tĩnh và flipbook đều vẽ **thỏ Bông làm hành động**, theo Character Bible (`bong.md`): lông trắng kem, tai trong hồng nhạt, mắt to long lanh, má hồng.
- Câu có "your" (*Wash your face*) vẫn vẽ Bông làm, vì đây là lời Bông nói với bé và Bông làm mẫu.

### 2.2. Hiệu ứng chuyển động (`motion`)
Màn hình câu ở 1.0-a là một **cảnh nhỏ do app dựng**: **Bông (SVG của app, điều khiển được từng bộ phận)** đứng cạnh **vật** (emoji của câu). Vì app tự vẽ Bông nên các hiệu ứng có nhân vật luôn đúng; hiệu ứng có vật chỉ di chuyển/biến đổi emoji của vật.

Mỗi hiệu ứng khai báo **cần gì** và **dùng được với loại hình nào**. Không đủ điều kiện thì dùng hiệu ứng dự phòng, không bao giờ "đoán" hiệu ứng trên hình không hợp.

| `motion` | Cảnh do app dựng (emoji) | Cần | Trên ảnh tĩnh / flipbook | Ví dụ |
|---|---|---|---|---|
| `open` / `close` | Emoji vật xoay như cánh cửa mở / đóng, tia sáng; Bông chỉ tay | emoji vật | `pulse` | open the door |
| `put-on` / `take-off` | Emoji vật bay xuống / lên khỏi người Bông | emoji vật | `pulse` | put on your shirt |
| `wash` | Bọt nước quanh mặt Bông, hai tay Bông xoa | — | `pulse` | wash your face |
| `brush` | Bàn chải (🪥) chải qua lại trước Bông | — | `pulse` | brush your teeth |
| `eat` / `drink` | Emoji vật nhỏ dần / nghiêng gần miệng Bông | emoji vật | `pulse` | drink your milk |
| `turn-on` / `turn-off` | Emoji vật sáng lên / tối đi | emoji vật | `glow` | turn on the light |
| `sit-down` / `stand-up` | Bông hạ xuống / bật lên | — | `bounce` | sit down |
| `wave` / `clap` / `jump` / `sleep` / `go` | Bông vẫy tay / vỗ tay / nhảy / ngủ (z bay) / đi ngang | — | `bounce` | clap your hands |
| `none` | Bông và vật nhún nhẹ | — | `bounce` | (dự phòng) |

- Ảnh tĩnh và flipbook **đã có Bông làm hành động trong hình**, nên chỉ dùng hiệu ứng nhẹ, an toàn cho mọi hình: `pulse` (phóng nhẹ), `bounce` (nhún), `glow` (sáng lên).
- `motion` lạ hoặc thiếu emoji vật mà hiệu ứng cần → dùng `none`.
- Bố mẹ đổi được `motion` của từng câu trong Góc bố mẹ, có xem trước.

### 2.3. Flipbook từ ảnh lưới (1.0-b)
- Mỗi câu có thể có **một bộ khung hình** gồm 2–4 khung là các bước của hành động.
- Bố mẹ: **"Copy prompt khung hình"** → AI vẽ 1 ảnh lưới → **"Chọn ảnh khung hình"** → app dùng lại phần cắt ảnh lưới đã có (tìm đường kẻ, đổi kiểu lưới, chọn thứ tự khung, bỏ khung lỗi) → **xem trước flipbook** → bấm Lưu mới ghi vào máy.
- Có thể gộp **cả bài vào 1 ảnh lưới** (mỗi hàng một câu, mỗi cột một bước) để tiết kiệm lượt tạo ảnh.
- Phát: mỗi khung ~0,7 giây, chuyển mờ, khung cuối dừng lâu hơn, lặp 2 lần trong lúc Bông đọc câu. Chạm vào hình thì phát lại.

## 3. Cách dạy

- **Câu yêu cầu ngắn 2–4 từ** (tối đa 5): *Open the door*, *Put on your shirt*, *Let's wash your face*.
- **TPR — nghe và làm theo** là trọng tâm: nghe câu → xem Bông làm → bé làm theo → (nếu được) nói theo.
- **Theo sinh hoạt trong ngày:** Morning, Getting dressed, Going out, Bath time, Meal time, Bedtime, Playtime.
- **Nói theo từng cụm:** *Wash… your face… Wash your face!*
- **Dùng ngoài app:** mỗi bài có "Câu dùng trong ngày" để bố mẹ nói đúng câu đó khi bé làm thật.
- **Mặc định 4 câu mỗi bài** (khoảng 5 phút); bố mẹ chọn 6 câu khi bé đã quen.

## 4. Định dạng bài câu (JSON do AI trả về)

Bài JSON **chỉ chứa nội dung và hướng dẫn tạo hình** (prompt). Ảnh và khung hình thật do bố mẹ thêm sau và **lưu riêng trong IndexedDB** (mục 9), không nằm trong JSON.

```json
{
  "version": 2,
  "kind": "phrases",
  "title": "Morning",
  "titleVi": "Buổi sáng",
  "emoji": "🌅",
  "routine": true,
  "phrases": [
    {
      "id": "p1",
      "en": "Wash your face",
      "vi": "Rửa mặt",
      "emoji": "🧼",
      "motion": "wash",
      "requiredKeywords": ["wash"],
      "keywords": ["face"],
      "chunks": ["Wash", "your face"],
      "imagePrompt": "Bông the bunny washing her face with water and bubbles, …",
      "framePrompts": ["Bông turns on the tap", "Bông splashes water on her face", "Bông smiles with a clean face"]
    }
  ],
  "commands": ["p1", "p2"]
}
```

| Trường | Ý nghĩa |
|---|---|
| `kind` | `"phrases"`. Bài từ vựng cũ không có `kind` → coi là `"words"`. |
| `phrases[].id` | Mã câu trong bài (`p1`, `p2`…). AI không ghi thì app tự đặt theo thứ tự. **Ảnh và khung hình gắn theo mã này.** |
| `motion` | Một giá trị trong bảng 2.2 (danh sách cố định). |
| `requiredKeywords` | Từ/cụm **bắt buộc** để tính "nói được câu" — thường là động từ hoặc cụm động từ (*wash*, *put on*). |
| `keywords` | Từ bổ sung (danh từ…), chỉ làm kết quả "khớp" chắc chắn hơn, không đủ để tính "nói được". |
| `chunks` | Các cụm để Bông đọc từng cụm; **ghép lại phải đúng bằng câu**, không thì app tự chia. |
| `imagePrompt`, `framePrompts` | Chỉ là **hướng dẫn để bố mẹ nhờ AI vẽ**, không phải ảnh. |
| `routine` | `true` khi các câu có thứ tự trước–sau. **Thứ tự = thứ tự trong mảng `phrases`** (prompt yêu cầu AI xếp đúng thứ tự). |
| `commands` | Danh sách **mã câu** dùng cho trò "Bông says" (1.0-b); phải là mã có trong `phrases`. Không có thì dùng tất cả. |

**Quy tắc kiểm tra** (lỗi nặng từ chối, lỗi nhẹ tự sửa + cảnh báo, giống bài từ vựng):
- Lỗi nặng: thiếu `title` hoặc `phrases`; ít hơn 2 câu; câu thiếu `en` hoặc `vi`.
- Lỗi nhẹ: câu dài hơn 5 từ (cảnh báo); `motion` lạ → `none`; thiếu `requiredKeywords` → app lấy từ đầu tiên không phải từ phụ (thường là động từ); thiếu hoặc trùng `id` → app đặt lại; `chunks` ghép không ra câu → bỏ, app tự chia; trùng câu → giữ câu đầu; quá 8 câu → giữ 8; `framePrompts` quá 4 → giữ 4; `commands` có mã lạ → bỏ mã đó.

## 5. Luồng học một bài câu

Cùng khung màn hình với bài từ vựng (🏠, thanh tiến độ, Bông, nút ▶ bỏ qua). Lưu chỗ dừng sau mỗi bước.

**A. Xem và nghe** (từng câu)
1. Hiện cảnh của câu (mục 2). Chữ tiếng Anh ở dưới, cụm đang đọc được tô màu.
2. Bông đọc từng cụm rồi cả câu, hiệu ứng chạy theo.
3. Chạm vào hình thì phát lại.

**B. Làm theo (TPR)** — bước quan trọng nhất
1. Bông: *"Your turn! Wash your face!"*, Bông làm mẫu nhỏ.
2. Bé làm động tác; **bé hoặc bố mẹ chạm nút ✔ to**.
3. Bông khen. Không chạm sau 15 giây thì Bông làm mẫu lại một lần rồi đi tiếp; không trừ gì.
4. Chạm ✔ nhiều lần chỉ tính một lần.

**C. Nói theo** — tùy chọn, không bao giờ làm kẹt bài
1. Bông: *"Can you say: Wash your face?"*, nghe tối đa 7 giây.
2. Kết quả:
   - **recognized** (nói được): nhận dạng giọng nói nghe ra **ít nhất một từ/cụm trong `requiredKeywords`** (so khớp lỏng như hiện tại, cụm nhiều chữ khớp theo cụm). Chỉ nói danh từ ("face") **không** tính là nói được câu, nhưng vẫn được khen "Good try!".
   - **heard_speech** (có tiếng): có tiếng nhưng không nhận ra từ bắt buộc, hoặc máy không có nhận dạng. Chỉ có nghĩa là bé đã lên tiếng, không chứng minh bé nói đúng.
   - **silent** (im lặng): mic hoạt động nhưng không có tiếng → Bông đọc lại từng cụm, nghe thêm một lần.
   - **unavailable** (không nghe được): không có mic, bị từ chối quyền, mic lỗi → **chế độ chỉ nghe** như hiện tại (*"Your turn!"*, chờ 3 giây, đọc mẫu, đi tiếp). **Lỗi mic, quyền hay mạng không bao giờ được tính là im lặng.**
3. Bông luôn đọc lại câu chuẩn rồi đi tiếp.

**D. Chọn hình đúng câu**
- *"Which one is 'wash your face'?"* — 2–3 cảnh nhỏ, bé chạm. Chạm sai: hình lắc nhẹ, Bông đọc câu của hình đó, mời chọn lại; sai 2 lần thì hình đúng phát sáng rồi đi tiếp.

**E. Xếp thứ tự** (1.0-b, chỉ bài `routine`) — 3 thẻ xáo trộn, *"What comes first?"*, bé **chạm lần lượt** (không kéo thả).

**F. Bông says** (1.0-b) — Bông ra 3–4 lệnh liên tiếp từ `commands`, bé làm, chạm ✔. Không có câu bẫy.

Kết thúc: **Hoan hô** + sticker như bài từ vựng.

### 5.1. Offline, giọng đọc, nhận dạng giọng nói
- **Giọng đọc:** dùng giọng có sẵn trên máy (chạy offline). Không có giọng tiếng Anh thì app cảnh báo bố mẹ (đã có) và **vẫn học được**: chữ câu hiện to, mỗi bước chờ thêm vài giây rồi đi tiếp; không bước nào bắt buộc phải nghe được giọng.
- **Nhận dạng giọng nói:** là phần **thêm**; chỉ bật khi trình duyệt có và chạy được; trên iOS cần mạng — mất mạng hoặc báo lỗi thì tắt cho cả buổi (đã có). Góc bố mẹ ghi rõ "cần mạng".
- **Không bước nào chặn bài:** nút ▶ luôn bỏ qua được; bước C luôn đi tiếp dù kết quả là gì.
- Toàn bộ code, emoji, hiệu ứng nằm trong app (service worker), nên không mạng vẫn mở và học được bài đã lưu.

## 6. Màn hình

### 6.1. Màn hình chính
- Thêm nút **💬 Phrases / Câu nói** (Bông vẫy tay). Bố cục 2×2 nút to + nút Sticker ở dưới; trên iPhone dọc là 2 cột × 2 hàng.

### 6.2. Danh sách bài câu
- Giống danh sách bài từ vựng: tab chủ đề, số ⭐, Học tiếp/Học lại, số bài, hàng emoji các câu.

### 6.3. Góc bố mẹ
- **Tạo bài câu**: tình huống (Morning, Getting dressed, Going out, Bath time, Meal time, Bedtime, Playtime, tự gõ), số câu (**4** / 6), trình độ (2–3 từ / 3–5 từ) → Copy prompt → Dán bài → Xem trước (🔊 + xem trước hiệu ứng) → Lưu.
- **Trang bài câu**: đổi tên/chủ đề/số bài, đổi `motion` từng câu (có xem trước), "Câu dùng trong ngày".
- 1.0-b: ảnh tĩnh từng câu, khung hình từng câu, ảnh lưới cả bài.
- 1.0-c: chia sẻ bài / nhập bài kèm ảnh và khung hình.

## 7. Prompt

### 7.1. Prompt tạo bài câu
Ngoài các luật chung (chỉ trả JSON, tránh câu đã có ở bài khác…):
- Đúng N câu yêu cầu 2–5 từ cho tình huống, dùng hằng ngày với bé 3 tuổi.
- Tình huống có thứ tự thì **xếp đúng thứ tự** và đặt `"routine": true`.
- `id`: `p1`, `p2`… theo thứ tự.
- `motion`: chọn **một** giá trị trong danh sách cố định (liệt kê đủ).
- `requiredKeywords`: động từ / cụm động từ chính; `keywords`: danh từ chính.
- `chunks`: ghép lại phải đúng bằng câu.
- `emoji`: emoji của **vật** (🚪, 👕, 🥛…) để hiệu ứng có vật dùng được.
- `imagePrompt`, `framePrompts`: Bông làm hành động, mô tả cụ thể, theo Character Bible.

### 7.2. Prompt khung hình (1.0-b)
Dùng lại khuôn prompt ảnh lưới hiện có, thêm: mỗi ô là một bước của cùng một hành động; **cùng nhân vật, cùng góc nhìn, cùng khung cảnh, cùng màu**, chỉ tư thế đổi; mô tả Bông cố định; khi gộp cả bài thì mỗi hàng một câu.

### 7.3. Prompt "cô giáo" cho câu (1.0-c)
Dùng câu của bài; mời bé làm động tác ("Show me! Wash your face!"), dùng câu trong tình huống giả vờ.

## 8. Tiến độ (sao thành thạo)

- Mỗi câu có tiến độ như một từ, khóa là `phrase:<câu viết thường>`. Cùng một câu ở nhiều bài thì **dùng chung tiến độ** (học ở bài nào cũng được tính). Ảnh/khung hình thì riêng theo bài và mã câu.
- ⭐ (0–5) là **điểm thành thạo tích lũy**, chỉ tăng khi có bằng chứng học, **không bao giờ bị trừ** ở mục câu:
  - **Chọn đúng hình ngay lần đầu** (trò D): +1, tối đa **một lần mỗi câu mỗi lượt học**.
  - **Làm theo + chạm ✔** (B, F): +1, tối đa **một lần mỗi câu mỗi ngày**, chỉ đưa tới tối đa 2⭐.
  - **Nói được** (recognized ở C): +1, tối đa một lần mỗi câu mỗi ngày, chỉ đưa tới tối đa 2⭐. `heard_speech` không cộng sao.
  - Muốn 3⭐ trở lên ("thuộc") phải chọn đúng hình.
- Chọn sai, im lặng, không nghe được: **không trừ**; chỉ ghi vào **lịch sử lượt chơi** của câu (`attempts`: số lần chọn đúng ngay, số lần chọn sai) để bố mẹ xem và để Ôn tập ưu tiên câu khó.
- Bài từ vựng **giữ cách tính hiện tại** (có −1 khi chọn sai), đã chốt ở câu hỏi 13.5.

## 9. Dữ liệu (IndexedDB phiên bản 2)

| Kho | Nội dung |
|---|---|
| `lessons` | Thêm `kind`. Bài câu có `phrases[]` (mỗi câu có `id`), `routine`, `commands`. |
| `phraseImages` (mới, 1.0-b) | Ảnh tĩnh của câu: `id`, `lessonId`, `phraseId`, `data` (ArrayBuffer), `mimeType`, `width`, `height`, `createdAt`. Mỗi `lessonId + phraseId` một ảnh. |
| `frameSets` (mới, 1.0-b) | Bộ khung hình của câu: `id`, `lessonId`, `phraseId`, `frames: [{ data, mimeType, width, height }]` theo đúng thứ tự phát, `createdAt`. Lưu **cả bộ trong một bản ghi** nên không bao giờ có bộ khung lưu dở. Mỗi `lessonId + phraseId` một bộ. |
| `progress` | Dùng chung; câu có khóa `phrase:…` và thêm `attempts`. |

- Kho `images` hiện tại **chỉ dùng cho từ vựng**, không dùng cho câu (tránh lẫn câu với từ).
- Nâng cấp tự động khi mở app (thêm bước nâng cấp thứ 2 trong `db.js`); bài từ vựng, ảnh, ghi âm, tiến độ, sticker giữ nguyên.
- Ảnh/khung hình chỉ ghi vào máy **sau khi bố mẹ xem trước và bấm Lưu**; lưu bài câu không cần ảnh.
- Ảnh/khung hình không đọc được → hiện emoji + hiệu ứng (giống cách xử lý ảnh lỗi hiện có).
- Không thiết kế trước kho video (bản 1.1 sẽ có spec riêng).

**Sao lưu và chia sẻ (1.0-c):** thêm `phraseImages/`, `frameSets/` vào file zip; file mới `format: 2`. File sao lưu và file bài cũ (format 1) vẫn khôi phục/nhập được; app cũ gặp file mới thì báo cần cập nhật (đã có).

## 10. Rủi ro

| Rủi ro | Cách xử lý |
|---|---|
| Nhận dạng giọng nói không chạy offline / kém với câu | Chỉ là phần thêm; không bước nào phụ thuộc; mục tiêu chính là làm theo (B) |
| Khớp sai khi bé chỉ nói danh từ | `requiredKeywords`; chỉ nói danh từ không tính "nói được" |
| Hiệu ứng không hợp với hình | Bảng 2.2: hiệu ứng khai báo điều kiện; ảnh/flipbook chỉ dùng hiệu ứng nhẹ; dự phòng `none`; bố mẹ đổi được |
| AI vẽ các khung không đồng bộ | Prompt cố định nhân vật/góc nhìn; xem trước flipbook rồi mới lưu; bỏ khung lỗi |
| Bé không tự chạm ✔ | Bố mẹ chạm thay; tự đi tiếp sau 15 giây; không trừ |
| Sao tăng quá nhanh vì một câu xuất hiện ở nhiều trò | Giới hạn cộng theo lượt học / theo ngày (mục 8) |
| Ảnh/khung hình làm đầy bộ nhớ | Ảnh thu nhỏ 512px như hiện tại; xử lý bộ nhớ đầy như hiện tại (bỏ qua lưu, cảnh báo bố mẹ) |

## 11. Kế hoạch làm theo giai đoạn

| Giai đoạn | Nội dung | Điều kiện hoàn thành |
|---|---|---|
| **1.0-a (MVP)** | Nâng cấp DB (giữ nguyên bài từ vựng); kiểm tra JSON bài câu; prompt tạo bài câu; nút Phrases; danh sách bài câu; tạo → xem trước → lưu; **cảnh emoji + hiệu ứng `motion`**; luồng **A–D**; tiến độ câu; Học tiếp/Học lại; **1 bài mẫu Morning, 4 câu** (*Wake up*, *Wash your face*, *Brush your teeth*, *Put on your shirt*) | Học hết một bài câu chỉ với emoji/hiệu ứng, tắt mạng không kẹt, bài từ vựng cũ không đổi. **Cho bé dùng thử** để biết bé có hiểu và làm theo được không trước khi làm tiếp |
| **1.0-b** | Ảnh tĩnh; flipbook (prompt khung hình, cắt ảnh lưới, xem trước, đổi thứ tự, bỏ khung lỗi); ảnh lưới cả bài; trò E (Xếp thứ tự) và F (Bông says); kiểm tra hiệu năng/bộ nhớ trên máy thật | Chỉ bắt đầu khi 1.0-a ổn định |
| **1.0-c** | Chia sẻ/nhập/sao lưu kèm ảnh và khung hình; Ôn tập chung từ + câu; prompt "cô giáo" cho câu; test hồi quy toàn app | Bản 1.0 đầy đủ |
| *1.1* | *Video bố mẹ quay; câu kể/câu trả lời* | *Spec riêng* |

Mỗi giai đoạn đưa lên GitHub Pages để thử trên iPhone trước khi làm giai đoạn sau.

## 12. Kế hoạch test

**Tự động (theo giai đoạn tương ứng):**

| Nhóm | Test |
|---|---|
| JSON bài câu | Lỗi nặng/nhẹ, `motion` lạ, câu quá 5 từ, thiếu/trùng `id`, `chunks` sai, `commands` mã lạ, bài cũ không có `kind` |
| Nhận dạng | Chỉ nói danh từ → không "nói được"; thiếu động từ; nói gần đúng; cụm "put on"; kết quả rỗng; từ chối quyền mic → `unavailable` (không phải `silent`) |
| Offline | Mở app khi không có mạng; học hết bài; giọng đọc / nhận dạng không có vẫn đi tiếp được; nút ▶ |
| Dữ liệu | Nâng cấp DB khi đang có bài từ vựng, ảnh, ghi âm; bài cũ học bình thường sau nâng cấp; nhập bài thiếu ảnh/khung |
| Tiến độ | Chạm ✔ nhiều lần chỉ +1; một câu ở nhiều trò không cộng quá giới hạn; chọn sai không trừ; học lại; câu dùng chung tiến độ giữa các bài |
| Ảnh/flipbook (1.0-b) | Lưới sai số ô, đường kẻ không rõ, ảnh lớn, khung trống, đổi thứ tự khung, bộ khung lưu trọn vẹn |
| Giao diện iOS | Chuyển app khi đang phát, khóa màn hình, tải lại trang, xoay màn hình, chạm liên tiếp |
| Hồi quy | Bài từ vựng, sticker, sao, Học tiếp, sao lưu/khôi phục, nhập file phiên bản cũ |

**Thủ công trên iPhone/iPad:**
- [ ] Bé hiểu và làm theo được câu chỉ với emoji + hiệu ứng (tiêu chí của 1.0-a).
- [ ] Hiệu ứng mượt trên máy thật.
- [ ] Bé hoặc bố mẹ chạm ✔ có tự nhiên không.
- [ ] Flipbook từ ảnh Gemini thật: khung đồng bộ, cắt đúng (1.0-b).

**Số đo cần lấy trên máy thật trước khi chốt ngưỡng** (không đặt số tùy ý): thời gian mở một bài câu, độ mượt khi chuyển khung flipbook, dung lượng trung bình một bộ khung hình, hành vi khi bộ nhớ gần đầy.

## 13. Câu hỏi đã chốt

| # | Câu hỏi | Quyết định | Trạng thái |
|---|---|---|---|
| 1 | Vị trí mục Phrases | **Nút riêng thứ 4** trên màn hình chính | ✅ Đã chốt 2026-10-09 |
| 2 | Nhân vật trong hình | **Bông làm mẫu** | ✅ Đã chốt 2026-10-09 |
| 3 | Video bố mẹ quay | Để bản 1.1 | ✅ Đã chốt 2026-10-09 |
| 4 | Trò "Bông says" | **Để sau MVP** (1.0-b), bố mẹ chạm ✔ thay được | ✅ Đã chốt 2026-10-09 |
| 5 | Sao khi chọn sai | **Không trừ** ở mục câu; bài từ vựng giữ cách tính hiện tại (−1) | ✅ Đã chốt 2026-10-09 |
| 6 | Nội dung câu 1.0 | **Chỉ câu yêu cầu**; câu kể để 1.1 | ✅ Đã chốt 2026-10-09 |
| 7 | Số câu mỗi bài | **Mặc định 4**, tùy chọn 6 | ✅ Đã chốt 2026-10-09 |
