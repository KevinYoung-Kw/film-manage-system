-- 电影票务系统存储过程
-- 适用于Supabase (PostgreSQL)

-- 1. 生成订单号存储过程
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_id VARCHAR(50);
    year_part VARCHAR(2);
    month_part VARCHAR(2);
    day_part VARCHAR(2);
    count_part VARCHAR(4);
    current_count INTEGER;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- 获取年月日部分
    year_part := RIGHT(EXTRACT(YEAR FROM today_date)::VARCHAR, 2);
    month_part := LPAD(EXTRACT(MONTH FROM today_date)::VARCHAR, 2, '0');
    day_part := LPAD(EXTRACT(DAY FROM today_date)::VARCHAR, 2, '0');
    
    -- 获取当日订单数量
    SELECT COUNT(*) INTO current_count
    FROM orders
    WHERE DATE(created_at) = today_date;
    
    -- 生成序号部分
    count_part := LPAD((current_count + 1)::VARCHAR, 4, '0');
    
    -- 组合订单号
    new_id := 'TK' || year_part || month_part || day_part || count_part;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建订单存储过程
CREATE OR REPLACE FUNCTION create_order(
    p_user_id UUID,
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_ticket_type VARCHAR,
    p_payment_method_id UUID DEFAULT NULL
)
RETURNS TABLE(
    order_id VARCHAR(50),
    message VARCHAR,
    success BOOLEAN
) AS $$
DECLARE
    v_order_id VARCHAR(50);
    v_total_price DECIMAL(10,2) := 0;
    v_seat_count INTEGER := array_length(p_seat_ids, 1);
    v_price DECIMAL(10,2);
    v_seat_record RECORD;
    v_message VARCHAR := 'Order created successfully';
    v_success BOOLEAN := TRUE;
BEGIN
    -- 检查座位是否可用
    FOR i IN 1..v_seat_count LOOP
        SELECT * INTO v_seat_record
        FROM seats
        WHERE id = p_seat_ids[i] AND showtime_id = p_showtime_id;
        
        IF NOT FOUND THEN
            RETURN QUERY SELECT NULL::VARCHAR(50), 'Seat not found'::VARCHAR, FALSE;
            RETURN;
        END IF;
        
        IF NOT v_seat_record.is_available THEN
            RETURN QUERY SELECT NULL::VARCHAR(50), 'Seat ' || v_seat_record.row_num || '-' || v_seat_record.column_num || ' is not available'::VARCHAR, FALSE;
            RETURN;
        END IF;
    END LOOP;
    
    -- 获取票价
    SELECT 
        CASE 
            WHEN p_ticket_type = 'normal' THEN price_normal
            WHEN p_ticket_type = 'student' THEN price_student
            WHEN p_ticket_type = 'senior' THEN price_senior
            WHEN p_ticket_type = 'child' THEN price_child
        END INTO v_price
    FROM showtimes
    WHERE id = p_showtime_id;
    
    -- 计算总价
    v_total_price := v_price * v_seat_count;
    
    -- 生成订单号
    v_order_id := generate_order_id();
    
    -- 创建订单
    INSERT INTO orders (
        id, 
        user_id, 
        showtime_id, 
        ticket_type, 
        total_price, 
        status,
        ticket_status
    ) VALUES (
        v_order_id,
        p_user_id,
        p_showtime_id,
        p_ticket_type::ticket_type,
        v_total_price,
        'pending',
        'unused'
    );
    
    -- 关联座位
    FOR i IN 1..v_seat_count LOOP
        INSERT INTO order_seats (order_id, seat_id)
        VALUES (v_order_id, p_seat_ids[i]);
        
        -- 更新座位状态为不可用
        UPDATE seats
        SET is_available = FALSE
        WHERE id = p_seat_ids[i];
    END LOOP;
    
    -- 如果提供了支付方式ID，则直接支付
    IF p_payment_method_id IS NOT NULL THEN
        INSERT INTO payments (
            order_id,
            payment_method_id,
            amount,
            status
        ) VALUES (
            v_order_id,
            p_payment_method_id,
            v_total_price,
            'success'
        );
        
        -- 更新订单状态为已支付
        UPDATE orders
        SET status = 'paid', paid_at = CURRENT_TIMESTAMP
        WHERE id = v_order_id;
        
        v_message := 'Order created and paid successfully';
    END IF;
    
    RETURN QUERY SELECT v_order_id, v_message, v_success;
END;
$$ LANGUAGE plpgsql;

