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