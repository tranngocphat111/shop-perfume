-- =====================================================
-- Script Fix: Update city column in address table
-- =====================================================
-- This script fixes the empty city column by copying from ward/district
-- and normalizing city names to match Vietnamese provinces/cities format
-- =====================================================

-- Step 1: Update city from ward or district if city is empty
UPDATE `address`
SET `city` = CASE
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật') 
         AND (`ward` IS NOT NULL AND `ward` != '') THEN `ward`
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật') 
         AND (`district` IS NOT NULL AND `district` != '') THEN `district`
    ELSE `city`
END
WHERE (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
  AND (`ward` IS NOT NULL AND `ward` != '' OR `district` IS NOT NULL AND `district` != '');

-- Step 2: Normalize city names to match Vietnamese provinces/cities format
UPDATE `address` 
SET `city` = CASE
    -- Major cities
    WHEN `city` LIKE '%Hà Nội%' OR `city` LIKE '%Ha Noi%' OR `city` = 'Hà Nội' THEN 'Thành phố Hà Nội'
    WHEN `city` LIKE '%Hồ Chí Minh%' OR `city` LIKE '%Ho Chi Minh%' OR `city` LIKE '%TP.HCM%' OR `city` LIKE '%TP HCM%' OR `city` = 'Hồ Chí Minh' THEN 'Thành phố Hồ Chí Minh'
    WHEN `city` LIKE '%Đà Nẵng%' OR `city` LIKE '%Da Nang%' OR `city` = 'Đà Nẵng' THEN 'Thành phố Đà Nẵng'
    WHEN `city` LIKE '%Hải Phòng%' OR `city` LIKE '%Hai Phong%' OR `city` = 'Hải Phòng' THEN 'Thành phố Hải Phòng'
    WHEN `city` LIKE '%Cần Thơ%' OR `city` LIKE '%Can Tho%' OR `city` = 'Cần Thơ' THEN 'Thành phố Cần Thơ'
    
    -- Provinces
    WHEN `city` LIKE '%An Giang%' THEN 'Tỉnh An Giang'
    WHEN `city` LIKE '%Bà Rịa%' OR `city` LIKE '%Vũng Tàu%' THEN 'Tỉnh Bà Rịa - Vũng Tàu'
    WHEN `city` LIKE '%Bắc Giang%' THEN 'Tỉnh Bắc Giang'
    WHEN `city` LIKE '%Bắc Kạn%' THEN 'Tỉnh Bắc Kạn'
    WHEN `city` LIKE '%Bạc Liêu%' THEN 'Tỉnh Bạc Liêu'
    WHEN `city` LIKE '%Bắc Ninh%' THEN 'Tỉnh Bắc Ninh'
    WHEN `city` LIKE '%Bến Tre%' THEN 'Tỉnh Bến Tre'
    WHEN `city` LIKE '%Bình Định%' THEN 'Tỉnh Bình Định'
    WHEN `city` LIKE '%Bình Dương%' THEN 'Tỉnh Bình Dương'
    WHEN `city` LIKE '%Bình Phước%' THEN 'Tỉnh Bình Phước'
    WHEN `city` LIKE '%Bình Thuận%' THEN 'Tỉnh Bình Thuận'
    WHEN `city` LIKE '%Cà Mau%' THEN 'Tỉnh Cà Mau'
    WHEN `city` LIKE '%Cao Bằng%' THEN 'Tỉnh Cao Bằng'
    WHEN `city` LIKE '%Đắk Lắk%' OR `city` LIKE '%Dak Lak%' THEN 'Tỉnh Đắk Lắk'
    WHEN `city` LIKE '%Đắk Nông%' OR `city` LIKE '%Dak Nong%' THEN 'Tỉnh Đắk Nông'
    WHEN `city` LIKE '%Điện Biên%' THEN 'Tỉnh Điện Biên'
    WHEN `city` LIKE '%Đồng Nai%' THEN 'Tỉnh Đồng Nai'
    WHEN `city` LIKE '%Đồng Tháp%' THEN 'Tỉnh Đồng Tháp'
    WHEN `city` LIKE '%Gia Lai%' THEN 'Tỉnh Gia Lai'
    WHEN `city` LIKE '%Hà Giang%' THEN 'Tỉnh Hà Giang'
    WHEN `city` LIKE '%Hà Nam%' THEN 'Tỉnh Hà Nam'
    WHEN `city` LIKE '%Hà Tĩnh%' THEN 'Tỉnh Hà Tĩnh'
    WHEN `city` LIKE '%Hải Dương%' THEN 'Tỉnh Hải Dương'
    WHEN `city` LIKE '%Hậu Giang%' THEN 'Tỉnh Hậu Giang'
    WHEN `city` LIKE '%Hòa Bình%' THEN 'Tỉnh Hòa Bình'
    WHEN `city` LIKE '%Hưng Yên%' THEN 'Tỉnh Hưng Yên'
    WHEN `city` LIKE '%Khánh Hòa%' THEN 'Tỉnh Khánh Hòa'
    WHEN `city` LIKE '%Kiên Giang%' THEN 'Tỉnh Kiên Giang'
    WHEN `city` LIKE '%Kon Tum%' THEN 'Tỉnh Kon Tum'
    WHEN `city` LIKE '%Lai Châu%' THEN 'Tỉnh Lai Châu'
    WHEN `city` LIKE '%Lâm Đồng%' THEN 'Tỉnh Lâm Đồng'
    WHEN `city` LIKE '%Lạng Sơn%' THEN 'Tỉnh Lạng Sơn'
    WHEN `city` LIKE '%Lào Cai%' THEN 'Tỉnh Lào Cai'
    WHEN `city` LIKE '%Long An%' THEN 'Tỉnh Long An'
    WHEN `city` LIKE '%Nam Định%' THEN 'Tỉnh Nam Định'
    WHEN `city` LIKE '%Nghệ An%' THEN 'Tỉnh Nghệ An'
    WHEN `city` LIKE '%Ninh Bình%' THEN 'Tỉnh Ninh Bình'
    WHEN `city` LIKE '%Ninh Thuận%' THEN 'Tỉnh Ninh Thuận'
    WHEN `city` LIKE '%Phú Thọ%' THEN 'Tỉnh Phú Thọ'
    WHEN `city` LIKE '%Phú Yên%' THEN 'Tỉnh Phú Yên'
    WHEN `city` LIKE '%Quảng Bình%' THEN 'Tỉnh Quảng Bình'
    WHEN `city` LIKE '%Quảng Nam%' THEN 'Tỉnh Quảng Nam'
    WHEN `city` LIKE '%Quảng Ngãi%' THEN 'Tỉnh Quảng Ngãi'
    WHEN `city` LIKE '%Quảng Ninh%' THEN 'Tỉnh Quảng Ninh'
    WHEN `city` LIKE '%Quảng Trị%' THEN 'Tỉnh Quảng Trị'
    WHEN `city` LIKE '%Sóc Trăng%' THEN 'Tỉnh Sóc Trăng'
    WHEN `city` LIKE '%Sơn La%' THEN 'Tỉnh Sơn La'
    WHEN `city` LIKE '%Tây Ninh%' THEN 'Tỉnh Tây Ninh'
    WHEN `city` LIKE '%Thái Bình%' THEN 'Tỉnh Thái Bình'
    WHEN `city` LIKE '%Thái Nguyên%' THEN 'Tỉnh Thái Nguyên'
    WHEN `city` LIKE '%Thanh Hóa%' THEN 'Tỉnh Thanh Hóa'
    WHEN `city` LIKE '%Thừa Thiên%' OR `city` LIKE '%Huế%' OR `city` LIKE '%Hue%' THEN 'Tỉnh Thừa Thiên Huế'
    WHEN `city` LIKE '%Tiền Giang%' THEN 'Tỉnh Tiền Giang'
    WHEN `city` LIKE '%Trà Vinh%' THEN 'Tỉnh Trà Vinh'
    WHEN `city` LIKE '%Tuyên Quang%' THEN 'Tỉnh Tuyên Quang'
    WHEN `city` LIKE '%Vĩnh Long%' THEN 'Tỉnh Vĩnh Long'
    WHEN `city` LIKE '%Vĩnh Phúc%' THEN 'Tỉnh Vĩnh Phúc'
    WHEN `city` LIKE '%Yên Bái%' THEN 'Tỉnh Yên Bái'
    
    -- Keep original if already in correct format or doesn't match any pattern
    ELSE `city`
END
WHERE `city` IS NOT NULL AND `city` != '';

-- Step 3: For addresses where city is still empty, try to infer from address_line
-- This is a fallback for cases where ward and district are also empty
UPDATE `address`
SET `city` = CASE
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
         AND `address_line` LIKE '%Hà Nội%' THEN 'Thành phố Hà Nội'
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
         AND (`address_line` LIKE '%Hồ Chí Minh%' OR `address_line` LIKE '%TP.HCM%' OR `address_line` LIKE '%TP HCM%') THEN 'Thành phố Hồ Chí Minh'
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
         AND `address_line` LIKE '%Đà Nẵng%' THEN 'Thành phố Đà Nẵng'
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
         AND `address_line` LIKE '%Hải Phòng%' THEN 'Thành phố Hải Phòng'
    WHEN (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
         AND `address_line` LIKE '%Cần Thơ%' THEN 'Thành phố Cần Thơ'
    ELSE `city`
END
WHERE (`city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật')
  AND `address_line` IS NOT NULL AND `address_line` != '';

-- Step 4: Set default city for any remaining empty cities
UPDATE `address`
SET `city` = 'Chưa cập nhật'
WHERE (`city` IS NULL OR `city` = '');

-- Step 5: Verify the fix
-- Check how many addresses now have city filled
SELECT 
    COUNT(*) AS total_addresses,
    SUM(CASE WHEN `city` IS NOT NULL AND `city` != '' AND `city` != 'Chưa cập nhật' THEN 1 ELSE 0 END) AS addresses_with_city,
    SUM(CASE WHEN `city` IS NULL OR `city` = '' OR `city` = 'Chưa cập nhật' THEN 1 ELSE 0 END) AS addresses_without_city
FROM `address`
WHERE `user_id` BETWEEN 1 AND 300;

-- Show sample of fixed data
SELECT 
    `address_id`,
    `user_id`,
    `recipient_name`,
    `address_line`,
    `ward`,
    `district`,
    `city`,
    `is_default`
FROM `address`
WHERE `user_id` BETWEEN 1 AND 300
ORDER BY `address_id`
LIMIT 20;

-- =====================================================
-- Fix Complete!
-- =====================================================
-- Summary:
-- 1. Updated city from ward/district if city was empty
-- 2. Normalized city names to match Vietnamese format
-- 3. Tried to infer city from address_line as fallback
-- 4. Set default "Chưa cập nhật" for any remaining empty cities
-- =====================================================