-- 3. 取消订单存储过程
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id VARCHAR(50),
    p_user_id UUID
)
RETURNS TABLE(
    message VARCHAR,
    success BOOLEAN
) AS $$
DECLARE
    v_order RECORD;
    v_showtime RECORD;
    v_seat_id UUID;
    v_refund_amount DECIMAL(10,2);
    v_allowed_to_cancel BOOLEAN := FALSE;
    v_cutoff_time INTERVAL := '2 hours';
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'Order not found'::VARCHAR, FALSE;
        RETURN;
    END IF;
    
    -- 检查是否是订单所有者或管理员
    IF v_order.user_id != p_user_id THEN
        -- 检查用户是否是管理员或工作人员
        IF NOT EXISTS (
            SELECT 1 FROM users
            WHERE id = p_user_id AND (role = 'admin' OR role = 'staff')
        ) THEN
            RETURN QUERY SELECT 'Not authorized to cancel this order'::VARCHAR, FALSE;
            RETURN;
        END IF;
    END IF;
    
    -- 检查订单状态
    IF v_order.status != 'pending' AND v_order.status != 'paid' THEN
        RETURN QUERY SELECT 'Order cannot be cancelled in current status'::VARCHAR, FALSE;
        RETURN;
    END IF;
    
    -- 获取场次信息
    SELECT * INTO v_showtime
    FROM showtimes
    WHERE id = v_order.showtime_id;
    
    -- 计算退款金额（根据取消时间）
    IF v_order.status = 'paid' THEN
        IF v_showtime.start_time - CURRENT_TIMESTAMP > v_cutoff_time THEN
            -- 距离开场超过2小时，全额退款
            v_refund_amount := v_order.total_price;
            v_allowed_to_cancel := TRUE;
        ELSIF v_showtime.start_time - CURRENT_TIMESTAMP > '30 minutes'::INTERVAL THEN
            -- 距离开场30分钟至2小时，退款70%
            v_refund_amount := v_order.total_price * 0.7;
            v_allowed_to_cancel := TRUE;
        ELSIF v_showtime.start_time > CURRENT_TIMESTAMP THEN
            -- 距离开场不到30分钟，退款50%
            v_refund_amount := v_order.total_price * 0.5;
            v_allowed_to_cancel := TRUE;
        ELSE
            -- 已经开场，不允许退款
            RETURN QUERY SELECT 'Cannot cancel order after movie has started'::VARCHAR, FALSE;
            RETURN;
        END IF;
    ELSE
        -- 未支付订单可以直接取消
        v_allowed_to_cancel := TRUE;
        v_refund_amount := 0;
    END IF;
    
    IF v_allowed_to_cancel THEN
        -- 更新订单状态
        UPDATE orders
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;
        
        -- 释放座位
        FOR v_seat_id IN (
            SELECT seat_id FROM order_seats WHERE order_id = p_order_id
        ) LOOP
            UPDATE seats
            SET is_available = TRUE
            WHERE id = v_seat_id;
        END LOOP;
        
        -- 如果订单已支付，创建退款记录
        IF v_order.status = 'paid' AND v_refund_amount > 0 THEN
            -- 获取原支付方式
            INSERT INTO payments (
                order_id,
                payment_method_id,
                amount,
                status
            )
            SELECT 
                p_order_id,
                payment_method_id,
                -v_refund_amount,
                'refunded'
            FROM payments
            WHERE order_id = p_order_id AND status = 'success'
            LIMIT 1;
            
            RETURN QUERY SELECT 'Order cancelled with refund amount: ' || v_refund_amount::VARCHAR, TRUE;
        ELSE
            RETURN QUERY SELECT 'Order cancelled successfully'::VARCHAR, TRUE;
        END IF;
    ELSE
        RETURN QUERY SELECT 'Cannot cancel order due to policy restrictions'::VARCHAR, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 检票存储过程
