# SPEC — 🐮 Ai kêu thế? (Who says moo?)

> App **0.26.0**, draft2 ở **0.26.1** (theo review QA), **draft3 ở 0.27.0** (+ 26 file tiếng thật ở **0.27.1**) · Ngày: 2026-10-21 · **Đã làm.** Một trò trong Góc trò chơi.
> draft3: **luôn 4 hình**; thêm **11 đồ vật** và trang chọn kiểu **Con vật / Đồ vật / Trộn**; **tiếng thật** (file ghi âm CC0 / public domain có sẵn trong app, bố mẹ thay bằng ghi âm / file); trang **Góc bố mẹ → Ảnh & tiếng Ai kêu thế?** (mục 6).
> Bông giả tiếng kêu con vật, bé chạm đúng con vật. Trẻ 3 tuổi rất thích tiếng kêu; trò ngắn, không cần mic.

## 0. Chọn kiểu
- 3 thẻ to: **🐮 Animals / Con vật**, **🚂 Things / Đồ vật**, **🎲 Mix / Trộn cả hai**.
- Nút 🔊 trên màn chơi quay về trang chọn kiểu.

## 1. Màn hình
```
 🏠  🎲   🐮 Who says moo?          2/5     🐰
                 [🔊 Listen!]
        ┌──────┐   ┌──────┐   ┌──────┐
        │  🐄  │   │  🐖  │   │  🦆  │   │  🐑  │   ← luôn 4 hình (điện thoại: 2 × 2)
        └──────┘   └──────┘   └──────┘
   phụ đề (hàng riêng, cao cố định)
```
- **🔊 Listen!** và **chạm Bông**: nghe lại tiếng kêu + câu hỏi.
- **Luôn 4 hình** ở mọi mức (2 hình quá dễ đoán). Điện thoại dọc: xếp 2 × 2.

## 2. Cách chơi
| Lúc | App |
|---|---|
| Vào trò | Con vật: *"Listen! Who says that?"*. Đồ vật / Trộn: *"Listen! What makes that sound?"* |
| Mỗi câu | **Tiếng thật** (file ghi âm; không có thì Bông đọc *"Moo! Moo!"*). Phụ đề chỉ ghi chữ tiếng kêu (*Moo! Moo!*), **không** ghi tên → *"Who says moo?"* / *"What goes choo choo?"* |
| Chạm **đúng** | Thẻ viền xanh, nhún, tiếng hoan hô: *"Yes! The cow says moo!"* / *"Yes! The train goes choo choo!"* (*"The dishes go…"*) → *"Can you say moo?"*, chờ ~2 giây cho bé kêu theo → câu sau |
| Chạm **nhầm** | Thẻ lắc: *"That's the pig! The pig says oink!"* (đồ vật: *"That's the car! The car goes beep beep!"*) → phát lại tiếng → hỏi lại. Không trừ gì |

- **Nhầm từ lần 3** trong cùng câu: câu ngắn *"That's the pig!"* → *"Who says moo?"* (không đọc lại cả tràng).
- **Chạm nhầm liên tục** (chạm đúp, chạm loạn): trong 0,4 giây chỉ tính một lần nhầm. **Chạm đúng luôn được nhận**, kể cả ngay sau lần nhầm.
- **Chọn đúng:** khóa cả câu (chạm thêm không tính), ghi tiến độ một lần.
- *"Can you say moo?"* không bắt bé nói (không có mic): chờ ~2 giây rồi tự sang câu sau.
- **Gợi ý** (tối đa 2 lần / câu, tính chung hai cách):
  - nhầm 2 lần → con đúng sáng lên;
  - **10 giây không chạm** → con đúng sáng lên kèm tiếng kêu.
    - Chỉ đếm khi bé **thật sự đang chờ**: bắt đầu sau khi Bông hỏi xong. Gặp lúc Bông đang nói (nghe lại 🔊, câu nhầm) thì đếm lại từ đầu, nên gợi ý không bất ngờ chen vào câu đang nói.
    - Dừng khi bé không chạm 2 phút (tạm nghỉ) và khi app ra nền.
  - Đã dùng 2 gợi ý: nhầm tiếp vẫn được thử lại, không có gợi ý thứ 3.
