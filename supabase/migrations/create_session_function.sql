-- 创建用户会话函数
-- 此函数用于生成JWT令牌，用于Supabase身份验证
-- 参数:
--   p_user_id: 用户ID
--   p_email: 用户邮箱
--   p_role: 用户角色

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
  -- 获取JWT密钥
  _jwt_secret := current_setting('pgrst.jwt_secret', true);
  
  IF _jwt_secret IS NULL THEN
    RAISE EXCEPTION 'JWT密钥未配置，无法创建会话';
  END IF;
  
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