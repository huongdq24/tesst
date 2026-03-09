
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing thực tế.

---

## 📊 Cơ chế quản lý Credits (Tín dụng) thực tế

Ứng dụng hiện tại đã được cấu hình để đọc dữ liệu trực tiếp từ Google Cloud Billing API.

### Phân tích cơ chế bóc tách dữ liệu (JSON)
Khi tài khoản có gói dùng thử hoặc tín dụng khuyến mãi, Google trả về mảng `credits` trong thông tin Billing:

```json
{
  "credits": [
    {
      "displayName": "Free Trial",
      "amount": { "currencyCode": "VND", "value": "7835100" },
      "remainingAmount": { "currencyCode": "VND", "value": "7835100" },
      "expirationTime": "2026-06-02T23:59:59Z"
    }
  ]
}
```

- **Logic xử lý**: 
  1. Hệ thống gọi `getProjectBillingInfo`.
  2. Quét mảng `credits` để tìm số dư (`remainingAmount`).
  3. Nếu đơn vị là `VND`, hệ thống sẽ quy đổi xấp xỉ sang `USD` (chia cho 25.000) để hiển thị đồng bộ trên giao diện với ký hiệu `$`.
  4. Nếu không có gói tín dụng nào (Tài khoản Free Tier thông thường), số dư sẽ hiển thị đúng là **$0.00**.

## 🚀 Cách kích hoạt quyền truy cập thực tế

Để Web App hiển thị con số thật, bạn cần cấp quyền cho **Service Account** của ứng dụng thay vì đăng nhập thủ công mỗi lần.

### Bước 1: Tìm email Service Account
Khi bạn deploy ứng dụng lên Firebase App Hosting, một email tự động sẽ được tạo (thường có đuôi `@developer.gserviceaccount.com`). Bạn có thể tìm thấy nó trong phần **IAM & Admin** của Google Cloud Console.

### Bước 2: Gán quyền Billing
1. Truy cập trang **Billing** trong Google Cloud Console.
2. Chọn Billing Account của bạn.
3. Ở cột bên phải (hoặc tab Account Management), nhấn **Add Principal**.
4. Dán email Service Account ở Bước 1 vào.
5. Gán vai trò (Role): **Billing Account Viewer**.

### Bước 3: Đảm bảo Project ID chính xác
Đảm bảo biến `DEFAULT_PROJECT_ID` trong `src/app/home/page.tsx` trỏ đúng về ID dự án của bạn (`project-5306ce34-5626-488a-913`).

---

## 🛠 Lợi ích của cơ chế này
- **Chính xác 100%**: Dữ liệu lấy trực tiếp từ hệ thống kế toán của Google.
- **Tự động**: Số dư cập nhật ngay cả khi bạn không đăng nhập.
- **Bảo mật**: Service Account chỉ có quyền xem hóa đơn, không thể thay đổi cài đặt dự án.
