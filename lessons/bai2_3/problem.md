# Bài 2.2 – Viết hàm Solidity đơn giản

## 🎯 Mục tiêu
- Làm quen với cú pháp Solidity cơ bản.
- Viết một smart contract đơn giản có biến và hàm.
- Deploy và test trên Remix IDE.

## 📄 Đề bài
Viết một smart contract tên là `Welcome`:
- Biến `greeting` dạng `string`, khai báo `public`.
- Constructor truyền vào giá trị khởi tạo cho `greeting`.
- Hàm `getGreeting()` trả về `greeting`.

Sau đó:
1. Deploy contract trên Remix IDE.
2. Gọi hàm `getGreeting()` và chụp màn hình kết quả.
![alt text](image.png)


3. (Tuỳ chọn) Sửa hàm để trả thêm địa chỉ người deploy (msg.sender).
![alt text](image-1.png)

## 💡 Gợi ý triển khai
- Dán vào Remix tại: https://remix.ethereum.org
- Chọn compiler 0.8.x
- Deploy contract bằng injected hoặc environment VM
