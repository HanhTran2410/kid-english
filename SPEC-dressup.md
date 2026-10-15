# SPEC — Trò chơi "Mặc đồ" (Dress up)

> Phiên bản spec: **draft1** · Ngày: 2026-10-15 · Dựa trên app 0.12.5
> Trạng thái: **làm trong app 0.13.0**.

## 1. Mục tiêu
- Bé chọn **bé trai / bé gái** rồi mặc đồ cho bạn ấy: kéo (hoặc chạm) áo, quần, mũ, kính, giày… vào người.
- Mỗi lần mặc, bạn nhỏ nói câu có từ trang phục: *"I'm wearing a T-shirt!"*, *"I'm wearing boots!"*; cởi ra: *"I took off my hat!"*.
- **Bông giao việc** có ngữ cảnh thời tiết / hoạt động: *"It's cold! Put on your scarf!"*, *"It's sunny! Put on your sunglasses!"*.
- Không bắt nói, không dùng mic, không sao, không thua, không báo sai. 0 đồng, chạy offline. Cách chơi giống Dán tranh (SPEC-scenes.md).

## 2. Vị trí trong app
- **🎲 Play / Trò chơi** (Góc trò chơi) → thẻ **👗 Dress up / Mặc đồ**.
- Màn chọn bé: 2 nút hình rất to **👦 Boy / Bé trai** · **👧 Girl / Bé gái** (bé chọn lần trước có viền tím). Bông nói *"Who do you want to dress?"*.
- Màn mặc đồ: 🏠 · 👦/👧 (đổi bé) · 🧹 (cởi hết, hỏi lại ✔/✖) · thẻ việc (khi có) · nút Bông; giữa là **bạn nhỏ** (búp bê giấy vẽ SVG, mặc sẵn áo lót trắng + quần đùi xám); dưới là **tủ đồ** (khay vuốt ngang).
- Bé trai / bé gái **chỉ khác kiểu tóc**; **mọi món đồ đều mặc được cho cả hai** (không chia đồ trai / gái).

## 3. Tủ đồ (21 món) và chỗ mặc
| Chỗ | Món (tên tiếng Anh → tiếng Việt) | Động từ (phụ đề) |
|---|---|---|
| Áo | 👕 T-shirt → áo phông · 👔 shirt → áo sơ mi | mặc |
| Áo khoác (mặc ngoài áo / váy) | 🧥 coat → áo khoác | mặc |
| Váy / đồ liền | 👗 dress → váy · 🩱 swimsuit → đồ bơi | mặc |
| Quần | 👖 jeans → quần bò · 🩳 shorts → quần soóc | mặc |
| Đầu | 🧢 cap → mũ lưỡi trai · 👒 sun hat → mũ rộng vành · ⛑️ helmet → mũ bảo hiểm · 👑 crown → vương miện · 🎀 bow → nơ | đội / cài |
| Mắt | 👓 glasses → kính · 🕶️ sunglasses → kính râm · 🥽 goggles → kính bơi | đeo |
| Cổ | 🧣 scarf → khăn quàng | quàng |
| Chân (mỗi chân một chiếc) | 👟 sneakers → giày thể thao · 👢 boots → ủng · 👡 sandals → dép | đi |
| Lưng | 🎒 backpack → ba lô | đeo |
| Tay | ☂️ umbrella → ô | cầm |

- Mỗi chỗ chỉ một món: mặc món mới thì **món cũ cùng chỗ tự cởi** về tủ.
- **Váy / đồ bơi** chiếm cả áo và quần: mặc váy thì cởi áo và quần; mặc áo hoặc quần thì cởi váy.
- Món đồ là emoji, kéo giãn vừa chỗ trên người bạn nhỏ; giày: chiếc bên phải lật ngược để thành đôi. (Thay bằng ảnh AI vẽ: để sau, mục 8.)
- Thứ tự lớp (dưới → trên): ba lô · quần · áo · váy · áo khoác · khăn · giày · ô · kính · đầu.

