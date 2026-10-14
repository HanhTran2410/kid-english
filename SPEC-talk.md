# SPEC — "Nói chuyện với Bông" (hội thoại hỏi – đáp ngắn)

> Phiên bản spec: **draft2** · Ngày: 2026-10-14 · Dựa trên app 0.8.4
> - draft1: hướng **nâng cấp nút "Học cùng Bông"** (không thêm nút thứ 9).
> - **draft2 — sửa theo review (PO + QA):** tách rõ "nỗ lực nói" với nhận dạng; trạng thái hội thoại (một luồng tiếng tại một thời điểm); schema đầy đủ cho từng kiểu lượt (có `type` rõ ràng, mọi câu đọc đều có tiếng Việt); luật sao theo **từng lượt / ngày**; xử lý hồ sơ thiếu; 3 trạng thái bong bóng của bé (gợi ý / đang nghe / đã thử nói); thời gian nghe; rút gọn nội dung 5 bài; chia T-a thành 4 mốc nghiệm thu; ghi rõ phần nào cần mạng.
> - Quyết định (theo đề xuất, khớp review): **T-a trước** (4 mốc); 📞 gọi điện ở T-b **bật mặc định**; lời chào mỗi ngày ở T-b **tắt mặc định**; giữ **5 bài hội thoại + thẻ "Ôn từ đã học"**; **có tiếng nói là ghi nhận nỗ lực** (không cần nhận dạng đúng); **tối đa 2⭐ cho mỗi lượt**, mỗi lượt cộng tối đa 1 lần/ngày.
> - **draft3 (mục 13 — T-c):** bài dài 6–8 lượt có mạch chuyện, Bông đáp theo câu trả lời, lượt chạm làm động tác, thay ảnh + ảnh gia đình thật. **Đã làm cả 3 mốc T-c1–T-c3 trong app 0.10.0.**
> - Trạng thái: **đã làm T-a trong app 0.9.0** (T-b để sau). Ghi chú khi code: bong bóng "đang nghe" giữ câu gợi ý (`🎤 câu gợi ý`); thẻ bài hội thoại hiện tên tiếng Việt; khôi phục bản sao lưu giữ hồ sơ đang có trên máy (cài đặt không bị ghi đè).

## 1. Mục tiêu
- Bé 3 tuổi tập **hội thoại hỏi – đáp ngắn**, **luân phiên lượt nói**: Bông hỏi → bé trả lời → (đổi vai) bé hỏi với gợi ý → Bông trả lời.
- Câu trả lời là **của riêng bé** (tên, tuổi, cảm xúc, sở thích).
- Khác mục **Câu nói** (mệnh lệnh + làm động tác): ở đây bé **trả lời bằng lời**.
- **Nhận dạng giọng nói không bao giờ là điều kiện để học tiếp hay được khen** — nhận dạng sai không có nghĩa là bé nói sai. Không phạt, luôn bỏ qua được.

## 2. Vị trí trong app
- Nút trên màn hình chính đổi chữ: **"Talk with Bông / Nói chuyện với Bông"** (vẫn hình Bông, cùng vị trí).
- Bấm vào → danh sách gồm **5 bài hội thoại có sẵn + thẻ "⭐ Ôn từ đã học"**:
  | Thẻ | Nội dung (bản đầu) |
  |---|---|
  | 👋 **Hello & Goodbye** | *Hello!* → *Hello!* ; *Goodbye!* → *Bye-bye!* (*Good morning* để dành cho lời chào mỗi ngày) |
  | 🙋 **About me** | *What's your name?* → *My name is Na.* ; *How old are you?* → *I'm three!* ; đổi vai hỏi tên Bông |
  | 😊 **How are you?** | chọn 😀 happy / 😢 sad / 😴 sleepy (hungry thêm sau) — bé được chọn cảm xúc thật |
  | ❤️ **I like…** | *What color do you like?* (chọn màu) ; *Do you like apples?* → 👍 / 👎 (không tự lấy từ hồ sơ) |
  | 👨‍👩‍👧 **My family** | *Who is this?* → *It's Mummy!* / *It's Daddy!*; thêm Grandma, Grandpa, brother, sister **chỉ khi bố mẹ chọn** trong hồ sơ |
  | ⭐ **Ôn từ đã học** | Màn "Học cùng Bông" hiện tại, **giữ nguyên code và dữ liệu** (đường dẫn tương thích) |