CREATE OR REPLACE FUNCTION check_ticket(
    p_order_id VARCHAR(50),
    p_staff_id UUID
)
RETURNS TABLE(
    message VARCHAR,
    success BOOLEAN
) AS $$
DECLARE
    v_order RECORD;
    v_showtime RECORD;
    v_time_diff INTERVAL;
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'Order not found'::VARCHAR, FALSE;
        RETURN;
    END IF;
    
    -- 检查订单状态
    IF v_order.status != 'paid' THEN
        RETURN QUERY SELECT 'Order not paid, cannot check ticket'::VARCHAR, FALSE;
        RETURN;
    END IF;
    
    -- 检查是否已经检票
    IF v_order.ticket_status = 'used' THEN
        RETURN QUERY SELECT 'Ticket already used'::VARCHAR, FALSE;
        RETURN;
    END IF;
    
    -- 获取场次信息
    SELECT * INTO v_showtime
    FROM showtimes
    WHERE id = v_order.showtime_id;
    
    -- 计算当前时间与电影开始时间的差距
    v_time_diff := v_showtime.start_time - CURRENT_TIMESTAMP;
    
    -- 更新订单状态
    UPDATE orders
    SET 
        ticket_status = 'used',
        checked_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;
    
    -- 记录操作日志
    INSERT INTO staff_operations (
        staff_id,
        order_id,
        showtime_id,
        operation_type,
        details
    ) VALUES (
        p_staff_id,
        p_order_id,
        v_order.showtime_id,
        'check',
        jsonb_build_object(
            'check_time', CURRENT_TIMESTAMP,
            'time_to_movie', v_time_diff::TEXT
        )
    );
    
    -- 返回信息根据检票时间有所不同
    IF v_time_diff < '0 minutes'::INTERVAL AND v_time_diff > '-30 minutes'::INTERVAL THEN
        RETURN QUERY SELECT 'Ticket checked successfully. Movie has started, please enter quietly.'::VARCHAR, TRUE;
    ELSIF v_time_diff < '0 minutes'::INTERVAL THEN
        RETURN QUERY SELECT 'Ticket checked successfully. Movie started ' || ABS(EXTRACT(EPOCH FROM v_time_diff)/60)::INTEGER || ' minutes ago.'::VARCHAR, TRUE;
    ELSE
        RETURN QUERY SELECT 'Ticket checked successfully. Movie starts in ' || (EXTRACT(EPOCH FROM v_time_diff)/60)::INTEGER || ' minutes.'::VARCHAR, TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 退票存储过程
CREATE OR REPLACE FUNCTION refund_ticket(
    p_order_id VARCHAR(50),
    p_staff_id UUID,
    p_reason VARCHAR
)
RETURNS TABLE(
    message VARCHAR,
    success BOOLEAN,
    refund_amount DECIMAL(10,2)
) AS $$
DECLARE
    v_order RECORD;
    v_showtime RECORD;
    v_seat_id UUID;
    v_refund_amount DECIMAL(10,2);
    v_time_diff INTERVAL;
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'Order not found'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 检查订单状态
    IF v_order.status != 'paid' THEN
        RETURN QUERY SELECT 'Order not paid, cannot refund'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 检查是否已经检票
    IF v_order.ticket_status = 'used' THEN
        RETURN QUERY SELECT 'Ticket already used, cannot refund'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 获取场次信息
    SELECT * INTO v_showtime
    FROM showtimes
    WHERE id = v_order.showtime_id;
    
    -- 计算当前时间与电影开始时间的差距
    v_time_diff := v_showtime.start_time - CURRENT_TIMESTAMP;
    
    -- 根据时间差确定退款金额
    IF v_time_diff > '2 hours'::INTERVAL THEN
        -- 距离开场超过2小时，全额退款
        v_refund_amount := v_order.total_price;
    ELSIF v_time_diff > '30 minutes'::INTERVAL THEN
        -- 距离开场30分钟至2小时，退款70%
        v_refund_amount := v_order.total_price * 0.7;
    ELSIF v_time_diff > '0 minutes'::INTERVAL THEN
        -- 距离开场不到30分钟，退款50%
        v_refund_amount := v_order.total_price * 0.5;
    ELSE
        -- 已经开场，不允许退款
        RETURN QUERY SELECT 'Cannot refund after movie has started'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 更新订单状态
    UPDATE orders
    SET 
        status = 'refunded',
        refunded_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;
    
    -- 释放座位
    FOR v_seat_id IN (
        SELECT seat_id FROM order_seats WHERE order_id = p_order_id
    ) LOOP
        UPDATE seats
        SET is_available = TRUE
        WHERE id = v_seat_id;
    END LOOP;
    
    -- 创建退款记录
    INSERT INTO payments (
        order_id,
        payment_method_id,
        amount,
        status
    )
    SELECT 
        p_order_id,
        payment_method_id,
        -v_refund_amount,
        'refunded'
    FROM payments
    WHERE order_id = p_order_id AND status = 'success'
    LIMIT 1;
    
    -- 记录操作日志
    INSERT INTO staff_operations (
        staff_id,
        order_id,
        showtime_id,
        operation_type,
        details
    ) VALUES (
        p_staff_id,
        p_order_id,
        v_order.showtime_id,
        'refund',
        jsonb_build_object(
            'refund_amount', v_refund_amount,
            'reason', p_reason,
            'time_to_movie', v_time_diff::TEXT
        )
    );
    
    RETURN QUERY SELECT 'Refund processed successfully. Amount: ' || v_refund_amount::VARCHAR, TRUE, v_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- 6. 售票存储过程
