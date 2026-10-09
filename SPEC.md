# SPEC — App học tiếng Anh cho bé (iPad, dùng cá nhân)

> Phiên bản: 0.12 (sửa theo góp ý sau lần chạy thử thứ ba) · Ngày: 2026-10-08

## 1. Mục tiêu

App chạy trên **iPad** cho bé 3 tuổi học tiếng Anh theo kiểu **nghe → nói lại**. App chỉ dùng trong gia đình, không đưa lên App Store.

- Bố mẹ tạo bài học bằng **ChatGPT hoặc Gemini bản miễn phí** (trên web hoặc app), sau đó dán vào app.
- Bài học được **lưu trong iPad**, bé mở lại học bao nhiêu lần cũng được và học được cả khi không có mạng.
- **Chi phí: 0 đồng.** Không server, không cơ sở dữ liệu online, không API AI, không đăng nhập.

**AI chỉ là công cụ soạn bài cho bố mẹ.** Với bé, người dạy là thỏ **Bông** 🐰.

```
Bố mẹ → ChatGPT/Gemini (miễn phí) → JSON → copy/dán → App (iPad) → IndexedDB
```

### Ngoài phạm vi bản 1 (để sau)
- Nói chuyện với AI theo thời gian thực (cần API trả phí). Ở bản 1, Góc bố mẹ có nút **copy prompt "cô giáo"** để bố mẹ tự dùng với ChatGPT/Gemini Voice.
- App tự gọi AI tạo bài hoặc tạo hình.
- Chấm điểm phát âm.
- Đồng bộ nhiều máy, tài khoản đăng nhập.
- Nhiều hồ sơ cho nhiều bé. Bản 1 dành cho **một bé** (một bộ tiến độ, một bộ sticker).

## 2. Công nghệ

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Dạng app | **PWA** (chọn "Thêm vào Màn hình chính" trên iPad) | Không cần Mac/Xcode, không hết hạn sau 7 ngày như cài app thủ công |
| Code | HTML + CSS + JavaScript thuần (ES modules), **không framework, không bước build** | Copy thư mục `app/` lên host là chạy |
| Giọng đọc | Web Speech API `speechSynthesis` | Lấy danh sách giọng qua `getVoices()`, **chọn theo ngôn ngữ** (en-US, vi-VN), không ghi cứng tên giọng. **Loại các giọng hiệu ứng/robot của iOS** (Albert, Bad News, Zarvox…, giọng Eloquence như Eddy, Grandpa…), ưu tiên giọng Premium → Enhanced → Siri → giọng thường. Không có giọng vi-VN thì bỏ qua phần đọc nghĩa tiếng Việt. Không có giọng en-US thì dùng giọng `en-*` bất kỳ. Thường chạy offline, nhưng còn tùy giọng nào đã cài trên iPad |
| Nghe bé nói | **Lõi:** đo âm lượng mic (`getUserMedia` + Web Audio) để biết bé có lên tiếng hay không. **Bổ sung:** `SpeechRecognition` nếu trình duyệt có và chạy được | Xem mục 4.3.1. App phải học được trọn vẹn khi **không có** nhận dạng giọng nói |
| Ghi âm giọng bé | `MediaRecorder`, **chọn định dạng lúc chạy** bằng `isTypeSupported` theo thứ tự `audio/mp4` → `audio/webm;codecs=opus` → `audio/webm` | Lưu kèm `mimeType` cùng bản ghi |
| Lưu dữ liệu | **IndexedDB**. Ảnh và ghi âm lưu dạng **ArrayBuffer** + `mimeType` (không dùng base64, **không lưu Blob** vì Safari iOS có lúc không đọc lại được Blob trong IndexedDB); khi hiển thị/phát mới dựng lại Blob | Mô hình dữ liệu ở mục 2.1. Bản ghi cũ dạng Blob tự chuyển đổi khi mở app |
| Chạy offline | Service Worker cache toàn bộ phần code | |
| Font, âm thanh, icon | Font tròn miễn phí **Nunito** hoặc **Baloo 2** (giấy phép OFL, có tiếng Việt), đặt sẵn trong `app/fonts/`. Tiếng "ding", vỗ tay... **tạo bằng Web Audio** nên không cần file. Icon vẽ bằng SVG | Không tải gì từ mạng, không lo bản quyền |
| Sao lưu | File `.zip`, tạo bằng thư viện **JSZip** đặt sẵn trong `app/vendor/` (không tải từ mạng) | Mục 4.6 |
| Host (bắt buộc HTTPS để dùng mic) | **GitHub Pages**: `https://hanhtran2410.github.io/kid-english/` | Host **chỉ chứa code, icon, font và bài mẫu**. Không có dữ liệu cá nhân nào trên host. Deploy thư mục `app/` bằng **GitHub Actions** (GitHub Pages thường chỉ phục vụ `/` hoặc `/docs`). App chạy dưới đường dẫn con `/kid-english/` nên mọi đường dẫn trong code (kể cả service worker, manifest) là **đường dẫn tương đối** |
| Test | `node:test` cho phần logic; Playwright trên Chrome máy tính; cuối cùng test tay trên iPad (soi lỗi qua Safari Web Inspector trên Mac mini) | |

### 2.1. Mô hình dữ liệu (IndexedDB)

| Kho dữ liệu | Nội dung chính |
|---|---|
| `lessons` | `id` (app tự tạo bằng `crypto.randomUUID()`), `createdAt`, `updatedAt` (lần bố mẹ sửa gần nhất: tên, chủ đề, ảnh), `no` (số thứ tự bài), `timesCompleted`, `topic` (chủ đề để chia tab; không có thì lấy theo tên bài), `resume` (chỗ đang học dở: `{ stage, index, savedAt }`, hoặc `null`), cùng toàn bộ nội dung bài (mục 3.1) |
| `images` | `id`, `lessonId`, `word`, `data` (ArrayBuffer), `mimeType`, `width`, `height`, `createdAt`. Mỗi từ của mỗi bài chỉ một ảnh (ảnh mới nhất) |
| `recordings` | `id`, `lessonId`, `word`, `date`, `data` (ArrayBuffer), `mimeType`, `durationMs` |
| `progress` | khóa là từ tiếng Anh (viết thường): `mastery` (0–5), `practiceCount`, `lastPracticedAt`, `lastVoiceDay` (ngày gần nhất được cộng điểm vì lên tiếng), `emoji` |
| `stickers` | khóa là mã sticker: `firstEarnedAt`, `count` (số lần nhận được) |
| `settings` | dạng `{ key, value }`: lần gần nhất mỗi từ được đưa vào prompt (`reviewUsedAt`, để xoay vòng từ cần ôn), tên nhân vật, giọng đọc, tốc độ, bật/tắt tiếng Việt, bật/tắt ghi âm, bật/tắt nhận dạng giọng nói, giới hạn thời gian, lần sao lưu gần nhất, ngày dùng app lần đầu, đã thêm bài mẫu chưa, trạng thái buổi học, lần báo bộ nhớ đầy |

**Không dùng `id` do AI tạo.** Khi nhập bài, app kiểm tra JSON, tự tạo UUID mới rồi mới lưu.

## 3. Cách tạo bài học (luồng miễn phí)

1. Trong **Góc bố mẹ**, bấm **"＋ Tạo bài học"** và chọn trong form:
   - 📚 **Chủ đề**: chọn nhanh (Animals, Food, Colors, Toys, Family, Vehicles, At the park...) hoặc tự gõ.
   - 👶 **Tuổi**: mặc định 3.
   - ⏱️ **Thời lượng**: 5 / **10** / 15 phút, tương ứng **4 / 6 / 8 từ** (gọi là N).
   - 🎯 **Trình độ**: Mới bắt đầu / Đã biết ít.
   - 🎨 **Kiểu bài**: Vui nhộn / Kể chuyện.
   - ☑️ **Từ cần ôn** (tối đa 2 từ): app **tích sẵn 2 từ chưa thuộc** (mục 4.7) theo cách **xoay vòng** — từ vừa đưa vào prompt gần đây thì nhường cho từ chưa thuộc khác, hết vòng thì quay lại. Bố mẹ **bỏ tích / tích từ khác** được, kể cả **bất kỳ từ nào trong các bài đã có** (hữu ích khi tạo bài trên máy tính, nơi không có tiến độ học thật của bé; muốn có thì khôi phục "Gộp" file sao lưu từ máy bé học). Các từ này được **thêm vào `words`** ngoài N từ mới, nên bài có tối đa N+2 từ.
