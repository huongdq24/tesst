
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
Để ứng dụng hiển thị con số thật từ tài khoản của bạn, bạn cần thực hiện các bước sau trên Google Cloud Console:

1. **Enable API**: Bật **Cloud Billing API** tại Google Cloud Console.
2. **IAM Configuration**: 
   - Truy cập trang **Billing** -> Chọn Billing Account của bạn.
   - Thêm quyền cho **Service Account** của App Hosting (hoặc email của bạn).
   - Gán vai trò: **Billing Account Viewer**.
3. **Project ID**: Đảm bảo biến `DEFAULT_PROJECT_ID` trong code trỏ đúng về ID dự án của bạn (`project-5306ce34-5626-488a-913`).

---

## 🛠 Lộ trình tiếp theo
- **Budget API**: Tích hợp thêm Budget API để theo dõi hạn mức chi tiêu tự thiết lập nếu không dùng gói Free Trial.
- **Auto-Sync**: Tối ưu hóa tần suất đồng bộ giữa Firestore và Billing API để giảm thiểu số lượng lời gọi API.
