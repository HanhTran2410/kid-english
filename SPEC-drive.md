# SPEC — Chia sẻ bài qua Google Drive

> Ngày: 2026-10-12 · Chốt: **cách A — tải thẳng lên Drive** (bố mẹ tự tạo Google Client ID một lần) · **Đã làm trong app 0.6.0**; **nhập bài từ link** (mục 7) trong 0.6.1

## 1. Mục tiêu
Sau khi bấm **"1. Tạo file bài"**, bố mẹ bấm **"3. Tải lên Google Drive"** là file bài vào thẳng **một thư mục cố định** trên Drive. Trên máy kia bấm **"Nhập bài từ Google Drive"**, chọn bài là nhập — không phải tải file về, không cần AirDrop/Zalo.

Vẫn 0 đồng, không có server: đăng nhập Google chạy ngay trong trình duyệt (Google Identity Services), app gọi Google Drive API trực tiếp.

## 2. Quyền và dữ liệu
- Quyền **`drive.file`**: app chỉ thấy file và thư mục **do chính app tạo** (cùng Client ID), không đọc được file khác trong Drive.
- File trên Drive là đúng file bài `.zip` của "Tạo file bài" (nội dung bài + ảnh + khung hình; không có ghi âm, tiến độ).
- Cài đặt lưu trên từng máy: `driveClientId`, `driveFolderName` (mặc định **Kid English**), `driveFolder` (id thư mục đã tìm được, để lần sau khỏi tìm).
- Vé đăng nhập chỉ giữ trong bộ nhớ (khoảng 1 giờ), không lưu xuống máy; hết hạn thì bấm lại là đăng nhập lại.

## 3. Màn hình
- **Cài đặt → Google Drive:** ô Client ID, ô tên thư mục, nút Lưu, nút **Kết nối thử** (đăng nhập + tìm/tạo thư mục), hướng dẫn lấy Client ID (mục 5).
- **Trang bài → Chia sẻ bài sang máy khác:** sau khi tạo file có thêm nút **"3. Tải lên Google Drive"** (chỉ hiện khi đã có Client ID; chưa có thì hiện dòng chỉ chỗ thiết lập).
  - Thư mục chưa có thì tạo; đã nhớ thư mục mà bị xóa thì tìm/tạo lại.
  - File **cùng tên** đã có trong thư mục thì **ghi đè** (sửa bài rồi tải lại không sinh bản trùng).
- **Quản lý bài:** nút **"Nhập bài từ Google Drive"** → danh sách file bài `.zip` trong thư mục (mới sửa trước) → chạm một file → nhập giống "Nhập bài từ file" (cùng luật gộp bài, nhật ký "Đã nhập gần đây").

## 4. Giới hạn đã biết
- **iPhone/iPad, app mở từ Màn hình chính:** cửa sổ đăng nhập Google đôi khi không mở được → app báo "mở app bằng Safari rồi thử lại". Mở bằng Safari luôn được.
- Lần đầu Google báo **"Google hasn't verified this app"** (app riêng, chế độ thử nghiệm) → bấm Continue. Chỉ email có trong "Test users" mới đăng nhập được.
- Cần mạng. Cửa sổ đăng nhập phải mở **ngay lúc bấm** (trình duyệt chặn cửa sổ mở sau đó), nên thư viện đăng nhập được tải sẵn khi mở trang có nút Drive; lần bấm đầu nếu thư viện chưa tải xong thì app báo "bấm lại sau vài giây".