2. Bấm **"Copy prompt"**. App ghép các lựa chọn thành một prompt hoàn chỉnh và copy **ngay trong lúc chạm** (Safari iOS chặn copy nếu đã qua một bước chờ). Prompt cũng hiện trong một ô để copy tay nếu cần, kèm nút **Mở ChatGPT** / **Mở Gemini**.
   - Để **không trùng từ** giữa các bài, prompt liệt kê các từ bé đã có ở bài khác (tối đa 80 từ, trừ từ cần ôn) và dặn AI không dùng lại. Khi dán bài, nếu vẫn có từ trùng thì app cảnh báo (vẫn cho lưu).
3. AI trả về một đoạn JSON. Copy toàn bộ.
4. Quay lại app, bấm **"Dán bài"**, dán vào. App hiện **bản xem trước** (mục 4.6), bố mẹ bấm **Lưu**.
   - App tự bỏ các ký tự thừa mà AI hay thêm (` ```json `, lời chào...).
   - Nếu sai định dạng, app báo lỗi dễ hiểu, ví dụ *"Từ số 3 thiếu nghĩa tiếng Việt"*.
5. **(Tùy chọn)** Thêm hình cho từng từ: tạo hình bằng ChatGPT/Gemini, lưu vào Ảnh của iPad, sau đó trong app bấm vào từ → **"Chọn ảnh"**.
   - App tự thu nhỏ ảnh xuống 512px và lưu dạng Blob.
   - **Ảnh lưới (khuyên dùng):** bản AI miễn phí giới hạn số lần tạo ảnh, nên app có nút **"Copy prompt ảnh lưới"**: nhờ AI vẽ **1 ảnh** chứa tất cả các từ theo **lưới vuông** (tối đa 4 từ → 2×2, tối đa 9 từ → 3×3, 10–12 từ → 4×3; ô thừa để trống) vì AI thường vẽ ảnh vuông, sau đó **"Chọn ảnh lưới"**:
     - App **tự đoán lưới thật trong ảnh**, vì AI hay vẽ khác số cột yêu cầu: ưu tiên **tìm các đường kẻ xám** chạy suốt ảnh và **cắt theo đúng vị trí đường kẻ**; ảnh không có đường kẻ thì đếm số cột/hàng có hình (cách này dễ sai khi hình chạm đường kẻ). Bố mẹ **đổi được "Kiểu lưới"** nếu app đoán sai.
     - Mỗi ô có **ô chọn từ** (mặc định theo thứ tự; ô thừa là "bỏ qua"), để sửa khi AI xếp lộn thứ tự hoặc vẽ thừa. Chọn trùng một từ cho 2 ô thì app báo lỗi.
     - Xem trước rồi mới lưu.
     - Prompt ảnh lưới: lưới **phủ kín ảnh, các ô bằng nhau** (mỗi ô đúng 1/3 chiều rộng…), **đúng số đường kẻ** (ví dụ 2 dọc + 2 ngang), mỗi hình **chiếm khoảng 70% ô và không chạm đường kẻ**, cùng một phong cách cho mọi ô, số lượng trong mô tả phải vẽ đúng; viết **theo hàng** (ROW 1: Cell 1 — Mom: …), **ghi rõ vị trí ô trống** (hàng, cột), **mỗi từ kèm mô tả hình đầy đủ (không cắt cụt)** lấy từ `imagePrompt` của bài, có luật **"mỗi ô chỉ vẽ vật của ô đó"** (tránh vẽ lẫn như mây trong ô "rain"), và chỉ có **đường xám giữa các ô, không viền ngoài**. Prompt tạo bài dặn AI viết `imagePrompt` là **mô tả cụ thể, phân biệt với các từ khác** trong bài.
6. **(Tùy chọn) Tạo bài trên máy tính rồi chuyển sang iPad/iPhone:** mở cùng link app trên máy tính, tạo bài và thêm ảnh (dễ thao tác hơn), bấm **"Chia sẻ bài"** để xuất file **`<số bài>-<tên>.zip`**, ví dụ `03-animals.zip` (số đứng đầu, tên ngắn để không bị cắt "…"; chỉ gồm bài và ảnh, không có ghi âm hay tiến độ), gửi sang máy của bé (AirDrop, iCloud, Zalo…), rồi trên máy đó vào **Quản lý bài → "Nhập bài từ file"**.
   - **Chia sẻ lại sau khi sửa** (đổi tên, chủ đề, thay ảnh): nhập file trên máy kia sẽ **cập nhật bài đã có** (không tạo bài trùng). "Bài đã có" là bài cùng mã, **hoặc cùng danh sách từ** (ví dụ bài đã tạo riêng trên máy kia bằng cách dán lại đoạn trả lời của AI); giữ số ⭐ và chỗ đang học dở của máy đó. Chỉ bản sửa **mới hơn** mới ghi đè; mỗi từ chỉ giữ **một ảnh — ảnh mới hơn**; nhập lại file cũ thì không đổi gì.
   - **Số bài:** mỗi bài có số thứ tự (#01, #02…) do app tự đánh theo thứ tự tạo, bố mẹ sửa được; số đi theo file sang máy kia. **"Đã nhập gần đây"** trong Quản lý bài ghi tên file, thời gian, kết quả và bài nào — để biết file nào đã nhập.
   - Dữ liệu **không tự đồng bộ** giữa các máy (không có server): mỗi máy, và cả tab Safari với app trên Màn hình chính, giữ dữ liệu riêng.
   - **Nếu không có ảnh, app hiển thị emoji to.** Bài học dùng được ngay mà không cần tạo ảnh.

### 3.1. Định dạng bài học (JSON do AI trả về)

```json
{
  "version": 1,
  "title": "Farm Animals",
  "titleVi": "Con vật ở nông trại",
  "emoji": "🐄",
  "words": [
    {
      "en": "cow",
      "vi": "con bò",
      "emoji": "🐄",
      "sentence": "The cow says moo!",
      "imagePrompt": "Cute children's flashcard illustration of a cow, ..."
    }
  ],
  "conversation": [
    { "word": "cow", "teacher": "Look! What's this?", "child": "It's a cow!" },
    { "word": "cow", "teacher": "What does a cow say?", "child": "Moo moo!" }
  ],
  "questions": [
    { "ask": "Which one says moo?", "answer": "cow" }
  ],
  "story": [
    { "text": "Old MacDonald has a farm." },
    { "text": "On the farm, there is a cow." },
    { "text": "The cow says moo!", "repeat": "Moo moo!" }
  ]
}
```

Quy tắc kiểm tra chia 2 mức: **lỗi nặng thì từ chối bài**, **lỗi nhẹ thì app tự sửa** và hiện cảnh báo màu vàng ở màn xem trước.

Trước khi đọc JSON, app tự làm sạch: bỏ ` ```json ` và lời chào, đổi dấu nháy cong `“ ”` thành `"`, bỏ dấu phẩy thừa ở cuối. So sánh từ luôn **không phân biệt hoa/thường và bỏ khoảng trắng thừa** ("Cow " = "cow"). Từ nhiều chữ như "ice cream" dùng bình thường.

**Lỗi nặng (từ chối, báo lỗi dễ hiểu):**
- Không đọc được JSON. Nếu JSON bị cắt dở (thiếu ngoặc đóng): *"Bài bị cắt dở, hãy nhắn AI: continue"*.
- Thiếu `title` hoặc `words`; `words` có ít hơn 2 từ.
- Từ thiếu `en` hoặc `vi`.

**Lỗi nhẹ (tự sửa + cảnh báo):**
| Lỗi | App tự sửa |
|---|---|
| `words` nhiều hơn 12 từ | Giữ 12 từ đầu |
| Trùng `en` | Giữ từ đầu tiên |
| Từ thiếu `emoji` | Dùng 🖼️ (bố mẹ có thể thêm ảnh) |
| Bài thiếu `emoji` | Dùng emoji của từ đầu tiên |
| `conversation` quá 24 lượt / `questions` quá 12 câu / `story` quá 10 câu | Cắt bớt phần thừa |
| Lượt hội thoại có `word` không có trong bài, câu hỏi có `answer` không có trong bài | Bỏ lượt / câu hỏi đó |
| Câu `child` quá 5 từ | Vẫn giữ (chỉ cảnh báo) |
| `repeat` quá 3 từ | Bỏ `repeat`, câu đó bé chỉ nghe |
| `story` dạng mảng chuỗi | Nhận, coi như không có `repeat` |
| Thiếu từ cần ôn đã yêu cầu | Vẫn nhận (chỉ cảnh báo) |
| Đã có bài cùng tên | Vẫn cho lưu (chỉ cảnh báo) |

- Trường lạ (kể cả `id`) bị bỏ qua. `version` thiếu thì coi là 1; lớn hơn 1 thì từ chối.

### 3.2. Prompt tạo bài (app ghép sẵn)

Prompt yêu cầu AI:
- Chỉ trả về JSON đúng định dạng ở trên, không kèm lời giải thích.
- Tạo **đúng N từ** theo thời lượng đã chọn. Từ phải phù hợp với tuổi và trình độ; câu tối đa 6 từ.
- Hội thoại: 2 lượt cho mỗi từ, theo mẫu "What's this? → It's a ___. → What does it say / What color is it? → ...", chỉ dùng từ trong bài.
- Câu hỏi chỉ hỏi về các từ trong bài.
- Truyện lặp lại các từ trong bài. Câu nào có cụm dễ bắt chước (tiếng kêu, tên con vật) thì điền vào `repeat`. Độ dài và cách viết tùy **Kiểu bài**:
  - 🎉 **Vui nhộn**: truyện **3 câu**, nhiều tiếng kêu (*"Moo moo!"*), từ tượng thanh và câu rủ bé làm động tác (*"Jump like a frog!"*, *"Clap, clap!"*). Hầu hết các câu có `repeat`. Hội thoại theo mẫu chung ở trên.
  - 📖 **Kể chuyện**: truyện **5–6 câu** có mở đầu, diễn biến và kết thúc, một nhân vật đi qua lần lượt các từ trong bài. Hội thoại **xoay quanh truyện** (*"Who did the bunny see?" → "A cow!"*), nhưng câu `child` vẫn tối đa 5 từ và vẫn chứa từ khóa `word`.
- Nếu có danh sách "từ cần ôn": **thêm các từ đó vào `words`** (ngoài N từ mới, giữ nguyên `en`) và dùng chúng một cách tự nhiên trong hội thoại hoặc truyện.
- `imagePrompt` theo một phong cách cố định để cả bộ hình đồng bộ.

## 4. Màn hình

### 4.1. Màn hình chính (bé)
- 3 nút rất to, có hình **và chữ giải thích**: tiếng Anh to ở trên, tiếng Việt nhỏ ở dưới — **📚 Lessons / Bài học**, **⭐ Review / Ôn tập**, **🐰 Learn with Bông / Học cùng Bông**; nút **🎁 My Stickers / Sticker của bé**.
- 1 nút **🎁 Bộ sưu tập sticker** (mục 4.8), nhỏ hơn 3 nút chính nhưng vẫn đủ to cho bé bấm.
- Góc trên có biểu tượng ⚙️ nhỏ (kèm chữ "Bố mẹ (giữ 3 giây)") dẫn vào **Góc bố mẹ**, mở bằng cách **nhấn giữ 3 giây** để bé không vào nhầm. Bấm nhẹ thì hiện dòng nhắc cách mở.
- Phần của bé không có: cài đặt, xóa, tạo bài, chữ "AI" hay bất kỳ chi tiết kỹ thuật nào.

### 4.2. Danh sách bài học
- Lưới thẻ to: emoji hoặc ảnh bìa, tên bài và **hàng emoji các từ trong bài** (để bé chưa biết đọc vẫn phân biệt được các bài cùng chủ đề).
- **Tên bài không trùng:** bài mới trùng tên bài đang có thì app tự đặt **"Animals 2"**, **"Animals 3"**… (khi lưu bài, nhập bài, đổi tên).
- **Tab chủ đề:** một hàng tab ở trên, **⭐ All** + mỗi chủ đề **đã có bài** (emoji + tên, ví dụ 🐶 Animals). Nhiều chủ đề thì **vuốt ngang**, không xuống dòng. Chỉ có 1 chủ đề thì ẩn hàng tab. Chủ đề lấy từ ô "Chủ đề" lúc tạo bài; bố mẹ sửa được trong Quản lý bài. App nhớ tab đang chọn trong buổi.
- Mỗi thẻ có số ⭐ cho biết bé đã học xong bài này mấy lần.
- Bài đang học dở có thanh tiến độ nhỏ trên thẻ. Bấm vào bài đó thì hiện **2 nút to, chỉ có hình**:
  - ▶️ **Học tiếp**: vào lại đúng phần và câu đang dừng.
  - 🔄 **Học lại**: học từ đầu bài.
  - Bông đọc gợi ý *"Continue? Or start again?"*. Bố mẹ có thể chọn giúp bé.
- App lưu chỗ dừng sau **mỗi bước** (mỗi thẻ từ, lượt hội thoại, câu hỏi, câu truyện), nên đóng app bất kỳ lúc nào cũng không mất chỗ. Học xong bài thì xóa chỗ dừng.
- Điểm `mastery` và ghi âm của những bước đã học được lưu ngay, không phụ thuộc bé học tiếp hay học lại.

### 4.3. Học bài: 4 phần nối tiếp nhau

Phần nào bài không có (không có `conversation`, `questions` hoặc `story`) thì bỏ qua. Riêng phần C: nếu không có `questions`, app tự tạo câu *"Where is the cow?"* từ các từ trong bài (bài về màu sắc thì *"Which one is red?"*).

Cả bài có **nhân vật dẫn dắt cố định**: thỏ **Bông** 🐰 (tên đổi được trong Cài đặt). Bông được **vẽ riêng bằng SVG** theo Character Bible (lông trắng kem, tai trong hồng nhạt, mắt to long lanh, má hồng, miệng cười; vẫy tai khi vui), không dùng emoji 🐰 vì emoji trên iOS màu xám. Icon app cũng dùng hình này. Bông xuất hiện ở góc màn hình, nhún nhảy khi "nói" và vỗ tay khi khen. Khi nói tiếng Anh, Bông xưng **"I"** và không tự gọi tên mình (giọng tiếng Anh đọc "Bông" thành "Bong"); tên chỉ hiện trên màn hình.

#### 4.3.1. Cách app "nghe" bé (dùng chung cho mọi phần có mic)

```
Bông hỏi xong → bật mic (tối đa 5–6 giây)
   │
   ├─ Đo âm lượng (luôn chạy)                → có tiếng / im lặng
   └─ SpeechRecognition (chỉ khi có và chạy được) → nghe ra chữ gì
   │
   ▼
Kết quả:
   • KHỚP      : nhận dạng ra đúng hoặc gần đúng từ → "Great job!" + sao bay
   • CÓ TIẾNG  : có tiếng nhưng không nhận ra chữ (hoặc máy không có nhận dạng) → "Good try!"
   • IM LẶNG   : không có tiếng → "Let's try!" và Bông nói mẫu
   │
   ▼
Mọi trường hợp: Bông **nói lại câu chuẩn** để bé nghe, rồi đi tiếp
```

- **Không bao giờ hiện hay nói "sai".**
- App chỉ bắt đầu nghe **sau khi Bông nói xong khoảng 0,3 giây**, để mic không thu nhầm tiếng Bông. Bé chạm liên tục trong lúc Bông đang nói thì app bỏ qua, không nhảy bước.
- **Chế độ chỉ nghe** (không có mic, bố mẹ bấm "Không cho phép", hoặc mic lỗi): Bông nói *"Your turn!"*, chờ 3 giây, đọc lại câu mẫu, khen nhẹ rồi đi tiếp. Không bao giờ nói "Let's try!" lặp lại. Góc bố mẹ hiện hướng dẫn bật lại mic.
- App tự kiểm tra một lần mỗi buổi xem nhận dạng giọng nói có dùng được không. Nếu báo lỗi, không có, hoặc tranh mic với phần ghi âm thì **tắt hẳn cho cả buổi**, chỉ dùng đo âm lượng. **Đang học mà nhận dạng báo lỗi** (ví dụ mất mạng giữa buổi) thì cũng tắt cho cả buổi còn lại.
- Ngưỡng âm lượng tự hiệu chỉnh theo **tiếng ồn nền đo liên tục lúc không ai nói** (không chỉ đo 0,5 giây đầu, vì bé có thể nói ngay).
- Nhận dạng giọng nói có công tắc trong Cài đặt (mặc định bật). Trên iOS, nhận dạng gửi giọng bé lên máy chủ Apple để xử lý; tắt đi thì app chỉ đo âm lượng.

**A. Thẻ từ (nghe và nói lại)**, lặp cho từng từ:
1. Hiện hình hoặc emoji to toàn màn hình, chữ tiếng Anh ở dưới. Thẻ đầu tiên của bài: Bông nói *"Listen and say!"* một lần.
2. App đọc *"Cow!"* rồi **bật mic ngay** để bé nói theo (bé hay nói luôn sau khi nghe từ). Nếu bố mẹ bật đọc nghĩa tiếng Việt trong Cài đặt thì app đọc *"con bò!"* trước khi bật mic (mặc định **tắt**).
3. Bông làm động tác "đang nghe", vòng sóng âm chuyển động theo giọng bé. **Bé chưa nói gì** thì Bông mới hỏi *"Can you say cow?"* và nghe thêm một lần. Kết quả xử lý theo mục 4.3.1.
4. Sau khi Bông đọc lại từ, **tự sang thẻ tiếp sau khoảng 1 giây**. Bé chạm vào hình thì app đọc lại từ và chờ thêm.
5. Giọng bé được ghi lại: tối đa 1 bản ghi cho mỗi từ mỗi ngày, lưu **bản ghi đầu tiên có tiếng**. Lượt bé im lặng thì không lưu.

**B. Hội thoại cùng Bông (theo kịch bản có sẵn)**

AI đã viết sẵn kịch bản lúc soạn bài, app chỉ diễn lại, nên bé không thể kéo cuộc trò chuyện ra ngoài bài học.
1. Hiện hình của `word`. Bông đọc câu `teacher`: *"Look! What's this?"*.
2. Nghe bé theo mục 4.3.1. "Khớp" nghĩa là nhận ra từ khóa `word` **hoặc** một từ chính trong câu `child` (ví dụ lượt `child: "Moo moo!"` thì nhận ra "moo" là khớp).
3. Sau đó Bông luôn **nói câu mẫu `child` đầy đủ**: *"Yes! It's a cow!"*. Nếu bé im lặng: *"Say: It's a cow!"* và chờ thêm một lần, sau đó đi tiếp.
4. Câu mẫu `child` hiện mờ ở dưới hình. Bé chạm vào thì app đọc câu đó.

**C. Trò chơi (chọn hình)**
- App đọc *"Which one says moo?"* và hiện 2–3 hình để chọn (1 hình đúng, còn lại lấy ngẫu nhiên từ các từ khác).
- Bé chạm đúng → khen. Chạm sai → hình đó lắc nhẹ, app đọc *"That's a dog. Try again!"*.
- **Sai 2 lần**: hình đúng phát sáng, Bông nói *"This is the cow!"* rồi đi tiếp.
- Áp dụng giống vậy cho trò "Find the…" ở Ôn tập.

**D. Truyện**
- Mỗi màn hình một câu, chữ to, từ khóa trong bài được tô màu và có emoji đi kèm. Bông đọc câu.
- **Không bắt bé nói lại cả câu.** Chỉ những câu có `repeat` mới bật mic: *"The cow says moo! … Your turn: Moo moo!"*. Bé nói theo cụm ngắn đó, kết quả xử lý theo mục 4.3.1.
- Câu không có `repeat` thì bé chỉ nghe, rồi tự sang câu tiếp.

Kết thúc bài: màn hình **"Hoan hô!"** kèm 1 sticker tặng bé. **Hộp quà mở nắp, sticker bay vào hộp, nắp đóng lại và hộp lắc lắc**, sau đó mới hiện nút ✔ (mục 4.8). Màn "Hoan hô!" của Ôn tập và Học cùng Bông cũng tặng sticker như vậy.

### 4.4. Ôn tập
- "Từ đã học" là từ có `practiceCount > 0`. Chưa có từ nào thì nút ⭐ hiện mờ, bấm vào Bông nói *"Let's learn a lesson first!"*.
- Một từ có ở nhiều bài: dùng ảnh mới nhất, không có ảnh thì dùng emoji.
- Lấy 6 từ (có ít hơn 6 thì lấy hết) từ tất cả các bài đã học, theo thứ tự ưu tiên:
  1. Từ **chưa thuộc** (`mastery` < 3).
  2. Từ **lâu chưa gặp** (`lastPracticedAt` quá 7 ngày).
  3. Từ ngẫu nhiên.
- 2 trò chơi đan xen:
  - **"Find the…"**: app nói tên một từ, bé chạm vào hình đúng.
  - **"What's this?"**: hiện hình, bé nói tên (nghe theo mục 4.3.1).
  - Chỉ có 1 từ đã học thì chỉ chơi "What's this?" ("Find the…" cần ít nhất 2 hình).

### 4.5. Học cùng Bông
- Bông hỏi đáp với bé bằng các đoạn **hội thoại** (phần B) lấy từ các bài đã lưu. Ưu tiên bài mới học và từ chưa thuộc. Bài nào không có hội thoại thì dùng mẫu *"What's this?" → "It's a ___!"*.
- Mỗi lượt khoảng 6–8 câu hỏi rồi kết thúc bằng màn hình "Hoan hô!".

### 4.6. Góc bố mẹ
- **＋ Tạo bài học**: form tạo prompt (mục 3) → **Dán bài** → **Xem trước** → Lưu.
- **Xem trước**: danh sách từ kèm emoji hoặc ảnh, hội thoại, trò chơi, truyện. Mỗi câu có nút 🔊 để nghe thử. Chỉ sau khi Lưu bài mới hiện cho bé.
- **Copy prompt "cô giáo"**: để bố mẹ dùng với ChatGPT/Gemini Voice, ngoài app. Prompt gồm: vai cô giáo dạy bé 3 tuổi, nói chậm, câu ngắn, khen nhiều; danh sách từ của bài gần nhất và các từ chưa thuộc.
- **Quản lý bài**: xem, đổi tên, xóa, thêm hoặc đổi ảnh từng từ, copy `imagePrompt` của từng từ, **ảnh lưới** (1 ảnh cho cả bài, app tự cắt), **Chia sẻ bài** (xuất file bài kèm ảnh) và **Nhập bài từ file** (mục 3).
  - **Xóa bài**: hỏi xác nhận, sau đó xóa bài cùng **ảnh và ghi âm** của bài đó. **Giữ nguyên tiến độ** (`progress`), vì tiến độ tính theo từ và từ đó có thể có ở bài khác.
- **Bé đã học**: bảng tiến độ từng từ (mục 4.7).
- **Nghe lại giọng bé**: danh sách bản ghi, bấm ▶️ để nghe. Ghi âm **không tự xóa**, bố mẹ tự quản lý:
  - **Lọc** theo: bài học, từ, khoảng ngày (hôm nay / 7 ngày / 30 ngày / cũ hơn X ngày / tự chọn từ ngày–đến ngày).
  - **Xóa từng bản ghi**: nút 🗑️ trên mỗi dòng.
  - **Xóa nhiều**: chế độ chọn có ô ☑️ trên từng dòng và nút **Chọn tất cả** (chọn hết các bản ghi **đang hiện theo bộ lọc**), rồi bấm **Xóa (n)**.
  - Mọi lần xóa đều hỏi xác nhận và ghi rõ số bản ghi, ví dụ *"Xóa 23 bản ghi của bài Farm Animals?"*.
  - Hiện tổng số bản ghi và dung lượng đang dùng, ví dụ *"152 bản ghi · 18 MB"*.
- **Cài đặt**:
  - Tên nhân vật (mặc định Bông): hiện trên nút **"Learn with … / Học cùng …"** ở màn hình chính và các dòng chữ trong Góc bố mẹ. Khi nói tiếng Anh nhân vật xưng "I" nên không đọc tên. Tên app trên Màn hình chính iPhone ("Bông") là cố định.
  - Chọn giọng đọc tiếng Anh, lọc theo ngôn ngữ trong danh sách giọng của máy.
  - Bật hoặc tắt việc đọc nghĩa tiếng Việt (mặc định: **tắt**, chỉ đọc tiếng Anh).
  - Tốc độ đọc (mặc định 0.8, chậm hơn bình thường).
  - Bật hoặc tắt ghi âm.
  - Bật hoặc tắt nhận dạng giọng nói (mặc định: bật; xem mục 4.3.1).
  - **Chỉ bật mic khi đang nghe bé** (mặc định: tắt). Bật thử nếu tiếng Bông bị rè/nhỏ, vì khi mic mở iOS chuyển loa sang chế độ gọi thoại (mục 6).
  - Giới hạn thời gian mỗi buổi: 15 / 20 / 30 phút hoặc **Tắt** (mặc định 15 phút). Đây là giới hạn **mềm**:
    - Hết giờ khi bé đang học dở thì **cho học hết bài đó**, không cắt ngang.
    - Học xong bài, Bông ngáp và nói *"I'm sleepy! Bye-bye!"* kèm hình Bông ngủ, phần của bé tạm khóa.
    - Áp dụng giống vậy cho Ôn tập và Học cùng Bông: hết giờ thì cho chơi hết lượt đang chơi.
    - Thời gian chỉ tính khi app đang mở trên màn hình, bé không bị tạm dừng vì bỏ đi (mục 4.9), và **không tính thời gian ở Góc bố mẹ**.
    - Nếu bé còn hứng thú, bố mẹ **nhấn giữ 3 giây** nút 🌙 để **cho học thêm 15 phút**. Bấm được nhiều lần.
    - Một buổi mới bắt đầu (bộ đếm về 0) khi app không được dùng quá 1 tiếng.
  - Thông tin chẩn đoán: máy có nhận dạng giọng nói không, định dạng ghi âm đang dùng, danh sách giọng đọc. Phục vụ việc test trên iPad.
- **Sao lưu / Khôi phục**:
  - Xuất ra file `kid-english-backup-YYYY-MM-DD.zip`. Ô ☑️ **"Kèm ghi âm"** (mặc định bật), hiện trước dung lượng ước tính.
  - Làm **2 bước**: bấm **"Tạo bản sao lưu"** (app tạo file zip, có thể mất vài giây) → bấm **"Lưu file"** để mở bảng Chia sẻ (Web Share) lưu vào Files/iCloud. Lý do: iOS chỉ cho mở bảng Chia sẻ ngay sau một lần chạm. Nếu không chia sẻ được thì tải về.
  - Cấu trúc file:
    ```
    manifest.json        ← phiên bản định dạng, ngày xuất, số lượng
    lessons/<id>.json
    images.json          ← thông tin từng ảnh (bài, từ, kích thước, tên file)
    images/<id>.<ext>
    recordings.json      ← thông tin từng bản ghi (bài, từ, ngày, độ dài, tên file)
    recordings/<id>.<ext>
    progress.json
    stickers.json
    settings.json
    ```
  - Khôi phục: chọn file zip. Hỏi bố mẹ **gộp** với dữ liệu hiện có hay **thay thế** toàn bộ.
    - **Gộp**: bài, ảnh, ghi âm trùng `id` thì giữ bản đang có. Tiến độ từng từ lấy `mastery` và `practiceCount` cao hơn, `lastPracticedAt` mới hơn. Sticker lấy `count` cao hơn. Cài đặt giữ bản đang có.
    - **Thay thế**: hỏi xác nhận 2 lần.
    - App **kiểm tra toàn bộ file zip trước** rồi mới ghi, nên file hỏng thì dữ liệu hiện có không bị ảnh hưởng. File của phiên bản định dạng mới hơn app thì từ chối. Giọng đọc trong cài đặt không có trên máy mới thì tự chọn lại theo ngôn ngữ.
  - Nhắc sao lưu nếu đã quá 7 ngày từ lần sao lưu gần nhất: hiện trong Góc bố mẹ và thêm **chấm nhỏ trên nút ⚙️** ở màn hình chính.
- Có sẵn **2 bài mẫu** (Animals, Colors) để chạy thử ngay. Bài mẫu chỉ được thêm **một lần** ở lần chạy đầu; bố mẹ xóa thì không tự quay lại, có nút **"Thêm lại bài mẫu"**.
- **Phiên bản app**: hiện số phiên bản. Có bản mới thì app tải ngầm và áp dụng ở lần mở sau, không cắt ngang khi bé đang học; có nút **"Cập nhật ngay"**.

### 4.7. Tiến độ từng từ
Mỗi từ lưu 3 chỉ số: `mastery` (0–5), `practiceCount` (số lần đã gặp), `lastPracticedAt` (lần gặp gần nhất). Giao diện chỉ hiện ⭐ cho dễ nhìn, ví dụ 🐶 dog ⭐⭐⭐⭐⭐ · gặp 12 lần · 3 ngày trước.

Cách tính `mastery`: không dựa vào việc bé "nói đúng", vì máy nghe giọng trẻ em không đáng tin.
- **Chọn đúng hình ngay lần đầu** trong trò chơi hoặc ôn tập: +1.
- **Chọn sai**: **từ đúng** (từ bé chưa nhận ra) bị −1. Từ bé chạm nhầm không bị trừ. Mỗi câu hỏi chỉ trừ một lần, không xuống dưới 0.
- **Có lên tiếng** khi tới lượt nói từ đó: +1, tối đa một lần mỗi ngày cho mỗi từ. Điểm từ việc lên tiếng **chỉ đưa từ lên tối đa 2⭐** (vì tiếng TV, anh chị em cũng có thể bị tính là "có tiếng"). Muốn đạt 3⭐ trở lên ("thuộc") thì bé phải **chọn đúng hình** trong trò chơi.
- **Không trừ điểm vì lâu không học.** Thời gian chỉ dùng để ưu tiên ôn tập (qua `lastPracticedAt`).
- `practiceCount` +1 cho mỗi từ ở mỗi lượt học bài, ôn tập hoặc Học cùng Bông có từ đó. "Mỗi ngày" tính theo ngày giờ của máy.
- Chọn 2 từ cần ôn cho prompt tạo bài: từ có `mastery` thấp nhất; bằng nhau thì lấy từ lâu chưa gặp hơn. Chỉ xét từ đã học (`practiceCount > 0`).

Phân biệt hai trường hợp:
- **Chưa thuộc** (`mastery` < 3): được đưa vào prompt khi tạo bài mới và được ưu tiên số 1 khi ôn tập.
- **Lâu chưa gặp** (quá 7 ngày): được ưu tiên số 2 khi ôn tập.

### 4.8. Bộ sưu tập sticker
- Bộ sticker có sẵn khoảng **40 sticker** dạng emoji to (con vật, đồ ăn, xe cộ, ngôi sao...). Đi kèm trong code nên chạy offline và không lo bản quyền. Mỗi sticker có tên tiếng Anh, ví dụ 🦁 *"lion"*.
- Mỗi lần được tặng, app **ưu tiên sticker bé chưa có**. Có đủ bộ rồi thì tặng ngẫu nhiên, sticker đó hiện số ×2, ×3...
- Màn hình bộ sưu tập: lưới sticker to. Sticker đã có thì có màu, **hiện tên tiếng Anh bên dưới** (ví dụ *Lion*) và số lần nhận ở góc (×3); chưa có thì hiện bóng xám kèm dấu ❓ để bé tò mò, không hiện tên.
- Bé chạm vào sticker đã có: sticker nảy lên và Bông đọc tên tiếng Anh, ví dụ *"Lion!"*. Bé học thêm từ mới khi chơi.
- Bé không xóa được sticker. Trong Góc bố mẹ → **Sticker của bé**: xem bé có những sticker nào, **bớt từng sticker** hoặc **xóa hết** (có hỏi xác nhận), dùng khi bố mẹ lỡ học thử thay bé.

### 4.9. Xử lý tình huống bất thường

| Tình huống | App xử lý |
|---|---|
| Mở app trong **tab Safari** thay vì từ Màn hình chính | Hiện nhắc *"Hãy mở từ Màn hình chính"*. Lý do: Safari và app trên Màn hình chính **lưu dữ liệu riêng, không chung**; ngoài ra app trên Màn hình chính không bị iOS tự xóa dữ liệu sau 7 ngày không dùng như tab Safari |
| **Màn hình tự tắt** giữa bài (iPad đặt tự khóa sau 30 giây–1 phút) | Trong lúc học, app giữ màn hình sáng bằng Screen Wake Lock API. iOS không hỗ trợ thì README hướng dẫn chỉnh Tự động khóa lâu hơn |
| **Bé vuốt thoát** khỏi app | App web không chặn được. README hướng dẫn bật **Truy cập được hướng dẫn** (Guided Access) để khóa iPad trong app |
| **Chọn ảnh lỗi** (quá lớn, định dạng lạ, không đọc được) | Báo *"Không đọc được ảnh này, hãy chọn ảnh khác"*; từ đó vẫn dùng emoji |
| **Bé bỏ đi**, không chạm gì | Sau 20 giây Bông gọi *"Hello? Tap me!"*. Sau 2 phút thì tạm dừng, không tính vào thời gian học; chạm vào thì học tiếp |
| App bị **chuyển sang nền** (cuộc gọi, mở app khác, khóa màn hình) | Dừng nghe và ghi âm (bỏ bản ghi dở). Khi quay lại, iOS đã tắt âm thanh và mic nên app hiện nút **"Bắt đầu"** để mở lại, rồi học tiếp đúng chỗ |
| Giọng đọc iOS **không báo đã đọc xong** | Mỗi câu có thời gian chờ tối đa tính theo độ dài câu, hết thời gian thì đi tiếp để app không bị treo |
| Danh sách giọng đọc rỗng lúc mới mở | Chờ sự kiện `voiceschanged` rồi mới chọn giọng |
| Máy **không có giọng tiếng Anh nào** | Cảnh báo ở màn "Bắt đầu" và trong Góc bố mẹ, kèm hướng dẫn tải giọng |
| **Bộ nhớ đầy** khi lưu ghi âm hoặc ảnh | Bỏ qua việc lưu, bé vẫn học bình thường; Góc bố mẹ hiện cảnh báo |
| Bố mẹ **từ chối quyền mic** | Chế độ chỉ nghe (mục 4.3.1) |
| Gạt **nút im lặng** trên iPhone | Tiếng "ding" có thể mất; ghi trong README |
| **Nhấn giữ** trên iOS bật bôi đen chữ hoặc kính lúp | Tắt bôi đen chữ và menu nhấn giữ trên toàn app để nhấn giữ 3 giây hoạt động đúng |
| Có phiên bản app mới, cấu trúc IndexedDB thay đổi | Tự chuyển dữ liệu cũ sang cấu trúc mới khi mở app |

## 5. Yêu cầu giao diện cho bé 3 tuổi
- Nút bấm tối thiểu 120×120 px, khoảng cách giữa các nút rộng.
- Gần như không có chữ trên phần của bé, dùng hình và icon.
- Màu tươi, nền dịu, chữ tiếng Anh dùng font tròn và dễ đọc.
- Mọi thao tác đều có âm thanh phản hồi.
- Không có nút nào làm bé "mất bài" (không có xóa). Nút 🏠 **bấm là về màn hình chính**; chỗ đang học đã được lưu nên lần sau chọn "Học tiếp" được.
- Trong lúc học (bài học, Ôn tập, Học cùng Bông), nút ▶ **luôn hiện**: bấm là bỏ qua phần đang làm (Bông dừng nói/nghe) và sang bước tiếp ngay. Màn Hoan hô không có nút ▶.
- Màn hình chính có chữ giải thích dưới mỗi nút.
- Ưu tiên iPad xoay ngang, xoay dọc vẫn dùng được.
- **iPhone (màn dọc) cũng phải dùng được đầy đủ**: giai đoạn đầu sẽ test trên iPhone vì chưa có iPad. Giao diện co giãn theo màn hình, nút vẫn đủ to cho bé bấm.

## 6. Rủi ro kỹ thuật cần test sớm trên iPad thật

| Rủi ro | Cách xử lý |
|---|---|
| `SpeechRecognition` có thể không chạy khi mở app từ Màn hình chính, hoặc nghe giọng bé rất kém | Đã thiết kế là phần bổ sung (mục 4.3.1). Lõi là đo âm lượng; app tự tắt nhận dạng nếu không dùng được |
| Nhận dạng giọng nói và ghi âm cùng dùng mic có thể tranh nhau | Kiểm tra trong lần tự kiểm tra đầu buổi. Nếu xung đột thì ưu tiên ghi âm và đo âm lượng |
| iPad có thể hỏi quyền mic mỗi lần mở app | Chỉ xin quyền mic **một lần** sau nút "Bắt đầu" và **giữ mic mở suốt buổi**, không mở/đóng theo từng câu. Ghi vào hướng dẫn: bố mẹ bấm "Cho phép" ở lần đầu mỗi buổi |
| Khi mic đang mở, **iPhone có thể phát tiếng qua loa thoại** (rất nhỏ) | Test sớm trên iPhone. Nếu gặp thì bỏ việc giữ mic suốt buổi, chỉ mở mic trong lúc nghe bé |
| iOS chặn phát âm thanh nếu chưa có thao tác chạm | Màn hình đầu có nút **"Bắt đầu"** to để "mở khóa" âm thanh và mic. Giọng đọc được mở khóa **ngay trong lúc chạm, trước mọi bước chờ** |
| Giọng đọc iOS thỉnh thoảng bị kẹt, không phát tiếng | Không gọi `cancel()` ngay trước `speak()` khi không có câu nào đang đọc (Safari hay nuốt câu mới); câu không bắt đầu sau 1,5 giây thì gỡ kẹt (`cancel` + `resume`) và đọc lại một lần; quay lại từ nền thì gỡ kẹt; cập nhật lại giọng khi `voiceschanged` |
| Tên và chất lượng giọng đọc khác nhau tùy iPad | Chọn giọng theo ngôn ngữ, không ghi cứng tên. Hướng dẫn tải giọng Enhanced/Premium miễn phí trong Cài đặt iPad → Trợ năng → Nội dung được đọc |
| Định dạng ghi âm khác nhau tùy phiên bản iPadOS | Chọn định dạng lúc chạy, lưu kèm `mimeType` |
| Safari iOS có lúc không đọc lại được Blob đã lưu trong IndexedDB (ảnh hiện thành biểu tượng hỏng) | Lưu ảnh/ghi âm dạng ArrayBuffer; ảnh vẫn lỗi thì hiện emoji thay thế |
| Dữ liệu trong trình duyệt không được coi là lưu trữ vĩnh viễn | Gọi `navigator.storage.persist()` lúc khởi động. Sao lưu ra file zip và nhắc sao lưu mỗi tuần |

## 7. Cấu trúc thư mục

```
D:\kid-english\
├── SPEC.md
├── README.md                    ← hướng dẫn chạy, đưa lên host, cài vào iPad
├── package.json                 ← chỉ dùng cho test (app không có bước build)
├── playwright.config.js
├── .github\workflows\deploy.yml ← GitHub Actions: chạy test rồi deploy thư mục app\ lên GitHub Pages
├── app\                         ← toàn bộ nội dung đưa lên host
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js                    ← service worker (chạy offline)
│   ├── icons\                   ← icon.svg và PNG cho Màn hình chính
│   ├── csspp.css
│   ├── fonts\                   ← font tròn Nunito (OFL)
│   ├── lessons\                 ← 2 bài mẫu (animals.json, colors.json)
│   ├── vendor\jszip.min.js
│   └── js│       ├── main.js              ← khởi động, đăng ký màn hình
│       ├── bong.js              ← thỏ Bông vẽ bằng SVG
│       ├── app.js               ← trạng thái chung, điều hướng, thời gian buổi học, giữ màn hình sáng, app bị chuyển sang nền
│       ├── db.js                ← IndexedDB
│       ├── settings.js          ← cài đặt mặc định, nhắc sao lưu
│       ├── lesson.js            ← làm sạch và kiểm tra JSON bài học
│       ├── match.js             ← so khớp lỏng câu bé nói với từ cần nói
│       ├── progress.js          ← tính mastery, chọn từ để ôn
│       ├── prompts.js           ← ghép prompt tạo bài và prompt "cô giáo"
│       ├── backup.js            ← xuất/nhập file zip
│       ├── stickers.js          ← danh sách sticker, chọn sticker để tặng
│       ├── session.js           ← giới hạn thời gian mỗi buổi
│       ├── samples.js           ← thêm bài mẫu
│       ├── image.js             ← thu nhỏ ảnh xuống 512px
│       ├── text.js              ← chuẩn hóa chữ, khóa ngày
│       ├── timing.js            ← chờ có thể hủy, chế độ chạy nhanh cho test (?fast)
│       ├── ui.js                ← hàm dựng giao diện, nút nhấn giữ
│       ├── speech│       │   ├── tts.js           ← giọng đọc, chọn giọng theo ngôn ngữ
│       │   ├── microphone.js    ← xin quyền mic, đo âm lượng, tiếng ồn nền
│       │   ├── recognition.js   ← SpeechRecognition (nếu có)
│       │   ├── recorder.js      ← ghi âm, chọn định dạng
│       │   ├── sfx.js           ← tiếng "ding", vỗ tay... tạo bằng Web Audio
│       │   └── listen.js        ← gộp các phần trên → KHỚP / CÓ TIẾNG / IM LẶNG / CHỈ NGHE
│       ├── player│       │   ├── lesson-player.js ← chạy lần lượt các phần của bài, lưu chỗ dừng
│       │   ├── plan.js          ← thứ tự bước, Học tiếp, chọn lựa chọn, lượt Học cùng Bông
│       │   ├── teacher.js       ← Bông: nói, nghe, khen, chờ bé chạm, gọi bé khi bé bỏ đi
│       │   ├── layout.js, stage-kit.js, visuals.js, track.js
│       │   ├── vocabulary-stage.js
│       │   ├── conversation-stage.js
│       │   ├── quiz-stage.js
│       │   ├── story-stage.js
│       │   └── completion-stage.js
│       └── screens│           ├── child.js         ← Bắt đầu, màn hình chính, danh sách bài, sticker, Bông đi ngủ
│           ├── review.js, learn.js
│           └── parent\          ← menu, tạo/dán bài, quản lý bài, ghi âm, cài đặt, sao lưu
├── scripts\                     ← serve.mjs (server thử), make-icons.mjs, screens.mjs (chụp màn hình)
└── tests    ├── unit\                    ← test logic (node:test)
    └── ui\                      ← test giao diện (Playwright)
```

## 8. Kế hoạch test

**Tự động (trên máy tính):**
- `lesson.js`:
  - JSON hợp lệ thì nhận; `id` của AI bị bỏ, app tự tạo UUID.
  - JSON bọc trong ` ```json ` hoặc kèm lời chào vẫn đọc được.
  - `story` dạng mảng chuỗi vẫn nhận.
  - Lỗi nặng (thiếu `title`/`words`, ít hơn 2 từ, từ thiếu `en`/`vi`, JSON bị cắt dở) thì từ chối và báo lỗi đúng chỗ.
  - Lỗi nhẹ (từ trùng kể cả khác hoa/thường, `word`/`answer` không có trong bài, vượt giới hạn, `repeat` quá dài, thiếu emoji) thì tự sửa đúng bảng ở mục 3.1 và trả về danh sách cảnh báo.
  - Dấu nháy cong và dấu phẩy thừa vẫn đọc được.
- `match.js`: các cách nói gần đúng đều tính đạt: "cow" ↔ "cao", "kow", "a cow", "Cow."; khớp cả với từ chính trong câu `child` ("moo" với "Moo moo!").
- `listen.js`: chế độ chỉ nghe khi không có mic; không bắt đầu nghe khi Bông chưa nói xong.
- Trò chơi: sai 2 lần thì gợi ý đáp án rồi đi tiếp.
- `progress.js`: cộng/trừ mastery đúng quy tắc (chọn sai chỉ trừ từ đúng; lên tiếng chỉ đưa tối đa tới 2), không xuống dưới 0, không trừ theo thời gian; thứ tự ưu tiên ôn tập đúng.
- `db.js`: xóa bài thì xóa ảnh và ghi âm của bài, giữ tiến độ; xóa ghi âm theo bộ lọc (bài, từ, khoảng ngày) xóa đúng các bản ghi.
- `prompts.js`: prompt chứa đúng N từ theo thời lượng và đúng danh sách từ cần ôn, kèm yêu cầu thêm các từ ôn vào `words`; phần yêu cầu về truyện và hội thoại đúng với Kiểu bài đã chọn.
- `backup.js`: xuất rồi nhập lại thì dữ liệu giống hệt (kể cả ảnh, ghi âm và sticker); xuất không kèm ghi âm thì file không có `recordings/`; file zip hỏng hoặc phiên bản mới hơn thì từ chối và dữ liệu hiện có không đổi; gộp đúng quy tắc.
- `stickers.js`: ưu tiên tặng sticker chưa có; đủ bộ rồi thì tăng `count`.
- Giao diện (Playwright, Chrome giả lập kích thước iPad):
  - Nhập bài → xem trước → lưu → bài xuất hiện trong danh sách → học hết bài → số ⭐ tăng.
  - Học dở rồi tải lại trang → chọn **Học tiếp** thì vào đúng chỗ dừng; chọn **Học lại** thì về đầu bài.
  - Giả lập **không có SpeechRecognition** và **không có mic**: bài vẫn chạy hết được.

**Thủ công trên iPad** (soi lỗi qua Safari Web Inspector trên Mac mini):
- [ ] Cài lên Màn hình chính và mở toàn màn hình. Mở trong tab Safari thì thấy lời nhắc.
- [ ] Khi mic đang mở, tiếng Bông vẫn phát ra loa ngoài đủ to (đặc biệt trên iPhone).
- [ ] Đang học thì chuyển sang app khác rồi quay lại: bấm "Bắt đầu" và học tiếp đúng chỗ.
- [ ] Từ chối quyền mic: bài vẫn chạy ở chế độ chỉ nghe.
- [ ] Để yên không chạm trong lúc học: màn hình không tự tắt.
- [ ] Bật Truy cập được hướng dẫn: bé không vuốt thoát được.
- [ ] Tắt Wi-Fi giữa buổi: bài vẫn chạy, nhận dạng tự tắt.
- [ ] Xem phần chẩn đoán: nhận dạng giọng nói có không, định dạng ghi âm, danh sách giọng đọc.
- [ ] Tắt Wi-Fi vẫn học được bài đã lưu.
- [ ] Giọng đọc tiếng Anh, tiếng Việt và mic hoạt động; bé nói thì được khen.
- [ ] Nghe lại giọng bé trong Góc bố mẹ.
- [ ] Copy prompt → tạo bài trên ChatGPT và Gemini → dán vào → học được.
- [ ] Thêm ảnh từ thư viện Ảnh.
- [ ] Sao lưu ra Files rồi khôi phục được.
- [ ] Cho bé chơi thử 1 buổi và ghi lại những chỗ bé bị vướng.

## 9. Lịch sử góp ý

### 9.1. Đề xuất ý tưởng của ChatGPT (v0.2)

| Ý tưởng | Quyết định |
|---|---|
| AI soạn bài một lần, app là lớp học | ✅ Nguyên tắc chính của app |
| Tách chế độ bố mẹ và chế độ bé | ✅ Góc bố mẹ mở bằng nhấn giữ |
| Form tạo bài (tuổi, chủ đề, thời lượng, trình độ, kiểu bài) | ✅ Mục 3 |
| Hội thoại Teacher/Child | ✅ Mục 4.3 B, theo kịch bản |
| Nhân vật cố định (thỏ Bông) | ✅ |
| Xem trước trước khi lưu | ✅ |
| Theo dõi từ đã thuộc, bài mới xoáy vào từ yếu | ✅ Mục 4.7 |
| Flutter + SQLite | ❌ Cần Mac + Xcode, app hết hạn sau 7 ngày nếu không trả 99 USD/năm |
| AI trò chuyện trực tiếp; app tự gọi AI tạo bài, tạo hình | ⏳ Bản 2 (cần API trả phí) |

### 9.2. Review spec của ChatGPT (v0.4)

| Góp ý | Quyết định |
|---|---|
| SpeechRecognition chỉ là phần bổ sung, lõi là đo âm lượng | ✅ Mục 4.3.1 |
| Chọn giọng đọc theo ngôn ngữ, không ghi cứng "Samantha" | ✅ Mục 2 |
| Định dạng ghi âm chọn lúc chạy, lưu kèm `mimeType` | ✅ Mục 2 |
| Ảnh lưu dạng Blob, không dùng base64 | ✅ Mục 2.1 |
| Bài học có id do app tạo, không tin id của AI | ✅ Khác một chút: AI không cần trả `id` nữa; nếu có thì bị bỏ qua |
| Thống nhất số từ: 4 / 6 / 8 theo thời lượng | ✅ Mục 3 và 3.2 |
| Hội thoại tối đa 24 lượt | ✅ |
| Truyện không bắt bé nói lại nguyên câu | ✅ Thêm trường `repeat` (cụm ngắn) |
| Không trừ sao vì lâu không học; lưu `practiceCount`, `lastPracticedAt` | ✅ Mục 4.7 |
| Sao lưu dạng zip có cấu trúc thư mục | ✅ Mục 4.6, dùng JSZip đặt sẵn trong app |
| Host GitHub Pages, host chỉ chứa code | ✅ Đã chốt (mục 10) |
| Tách nhỏ module `player/` và `speech/` | ✅ Mục 7, thêm `listen.js` để gộp kết quả nghe |
| Đổi "Học cùng AI" thành "Học cùng Bông" | ✅ Mục 4.5: hỏi đáp theo hội thoại từ các bài đã lưu |

### 9.3. Review trước khi viết code (v0.5)

| Câu hỏi | Quyết định |
|---|---|
| Từ ôn mâu thuẫn với quy tắc `conversation.word` | ✅ Từ ôn được thêm vào `words` (tối đa N+2 từ) |
| GitHub Pages không phục vụ thư mục `app/` | ✅ Deploy bằng GitHub Actions, dùng đường dẫn tương đối |
| Hết giờ giữa bài | ✅ Giới hạn mềm: học hết bài, bố mẹ cho thêm 15 phút hoặc tắt giới hạn |
| Thoát giữa bài | ✅ Hai lựa chọn: Học tiếp / Học lại |
| Sticker | ✅ Có bộ sưu tập sticker (mục 4.8) |
| Kiểu bài Vui nhộn / Kể chuyện | ✅ Mục 3.2 |
| Chọn sai trừ điểm từ nào | ✅ Chỉ trừ từ đúng |
| Xóa bài | ✅ Xóa ảnh và ghi âm của bài, giữ tiến độ |
| Dung lượng ghi âm | ✅ Không tự xóa. Bố mẹ xóa từng bản, chọn nhiều/chọn tất cả, lọc theo bài, từ, khoảng ngày |

### 9.4. Review lần 2 trước khi viết code (v0.6)

| Câu hỏi | Quyết định |
|---|---|
| Lượt "Moo moo!" không chứa `word` nên không bao giờ "Khớp" | ✅ Khớp cả với từ chính trong câu `child` |
| Bông nói tiếng Việt với bé; giọng Anh đọc sai tên "Bông" | ✅ Nói *"I'm sleepy! Bye-bye!"*; Bông xưng "I" |
| AI vượt giới hạn nhỏ | ✅ Hai mức lỗi: nặng thì từ chối, nhẹ thì tự sửa + cảnh báo (mục 3.1) |
| Không có mic | ✅ Chế độ chỉ nghe (mục 4.3.1) |
| Thẻ từ tự chuyển hay chờ bấm | ✅ Tự chuyển sau ~2 giây, có ▶️ để sang ngay |
| Bé chọn sai mãi | ✅ Sai 2 lần thì gợi ý đáp án rồi đi tiếp |
| Bé bỏ đi | ✅ 20 giây gọi bé, 2 phút tạm dừng (mục 4.9) |
| Một hay nhiều bé | ✅ Bản 1 một bé; nhiều hồ sơ để bản 2 |
| Nhận dạng giọng nói gửi giọng bé lên Apple | ✅ Có công tắc trong Cài đặt, mặc định bật |
| Sao lưu kèm ghi âm | ✅ Ô "Kèm ghi âm", mặc định bật, hiện dung lượng ước tính |
| Các tình huống bất thường trên iOS | ✅ Mục 4.9 và mục 6 |

### 9.5. Review tình huống thực tế (v0.7)

| Tình huống | Quyết định |
|---|---|
| Màn hình tự tắt giữa bài | ✅ Giữ màn hình sáng khi học (Wake Lock) |
| Bé vuốt thoát khỏi app | ✅ README hướng dẫn Truy cập được hướng dẫn |
| Mất mạng giữa buổi | ✅ Nhận dạng lỗi lúc nào thì tắt cho cả buổi |
| Chọn ảnh lỗi | ✅ Báo lỗi, giữ emoji |
| Bố mẹ không thấy nhắc sao lưu | ✅ Chấm nhỏ trên nút ⚙️ |
| Tiếng ồn làm từ thành "thuộc" | ✅ Lên tiếng chỉ đưa tối đa 2⭐; 3⭐ cần chọn đúng hình |
| Câu hỏi tự tạo sai ngữ pháp với màu | ✅ *"Where is the cow?"* / *"Which one is red?"* |
| Thời gian ở Góc bố mẹ | ✅ Không tính vào giới hạn của bé |

### 9.6. Góp ý sau lần chạy thử đầu tiên (v0.8)

| Góp ý | Quyết định |
|---|---|
| Bấm 🏠 là về menu chính luôn (kể cả ở màn danh sách bài) | ✅ Bỏ nhấn giữ 🏠; chỗ đang học vẫn được lưu |
| Nút ▶ hiện ngay để sang hình tiếp | ✅ Nút ▶ luôn hiện trong lúc học, bấm là sang bước tiếp |
| Thêm chữ giải thích ở màn hình chính | ✅ Mục 4.1 |
| Bấm ⚙️ không mở | ✅ Vẫn nhấn giữ 3 giây; thêm chữ "Bố mẹ (giữ 3 giây)" và dòng nhắc khi bấm nhẹ |
| Nút "Về màn hình của bé" trong Góc bố mẹ khác màu, chữ ở giữa | ✅ Nút hồng, rộng hết hàng, tách khỏi menu |
| Reset sticker khi bố mẹ lỡ bấm | ✅ Góc bố mẹ → Sticker của bé: bớt từng sticker hoặc xóa hết (mục 4.8) |
| Sao khen đúng hiện cố định một chỗ | ✅ Sao bay ra từ chính hình bé chọn đúng (hoặc hình đang hiện khi bé nói đúng) |
| Tiếng Anh bị rè | ✅ Không chọn giọng robot của iOS; Cài đặt xếp giọng tốt lên đầu; thêm tùy chọn "Chỉ bật mic khi đang nghe bé" |

### 9.7. Góp ý sau lần chạy thử thứ hai (v0.11)

| Góp ý | Quyết định |
|---|---|
| Không copy được prompt tạo bài | ✅ Lỗi do Safari iOS chặn copy sau một bước chờ: copy ngay trong lúc chạm, có ô prompt để copy tay, nút Mở ChatGPT/Gemini |
| Tạo bài mới có thể trùng từ | ✅ Prompt liệt kê từ đã có để AI tránh; cảnh báo khi dán bài có từ trùng |
| Cải thiện tạo bài, ảnh đẹp hơn trên máy tính | ✅ Ảnh lưới (1 lần tạo ảnh cho cả bài, app tự cắt); Chia sẻ bài / Nhập bài từ file để tạo trên máy tính rồi chuyển sang |
| Hộp quà mở nắp, sticker chui vào | ✅ Mục 4.3 |
| Bỏ đọc tiếng Việt, rút ngắn thời gian trước khi bé nói | ✅ Mặc định chỉ tiếng Anh; đọc từ xong bật mic ngay, chỉ hỏi "Can you say…?" khi bé chưa nói |

### 9.8. Góp ý sau lần chạy thử thứ ba (v0.12)

| Góp ý | Quyết định |
|---|---|
| Icon thỏ màu xám, muốn sáng và vui hơn | ✅ Vẽ Bông bằng SVG theo Character Bible (trắng kem, tai hồng, mặt cười); thay ở mọi chỗ và icon app |
| Thỉnh thoảng mở bài không có tiếng | ✅ Mở khóa giọng đọc ngay khi chạm; gỡ kẹt và đọc lại khi câu không bắt đầu; không `cancel()` thừa (mục 6) |
| Menu: tiếng Anh ở trên, tiếng Việt ở dưới | ✅ Mục 4.1 |
| Bài cùng chủ đề bị trùng tên | ✅ Tự đặt "Animals 2", "Animals 3"; thẻ bài có hàng emoji các từ |
| Tab theo chủ đề ở danh sách bài | ✅ Một hàng tab vuốt ngang, chỉ chủ đề đã có bài, ẩn khi chỉ có 1 chủ đề |

## 10. Quyết định đã chốt (2026-10-08)

1. **Thời lượng mặc định của một bài:** 10 phút, 6 từ.
2. **Nhân vật:** thỏ **Bông** 🐰.
3. **Tiếng Việt:** mặc định **chỉ đọc tiếng Anh** (đổi ngày 2026-10-09 vì đọc thêm tiếng Việt làm thẻ từ quá lâu, bé hay nói trước khi Bông mời). Bố mẹ bật lại được trong Cài đặt: khi bật, app đọc nghĩa tiếng Việt một lần khi bé gặp từ lần đầu trong bài. Màn hình của bé không hiện chữ tiếng Việt; nghĩa tiếng Việt chỉ hiện trong Góc bố mẹ.
4. **Giới hạn mỗi buổi:** mặc định 15 phút nhưng là giới hạn mềm. Hết giờ vẫn cho học hết bài đang dở; bố mẹ cho học thêm mỗi lần 15 phút (có thể lên 30 phút hoặc hơn), hoặc tắt hẳn giới hạn trong Cài đặt (mục 4.6).
5. **Host:** **GitHub Pages** trên tài khoản `HanhTran2410`, link dự kiến `https://hanhtran2410.github.io/kid-english/`. Gói miễn phí yêu cầu repo **public**; việc này không sao vì repo chỉ chứa code, không có dữ liệu của bé. Giai đoạn test đầu có thể dùng link tạm (Cloudflare quick tunnel).
