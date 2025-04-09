-- 电影票务系统安全策略
-- 适用于Supabase (PostgreSQL)

-- 创建辅助函数来检查用户角色
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建帮助函数：安全地创建策略
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    policy_name TEXT,
    table_name TEXT,
    command TEXT DEFAULT NULL,
    using_expr TEXT DEFAULT NULL,
    check_expr TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    sql TEXT;
BEGIN
    -- 检查策略是否已存在
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = table_name AND policyname = policy_name
    ) THEN
        -- 策略已存在，不做任何事情
        RETURN;
    END IF;
    
    -- 构建SQL语句
    sql := 'CREATE POLICY ' || quote_ident(policy_name) || ' ON ' || quote_ident(table_name);
    
    -- 添加FOR子句
    IF command IS NOT NULL THEN
        sql := sql || ' FOR ' || command;
    END IF;
    
    -- 添加USING子句（如果有）
    IF using_expr IS NOT NULL THEN
        sql := sql || ' USING (' || using_expr || ')';
    END IF;
    
    -- 添加WITH CHECK子句（如果有）
    IF check_expr IS NOT NULL THEN
        sql := sql || ' WITH CHECK (' || check_expr || ')';
    END IF;
    
    -- 执行SQL
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- 创建角色
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'movie_admin') THEN
    CREATE ROLE movie_admin;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'movie_staff') THEN
    CREATE ROLE movie_staff;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'movie_customer') THEN
    CREATE ROLE movie_customer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'movie_anonymous') THEN
    CREATE ROLE movie_anonymous;
  END IF;
END
$$;

-- 为管理员角色授予对所有表的完全访问权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO movie_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO movie_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO movie_admin;

-- 启用Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE theaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE theater_seat_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 常规表（公开信息）不需要启用RLS
-- banners, announcements, faqs, payment_methods 这些表可以公开访问

-- 创建安全策略

-- 1. 用户表安全策略
-- 用户只能访问自己的信息
SELECT create_policy_if_not_exists(
    'users_select_policy',
    'users',
    'SELECT',
    'auth.uid() = id OR (SELECT role FROM auth.users WHERE id = auth.uid()) = ''admin'' OR ((SELECT role FROM auth.users WHERE id = auth.uid()) IN (''admin'', ''staff'') AND role = ''staff'')'
);

-- 用户只能更新自己的信息（管理员除外）
SELECT create_policy_if_not_exists(
    'users_update_policy',
    'users',
    'UPDATE',
    'auth.uid() = id OR (SELECT role FROM auth.users WHERE id = auth.uid()) = ''admin'''
);

-- 只有管理员可以插入或删除用户
SELECT create_policy_if_not_exists(
    'users_insert_policy',
    'users',
    'INSERT',
    NULL,
    '(SELECT role FROM auth.users WHERE id = auth.uid()) = ''admin'''
);

SELECT create_policy_if_not_exists(
    'users_delete_policy',
    'users',
    'DELETE',
    '(SELECT role FROM auth.users WHERE id = auth.uid()) = ''admin'''
);

-- 2. 电影表安全策略
-- 所有人都可以查看电影信息
SELECT create_policy_if_not_exists(
    'movies_select_policy',
    'movies',
    'SELECT',
    'true'
);

-- 只有管理员可以添加、修改、删除电影
SELECT create_policy_if_not_exists(
    'movies_admin_policy',
    'movies',
    'ALL',
    'is_admin()'
);

-- 3. 影厅表安全策略
-- 所有人都可以查看影厅信息
SELECT create_policy_if_not_exists(
    'theaters_select_policy',
    'theaters',
    'SELECT',
    'true'
);

-- 只有管理员可以添加、修改、删除影厅
SELECT create_policy_if_not_exists(
    'theaters_admin_policy',
    'theaters',
    'ALL',
    'is_admin()'
);

