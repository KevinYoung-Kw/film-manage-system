-- 更彻底的修复方案：解决users表策略的无限递归问题

-- 1. 首先禁用Row Level Security，以确保我们可以执行修复
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有与users表相关的策略
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS policy_users_select ON users;
DROP POLICY IF EXISTS policy_users_update ON users;
DROP POLICY IF EXISTS policy_users_insert ON users;
DROP POLICY IF EXISTS policy_users_delete ON users;

-- 3. 优化用户角色判断函数，避免递归查询
-- 使用auth.jwt()而不是查询users表
CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS TEXT AS $$
DECLARE
  _role TEXT;
BEGIN
  BEGIN
    -- 尝试从JWT获取角色
    _role := nullif(current_setting('request.jwt.claims', true)::json->>'role', '');
    RETURN _role;
  EXCEPTION WHEN OTHERS THEN
    -- 如果获取失败，返回null
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建优化版本的角色检查函数
CREATE OR REPLACE FUNCTION public.is_admin_safe() RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_auth_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff_safe() RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_auth_role() IN ('admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 修复原有函数
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_staff_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 重新启用Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. 创建新的、简化的RLS策略
-- SELECT: 用户可以查看自己的信息，管理员可以查看所有用户，员工可以查看其他员工
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    is_admin_safe() OR 
    (is_staff_safe() AND role = 'staff')
  );

-- UPDATE: 用户可以更新自己的信息，管理员可以更新所有用户信息
CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    is_admin_safe()
  );

-- INSERT: 只有管理员可以添加用户
CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (
    is_admin_safe()
  );

-- DELETE: 只有管理员可以删除用户
CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (
    is_admin_safe()
  );

-- 8. 检查当前策略设置
-- SELECT pg_policies WHERE tablename = 'users';

-- 9. 确保没有其他引用users表的触发器可能导致递归
-- DO $$
-- BEGIN
--   FOR trigger_name IN 
--     SELECT trigger_name FROM information_schema.triggers 
--     WHERE event_object_table = 'users' AND trigger_schema = 'public'
--   LOOP
--     EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON users;';
--   END LOOP;
-- END;
-- $$; 