# Hướng dẫn Nhanh - Kết nối với Database có sẵn

## 1. Chuẩn bị Môi trường

Yêu cầu:
- Node.js (version >= 16)
- MySQL (đã có database `google_play_books`)
- npm hoặc yarn

## 2. Cài đặt Project

```bash
# Clone repository (nếu chưa có)
git clone <repository-url>

# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install
```

## 3. Cấu hình Database

Tạo file `.env` từ template:
```bash
cp .env.example .env
```

Sửa file `.env` với thông tin kết nối database của bạn:
```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=google_play_books
```

## 4. Kiểm tra Kết nối

```bash
# Kiểm tra kết nối database
npm run test-db
```

Nếu thấy thông báo "Database connection successful" là đã kết nối thành công.

## 5. Khởi động Server

```bash
# Chạy ở chế độ development (với hot reload)
npm run dev

# HOẶC build và chạy ở chế độ production
npm run build
npm start
```

## 6. Kiểm tra Server

Truy cập các URL sau để kiểm tra:
- http://localhost:5000 - Trang chủ
- http://localhost:5000/api - API Documentation

## Xử lý Lỗi Thường gặp

### 1. Lỗi Kết nối Database
```bash
# Kiểm tra MySQL đang chạy
# Windows
net start MySQL80

# Linux/Mac
sudo service mysql status

# Kiểm tra thông tin đăng nhập MySQL
mysql -u root -p
```

### 2. Kiểm tra Database
```sql
-- Trong MySQL console
SHOW DATABASES;
USE google_play_books;
SHOW TABLES;
```

### 3. Xem Logs
```bash
# Xem error logs
cat logs/error.log

# Xem tất cả logs
cat logs/combined.log
```

### 4. Khởi động lại Server
```bash
# Dừng server hiện tại (Ctrl+C)
# Chạy lại
npm run dev
```

## Cấu trúc Thư mục

```
backend/
├── src/              # Source code
│   ├── config/       # Cấu hình
│   ├── controllers/  # Logic xử lý
│   ├── models/       # Models
│   ├── routes/       # Routes
│   ├── utils/        # Utilities
│   └── index.ts      # Entry point
├── .env              # Environment variables
└── package.json      # Dependencies
```

## Các Lệnh Hữu ích

```bash
npm run dev          # Chạy development server
npm run test-db      # Kiểm tra kết nối database
npm run setup        # Setup directories và database
npm run build        # Build cho production
npm start           # Chạy production server
```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong thư mục `logs/`
2. Chạy `npm run test-db` để kiểm tra kết nối
3. Đảm bảo các thông tin trong `.env` chính xác
4. Liên hệ team phát triển nếu cần hỗ trợ thêm