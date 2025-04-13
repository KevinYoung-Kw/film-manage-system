-- 更新RLS策略以适配Supabase Auth服务
-- 这个脚本修复了"new row violates row-level security policy for table orders"错误

-- 添加一个辅助函数从auth元数据中获取用户角色
CREATE OR REPLACE FUNCTION auth.get_user_role() RETURNS TEXT AS $$
DECLARE
  _role TEXT;
BEGIN
  -- 如果没有登录用户，返回anonymous
  IF auth.uid() IS NULL THEN
    RETURN 'anonymous';
  END IF;

  -- 从用户元数据中获取角色信息
  SELECT COALESCE(raw_user_meta_data->>'role', 'customer')
  INTO _role
  FROM auth.users
  WHERE id = auth.uid();

  -- 如果没有找到角色，默认为customer
  RETURN COALESCE(_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加一个辅助函数获取用户数据库ID
CREATE OR REPLACE FUNCTION auth.get_user_db_id() RETURNS UUID AS $$
DECLARE
  _user_db_id UUID;
BEGIN
  -- 如果没有登录用户，返回NULL
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- 从用户元数据中获取数据库ID
  SELECT (raw_user_meta_data->>'user_db_id')::UUID
  INTO _user_db_id
  FROM auth.users
  WHERE id = auth.uid();

  RETURN _user_db_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新订单表的RLS策略
DROP POLICY IF EXISTS "orders_select_policy" ON "orders";
CREATE POLICY "orders_select_policy" ON "orders"
  FOR SELECT
  USING (
    auth.get_user_role() IN ('admin', 'staff') OR
    (auth.get_user_role() = 'customer' AND user_id = auth.get_user_db_id())
  );

DROP POLICY IF EXISTS "orders_insert_policy" ON "orders";
CREATE POLICY "orders_insert_policy" ON "orders"
  FOR INSERT
  WITH CHECK (
    auth.get_user_role() IN ('admin', 'staff', 'customer')
  );

DROP POLICY IF EXISTS "orders_update_policy" ON "orders";
CREATE POLICY "orders_update_policy" ON "orders"
  FOR UPDATE
  USING (
    auth.get_user_role() IN ('admin', 'staff') OR
    (auth.get_user_role() = 'customer' AND user_id = auth.get_user_db_id())
  );

DROP POLICY IF EXISTS "orders_delete_policy" ON "orders";
CREATE POLICY "orders_delete_policy" ON "orders"
  FOR DELETE
  USING (
    auth.get_user_role() IN ('admin', 'staff')
  );

-- 更新订单座位表的RLS策略
DROP POLICY IF EXISTS "order_seats_select_policy" ON "order_seats";
CREATE POLICY "order_seats_select_policy" ON "order_seats"
  FOR SELECT
  USING (
    auth.get_user_role() IN ('admin', 'staff') OR
    (auth.get_user_role() = 'customer' AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_seats.order_id
      AND orders.user_id = auth.get_user_db_id()
    ))
  );

DROP POLICY IF EXISTS "order_seats_insert_policy" ON "order_seats";
CREATE POLICY "order_seats_insert_policy" ON "order_seats"
  FOR INSERT
  WITH CHECK (
    auth.get_user_role() IN ('admin', 'staff', 'customer')
  );

DROP POLICY IF EXISTS "order_seats_update_policy" ON "order_seats";
CREATE POLICY "order_seats_update_policy" ON "order_seats"
  FOR UPDATE
  USING (
    auth.get_user_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "order_seats_delete_policy" ON "order_seats";
CREATE POLICY "order_seats_delete_policy" ON "order_seats"
  FOR DELETE
  USING (
    auth.get_user_role() IN ('admin', 'staff')
  );

-- 更新seats表的RLS策略
DROP POLICY IF EXISTS "seats_update_policy" ON "seats";
CREATE POLICY "seats_update_policy" ON "seats"
  FOR UPDATE
  USING (
    auth.get_user_role() IN ('admin', 'staff', 'customer')
  );

-- 更新用户表策略
DROP POLICY IF EXISTS "users_select_policy" ON "users";
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  USING (TRUE);  -- 允许所有角色查询用户表

DROP POLICY IF EXISTS "users_insert_policy" ON "users";
CREATE POLICY "users_insert_policy" ON "users"
  FOR INSERT
  WITH CHECK (
    auth.role() IN ('authenticated', 'anon') -- 允许认证和匿名用户注册
  );

DROP POLICY IF EXISTS "users_update_policy" ON "users";
CREATE POLICY "users_update_policy" ON "users"
  FOR UPDATE
  USING (
    auth.get_user_role() = 'admin' OR
    (auth.get_user_role() IN ('staff', 'customer') AND id = auth.get_user_db_id())
  );

DROP POLICY IF EXISTS "users_delete_policy" ON "users";
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  USING (
    auth.get_user_role() = 'admin'
  ); 