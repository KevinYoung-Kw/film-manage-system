-- Row Level Security 策略文件
-- 为各个表配置基于JWT的访问控制

-- 启用所有表的行级安全
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 创建角色辅助函数
CREATE OR REPLACE FUNCTION public.get_jwt_role() RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'anonymous'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'anonymous';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 电影表策略
DROP POLICY IF EXISTS "movies_select_policy" ON "movies";
CREATE POLICY "movies_select_policy" ON "movies"
  FOR SELECT
  USING (true); -- 所有用户都可以查看电影

DROP POLICY IF EXISTS "movies_insert_policy" ON "movies";
CREATE POLICY "movies_insert_policy" ON "movies"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "movies_update_policy" ON "movies";
CREATE POLICY "movies_update_policy" ON "movies"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "movies_delete_policy" ON "movies";
CREATE POLICY "movies_delete_policy" ON "movies"
  FOR DELETE
  USING (
    get_jwt_role() = 'admin'
  );

-- 影厅表策略
DROP POLICY IF EXISTS "theaters_select_policy" ON "theaters";
CREATE POLICY "theaters_select_policy" ON "theaters"
  FOR SELECT
  USING (true); -- 所有用户都可以查看影厅

DROP POLICY IF EXISTS "theaters_insert_policy" ON "theaters";
CREATE POLICY "theaters_insert_policy" ON "theaters"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() = 'admin'
  );

DROP POLICY IF EXISTS "theaters_update_policy" ON "theaters";
CREATE POLICY "theaters_update_policy" ON "theaters"
  FOR UPDATE
  USING (
    get_jwt_role() = 'admin'
  );

DROP POLICY IF EXISTS "theaters_delete_policy" ON "theaters";
CREATE POLICY "theaters_delete_policy" ON "theaters"
  FOR DELETE
  USING (
    get_jwt_role() = 'admin'
  );

-- 场次表策略
DROP POLICY IF EXISTS "showtimes_select_policy" ON "showtimes";
CREATE POLICY "showtimes_select_policy" ON "showtimes"
  FOR SELECT
  USING (true); -- 所有用户都可以查看场次

DROP POLICY IF EXISTS "showtimes_insert_policy" ON "showtimes";
CREATE POLICY "showtimes_insert_policy" ON "showtimes"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "showtimes_update_policy" ON "showtimes";
CREATE POLICY "showtimes_update_policy" ON "showtimes"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "showtimes_delete_policy" ON "showtimes";
CREATE POLICY "showtimes_delete_policy" ON "showtimes"
  FOR DELETE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

-- 订单表策略
DROP POLICY IF EXISTS "orders_select_policy" ON "orders";
CREATE POLICY "orders_select_policy" ON "orders"
  FOR SELECT
  USING (
    get_jwt_role() IN ('admin', 'staff') OR
    (get_jwt_role() = 'customer' AND user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  );

DROP POLICY IF EXISTS "orders_insert_policy" ON "orders";
CREATE POLICY "orders_insert_policy" ON "orders"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() IN ('admin', 'staff', 'customer')
  );

DROP POLICY IF EXISTS "orders_update_policy" ON "orders";
CREATE POLICY "orders_update_policy" ON "orders"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin', 'staff') OR
    (get_jwt_role() = 'customer' AND user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  );

DROP POLICY IF EXISTS "orders_delete_policy" ON "orders";
CREATE POLICY "orders_delete_policy" ON "orders"
  FOR DELETE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

-- 座位预订策略
DROP POLICY IF EXISTS "order_seats_select_policy" ON "order_seats";
CREATE POLICY "order_seats_select_policy" ON "order_seats"
  FOR SELECT
  USING (
    get_jwt_role() IN ('admin', 'staff') OR
    (get_jwt_role() = 'customer' AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_seats.order_id
      AND orders.user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
    ))
  );

DROP POLICY IF EXISTS "order_seats_insert_policy" ON "order_seats";
CREATE POLICY "order_seats_insert_policy" ON "order_seats"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() IN ('admin', 'staff', 'customer')
  );

DROP POLICY IF EXISTS "order_seats_update_policy" ON "order_seats";
CREATE POLICY "order_seats_update_policy" ON "order_seats"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "order_seats_delete_policy" ON "order_seats";
CREATE POLICY "order_seats_delete_policy" ON "order_seats"
  FOR DELETE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

-- 用户表策略
DROP POLICY IF EXISTS "users_select_policy" ON "users";
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  USING (
    get_jwt_role() IN ('admin') OR
    (get_jwt_role() IN ('staff', 'customer') AND id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  );

DROP POLICY IF EXISTS "users_insert_policy" ON "users";
CREATE POLICY "users_insert_policy" ON "users"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() IN ('admin') OR
    get_jwt_role() = 'anonymous' -- 允许匿名用户注册
  );

DROP POLICY IF EXISTS "users_update_policy" ON "users";
CREATE POLICY "users_update_policy" ON "users"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin') OR
    (get_jwt_role() IN ('staff', 'customer') AND id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  );

DROP POLICY IF EXISTS "users_delete_policy" ON "users";
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  USING (
    get_jwt_role() = 'admin'
  );

-- 座位表策略
DROP POLICY IF EXISTS "seats_select_policy" ON "seats";
CREATE POLICY "seats_select_policy" ON "seats"
  FOR SELECT
  USING (true); -- 所有用户都可以查看座位

DROP POLICY IF EXISTS "seats_insert_policy" ON "seats";
CREATE POLICY "seats_insert_policy" ON "seats"
  FOR INSERT
  WITH CHECK (
    get_jwt_role() = 'admin'
  );

DROP POLICY IF EXISTS "seats_update_policy" ON "seats";
CREATE POLICY "seats_update_policy" ON "seats"
  FOR UPDATE
  USING (
    get_jwt_role() = 'admin'
  );

DROP POLICY IF EXISTS "seats_delete_policy" ON "seats";
CREATE POLICY "seats_delete_policy" ON "seats"
  FOR DELETE
  USING (
    get_jwt_role() = 'admin'
  );

-- 为特定视图授予访问权限（如果存在）
DO $$
BEGIN
  -- 检查并授权vw_today_showtimes视图
  IF EXISTS (
    SELECT FROM pg_catalog.pg_views
    WHERE schemaname = 'public' AND viewname = 'vw_today_showtimes'
  ) THEN
    EXECUTE 'GRANT SELECT ON vw_today_showtimes TO anon, authenticated';
  END IF;
  
  -- 视图可能需要先执行DATABASE_RESET.sql创建
  -- 这里只访问已存在的视图
END $$; 