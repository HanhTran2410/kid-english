# SPEC — "Dán tranh" (Sticker Play): dán sticker vào tranh, học giới từ

> Phiên bản spec: **draft2** · Ngày: 2026-10-15 · Dựa trên app 0.10.4
> - draft1: bản đầu.
> - **draft2 — sửa theo review (QA):** quy tắc chỗ ở ranh giới; mô hình số lượng (mỗi tranh tính riêng); quy tắc giao việc (một việc một lúc, không còn việc thì khen); thả ngoài tranh không làm mất sticker; phụ đề giữ đến khi đọc xong; tiếng Việt thống nhất in = trong / on = trên / under = dưới; sao lưu, thời gian, kiểm tra. Mục 9 ghi điểm nào nhận, điểm nào không.
> - Trạng thái: **đã làm trong app 0.11.0** (gồm cả các sửa của draft2).

## 1. Mục tiêu
- Sticker không chỉ để ngắm mà còn **dùng được**: bé kéo sticker đã có vào một bức tranh.
- Mỗi lần dán, Bông nói câu có **giới từ**: *"The lion is in the tree!"*, *"The duck is under the bed!"*. Chỗ vừa dán sáng lên để bé thấy "in / on / under" là chỗ nào.
- Thỉnh thoảng **Bông giao việc**: *"Put the duck in the water!"* — chỗ cần đặt nhấp nháy. Làm đúng được khen; đặt chỗ khác **không bị trừ, không báo sai**.
- Không bắt nói, không dùng mic, không sao, không thua. 0 đồng, chạy offline.

## 2. Vị trí trong app
- Màn **Sticker của bé** có thêm nút to **🎨 Play / Dán tranh** ở trên cùng.
- Màn Dán tranh: 🏠 · 🎁 (về album sticker) · 3 nút tranh · thẻ việc (khi có) · nút Bông. Trên iPhone dọc thanh này xuống 2 hàng, Bông ở bên phải.
- Bé chưa có sticker nào: tranh vẫn hiện, khay ghi *"Học bài để nhận sticker nhé! 🎁"*; chạm Bông → *"Let's learn a lesson first!"*.

## 3. Ba bức tranh (vẽ SVG ngay trong code, tỉ lệ 4:3) và các "chỗ"

### 3.1. Cách tính chỗ
- Mỗi chỗ có **mã riêng** và một **hình chữ nhật** theo khung vẽ 400 × 300 của tranh.
- Điểm dùng để tính là **tâm sticker** (chỗ ngón tay thả).
- Xét các chỗ **theo thứ tự trong bảng dưới**; chỗ **đầu tiên** chứa điểm là kết quả. **Cạnh tính là trong** (có sai số nhỏ cho phép đổi % ↔ tọa độ), nên điểm nằm trên ranh giới hai chỗ luôn thuộc chỗ **đứng trước**.
- Hai chỗ cuối mỗi tranh là **vùng nền** phủ kín tranh, nên **mọi điểm trong tranh đều có đúng một chỗ** (unit test dò lưới cả tranh).
- Vùng chạm là hình chữ nhật nên không khớp tuyệt đối hình vẽ (ví dụ góc của vùng "in the tree" có một chút trời). Chấp nhận được: chỗ vừa dán luôn **sáng lên đúng vùng đã tính**, nên bé thấy câu khớp với vùng sáng.

### 3.2. Các chỗ (theo thứ tự ưu tiên) và phụ đề tiếng Việt
| Tranh | Chỗ → tiếng Việt |
|---|---|
| 🚜 **Farm / Nông trại** | on the roof → trên mái nhà · in the barn → trong chuồng · in the tree → trong tán cây · under the tree → dưới gốc cây · in the water → trong nước · in the sky → trên trời · on the grass → trên bãi cỏ |
| 🏖️ **Beach / Bãi biển** | in the boat → trong thuyền · in the bucket → trong xô · under the umbrella → dưới cái ô · in the water → trong nước · in the sky → trên trời · on the sand → trên cát |
| 🛏️ **Bedroom / Phòng ngủ** | on the bed → trên giường · under the bed → dưới gầm giường · in the box → trong hộp · on the shelf → trên kệ · on the wall → trên tường · on the floor → trên sàn |

