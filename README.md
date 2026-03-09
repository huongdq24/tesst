
# iGen AI - Trợ lý Kiến trúc sư

Ứng dụng hỗ trợ thiết kế kiến trúc bằng trí tuệ nhân tạo, tích hợp đồng bộ dữ liệu Google Cloud Billing.

---

## 📊 Cơ chế quản lý Credits (Tín dụng)

Hiện tại, số dư credits được hiển thị dựa trên trạng thái **Google Cloud Billing API**. 

- **Chế độ Thử nghiệm:** Hệ thống mặc định hiển thị `$0.00` cho các tài khoản Free Tier để đảm bảo tính trung thực.
- **Cơ chế đồng bộ:** Ứng dụng truy vấn trạng thái thanh toán của dự án thông qua Server Actions. Khi bạn đăng nhập bằng Google, ứng dụng yêu cầu quyền `cloud-billing.readonly` để chuẩn bị cho việc kết nối sâu hơn trong tương lai.

## 🚀 Lộ trình lên Production (Xác minh Google)

Để hiển thị số dư thực tế từ tài khoản Gmail của từng người dùng, bạn cần thực hiện:

1. **Xác minh Ứng dụng:** Gửi ứng dụng lên Google Cloud Console để xác minh quyền sử dụng scope `cloud-billing.readonly`.
2. **Cấu hình Domain:** Phải có domain chính thức và trang Privacy Policy.
3. **Budget API:** Tích hợp thêm Cloud Billing Budgets API để lấy con số chi tiêu thực tế.

---

## 🛠 Hướng dẫn cho Nhà phát triển

Nếu bạn muốn kiểm tra với Project ID cá nhân:
1. Mở file `src/app/home/page.tsx`.
2. Thay đổi giá trị `DEFAULT_PROJECT_ID` thành ID dự án Google Cloud của bạn.
3. Đảm bảo tài khoản chạy backend (Service Account) có quyền `Billing Account Viewer`.