- **Một hàng nói duy nhất:** câu mới thay câu cũ (giọng đọc cắt câu đang đọc), không bao giờ đọc chồng. Bấm 🔊 liên tục chỉ đọc lại từ đầu.
- **Giọng đọc lỗi / máy không có giọng:** phụ đề vẫn hiện từng câu; chọn đúng vẫn sang câu sau. Bé không bị kẹt.
- **Một lượt = 5 câu**, con được hỏi không lặp → Hoan hô + **sticker** (một lần) → về Góc trò chơi.
- **"2/5"** = câu **đang hỏi** (câu thứ 2); trả lời đúng câu 2 thì chuyển sang 3/5.
- **App ra nền rồi quay lại** (≤ 10 phút, cùng mức):
  - chơi tiếp **đúng câu đang hỏi**, giữ **số lần nhầm và số gợi ý đã dùng**, thứ tự thẻ không đổi; Bông giả lại tiếng kêu rồi hỏi lại;
  - ra nền **lúc Bông đang khen** (đã trả lời đúng): quay lại là **câu sau**, không hỏi lại / ghi tiến độ hai lần;
  - đúng câu cuối rồi mới ra nền: quay lại là hoan hô + sticker luôn.

## 3. Con vật và đồ vật
- **15 con, đều là sticker Dán tranh.** Cùng mã, cùng emoji, và **ảnh bố mẹ đã thay ở Ảnh Dán tranh dùng luôn**.
- Tiếng kêu không trùng nhau.
- Thứ tự quen → lạ:

| Mức 1 (6 con) | thêm ở mức 2 (10 con) | thêm ở mức 3 (15 con) |
|---|---|---|
| cow *moo*, dog *woof*, cat *meow*, duck *quack*, pig *oink*, sheep *baa* | chicken *cluck*, horse *neigh*, bird *tweet*, lion *roar* | frog *ribbit*, monkey *ooh ooh*, owl *hoot*, bee *buzz*, snake *hiss* |

- **11 đồ vật** (quen → lạ), câu *"What goes …?"*:

| Mức 1 (6) | thêm ở mức 2 (9) | thêm ở mức 3 (11) |
|---|---|---|
| car *beep beep*, train *choo choo*, phone *ring ring*, clock *tick tock*, drum *boom boom*, dishes *clink clink* | plane *zoom*, fire truck *nee naw*, bicycle *ding ding* | helicopter *chop chop*, motorbike *vroom* |

- 9 đồ vật là sticker Dán tranh (cùng mã, cùng ảnh). **Bát đĩa 🍽️ và điện thoại ☎️** không có trong Dán tranh: ảnh thay ở trang Ai kêu thế? (mục 6).
- Tiếng kêu không trùng nhau trong cả 26 thứ (Trộn không có hai thứ cùng tiếng).
- **Nhóm của mức gồm cả nhóm của mức thấp hơn:** con vật 6 / 10 / 15, đồ vật 6 / 9 / 11. **Trộn** = cả hai nhóm của mức (12 / 19 / 26).
- **Tiếng** (ưu tiên từ trên xuống):
  1. tiếng **bố mẹ thêm** (ghi âm / chọn file ở mục 6);
  2. **file ghi âm thật có sẵn** trong app (`app/sounds/<id>.mp3`, CC0 / public domain, nguồn ghi ở `app/sounds/CREDITS.md`);
     - **Có đủ 26 file (0.27.1)**, tổng ~570 KB, lưu sẵn offline.
     - Nguồn: Wikimedia Commons, BigSoundBank, Freesound (CC0), Cục Công viên Quốc gia Mỹ (public domain); giấy phép kiểm tra trên trang của từng file.
     - Mỗi file cắt còn 1,2–3,3 giây đúng đoạn tiếng kêu to nhất (đo âm lượng từng 0,25 giây), vào / ra nhỏ dần, chỉnh cùng độ to, mp3 mono 64 kbps.
     - **Khớp chưa hoàn hảo, cần thử tay:** khỉ là tinh tinh; rắn là tiếng xì (bản dựng cho kịch truyền thanh, vẫn hơi nhỏ); vịt là cả đàn kêu; xe cứu hỏa chỉ có còi. Bố mẹ thay được ở mục 6.
     - **0.27.2:** thay tiếng mèo (mèo nhà kêu "meo meo" hai tiếng rõ, BigSoundBank) và tiếng ếch (ếch cây kêu "quạc quạc" đều, NPS; thay tiếng ếch heo nghe như ủn ỉn); tiếng xe máy (xe Jawa rồ ga "brừm brừm", Wikimedia).
  3. **giọng đọc** của máy đọc chữ tiếng kêu (*"Moo! Moo!"*).