- Học tiếp / Học lại, Hoan hô + sticker như các bài khác.

## 3. Hồ sơ của bé (Góc bố mẹ → "Hồ sơ của bé")
| Trường | Ghi chú |
|---|---|
| **Tên đọc bằng tiếng Anh** | Tên gọi để đọc (không phải tên pháp lý): gợi ý viết không dấu, ngắn (Na, Bin, Mi); **nút 🔊 nghe thử** trước khi lưu |
| **Tuổi** | 2–6, Bông đọc **bằng chữ** (*three*), không đọc chữ số |
| **Màu / món thích** | Không bắt buộc — chỉ để gợi ý, bé vẫn tự chọn trong bài |
| **Thành viên gia đình** | Tích chọn: Mummy, Daddy (mặc định có), Grandma, Grandpa, brother, sister |
- Lưu trong cài đặt trên máy (đi cùng sao lưu), **không gửi đi đâu**.
- **Thiếu hồ sơ** — không bao giờ đọc / hiện chỗ trống `{name}`:
  | Trường hợp | Hành vi |
  |---|---|
  | Chưa có tên | *What's your name?* → câu gợi ý *"Tell me your name!"*; Bông đáp *"Nice to meet you!"* (không có tên) |
  | Chưa có tuổi | **Bỏ lượt hỏi tuổi** |
  | Chưa chọn thành viên | Dùng Mummy + Daddy; Góc bố mẹ có dòng nhắc chọn thêm |
- Đổi hồ sơ thì lần học sau dùng ngay giá trị mới (câu được ghép lúc chạy, không lưu sẵn vào bài).

## 4. Trạng thái hội thoại (một luồng tiếng tại một thời điểm)
```
intro → bong_speaking → child_turn (listening) → feedback → next_turn … → completed
                ↑ 🔊 nghe lại / ▶ bỏ qua / 🏠 thoát / app ra nền (tạm dừng) — từ bất kỳ trạng thái nào
```
- **Mỗi lúc chỉ một câu tiếng Anh được đọc**: chuyển lượt, bỏ qua, nghe lại đều hủy câu đang đọc trước (dùng lại cơ chế hủy giọng đọc hiện có, kể cả hủy lặp cho Safari iOS).
- 🔊 khi Bông đang nói: chỉ hiện phụ đề, không đọc chồng. Mic **chỉ mở trong `child_turn`**, đóng khi rời trạng thái đó.
- ▶ bỏ qua: hủy tiếng / mic, sang lượt sau; 🏠 / app ra nền: dừng như các bài khác (lưu chỗ học dở).

## 5. Các kiểu lượt (mỗi lượt có `type` rõ ràng)
| `type` | Cách chạy | Ghi nhận |
|---|---|---|
| `greeting` | Bông chào → lượt bé (gợi ý: câu chào lại) | nỗ lực nói |
| `free` | Bông hỏi → lượt bé (gợi ý: câu mẫu có tên/tuổi) → Bông đáp (`reply`) | nỗ lực nói |
| `choice` | Bông hỏi → 3 hình → bé **chạm** → **Bông đọc câu mẫu** của hình (bong bóng Bông) → lượt bé (gợi ý câu đó) | chạm: không sao; nói theo: nỗ lực nói |
| `yesNo` | Bông hỏi → 👍 Yes / 👎 No → Bông đọc câu đầy đủ (*"Yes, I do!"* / *"No, I don't!"*) → lượt bé | như `choice` |
| `askBack` (đổi vai) | Bông: *"Now you ask me!"* → bong bóng bé hiện **câu hỏi gợi ý mờ** (chạm để nghe) → lượt bé (bắt chước có hỗ trợ) → Bông trả lời | nỗ lực nói |

