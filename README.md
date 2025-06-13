# Giới thiệu

Dự án này là đồ án học phần Thực tập cơ sở (INT13147_CLC) thuộc kì 20242, ngành CNTT (CLC), PTIT, hướng dẫn bởi thầy TS. Đào Ngọc Phong về Xây dựng website bán hàng văn hóa phẩm Nhật Bản bằng JavaScript và MongoDB.

## Techstack

- Frontend: React.js, TailwindCSS
- Backend: Node.js với framework Express.js, MongoDB
- Thiết kế UI/UX: Figma, Motiff
- Cổng thanh toán tích hợp: PayOS/VietQR

## Cảnh báo

Dự án này được thực hiện với sự hỗ trợ của các công cụ trí tuệ nhân tạo, cân nhắc trước khi tham khảo.

## Chuẩn bị

### Yêu cầu

- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn
- MongoDB

### Thiết lập

1. **Clone hoặc tải file zip của dự án này về**
    ```bash
    git clone <repository-url>
    cd JPStore
    ```

2. **Thiết lập backend**

- Chuyển hướng tới thư mục backend và cài đặt thư viện cần thiết
    ```bash
    cd backend
    npm install
    ```

- Tạo file biến môi trường .env với các tham số sau
    ```bash
    MONGODB_URI=mongodb://localhost:27017/jpstore
    JWT_SECRET=khoa-bi-mat-jwt-cua-ban
    PORT=5000
    ADMIN_SECRET_KEY=khoa-bi-mat-admin-cua-ban
    NODE_ENV=development

    PAYOS_API_URL=https://api-merchant.payos.vn
    PAYOS_CLIENT_ID=client-id-payos-cua-ban
    PAYOS_API_KEY=api-key-payos-cua-ban
    PAYOS_CHECKSUM_KEY=checksum-key-payos-cua-ban

    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    FRONTEND_URL=http://localhost:3000
    ```

- Khởi chạy máy chủ backend
    ```bash
    node server.js
    ```

3. **Thiết lập frontend**

- Chuyển hướng tới thư mục backend và cài đặt thư viện cần thiết
    ```bash
    cd frontend
    npm install
    ```

- Tạo file biến môi trường .env với các tham số sau
    ```bash
    REACT_APP_API_URL=http://localhost:5000/api
    REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
    ```

- Khởi chạy máy chủ frontend development
    ```bash
    npm start
    ```

4. **Truy cập ứng dụng**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:5000/api