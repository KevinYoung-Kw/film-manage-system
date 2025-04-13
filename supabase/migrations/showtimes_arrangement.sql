-- 创建统计视图和函数 - 修复统计数据访问问题

-- 删除之前可能存在的视图和函数
DROP VIEW IF EXISTS api_admin_stats CASCADE;
DROP VIEW IF EXISTS vw_daily_revenue CASCADE;
DROP VIEW IF EXISTS vw_ticket_type_distribution CASCADE;
DROP VIEW IF EXISTS vw_theater_occupancy CASCADE;
DROP VIEW IF EXISTS vw_movie_revenue_ranking CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_revenue(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_ticket_type_distribution() CASCADE;
DROP FUNCTION IF EXISTS public.get_theater_occupancy() CASCADE;
DROP FUNCTION IF EXISTS public.get_popular_movies(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.api_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS public.vw_daily_revenue() CASCADE;
DROP FUNCTION IF EXISTS public.vw_ticket_type_distribution() CASCADE;
DROP FUNCTION IF EXISTS public.vw_theater_occupancy() CASCADE;
DROP FUNCTION IF EXISTS public.vw_movie_revenue_ranking(INTEGER) CASCADE;

-- 创建直接可访问的视图
CREATE VIEW api_admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'paid') as paid_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'refunded') as refunded_orders,
    (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'customer') as customer_count,
    (SELECT COUNT(*) FROM movies) as total_movies,
    (SELECT COUNT(*) FROM movies WHERE status = 'showing') as showing_movies,
    (SELECT COUNT(*) FROM showtimes WHERE start_time > CURRENT_TIMESTAMP) as upcoming_showtimes;

CREATE VIEW vw_daily_revenue AS
SELECT 
    CAST(date_trunc('day', o.created_at) AS DATE) as date,
    COUNT(os.id) as ticket_count,
    SUM(o.total_price) as total_revenue
FROM 
    orders o
JOIN 
    order_seats os ON o.id = os.order_id
WHERE 
    o.status = 'paid'
GROUP BY 
    CAST(date_trunc('day', o.created_at) AS DATE)
ORDER BY 
    date DESC;

CREATE VIEW vw_ticket_type_distribution AS
SELECT 
    CASE o.ticket_type
        WHEN 'normal' THEN '普通票'
        WHEN 'student' THEN '学生票'
        WHEN 'senior' THEN '老人票'
        WHEN 'child' THEN '儿童票'
        ELSE '其他票型'
    END as ticket_type,
    COUNT(os.id) as ticket_count,
    SUM(o.total_price) as total_revenue,
    ROUND(
        COUNT(os.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM order_seats), 0)
    ) as percentage
FROM 
    orders o
JOIN 
    order_seats os ON o.id = os.order_id
WHERE 
    o.status = 'paid'
GROUP BY 
    o.ticket_type
ORDER BY 
    ticket_count DESC;

CREATE VIEW vw_theater_occupancy AS
SELECT 
    t.id as theater_id,
    t.name as theater_name,
    COUNT(DISTINCT sh.id) as showtime_count,
    COALESCE(
        AVG(
            CAST(
                (SELECT COUNT(*) FROM seats s JOIN order_seats os ON s.id = os.seat_id 
                WHERE s.showtime_id = sh.id AND os.order_id IN (SELECT id FROM orders WHERE status = 'paid')) 
                AS FLOAT
            ) / 
            NULLIF(CAST((SELECT COUNT(*) FROM seats s WHERE s.showtime_id = sh.id) AS FLOAT), 0)
        ), 0
    ) as average_occupancy_rate
FROM 
    theaters t
JOIN 
    showtimes sh ON t.id = sh.theater_id
WHERE 
    sh.start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    t.id, t.name
ORDER BY 
    average_occupancy_rate DESC;

CREATE VIEW vw_movie_revenue_ranking AS
SELECT 
    m.id,
    m.title,
    m.poster,
    m.release_date,
    COUNT(os.id) as ticket_count,
    SUM(o.total_price) as total_revenue
FROM 
    movies m
JOIN 
    showtimes sh ON m.id = sh.movie_id
JOIN 
    seats s ON sh.id = s.showtime_id
JOIN 
    order_seats os ON s.id = os.seat_id
JOIN 
    orders o ON os.order_id = o.id
WHERE 
    o.status = 'paid'
GROUP BY 
    m.id, m.title, m.poster, m.release_date
ORDER BY 
    total_revenue DESC;

-- 授予公开访问权限
ALTER VIEW api_admin_stats OWNER TO postgres;
ALTER VIEW vw_daily_revenue OWNER TO postgres;
ALTER VIEW vw_ticket_type_distribution OWNER TO postgres;
ALTER VIEW vw_theater_occupancy OWNER TO postgres;
ALTER VIEW vw_movie_revenue_ranking OWNER TO postgres;

GRANT SELECT ON api_admin_stats TO anon, authenticated, service_role;
GRANT SELECT ON vw_daily_revenue TO anon, authenticated, service_role;
GRANT SELECT ON vw_ticket_type_distribution TO anon, authenticated, service_role;
GRANT SELECT ON vw_theater_occupancy TO anon, authenticated, service_role;
GRANT SELECT ON vw_movie_revenue_ranking TO anon, authenticated, service_role; 