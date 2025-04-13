-- 整合认证和安全策略（合并版本）
-- 版本: 1.1.0
-- 更新日期: 2025-04-11
--
-- 本文件整合了以下SQL文件的功能：
-- 1. create_session_function.sql - 创建用户会话函数
-- 2. rls_policies.sql - 行级安全策略
-- 3. enable_rpc_functions.sql - 启用RPC函数
-- 4. setup_auth.sql - 设置Supabase Auth服务
-- 5. update_rls_policies.sql - 更新行级安全策略适配Supabase Auth

----------------------------------------------------------
-- 第一部分: 创建用户会话函数
----------------------------------------------------------

-- 创建用户会话函数
-- 此函数用于生成JWT令牌，用于Supabase身份验证
CREATE OR REPLACE FUNCTION public.create_user_session(
  p_user_id uuid,
  p_email text,
  p_role text
) RETURNS json AS $$
DECLARE
  _result json;
  _jwt_secret text;
  _jwt_exp integer := 3600 * 24 * 7; -- 7天过期时间
  _access_token text;
  _refresh_token text;
  _now timestamp := now();
  _expires_at timestamp := _now + (_jwt_exp * interval '1 second');
BEGIN
  -- 获取JWT密钥（先尝试从当前设置获取，如果失败则使用硬编码的密钥）
  BEGIN
    _jwt_secret := current_setting('pgrst.jwt_secret', true);
    
    IF _jwt_secret IS NULL THEN
      -- 使用提供的JWT密钥
      _jwt_secret := '25uquG8Im6X5cGGHIlFY7pZxoXjqRB9dGLERMltl2cJzxPPEzhoYo5b0y43Mfj/0J8Q5VRsDtQXuDKeaZueNWg==';
      
      -- 尝试设置JWT密钥（如果有权限）
      BEGIN
        PERFORM set_config('pgrst.jwt_secret', _jwt_secret, false);
      EXCEPTION
        WHEN OTHERS THEN
          -- 忽略设置错误，继续使用硬编码的密钥
          NULL;
      END;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- 使用提供的JWT密钥作为后备
      _jwt_secret := '25uquG8Im6X5cGGHIlFY7pZxoXjqRB9dGLERMltl2cJzxPPEzhoYo5b0y43Mfj/0J8Q5VRsDtQXuDKeaZueNWg==';
  END;
  
  -- 创建JWT访问令牌
  _access_token := sign(
    json_build_object(
      'role', p_role,
      'iss', 'supabase',
      'sub', p_user_id::text,
      'email', p_email,
      'exp', extract(epoch from _expires_at)::integer,
      'iat', extract(epoch from _now)::integer,
      'nbf', extract(epoch from _now)::integer
    ),
    _jwt_secret
  );
  
  -- 创建刷新令牌
  _refresh_token := encode(gen_random_bytes(32), 'hex');
  
  -- 返回令牌
  _result := json_build_object(
    'access_token', _access_token,
    'refresh_token', _refresh_token,
    'expires_at', _expires_at,
    'user', json_build_object(
      'id', p_user_id,
      'email', p_email,
      'role', p_role
    )
  );
  
  RETURN _result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '创建会话失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查JWT密钥是否已设置的辅助函数
CREATE OR REPLACE FUNCTION public.check_jwt_secret()
RETURNS json AS $$
DECLARE
  _jwt_secret text;
  _sample_token text;