- Tiếng Việt là **bảng cố định** cho từng chỗ, không dịch tự động. Thống nhất **in = trong, on = trên, under = dưới** để bố mẹ dễ giải thích; riêng *in the sky* → *trên trời* (cách nói tự nhiên của tiếng Việt).
- Dùng *in the tree* (không dùng *on the tree*): người bản ngữ nói chim/khỉ ở **in** the tree; đặt cạnh *under the tree* để bé thấy hai giới từ khác nhau.

### 3.3. Câu
- Dán: `The <tên sticker> is <chỗ>!`. Tên số nhiều nằm trong **danh sách cố định** (*grapes, fries, pancakes*) và dùng **are** — không đoán theo chữ "s" cuối. Thêm sticker mới thì unit test kiểm tra mọi tổ hợp sticker × chỗ.
- Giao việc: `Put the <tên sticker> <chỗ>!`. Làm xong: `Yay! The <tên> is <chỗ>!`.
- Câu luôn **tính lại từ vị trí hiện tại**, không lưu câu.

## 4. Cách chơi
- **Khay sticker** ở dưới: mọi sticker bé đã có, **sticker mới nhận đứng đầu**. Vuốt ngang để xem thêm.
- **Hai cách đặt** (bé 3 tuổi kéo thả chưa giỏi):
  1. **Kéo** sticker từ khay vào tranh.
  2. **Chạm** sticker trong khay (Bông đọc tên, sticker được chọn; chạm lại thì bỏ chọn) → **chạm chỗ** trong tranh.
- Sticker đã dán: **kéo** để đổi chỗ (Bông nói câu mới); **chạm** thì sticker nảy lên và Bông nói lại câu của chỗ hiện tại (không đổi việc đang giao).
- Tranh trống: ngón tay 👆 nhún trên sticker đầu khay để gợi ý.
- Vào tranh: Bông nói *"Let's play on the farm!"* / *"Let's play at the beach!"* / *"Let's play in the bedroom!"*.

### 4.1. Thả ở đâu thì sao
| Thả ở | Sticker kéo từ khay | Sticker đã dán |
|---|---|---|
| Trong tranh | Dán vào chỗ đó | Đổi sang chỗ đó |
| Trong khay | Về khay (không đổi gì) | **Gỡ khỏi tranh**, về khay |
| Chỗ khác (thanh trên, mép màn hình) | Về khay | **Quay về chỗ cũ** |
| Thao tác bị hủy (iOS cướp cử chỉ, cuộn khay) | Về khay | Quay về chỗ cũ |

- **Một ngón tay một lúc:** trong lúc đang chạm/kéo, ngón tay thứ hai bị bỏ qua — không tạo bản sao.
- Kéo dài hơn 8 px mới là kéo; ngắn hơn là chạm.
- Khay chỉ cuộn ngang (`touch-action: pan-x`): vuốt ngang là cuộn khay, vuốt lên là kéo sticker ra.

### 4.2. Số lượng
- **Mỗi tranh là một tờ giấy riêng**: sticker bé có ×N thì **mỗi tranh** dán được tối đa N cái. Sticker trong Nông trại không làm bớt sticker ở Bãi biển. Lý do: bé 3 tuổi đổi tranh mà "mất" sticker sẽ không hiểu vì sao.
- Trong một tranh: **số còn lại = số bé có − số đang dán ở tranh này**. Luôn **tính lại từ dữ liệu** (không cộng/trừ dồn), nên đổi tranh, mở lại app không làm lệch số.
  - Kéo từ khay vào tranh: còn lại −1. Gỡ về khay: +1. Đổi chỗ trong tranh: không đổi.
  - Khay hiện số còn lại khi sticker ×2 trở lên; hết thì mờ, kéo ra chỉ kêu "boing".
- Tối đa **30 sticker / tranh**: đủ 30 thì không dán thêm (kêu "boing"), vẫn kéo đổi chỗ được.
- Các bản cùng loại **giống hệt nhau**, nên không cần mã riêng cho từng bản.

### 4.3. Bông giao việc
- **Một việc một lúc.** Việc được giao khi:
  - bé **chạm Bông** mà chưa có việc; hoặc
  - sau **3 lần đặt thành công** (dán mới hoặc đổi chỗ; kéo hủy / thả ngoài không tính) kể từ khi mở tranh hoặc từ việc trước.
