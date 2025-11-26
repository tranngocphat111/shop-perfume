-- =====================================================
-- Script Migration: Move phone and address from User to Address table
-- =====================================================
-- This script:
-- 1. Creates the address table
-- 2. Migrates existing user phone and address data to address table
-- 3. Removes phone and address columns from user table
-- =====================================================

-- Step 1: Create address table if not exists
CREATE TABLE IF NOT EXISTS `address` (
    `address_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `recipient_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address_line` VARCHAR(255) NOT NULL,
    `ward` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate data from user table to address table
-- Parse address format: "addressLine, city, Việt Nam" or "addressLine, district, city, Việt Nam"
-- For users with address data, create address records
INSERT INTO `address` (`user_id`, `recipient_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`, `created_at`, `updated_at`)
SELECT 
    u.`user_id`,
    COALESCE(u.`name`, 'Người nhận') AS `recipient_name`,
    COALESCE(u.`phone`, '0900000000') AS `phone`,
    -- Extract address line (first part before comma)
    CASE 
        WHEN u.`address` IS NOT NULL AND u.`address` != '' THEN
            TRIM(SUBSTRING_INDEX(u.`address`, ',', 1))
        ELSE 'Chưa cập nhật'
    END AS `address_line`,
    -- Extract ward (second part if exists, otherwise empty)
    CASE 
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             LENGTH(u.`address`) - LENGTH(REPLACE(u.`address`, ',', '')) >= 2 THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, ',', 2), ',', -1))
        ELSE ''
    END AS `ward`,
    -- Extract district (third part if exists, otherwise try second part)
    CASE 
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             LENGTH(u.`address`) - LENGTH(REPLACE(u.`address`, ',', '')) >= 3 THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, ',', 3), ',', -1))
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             LENGTH(u.`address`) - LENGTH(REPLACE(u.`address`, ',', '')) >= 2 THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, ',', 2), ',', -1))
        ELSE ''
    END AS `district`,
    -- Extract city (last part before "Việt Nam" or use district/ward as fallback)
    CASE 
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             u.`address` LIKE '%Việt Nam%' THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, 'Việt Nam', 1), ',', -1))
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             LENGTH(u.`address`) - LENGTH(REPLACE(u.`address`, ',', '')) >= 2 THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, ',', -2), ',', 1))
        WHEN u.`address` IS NOT NULL AND u.`address` != '' THEN
            TRIM(SUBSTRING_INDEX(u.`address`, ',', -1))
        -- Fallback: use district or ward if available
        WHEN u.`address` IS NOT NULL AND u.`address` != '' AND 
             LENGTH(u.`address`) - LENGTH(REPLACE(u.`address`, ',', '')) >= 1 THEN
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.`address`, ',', 2), ',', -1))
        ELSE 'Chưa cập nhật'
    END AS `city`,
    TRUE AS `is_default`,
    COALESCE(u.`created_at`, NOW()) AS `created_at`,
    COALESCE(u.`last_updated`, NOW()) AS `updated_at`
FROM `user` u
WHERE u.`user_id` BETWEEN 1 AND 300
  AND (u.`address` IS NOT NULL AND u.`address` != '' OR u.`phone` IS NOT NULL AND u.`phone` != '');

-- Step 3: For users without address data, create default address records
INSERT INTO `address` (`user_id`, `recipient_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`, `created_at`, `updated_at`)
SELECT 
    u.`user_id`,
    COALESCE(u.`name`, 'Người nhận') AS `recipient_name`,
    COALESCE(u.`phone`, '0900000000') AS `phone`,
    'Chưa cập nhật' AS `address_line`,
    '' AS `ward`,
    '' AS `district`,
    'Chưa cập nhật' AS `city`,
    TRUE AS `is_default`,
    COALESCE(u.`created_at`, NOW()) AS `created_at`,
    COALESCE(u.`last_updated`, NOW()) AS `updated_at`
FROM `user` u
WHERE u.`user_id` BETWEEN 1 AND 300
  AND u.`user_id` NOT IN (SELECT `user_id` FROM `address`);

-- Step 4: Fix city column - copy from ward/district if city is empty
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

-- Step 5: Update city names to match Vietnamese provinces/cities format
-- Common city name mappings
UPDATE `address` 
SET `city` = CASE
    WHEN `city` LIKE '%Hà Nội%' OR `city` LIKE '%Ha Noi%' THEN 'Thành phố Hà Nội'
    WHEN `city` LIKE '%Hồ Chí Minh%' OR `city` LIKE '%Ho Chi Minh%' OR `city` LIKE '%TP.HCM%' OR `city` LIKE '%TP HCM%' THEN 'Thành phố Hồ Chí Minh'
    WHEN `city` LIKE '%Đà Nẵng%' OR `city` LIKE '%Da Nang%' THEN 'Thành phố Đà Nẵng'
    WHEN `city` LIKE '%Hải Phòng%' OR `city` LIKE '%Hai Phong%' THEN 'Thành phố Hải Phòng'
    WHEN `city` LIKE '%Cần Thơ%' OR `city` LIKE '%Can Tho%' THEN 'Thành phố Cần Thơ'
    WHEN `city` LIKE '%An Giang%' THEN 'Tỉnh An Giang'
    WHEN `city` LIKE '%Bà Rịa%' THEN 'Tỉnh Bà Rịa - Vũng Tàu'
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
    WHEN `city` LIKE '%Thừa Thiên Huế%' OR `city` LIKE '%Hue%' THEN 'Tỉnh Thừa Thiên Huế'
    WHEN `city` LIKE '%Tiền Giang%' THEN 'Tỉnh Tiền Giang'
    WHEN `city` LIKE '%Trà Vinh%' THEN 'Tỉnh Trà Vinh'
    WHEN `city` LIKE '%Tuyên Quang%' THEN 'Tỉnh Tuyên Quang'
    WHEN `city` LIKE '%Vĩnh Long%' THEN 'Tỉnh Vĩnh Long'
    WHEN `city` LIKE '%Vĩnh Phúc%' THEN 'Tỉnh Vĩnh Phúc'
    WHEN `city` LIKE '%Yên Bái%' THEN 'Tỉnh Yên Bái'
    ELSE `city`
END
WHERE `city` IS NOT NULL AND `city` != '';

-- Step 6: Clean up empty or invalid data
UPDATE `address`
SET 
    `ward` = CASE WHEN `ward` = 'Việt Nam' OR `ward` = 'Vietnam' THEN '' ELSE `ward` END,
    `district` = CASE WHEN `district` = 'Việt Nam' OR `district` = 'Vietnam' THEN '' ELSE `district` END,
    `city` = CASE WHEN `city` = 'Việt Nam' OR `city` = 'Vietnam' THEN 'Chưa cập nhật' ELSE `city` END
WHERE `ward` = 'Việt Nam' OR `ward` = 'Vietnam' 
   OR `district` = 'Việt Nam' OR `district` = 'Vietnam'
   OR `city` = 'Việt Nam' OR `city` = 'Vietnam';

-- Step 7: Verify data migration
-- Check how many addresses were created
SELECT 
    COUNT(*) AS total_addresses,
    COUNT(DISTINCT user_id) AS users_with_addresses
FROM `address`
WHERE `user_id` BETWEEN 1 AND 300;

-- Step 8: Drop phone and address columns from user table
-- WARNING: This will permanently delete the columns and their data
-- Make sure you have backed up the data before running this!
ALTER TABLE `user` 
DROP COLUMN IF EXISTS `phone`,
DROP COLUMN IF EXISTS `address`;

-- Step 9: Final verification
-- Check that all users from 1 to 300 have at least one address
SELECT 
    u.`user_id`,
    u.`name`,
    u.`email`,
    COUNT(a.`address_id`) AS address_count
FROM `user` u
LEFT JOIN `address` a ON u.`user_id` = a.`user_id`
WHERE u.`user_id` BETWEEN 1 AND 300
GROUP BY u.`user_id`, u.`name`, u.`email`
HAVING address_count = 0;

-- If the above query returns any rows, those users don't have addresses
-- You can create default addresses for them with:
/*
INSERT INTO `address` (`user_id`, `recipient_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`, `created_at`, `updated_at`)
SELECT 
    u.`user_id`,
    COALESCE(u.`name`, 'Người nhận') AS `recipient_name`,
    '0900000000' AS `phone`,
    'Chưa cập nhật' AS `address_line`,
    '' AS `ward`,
    '' AS `district`,
    'Chưa cập nhật' AS `city`,
    TRUE AS `is_default`,
    COALESCE(u.`created_at`, NOW()) AS `created_at`,
    COALESCE(u.`last_updated`, NOW()) AS `updated_at`
FROM `user` u
WHERE u.`user_id` BETWEEN 1 AND 300
  AND u.`user_id` NOT IN (SELECT `user_id` FROM `address`);
*/

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Summary:
-- 1. Created address table
-- 2. Migrated user phone and address data to address table
-- 3. Removed phone and address columns from user table
-- 4. All users from 1 to 300 should now have at least one address
-- =====================================================

