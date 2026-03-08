
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing.

---

## 🚀 Lộ trình triển khai cho hàng nghìn người dùng (Production)

Để ứng dụng có thể hoạt động ổn định và chuyên nghiệp cho người dùng đại chúng, bạn cần thực hiện quy trình xác minh của Google theo các bước sau:

### Bước 1: Chuẩn bị Hạ tầng & Pháp lý (Bắt buộc)
1. **Sở hữu Domain:** Mua một tên miền chính thức (ví dụ: `architect-igen.ai`).
2. **Hosting:** Triển khai ứng dụng lên Production (Firebase App Hosting hoặc Vercel) trỏ về Domain đã mua.
3. **Trang Chính sách (Privacy Policy):** Tạo một trang web (ví dụ: `architect-igen.ai/privacy`) chứa nội dung cam kết bảo mật thông tin Billing của người dùng.
4. **Google Search Console:** Thêm Domain của bạn vào [Search Console](https://search-console.google.com/) và xác minh quyền sở hữu.

### Bước 2: Cấu hình OAuth Consent Screen (Trang xác thực)
Truy cập [Google Cloud Console - OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent):
1. **User Type:** Chuyển từ "Testing" sang **"External"**.
2. **App Information:** Tải lên Logo chính thức và điền link Privacy Policy.
3. **Authorized Domains:** Thêm tên miền chính thức của bạn vào đây.
4. **Scopes:** Đảm bảo đã thêm `https://www.googleapis.com/auth/cloud-billing.readonly`.

### Bước 3: Gửi yêu cầu Xác minh (Submit for Verification)
Đây là bước tốn thời gian nhất (3-7 ngày). Bạn cần chuẩn bị:
1. **Video Demo:** Quay màn hình quy trình đăng nhập Google từ đầu đến khi hiện số dư Credits. Tải lên YouTube (Unlisted).
2. **Giải trình:** Viết một đoạn văn ngắn (Tiếng Anh) giải thích: *"Ứng dụng của tôi giúp kiến trúc sư quản lý ngân sách AI của họ trên Google Cloud một cách trực quan bằng cách hiển thị số dư thực tế ngay trong ứng dụng thiết kế."*

---

## 📊 Quản lý Dự án (Dành cho Chủ sở hữu)

Dành cho bạn để quản lý người dùng hiện tại:

- **Danh sách Tài khoản:** [Firebase Auth Users](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/users)
- **Dữ liệu & iGen Codes:** [Firestore Database - Users Collection](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/firestore/data/~2Fusers)

## 🛠 Hướng dẫn cho giai đoạn Thử nghiệm (Testing)

Nếu bạn chưa có Domain/Logo và muốn dùng ngay cho nhóm nhỏ:
1. Truy cập [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent).
2. Đảm bảo trạng thái là **Testing**.
3. Tại mục **Test users**, nhấn **ADD USERS** và thêm Gmail của người dùng.
4. **Khi đăng nhập:** Nhấn **Advanced** -> **Go to [App Name] (unsafe)** để bỏ qua cảnh báo của Google.
