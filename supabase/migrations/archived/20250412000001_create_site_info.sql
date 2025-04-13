-- 创建网站信息表迁移脚本
-- 版本: 1.0.0
-- 更新日期: 2025-04-12

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

-- 添加更新时间戳触发器
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_info_timestamp
BEFORE UPDATE ON site_info
FOR EACH ROW EXECUTE PROCEDURE update_timestamp(); 