## 5. Hướng dẫn lấy Client ID (một lần, miễn phí)
1. Trên máy tính mở **console.cloud.google.com**, đăng nhập Google, tạo dự án mới (ví dụ "Kid English").
2. **APIs & Services → Library**: tìm **Google Drive API** → **Enable**.
3. **Google Auth Platform** (hoặc "OAuth consent screen") → **Get started**: tên app "Kid English", email hỗ trợ là email của bạn, **Audience: External** → Create.
4. **Audience → Test users → Add users**: thêm email Google sẽ dùng trên iPhone/iPad.
5. **Clients → Create client** → *Application type*: **Web application** → *Authorized JavaScript origins* → **Add URI**: `https://hanhtran2410.github.io` → Create.
6. Copy **Client ID** (dạng `….apps.googleusercontent.com`) → trong app: **Góc bố mẹ → Cài đặt → Google Drive** → dán, **Lưu**, **Kết nối thử**. Làm trên từng máy.

## 6. Test
- Unit (`tests/unit/drive.test.js`, Drive giả): tìm/tạo thư mục, id đã nhớ bị xóa, tên có dấu nháy, tải lên mới / ghi đè cùng tên, liệt kê `.zip` mới nhất trước, tải về, hết phiên (401), mất mạng.
- Giao diện (`tests/ui/drive.spec.js`, Google giả): máy A kết nối → tạo file → tải lên (và tải lại = ghi đè) → máy B (trình duyệt riêng) xóa bài → nhập từ Drive → bài trở lại; đăng nhập một lần cho cả buổi; chưa thiết lập thì không có nút tải lên.
- **Thủ công trên iPhone** (chưa làm được tự động): đăng nhập thật bằng Safari và bằng app ở Màn hình chính.

## 7. Nhập bài từ link — không cần đăng nhập (app 0.6.1, chốt 2026-10-12)
Máy nhận **dùng tài khoản Google khác hoặc không có tài khoản** vẫn nhập được bài.
- **Máy gửi** cần thêm **Google API key** (Cài đặt → Google Drive; hướng dẫn trong app): Credentials → Create credentials → API key; giới hạn *Websites* `https://hanhtran2410.github.io/*` và *API*: Google Drive API.
- Tải lên xong (có API key): app bật **"ai có link đều xem được"** (chỉ quyền xem) cho file đó và hiện **link nhập bài** + nút **Copy link**. Link có dạng `https://hanhtran2410.github.io/kid-english/#drive=<mã file>&key=<API key>` (phần sau `#` không gửi lên máy chủ nào).
- **Máy nhận** (không cần Client ID, API key hay đăng nhập): Quản lý bài → **"Nhập bài từ link"** → dán link → **Nhập**. App tải file qua Drive API bằng API key trong link rồi nhập như "Nhập bài từ file". Link Google Drive thường (`…/file/d/<id>/view`) cũng dùng được nếu máy nhận có API key.
- Mở app bằng chính link nhập bài (ví dụ bấm link trong Zalo → Safari): app nhớ link, xóa phần `#` khỏi thanh địa chỉ, báo bố mẹ vào Quản lý bài — ô link đã điền sẵn. (Trên iPhone, app ở Màn hình chính và Safari có dữ liệu riêng: nên dán link trong app đang dùng cho bé.)
- Ai có link đều tải được file bài (nội dung bài + ảnh; không có giọng bé, tiến độ). API key bị giới hạn theo trang web và chỉ Drive API.
- Test: unit (đọc/tạo link, tải công khai không gửi vé đăng nhập, key sai / file chưa chia sẻ, bật chia sẻ) và giao diện (máy A tải lên → link; máy C mới tinh dán link → nhập, không đăng nhập; mở app bằng link → điền sẵn).
- **App 0.6.2:** lỗi của Google hiện kèm **lý do Google trả về** (ví dụ `400, publishOutNotPermitted: …`). Bước bật chia sẻ link tách riêng: lỗi ở bước này vẫn báo "đã tải lên", và nếu tài khoản bị chặn chia sẻ ra ngoài (thường gặp ở tài khoản công ty / trường học — Google Workspace) thì giải thích và gợi ý dùng **Gmail cá nhân** hoặc nhờ quản trị viên cho phép.