- Đang có việc mà chạm Bông hoặc chạm **thẻ việc** (sticker cần tìm, cạnh Bông): **chỉ nhắc lại**, không giao việc mới.
- **Chọn việc:** một cặp (sticker, chỗ) mà
  - sticker bé có, và **chưa có bản nào** của sticker đó đứng ở chỗ đó (không bao giờ giao việc "đã xong sẵn");
  - làm được: tranh chưa đủ 30, hoặc sticker đã có trong tranh để kéo sang;
  - ưu tiên khác **cả sticker lẫn chỗ** của việc vừa xong; không được thì chỉ cần khác đúng cặp đó.
  - **Không còn cặp nào** → Bông nói *"Great job!"*, không giao việc.
- Đang có việc: chỗ cần đặt nhấp nháy viền trắng; sticker cần tìm trong khay có viền vàng đứt.
- **Xong việc** khi **bất kỳ bản nào** của đúng sticker được đặt vào đúng chỗ (kéo từ khay, chạm chọn rồi chạm chỗ, hay đổi chỗ đều được) → tiếng hoan hô, Bông vỗ tay, *"Yay! The duck is in the water!"* một lần, hết việc.
- Đặt chỗ khác, hoặc sticker khác vào chỗ đó: Bông chỉ nói câu mô tả như bình thường, **việc vẫn còn**.
- Việc **không lưu**: rời màn / đổi tranh / app ra nền thì mở lại không có việc.

### 4.4. Phụ đề
Mỗi câu Bông nói hiện phụ đề phía trên: câu tiếng Anh + tiếng Việt theo bảng 3.2 (*🦁 trong tán cây*, *Đặt 🦆 trong nước*). Phụ đề **giữ suốt lúc Bông đọc**, đọc xong thêm ~3 giây rồi ẩn; câu mới thay câu cũ. Phụ đề không chặn chạm.

## 5. Dữ liệu
- Lưu trong cài đặt, khóa `stickerScenes`: `{ last: 'farm', farm: [{ s: 'lion', x: 52.1, y: 30.4 }], beach: [...], bedroom: [...] }`. `s`: mã sticker; `x, y`: tâm sticker, % của tranh (làm tròn 0,1; khi dán bị kẹp trong 3–97 / 4–96 để sticker không lòi ra ngoài). Thứ tự trong danh sách = thứ tự vẽ (bản kéo sau cùng nằm trên).
- **Dọn dữ liệu mỗi lần mở tranh** (dùng chung cho dữ liệu cũ, khôi phục, bố mẹ bớt sticker): duyệt theo thứ tự danh sách, **bỏ** bản có mã sticker không tồn tại / bé không còn, tọa độ không phải số, bản **vượt số bé đang có** (giữ các bản đứng trước), bản thứ 31 trở đi; tọa độ ngoài 0–100 thì kẹp lại. `last` không hợp lệ → Nông trại. Không bao giờ ra số âm.
- **Sao lưu / khôi phục** đi cùng các cài đặt khác:
  - **Thay thế:** dùng tranh trong bản sao lưu.
  - **Gộp:** cài đặt giữ bản đang có trên máy → máy đã có tranh thì **giữ nguyên tranh của máy**, máy chưa có thì lấy tranh của bản sao lưu. Không trộn hai danh sách (trộn sẽ ra sticker trùng chồng lên nhau).
  - Dù cách nào, khi mở tranh vẫn qua bước dọn dữ liệu ở trên.

## 6. Thời gian, offline
- Dùng **chung bộ đếm buổi học** của app (không bộ đếm riêng): đang ở màn Dán tranh là đang "hoạt động".
- **2 phút không chạm** (tính từ lần chạm cuối, mọi lần chạm đều tính, kể cả chạm Bông để nghe lại) thì ngừng tính giờ; chạm lại thì tính tiếp.
- App ra nền: ngừng tính giờ như các bài khác; quay lại bấm ▶ để vào lại đúng tranh.
- Hết giờ khi đang chơi: **không cắt ngang** (bé chơi tiếp được); bé bấm 🏠 thì Bông đi ngủ như mọi hoạt động khác.
- **Offline:** tranh vẽ SVG trong code, file nằm trong cache của service worker, không tải gì từ mạng. Giọng đọc là giọng của máy: phải tải giọng tiếng Anh (README) — như mọi phần khác của app.