CREATE OR REPLACE FUNCTION sell_ticket(
    p_staff_id UUID,
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_ticket_type VARCHAR,
    p_payment_method_id UUID
)
RETURNS TABLE(
    order_id VARCHAR(50),
    message VARCHAR,
    success BOOLEAN,
    total_price DECIMAL(10,2)
) AS $$
DECLARE
    v_order_id VARCHAR(50);
    v_message VARCHAR;
    v_success BOOLEAN;
    v_total_price DECIMAL(10,2);
    v_showtime RECORD;
    v_temp_user_id UUID;
BEGIN
    -- 获取场次信息
    SELECT * INTO v_showtime
    FROM showtimes
    WHERE id = p_showtime_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::VARCHAR(50), 'Showtime not found'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 检查场次是否已开始
    IF v_showtime.start_time < CURRENT_TIMESTAMP THEN
        RETURN QUERY SELECT NULL::VARCHAR(50), 'Cannot sell tickets for already started movies'::VARCHAR, FALSE, 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- 为线下顾客创建临时用户ID
    v_temp_user_id := uuid_generate_v4();
    
    -- 创建订单 (直接传入支付方式，创建已支付订单)
    SELECT * INTO v_order_id, v_message, v_success
    FROM create_order(v_temp_user_id, p_showtime_id, p_seat_ids, p_ticket_type, p_payment_method_id);
    
    IF v_success THEN
        -- 获取订单金额
        SELECT total_price INTO v_total_price
        FROM orders
        WHERE id = v_order_id;
        
        -- 记录售票操作
        INSERT INTO staff_operations (
            staff_id,
            order_id,
            showtime_id,
            operation_type,
            details
        ) VALUES (
            p_staff_id,
            v_order_id,
            p_showtime_id,
            'sell',
            jsonb_build_object(
                'ticket_type', p_ticket_type,
                'seat_count', array_length(p_seat_ids, 1),
                'total_price', v_total_price
            )
        );
        
        RETURN QUERY SELECT v_order_id, 'Tickets sold successfully'::VARCHAR, TRUE, v_total_price;
    ELSE
        RETURN QUERY SELECT NULL::VARCHAR(50), v_message, FALSE, 0::DECIMAL(10,2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. 为场次生成座位存储过程
CREATE OR REPLACE FUNCTION generate_seats_for_showtime(
    p_showtime_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_theater RECORD;
    v_layout JSONB;
    v_row INTEGER;
    v_col INTEGER;
    v_seat_type seat_type;
    v_seats_created INTEGER := 0;
BEGIN
    -- 获取场次对应的影厅信息
    SELECT t.* INTO v_theater
    FROM showtimes s
    JOIN theaters t ON s.theater_id = t.id
    WHERE s.id = p_showtime_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 获取影厅座位布局
    SELECT layout INTO v_layout
    FROM theater_seat_layouts
    WHERE theater_id = v_theater.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 生成座位
    FOR v_row IN 1..v_theater.rows LOOP
        FOR v_col IN 1..v_theater.columns LOOP
            -- 确定座位类型
            IF v_layout IS NOT NULL AND v_layout->(v_row-1)->(v_col-1) IS NOT NULL THEN
                -- 从布局中获取座位类型
                DECLARE
                    layout_type TEXT := v_layout->(v_row-1)->(v_col-1)::TEXT;
                BEGIN
                    -- 移除JSON字符串的引号
                    layout_type := REPLACE(layout_type, '"', '');
                    
                    IF layout_type = 'empty' THEN
                        -- 跳过空位置
                        CONTINUE;
                    ELSIF layout_type IN ('normal', 'vip', 'couple', 'disabled') THEN
                        v_seat_type := layout_type::seat_type;
                    ELSE
                        v_seat_type := 'normal'::seat_type;
                    END IF;
                END;
            ELSE
                -- 使用默认座位类型逻辑
                IF (v_row = 1 AND v_col = 1) OR (v_row = v_theater.rows AND v_col = v_theater.columns) THEN
                    v_seat_type := 'couple'::seat_type;
                ELSIF v_row = FLOOR(v_theater.rows / 2) OR v_row = FLOOR(v_theater.rows / 2) + 1 THEN
                    v_seat_type := 'vip'::seat_type;
                ELSIF v_row = v_theater.rows AND v_col = 1 THEN
                    v_seat_type := 'disabled'::seat_type;
                ELSE
                    v_seat_type := 'normal'::seat_type;
                END IF;
            END IF;
            
            -- 插入座位
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
            
            v_seats_created := v_seats_created + 1;
        END LOOP;
    END LOOP;
    
    RETURN v_seats_created;
END;
$$ LANGUAGE plpgsql; 