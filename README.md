
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## 📊 Quản lý Dự án (Dành cho Chủ sở hữu)

Để xem danh sách người dùng và các API Key đã được lưu trữ, bạn hãy truy cập các đường dẫn sau trong Firebase Console:

- **Danh sách Tài khoản (Gmail/Email):** [Firebase Auth Users](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/users)
- **Dữ liệu & API Keys:** [Firestore Database - Users Collection](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/firestore/data/~2Fusers)

**Lưu ý:** Chỉ có bạn (chủ sở hữu dự án trên Google Cloud) mới có quyền truy cập vào các trang quản trị này. Dữ liệu của người dùng được bảo vệ an toàn bằng Firebase Security Rules.

## 🛠 Hướng dẫn Khắc phục lỗi Đăng nhập Gmail (Firebase Auth)

### 1. Cách sử dụng Billing API mà KHÔNG cần Verification (Xác minh)
Nếu bạn chưa có logo hoặc domain chính thức, bạn vẫn có thể sử dụng tính năng đồng bộ số dư bằng cách:
- Truy cập [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=project-5306ce34-5626-488a-913).
- Đảm bảo **Publishing status** là **Testing** (KHÔNG nhấn Publish).
- Tại mục **Test users**, nhấn **ADD USERS** và thêm các địa chỉ Gmail sẽ sử dụng ứng dụng.
- **Khi đăng nhập:** Nếu thấy cảnh báo "Google hasn't verified this app", hãy nhấn **Advanced** -> **Go to [App Name] (unsafe)** để tiếp tục.

### 2. Thiết lập Email Hỗ trợ Dự án (BẮT BUỘC)
Google OAuth sẽ KHÔNG hoạt động nếu thiếu thông tin này.
- Truy cập: [Firebase Console - Project Settings](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/settings/general)
- Tại mục **Support email**, chọn địa chỉ email của bạn.
- Nhấn **Save**.

### 3. Kích hoạt Identity Toolkit API & Google People API
- **Link 1:** [Kích hoạt Identity Toolkit API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=project-5306ce34-5626-488a-913)
- **Link 2:** [Kích hoạt Google People API](https://console.cloud.google.com/apis/library/people.googleapis.com?project=project-5306ce34-5626-488a-913)
- Nhấn nút **ENABLE** cho cả hai.

### 4. Cấu hình cho Safari (Giải pháp tạm thời)
- Vào **Safari Settings** -> **Privacy**.
- **BỎ CHỌN** mục: `Prevent Cross-Site Tracking` (Ngăn chặn theo dõi chéo trang).
