-- 修复create_order函数问题
-- 版本: 1.0.0
-- 日期: 2025-04-24
-- 描述: 修复订单创建过程中订单记录未正确插入orders表的问题

-- 首先替换create_order函数
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, UUID[], TEXT, UUID);

CREATE OR REPLACE FUNCTION create_order(
    p_user_id UUID,
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_ticket_type TEXT,
    p_payment_method_id UUID DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    order_id TEXT
) AS $$
DECLARE
    v_order_id TEXT;
    v_showtime RECORD;
    v_total_price DECIMAL(10,2) := 0;
    v_base_price DECIMAL(10,2);
    v_seat_id UUID;
    v_seat RECORD;
    v_count INTEGER := 0;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
    v_order_date TEXT;
    v_order_num TEXT;
    v_is_admin BOOLEAN;
    v_is_staff BOOLEAN;
BEGIN
    -- 检查权限
    -- 获取当前用户角色并检查是否为管理员或工作人员
    SELECT auth.get_user_role() = 'admin' INTO v_is_admin;
    SELECT auth.get_user_role() = 'staff' INTO v_is_staff;
    
    -- 检查权限：只有管理员/工作人员可以为他人下单，普通用户只能为自己下单
    IF NOT (v_is_admin OR v_is_staff) THEN
        -- 检查user_id是否等于当前认证用户的数据库ID
        IF p_user_id != auth.get_user_db_id() THEN
            RETURN QUERY SELECT FALSE, '权限不足：只能为自己创建订单', NULL::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- 检查输入参数
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, '用户ID不能为空', NULL::TEXT;
        RETURN;
    END IF;
    
    IF p_showtime_id IS NULL THEN
        RETURN QUERY SELECT FALSE, '场次ID不能为空', NULL::TEXT;
        RETURN;
    END IF;
    
    IF p_seat_ids IS NULL OR array_length(p_seat_ids, 1) = 0 THEN
        RETURN QUERY SELECT FALSE, '座位不能为空', NULL::TEXT;
        RETURN;
    END IF;
    
    IF p_ticket_type IS NULL THEN
        RETURN QUERY SELECT FALSE, '票型不能为空', NULL::TEXT;
        RETURN;
    END IF;
    
    -- 查询场次信息
    SELECT * INTO v_showtime
    FROM showtimes
    WHERE id = p_showtime_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, '场次不存在', NULL::TEXT;
        RETURN;
    END IF;
    
    -- 根据票型获取基础票价
    CASE p_ticket_type 
        WHEN 'normal' THEN v_base_price := v_showtime.price_normal;
        WHEN 'student' THEN v_base_price := v_showtime.price_student;
        WHEN 'senior' THEN v_base_price := v_showtime.price_senior;
        WHEN 'child' THEN v_base_price := v_showtime.price_child;
        ELSE v_base_price := v_showtime.price_normal; -- 默认使用普通票价
    END CASE;
    
    -- 检查电影是否已上映过期
    IF v_showtime.start_time < CURRENT_TIMESTAMP THEN
        -- 如果已经超过开场时间15分钟，则不允许购票
        IF v_showtime.start_time < (CURRENT_TIMESTAMP - INTERVAL '15 minutes') THEN
            RETURN QUERY SELECT FALSE, '电影已开场超过15分钟，无法购票', NULL::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- 计算订单总价
    -- 遍历座位，计算每个座位的价格（根据座位类型可能会有不同价格）
    FOREACH v_seat_id IN ARRAY p_seat_ids
    LOOP
        -- 查询座位信息
        SELECT * INTO v_seat
        FROM seats
        WHERE id = v_seat_id AND showtime_id = p_showtime_id;
        
        IF NOT FOUND THEN
            RETURN QUERY SELECT FALSE, '座位ID无效: ' || v_seat_id::TEXT, NULL::TEXT;
            RETURN;
        END IF;
        
        -- 检查座位是否可用
        IF NOT v_seat.is_available THEN
            RETURN QUERY SELECT FALSE, '座位已被占用: 第' || v_seat.row_num || '排' || v_seat.column_num || '座', NULL::TEXT;
            RETURN;
        END IF;
        
        -- 根据座位类型计算价格，使用正确的乘数
        CASE v_seat.seat_type
            WHEN 'normal' THEN
                v_total_price := v_total_price + v_base_price;
            WHEN 'vip' THEN
                v_total_price := v_total_price + v_base_price * 1.2;
            WHEN 'couple' THEN
                v_total_price := v_total_price + v_base_price * 1.5;
            WHEN 'disabled' THEN
                v_total_price := v_total_price + v_base_price * 0.6;
            ELSE
                v_total_price := v_total_price + v_base_price;
        END CASE;
        
        v_count := v_count + 1;
    END LOOP;
    
    -- 如果座位数检查与输入不符
    IF v_count <> array_length(p_seat_ids, 1) THEN
        RETURN QUERY SELECT FALSE, '座位数不匹配', NULL::TEXT;
        RETURN;
    END IF;
    
    -- 生成订单号 (格式: TK + 年月日 + 4位序号, 例如 TK2305220001)
    v_order_date := to_char(v_now, 'YYMMDD');
    
    -- 获取当天的最大订单号
    SELECT COALESCE(MAX(SUBSTRING(id FROM 9 FOR 4)::INTEGER), 0) + 1 INTO v_order_num
    FROM orders
    WHERE SUBSTRING(id FROM 3 FOR 6) = v_order_date;
    
    -- 构建完整订单号
    v_order_id := 'TK' || v_order_date || LPAD(v_order_num::TEXT, 4, '0');
    
    -- 启动事务处理以确保数据一致性
    BEGIN
        -- 创建订单记录
        INSERT INTO orders (
            id,
            user_id,
            showtime_id,
            ticket_type,
            total_price,
            status,
            ticket_status,
            created_at
        ) VALUES (
            v_order_id,
            p_user_id,
            p_showtime_id,
            p_ticket_type::ticket_type,
            v_total_price,
            'pending',
            'unused',
            v_now
        );
        
        -- 占用选定的座位
        FOREACH v_seat_id IN ARRAY p_seat_ids
        LOOP
            -- 先更新座位状态为不可用
            UPDATE seats
            SET is_available = FALSE, updated_at = v_now
            WHERE id = v_seat_id;
            
            -- 创建订单座位关联
            INSERT INTO order_seats (order_id, seat_id, created_at)
            VALUES (v_order_id, v_seat_id, v_now);
        END LOOP;
        
        -- 如果提供了支付方式ID，立即创建支付记录
        IF p_payment_method_id IS NOT NULL THEN
            -- 插入支付记录
            INSERT INTO payments (
                order_id,
                payment_method_id,
                amount,
                status,
                created_at
            ) VALUES (
                v_order_id,
                p_payment_method_id,
                v_total_price,
                'success',
                v_now
            );
            
            -- 更新订单状态为已支付
            UPDATE orders
            SET status = 'paid', paid_at = v_now
            WHERE id = v_order_id;
        END IF;
        
        -- 提交事务
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            -- 发生错误时回滚事务
            ROLLBACK;
            RAISE;
    END;
    
    -- 返回成功消息
    RETURN QUERY SELECT TRUE, '订单创建成功', v_order_id;
    RETURN;

EXCEPTION
    WHEN OTHERS THEN
        -- 发生错误时返回错误消息
        RETURN QUERY SELECT FALSE, '订单创建失败: ' || SQLERRM, NULL::TEXT;
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为create_order函数授予执行权限
GRANT EXECUTE ON FUNCTION create_order(UUID, UUID, UUID[], TEXT, UUID) TO anon, authenticated, service_role;

-- 更新模式版本记录
INSERT INTO schema_migrations (version, description) 
VALUES ('20250424_fix_order_creation', '修复订单创建过程中订单记录未正确插入orders表的问题')
ON CONFLICT (version) DO NOTHING; 