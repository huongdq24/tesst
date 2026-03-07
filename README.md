
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## 🛠 Hướng dẫn Khắc phục lỗi Đăng nhập Gmail (Firebase Auth)

Nếu bạn gặp lỗi màn hình trắng hoặc "Google Sign-In Failed", hãy thực hiện chính xác các bước sau:

### 1. Thiết lập Email Hỗ trợ Dự án (BẮT BUỘC)
Google OAuth sẽ KHÔNG hoạt động nếu thiếu thông tin này.
- Truy cập: [Firebase Console - Project Settings](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/settings/general)
- Tại mục **Public-facing name**, đảm bảo đã đặt tên (ví dụ: iGen AI).
- Tại mục **Support email**, chọn địa chỉ email của bạn từ danh sách thả xuống.
- Nhấn **Save**.

### 2. Kích hoạt Identity Toolkit API & Google People API
- **Link 1:** [Kích hoạt Identity Toolkit API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=project-5306ce34-5626-488a-913)
- **Link 2:** [Kích hoạt Google People API](https://console.cloud.google.com/apis/library/people.googleapis.com?project=project-5306ce34-5626-488a-913)
- Nhấn nút **ENABLE** cho cả hai.

### 3. Cấu hình cho Safari (Nếu dùng Mac/iPhone)
Safari chặn liên lạc chéo giữa popup và trang chính.
- Vào **Safari Settings** -> **Privacy**.
- **BỎ CHỌN (Uncheck)** mục: `Prevent Cross-Site Tracking` (Ngăn chặn theo dõi chéo trang).
- Nếu vẫn lỗi, thử dùng **Google Chrome** hoặc **Microsoft Edge**.

### 4. Gỡ giới hạn API Key
- Truy cập: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913)
- Nhấp vào API Key của dự án (`AIzaSyCnv...`).
- Đảm bảo chọn **Don't restrict key**.

---

## ⚡ GIẢI PHÁP NHANH (Vượt qua mọi rào cản trình duyệt)

Nếu việc đăng nhập Google vẫn gặp khó khăn do chính sách bảo mật của môi trường Cloud Workstation, hãy sử dụng phương thức **Đăng ký (Sign Up)** trực tiếp:

1. Truy cập tab **"Đăng ký" (Sign Up)**.
2. Nhập email: `igen-architect@admin.com` và mật khẩu bất kỳ.
3. Hệ thống sẽ tự động cấp quyền **Admin** và sẵn **$300 Credits**.
