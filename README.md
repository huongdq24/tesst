
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

## 🚀 Cách kiểm tra dữ liệu thật
1. Đăng nhập bằng Gmail có quyền xem Billing của Project.
2. Hệ thống sẽ tự động chạy Server Action `getRealtimeCredits`.
3. Bạn có thể xem kết quả JSON thô được log tại Terminal của máy chủ khi ứng dụng đang chạy.

---

## 🛠 Lộ trình tiếp theo
- **Xác minh App**: Để đọc dữ liệu Billing của người dùng bất kỳ thông qua OAuth2, ứng dụng cần được Google Cloud Console xác minh chính thức.
- **Budget API**: Tích hợp thêm Budget API nếu muốn theo dõi các hạn mức chi tiêu tự thiết lập.
