-- 电影票务系统触发器
-- 适用于Supabase (PostgreSQL)

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