# Bông dạy tiếng Anh 🐰

App cho bé 3 tuổi học tiếng Anh theo kiểu **nghe → nói lại**, chạy trên iPad/iPhone dưới dạng PWA ("Thêm vào Màn hình chính"). Không server, không tài khoản, không tốn tiền. Chi tiết thiết kế ở [SPEC.md](SPEC.md).

- Bài học do bố mẹ tạo bằng ChatGPT/Gemini bản miễn phí rồi dán vào app.
- Toàn bộ dữ liệu (bài, ảnh, ghi âm, tiến độ, sticker) chỉ nằm trong máy. Hãy **sao lưu mỗi tuần** (Góc bố mẹ → Sao lưu).

---

## 1. Chạy thử trên máy tính

Cần Node.js 20 trở lên.

```bash
npm install        # chỉ cần cho test; app không phụ thuộc thư viện nào khi chạy
npm run serve      # mở http://localhost:8080/
```

Trên máy tính, `localhost` được coi là an toàn nên mic vẫn dùng được. Thêm `?nosw` vào địa chỉ để tắt service worker khi đang sửa code.

## 2. Thử trên iPhone/iPad trước khi đưa lên GitHub Pages

Mic chỉ hoạt động qua **HTTPS**. Cách nhanh nhất là dùng Cloudflare quick tunnel (miễn phí, không cần tài khoản):

```bash
npm run serve
cloudflared tunnel --url http://localhost:8080   # in ra một link https://….trycloudflare.com
```

Mở link đó trong Safari trên iPhone. Lưu ý: dữ liệu gắn với từng địa chỉ, nên bài tạo trên link tạm sẽ không có khi chuyển sang link GitHub Pages. Nếu cần giữ lại thì sao lưu rồi khôi phục.

## 3. Đưa lên GitHub Pages

1. Tạo repo **public** tên `kid-english` trên tài khoản `HanhTran2410`, rồi đẩy code lên nhánh `main`.
2. Trên GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Mỗi lần đẩy code lên `main`, workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) sẽ chạy test rồi đưa thư mục `app/` lên Pages.
4. Link app: `https://hanhtran2410.github.io/kid-english/`

Repo chỉ chứa code, icon, font và 2 bài mẫu. Không có dữ liệu nào của bé.

### Khi sửa code

- Tăng số phiên bản ở **cả hai chỗ**: `APP_VERSION` trong [app/js/app.js](app/js/app.js) và `VERSION` trong [app/sw.js](app/sw.js). Test sẽ báo lỗi nếu hai số không khớp.
- Thêm hoặc bớt file trong `app/` thì cập nhật danh sách `ASSETS` trong `app/sw.js`. Test cũng sẽ báo nếu thiếu.
- iPad tải bản mới ngầm và áp dụng ở lần mở app sau. Muốn áp dụng ngay: Góc bố mẹ → nút **"Có bản mới — Cập nhật ngay"**.

## 4. Cài lên iPad/iPhone

1. Mở link app bằng **Safari**.
2. Bấm nút Chia sẻ → **Thêm vào Màn hình chính**.
3. **Luôn mở app từ biểu tượng 🐰 trên Màn hình chính.** Safari và app trên Màn hình chính lưu dữ liệu riêng. Mở trong tab Safari thì iOS có thể xóa dữ liệu sau 7 ngày không dùng.
4. Lần đầu mỗi buổi bấm nút ▶ to, rồi bấm **Cho phép** khi iPad hỏi quyền dùng micrô (và nhận dạng giọng nói).

### Cài đặt nên làm trên iPad

| Việc | Ở đâu | Vì sao |
|---|---|---|
| Tải giọng đọc chất lượng cao | Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Anh (và Tiếng Việt) → chọn giọng *Enhanced/Premium* | Giọng Bông rõ và tự nhiên hơn |
| Bật **Truy cập được hướng dẫn** | Cài đặt → Trợ năng → Truy cập được hướng dẫn. Khi bé học: bấm nút sườn 3 lần để khóa iPad trong app | Bé không vuốt thoát khỏi app được |
| Tự động khóa lâu hơn | Cài đặt → Màn hình & Độ sáng → Tự động khóa | Phòng khi iPad không hỗ trợ giữ màn hình sáng |
| Tắt chế độ im lặng | Nút gạt hoặc Trung tâm điều khiển | Chế độ im lặng có thể tắt tiếng "ding" |

## 5. Tạo bài học

1. Nhấn giữ ⚙️ ở góc màn hình chính **3 giây** để vào **Góc bố mẹ**.
2. **Tạo bài học** → chọn chủ đề, thời lượng, kiểu bài → **Copy prompt**.
3. Mở ChatGPT hoặc Gemini, dán prompt vào và gửi. Sau đó copy **toàn bộ** câu trả lời.
4. Quay lại app → **Dán bài** → **Kiểm tra bài** → xem trước (mỗi câu có 🔊) → **Lưu bài**.
5. (Tùy chọn) Thêm ảnh cho từng từ: bấm **Copy prompt ảnh**, nhờ ChatGPT/Gemini vẽ, lưu ảnh vào thư viện Ảnh, rồi bấm **Chọn ảnh**.

Nếu AI trả bài bị cắt ngang, nhắn cho AI chữ `continue` rồi copy lại toàn bộ.

## 6. Test

```bash
npm test                      # test logic (node:test): 71 test
npx playwright install chromium
npm run test:ui               # test giao diện trên Chrome cỡ iPad: 9 test
node scripts/screens.mjs      # chụp các màn hình cỡ iPhone/iPad vào test-results/screens/ (chạy server cổng 4173 trước)
```

Test giao diện giả lập giọng đọc và dùng mic giả của Chromium. Những gì chỉ kiểm tra được trên máy thật nằm trong danh sách test tay ở SPEC mục 8. Khi test trên iPad, soi lỗi bằng Safari Web Inspector trên Mac (Develop → tên iPad). Biến `kidEnglish` trong console là trạng thái của app.

## 7. Cấu trúc thư mục

```
app/                 ← toàn bộ nội dung đưa lên host
  index.html, sw.js, manifest.webmanifest
  css/app.css, fonts/ (Nunito, OFL), icons/, lessons/ (2 bài mẫu), vendor/jszip.min.js
  js/
    main.js, app.js        khởi động, điều hướng, thời gian buổi học
    lesson.js              đọc và kiểm tra bài AI trả về
    match.js               so khớp lỏng câu bé nói
    progress.js            ⭐ từng từ, chọn từ để ôn
    prompts.js             prompt tạo bài, prompt "cô giáo"
    db.js, settings.js     IndexedDB
    backup.js              sao lưu / khôi phục .zip
    stickers.js, session.js, text.js, timing.js, ui.js, image.js, samples.js
    speech/                giọng đọc, mic, nhận dạng, ghi âm, âm thanh, listen.js
    player/                bài học: thẻ từ, hội thoại, trò chơi, truyện, Hoan hô
    screens/               màn hình của bé, ôn tập, học cùng Bông, Góc bố mẹ
scripts/             serve.mjs, make-icons.mjs, screens.mjs
tests/unit/          test logic
tests/ui/            test giao diện (Playwright)
```
