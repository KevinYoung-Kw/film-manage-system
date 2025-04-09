-- 电影票务系统密码更新迁移脚本
-- 适用于Supabase (PostgreSQL)
-- 用于将演示账号的密码更新为正确的bcryptjs哈希

-- 更新用户密码哈希
UPDATE users 
SET password_hash = CASE 
    WHEN email = 'admin@example.com' THEN '$2b$10$.FIksAx3PtgCPxIynWlTT.eIKODdp.SPp84Ph0d2tij81rRv/2r1G'  -- admin123
    WHEN email = 'staff1@example.com' THEN '$2b$10$HCuKxE5GdeVEG0XytwSPSOBetJ5shxrXOUyOnkrqyln2e32A8XcZK'  -- staff123
    WHEN email = 'customer1@example.com' THEN '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.'  -- customer123
    WHEN email = 'customer2@example.com' THEN '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.'  -- customer123
END
WHERE email IN ('admin@example.com', 'staff1@example.com', 'customer1@example.com', 'customer2@example.com');

-- 显示更新后的用户信息(仅显示email和部分密码，安全起见)
SELECT 
    email, 
    LEFT(password_hash, 10) || '...' AS password_hash_preview
FROM users 
WHERE email IN ('admin@example.com', 'staff1@example.com', 'customer1@example.com', 'customer2@example.com'); 