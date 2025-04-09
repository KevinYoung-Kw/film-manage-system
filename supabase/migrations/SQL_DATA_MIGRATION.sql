-- 电影票务系统数据迁移脚本
-- 适用于Supabase (PostgreSQL)
-- 用于将mockData.ts中的数据导入到数据库

-- 清空表（按照依赖关系倒序）
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE staff_operations CASCADE;
TRUNCATE TABLE order_seats CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE seats CASCADE;
TRUNCATE TABLE showtimes CASCADE;
TRUNCATE TABLE theater_seat_layouts CASCADE;
TRUNCATE TABLE theaters CASCADE;
TRUNCATE TABLE movies CASCADE;
TRUNCATE TABLE staff_schedules CASCADE;
TRUNCATE TABLE faqs CASCADE;
TRUNCATE TABLE announcements CASCADE;
TRUNCATE TABLE banners CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE users CASCADE;

-- 插入用户数据
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '管理员',
    'admin@example.com',
    '$2a$10$X7YK3DmZpfG5gKR5K3T5xu7qD.uGzHgN7DhoNQR.UGFSg8a4equPC', -- 密码: admin123
    'admin',
    '2023-01-01'
),
(
    '00000000-0000-0000-0000-000000000002',
    '售票员小王',
    'staff1@example.com',
    '$2a$10$X7YK3DmZpfG5gKR5K3T5xu7qD.uGzHgN7DhoNQR.UGFSg8a4equPC', -- 密码: staff123
    'staff',
    '2023-01-15'
),
(
    '00000000-0000-0000-0000-000000000003',
    '张三',
    'customer1@example.com',
    '$2a$10$X7YK3DmZpfG5gKR5K3T5xu7qD.uGzHgN7DhoNQR.UGFSg8a4equPC', -- 密码: customer123
    'customer',
    '2023-02-10'
),
(
    '00000000-0000-0000-0000-000000000004',
    '李四',
    'customer2@example.com',
    '$2a$10$X7YK3DmZpfG5gKR5K3T5xu7qD.uGzHgN7DhoNQR.UGFSg8a4equPC', -- 密码: customer123
    'customer',
    '2023-03-15'
);

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
);

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
);

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
);

-- 插入场次数据
INSERT INTO showtimes (id, movie_id, theater_id, start_time, end_time, price_normal, price_student, price_senior, price_child) VALUES
(
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '2025-04-06 10:00:00',
    '2025-04-06 12:25:00',
    80.00,
    40.00,
    40.00,
    40.00
),
(
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201',
    '2025-04-06 14:00:00',
    '2025-04-06 16:25:00',
    80.00,
    40.00,
    40.00,
    40.00
),
(
    '00000000-0000-0000-0000-000000000403',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000202',
    '2025-04-08 11:30:00',
    '2025-04-08 13:28:00',
    60.00,
    30.00,
    30.00,
    30.00
),
(
    '00000000-0000-0000-0000-000000000404',
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000203',
    '2025-04-10 13:00:00',
    '2025-04-10 14:52:00',
    50.00,
    25.00,
    25.00,
    25.00
),
(
    '00000000-0000-0000-0000-000000000405',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000201',
    '2025-04-07 19:00:00',
    '2025-04-07 21:15:00',
    90.00,
    45.00,
    45.00,
    45.00
);

-- 生成座位数据 (调用存储过程)
DO $$
BEGIN
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000401');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000402');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000403');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000404');
    PERFORM generate_seats_for_showtime('00000000-0000-0000-0000-000000000405');
END $$;

-- 插入订单数据
INSERT INTO orders (id, user_id, showtime_id, ticket_type, total_price, status, ticket_status, created_at, paid_at) VALUES
(
    'TK2504060001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000401',
    'normal',
    160.00,
    'paid',
    'unused',
    '2025-04-05 14:30:00',
    '2025-04-05 14:35:00'
),
(
    'TK2504060028',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000403',
    'student',
    30.00,
    'paid',
    'unused',
    '2025-04-06 09:15:00',
    '2025-04-06 09:20:00'
),
(
    'TK2504060073',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000405',
    'normal',
    270.00,
    'pending',
    'unused',
    '2025-04-06 18:45:00',
    NULL
);

-- 添加订单座位关系
-- 注意：需要获取座位ID，这里使用简化的逻辑
WITH seat_ids AS (
    SELECT id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000401' 
    AND row_num = 5 AND column_num IN (6, 7)
    LIMIT 2
)
INSERT INTO order_seats (order_id, seat_id)
SELECT 'TK2504060001', id FROM seat_ids;

