
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## Hướng dẫn Bắt đầu nhanh cho Admin

1. **Đăng ký tài khoản Admin**:
   - Truy cập vào tab **"Đăng ký" (Sign Up)** trên màn hình đăng nhập.
   - Nhập email: `igen-architect@admin.com` và đặt mật khẩu.
   - Sau khi nhấn Đăng ký, hệ thống sẽ thông báo thành công.

2. **Đăng nhập**:
   - Quay lại tab **"Đăng nhập" (Login)**.
   - Sử dụng tài khoản vừa tạo để đăng nhập.
   - Hệ thống sẽ tự động gán mã đối tác Tier 1 (`AIzaSyBF...`) và cấp quyền Quản trị viên.

## Giải quyết lỗi Xác thực (FirebaseError)

### 1. Lỗi Google Sign-In trên Link Preview
Nếu bạn không thể đăng nhập bằng Gmail trên link `*.cloudworkstations.dev`, đó là do domain này chưa được ủy quyền trong Firebase.
- Truy cập [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/settings).
- Tại mục **Authorized domains**, nhấn **Add domain**.
- Dán tên miền của link preview hiện tại (ví dụ: `9000-firebase-studio...cloudworkstations.dev`).
- Nhấn **Save**.

### 2. Gỡ giới hạn API Key
Nếu bạn bị chặn API:
- Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913).
- Nhấp vào mã API gốc của dự án (`AIzaSyCnv...`).
- Tại mục **API restrictions**, chọn **Don't restrict key**.
- Nhấn **Save**.

### 3. Kích hoạt Email/Password
- Truy cập [Firebase Console - Auth Providers](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/providers).
- Đảm bảo mục **Email/Password** đang ở trạng thái **Enabled**.