## 4. Cách chơi
- **Chạm** món trong tủ → mặc ngay. **Kéo** món vào người bạn nhỏ (thả chỗ nào trên người cũng được — app tự đặt đúng chỗ) → mặc.
- Kéo món đang mặc **ra khỏi người** bạn nhỏ → cởi (về tủ). Chạm món đang mặc → nảy lên, nói lại câu.
- Món đang mặc trong tủ có dấu ✔ nhỏ.
- Câu (đọc bằng giọng tiếng Anh, có phụ đề):
  - Mặc: `I'm wearing a <món>!` — số nhiều (jeans, shorts, glasses, sunglasses, goggles, sneakers, boots, sandals) không có "a": `I'm wearing boots!`.
  - Cởi: `I took off my <món>!`.
  - **Ô (đồ cầm tay)** không "wear" / "put on": *"I have an umbrella!"*, cất đi *"I put down my umbrella!"*, Bông giao *"It's raining! Take your umbrella!"*; phụ đề *Mình cầm ô* / *Mình cất ô đi*. Tên bắt đầu bằng nguyên âm dùng **an**.
  - Phụ đề việc Bông giao dùng đúng động từ: *Đội mũ bảo hiểm*, *Đi ủng*, *Cầm ô*.
  - Phụ đề tiếng Việt: `Mình <động từ> <tên Việt>` (*Mình đội mũ bảo hiểm*, *Mình đi ủng*); cởi: `Mình cởi <tên Việt> ra`.
- Mở màn: *"Let's get dressed!"*.

### 4.1. Bông giao việc
- Chạm Bông (chưa có việc), hoặc sau **3 lần mặc**: Bông chọn một món **chưa mặc**, khác món của việc vừa xong → `<ngữ cảnh> Put on your <món>!`. Ngữ cảnh theo món:
  | Món | Ngữ cảnh |
  |---|---|
  | coat, scarf, boots | *It's cold!* |
  | cap, sun hat, sunglasses, shorts, sandals | *It's sunny!* |
  | umbrella | *It's raining!* |
  | swimsuit, goggles | *Let's go swimming!* |
  | helmet | *Let's ride a bike!* |
  | crown, bow | *Let's have a party!* |
  | backpack | *Let's go to school!* |
  | còn lại | (không có) |
- Món cần mặc trong tủ có viền vàng đứt, tủ tự cuộn tới; thẻ việc cạnh Bông (chạm để nghe lại). Đang có việc: chạm Bông chỉ nhắc lại.
- Mặc đúng món → hoan hô, Bông vỗ tay, *"Yay! I'm wearing a scarf!"*. Mặc món khác: chỉ nói câu thường, việc vẫn còn. Mặc hết rồi (không còn món nào để giao) → *"Great job!"*.

## 5. Dữ liệu
- Cài đặt `dressUp`: `{ kid: 'girl' | 'boy', outfits: { girl: ['t-shirt', 'jeans'], boy: [...] } }` — mỗi bé nhớ bộ đồ riêng; đi cùng sao lưu.
- Mở lại: bỏ mã không có, sửa xung đột (2 món cùng chỗ → giữ món sau; váy + áo/quần → giữ món sau).

## 6. Thời gian, offline
Như Dán tranh: tính vào giới hạn mỗi buổi, 2 phút không chạm thì không tính; hình vẽ SVG + emoji, chạy offline.

## 7. Kiểm tra
| Mục | Kiểm tra bởi |
|---|---|
| Mỗi món có chỗ, tên Việt, động từ; mã không trùng | unit |
| Mặc: cùng chỗ thay món cũ; váy ↔ áo/quần; áo khoác mặc ngoài váy được | unit |
| Câu a / không "a" cho số nhiều; câu cởi; giao việc có ngữ cảnh | unit |
| Giao việc: chỉ món chưa mặc, khác việc vừa xong; mặc hết → null | unit |
| Dọn dữ liệu cũ / hỏng | unit |
| Chọn bé → chạm mặc → kéo mặc → kéo ra cởi → câu đúng; nhớ bộ đồ từng bé | UI |
| Giao việc → mặc đúng → khen; 🧹 cởi hết hỏi lại | UI |
| Kéo bằng ngón tay, tủ vuốt ngang | **iPad thật** |

## 8. Sau này
Thay món đồ / bạn nhỏ bằng ảnh AI vẽ (như Dán tranh); màu sắc (*a red T-shirt*); Bông hỏi *"What are you wearing?"*; găng tay, tất, váy ngắn.

## 9. Trình bày (app 0.13.0)
- Phụ đề Mặc đồ không che bạn nhỏ: iPad hiện bên trái bạn nhỏ; iPhone đè lên mép tủ đồ (không chặn chạm).
