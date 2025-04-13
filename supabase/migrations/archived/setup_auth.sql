-- 为现有用户设置Supabase Auth服务
-- 此文件帮助修复"function sign(json, text) does not exist"错误
-- 通过切换到使用Supabase内置的Auth服务而不是自定义JWT

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
    auth.role() = 'authenticated' AND (
      -- 管理员可以更新任何用户
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
      ) OR 
      -- 用户可以更新自己的信息
      id::text = (auth.jwt()->>'user_db_id')
    )
  );

DROP POLICY IF EXISTS "users_delete_policy" ON "users";
CREATE POLICY "users_delete_policy" ON "users"
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 确保匿名用户可以读取用户表
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated; 