## 7. Sau này (chưa làm)
- Thêm tranh: công viên, nhà bếp (*in the fridge, on the plate*), vũ trụ.
- *next to / behind / in front of*.
- Bông hỏi ngược *"Where is the lion?"* — bé chạm vào chỗ.
- Việc "hợp lý" theo loại sticker (cá → nước, chim → trời) xen với việc ngộ nghĩnh (mục 9).
- Chụp lại tranh để vào "Sách của bé".

## 8. Kiểm tra
| Mục | Kiểm tra bởi |
|---|---|
| Mọi điểm trong tranh có đúng một chỗ; vùng nằm trong tranh; mã chỗ không trùng; tâm mỗi chỗ trả đúng chỗ | unit |
| Điểm trên ranh giới → chỗ đứng trước; góc tranh có chỗ | unit |
| Mọi sticker × mọi chỗ: câu đúng mẫu; chỉ grapes / fries / pancakes dùng *are* | unit |
| Khay: thứ tự, số còn lại theo số đã dán | unit |
| Dọn dữ liệu: sticker không còn / vượt số / hỏng / quá 30; kẹp tọa độ | unit |
| Giao việc: chỉ sticker bé có, không trùng chỗ đang đứng, không lặp việc vừa xong; không còn việc → null; tranh đủ 30 | unit |
| Kéo vào tranh → câu đúng chỗ; chạm chọn → chạm chỗ; chạm sticker đã dán nói lại câu | UI |
| Chạm Bông → giao việc; chạm lần 2 không đổi việc; sticker khác vào đúng chỗ không tính xong; làm đúng → khen, hết việc | UI |
| Kéo vào khay → gỡ; thả ngoài tranh và ngoài khay → về chỗ cũ | UI |
| Đổi tranh, rời màn, mở lại → tranh và số còn lại đúng | UI |
| Chưa có sticker → khay trống, Bông nhắc học bài | UI |
| Sticker tự cache offline (danh sách file của service worker) | unit (sw) |
| Kéo thả bằng ngón tay; vuốt khay vẫn cuộn; ngón tay thứ hai không tạo bản sao | **iPad thật** |
| Tắt mạng, mở app, dán tranh, nghe câu | **iPad thật** |
| Hết giờ khi đang chơi → chơi tiếp được, về 🏠 thì Bông ngủ | **tay** |

## 9. Review draft1 — nhận / không nhận
| Góp ý | Quyết định |
|---|---|
| Ranh giới vùng, mọi điểm thuộc đúng một vùng | **Nhận** — mục 3.1, thêm test ranh giới và sai số |
| Định nghĩa rõ ×N, số còn lại | **Nhận**, nhưng chọn **mỗi tranh tính riêng** (không trừ chung toàn album) — mục 4.2 |
| Mã riêng cho từng bản sticker | **Không cần** — các bản giống hệt nhau, số luôn tính lại từ danh sách |
| Một việc một lúc; chạm Bông chỉ nhắc lại; không còn việc thì khen; không giao việc đã xong sẵn | **Nhận** — mục 4.3 (bổ sung trường hợp tranh đủ 30) |
| Đếm "3 lần dán" theo lần đặt thành công | **Nhận** |
| Thả ngoài tranh và ngoài khay → về chỗ cũ (draft1: gỡ về khay) | **Nhận, đã sửa code** — mục 4.1 |
| Phụ đề không ẩn trước khi Bông đọc xong | **Nhận, đã sửa code** — mục 4.4 |
| Bảng tiếng Việt cố định, *in the water* ≠ "dưới nước" | **Nhận** — in = trong / on = trên / under = dưới |
| Bảng is / are riêng, không đoán theo chữ cuối | Đã có từ draft1; thêm test mọi tổ hợp |
| Việc phải "hợp lý" (sư tử không ở trên cây…) | **Chưa** — bé 3 tuổi rất thích việc ngộ nghĩnh (*"Put the whale on the bed!"*), giới từ vẫn đúng và chỗ cần đặt nhấp nháy. Để ở mục 7 |
| Quy tắc gộp riêng cho `stickerScenes` | **Không trộn** — giữ tranh của máy (hoặc của bản sao lưu nếu máy chưa có), rồi dọn dữ liệu; ghi rõ ở mục 5 |
| Thời gian, offline | Ghi rõ ở mục 6 (dùng chung bộ đếm của app) |