- Phát qua **WebAudio** (iOS đã mở khóa âm thanh từ lần chạm "Bắt đầu"; thẻ `<audio>` dễ bị iOS chặn).
  - Phát tối đa **5 giây**.
  - Câu mới chen vào thì dừng tiếng đang phát.
  - Lỗi / âm thanh bị khóa thì dùng giọng đọc.
- Thẻ lấy ảnh **theo mã con vật lúc hiện thẻ**, dùng chung nguồn ảnh với Dán tranh (không sao chép): bố mẹ thay ảnh ở Dán tranh thì lần chơi sau tự dùng ảnh mới. Chưa có ảnh / ảnh hỏng thì emoji.

**Chọn câu hỏi của một lượt (5 câu):**
1. Con đúng: 5 con **khác nhau** trong nhóm của mức.
   - Tối đa **3 con bé ít gặp nhất**: theo số lần "đã gặp" trong tiến độ; bằng nhau thì ngẫu nhiên.
   - **2 con còn lại ngẫu nhiên** trong nhóm, để một lượt không dồn hết vào con lạ.
2. Thứ tự 5 câu xáo trộn.
3. Mỗi câu: con đúng + (số lựa chọn − 1) con gây nhiễu **khác con đúng, không trùng nhau**, chọn ngẫu nhiên trong nhóm; **xáo vị trí thẻ**. Tiếng kêu không trùng nhau nên không có cặp nghe giống hệt.

**Tiến độ:** chạm **đúng** thì ghi **"đã gặp"** từ đó (`practiceCount` +1, chung với tiến độ từ vựng, lưu lâu dài).
- Nghĩa là "bé nhận ra con vật theo tiếng kêu", **không phải** bằng chứng bé đã nói được tên con vật.
- Chạm nhầm, nghe lại không ghi gì.

## 4. Mức
| Mức | Số hình | Con vật | Đồ vật | Trộn |
|---|---|---|---|---|
| 1 (mặc định) | 4 | 6 con quen | 6 đồ quen | 12 |
| 2 | 4 | 10 con | 9 đồ | 19 |
| 3 | 4 | 15 con | 11 đồ | 26 |
- Mọi kiểu dùng chung một mức và một bộ đếm lượt.
- **Cài đặt** `soundsGame = { level, rounds, lock }` (giữ tên `rounds` như các trò trước):

  | Trường | Ý nghĩa | Mặc định / dữ liệu hỏng |
  |---|---|---|
  | `level` | mức đang chơi, 1–3 | 1 |
  | `rounds` | số **lượt đã chơi xong ở mức hiện tại** (một lượt = đủ 5 câu, bất kể nhầm bao nhiêu lần) | 0 |
  | `lock` | `null` = tự lên mức; 1 / 2 / 3 = bố mẹ khóa ở mức đó | `null` |
- **Tự lên mức:**
  - đủ **3 lượt** ở mức hiện tại → lên **một** mức, `rounds` về 0;
  - mức 3 thì không lên thêm;
  - chưa có dữ liệu thì bắt đầu mức 1; mở trò không reset tiến độ.
- **Khóa mức** (*Cài đặt → Mức chơi Ai kêu thế?*): giữ đúng mức đã chọn, **không đếm lượt**. Mở khóa thì tiếp tục từ mức đang khóa, đếm lượt lại từ 0.
- **Đổi mức trong lúc đang chơi:** áp dụng **từ lượt sau** (số thẻ không đổi giữa chừng).