BEGIN
  BEGIN
    _jwt_secret := current_setting('pgrst.jwt_secret', true);
    
    IF _jwt_secret IS NULL THEN
      RETURN json_build_object(
        'configured', false,
        'message', 'JWT密钥未设置'
      );
    END IF;
    
    -- 测试是否可以签名
    _sample_token := sign(
      json_build_object('test', true),
      _jwt_secret
    );
    
    RETURN json_build_object(
      'configured', true,
      'message', 'JWT密钥已正确配置'
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'configured', false,
        'message', '检查JWT密钥失败: ' || SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------------------------------------
-- 第二部分: 行级安全策略
----------------------------------------------------------

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

-- 启用所有表的行级安全
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

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

-- 用户表策略（为解决匿名用户认证问题进行了修改）
DROP POLICY IF EXISTS "users_select_policy" ON "users";
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  USING (
    TRUE  -- 允许所有角色查询用户表，包括匿名用户，用于登录验证
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

-- 支付表策略
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_policy" ON "payments";
CREATE POLICY "payments_select_policy" ON "payments"
  FOR SELECT
  USING (true); -- 所有用户都可以查看支付信息

DROP POLICY IF EXISTS "payments_insert_policy" ON "payments";
CREATE POLICY "payments_insert_policy" ON "payments"
  FOR INSERT
  WITH CHECK (true); -- 所有用户都可以创建支付记录

DROP POLICY IF EXISTS "payments_update_policy" ON "payments";
CREATE POLICY "payments_update_policy" ON "payments"
  FOR UPDATE
  USING (
    get_jwt_role() IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS "payments_delete_policy" ON "payments";
CREATE POLICY "payments_delete_policy" ON "payments"
  FOR DELETE
  USING (
    get_jwt_role() = 'admin'
  );

----------------------------------------------------------
-- 第三部分: 启用RPC函数的外部访问
----------------------------------------------------------

-- 允许匿名访问create_user_session函数
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO service_role;

-- 允许访问check_jwt_secret函数
GRANT EXECUTE ON FUNCTION public.check_jwt_secret() TO anon;
GRANT EXECUTE ON FUNCTION public.check_jwt_secret() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_jwt_secret() TO service_role;

-- 允许访问get_jwt_role函数
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO service_role;

-- 重设匿名和认证用户角色的表访问权限
-- 这确保RLS策略可以正确应用，而不是依赖表级权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 专门为登录过程授予匿名用户对users表的访问权限
-- 这可以确保即使其他地方有改动，登录功能也能正常工作
GRANT SELECT ON users TO anon;

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
END $$;

----------------------------------------------------------
-- 第四部分: 设置Supabase Auth服务
-- (整合自setup_auth.sql)
----------------------------------------------------------

-- 安装pgcrypto扩展(如果尚未安装)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 创建一个函数，用于在auth.users表中创建对应的用户记录
CREATE OR REPLACE FUNCTION create_auth_user_for_existing_db_users()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_auth_user_id UUID;
  v_default_password TEXT;
BEGIN
  -- 遍历所有用户
  FOR v_user IN 
    SELECT id, email, role, name FROM users
  LOOP
    -- 为每个用户生成一个默认密码
    v_default_password := 'film-system-token-' || substring(v_user.id::text, 1, 8);
    
    -- 检查auth.users表中是否已存在该用户
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE email = v_user.email
    ) THEN
      -- 在auth.users表中创建用户
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated',
        v_user.email,
        crypt(v_default_password, gen_salt('bf')),
        now(),
        null,
        now(),
        json_build_object('provider', 'email', 'providers', array['email']),
        json_build_object(
          'role', v_user.role,
          'user_db_id', v_user.id,
          'name', v_user.name
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      )
      RETURNING id INTO v_auth_user_id;
      
      -- 输出日志
      RAISE NOTICE 'Created auth user for % with ID %', v_user.email, v_auth_user_id;
    ELSE
      -- 如果用户已存在，更新其元数据
      UPDATE auth.users 
      SET raw_user_meta_data = json_build_object(
        'role', v_user.role,
        'user_db_id', v_user.id,
        'name', v_user.name
      )
      WHERE email = v_user.email;
      
      RAISE NOTICE 'Updated existing auth user for %', v_user.email;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Auth user setup complete!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 执行函数
SELECT create_auth_user_for_existing_db_users();

-- 删除函数(清理)
DROP FUNCTION IF EXISTS create_auth_user_for_existing_db_users();

-- 确保行级安全策略正确配置
-- 检查和添加用户表的RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 确保用户表有适当的策略
DROP POLICY IF EXISTS "users_select_policy" ON "users";
CREATE POLICY "users_select_policy" ON "users"
  FOR SELECT
  USING (true); -- 允许所有角色查询用户表，包括匿名用户，用于登录验证

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

-- 确保匿名用户可以读取用户表
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;

----------------------------------------------------------
-- 第五部分: 更新行级安全策略以适配Supabase Auth
-- (整合自update_rls_policies.sql)
----------------------------------------------------------

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

-- 更新用户表策略 (使用auth辅助函数)
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

-- 确保认证辅助函数可以被调用
GRANT EXECUTE ON FUNCTION auth.get_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.get_user_db_id() TO anon, authenticated, service_role;

----------------------------------------------------------
-- 第六部分: 创建网站信息表
----------------------------------------------------------

-- 网站信息表
DROP TABLE IF EXISTS site_info CASCADE;
CREATE TABLE IF NOT EXISTS site_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL DEFAULT '电影票务系统',
    address VARCHAR(200) NOT NULL DEFAULT '中国某省某市某区某街道123号',
    phone VARCHAR(20) NOT NULL DEFAULT '400-123-4567',
    email VARCHAR(100) NOT NULL DEFAULT 'support@example.com',
    copyright VARCHAR(100) NOT NULL DEFAULT '© 2025 电影票务系统',
    workingHours VARCHAR(100) NOT NULL DEFAULT '09:00 - 22:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认数据
INSERT INTO site_info (name, address, phone, email, copyright, workingHours) VALUES
(
    '电影票务系统',
    '中国某省某市某区某街道123号',
    '400-123-4567',
    'support@example.com',
    '© 2025 电影票务系统',
    '09:00 - 22:00'
) ON CONFLICT DO NOTHING;

-- 设置适当的RLS策略
ALTER TABLE site_info ENABLE ROW LEVEL SECURITY;

-- 创建site_info的RLS策略
DROP POLICY IF EXISTS "site_info_select_policy" ON "site_info";
CREATE POLICY "site_info_select_policy" ON "site_info"
  FOR SELECT
  USING (true); -- 所有用户都可以查看网站信息

DROP POLICY IF EXISTS "site_info_insert_policy" ON "site_info";
CREATE POLICY "site_info_insert_policy" ON "site_info"
  FOR INSERT
  WITH CHECK (
    auth.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "site_info_update_policy" ON "site_info";
CREATE POLICY "site_info_update_policy" ON "site_info"
  FOR UPDATE
  USING (
    auth.get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "site_info_delete_policy" ON "site_info";
CREATE POLICY "site_info_delete_policy" ON "site_info"
  FOR DELETE
  USING (
    auth.get_user_role() = 'admin'
  );

-- 设置权限
GRANT SELECT ON site_info TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON site_info TO authenticated, service_role; 