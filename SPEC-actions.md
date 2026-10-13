# SPEC — Học động từ (Actions) trong mục Câu nói

> Ngày: 2026-10-13 · Chốt: **làm trong mục Câu nói**, không làm module riêng · **Đã làm trong app 0.7.0**

## 1. Vì sao trong mục Câu nói
- Động từ cho bé 3 tuổi học tốt nhất bằng **vận động (TPR)**: nghe → xem Bông làm → bé làm theo, chạm ✔ → nói theo. Mục Câu nói vốn làm đúng việc này (SPEC-v1.0).
- Mục Từ vựng hỏi "What's this? → It's a ___" — không hợp với động từ. Module riêng thì lặp lại gần hết Câu nói.
- Câu động từ tự có: tiến độ (không trừ sao), Ôn tập, Trò chơi 🎲, Học cùng Bông, flipbook.

## 2. Tình huống "Actions"
- Thêm vào danh sách gợi ý khi **Tạo bài câu**: `Actions: body`, `Actions: kitchen`, `Actions: playground`, `Actions: tidy up`. Bố mẹ cũng tự gõ được (ví dụ "Actions: bath", "Động từ nhà bếp", "Verbs…").
- App nhận ra tình huống động từ khi tên bắt đầu bằng **Actions / Action / Verbs / Động từ**.

## 3. Luật riêng trong prompt tạo bài (chỉ khi là tình huống động từ)
- Mỗi câu là một **mệnh lệnh ngắn quanh MỘT động từ rõ ràng** mà bé làm được ngay hoặc giả vờ làm (Stand up, Jump, Pour the water, Stir the soup, Throw the ball).
- **Động từ chính khác nhau** giữa các câu; không dùng lại động từ của các câu đã học.
- `requiredKeywords` = đúng động từ / cụm động từ; `motion` chọn hiệu ứng khớp; `emoji` là vật của hành động (🫖 cho pour) hoặc emoji hành động (🏃).
- `routine: false`; `commands` = **mọi câu** (để chơi "Bông says").
- 3 khung flipbook thể hiện rõ **chuyển động** (bắt đầu → đang làm → xong), thấy cả người Bông. Chỉ hành động an toàn (không trèo cao, không dao).
- Danh sách hiệu ứng trong prompt lấy thẳng từ app (luôn khớp).

## 4. Hiệu ứng chuyển động mới (cảnh Bông + emoji, khi chưa có flipbook)
| `motion` | Cảnh | Cần vật |
|---|---|---|
| `pour` | Vật (bình, ấm) nghiêng, giọt nước rơi | có |
| `stir` | Thìa khuấy vòng tròn | — |
| `run` | Bông chạy nhanh qua lại, bụi 💨 phía sau | — |
| `walk` | Bông đi chậm, dấu chân 👣 | — |
| `throw` | Vật bay theo đường cong | có |
| `kick` | Vật (bóng) bị đá bay ra xa, Bông nhún | có |
| `dance` | Bông lắc lư, nốt nhạc 🎵 bay lên | — |
| `climb` | Thang 🪜 bên cạnh, Bông leo lên từng nấc | — |
| `push` / `pull` | Vật trượt ra xa / lại gần, Bông nghiêng người | có |

Ảnh / flipbook vẫn dùng hiệu ứng nhẹ (pulse / bounce) như cũ. Thiếu vật mà hiệu ứng cần thì dùng `none`.

## 5. Trò "Bông says" (SPEC-v1.0 mục 5 F)
- **Cuối mỗi bài câu** (sau bước chọn hình), nếu bài có ít nhất 2 câu trong `commands` (không có `commands` thì dùng mọi câu).
- Bông: *"Let's play! Listen and do!"* rồi ra **3–4 lệnh** ngẫu nhiên, không trùng: *"Stand up!"* → bé làm, chạm ✔ → *"Yes!"*; lệnh cuối *"Super! You did them all!"*. Không chạm sau 15 giây thì Bông làm mẫu (*"Look! Stand up!"*) rồi sang lệnh sau.
- Không có câu bẫy, không trừ sao; chạm ✔ được tính như bước Làm theo (+1, tối đa một lần mỗi câu mỗi ngày, tới 2⭐). Có nút 🔊 nghe lại lệnh.

## 6. Bài mẫu "Actions"
- 4 câu: *Stand up*, *Sit down*, *Jump*, *Clap your hands* — có sẵn mô tả khung hình flipbook.
- Tự thêm một lần cho máy đã có bài Morning (danh sách file mẫu đã thêm: `phraseSamplesAdded`).

## 7. Test
- Unit: nhận ra tình huống động từ; luật riêng chỉ có ở tình huống động từ; danh sách hiệu ứng trong prompt có động từ mới; `pour` thiếu vật → `none`; "Bông says" 3–4 lệnh không trùng, bài < 2 lệnh thì không có bước này.
- Giao diện: học hết bài mẫu Actions → có "Bông says", lệnh được tính tiến độ; tạo bài câu với "Actions: kitchen" → prompt có luật động từ.
