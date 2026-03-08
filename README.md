
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## 📊 Quản lý Dự án (Dành cho Chủ sở hữu)

Để xem danh sách người dùng và các API Key đã được lưu trữ, bạn hãy truy cập các đường dẫn sau trong Firebase Console:

- **Danh sách Tài khoản (Gmail/Email):** [Firebase Auth Users](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/users)
- **Dữ liệu & API Keys:** [Firestore Database - Users Collection](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/firestore/data/~2Fusers)

**Lưu ý:** Chỉ có bạn (chủ sở hữu dự án trên Google Cloud) mới có quyền truy cập vào các trang quản trị này. Dữ liệu của người dùng được bảo vệ an toàn bằng Firebase Security Rules.

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

### 4. Giải pháp thay thế
Nếu việc đăng nhập Google vẫn gặp khó khăn, hãy sử dụng phương thức **Đăng ký (Sign Up)** trực tiếp bằng Email để nhận đầy đủ quyền lợi.
