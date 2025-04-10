-- 包含完整的数据库架构和安全性修复
-- 适用于Supabase (PostgreSQL)

-- ===============================
-- 第零部分: 清除现有数据库对象
-- ===============================

-- 删除视图
DROP VIEW IF EXISTS vw_now_showing_movies CASCADE;
DROP VIEW IF EXISTS vw_coming_soon_movies CASCADE;
DROP VIEW IF EXISTS vw_today_showtimes CASCADE;
DROP VIEW IF EXISTS vw_movie_details CASCADE;
DROP VIEW IF EXISTS vw_user_orders CASCADE;
DROP VIEW IF EXISTS vw_available_seats CASCADE;
DROP VIEW IF EXISTS vw_staff_operations CASCADE;
DROP VIEW IF EXISTS vw_daily_revenue CASCADE;
DROP VIEW IF EXISTS vw_movie_revenue_ranking CASCADE;
DROP VIEW IF EXISTS vw_theater_occupancy CASCADE;
DROP VIEW IF EXISTS vw_ticket_type_distribution CASCADE;
DROP VIEW IF EXISTS vw_staff_schedules CASCADE;

-- 删除触发器相关函数
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
DROP FUNCTION IF EXISTS after_insert_showtime() CASCADE;
DROP FUNCTION IF EXISTS after_update_theater_layout() CASCADE;
DROP FUNCTION IF EXISTS validate_order_status_change() CASCADE;
DROP FUNCTION IF EXISTS check_showtime_conflicts() CASCADE;
DROP FUNCTION IF EXISTS after_check_ticket_operation() CASCADE;
DROP FUNCTION IF EXISTS after_payment_success() CASCADE;
DROP FUNCTION IF EXISTS after_refund_success() CASCADE;
DROP FUNCTION IF EXISTS validate_movie_status_change() CASCADE;
DROP FUNCTION IF EXISTS after_insert_theater_layout() CASCADE;

-- 删除安全相关函数
DROP FUNCTION IF EXISTS public.get_auth_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_safe() CASCADE;
DROP FUNCTION IF EXISTS public.is_staff_safe() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_staff() CASCADE;

-- 删除业务函数
DROP FUNCTION IF EXISTS generate_seats_for_showtime(UUID) CASCADE;

-- 删除表 (按依赖关系顺序)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS theaters CASCADE;
DROP TABLE IF EXISTS theater_seat_layouts CASCADE;
DROP TABLE IF EXISTS showtimes CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_seats CASCADE;
DROP TABLE IF EXISTS staff_operations CASCADE;
DROP TABLE IF EXISTS staff_schedules CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS ticket_pricing CASCADE;

-- 删除自定义类型
DO $$
BEGIN
  DROP TYPE IF EXISTS user_role CASCADE;
  DROP TYPE IF EXISTS movie_status CASCADE;
  DROP TYPE IF EXISTS ticket_type CASCADE;
  DROP TYPE IF EXISTS order_status CASCADE;
  DROP TYPE IF EXISTS ticket_status CASCADE;
  DROP TYPE IF EXISTS staff_operation_type CASCADE;
  DROP TYPE IF EXISTS shift_type CASCADE;
  DROP TYPE IF EXISTS seat_type CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- 忽略错误，继续执行
    NULL;
END $$;

-- ===============================
-- 第一部分: 数据库类型定义
-- ===============================

-- 创建枚举类型
DO $$
BEGIN
    -- 检查并创建user_role枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');
    END IF;
    
    -- 检查并创建movie_status枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movie_status') THEN
        CREATE TYPE movie_status AS ENUM ('showing', 'coming_soon', 'off_showing');
    END IF;
    
    -- 检查并创建ticket_type枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_type') THEN
        CREATE TYPE ticket_type AS ENUM ('normal', 'student', 'senior', 'child');
    END IF;
    
    -- 检查并创建order_status枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
    END IF;
    
    -- 检查并创建ticket_status枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('unused', 'used', 'expired', 'soon', 'now', 'late');
    END IF;
    
    -- 检查并创建staff_operation_type枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_operation_type') THEN
        CREATE TYPE staff_operation_type AS ENUM ('sell', 'check', 'refund', 'modify');
    END IF;
    
    -- 检查并创建shift_type枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
        CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'evening');
    END IF;
    
    -- 检查并创建seat_type枚举类型
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_type') THEN
        CREATE TYPE seat_type AS ENUM ('normal', 'vip', 'couple', 'disabled');
    END IF;
END
$$;

-- ===============================
-- 第二部分: 数据库功能函数
-- ===============================

-- 1. 自动生成场次座位的存储过程
CREATE OR REPLACE FUNCTION generate_seats_for_showtime(p_showtime_id UUID)
RETURNS void AS $$
DECLARE
    v_theater_id UUID;
    v_rows INTEGER;
    v_columns INTEGER;
    v_layout_id UUID;
    v_layout JSONB;
    v_row INTEGER;
    v_col INTEGER;
    v_row_idx INTEGER;
    v_col_idx INTEGER;
    v_seat_type seat_type;
    v_layout_type TEXT;
