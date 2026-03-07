
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## Hướng dẫn Khắc phục lỗi Đăng nhập Gmail (Firebase Auth)

Nếu bạn gặp lỗi "Google Sign-In Failed", hãy thực hiện chính xác theo thứ tự các bước sau:

### 1. Thiết lập Email Hỗ trợ Dự án (BẮT BUỘC)
Google Sign-in sẽ KHÔNG hoạt động nếu thiếu thông tin này.
- Truy cập: [Firebase Console - Project Settings](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/settings/general)
- Tại mục **Public-facing name**, đảm bảo đã đặt tên (ví dụ: iGen AI).
- Tại mục **Support email**, chọn địa chỉ email của bạn từ danh sách thả xuống.
- Nhấn **Save**.

### 2. Kích hoạt Identity Toolkit API & Google People API
- **Link 1:** [Kích hoạt Identity Toolkit API](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=project-5306ce34-5626-488a-913)
- **Link 2:** [Kích hoạt Google People API](https://console.cloud.google.com/apis/library/people.googleapis.com?project=project-5306ce34-5626-488a-913)
- Nhấn nút **ENABLE** cho cả hai.

### 3. Gỡ giới hạn API Key
- Truy cập: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913)
- Nhấp vào API Key của dự án (`AIzaSyCnv...`).
- Đảm bảo chọn **Don't restrict key**.

### 4. Ủy quyền Tên miền (Authorized Domains)
- Truy cập: [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/settings)
- Đảm bảo đã thêm domain preview: `9000-firebase-studio-1772698026240.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev`

---

## ⚡ GIẢI PHÁP NHANH (Nếu Google Auth vẫn lỗi do môi trường)

Nếu việc đăng nhập Google vẫn gặp khó khăn do chính sách bảo mật của trình duyệt, hãy sử dụng phương thức **Đăng ký (Sign Up)** trực tiếp:

1. Truy cập tab **"Đăng ký" (Sign Up)**.
2. Nhập email: `igen-architect@admin.com` và mật khẩu.
3. Hệ thống sẽ tự động gán quyền **Admin** và cấp sẵn **$300 Credits**.
