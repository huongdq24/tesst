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

Nếu bạn gặp lỗi xác thực hoặc bị chặn API, hãy thực hiện các bước sau:

1. **Gỡ giới hạn API Key**: 
   - Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913).
   - Nhấp vào mã API gốc của dự án (`AIzaSyCnv...`).
   - Tại mục **API restrictions**, chọn **Don't restrict key** (hoặc tích thêm **Identity Toolkit API**).
   - Nhấn **Save**.

2. **Kích hoạt Email/Password**:
   - Truy cập [Firebase Console - Auth Providers](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/providers).
   - Đảm bảo mục **Email/Password** đang ở trạng thái **Enabled**.

3. **Lưu ý về Đăng nhập**:
   - Nếu bạn nhận được lỗi `auth/invalid-credential`, hãy kiểm tra xem bạn đã "Đăng ký" tài khoản đó chưa. Sử dụng tab **Đăng ký (Sign Up)** nếu là lần đầu tiên sử dụng.
