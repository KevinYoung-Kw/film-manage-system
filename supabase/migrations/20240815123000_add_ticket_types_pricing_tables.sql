-- 添加票务类型和定价策略表

-- 创建票务类型表
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建定价策略表
CREATE TABLE IF NOT EXISTS pricing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  condition_type VARCHAR(50) NOT NULL,
  condition_value JSONB,
  discount_percentage INTEGER,
  extra_charge DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建票务类型与定价策略的关联表
CREATE TABLE IF NOT EXISTS ticket_type_pricing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  pricing_strategy_id UUID NOT NULL REFERENCES pricing_strategies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticket_type_id, pricing_strategy_id)
);

-- 添加一些默认的票务类型数据
INSERT INTO ticket_types (name, base_price, description) VALUES
('普通票', 80.00, '标准票价'),
('学生票', 40.00, '持学生证可享受优惠'),
('老人票', 40.00, '65岁以上老人优惠票价'),
('儿童票', 40.00, '12岁以下儿童优惠票价'),
('VIP票', 100.00, 'VIP会员专享票价');

-- 添加一些默认的定价策略数据
INSERT INTO pricing_strategies (name, description, condition_type, condition_value, discount_percentage, extra_charge) VALUES
('工作日优惠', '周一至周五非节假日', 'weekday', '{"days": [1, 2, 3, 4, 5]}', 10, NULL),
('早场优惠', '12:00前开始的场次', 'before-noon', '{"hour": 12}', 20, NULL),
('深夜场折扣', '22:00后开始的场次', 'late-night', '{"hour": 22}', 15, NULL),
('3D电影附加费', '3D电影需额外收费', '3d-movie', '{"format": "3D"}', NULL, 10.00);

-- 关联票务类型和定价策略
INSERT INTO ticket_type_pricing_strategies (ticket_type_id, pricing_strategy_id) 
SELECT 
  t.id, 
  p.id
FROM 
  ticket_types t, 
  pricing_strategies p
WHERE 
  (t.name = '普通票' AND p.name IN ('工作日优惠', '早场优惠', '深夜场折扣', '3D电影附加费')) OR
  (t.name = '学生票' AND p.name IN ('工作日优惠', '早场优惠', '3D电影附加费')) OR
  (t.name = '老人票' AND p.name IN ('早场优惠', '3D电影附加费')) OR
  (t.name = '儿童票' AND p.name IN ('早场优惠', '3D电影附加费')) OR
  (t.name = 'VIP票' AND p.name IN ('深夜场折扣', '3D电影附加费'));

-- 添加RLS策略
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_type_pricing_strategies ENABLE ROW LEVEL SECURITY;

-- 创建读取策略
CREATE POLICY "任何人可以查看票务类型" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "任何人可以查看定价策略" ON pricing_strategies FOR SELECT USING (true);
CREATE POLICY "任何人可以查看票务类型和定价策略关联" ON ticket_type_pricing_strategies FOR SELECT USING (true);

-- 创建插入、更新和删除策略（仅管理员）
CREATE POLICY "仅管理员可以插入票务类型" ON ticket_types 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以更新票务类型" ON ticket_types 
FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以删除票务类型" ON ticket_types 
FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以插入定价策略" ON pricing_strategies 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以更新定价策略" ON pricing_strategies 
FOR UPDATE USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以删除定价策略" ON pricing_strategies 
FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以插入票务类型和定价策略关联" ON ticket_type_pricing_strategies 
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "仅管理员可以删除票务类型和定价策略关联" ON ticket_type_pricing_strategies 
FOR DELETE USING (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  )
); 