
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing thực tế.

---

## 📊 Cơ chế quản lý Credits (Tín dụng) thực tế

Ứng dụng hiện tại đã được cấu hình để đọc dữ liệu trực tiếp từ Google Cloud Billing API thông qua Service Account của hệ thống.

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
  1. Hệ thống gọi `getProjectBillingInfo` của dự án `project-5306ce34-5626-488a-913`.
  2. Quét mảng `credits` để tìm số dư (`remainingAmount`).
  3. Nếu đơn vị là `VND`, hệ thống sẽ quy đổi xấp xỉ sang `USD` (chia cho 25.000) để hiển thị đồng bộ trên giao diện với ký hiệu `$`.
  4. Nếu không có gói tín dụng nào, số dư sẽ hiển thị đúng là **$0.00**.

## 🚀 Cách kích hoạt quyền truy cập thực tế (Dành cho Admin)

Để Web App hiển thị con số thật, bạn cần cấp quyền cho **Service Account** của ứng dụng:

### Bước 1: Tìm email Service Account
1. Truy cập trang [IAM & Admin](https://console.cloud.google.com/iam-admin/iam) trong Google Cloud Console.
2. Tìm email của Service Account được Firebase tạo tự động (thường có tên `firebase-app-hosting-backend` hoặc tương tự).

### Bước 2: Gán quyền Billing
1. Truy cập trang **Billing** trong Google Cloud Console.
2. Chọn Billing Account của bạn.
3. Ở tab **Account Management**, nhấn **Add Principal**.
4. Dán email Service Account ở Bước 1 vào.
5. Gán vai trò (Role): **Billing Account Viewer**.

---

## 🛠 Lợi ích của cơ chế Service Account
- **Không bao giờ hết hạn**: Không yêu cầu nhập lại mã hay đăng nhập lại.
- **Chính xác 100%**: Dữ liệu lấy trực tiếp từ hệ thống kế toán của Google.
- **Bảo mật**: Chỉ có quyền xem thông tin thanh toán, không thể can thiệp vào tài nguyên khác.
