
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing thực tế.

---

## 📊 Cơ chế quản lý Credits (Tín dụng)

Ứng dụng hiện tại đã được nâng cấp để đọc dữ liệu trực tiếp từ cấu trúc **Credits Object** của Google Cloud Billing API.

### Phân tích dữ liệu thực tế (JSON)
Khi tài khoản có gói dùng thử, Google trả về mảng `credits` như sau:

```json
{
  "credits": [
    {
      "displayName": "Free Trial",
      "amount": { "currencyCode": "VND", "value": "7835100" },
      "remainingAmount": { "colorCode": "VND", "value": "7835100" },
      "expirationTime": "2026-06-02T23:59:59Z"
    }
  ]
}
```

- **Logic xử lý**: Hệ thống sẽ quét mảng này, tìm đối tượng có `displayName` là "Free Trial".
- **Quy đổi**: Do giá trị trả về là tiền VND (ví dụ: 7.835.100), ứng dụng sẽ thực hiện quy đổi xấp xỉ sang USD (chia cho tỷ giá 25.000) để hiển thị con số `$300.00` quen thuộc trên giao diện, hoặc hiển thị số dư thực tế nếu là tài khoản trả phí.

## 🛠 Hướng dẫn cho Nhà phát triển

### Kiểm tra dữ liệu thô (Raw Data)
Kết quả JSON thực tế từ Google được log tại Terminal của Backend trong Server Action `src/app/actions/billing.ts`.

### Thay đổi Project ID
1. Mở file `src/app/home/page.tsx`.
2. Thay đổi giá trị `DEFAULT_PROJECT_ID` thành ID dự án Google Cloud của bạn.
3. Đảm bảo Service Account có quyền `Billing Account Viewer`.

---

## 🚀 Lộ trình lên Production (Xác minh Google)

Để hiển thị số dư cho người dùng cá nhân thông qua Gmail của họ:
1. **OAuth Verification**: Gửi ứng dụng lên Google Cloud Console để xác minh quyền `cloud-billing.readonly`.
2. **Budgets API**: Tích hợp thêm Cloud Billing Budgets API để theo dõi chi tiêu chi tiết hơn.