**Lượt bé (dùng chung):** sau khi Bông đọc xong chờ ~1 giây → mở mic, nghe tối đa ~6 giây (các mốc là **cấu hình**, chỉnh sau khi thử với bé):
- **Có tiếng nói** (có hoặc không nhận ra từ khóa) → ghi nhận **nỗ lực nói**; nhận ra từ khóa → *"Great job!"*, không rõ → *"Good try!"* + Bông đọc mẫu.
- **Im lặng** → Bông đọc mẫu theo từng cụm → nghe thêm **một lần** → vẫn im lặng thì chuyển tiếp nhẹ nhàng (không ghi nhận, không chê).
- **Không có mic / bị từ chối / nhận dạng lỗi / mất mạng** → chế độ chỉ nghe (*"Your turn!"*, chờ, đọc mẫu) — không ghi nhận nỗ lực (không tự kết luận bé đã nói).

## 6. Bong bóng chat — phân biệt câu mẫu với lời bé
```
 🐰  [ What's your name? ]                       ← Bông (trái), chữ đậm
                 ( My name is Na.  🔊 )  🧒      ← GỢI Ý: chữ mờ, viền đứt, có 🔊
                 ( 🎤 … )               🧒      ← ĐANG NGHE: mic + sóng nhẹ
                 ( 🗣️ Bé đã nói! )      🧒      ← ĐÃ THỬ NÓI: không ghi lại câu, không khẳng định nói đúng
 🐰  [ Nice to meet you, Na! ]
```
- Bên phải **không bao giờ hiện câu mẫu như thể là lời bé đã được nhận dạng**.
- Câu Bông đọc sau khi bé chọn hình nằm ở **bong bóng của Bông** (câu mẫu của Bông).
- Phụ đề 🔊: dùng bản tiếng Việt có sẵn trong bài cho **mọi câu được đọc** (câu hỏi, câu mẫu, câu đáp, lời khen, lời chào).

