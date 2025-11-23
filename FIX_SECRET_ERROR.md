# ⚠️ Sửa lỗi GitHub Secret

## ❌ Lỗi: "Secret names can only contain alphanumeric characters..."

**Nguyên nhân:** Tên secret không đúng format

---

## ✅ CÁCH THÊM ĐÚNG

### Khi thêm secret, chỉ nhập:

**1. Trong ô "Name":**
```
EC2_SSH_PRIVATE_KEY
```
- ✅ CHỈ nhập: `EC2_SSH_PRIVATE_KEY`
- ❌ KHÔNG nhập: `Name: EC2_SSH_PRIVATE_KEY`
- ❌ KHÔNG nhập: `EC2 SSH PRIVATE KEY` (có space)
- ❌ KHÔNG nhập: `EC2-SSH-PRIVATE-KEY` (có dấu gạch ngang)

**2. Trong ô "Secret":**
Paste toàn bộ nội dung key (từ BEGIN đến END)

---

## ✅ TÊN SECRET ĐÚNG:

1. **EC2_SSH_PRIVATE_KEY** (chữ, số, gạch dưới)
2. **EC2_HOST** (chữ, số, gạch dưới)
3. **EC2_USER** (chữ, số, gạch dưới)

---

## 📝 CÁCH THÊM LẠI

1. Click **"New repository secret"**
2. **Name:** Gõ `EC2_SSH_PRIVATE_KEY` (KHÔNG có "Name:" ở đầu)
3. **Secret:** Paste nội dung key
4. Click **"Add secret"**

**Lưu ý:** 
- Chỉ gõ tên vào ô Name
- KHÔNG gõ "Name:" hoặc "Secret:" vào ô
- KHÔNG có space trong tên

