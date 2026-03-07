
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## Hướng dẫn Khắc phục lỗi Đăng nhập Gmail (Firebase Auth)

Nếu bạn gặp lỗi "Missing or insufficient permissions" hoặc không thể đăng nhập bằng Gmail trên Cloud Workstations, hãy thực hiện chính xác 3 bước sau:

### 1. Kích hoạt Identity Toolkit API (BẮT BUỘC)
Đây là nguyên nhân phổ biến nhất khiến Firebase Auth không hoạt động.
- **Link trực tiếp:** [Google Cloud Console - Identity Toolkit API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=project-5306ce34-5626-488a-913)
- Nhấn nút **ENABLE** (Kích hoạt).

### 2. Gỡ giới hạn API Key
Firebase Studio yêu cầu API Key phải có quyền truy cập vào các dịch vụ Auth.
- Truy cập: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913)
- Nhấp vào API Key của dự án (`AIzaSyCnv...`).
- Tại mục **API restrictions**, hãy chọn **Don't restrict key**.
- Tại mục **Application restrictions**, hãy chọn **None**.
- Nhấn **Save**.

### 3. Ủy quyền Tên miền (Authorized Domains)
Đảm bảo tên miền của link preview hiện tại đã được thêm vào Firebase.
- Truy cập: [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/settings)
- Nhấn **Add domain**.
- Dán tên miền: `9000-firebase-studio-1772698026240.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev`
- Nhấn **Add**.

---

## Hướng dẫn Bắt đầu nhanh cho Admin (Dự phòng)

Nếu việc đăng nhập Google vẫn gặp khó khăn do chính sách bảo mật của trình duyệt trên Cloud Workstations:

1. **Đăng ký tài khoản Email/Password**:
   - Truy cập vào tab **"Đăng ký" (Sign Up)** trên màn hình đăng nhập.
   - Nhập email: `igen-architect@admin.com` và đặt mật khẩu.
   - Sau khi nhấn Đăng ký, hệ thống sẽ thông báo thành công.

2. **Đăng nhập**:
   - Quay lại tab **"Đăng nhập" (Login)**.
   - Sử dụng tài khoản vừa tạo để đăng nhập.
   - Hệ thống sẽ tự động nhận diện Email Admin, gán mã đối tác Tier 1 (`AIzaSyBF...`) và cấp đầy đủ quyền hạn.
