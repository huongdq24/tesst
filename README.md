
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing.

---

## 📊 Cơ chế quản lý Credits (Tín dụng)

Hiện tại, số dư credits được hiển thị dựa trên trạng thái thực tế từ **Google Cloud Billing API**. 

### Cấu trúc phản hồi JSON từ API
Khi gọi `getProjectBillingInfo`, Google trả về dữ liệu dưới dạng JSON như sau:

```json
{
  "name": "projects/PROJECT_ID/billingInfo",
  "projectId": "PROJECT_ID",
  "billingAccountName": "billingAccounts/XXXXXX-XXXXXX-XXXXXX",
  "billingEnabled": true
}
```

- **billingEnabled**: Xác định dự án có đang hoạt động thanh toán hay không.
- **Lưu ý**: API này mặc định không trả về con số dư lẻ (ví dụ: $123.45). Ứng dụng hiện tại hiển thị `$0.00` cho tài khoản Free Tier nếu `billingEnabled` là `true`.

## 🛠 Hướng dẫn cho Nhà phát triển

### Kiểm tra dữ liệu thô (Raw Data)
Để xem kết quả JSON thực tế từ Google, bạn có thể kiểm tra Log của Terminal khi chạy ứng dụng. Server Action trong `src/app/actions/billing.ts` đã được cấu hình để log kết quả trả về.

### Thay đổi Project ID
1. Mở file `src/app/home/page.tsx`.
2. Thay đổi giá trị `DEFAULT_PROJECT_ID` thành ID dự án Google Cloud của bạn.
3. Đảm bảo Service Account chạy ứng dụng có quyền `Billing Account Viewer`.

---

## 🚀 Lộ trình lên Production (Xác minh Google)

Để hiển thị số dư thực tế (ví dụ: lấy con số $300 dùng thử), bạn cần:
1. **Cloud Billing Budgets API**: Tích hợp thêm API này để lấy dữ liệu ngân sách và chi tiêu thực tế.
2. **Xác minh Ứng dụng**: Gửi ứng dụng lên Google Cloud Console để xác minh quyền sử dụng scope `cloud-billing.readonly`.
3. **Domain & Chính sách**: Yêu cầu domain chính thức và trang Privacy Policy.
