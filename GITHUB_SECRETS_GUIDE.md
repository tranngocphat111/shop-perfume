# 🔐 Hướng dẫn Thêm GitHub Secrets

## 📍 Bạn đang ở: GitHub → Settings → Secrets and variables → Actions

---

## ✅ BƯỚC 1: Thêm Secret đầu tiên

### Click nút "New repository secret"

**Secret 1: EC2_SSH_PRIVATE_KEY**

1. **Name:** `EC2_SSH_PRIVATE_KEY`
2. **Secret:** Copy toàn bộ nội dung file key

   **Cách lấy nội dung key (trên máy local):**
   ```powershell
   Get-Content server\key-aws-login.pem
   ```
   
   Hoặc mở file `server\key-aws-login.pem` bằng Notepad, copy toàn bộ từ:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----
   ```

3. Click **"Add secret"**

---

## ✅ BƯỚC 2: Thêm Secret thứ hai

### Click "New repository secret" lần nữa

**Secret 2: EC2_HOST**

1. **Name:** `EC2_HOST`
2. **Secret:** `13.251.125.90`
3. Click **"Add secret"**

---

## ✅ BƯỚC 3: Thêm Secret thứ ba

### Click "New repository secret" lần nữa

**Secret 3: EC2_USER**

1. **Name:** `EC2_USER`
2. **Secret:** `ec2-user`
3. Click **"Add secret"**

---

## ✅ Kiểm tra

Sau khi thêm xong, bạn sẽ thấy 3 secrets:
- ✅ EC2_SSH_PRIVATE_KEY
- ✅ EC2_HOST
- ✅ EC2_USER

---

## ⚠️ Lưu ý

- **Tên secret phải CHÍNH XÁC:** 
  - `EC2_SSH_PRIVATE_KEY` (không có space, viết hoa đúng)
  - `EC2_HOST` (viết hoa)
  - `EC2_USER` (viết hoa)

- **Nội dung EC2_SSH_PRIVATE_KEY:**
  - Copy TOÀN BỘ file .pem (từ BEGIN đến END)
  - Bao gồm cả dòng `-----BEGIN RSA PRIVATE KEY-----` và `-----END RSA PRIVATE KEY-----`

---

## ✅ Sau khi thêm xong

Quay lại và test deploy:
1. Push code lên GitHub
2. Vào Actions tab
3. Xem workflow chạy

