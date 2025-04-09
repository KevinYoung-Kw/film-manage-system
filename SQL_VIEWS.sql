-- 电影票务系统视图定义
-- 适用于Supabase (PostgreSQL)

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