## 6. Góc bố mẹ → Ảnh & tiếng Ai kêu thế? (draft3)
- **Mỗi thứ một ô (26 ô):** hình, tên, tiếng kêu, **nguồn tiếng đang dùng** (🎙️ Tiếng bố mẹ thêm / 🔊 Tiếng thật có sẵn / 🗣️ Giọng đọc), các nút:
  - **▶ Nghe:** phát đúng tiếng trò chơi sẽ phát;
  - **🎙️ Ghi âm** (máy ghi âm được): bấm lần nữa để dừng, tự dừng sau 5 giây; bản ghi < 0,3 giây thì báo ghi lại;
  - **📁 Chọn file tiếng:** mp3 / m4a / wav.
    - Tối đa 3 MB; máy phải giải mã được, không thì báo lỗi.
    - Dài hơn 5 giây thì vẫn lưu, báo "chỉ phát 5 giây đầu".
  - **↩ Dùng tiếng có sẵn:** bỏ tiếng bố mẹ thêm;
  - bát đĩa / điện thoại: **Chọn ảnh / Thay ảnh** (app bỏ nền trắng) và **Dùng emoji**.
- **Thứ có sticker Dán tranh:** không có nút ảnh. Trang ghi rõ "thay ở Ảnh Dán tranh", có nút mở trang đó.
- **Lưu trữ:** trong kho ảnh, mã `sounds:images` (ảnh) và `sounds:audio` (tiếng), theo mã thứ.
  - Có trong sao lưu.
  - Bộ lọc "ảnh trò chơi" có tiền tố `sounds:`, nên không bị gợi ý như ảnh bài học.
- **Chia sẻ** sang máy khác: khối "1. Tạo file / 2. Gửi file / Nhập từ file". Nhập được cả ở Quản lý bài; tiếng / ảnh mới hơn thắng.

## 5. Kiểm thử (draft2: thêm ca của review QA)
- **Unit:**
  - 15 con đều là sticker Dán tranh, tiếng kêu không trùng;
  - câu hỏi theo mức (số lựa chọn, nhóm, không lặp, ưu tiên con ít gặp);
  - câu nói (giả tiếng kêu không lộ tên);
  - lên mức / khóa mức.
- **UI:**
  - mức 1: 2 thẻ; nhầm → câu nhầm, nhầm 2 lần con đúng sáng; đúng → khen + "Can you say …?" → câu 2;
  - 5 câu → sticker, đếm lượt, ghi tiến độ;
  - mức 3: 4 thẻ; 🔊 nghe lại; gợi ý 10 giây;
  - ảnh sticker Dán tranh hiện trong thẻ;
  - **TC14:** giọng đọc lỗi → phụ đề vẫn hiện, chọn đúng vẫn sang câu 2;
  - **TC08 + TC10:** chạm đúp con nhầm chỉ tính 1 lần; ra nền rồi quay lại giữ câu và số lần nhầm (nhầm thêm 1 → con đúng sáng).
  - **draft3:**
    - luôn 4 hình; Đồ vật: *"Listen! What makes that sound?"* → *"What goes …?"* → khen *"goes / go"*;
    - Góc bố mẹ: 26 ô; chọn file tiếng → "Tiếng bố mẹ thêm" → bỏ; bát đĩa thay ảnh;
    - trò chơi phát tiếng bố mẹ thêm (`data-sound-from="custom"`), không đọc bằng giọng máy.
- **Unit thêm (draft3):**
  - 11 đồ vật (sticker nếu có, bát đĩa / điện thoại emoji riêng); tiếng không trùng trong 26 thứ;
  - nhóm theo kiểu + mức; luôn 4 hình;
  - câu đồ vật (*goes / go, Those are*);
  - mỗi file khai báo trong `SOUND_FILES` phải có thật trong `app/sounds/`.
- **Unit thêm:** tối đa 3 / 5 câu là con ít gặp (không lượt nào thiếu, hiếm khi toàn con lạ); khóa mức không đếm lượt, mở khóa đếm lại từ 0.
- **Các ca review đã có trong code nhưng chưa có test tự động:**
  - TC01 / TC12: chọn đúng khóa câu, sticker một lần;
  - TC03: không có gợi ý thứ 3;
  - TC04: gợi ý không chen lúc đang nói;
  - TC05: 🔊 liên tục không đọc chồng;
  - TC07: không vượt mức 3 (có unit);
  - TC09: ảnh hỏng → emoji.
