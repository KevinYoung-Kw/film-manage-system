-- 电影票务系统安全策略
-- 适用于Supabase (PostgreSQL)

-- 创建角色
CREATE ROLE movie_admin;
CREATE ROLE movie_staff;
CREATE ROLE movie_customer;
CREATE ROLE movie_anonymous;

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
CREATE POLICY users_select_policy ON users
FOR SELECT USING (
    auth.uid() = id OR  -- 自己的信息
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR  -- 管理员
    (role = 'staff' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')))  -- 工作人员可以查看其他工作人员
);

-- 用户只能更新自己的信息（管理员除外）
CREATE POLICY users_update_policy ON users
FOR UPDATE USING (
    auth.uid() = id OR  -- 自己的信息
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')  -- 管理员
);

-- 只有管理员可以插入或删除用户
CREATE POLICY users_insert_policy ON users
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY users_delete_policy ON users
FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. 电影表安全策略
-- 所有人都可以查看电影信息
CREATE POLICY movies_select_policy ON movies
FOR SELECT USING (true);

-- 只有管理员可以添加、修改、删除电影
CREATE POLICY movies_admin_policy ON movies
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 3. 影厅表安全策略
-- 所有人都可以查看影厅信息
CREATE POLICY theaters_select_policy ON theaters
FOR SELECT USING (true);

-- 只有管理员可以添加、修改、删除影厅
CREATE POLICY theaters_admin_policy ON theaters
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. 座位布局表安全策略
-- 所有人都可以查看座位布局
CREATE POLICY theater_seat_layouts_select_policy ON theater_seat_layouts
FOR SELECT USING (true);

-- 只有管理员可以添加、修改、删除座位布局
CREATE POLICY theater_seat_layouts_admin_policy ON theater_seat_layouts
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. 场次表安全策略
-- 所有人都可以查看场次信息
CREATE POLICY showtimes_select_policy ON showtimes
FOR SELECT USING (true);

-- 只有管理员可以添加、修改、删除场次
CREATE POLICY showtimes_admin_policy ON showtimes
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 6. 座位表安全策略
-- 所有人都可以查看座位信息
CREATE POLICY seats_select_policy ON seats
FOR SELECT USING (true);

-- 管理员和工作人员可以更新座位状态
CREATE POLICY seats_update_policy ON seats
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);

-- 只有管理员可以添加或删除座位
CREATE POLICY seats_admin_policy ON seats
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 7. 订单表安全策略
-- 用户只能查看自己的订单
CREATE POLICY orders_select_policy ON orders
FOR SELECT USING (
    user_id = auth.uid() OR  -- 自己的订单
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))  -- 管理员和工作人员
);

-- 用户只能创建自己的订单
CREATE POLICY orders_insert_policy ON orders
FOR INSERT WITH CHECK (
    user_id = auth.uid() OR  -- 自己的订单
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))  -- 管理员和工作人员可以代客户创建
);

-- 用户只能更新自己的待支付订单
CREATE POLICY orders_update_customer_policy ON orders
FOR UPDATE USING (
    user_id = auth.uid() AND status = 'pending'
);

-- 管理员和工作人员可以更新所有订单
CREATE POLICY orders_update_staff_policy ON orders
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
);

-- 8. 订单座位关联表安全策略
-- 与订单表相同的安全策略
CREATE POLICY order_seats_select_policy ON order_seats
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_seats.order_id
        AND (
            orders.user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
        )
    )
);

CREATE POLICY order_seats_insert_policy ON order_seats
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_seats.order_id
        AND (
            orders.user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
        )
    )
);

-- 9. 工作人员操作记录表安全策略
-- 工作人员只能查看自己的操作记录
CREATE POLICY staff_operations_select_policy ON staff_operations
FOR SELECT USING (
    staff_id = auth.uid() OR  -- 自己的操作记录
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')  -- 管理员可以查看所有
);

-- 工作人员只能创建自己的操作记录
CREATE POLICY staff_operations_insert_policy ON staff_operations
FOR INSERT WITH CHECK (
    staff_id = auth.uid() OR  -- 自己的操作记录
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')  -- 管理员可以创建任何人的
);

-- 10. 工作人员排班表安全策略
-- 工作人员只能查看自己的排班
CREATE POLICY staff_schedules_select_policy ON staff_schedules
FOR SELECT USING (
    staff_id = auth.uid() OR  -- 自己的排班
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')  -- 管理员可以查看所有
);

-- 只有管理员可以添加、修改、删除排班
CREATE POLICY staff_schedules_admin_policy ON staff_schedules
FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 11. 支付记录表安全策略
-- 用户只能查看自己的支付记录
CREATE POLICY payments_select_policy ON payments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = payments.order_id
        AND (
            orders.user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
        )
    )
);

-- 用户只能创建自己的支付记录
CREATE POLICY payments_insert_policy ON payments
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = payments.order_id
        AND (
            orders.user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff'))
        )
    )
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
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');

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
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');

-- 为视图授予权限
GRANT SELECT ON api_public_movies TO movie_anonymous, movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_current_user TO movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_user_orders TO movie_customer, movie_staff, movie_admin;
GRANT SELECT ON api_staff_operations TO movie_staff, movie_admin;
GRANT SELECT ON api_admin_stats TO movie_admin; 