## 8. Thư viện bài trên GitHub (app 0.34.0, 2026-10-23)
Chia sẻ bài cho nhiều người mà không cần Google Drive / API key: file bài để ngay trên trang app (GitHub Pages).

- **Chỗ để file:** thư mục `app/shared/` của repo — file `.zip` của app (bài học, ảnh trò chơi). Trang app phục vụ ở `https://hanhtran2410.github.io/kid-english/shared/<tên file>.zip`. Repo **công khai**: không để ảnh người thật (ảnh gia đình, ảnh bé).
- **Danh sách:** `app/shared/index.json` (tên bài, loại, số ảnh, dung lượng), tạo bằng `node scripts/make-shared-index.mjs`. Workflow **chạy lại script này cả trước bước test lẫn trước khi đưa app lên** (0.36.0: trước đây chỉ chạy ở bước deploy nên file tải qua web làm test `index.json khớp file` hỏng và chặn deploy), nên bố mẹ chỉ cần tải file `.zip` vào `app/shared/` (kể cả qua trang web GitHub: *Add file → Upload files*) là thư viện tự cập nhật sau 1–2 phút.
- **Không lưu offline:** service worker không cache `shared/` (test `sw.test.js` bỏ qua thư mục này); mở Thư viện bài cần mạng.
- **Góc bố mẹ → Quản lý bài → 📚 Thư viện bài:** danh sách file; mỗi file có **Nhập** (tải thẳng từ trang app, nhập như "Nhập bài từ file") và **Copy link** (link nhập bài `…/kid-english/#zip=shared%2F<file>` — mở link là app điền sẵn ở "Nhập bài từ link"). Bài đã có cùng tên trên máy hiện "✓ Đã có" (nhập lại vẫn được: bài trùng tên được đặt "… 2").
- **"Nhập bài từ link"** hiểu thêm (`app/js/link-import.js`):
  - link file `.zip` trên trang app (tuyệt đối hoặc tương đối `shared/…`), link nhập bài `#zip=`;
  - `github.com/<người>/<repo>/blob|raw/<nhánh>/<đường dẫn>.zip` → đổi sang `raw.githubusercontent.com` (cho tải trực tiếp);
  - link `.zip` bất kỳ — chỉ được nếu trang đó cho phép tải trực tiếp (OneDrive / Dropbox / Zalo thường **không**: tải file về rồi "Nhập bài từ file");
  - link Google Drive như mục 7.
- **Test:** `tests/unit/link-import.test.js` (đọc link, tải lỗi, index khớp file), `tests/ui/library.spec.js` (Thư viện bài → Nhập → "Đã có", dán link, mở app bằng `#zip=`).

## 9. Tải bài lên Thư viện bài bằng một nút (app 0.35.0, 2026-10-23)
Không cần lên github.com để tải file: app gọi GitHub REST API (cho gọi thẳng từ trình duyệt) bằng **fine-grained token** bố mẹ tạo một lần.