BEGIN
    -- 获取场次对应的影厅信息
    SELECT theater_id, t.rows, t.columns
    INTO v_theater_id, v_rows, v_columns
    FROM showtimes s
    JOIN theaters t ON s.theater_id = t.id
    WHERE s.id = p_showtime_id;
    
    -- 查找影厅布局
    SELECT id, layout
    INTO v_layout_id, v_layout
    FROM theater_seat_layouts
    WHERE theater_id = v_theater_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 首先删除该场次已有的座位记录，避免重复
    DELETE FROM seats WHERE showtime_id = p_showtime_id;
    
    -- 如果没有找到布局，使用默认座位类型
    IF v_layout_id IS NULL THEN
        -- 生成默认的标准座位
        FOR v_row IN 1..v_rows LOOP
            FOR v_col IN 1..v_columns LOOP
                INSERT INTO seats (
                    showtime_id,
                    row_num,
                    column_num,
                    seat_type,
                    is_available
                ) VALUES (
                    p_showtime_id,
                    v_row,
                    v_col,
                    'normal',
                    TRUE
                );
            END LOOP;
        END LOOP;
    ELSE
        -- 使用布局信息生成座位
        FOR v_row_idx IN 0..jsonb_array_length(v_layout)-1 LOOP
            FOR v_col_idx IN 0..jsonb_array_length(v_layout->v_row_idx)-1 LOOP
                -- 获取布局中的座位类型
                v_layout_type := v_layout->v_row_idx->v_col_idx#>>'{}';
                
                -- 实际的行列号从1开始
                v_row := v_row_idx + 1;
                v_col := v_col_idx + 1;
                
                -- 跳过空位置
                IF v_layout_type != 'empty' THEN
                    -- 确定座位类型
                    IF v_layout_type IN ('normal', 'vip', 'couple', 'disabled') THEN
                        v_seat_type := v_layout_type::seat_type;
                    ELSE
                        v_seat_type := 'normal'::seat_type;
                    END IF;
                    
                    -- 插入座位记录
                    INSERT INTO seats (
                        showtime_id,
                        row_num,
                        column_num,
                        seat_type,
                        is_available
                    ) VALUES (
                        p_showtime_id,
                        v_row,
                        v_col,
                        v_seat_type,
                        TRUE
                    );
                END IF;
            END LOOP;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 第三部分: 数据库架构初始化
-- ===============================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    avatar VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 电影表
DROP TABLE IF EXISTS movies CASCADE;
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    original_title VARCHAR(200),
    poster VARCHAR(255) NOT NULL,
    webp_poster VARCHAR(255),
    duration INTEGER NOT NULL,  -- 以分钟为单位
    director VARCHAR(100) NOT NULL,
    actors TEXT[] NOT NULL,
    "cast" TEXT[],
    description TEXT NOT NULL,
    release_date DATE NOT NULL,
    genre TEXT[] NOT NULL,
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
    status movie_status DEFAULT 'coming_soon',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);

-- 影厅表
DROP TABLE IF EXISTS theaters CASCADE;
CREATE TABLE IF NOT EXISTS theaters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    rows INTEGER NOT NULL,
    columns INTEGER NOT NULL,
    equipment TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_theaters_name ON theaters(name);

-- 座位类型布局表
DROP TABLE IF EXISTS theater_seat_layouts CASCADE;
CREATE TABLE IF NOT EXISTS theater_seat_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theater_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    layout JSONB NOT NULL,  -- 存储二维数组的JSON格式
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_theater_seat_layouts_theater_id ON theater_seat_layouts(theater_id);

