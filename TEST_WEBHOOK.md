# Hướng dẫn Test Webhook Sepay

## Cách 1: Test bằng endpoint test (không cần chuyển khoản thật)

### Bước 1: Tạo order với QR payment
1. Vào trang checkout
2. Chọn phương thức thanh toán "QR Code"
3. Đặt hàng để tạo order (ví dụ: order ID = 111)

### Bước 2: Test webhook với order ID vừa tạo

**Lưu ý:** Phải test từ trang web của bạn (localhost hoặc domain), không test từ trang khác vì CSP sẽ chặn.

**Option A: Test từ Browser Console (trên trang web của bạn)**
Mở Browser Console (F12) trên trang web của bạn và chạy:

```javascript
fetch('http://13.251.125.90:8080/api/webhooks/sepay/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 999999,
    gateway: "MBBank",
    transactionDate: "2025-11-25 18:00:00",
    accountNumber: "0963360910",
    code: null,
    content: "STNP111",  // Thay 111 bằng order ID thực tế
    transferType: "in",
    transferAmount: 2000,  // Thay bằng số tiền của order
    accumulated: 20000,
    subAccount: null,
    referenceCode: null,
    description: ""
  })
})
.then(r => r.json())
.then(data => {
  console.log('Webhook test result:', data);
  if (data.success) {
    console.log('✅ Webhook processed successfully!');
  } else {
    console.log('❌ Webhook not processed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
```

**Option B: Test bằng Postman**
1. Mở Postman
2. Tạo POST request: `http://13.251.125.90:8080/api/webhooks/sepay/test`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "id": 999999,
  "gateway": "MBBank",
  "transactionDate": "2025-11-25 18:00:00",
  "accountNumber": "0963360910",
  "code": null,
  "content": "STNP111",
  "transferType": "in",
  "transferAmount": 2000,
  "accumulated": 20000,
  "subAccount": null,
  "referenceCode": null,
  "description": ""
}
```
5. Click Send

**Option C: Test bằng curl (từ terminal)**
```bash
curl -X POST http://13.251.125.90:8080/api/webhooks/sepay/test \
  -H "Content-Type: application/json" \
  -d '{
    "id": 999999,
    "gateway": "MBBank",
    "transactionDate": "2025-11-25 18:00:00",
    "accountNumber": "0963360910",
    "code": null,
    "content": "STNP111",
    "transferType": "in",
    "transferAmount": 2000,
    "accumulated": 20000,
    "subAccount": null,
    "referenceCode": null,
    "description": ""
  }'
```

### Bước 3: Kiểm tra payment status
Sau khi test webhook, kiểm tra lại payment status:
- Vào trang Payment hoặc My Orders
- Xem payment status có chuyển sang "PAID" không

---

## Cách 2: Test với giao dịch thật từ Sepay

### Bước 1: Tạo order với QR payment
1. Vào trang checkout
2. Chọn phương thức thanh toán "QR Code"
3. Đặt hàng để tạo order (ví dụ: order ID = 111)
4. Lưu lại order ID và số tiền

### Bước 2: Chuyển khoản thật
1. Quét QR code trên trang Payment
2. Chuyển khoản với nội dung: `STNP111` (thay 111 bằng order ID thực tế)
3. Số tiền phải khớp với order

### Bước 3: Kiểm tra trong Sepay Dashboard
1. Vào Sepay Dashboard → Nhật ký → Xem giao dịch
2. Tìm giao dịch vừa chuyển
3. Kiểm tra:
   - **WebHooks đã bắn**: Phải > 0
   - **Nội dung chuyển khoản**: Phải chứa `STNP111`
   - Click vào giao dịch → Xem "Nhật ký webhooks"
   - Response code phải là 200
   - Response body phải có `{"success": true}`

### Bước 4: Kiểm tra payment status
1. Vào trang Payment hoặc My Orders
2. Xem payment status có chuyển sang "PAID" không
3. Nếu chưa, kiểm tra:
   - Webhook có được gửi không (trong Sepay dashboard)
   - Nội dung chuyển khoản có đúng format không
   - Order ID có tồn tại không

---

## Troubleshooting

### Webhook không được gửi (WebHooks đã bắn = 0)
- Kiểm tra cấu hình webhook trong Sepay Dashboard:
  - Webhook URL: `http://13.251.125.90:8080/api/webhooks/sepay`
  - API Key: Phải đúng với `sepay.webhook.api-key` trong `application.properties`
  - Webhook phải được bật/kích hoạt

### Webhook được gửi nhưng payment không update
- Kiểm tra nội dung chuyển khoản có đúng format `STNP111` không
- Kiểm tra order ID có tồn tại trong database không
- Kiểm tra số tiền có khớp không (cho phép sai số 1000 VND)

### 401 Unauthorized
- Kiểm tra API Key trong Sepay Dashboard có đúng không
- Kiểm tra backend đã được deploy với cấu hình mới chưa