WITH seat_ids AS (
    SELECT id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000403' 
    AND row_num = 3 AND column_num = 5
    LIMIT 1
)
INSERT INTO order_seats (order_id, seat_id)
SELECT 'TK2504060028', id FROM seat_ids;

WITH seat_ids AS (
    SELECT id FROM seats 
    WHERE showtime_id = '00000000-0000-0000-0000-000000000405' 
    AND row_num = 4 AND column_num IN (6, 7, 8)
    LIMIT 3
)
INSERT INTO order_seats (order_id, seat_id)
SELECT 'TK2504060073', id FROM seat_ids;

-- 更新座位状态
UPDATE seats
SET is_available = FALSE
WHERE id IN (
    SELECT seat_id FROM order_seats
);

-- 插入支付方式数据
INSERT INTO payment_methods (id, name, code, icon, is_active) VALUES
(
    '00000000-0000-0000-0000-000000000801',
    '微信支付',
    'wechat',
    '/images/payment/wechat.png',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000802',
    '支付宝',
    'alipay',
    '/images/payment/alipay.png',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000803',
    '银联卡',
    'unionpay',
    '/images/payment/unionpay.png',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000804',
    '会员卡支付',
    'membercard',
    '/images/payment/membercard.png',
    TRUE
);

-- 插入支付记录
INSERT INTO payments (order_id, payment_method_id, amount, status, created_at) VALUES
(
    'TK2504060001',
    '00000000-0000-0000-0000-000000000801',
    160.00,
    'success',
    '2025-04-05 14:35:00'
),
(
    'TK2504060028',
    '00000000-0000-0000-0000-000000000802',
    30.00,
    'success',
    '2025-04-06 09:20:00'
);

-- 插入工作人员操作记录
INSERT INTO staff_operations (id, staff_id, order_id, showtime_id, operation_type, details, created_at) VALUES
(
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000002',
    'TK2504060001',
    '00000000-0000-0000-0000-000000000401',
    'sell',
    '{"ticketType": "normal", "seats": ["seat-theater1-5-6", "seat-theater1-5-7"], "totalPrice": 160, "paymentMethod": "cash"}'::JSONB,
    '2025-04-05 14:35:00'
),
(
    '00000000-0000-0000-0000-000000000902',
    '00000000-0000-0000-0000-000000000002',
    'TK2504060028',
    '00000000-0000-0000-0000-000000000403',
    'sell',
    '{"ticketType": "student", "seats": ["seat-theater2-3-5"], "totalPrice": 30, "paymentMethod": "wechat"}'::JSONB,
    '2025-04-06 09:20:00'
),
(
    '00000000-0000-0000-0000-000000000903',
    '00000000-0000-0000-0000-000000000002',
    'TK2504060001',
    '00000000-0000-0000-0000-000000000401',
    'check',
    '{"checkTime": "2025-04-06T09:45:00", "status": "success"}'::JSONB,
    '2025-04-06 09:45:00'
);

-- 插入工作人员排班信息
INSERT INTO staff_schedules (staff_id, schedule_date, shift, position, notes, created_at) VALUES
(
    '00000000-0000-0000-0000-000000000002',
    '2025-04-06',
    'morning',
    '售票',
    '工作日早班',
    '2025-04-01 10:00:00'
),
(
    '00000000-0000-0000-0000-000000000002',
    '2025-04-06',
    'afternoon',
    '检票',
    '工作日下午班',
    '2025-04-01 10:00:00'
),
(
    '00000000-0000-0000-0000-000000000002',
    '2025-04-07',
    'evening',
    '售票',
    '加班',
    '2025-04-01 10:00:00'
);

-- 插入公告消息
INSERT INTO announcements (title, content, is_active, start_date, end_date) VALUES
(
    '五一特别活动',
    '五一期间，购买任意电影票即可参与抽奖，有机会获得电影周边礼品。',
    TRUE,
    '2025-04-05',
    '2025-05-05'
),
(
    '系统维护通知',
    '系统将于2025年4月13日凌晨2:00-4:00进行维护升级，期间可能无法正常访问，请提前安排您的购票时间。',
    TRUE,
    '2025-04-08',
    '2025-04-13'
),
(
    '新增取票方式',
    '现在可以通过微信小程序直接出示电子票入场，无需再到自助机取票。',
    TRUE,
    '2025-04-01',
    NULL
);

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
);

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
);

-- 提交事务
COMMIT; 