## 7. Dữ liệu
- Bài trong kho `lessons` với `kind: "talk"`, **không nâng cấp IndexedDB**; 5 bài có sẵn có mã `builtin`, **tự thêm một lần** (danh sách mã đã thêm trong cài đặt, như bài số / phonics) — mở app lại không sinh bản sao. Các màn danh sách / Ôn tập / Trò chơi / sao lưu đã lọc theo loại bài (bài talk không lẫn vào từ vựng).
- **Schema theo từng `type`** (mã bài / mã lượt ổn định, không đổi khi sửa câu chữ):
```json
{
  "kind": "talk", "builtin": "talk-about-me", "title": "About me", "titleVi": "Về bé", "emoji": "🙋",
  "turns": [
    { "id": "name", "type": "free",
      "ask": "What's your name?", "askVi": "Con tên là gì?",
      "answer": "My name is {name}.", "answerVi": "Con tên là {name}.",
      "answerNoProfile": "Tell me your name!", "answerNoProfileVi": "Con nói tên con nhé!",
      "reply": "Nice to meet you, {name}!", "replyVi": "Rất vui được gặp con, {name}!",
      "replyNoProfile": "Nice to meet you!", "replyNoProfileVi": "Rất vui được gặp con!",
      "needs": [] },
    { "id": "age", "type": "free", "needs": ["age"],
      "ask": "How old are you?", "askVi": "Con mấy tuổi?",
      "answer": "I'm {age}!", "answerVi": "Con {ageNumber} tuổi!", "keywords": ["{age}"],
      "reply": "Wow, {age}!", "replyVi": "Ồ, {ageNumber} tuổi!" },
    { "id": "ask-name", "type": "askBack",
      "intro": "Now you ask me!", "introVi": "Giờ con hỏi Bông nhé!",
      "ask": "What's your name?", "askVi": "Bạn tên là gì?",
      "reply": "My name is Bông!", "replyVi": "Mình tên là Bông!" },
    { "id": "feel", "type": "choice", "ask": "How are you?", "askVi": "Con có khỏe không?",
      "choices": [
        { "id": "happy", "emoji": "😀", "answer": "I'm happy!", "answerVi": "Con vui!", "keywords": ["happy"] },
        { "id": "sad", "emoji": "😢", "answer": "I'm sad.", "answerVi": "Con buồn.", "keywords": ["sad"] },
        { "id": "sleepy", "emoji": "😴", "answer": "I'm sleepy.", "answerVi": "Con buồn ngủ.", "keywords": ["sleepy"] } ] },
    { "id": "apples", "type": "yesNo", "ask": "Do you like apples?", "askVi": "Con có thích táo không?",
      "yes": { "answer": "Yes, I do!", "answerVi": "Có, con thích!" },
      "no": { "answer": "No, I don't!", "answerVi": "Không, con không thích!" } },
    { "id": "hello", "type": "greeting", "ask": "Hello, {name}!", "askVi": "Chào {name}!",
      "answer": "Hello!", "answerVi": "Xin chào!" }
  ]
}
```
- `needs`: lượt cần trường hồ sơ nào; thiếu thì **bỏ lượt** (tuổi) hoặc dùng bản `…NoProfile` (tên). Placeholder `{name}`, `{age}` (chữ), `{ageNumber}` (số, chỉ trong tiếng Việt) được thay **trước khi** hiển thị / đọc.
- Lời khen / câu chung (*Great job!*, *Good try!*, *Your turn!*, *Now you ask me!*…) có bản tiếng Việt cố định trong app.
- Kiểm tra JSON (cho bài tạo bằng AI ở T-b): đúng `type`, đủ trường bắt buộc theo `type`, mã không trùng — sai thì từ chối như các loại bài khác.

## 8. Tiến độ và sao (3 việc tách riêng)
| Việc | Lưu ở đâu |
|---|---|
| Chỗ học dở / đã học xong bài | bản ghi bài: `resume`, `timesCompleted` (như mọi bài) |
| Nỗ lực nói + sao của từng lượt | kho `progress`, khóa **`talk:<mã bài>:<mã lượt>`**: `mastery` (sao), `lastVoiceDay` (ngày đã ghi nhận), `practiceCount`, `attempts` |
| Lịch sử theo ngày | `lastVoiceDay` theo **ngày địa phương của máy** |
- Mỗi lượt: **tối đa 1 lần ghi nhận / ngày**, mỗi lần +1⭐, **tối đa 2⭐ cho mỗi lượt**; học lại trong cùng ngày vẫn được khen nhưng **không cộng thêm**. Chọn hình / có-không chỉ ghi "đã gặp". **Không bao giờ trừ sao**, không hiện thông báo thất bại.
- Sao lưu / khôi phục: tiến độ `talk:` gộp theo luật chung (lấy số cao hơn, ngày mới hơn).

## 9. Cần mạng hay không
| Phần | Offline? |
|---|---|
| Danh sách, bong bóng, giọng đọc, chọn hình, có/không, phụ đề, sao, sticker | ✅ chạy offline |
| Nhận dạng giọng nói (iOS / Chrome gửi lên máy chủ của Apple / Google) | ❌ cần mạng — mất mạng thì **tự chuyển chế độ chỉ nghe**, bài vẫn chạy hết |
| Đo âm lượng mic (biết bé có lên tiếng) | ✅ offline (dùng để ghi nhận "nỗ lực nói" khi không có nhận dạng) |