-- 4. 座位布局表安全策略
-- 所有人都可以查看座位布局
SELECT create_policy_if_not_exists(
    'theater_seat_layouts_select_policy',
    'theater_seat_layouts',
    'SELECT',
    'true'
);

-- 只有管理员可以添加、修改、删除座位布局
SELECT create_policy_if_not_exists(
    'theater_seat_layouts_admin_policy',
    'theater_seat_layouts',
    'ALL',
    'is_admin()'
);

-- 5. 场次表安全策略
-- 所有人都可以查看场次信息
SELECT create_policy_if_not_exists(
    'showtimes_select_policy',
    'showtimes',
    'SELECT',
    'true'
);

-- 只有管理员可以添加、修改、删除场次
SELECT create_policy_if_not_exists(
    'showtimes_admin_policy',
    'showtimes',
    'ALL',
    'is_admin()'
);

-- 6. 座位表安全策略
-- 所有人都可以查看座位信息
SELECT create_policy_if_not_exists(
    'seats_select_policy',
    'seats',
    'SELECT',
    'true'
);

-- 管理员和工作人员可以更新座位状态
SELECT create_policy_if_not_exists(
    'seats_update_policy',
    'seats',
    'UPDATE',
    'is_staff()'
);

-- 只有管理员可以添加或删除座位
SELECT create_policy_if_not_exists(
    'seats_admin_policy',
    'seats',
    'ALL',
    'is_admin()'
);

-- 7. 订单表安全策略
-- 用户只能查看自己的订单
SELECT create_policy_if_not_exists(
    'orders_select_policy',
    'orders',
    'SELECT',
    'user_id = auth.uid() OR is_staff()'
);

-- 用户只能创建自己的订单
SELECT create_policy_if_not_exists(
    'orders_insert_policy',
    'orders',
    'INSERT',
    NULL,
    'user_id = auth.uid() OR is_staff()'
);

-- 用户只能更新自己的待支付订单
SELECT create_policy_if_not_exists(
    'orders_update_customer_policy',
    'orders',
    'UPDATE',
    'user_id = auth.uid() AND status = ''pending'''
);

-- 管理员和工作人员可以更新所有订单
SELECT create_policy_if_not_exists(
    'orders_update_staff_policy',
    'orders',
    'UPDATE',
    'is_staff()'
);

-- 8. 订单座位关联表安全策略
-- 与订单表相同的安全策略
SELECT create_policy_if_not_exists(
    'order_seats_select_policy',
    'order_seats',
    'SELECT',
    'EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_seats.order_id
        AND (
            orders.user_id = auth.uid() OR
            is_staff()
        )
    )'
);

SELECT create_policy_if_not_exists(
    'order_seats_insert_policy',
    'order_seats',
    'INSERT',
    NULL,
    'EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_seats.order_id
        AND (
            orders.user_id = auth.uid() OR
            is_staff()
        )
    )'
);

-- 9. 工作人员操作记录表安全策略
-- 工作人员只能查看自己的操作记录
SELECT create_policy_if_not_exists(
    'staff_operations_select_policy',
    'staff_operations',
    'SELECT',
    'staff_id = auth.uid() OR is_admin()'
);

-- 工作人员只能插入自己的操作记录
SELECT create_policy_if_not_exists(
    'staff_operations_insert_policy',
    'staff_operations',
    'INSERT',
    NULL,
    'staff_id = auth.uid() OR is_admin()'
);

-- 工作人员只能更新自己的操作记录
SELECT create_policy_if_not_exists(
    'staff_operations_update_policy',
    'staff_operations',
    'UPDATE',
    'staff_id = auth.uid() OR is_admin()'
);

-- 只有管理员可以删除操作记录
SELECT create_policy_if_not_exists(
    'staff_operations_delete_policy',
    'staff_operations',
    'DELETE',
    'is_admin()'
);

-- 10. 工作人员排班表安全策略
-- 工作人员只能查看自己的排班
SELECT create_policy_if_not_exists(
    'staff_schedules_select_policy',
    'staff_schedules',
    'SELECT',
    'staff_id = auth.uid() OR is_admin()'
);