- **Token:** github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token; *Only select repositories* → repo của app; *Contents: Read and write* (chỉ quyền này). Dán ở **Góc bố mẹ → Cài đặt → GitHub — Thư viện bài** (ô mật khẩu) → **Kiểm tra** (đọc repo, báo có quyền ghi không).
- **Token chỉ ở máy này:** `githubToken` nằm trong `SECRET_SETTINGS` (`backup.js`) — không bao giờ vào file sao lưu / file chia sẻ; khôi phục "thay toàn bộ" giữ token của máy, token trong file (nếu có) bị bỏ. Ai mở được Góc bố mẹ trên máy đó cũng tải lên được → chỉ dán token trên máy bố mẹ.
- **Repo:** mặc định đoán từ địa chỉ GitHub Pages (`<owner>.github.io/<repo>/`), sửa được (`githubRepo`).
- **Tải lên tay:** Quản lý bài → mở bài → Chia sẻ bài → **☁️ Tải lên Thư viện bài (GitHub)** (lần đầu hỏi xác nhận: repo công khai, không tải bài có ảnh người thật). File: `app/shared/<số>-<tên>.zip` (`lessonFileName`). Đã có file cùng tên mà không phải bài này (bài máy khác trùng số) → hỏi ghi đè. Xong: hiện link nhập bài `#zip=` + Copy link; bài đã tải thì nút thành **☁️ Cập nhật trên Thư viện bài** (ghi đè, có `sha`).
- **Tự tải lên** (ô tích ở Cài đặt, mặc định tắt):
  - bài **mới tạo** (Tạo bài → Lưu bài) được đánh dấu chờ (`githubPending`);
  - trang chi tiết bài dựng lại sau mỗi lần thêm ảnh, nên chỉ tải khi **rời hẳn bài 15 giây** (vào lại đúng bài thì hủy hẹn); mở Quản lý bài thì tải ngay các bài còn chờ;
  - bài **đã có trong thư viện** (`githubUploads`: mã bài → file, dấu hiệu nội dung) mà sửa / thêm ảnh → tự tải lại khi rời trang;
  - bài nhập từ nơi khác / bài mẫu không tự tải; file trùng tên của bài khác → tự đặt tên `-2`, `-3`…;
  - lỗi (mất mạng, token hết hạn) chỉ báo nhẹ; bài vẫn chờ, lần sau thử lại.
- Mỗi lần tải = một commit vào `main` → workflow deploy tạo lại `index.json`, bài hiện trong 📚 Thư viện bài sau 1–2 phút.
- **Test:** `tests/unit/github.test.js` (repo, API giả, lỗi, token không vào sao lưu / khôi phục giữ token), `tests/ui/github.spec.js` (Kiểm tra, nút tải lên, tự tải lên — API GitHub giả lập).

## 10. Chuông thông báo 🔔 (app 0.36.0, 2026-10-23)
Báo cho bố mẹ ngay ở **màn hình chính** (và đầu các trang Góc bố mẹ) khi có bản app mới, hoặc có bài mới / bài cập nhật trong Thư viện bài.

- **Kiểm tra** (`app/js/notices.js`): 2 giây sau khi mở app, mỗi lần quay lại app, và mỗi 30 phút. Cần mạng; lỗi / offline thì im lặng.
  - **Bản mới:** đọc `VERSION` trong `sw.js` trên trang (không qua cache), mới hơn `APP_VERSION` thì báo.
  - **Bài mới:** đọc `shared/index.json`; so với `librarySeen` (tên file|dung lượng đã thấy trên máy này). File chưa thấy = bài mới; file đã thấy mà dung lượng đổi = bản cập nhật. **Lần đầu** (chưa có `librarySeen`) lấy cả thư viện hiện có làm mốc, không báo.
- **Chuông** (`screens/notice-bell.js`): nút 🔔 có số, **chỉ hiện khi có tin** (rung nhẹ 3 lần). Bấm → bảng thông báo:
  - "Có bản mới x.y.z" → **Cập nhật ngay** (áp dụng bản service worker đang chờ, chưa có thì tải rồi mở lại app);
  - danh sách bài mới / cập nhật → **Nhập** từng bài (tải từ trang app, nhập như "Nhập bài từ file" — `importPackage` dùng chung với Quản lý bài), **Nhập hết**, **Để sau** (đánh dấu đã xem, không báo lại).
- Mở 📚 Thư viện bài trong Quản lý bài cũng tính là đã xem cả thư viện.
- Chuông ở màn hình của bé bấm được trực tiếp (theo yêu cầu bố mẹ: dễ thấy); việc bé có thể làm là nhập bài / cập nhật app — không mất dữ liệu.
- **Test:** `tests/unit/notices.test.js`, `tests/ui/notices.spec.js` (mốc lần đầu, bài mới → Nhập → chuông ẩn; bản mới; Để sau).
