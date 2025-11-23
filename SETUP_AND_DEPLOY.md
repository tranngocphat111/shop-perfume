# 🚀 Hướng dẫn Setup và Deploy Backend

## ✅ THÔNG TIN CỦA BẠN

- **EC2 IP**: `13.251.125.90`
- **Key file**: `server/key-aws-login.pem`
- **Instance**: `shop-perfume-server`

---

## 📍 BƯỚC 1: SSH vào EC2

**Chạy trong PowerShell (từ thư mục gốc):**

```powershell
cd server
ssh -i key-aws-login.pem ec2-user@13.251.125.90
```

**⚠️ Nếu lỗi permissions, CHẠY CMD VỚI QUYỀN ADMINISTRATOR:**

1. Click Start → Gõ "cmd" → Right-click → "Run as administrator"
2. Chạy các lệnh này:

```cmd
cd D:\IUH\ky7\javaWWW\DuAn\project-main\shop-perfume\server

icacls key-aws-login.pem /inheritance:r
icacls key-aws-login.pem /remove "NT AUTHORITY\Authenticated Users"
icacls key-aws-login.pem /remove "BUILTIN\Users"
icacls key-aws-login.pem /remove "Everyone"
icacls key-aws-login.pem /grant:r "%USERNAME%:(R)"

ssh -i key-aws-login.pem ec2-user@13.251.125.90
```

**Hoặc dùng PowerShell script (Run as Administrator):**

```powershell
cd server
powershell -ExecutionPolicy Bypass -File fix-permissions.ps1
ssh -i key-aws-login.pem ec2-user@13.251.125.90
```

---

## 📍 BƯỚC 2: Setup trong EC2

**Sau khi SSH vào thành công, bạn sẽ thấy: `[ec2-user@ip-xxx ~]$`**

**Copy và chạy từng lệnh:**

```bash
# 1. Cập nhật và cài Java 17
sudo yum update -y
sudo yum install -y java-17-amazon-corretto
java -version

# 2. Tạo thư mục app
mkdir -p ~/app

# 3. Tạo systemd service file
sudo nano /etc/systemd/system/shop-perfume-backend.service
```

**Khi mở nano, paste nội dung này vào:**

```ini
[Unit]
Description=Shop Perfume Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/app
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod /home/ec2-user/app/backend.jar
Restart=always
RestartSec=10

Environment="DATABASE_URL=jdbc:mariadb://shop-perfume-db.cpggs0eyg7pm.ap-southeast-1.rds.amazonaws.com:3306/shopnuochoa?sslMode=trust"
Environment="DATABASE_USERNAME=admin"
Environment="DATABASE_PASSWORD=Ngocphat123"
Environment="JWT_SECRET=mySecretKeyForJWTTokenGenerationAndValidation123456789ShopPerfume"
Environment="CORS_ALLOWED_ORIGINS=http://localhost:3000"
Environment="SERVER_PORT=8080"

[Install]
WantedBy=multi-user.target
```

**Lưu file trong nano:**
1. Nhấn `Ctrl+C` (nếu đang ở màn hình "File Name to Write")
2. Nhấn `Ctrl+O` (Write Out - Lưu file)
3. Nhấn `Enter` (xác nhận tên file: shop-perfume-backend.service)
4. Nhấn `Ctrl+X` (Exit - Thoát nano)

**Quan trọng:** Khi nhấn `Ctrl+O`, chỉ cần nhấn `Enter` để lưu với tên file mặc định, ĐỪNG gõ gì thêm!

**Tiếp tục:**

```bash
# 4. Enable service
sudo systemctl daemon-reload
sudo systemctl enable shop-perfume-backend
sudo systemctl status shop-perfume-backend

# 5. Thoát khỏi EC2
exit
```

---

## 📍 BƯỚC 3: Mở Port 8080 trong Security Group

1. AWS Console → EC2 → Instances
2. Chọn `shop-perfume-server`
3. Tab **Security** → Click Security Group
4. **Inbound rules** → **Edit inbound rules**
5. **Add rule:**
   - Type: Custom TCP
   - Port: 8080
   - Source: 0.0.0.0/0
   - Description: Backend API
6. **Save rules**

---

## 📍 BƯỚC 4: Setup GitHub Secrets

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Thêm 3 secrets:

   **Secret 1:**
   ```
   Name: EC2_SSH_PRIVATE_KEY
   Value: [Copy toàn bộ nội dung file key-aws-login.pem]
   ```
   
   **Cách lấy nội dung:**
   ```powershell
   Get-Content server\key-aws-login.pem
   ```
   Copy từ `-----BEGIN RSA PRIVATE KEY-----` đến `-----END RSA PRIVATE KEY-----`

   **Secret 2:**
   ```
   Name: EC2_HOST
   Value: 13.251.125.90
   ```

   **Secret 3:**
   ```
   Name: EC2_USER
   Value: ec2-user
   ```

---

## 📍 BƯỚC 5: Kiểm tra Workflow File

File `.github/workflows/deploy-backend-ec2.yml` đã sẵn sàng.

**Chỉ cần kiểm tra branch name (dòng 6):**
- Nếu bạn dùng branch `main` → OK
- Nếu dùng branch khác (ví dụ: `master`) → Đổi `- main` thành `- master`

---

## 📍 BƯỚC 6: Test Auto Deploy

```bash
git add .
git commit -m "test auto deploy"
git push origin main
```

**Sau khi push:**
1. Vào GitHub repo → **Actions** tab
2. Xem workflow đang chạy
3. Đợi 3-5 phút
4. ✅ Nếu thấy dấu tích xanh = Thành công!

---

## ✅ Kiểm tra Backend

**Test API:**
```
http://13.251.125.90:8080/api/products
```

**Xem Swagger:**
```
http://13.251.125.90:8080/api/swagger-ui.html
```

---

## 🎉 XONG!

Từ giờ mỗi lần push code lên GitHub → Backend tự động deploy và reload! 🚀

---

## 🔧 Troubleshooting

### SSH không được?
- Kiểm tra file key đúng path chưa
- Chạy lệnh fix permissions trước

### Workflow fail?
- Kiểm tra 3 secrets đã đúng chưa
- Kiểm tra IP trong EC2_HOST đúng chưa
- Xem logs trong GitHub Actions

### Backend không start?
```bash
ssh ec2-user@13.251.125.90
sudo journalctl -u shop-perfume-backend -n 50
```

