
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## Hướng dẫn Bắt đầu nhanh cho Admin

1. **Đăng ký tài khoản Admin (KHUYẾN KHÍCH)**:
   - Nếu đăng nhập Google gặp lỗi trên Cloud Workstations, hãy sử dụng phương thức **Email/Password**.
   - Truy cập vào tab **"Đăng ký" (Sign Up)** trên màn hình đăng nhập.
   - Nhập email: `igen-architect@admin.com` và đặt mật khẩu.
   - Sau khi nhấn Đăng ký, hệ thống sẽ thông báo thành công.

2. **Đăng nhập**:
   - Quay lại tab **"Đăng nhập" (Login)**.
   - Sử dụng tài khoản vừa tạo để đăng nhập.
   - Hệ thống sẽ tự động gán mã đối tác Tier 1 (`AIzaSyBF...`) và cấp quyền Quản trị viên.

## Giải quyết lỗi Xác thực (FirebaseError)

Nếu bạn không thể đăng nhập bằng Gmail, hãy thực hiện kiểm tra 3 bước sau:

### 1. Kích hoạt Identity Toolkit API (Cực kỳ quan trọng)
- Google Sign-In yêu cầu API này phải được bật trong Google Cloud Console.
- Truy cập: [Google Cloud Console - Enabled APIs](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com).
- Nhấn **ENABLE** nếu nó chưa được bật.

### 2. Ủy quyền Tên miền (Authorized Domains)
- Truy cập [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/settings).
- Tại mục **Authorized domains**, nhấn **Add domain**.
- Dán tên miền của link preview hiện tại (ví dụ: `9000-firebase-studio...cloudworkstations.dev`).
- Nhấn **Save**.

### 3. Gỡ giới hạn API Key
- Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
- Nhấp vào mã API của dự án (`AIzaSyCnv...`).
- Đảm bảo mục **API restrictions** đang chọn **Don't restrict key**.
- Đồng thời kiểm tra **Application restrictions** đang để là **None**.

### 4. Kiểm tra Popup Blocker
- Cloud Workstations thường chạy trong iframe hoặc môi trường bảo mật cao, trình duyệt có thể chặn cửa sổ đăng nhập Google. Hãy nhấn vào biểu tượng "Popup blocked" ở thanh địa chỉ trình duyệt và chọn "Always allow".
