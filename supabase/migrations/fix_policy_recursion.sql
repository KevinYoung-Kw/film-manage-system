-- 修复users表策略的无限递归问题

-- 首先删除现有的出现递归问题的策略
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- 为is_admin和is_staff函数创建优化版本以避免递归
CREATE OR REPLACE FUNCTION is_admin_safe() RETURNS BOOLEAN AS $$
BEGIN
    -- 使用auth.jwt()而不是重新查询用户表
    RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_safe() RETURNS BOOLEAN AS $$
BEGIN
    -- 使用auth.jwt()而不是重新查询用户表
    RETURN current_setting('request.jwt.claims', true)::json->>'role' IN ('admin', 'staff');
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新创建用户表策略，使用安全版本的函数
CREATE POLICY users_select_policy ON users FOR SELECT USING (
    auth.uid() = id OR 
    is_admin_safe() OR 
    (is_staff_safe() AND role = 'staff')
);

CREATE POLICY users_update_policy ON users FOR UPDATE USING (
    auth.uid() = id OR is_admin_safe()
);

CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (
    is_admin_safe()
);

CREATE POLICY users_delete_policy ON users FOR DELETE USING (
    is_admin_safe()
);

-- 修复原来的is_admin和is_staff函数
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_admin_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_staff_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 