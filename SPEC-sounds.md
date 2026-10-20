# SPEC — 🐮 Ai kêu thế? (Who says moo?)

> App **0.26.0**, draft2 ở **0.26.1** (theo review QA) · Ngày: 2026-10-20 · **Đã làm.** Một trò trong Góc trò chơi.
> Bông giả tiếng kêu con vật, bé chạm đúng con vật. Trẻ 3 tuổi rất thích tiếng kêu; trò ngắn, không cần mic.

## 1. Màn hình
```
 🏠  🎲   🐮 Who says moo?          2/5     🐰
                 [🔊 Listen!]
        ┌──────┐   ┌──────┐   ┌──────┐
        │  🐄  │   │  🐖  │   │  🦆  │        ← 2 / 3 / 4 con theo mức
        └──────┘   └──────┘   └──────┘
   phụ đề (hàng riêng, cao cố định)
```
- **🔊 Listen!** và **chạm Bông**: nghe lại tiếng kêu + câu hỏi.
- Điện thoại dọc: 4 con xếp 2 × 2.

## 2. Cách chơi
| Lúc | App |
|---|---|
| Vào trò | *"Listen! Who says that?"* (*Nghe này! Con gì kêu thế nhỉ?*) |
| Mỗi câu | Bông giả tiếng kêu *"Moo! Moo!"* (phụ đề **không** ghi tên con vật, để không lộ đáp án) → *"Who says moo?"* |
| Chạm **đúng** | Thẻ viền xanh, nhún, tiếng hoan hô: *"Yes! The cow says moo!"* → *"Can you say moo?"*, chờ ~2 giây cho bé kêu theo → câu sau |
| Chạm **nhầm** | Thẻ lắc: *"That's the pig! The pig says oink!"* → giả lại tiếng kêu → hỏi lại. Không trừ gì |

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

## 3. Con vật
- **15 con, đều là sticker Dán tranh.** Cùng mã, cùng emoji, và **ảnh bố mẹ đã thay ở Ảnh Dán tranh dùng luôn**.
- Tiếng kêu không trùng nhau.
- Thứ tự quen → lạ:

| Mức 1 (6 con) | thêm ở mức 2 (10 con) | thêm ở mức 3 (15 con) |
|---|---|---|
| cow *moo*, dog *woof*, cat *meow*, duck *quack*, pig *oink*, sheep *baa* | chicken *cluck*, horse *neigh*, bird *tweet*, lion *roar* | frog *ribbit*, monkey *ooh ooh*, owl *hoot*, bee *buzz*, snake *hiss* |

- **Nhóm của mức gồm cả con của mức thấp hơn:** mức 1 tổng 6 con, mức 2 tổng 10 con, mức 3 tổng 15 con.
- Tiếng kêu đọc bằng **giọng đọc của máy** (không cần file âm thanh). *Cần thử tay* với giọng tiếng Anh đang chọn: baa, cluck, neigh, ribbit, ooh ooh, hiss (unit test chỉ kiểm tra chuỗi chữ).
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
| Mức | Số con để chọn | Nhóm con vật |
|---|---|---|
| 1 (mặc định) | 2 | 6 con quen |
| 2 | 3 | 10 con |
| 3 | 4 | 15 con |
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
- **Unit thêm:** tối đa 3 / 5 câu là con ít gặp (không lượt nào thiếu, hiếm khi toàn con lạ); khóa mức không đếm lượt, mở khóa đếm lại từ 0.
- **Các ca review đã có trong code nhưng chưa có test tự động:**
  - TC01 / TC12: chọn đúng khóa câu, sticker một lần;
  - TC03: không có gợi ý thứ 3;
  - TC04: gợi ý không chen lúc đang nói;
  - TC05: 🔊 liên tục không đọc chồng;
  - TC07: không vượt mức 3 (có unit);
  - TC09: ảnh hỏng → emoji.
