-- =====================================================
-- Script: Generate new address data based on provinces.open-api.vn
-- =====================================================
-- This script creates valid address data for users 1-300
-- using real Vietnamese provinces, districts, and wards
-- All addresses match the format from provinces.open-api.vn API
-- =====================================================

-- Step 1: Clear existing address data
TRUNCATE TABLE `address`;

-- Step 2: Create temporary table with valid address combinations
CREATE TEMPORARY TABLE IF NOT EXISTS `temp_addresses` (
    `row_num` INT AUTO_INCREMENT PRIMARY KEY,
    `ward_name` VARCHAR(100),
    `district_name` VARCHAR(100),
    `city_name` VARCHAR(100),
    INDEX idx_city (`city_name`)
);

-- Insert valid address combinations (ward, district, city must match)
INSERT INTO `temp_addresses` (`ward_name`, `district_name`, `city_name`) VALUES
    -- Hồ Chí Minh - Quận 1
    ('Phường Bến Nghé', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Đa Kao', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Bến Thành', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Nguyễn Thái Bình', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Phạm Ngũ Lão', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Cầu Ông Lãnh', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Cô Giang', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Nguyễn Cư Trinh', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    ('Phường Cầu Kho', 'Quận 1', 'Thành phố Hồ Chí Minh'),
    
    -- Hồ Chí Minh - Quận 12
    ('Phường Thạnh Xuân', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Thạnh Lộc', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Hiệp Thành', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Thới An', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Chánh Hiệp', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường An Phú Đông', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Thới Hiệp', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Trung Mỹ Tây', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Hưng Thuận', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    ('Phường Đông Hưng Thuận', 'Quận 12', 'Thành phố Hồ Chí Minh'),
    
    -- Hồ Chí Minh - Quận Tân Phú
    ('Phường Phú Trung', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Hòa Thạnh', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Hiệp Tân', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Thới Hòa', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Phú Thạnh', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Phú Thọ Hòa', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Phú Thọ', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Sơn Kỳ', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Quý', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Tân Sơn Nhì', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    ('Phường Tây Thạnh', 'Quận Tân Phú', 'Thành phố Hồ Chí Minh'),
    
    -- Hà Nội - Quận Hoàn Kiếm
    ('Phường Phúc Tân', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Đồng Xuân', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Mã', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Buồm', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Đào', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Bồ', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Cửa Đông', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Lý Thái Tổ', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Bạc', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Gai', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Chương Dương Độ', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Trống', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Cửa Nam', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Bông', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Tràng Tiền', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Trần Hưng Đạo', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Phan Chu Trinh', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    ('Phường Hàng Bài', 'Quận Hoàn Kiếm', 'Thành phố Hà Nội'),
    
    -- Hà Nội - Quận Tây Hồ
    ('Phường Phú Thượng', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Nhật Tân', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Tứ Liên', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Quảng An', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Xuân La', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Yên Phụ', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Bưởi', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    ('Phường Thụy Khuê', 'Quận Tây Hồ', 'Thành phố Hà Nội'),
    
    -- Hà Nội - Quận Long Biên
    ('Phường Thượng Thanh', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Ngọc Thụy', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Giang Biên', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Đức Giang', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Việt Hưng', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Gia Thụy', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Ngọc Lâm', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Phúc Lợi', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Bồ Đề', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Sài Đồng', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Long Biên', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Thạch Bàn', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Phúc Đồng', 'Quận Long Biên', 'Thành phố Hà Nội'),
    ('Phường Cự Khối', 'Quận Long Biên', 'Thành phố Hà Nội'),
    
    -- Đà Nẵng - Quận Hải Châu
    ('Phường Thạch Thang', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Thanh Bình', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Thuận Phước', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hải Châu I', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hải Châu II', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Phước Ninh', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Thuận Tây', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Thuận Đông', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Nam Dương', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Bình Hiên', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Bình Thuận', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Cường Bắc', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Cường Nam', 'Quận Hải Châu', 'Thành phố Đà Nẵng'),
    
    -- Đà Nẵng - Quận Ngũ Hành Sơn
    ('Phường Khuê Mỹ', 'Quận Ngũ Hành Sơn', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Hải', 'Quận Ngũ Hành Sơn', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Quý', 'Quận Ngũ Hành Sơn', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Bắc', 'Quận Ngũ Hành Sơn', 'Thành phố Đà Nẵng'),
    
    -- Đà Nẵng - Quận Cẩm Lệ
    ('Phường Hòa Thọ Tây', 'Quận Cẩm Lệ', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Thọ Đông', 'Quận Cẩm Lệ', 'Thành phố Đà Nẵng'),
    ('Phường Hòa An', 'Quận Cẩm Lệ', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Phát', 'Quận Cẩm Lệ', 'Thành phố Đà Nẵng'),
    ('Phường Hòa Xuân', 'Quận Cẩm Lệ', 'Thành phố Đà Nẵng'),
    
    -- Hải Phòng - Quận Ngô Quyền
    ('Phường Máy Chai', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Máy Hạ', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Vạn Mỹ', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Cầu Tre', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Lạc Viên', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Cầu Đất', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Gia Viên', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Đông Khê', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Cát Bi', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Lạch Tray', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    ('Phường Đổng Quốc Bình', 'Quận Ngô Quyền', 'Thành phố Hải Phòng'),
    
    -- Hải Phòng - Quận Lê Chân
    ('Phường Cát Dài', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường An Biên', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Lam Sơn', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường An Dương', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Trần Nguyên Hãn', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Hồ Nam', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Trại Cau', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Dư Hàng', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Hàng Kênh', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Đông Hải', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Niệm Nghĩa', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Nghĩa Xá', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Dư Hàng Kênh', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Kênh Dương', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    ('Phường Vĩnh Niệm', 'Quận Lê Chân', 'Thành phố Hải Phòng'),
    
    -- Cần Thơ - Quận Ninh Kiều
    ('Phường Tân An', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Tân Bình', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Hưng Lợi', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường An Khánh', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường An Hòa', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Thới Bình', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường An Nghiệp', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường An Cư', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Tân Lộc', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường An Hội', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Thới Thuận', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    ('Phường Xuân Khánh', 'Quận Ninh Kiều', 'Thành phố Cần Thơ'),
    
    -- Cần Thơ - Quận Bình Thủy
    ('Phường An Thới', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Bùi Hữu Nghĩa', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Long Hòa', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Long Tuyền', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Thới An Đông', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Trà An', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Trà Nóc', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    ('Phường Thới An', 'Quận Bình Thủy', 'Thành phố Cần Thơ'),
    
    -- Bà Rịa - Vũng Tàu
    ('Phường 1', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 2', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 3', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 4', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 5', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 7', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 8', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 9', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 10', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 11', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường 12', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường Nguyễn An Ninh', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường Rạch Dừa', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    ('Phường Long Sơn', 'Thành phố Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu'),
    
    -- Đồng Nai - Biên Hòa
    ('Phường Phước Hưng', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Phước Hiệp', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Đông Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Phong', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Biên', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Hố Nai', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Hiệp', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Bửu Long', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Tiến', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tam Hiệp', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Long Bình', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Quang Vinh', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Mai', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Thống Nhất', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Trung Dũng', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tam Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Hòa Bình', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Quyết Thắng', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Thanh Bình', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Bình Đa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường An Bình', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Bửu Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Long Bình Tân', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Vạn', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tân Hạnh', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Hiệp Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Hóa An', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường An Hòa', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Tam Phước', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Phước Tân', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai'),
    ('Phường Long Hưng', 'Thành phố Biên Hòa', 'Tỉnh Đồng Nai');

-- Step 3: Generate address data for users 1-300
-- Each user gets a valid address combination (ward, district, city must match)
INSERT INTO `address` (`user_id`, `recipient_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`, `created_at`, `updated_at`)
SELECT 
    u.`user_id`,
    COALESCE(u.`name`, CONCAT('User ', u.`user_id`)) AS `recipient_name`,
    -- Generate phone number: 0 + random 9 digits (using user_id as seed for consistency)
    CONCAT('0', LPAD(MOD(u.`user_id` * 1234567, 900000000) + 100000000, 9, '0')) AS `phone`,
    -- Address line: random street number + common street names
    CONCAT(
        MOD(u.`user_id`, 200) + 1, ' ',
        ELT(MOD(u.`user_id`, 20) + 1,
            'Nguyễn Huệ', 'Trần Hưng Đạo', 'Lê Lợi', 'Hai Bà Trưng',
            'Nguyễn Du', 'Lý Thường Kiệt', 'Hoàng Văn Thụ', 'Điện Biên Phủ',
            'Lê Duẩn', 'Nguyễn Trãi', 'Bà Triệu', 'Đồng Khởi',
            'Pasteur', 'Nam Kỳ Khởi Nghĩa', 'Võ Văn Tần', 'Nguyễn Thị Minh Khai',
            'Cách Mạng Tháng Tám', 'Đinh Tiên Hoàng', 'Bùi Viện', 'Đề Thám'
        )
    ) AS `address_line`,
    -- Get matching ward, district, city combination from temp table
    -- Use modulo to select a consistent address for each user
    ta.`ward_name` AS `ward`,
    ta.`district_name` AS `district`,
    ta.`city_name` AS `city`,
    TRUE AS `is_default`,
    COALESCE(u.`created_at`, NOW()) AS `created_at`,
    COALESCE(u.`last_updated`, NOW()) AS `updated_at`
FROM `user` u
INNER JOIN `temp_addresses` ta ON ta.`row_num` = ((u.`user_id` - 1) % (SELECT COUNT(*) FROM `temp_addresses`)) + 1
WHERE u.`user_id` BETWEEN 1 AND 300;

-- Step 5: Verify the generated data
SELECT 
    COUNT(*) AS total_addresses,
    COUNT(DISTINCT user_id) AS users_with_addresses,
    COUNT(DISTINCT city) AS unique_cities,
    COUNT(DISTINCT district) AS unique_districts,
    COUNT(DISTINCT ward) AS unique_wards
FROM `address`
WHERE `user_id` BETWEEN 1 AND 300;

-- Step 6: Show sample of generated data
SELECT 
    `address_id`,
    `user_id`,
    `recipient_name`,
    `phone`,
    `address_line`,
    `ward`,
    `district`,
    `city`,
    `is_default`
FROM `address`
WHERE `user_id` BETWEEN 1 AND 300
ORDER BY `address_id`
LIMIT 20;

-- Step 7: Clean up temporary table
DROP TEMPORARY TABLE IF EXISTS `temp_addresses`;

-- =====================================================
-- Data Generation Complete!
-- =====================================================
-- Summary:
-- 1. Cleared existing address data
-- 2. Generated new address data for users 1-300
-- 3. Used real Vietnamese addresses with proper structure:
--    - City: Thành phố/Tỉnh format matching provinces.open-api.vn
--    - District: Real districts matching cities
--    - Ward: Real wards matching districts
-- 4. All addresses are valid and match provinces.open-api.vn format
-- =====================================================
