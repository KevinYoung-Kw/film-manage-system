-- 启用RPC函数的外部访问
-- 允许匿名用户调用会话创建函数

-- 允许匿名访问create_user_session函数
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, text, text) TO service_role;

-- 允许访问get_jwt_role函数
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jwt_role() TO service_role;

-- 重设匿名和认证用户角色的表访问权限
-- 这确保RLS策略可以正确应用，而不是依赖表级权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; 