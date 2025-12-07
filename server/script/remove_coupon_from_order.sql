-- Script để bỏ mối quan hệ coupon khỏi order và thêm trường discountAmount
-- Chạy script này để migrate database

-- Bước 1: Thêm cột discountAmount vào bảng order (mặc định = 0)
ALTER TABLE `order` 
ADD COLUMN discount_amount DOUBLE DEFAULT 0 AFTER total_amount;

-- Bước 2: Tính và cập nhật discountAmount cho các đơn hàng đã có coupon
-- discountAmount = (tổng giá sản phẩm) - totalAmount
UPDATE `order` o
SET o.discount_amount = (
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0) - o.total_amount
    FROM order_item oi
    WHERE oi.order_id = o.order_id
)
WHERE o.coupon_id IS NOT NULL;

-- Bước 3: Với các đơn không có coupon, đảm bảo discountAmount = 0
UPDATE `order` 
SET discount_amount = 0 
WHERE coupon_id IS NULL;

-- Bước 4: Xóa foreign key constraint coupon_id
-- Lưu ý: Tên constraint có thể khác, kiểm tra bằng: SHOW CREATE TABLE `order`;
-- Thay 'fk_order_coupon' bằng tên thực tế của constraint
ALTER TABLE `order` 
DROP FOREIGN KEY IF EXISTS fk_order_coupon;

-- Bước 5: Xóa cột coupon_id
ALTER TABLE `order` 
DROP COLUMN coupon_id;

-- Hoàn tất! 
-- Bây giờ order không còn mối quan hệ với coupon
-- Nhưng vẫn lưu được số tiền đã giảm trong trường discount_amount