## 10. Kế hoạch làm (T-a là một đợt MVP, chia 4 mốc nghiệm thu)
| Mốc | Phạm vi | Nghiệm thu |
|---|---|---|
| T-a1 | Đổi nút → danh sách (5 bài + Ôn từ đã học); **Hồ sơ của bé** | Không mất dữ liệu cũ; hồ sơ lưu / sao lưu / khôi phục đúng |
| T-a2 | Bong bóng chat, đọc tiếng Anh, phụ đề, ▶, 🏠 | Không đọc chồng; mọi trạng thái thoát được |
| T-a3 | 5 kiểu lượt `greeting` / `free` / `choice` / `yesNo` / `askBack` | Mỗi kiểu chạy đúng, có đường lui khi bé không nói / không có mic |
| T-a4 | 5 bài có sẵn, tiến độ và sao | Không trùng bài; không cộng sao lặp; Học tiếp / Học lại đúng |
| T-b1 | 📞 Khung gọi điện (bật mặc định, tắt được) | Không ảnh hưởng luồng hội thoại |
| T-b2 | 🌅 Lời chào mỗi ngày (tắt mặc định) | Chỉ hiện khi bật; bỏ qua được |
| T-b3 | Tạo bài hội thoại bằng AI; câu hội thoại vào Ôn tập | Kiểm tra JSON; không phá bài cũ |

## 11. Checklist nghiệm thu (T-a)
- [x] Nút cũ được nâng cấp, không có nút thứ 9; "Ôn từ đã học" chạy như cũ.
- [x] 5 bài hội thoại mở được, nội dung hợp lệ; mở app nhiều lần không sinh bản sao.
- [x] Thiếu hồ sơ không tạo câu rỗng / không đọc placeholder; thiếu tuổi thì bỏ lượt tuổi.
- [x] Tuổi đọc bằng chữ (*three*).
- [x] Không có mic / từ chối quyền / mất mạng vẫn học hết bằng nghe mẫu và bỏ qua.
- [x] Không có chỗ nào bắt bé trả lời đúng mới được đi tiếp.
- [x] Bong bóng phân biệt rõ gợi ý / đang nghe / đã thử nói; không giả làm lời bé.
- [x] 🔊, ▶, 🏠 dùng được ở mọi lượt; không đọc chồng tiếng; mic chỉ mở khi đến lượt bé.
- [x] Sao: tối đa 1 lần / lượt / ngày, tối đa 2⭐ / lượt; không trừ.
- [x] Mọi câu được đọc đều có phụ đề tiếng Việt khi chạm 🔊.
- [x] Dữ liệu bài và tiến độ cũ vẫn chạy sau nâng cấp; sao lưu / khôi phục giữ hồ sơ.
- [x] Hồ sơ của bé không gửi đi đâu.

## 12. Rủi ro
| Rủi ro | Cách xử lý |
|---|---|
| Giọng đọc tiếng Anh đọc tên Việt sai | Tên đọc bằng tiếng Anh + nghe thử; bố mẹ chỉnh cách viết |
| Nhận dạng không nghe ra tên / câu tự do | Chỉ cần có tiếng nói là ghi nhận nỗ lực; không bắt đúng |
| Bé chưa biết trả lời | Gợi ý luôn có + chạm để nghe; kiểu chọn hình / có-không để bé trả lời bằng chạm trước |
| Đọc chồng tiếng / kẹt mic | Trạng thái hội thoại một luồng (mục 4); mic chỉ mở trong lượt bé |
| Bài dài | T-a: 3–4 lượt; T-c: 6–8 lượt (~2–3 phút) nhưng nhiều lượt chỉ cần chạm; ▶ luôn bỏ qua được |

---

## 13. T-c — Hội thoại dài hơn, hấp dẫn hơn, thay được ảnh (draft3, đã làm trong 0.10.0)

Phản hồi sau khi dùng 0.9.0: bài quá ngắn (2–3 lượt), Bông chỉ hỏi rồi khen chung chung, hình chỉ là emoji.

### 13.1 Bài dài hơn: 6–8 lượt, có mạch chuyện (~2–3 phút)
Giữ mã lượt cũ (`hello`, `name`, `age`, `feel`, `color`…) để **không mất sao đã có**; lượt mới có mã mới.

