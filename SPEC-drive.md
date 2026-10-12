# SPEC — Chia sẻ bài qua Google Drive

> Ngày: 2026-10-12 · Chốt: **cách A — tải thẳng lên Drive** (bố mẹ tự tạo Google Client ID một lần) · **Đã làm trong app 0.6.0**

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
