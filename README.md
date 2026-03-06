# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo.

## Khắc phục lỗi Xác thực (FirebaseError)

Nếu bạn gặp lỗi `signinwithpassword-are-blocked` hoặc `identity-toolkit-api-has-not-been-used`, hãy thực hiện các bước sau:

1. **Gỡ giới hạn API Key**: 
   - Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=project-5306ce34-5626-488a-913).
   - Chọn API Key đang sử dụng.
   - Tại mục **API restrictions**, chọn **Don't restrict key** (hoặc thêm **Identity Toolkit API** và **Token Service API**).
   - Nhấn **Save**.

2. **Kích hoạt Email/Password**:
   - Truy cập [Firebase Console - Auth Providers](https://console.firebase.google.com/project/project-5306ce34-5626-488a-913/authentication/providers).
   - Bật phương thức **Email/Password**.

3. **Tạo Firestore Database**:
   - Truy cập [Firestore Console](https://console.cloud.google.com/firestore/databases?project=project-5306ce34-5626-488a-913).
   - Nhấn **Create Database**, chọn **Native Mode**.

4. **Bật TTL (Xóa tự động 30 ngày)**:
   - Truy cập [Firestore TTL Settings](https://console.cloud.google.com/firestore/databases/-default-/ttl?project=project-5306ce34-5626-488a-913).
   - Thêm chính sách cho collection `projects` với trường `createdAt`.