| Bài | Mạch chuyện (✨ = lượt mới) |
|---|---|
| **Hello & Goodbye** | Hello, {name}! → bé chào Bông → ✨ *How are you today?* (😊 / 😴 / 😋) → ✨ *Good morning or good night?* (☀️ / 🌙) → ✨ *Do you want to play with me?* (có / không) → ✨ *Give me a high five!* ✋ → Goodbye! → ✨ *Wave bye-bye!* 👋 *See you tomorrow!* |
| **About me** | What's your name? → How old are you? → ✨ *Show me {age} fingers!* (Bông đếm *one, two, three!*) → bé hỏi tên Bông → ✨ bé hỏi tuổi Bông (*I'm two! I'm a small bunny!*) → ✨ *What's your favorite color?* (Bông **nhớ hồ sơ**: *I know! You like red!*) → ✨ *High five!* |
| **How are you?** | How are you? (vui / buồn / buồn ngủ) — ✨ **Bông đáp theo lựa chọn** (buồn → *Oh no! Here's a big hug!* 🤗) → bé hỏi lại Bông → Are you hungry? → ✨ (nếu có) *What do you want to eat?* (🍌 / 🍞 / 🍚 → *Yummy! A banana!*) → ✨ *Let's smile together!* 😁 |
| **I like…** | What color do you like? (✨ đáp theo màu: *Red! Like an apple!*) → ✨ *Which animal do you like?* (🐶 / 🐱 / 🐰 → Bông giả tiếng kêu *Woof woof!*) → Do you like apples? → Do you like dogs? → ✨ bé hỏi Bông *What do you like?* → *I like carrots!* 🥕 → ✨ *Do you like Bông?* → *I like you too!* ❤️ |
| **My family** | Who is this? (từng người đã chọn, **ảnh thật** nếu bố mẹ đã thêm — mục 13.3) → ✨ *Do you love Mummy?* → *Mummy loves you too!* → ✨ *Give Mummy a kiss!* 😘 → ✨ bé chỉ vào Bông hỏi *Who is this?* → *It's me, Bông!* |

Luật cũ giữ nguyên: ▶ luôn bỏ qua được, không bắt nói đúng, mic chỉ mở khi đến lượt bé, mọi câu có tiếng Việt cho phụ đề.

### 13.2 Làm cho hấp dẫn hơn
1. **Bông đáp theo câu trả lời của bé:** mỗi lựa chọn / có / không có `reply` riêng (thay cho "Great job!" chung chung). Lời khen cuối lượt đổi ngẫu nhiên: *Great job! / Wonderful! / Super! / Yay!*
2. **Kiểu lượt mới `action` (chạm làm động tác):** Bông nói *Give me a high five!*, hiện một nút to ✋ / 👋 / 🤗 / 😘 / 😁. Bé chạm → hiệu ứng (tay đập, tim bay, pháo giấy nhỏ) + câu đáp. Không cần mic, **không tính sao** (chỉ ghi "đã gặp"). Chờ tối đa ~8 giây rồi Bông tự làm mẫu và đi tiếp.
3. **Bông có biểu cảm:** avatar Bông nảy nhẹ khi nói; đổi mặt theo lượt (vui / ngạc nhiên / buồn khi bé buồn). Chỉ dùng CSS + emoji, không cần ảnh mới.
4. **Bông "nhớ" bé:** dùng màu thích / món thích trong Hồ sơ (đã có ô nhập nhưng 0.9.0 chưa dùng). Có hồ sơ → *I know! You like red!*; chưa có → hỏi như thường.
5. **Rẽ nhánh nhẹ:** lượt có thể `onlyIf` theo câu trả lời trước (vd. chỉ hỏi *What do you want to eat?* khi bé chọn "Yes, I'm hungry"). Chọn "No" thì bỏ lượt đó.
6. **Kết bài có quà:** thanh tiến độ là Bông nhảy dần tới hộp quà 🎁; cuối bài hộp mở ra sticker (dùng màn quà sẵn có).

### 13.3 Thay ảnh trong hội thoại
- Mọi hình (hình của lượt, hình từng lựa chọn, nút động tác) mặc định là emoji; **bố mẹ thay được bằng ảnh**.
- Góc bố mẹ → Quản lý bài → bài hội thoại: mỗi lượt / lựa chọn có **📷 Đổi ảnh** (chọn từ máy, tự cắt vuông, nén như các bài khác) và **Xóa ảnh** (về emoji). Lưu ở kho `images` theo `lessonId` + `word = pic:<mã lượt>` hoặc `pic:<mã lượt>:<mã lựa chọn>`.
- **📋 Copy prompt tạo ảnh** cho cả bài (liệt kê các hình cần vẽ, cùng phong cách với các bài khác) + **cắt ảnh lưới** bằng công cụ đang có, gán lần lượt vào từng hình.
- **Ảnh gia đình thật:** trong *Hồ sơ của bé*, mỗi người đã chọn có nút **📷 Ảnh** (ảnh mẹ, bố, bà…). Bài *My family* hiện ảnh thật thay emoji. Ảnh chỉ nằm trên máy, có trong bản sao lưu, **không kèm khi chia sẻ bài / tải lên Drive**.
- Ảnh thẻ bài ngoài danh sách: dùng ảnh đầu tiên bố mẹ đã thêm (giống phonics); chưa có thì emoji.

### 13.4 Cập nhật 5 bài đã có trên máy
Bài có sẵn đã được thêm ở 0.9.0 nên "thêm một lần" không đủ. Thêm `builtinVersion` vào bài có sẵn: khi app thấy bài trên máy cũ hơn → **thay phần lượt**, giữ nguyên mã bài, tên bố mẹ đã đổi, ảnh đã thêm và tiến độ. Bài bố mẹ tự tạo (T-b) không bị đụng tới.

### 13.5 Mốc làm
| Mốc | Nội dung | Nghiệm thu |
|---|---|---|
| **T-c1** | Nội dung 6–8 lượt, `reply` theo lựa chọn, `onlyIf`, dùng màu/món thích, lời khen ngẫu nhiên, cập nhật bài cũ (13.4) | Bài cũ trên máy tự lên bản mới, sao cũ còn; không đọc chỗ trống |
| **T-c2** | Kiểu lượt `action`, biểu cảm Bông, thanh tiến độ hộp quà | Không có mic vẫn chơi hết; chạm nhanh / ▶ liên tục không kẹt |
| **T-c3** | Đổi ảnh từng hình, prompt + cắt lưới, ảnh gia đình trong Hồ sơ | Ảnh hiện trong bài + thẻ; xóa ảnh về emoji; chia sẻ bài không lộ ảnh gia đình |

Đã làm cả 3 mốc trong **0.10.0**. Ghi chú khi code:
- Bấm ▶ giữa lúc chọn hình / chạm động tác: hàng nút được dọn ngay (không để lại nút cũ bấm không ăn).
- Bỏ qua lượt chọn bằng ▶ thì lượt phụ thuộc (`onlyIf`) cũng bỏ.
- Ảnh gia đình lưu ở kho `images` với mã chủ `profile:family` (không thuộc bài nào) → gói chia sẻ bài không có; file sao lưu đầy đủ có.
- 0.10.1: prompt ảnh bài My family ghi tên ô rõ nghĩa ("Mother (Mummy)", "Grandmother (Grandma)"…) và mô tả từng người là người thật (mẹ tóc nâu, ông bà tóc bạc, anh chị em là trẻ con) — "One mummy" bị AI vẽ thành xác ướp.
- Bông về nét mặt vui sau mỗi lượt; máy bật "giảm chuyển động" thì tắt nảy / lắc / hiệu ứng bay.