-- 电影场次表
DROP TABLE IF EXISTS showtimes CASCADE;
CREATE TABLE IF NOT EXISTS showtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    theater_id UUID NOT NULL REFERENCES theaters(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price_normal DECIMAL(10,2) NOT NULL,
    price_student DECIMAL(10,2) NOT NULL,
    price_senior DECIMAL(10,2) NOT NULL,
    price_child DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_theater_id ON showtimes(theater_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_start_time ON showtimes(start_time);

-- 座位表 (为每个场次存储座位状态)
DROP TABLE IF EXISTS seats CASCADE;
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    row_num INTEGER NOT NULL,
    column_num INTEGER NOT NULL,
    seat_type seat_type NOT NULL DEFAULT 'normal',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_seat_location UNIQUE (showtime_id, row_num, column_num)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_seats_showtime_id ON seats(showtime_id);
CREATE INDEX IF NOT EXISTS idx_seats_availability ON seats(showtime_id, is_available);

-- 订单表
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,  -- 自定义订单号格式 (如 TK2504060001)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    ticket_type ticket_type NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    ticket_status ticket_status DEFAULT 'unused',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    checked_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_showtime_id ON orders(showtime_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 订单座位关联表 (多对多关系)
DROP TABLE IF EXISTS order_seats CASCADE;
CREATE TABLE IF NOT EXISTS order_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_order_seat UNIQUE (order_id, seat_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_seats_order_id ON order_seats(order_id);
CREATE INDEX IF NOT EXISTS idx_order_seats_seat_id ON order_seats(seat_id);

-- 工作人员操作记录表
DROP TABLE IF EXISTS staff_operations CASCADE;
CREATE TABLE IF NOT EXISTS staff_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL,
    showtime_id UUID REFERENCES showtimes(id) ON DELETE SET NULL,
    operation_type staff_operation_type NOT NULL,
    details JSONB,  -- 存储操作详情的JSON格式
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_staff_operations_staff_id ON staff_operations(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_operations_order_id ON staff_operations(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_operations_type ON staff_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_staff_operations_created_at ON staff_operations(created_at);

-- 工作人员排班表
DROP TABLE IF EXISTS staff_schedules CASCADE;
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift shift_type NOT NULL,
    position VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(schedule_date);

-- 轮播图表
DROP TABLE IF EXISTS banners CASCADE;
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url VARCHAR(255) NOT NULL,
    webp_image_url VARCHAR(255),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    link VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_order_num ON banners(order_num);

-- 公告表
DROP TABLE IF EXISTS announcements CASCADE;
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_date_range ON announcements(start_date, end_date);

-- FAQ表
DROP TABLE IF EXISTS faqs CASCADE;
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question VARCHAR(200) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_num INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_order_num ON faqs(order_num);

-- 支付方式表
DROP TABLE IF EXISTS payment_methods CASCADE;
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- 支付记录表
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 票种价格表(新增表)
DROP TABLE IF EXISTS ticket_types CASCADE;
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    code ticket_type NOT NULL UNIQUE,
    discount_rate DECIMAL(3,2) NOT NULL CHECK (discount_rate > 0 AND discount_rate <= 1),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 票价配置表(新增表)
DROP TABLE IF EXISTS ticket_pricing CASCADE;
CREATE TABLE IF NOT EXISTS ticket_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_price DECIMAL(10,2) NOT NULL,
    weekend_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    holiday_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    peak_hours_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    special_movie_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    vip_seat_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    couple_seat_premium DECIMAL(10,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===============================
-- 第二部分: 安全修复 - 解决users表策略无限递归问题
-- ===============================

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

-- ===============================
-- 第三部分: 基本权限设置
-- ===============================

-- 设置其他表的RLS
-- 电影表RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- 电影表策略 - 所有人可查看，只有管理员和工作人员可以修改
CREATE POLICY movies_select_policy ON movies FOR SELECT USING (true);
CREATE POLICY movies_update_policy ON movies FOR UPDATE USING (is_staff_safe());
CREATE POLICY movies_insert_policy ON movies FOR INSERT WITH CHECK (is_staff_safe());
CREATE POLICY movies_delete_policy ON movies FOR DELETE USING (is_admin_safe());

-- 影厅表RLS
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;

-- 影厅表策略 - 所有人可查看，只有管理员和工作人员可以修改
CREATE POLICY theaters_select_policy ON theaters FOR SELECT USING (true);
CREATE POLICY theaters_update_policy ON theaters FOR UPDATE USING (is_staff_safe());
CREATE POLICY theaters_insert_policy ON theaters FOR INSERT WITH CHECK (is_staff_safe());
CREATE POLICY theaters_delete_policy ON theaters FOR DELETE USING (is_admin_safe());

-- 座位布局RLS
ALTER TABLE theater_seat_layouts ENABLE ROW LEVEL SECURITY;

-- 座位布局策略 - 所有人可查看，只有管理员和工作人员可以修改
CREATE POLICY seat_layouts_select_policy ON theater_seat_layouts FOR SELECT USING (true);
CREATE POLICY seat_layouts_update_policy ON theater_seat_layouts FOR UPDATE USING (is_staff_safe());
CREATE POLICY seat_layouts_insert_policy ON theater_seat_layouts FOR INSERT WITH CHECK (is_staff_safe());
CREATE POLICY seat_layouts_delete_policy ON theater_seat_layouts FOR DELETE USING (is_admin_safe());

-- 电影场次RLS
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;

-- 电影场次策略 - 所有人可查看，只有管理员和工作人员可以修改
CREATE POLICY showtimes_select_policy ON showtimes FOR SELECT USING (true);
CREATE POLICY showtimes_update_policy ON showtimes FOR UPDATE USING (is_staff_safe());
CREATE POLICY showtimes_insert_policy ON showtimes FOR INSERT WITH CHECK (is_staff_safe());
CREATE POLICY showtimes_delete_policy ON showtimes FOR DELETE USING (is_admin_safe());

-- 订单RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 订单策略 - 用户可以查看自己的订单，工作人员可以查看所有订单
CREATE POLICY orders_select_policy ON orders 
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    is_staff_safe()
  );
CREATE POLICY orders_update_policy ON orders FOR UPDATE USING (is_staff_safe());
CREATE POLICY orders_insert_policy ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY orders_delete_policy ON orders FOR DELETE USING (is_admin_safe());

-- 为其他表设置类似的RLS策略
-- ...

-- ===============================
-- 第四部分: 初始数据
-- ===============================

-- 插入默认管理员账户
INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES 
  (gen_random_uuid(), '系统管理员', 'admin@example.com', 
   '$2a$10$GsBeXb5sTNqXrTo2WVCjc.SIGGZxB6Kv5z8aZBxTtVnDyIqwBp0qe', 'admin', '13800000000')
ON CONFLICT (email) DO NOTHING;

-- 插入默认票种类型
INSERT INTO ticket_types (name, code, discount_rate, description)
VALUES
  ('普通票', 'normal', 1.00, '标准票价'),
  ('学生票', 'student', 0.80, '学生凭有效证件购买'),
  ('老人票', 'senior', 0.70, '65岁以上老人凭有效证件购买'),
  ('儿童票', 'child', 0.50, '12岁以下儿童票')
ON CONFLICT (code) DO NOTHING;

-- 插入默认票价配置
INSERT INTO ticket_pricing (base_price, weekend_premium, holiday_premium, peak_hours_premium, 
                          special_movie_premium, vip_seat_premium, couple_seat_premium, effective_from)
VALUES
  (50.00, 10.00, 15.00, 5.00, 20.00, 15.00, 25.00, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 插入默认支付方式
INSERT INTO payment_methods (name, code, description)
VALUES
  ('支付宝', 'alipay', '使用支付宝进行支付'),
  ('微信支付', 'wechat', '使用微信支付进行支付'),
  ('银行卡', 'bankcard', '使用银行卡进行支付')
ON CONFLICT (code) DO NOTHING;

-- ===============================
-- 第五部分: 触发器
-- ===============================

-- 1. 自动更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要更新时间戳的表创建触发器
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_movies_timestamp
BEFORE UPDATE ON movies
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_theaters_timestamp
BEFORE UPDATE ON theaters
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_theater_seat_layouts_timestamp
BEFORE UPDATE ON theater_seat_layouts
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_showtimes_timestamp
BEFORE UPDATE ON showtimes
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_seats_timestamp
BEFORE UPDATE ON seats
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_staff_schedules_timestamp
BEFORE UPDATE ON staff_schedules
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_banners_timestamp
BEFORE UPDATE ON banners
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_announcements_timestamp
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_faqs_timestamp
BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_payment_methods_timestamp
BEFORE UPDATE ON payment_methods
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- 2. 添加场次时自动生成座位触发器
CREATE OR REPLACE FUNCTION after_insert_showtime()
RETURNS TRIGGER AS $$
BEGIN
    -- 调用存储过程生成座位
    PERFORM generate_seats_for_showtime(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_seats_after_showtime
AFTER INSERT ON showtimes
FOR EACH ROW EXECUTE PROCEDURE after_insert_showtime();

-- 3. 更新影厅布局后更新相关场次座位的触发器
CREATE OR REPLACE FUNCTION after_update_theater_layout()
RETURNS TRIGGER AS $$
DECLARE
    v_showtime_id UUID;
BEGIN
    -- 如果影厅的行数或列数发生变化
    IF (OLD.rows != NEW.rows OR OLD.columns != NEW.columns) THEN
        -- 查找尚未开始的相关场次
        FOR v_showtime_id IN (
            SELECT id FROM showtimes
            WHERE theater_id = NEW.id
            AND start_time > CURRENT_TIMESTAMP
            AND NOT EXISTS (
                SELECT 1 FROM orders o
                JOIN order_seats os ON o.id = os.order_id
                JOIN seats s ON os.seat_id = s.id
                WHERE s.showtime_id = showtimes.id
                AND o.status IN ('paid', 'pending')
            )
        ) LOOP
            -- 删除旧座位
            DELETE FROM seats
            WHERE showtime_id = v_showtime_id;
            
            -- 重新生成座位
            PERFORM generate_seats_for_showtime(v_showtime_id);
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seats_after_theater_change
AFTER UPDATE ON theaters
FOR EACH ROW EXECUTE PROCEDURE after_update_theater_layout();

-- 4. 验证订单状态变更的触发器
CREATE OR REPLACE FUNCTION validate_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果状态未变，直接返回
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- 检查状态变更是否合法
    CASE NEW.status
        WHEN 'paid' THEN
            -- 只有待支付状态可以变为已支付
            IF OLD.status != 'pending' THEN
                RAISE EXCEPTION 'Cannot change order status from % to paid', OLD.status;
            END IF;
            -- 设置支付时间
            NEW.paid_at = CURRENT_TIMESTAMP;
        
        WHEN 'cancelled' THEN
            -- 只有待支付或已支付状态可以变为已取消
            IF OLD.status != 'pending' AND OLD.status != 'paid' THEN
                RAISE EXCEPTION 'Cannot change order status from % to cancelled', OLD.status;
            END IF;
            -- 设置取消时间
            NEW.cancelled_at = CURRENT_TIMESTAMP;
        
        WHEN 'refunded' THEN
            -- 只有已支付状态可以变为已退款
            IF OLD.status != 'paid' THEN
                RAISE EXCEPTION 'Cannot change order status from % to refunded', OLD.status;
            END IF;
            -- 设置退款时间
            NEW.refunded_at = CURRENT_TIMESTAMP;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_order_status
BEFORE UPDATE OF status ON orders
FOR EACH ROW EXECUTE PROCEDURE validate_order_status_change();

-- 5. 检查场次时间冲突的触发器
CREATE OR REPLACE FUNCTION check_showtime_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- 检查是否与同一影厅的其他场次有时间冲突
    SELECT COUNT(*) INTO conflict_count
    FROM showtimes
    WHERE theater_id = NEW.theater_id
    AND id != NEW.id  -- 排除自身
    AND (
        -- 新场次开始时间在其他场次的时间段内
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR
        -- 新场次结束时间在其他场次的时间段内
        (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR
        -- 新场次完全包含其他场次
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    );
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'The new showtime conflicts with existing showtimes in the same theater';
    END IF;
    
    -- 确保电影场次之间有至少15分钟的清场时间
    SELECT COUNT(*) INTO conflict_count
    FROM showtimes
    WHERE theater_id = NEW.theater_id
    AND id != NEW.id  -- 排除自身
    AND (
        -- 新场次开始前需要留出至少15分钟
        (end_time > NEW.start_time - INTERVAL '15 minutes' AND end_time <= NEW.start_time)
        OR
        -- 新场次结束后需要留出至少15分钟
        (start_time >= NEW.end_time AND start_time < NEW.end_time + INTERVAL '15 minutes')
    );
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'There must be at least 15 minutes between showtimes for theater cleanup';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_showtime_conflicts
BEFORE INSERT OR UPDATE ON showtimes
FOR EACH ROW EXECUTE PROCEDURE check_showtime_conflicts();

-- 6. 检票操作时更新订单状态的触发器
CREATE OR REPLACE FUNCTION after_check_ticket_operation()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果是检票操作
    IF NEW.operation_type = 'check' THEN
        -- 更新订单的票券状态为已使用
        UPDATE orders
        SET ticket_status = 'used', checked_at = NEW.created_at
        WHERE id = NEW.order_id AND ticket_status != 'used';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_status_after_check
AFTER INSERT ON staff_operations
FOR EACH ROW EXECUTE PROCEDURE after_check_ticket_operation();

-- 7. 支付成功后更新订单状态的触发器
CREATE OR REPLACE FUNCTION after_payment_success()
RETURNS TRIGGER AS $$
BEGIN
    -- 只处理支付成功的新记录
    IF NEW.status = 'success' THEN
        -- 更新订单状态为已支付
        UPDATE orders
        SET status = 'paid', paid_at = NEW.created_at
        WHERE id = NEW.order_id AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_after_payment
AFTER INSERT ON payments
FOR EACH ROW EXECUTE PROCEDURE after_payment_success();

-- 8. 退款成功后更新订单状态的触发器
CREATE OR REPLACE FUNCTION after_refund_success()
RETURNS TRIGGER AS $$
BEGIN
    -- 只处理退款类型的支付记录
    IF NEW.status = 'refunded' AND NEW.amount < 0 THEN
        -- 更新订单状态为已退款
        UPDATE orders
        SET status = 'refunded', refunded_at = NEW.created_at
        WHERE id = NEW.order_id AND status = 'paid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_after_refund
AFTER INSERT ON payments
FOR EACH ROW EXECUTE PROCEDURE after_refund_success();

-- 9. 确保电影上映状态的更新符合逻辑的触发器
CREATE OR REPLACE FUNCTION validate_movie_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果状态未变或是首次设置，直接返回
    IF OLD.status IS NULL OR OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- 检查状态变更是否合法
    CASE NEW.status
        WHEN 'showing' THEN
            -- 只有即将上映的电影可以变为正在上映
            IF OLD.status != 'coming_soon' THEN
                RAISE EXCEPTION 'Cannot change movie status from % to showing', OLD.status;
            END IF;
        
        WHEN 'off_showing' THEN
            -- 只有正在上映的电影可以变为已下映
            IF OLD.status != 'showing' THEN
                RAISE EXCEPTION 'Cannot change movie status from % to off_showing', OLD.status;
            END IF;
        
        WHEN 'coming_soon' THEN
            -- 已下映的电影不能变回即将上映
            IF OLD.status = 'off_showing' THEN
                RAISE EXCEPTION 'Cannot change movie status from off_showing to coming_soon';
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_movie_status
BEFORE UPDATE OF status ON movies
FOR EACH ROW EXECUTE PROCEDURE validate_movie_status_change();

-- 10. 添加座位布局后，应用到未来场次的触发器
CREATE OR REPLACE FUNCTION after_insert_theater_layout()
RETURNS TRIGGER AS $$
DECLARE
    v_showtime_id UUID;
    v_seat_record RECORD;
    v_row_idx INTEGER;
    v_col_idx INTEGER;
    v_layout_type TEXT;
    v_seat_type seat_type;
    v_seat_count INTEGER := 0;
BEGIN
    -- 仅处理未来的、未售票的场次
    FOR v_showtime_id IN (
        SELECT id FROM showtimes
        WHERE theater_id = NEW.theater_id
        AND start_time > CURRENT_TIMESTAMP + INTERVAL '1 hour'
        AND NOT EXISTS (
            SELECT 1 FROM orders o
            JOIN order_seats os ON o.id = os.order_id
            JOIN seats s ON os.seat_id = s.id
            WHERE s.showtime_id = showtimes.id
            AND o.status IN ('paid', 'pending')
        )
    ) LOOP
        -- 遍历每个座位位置
        FOR v_row_idx IN 0..jsonb_array_length(NEW.layout)-1 LOOP
            FOR v_col_idx IN 0..jsonb_array_length(NEW.layout->v_row_idx)-1 LOOP
                -- 获取布局中的座位类型
                v_layout_type := NEW.layout->v_row_idx->v_col_idx#>>'{}';
                
                -- 实际的行列号从1开始
                v_row_idx := v_row_idx + 1;
                v_col_idx := v_col_idx + 1;
                
                -- 根据布局类型设置座位类型
                IF v_layout_type = 'empty' THEN
                    -- 删除此位置的座位（如果存在）
                    DELETE FROM seats
                    WHERE showtime_id = v_showtime_id
                    AND row_num = v_row_idx
                    AND column_num = v_col_idx;
                ELSE
                    -- 确定座位类型
                    IF v_layout_type IN ('normal', 'vip', 'couple', 'disabled') THEN
                        v_seat_type := v_layout_type::seat_type;
                    ELSE
                        v_seat_type := 'normal'::seat_type;
                    END IF;
                    
                    -- 更新或插入座位
                    UPDATE seats
                    SET seat_type = v_seat_type
                    WHERE showtime_id = v_showtime_id
                    AND row_num = v_row_idx
                    AND column_num = v_col_idx;
                    
                    -- 如果座位不存在，则插入
                    IF NOT FOUND THEN
                        INSERT INTO seats (
                            showtime_id,
                            row_num,
                            column_num,
                            seat_type,
                            is_available
                        ) VALUES (
                            v_showtime_id,
                            v_row_idx,
                            v_col_idx,
                            v_seat_type,
                            TRUE
                        );
                    END IF;
                    
                    v_seat_count := v_seat_count + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_layout_to_future_showtimes
AFTER INSERT ON theater_seat_layouts
FOR EACH ROW EXECUTE PROCEDURE after_insert_theater_layout();

-- ===============================
-- 第六部分: 视图
-- ===============================

-- 1. 正在上映的电影视图
CREATE OR REPLACE VIEW vw_now_showing_movies AS
SELECT 
    m.*,
    COUNT(DISTINCT s.id) AS showtime_count
FROM 
    movies m
LEFT JOIN 
    showtimes s ON m.id = s.movie_id AND s.start_time > CURRENT_TIMESTAMP
WHERE 
    m.status = 'showing'
GROUP BY 
    m.id
ORDER BY 
    m.release_date DESC;

-- 2. 即将上映的电影视图
CREATE OR REPLACE VIEW vw_coming_soon_movies AS
SELECT 
    *
FROM 
    movies
WHERE 
    status = 'coming_soon'
ORDER BY 
    release_date ASC;

-- 3. 今日场次视图
CREATE OR REPLACE VIEW vw_today_showtimes AS
SELECT 
    s.*,
    m.title AS movie_title,
    m.poster AS movie_poster,
    m.duration AS movie_duration,
    t.name AS theater_name
FROM 
    showtimes s
JOIN 
    movies m ON s.movie_id = m.id
JOIN 
    theaters t ON s.theater_id = t.id
WHERE 
    DATE(s.start_time AT TIME ZONE 'UTC+8') = CURRENT_DATE
    AND s.start_time > CURRENT_TIMESTAMP
ORDER BY 
    s.start_time;

-- 4. 电影详情视图(包含场次信息)
CREATE OR REPLACE VIEW vw_movie_details AS
SELECT 
    m.*,
    COUNT(DISTINCT s.id) AS total_showtimes,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_revenue
FROM 
    movies m
LEFT JOIN 
    showtimes s ON m.id = s.movie_id
LEFT JOIN 
    orders o ON s.id = o.showtime_id AND o.status = 'paid'
GROUP BY 
    m.id;

-- 5. 用户订单视图
CREATE OR REPLACE VIEW vw_user_orders AS
SELECT 
    o.*,
    m.title AS movie_title,
    m.poster AS movie_poster,
    s.start_time,
    s.end_time,
    t.name AS theater_name,
    array_agg(CONCAT('R', se.row_num, 'C', se.column_num)) AS seat_locations
FROM 
    orders o
JOIN 
    showtimes s ON o.showtime_id = s.id
JOIN 
    movies m ON s.movie_id = m.id
JOIN 
    theaters t ON s.theater_id = t.id
JOIN 
    order_seats os ON o.id = os.order_id
JOIN 
    seats se ON os.seat_id = se.id
GROUP BY 
    o.id, m.title, m.poster, s.start_time, s.end_time, t.name
ORDER BY 
    o.created_at DESC;

-- 6. 场次可用座位视图
CREATE OR REPLACE VIEW vw_available_seats AS
SELECT 
    s.id AS showtime_id,
    se.id AS seat_id,
    se.row_num,
    se.column_num,
    se.seat_type,
    se.is_available
FROM 
    showtimes s
JOIN 
    seats se ON s.id = se.showtime_id
WHERE 
    se.is_available = TRUE
ORDER BY 
    s.id, se.row_num, se.column_num;

-- 7. 员工操作记录视图
CREATE OR REPLACE VIEW vw_staff_operations AS
SELECT 
    so.*,
    u.name AS staff_name,
    u.email AS staff_email,
    o.id AS related_order_id,
    m.title AS movie_title,
    t.name AS theater_name,
    s.start_time
FROM 
    staff_operations so
JOIN 
    users u ON so.staff_id = u.id
LEFT JOIN 
    orders o ON so.order_id = o.id
LEFT JOIN 
    showtimes s ON so.showtime_id = s.id OR (o.id IS NOT NULL AND o.showtime_id = s.id)
LEFT JOIN 
    movies m ON s.movie_id = m.id
LEFT JOIN 
    theaters t ON s.theater_id = t.id
ORDER BY 
    so.created_at DESC;

-- 8. 按日票房统计视图
CREATE OR REPLACE VIEW vw_daily_revenue AS
SELECT 
    DATE(o.paid_at) AS date,
    SUM(o.total_price) AS total_revenue,
    COUNT(*) AS ticket_count
FROM 
    orders o
WHERE 
    o.status = 'paid'
GROUP BY 
    DATE(o.paid_at)
ORDER BY 
    DATE(o.paid_at) DESC;

-- 9. 电影票房排行视图
CREATE OR REPLACE VIEW vw_movie_revenue_ranking AS
SELECT 
    m.id,
    m.title,
    m.poster,
    m.release_date,
    COUNT(o.id) AS ticket_count,
    SUM(o.total_price) AS total_revenue
FROM 
    movies m
LEFT JOIN 
    showtimes s ON m.id = s.movie_id
LEFT JOIN 
    orders o ON s.id = o.showtime_id AND o.status = 'paid'
GROUP BY 
    m.id, m.title, m.poster, m.release_date
ORDER BY 
    SUM(o.total_price) DESC NULLS LAST;

-- 10. 影厅使用率视图
CREATE OR REPLACE VIEW vw_theater_occupancy AS
SELECT 
    t.id AS theater_id,
    t.name AS theater_name,
    COUNT(DISTINCT s.id) AS showtime_count,
    COALESCE(AVG(
        CASE 
            WHEN o.id IS NOT NULL THEN 
                (SELECT COUNT(*) FROM order_seats os WHERE os.order_id = o.id)::FLOAT / t.total_seats * 100
            ELSE 0
        END
    ), 0) AS average_occupancy_rate
FROM 
    theaters t
LEFT JOIN 
    showtimes s ON t.id = s.theater_id
LEFT JOIN 
    orders o ON s.id = o.showtime_id AND o.status = 'paid'
GROUP BY 
    t.id, t.name
ORDER BY 
    average_occupancy_rate DESC;

-- 11. 票种分布视图
CREATE OR REPLACE VIEW vw_ticket_type_distribution AS
SELECT 
    o.ticket_type,
    COUNT(*) AS ticket_count,
    SUM(o.total_price) AS total_revenue,
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE status = 'paid')) AS percentage
FROM 
    orders o
WHERE 
    o.status = 'paid'
GROUP BY 
    o.ticket_type
ORDER BY 
    ticket_count DESC;

-- 12. 工作人员排班视图
CREATE OR REPLACE VIEW vw_staff_schedules AS
SELECT 
    ss.*,
    u.name AS staff_name,
    u.email AS staff_email
FROM 
    staff_schedules ss
JOIN 
    users u ON ss.staff_id = u.id
WHERE 
    u.role = 'staff'
ORDER BY 
    ss.schedule_date, 
    CASE 
        WHEN ss.shift = 'morning' THEN 1
        WHEN ss.shift = 'afternoon' THEN 2
        WHEN ss.shift = 'evening' THEN 3
    END;

-- ===============================
-- 第七部分: 演示数据迁移
-- ===============================

-- 添加演示数据 (可选，仅用于测试环境)
-- 这些数据将被添加到默认初始数据之上

-- 插入更多用户数据
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
(
    '00000000-0000-0000-0000-000000000002',
    '售票员小王',
    'staff1@example.com',
    '$2b$10$HCuKxE5GdeVEG0XytwSPSOBetJ5shxrXOUyOnkrqyln2e32A8XcZK', -- 密码: staff123
    'staff',
    '2023-01-15'
),
(
    '00000000-0000-0000-0000-000000000003',
    '张三',
    'customer1@example.com',
    '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.', -- 密码: customer123
    'customer',
    '2023-02-10'
),
(
    '00000000-0000-0000-0000-000000000004',
    '李四',
    'customer2@example.com',
    '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.', -- 密码: customer123
    'customer',
    '2023-03-15'
) ON CONFLICT (email) DO NOTHING;

-- 插入电影数据
INSERT INTO movies (id, title, original_title, poster, webp_poster, duration, director, actors, "cast", description, release_date, genre, rating, status) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    '星际迷航：超越边界',
    'Star Trek: Beyond Boundaries',
    '/images/default-poster.jpg',
    '/images/movies/movie1.webp',
    145,
    '林超能',
    ARRAY['王大锤', '李小方', '张绝绝子', '麦克风'],
    ARRAY['王大锤', '李小方', '张绝绝子', '麦克风', '赵火箭', '钱满袋', '孙传奇', '周真香'],
    '2127年，星际联盟探索舰队发现一个神秘的星际通道，可能连接到未知宇宙。舰队指挥官林宇辰带领精英团队穿越通道，意外发现一个与地球平行发展的文明。他们必须在两个世界的冲突中寻找和平，同时解开通道背后的宇宙奥秘。',
    '2025-04-06',
    ARRAY['科幻', '冒险', '动作'],
    8.7,
    'showing'
),
(
    '00000000-0000-0000-0000-000000000102',
    '幻象追踪',
    NULL,
    '/images/default-poster.jpg',
    '/images/movies/movie2.webp',
    118,
    '陈不看',
    ARRAY['高启强', '高启盛', '安静', '海绵宝'],
    NULL,
    '著名物理学家陈磊研发出一种可以探测人类梦境的技术，却意外发现某些梦境竟然是现实中从未发生过的记忆碎片。当他深入调查，发现自己可能处于一个比梦境更为复杂的现实中。在追寻真相的过程中，他必须面对自己内心深处的恐惧。',
    '2025-04-08',
    ARRAY['悬疑', '科幻', '心理'],
    8.5,
    'showing'
),
(
    '00000000-0000-0000-0000-000000000103',
    '春日告白',
    NULL,
    '/images/default-poster.jpg',
    '/images/movies/movie3.webp',
    112,
    '赵糖糖',
    ARRAY['何止一点', '陈伟笑', '刘会唱', '李芒果'],
    NULL,
    '大学教授林夏与心理医生顾一舟是青梅竹马，却因一场误会分开多年。当命运再次将他们带到同一所大学工作时，他们不得不面对过去的心结，以及那些未曾说出口的感情。一场春日樱花雨中的邂逅，让他们有机会重新审视彼此的心意。',
    '2025-04-10',
    ARRAY['爱情', '剧情'],
    7.9,
    'showing'
),
(
    '00000000-0000-0000-0000-000000000104',
    '暗影追踪者',
    NULL,
    '/images/default-poster.jpg',
    '/images/movies/movie4.webp',
    135,
    '吴梗王',
    ARRAY['黄飞鸿', '倪好笑', '张艺猛', '周一围'],
    NULL,
    '特别行动组组长萧风在一次卧底任务中失忆，醒来后发现自己深陷一个庞大的犯罪集团内部。他必须在不知道自己真实身份的情况下，依靠本能和零碎的记忆完成任务，同时寻找自己的过去。背叛与忠诚的界限在他的世界中逐渐模糊。',
    '2025-04-07',
    ARRAY['动作', '犯罪', '悬疑'],
    8.8,
    'showing'
),
(
    '00000000-0000-0000-0000-000000000105',
    '城市之光',
    NULL,
    '/images/default-poster.jpg',
    '/images/movies/movie5.webp',
    152,
    '冯导演',
    ARRAY['胡一刀', '孙悟饭', '邓不群', '宋江湖'],
    NULL,
    '这部史诗般的城市群像剧讲述了在2025年的中国大都市中，五个不同阶层、不同职业的人物，如何在经济转型的大潮中找寻自我价值与人生意义。从打工族到企业家，从教师到艺术家，他们的故事交织成一幅现代都市生活的全景图。',
    '2025-04-12',
    ARRAY['剧情', '社会', '家庭'],
    9.1,
    'coming_soon'
) ON CONFLICT DO NOTHING;

-- 插入影厅数据
INSERT INTO theaters (id, name, total_seats, rows, columns, equipment) VALUES
(
    '00000000-0000-0000-0000-000000000201',
    '1号厅 - IMAX',
    120,
    10,
    12,
    ARRAY['IMAX', '杜比全景声']
),
(
    '00000000-0000-0000-0000-000000000202',
    '2号厅 - 3D',
    80,
    8,
    10,
    ARRAY['3D', '杜比音效']
),
(
    '00000000-0000-0000-0000-000000000203',
    '3号厅 - 标准',
    60,
    6,
    10,
    ARRAY['标准银幕']
) ON CONFLICT DO NOTHING;

-- 插入影厅座位布局数据
INSERT INTO theater_seat_layouts (id, theater_id, layout) VALUES
(
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '[
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["disabled", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "couple"]
    ]'::JSONB
),
(
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    '[
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["disabled", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "couple"]
    ]'::JSONB
),
(
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000203',
    '[
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip", "vip"],
        ["normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal"],
        ["disabled", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "normal", "couple"]
    ]'::JSONB
) ON CONFLICT DO NOTHING;

-- 插入场次数据（添加未来日期的场次）
INSERT INTO showtimes (id, movie_id, theater_id, start_time, end_time, price_normal, price_student, price_senior, price_child) VALUES
(
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours' + INTERVAL '25 minutes',
    80.00,
    40.00,
    40.00,
    40.00
),
(
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours' + INTERVAL '25 minutes',
    80.00,
    40.00,
    40.00,
    40.00
),
(
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000202',
    CURRENT_DATE + INTERVAL '3 days' + INTERVAL '11 hours' + INTERVAL '30 minutes',
    CURRENT_DATE + INTERVAL '3 days' + INTERVAL '13 hours' + INTERVAL '28 minutes',
    60.00,
    30.00,
    30.00,
    30.00
),
(
    '00000000-0000-0000-0000-000000000404',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000203',
    CURRENT_DATE + INTERVAL '5 days' + INTERVAL '13 hours',
    CURRENT_DATE + INTERVAL '5 days' + INTERVAL '14 hours' + INTERVAL '52 minutes',
    50.00,
    25.00,
    25.00,
    25.00
),
(
    '00000000-0000-0000-0000-000000000405',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000201',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '19 hours',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '21 hours' + INTERVAL '15 minutes',
    90.00,
    45.00,
    45.00,
    45.00
) ON CONFLICT DO NOTHING;

-- 生成座位数据 (调用存储过程)
DO $$
BEGIN
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000401');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000402');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000403');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000404');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000405');
END $$;

-- 插入订单数据（创建测试订单，使用动态日期）
INSERT INTO orders (id, user_id, showtime_id, ticket_type, total_price, status, ticket_status, created_at, paid_at) VALUES
(
    'TK2504060001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000401',
    'normal',
    160.00,
    'paid',
    'unused',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '5 minutes'
),
(
    'TK2504060028',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000403',
    'student',
    30.00,
    'paid',
    'unused',
    CURRENT_TIMESTAMP - INTERVAL '12 hours',
    CURRENT_TIMESTAMP - INTERVAL '12 hours' + INTERVAL '5 minutes'
),
(
    'TK2504060073',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000405',
    'normal',
    270.00,
    'pending',
    'unused',
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    NULL
) ON CONFLICT DO NOTHING;

-- 添加订单座位关系（注意：需要确保seat_id存在）
-- 这里我们会使用一个动态方法获取座位ID

DO $$
DECLARE
    seat_id UUID;
BEGIN
    -- 为第一个订单添加座位(5,6)和(5,7)
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000401' 
    AND row_num = 5 AND column_num = 6
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060001', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
    
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000401' 
    AND row_num = 5 AND column_num = 7
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060001', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
    
    -- 为第二个订单添加座位(3,5)
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000403' 
    AND row_num = 3 AND column_num = 5
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060028', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
    
    -- 为第三个订单添加座位(4,6), (4,7), (4,8)
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000405' 
    AND row_num = 4 AND column_num = 6
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060073', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
    
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000405' 
    AND row_num = 4 AND column_num = 7
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060073', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
    
    SELECT id INTO seat_id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000405' 
    AND row_num = 4 AND column_num = 8
    LIMIT 1;
    
    IF seat_id IS NOT NULL THEN
        INSERT INTO order_seats (order_id, seat_id)
        VALUES ('TK2504060073', seat_id)
        ON CONFLICT DO NOTHING;
        
        -- 更新座位状态
        UPDATE seats SET is_available = FALSE
        WHERE id = seat_id;
    END IF;
END $$;

-- 插入公告消息
INSERT INTO announcements (title, content, is_active, start_date, end_date) VALUES
(
    '假期特别活动',
    '假期期间，购买任意电影票即可参与抽奖，有机会获得电影周边礼品。',
    TRUE,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '30 days'
),
(
    '系统维护通知',
    '系统将于下周二凌晨2:00-4:00进行维护升级，期间可能无法正常访问，请提前安排您的购票时间。',
    TRUE,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days'
),
(
    '新增取票方式',
    '现在可以通过微信小程序直接出示电子票入场，无需再到自助机取票。',
    TRUE,
    CURRENT_DATE - INTERVAL '30 days',
    NULL
) ON CONFLICT DO NOTHING;

-- 插入常见问题
INSERT INTO faqs (question, answer, category, order_num) VALUES
(
    '如何退改签电影票？',
    '已支付的电影票，开场前2小时可申请退票，收取票价的10%作为手续费；开场前30分钟至2小时之间可申请退票，收取票价的30%作为手续费；开场前30分钟内不支持退票。',
    '票务',
    1
),
(
    '如何使用优惠券？',
    '在选座确认订单页面，可以选择使用符合条件的优惠券。每个订单仅限使用一张优惠券，且不与其他优惠活动同时使用。',
    '票务',
    2
),
(
    '电影院内可以带食物吗？',
    '您可以携带影院出售的食品进入影厅。外带食品需在指定区域食用，不能带入影厅。',
    '观影',
    3
),
(
    '儿童/老人票如何购买？',
    '儿童票适用于身高1.3米以下的儿童，老人票适用于65岁以上老人，购票时选择对应票种，入场时可能需要提供相关证件。',
    '票务',
    4
) ON CONFLICT DO NOTHING;

-- 插入轮播图数据
INSERT INTO banners (image_url, webp_image_url, title, description, link, is_active, order_num) VALUES
(
    '/images/default-banner.jpg',
    '/images/banners/banner1.webp',
    '微光之下',
    '在一个永远不见天日的地下城市，由梁非凡和汤圆圆主演的科幻冒险之旅，一场关于勇气、真相与希望的故事。',
    '/movies/movie6',
    TRUE,
    1
),
(
    '/images/default-banner.jpg',
    '/images/banners/banner2.webp',
    '暗影追踪者',
    '特别行动组组长萧风（黄飞鸿饰）在一次卧底任务中失忆，醒来后发现自己深陷一个庞大的犯罪集团内部。',
    '/movies/movie4',
    TRUE,
    2
),
(
    '/images/default-banner.jpg',
    '/images/banners/banner3.webp',
    '会员日特惠',
    '每周二会员日，全场电影票8折优惠',
    '/promotions/members-day',
    TRUE,
    3
) ON CONFLICT DO NOTHING;

-- 更新用户密码哈希
UPDATE users 
SET password_hash = CASE 
    WHEN email = 'admin@example.com' THEN '$2b$10$.FIksAx3PtgCPxIynWlTT.eIKODdp.SPp84Ph0d2tij81rRv/2r1G'  -- admin123
    WHEN email = 'staff1@example.com' THEN '$2b$10$HCuKxE5GdeVEG0XytwSPSOBetJ5shxrXOUyOnkrqyln2e32A8XcZK'  -- staff123
    WHEN email = 'customer1@example.com' THEN '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.'  -- customer123
    WHEN email = 'customer2@example.com' THEN '$2b$10$TJdQ3MZeJy4PyznX0TLmmeFFA8KZDhQ8mgO3x10KMxrmIIAlphRl.'  -- customer123
END
WHERE email IN ('admin@example.com', 'staff1@example.com', 'customer1@example.com', 'customer2@example.com'); 