-- 只有管理员可以添加、修改、删除排班
SELECT create_policy_if_not_exists(
    'staff_schedules_admin_policy',
    'staff_schedules',
    'ALL',
    'is_admin()'
);

-- 11. 支付记录表安全策略
-- 用户只能查看自己的支付记录
SELECT create_policy_if_not_exists(
    'payments_select_policy',
    'payments',
    'SELECT',
    'EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = payments.order_id
        AND (
            orders.user_id = auth.uid() OR
            is_staff()
        )
    )'
);

-- 用户只能创建自己的支付记录
SELECT create_policy_if_not_exists(
    'payments_insert_policy',
    'payments',
    'INSERT',
    NULL,
    'EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = payments.order_id
        AND (
            orders.user_id = auth.uid() OR
            is_staff()
        )
    )'
);

-- 授予权限到角色

-- 工作人员权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO movie_staff;
GRANT INSERT, UPDATE ON orders, order_seats, staff_operations, payments, seats TO movie_staff;
GRANT EXECUTE ON FUNCTION create_order, check_ticket, refund_ticket, sell_ticket TO movie_staff;

-- 顾客权限
GRANT SELECT ON movies, theaters, showtimes, seats, banners, announcements, faqs, payment_methods TO movie_customer;
GRANT SELECT, INSERT, UPDATE ON orders, order_seats, payments TO movie_customer;
GRANT EXECUTE ON FUNCTION create_order, cancel_order TO movie_customer;

-- 匿名用户权限（未登录）
GRANT SELECT ON movies, theaters, showtimes, seats, banners, announcements, faqs, payment_methods TO movie_anonymous;

-- 创建API视图（适合Supabase客户端访问）

-- 1. 当前用户信息视图
CREATE OR REPLACE VIEW api_current_user AS
SELECT 
    id, 
    name, 
    email, 
    role, 
    avatar, 
    phone, 
    created_at
FROM 
    users
WHERE 
    id = auth.uid();

-- 2. 公开电影视图
CREATE OR REPLACE VIEW api_public_movies AS
SELECT 
    id, 
    title, 
    original_title, 
    poster, 
    webp_poster, 
    duration, 
    director,
    actors, 
    description, 
    release_date, 
    genre, 
    rating, 
    status
FROM 
    movies;

-- 3. 当前用户订单视图
CREATE OR REPLACE VIEW api_user_orders AS
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
WHERE 
    o.user_id = auth.uid()
GROUP BY 
    o.id, m.title, m.poster, s.start_time, s.end_time, t.name
ORDER BY 
    o.created_at DESC;

-- 4. 工作人员接口视图
CREATE OR REPLACE VIEW api_staff_operations AS
SELECT 
    *
FROM 
    staff_operations
WHERE 
    staff_id = auth.uid() OR
    is_admin();

-- 5. 管理员统计视图
CREATE OR REPLACE VIEW api_admin_stats AS
SELECT 
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(CASE WHEN o.status = 'paid' THEN o.total_price ELSE 0 END) AS total_revenue,
    COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.id END) AS paid_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'refunded' THEN o.id END) AS refunded_orders,
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'customer' THEN u.id END) AS customer_count,
    COUNT(DISTINCT m.id) AS total_movies,
    COUNT(DISTINCT CASE WHEN m.status = 'showing' THEN m.id END) AS showing_movies,
    (SELECT COUNT(*) FROM showtimes WHERE start_time > CURRENT_DATE) AS upcoming_showtimes
FROM 
    orders o
CROSS JOIN 
    users u
CROSS JOIN 
    movies m
WHERE
    is_admin();

-- 为视图授予权限
GRANT SELECT ON api_public_movies TO movie_anonymous, movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_current_user TO movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_user_orders TO movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_staff_operations TO movie_staff, movie_admin;
GRANT SELECT ON api_admin_stats TO movie_admin; 