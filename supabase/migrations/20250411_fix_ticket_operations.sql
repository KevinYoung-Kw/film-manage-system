-- 20250411_fix_ticket_operations.sql
-- 此迁移文件用于修复工作人员检票和退票功能

-- 删除所有可能的check_ticket函数版本，避免冲突
DROP FUNCTION IF EXISTS public.check_ticket(character varying, character varying);
DROP FUNCTION IF EXISTS public.check_ticket(text, text);
DROP FUNCTION IF EXISTS public.check_ticket(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_ticket(text, uuid);
DROP FUNCTION IF EXISTS public.check_ticket(uuid, text);

-- 重新创建检票功能
CREATE OR REPLACE FUNCTION check_ticket(
  p_order_id TEXT,
  p_staff_id UUID
) 
RETURNS TABLE(success BOOLEAN, message TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
  v_is_admin BOOLEAN;
  v_is_staff BOOLEAN;
BEGIN
  -- 检查权限
  SELECT auth.get_user_role() = 'admin' INTO v_is_admin;
  SELECT auth.get_user_role() = 'staff' INTO v_is_staff;
  
  -- 检查是否有权限执行此操作
  IF NOT (v_is_admin OR v_is_staff) THEN
    RETURN QUERY SELECT false AS success, '无权进行检票操作' AS message;
    RETURN;
  END IF;

  -- 检查订单是否存在
  SELECT * INTO v_order FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS success, '订单不存在' AS message;
    RETURN;
  END IF;
  
  -- 检查订单状态是否为已支付
  IF v_order.status != 'paid' THEN
    RETURN QUERY SELECT false AS success, '只有已支付的订单可以检票' AS message;
    RETURN;
  END IF;
  
  -- 检查是否已经检票
  IF v_order.checked_at IS NOT NULL THEN
    RETURN QUERY SELECT false AS success, '订单已经检票' AS message;
    RETURN;
  END IF;
  
  -- 更新订单状态为已检票
  UPDATE orders
  SET ticket_status = 'used',
      checked_at = v_now
  WHERE id = p_order_id;
  
  -- 记录工作人员操作
  INSERT INTO staff_operations (
    staff_id,
    operation_type,
    order_id,
    details
  ) VALUES (
    p_staff_id,
    'check',
    p_order_id,
    jsonb_build_object(
      'checked_at', v_now
    )
  );
  
  -- 返回成功
  RETURN QUERY SELECT true AS success, '检票成功' AS message;
EXCEPTION WHEN OTHERS THEN
  -- 如果发生错误
  RETURN QUERY SELECT false AS success, '检票失败: ' || SQLERRM AS message;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION check_ticket(TEXT, UUID) TO authenticated, service_role;

-- 删除所有可能的refund_ticket函数版本，避免冲突
DROP FUNCTION IF EXISTS public.refund_ticket(character varying, character varying, character varying);
DROP FUNCTION IF EXISTS public.refund_ticket(text, text, text);
DROP FUNCTION IF EXISTS public.refund_ticket(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.refund_ticket(text, uuid, text);
DROP FUNCTION IF EXISTS public.refund_ticket(uuid, text, text);

-- 重新创建退票功能
CREATE OR REPLACE FUNCTION refund_ticket(
  p_order_id TEXT,
  p_staff_id UUID,
  p_reason TEXT
) 
RETURNS TABLE(success BOOLEAN, message TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_showtime RECORD;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
  v_fee_percentage DECIMAL(5,2) := 0;
  v_refund_amount DECIMAL(10,2);
  v_payment RECORD;
  v_is_admin BOOLEAN;
  v_is_staff BOOLEAN;
BEGIN
  -- 检查权限
  SELECT auth.get_user_role() = 'admin' INTO v_is_admin;
  SELECT auth.get_user_role() = 'staff' INTO v_is_staff;
  
  -- 检查是否有权限执行此操作
  IF NOT (v_is_admin OR v_is_staff) THEN
    RETURN QUERY SELECT false AS success, '无权进行退票操作' AS message;
    RETURN;
  END IF;

  -- 检查订单是否存在
  SELECT * INTO v_order FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS success, '订单不存在' AS message;
    RETURN;
  END IF;
  
  -- 检查订单状态是否为已支付
  IF v_order.status != 'paid' THEN
    RETURN QUERY SELECT false AS success, '只有已支付的订单可以退款' AS message;
    RETURN;
  END IF;
  
  -- 检查是否已经退款
  IF v_order.refunded_at IS NOT NULL THEN
    RETURN QUERY SELECT false AS success, '订单已经退款' AS message;
    RETURN;
  END IF;
  
  -- 检查是否已经检票
  IF v_order.checked_at IS NOT NULL THEN
    RETURN QUERY SELECT false AS success, '已检票的订单不能退款' AS message;
    RETURN;
  END IF;
  
  -- 检查场次信息
  SELECT * INTO v_showtime FROM showtimes
  WHERE id = v_order.showtime_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false AS success, '场次信息不存在' AS message;
    RETURN;
  END IF;
  
  -- 检查是否已经开场
  IF v_showtime.start_time <= v_now THEN
    RETURN QUERY SELECT false AS success, '电影已开场，不能退款' AS message;
    RETURN;
  END IF;
  
  -- 计算退款手续费
  IF v_showtime.start_time - v_now <= INTERVAL '30 minutes' THEN
    -- 开场前30分钟内不支持退票
    RETURN QUERY SELECT false AS success, '开场前30分钟内不支持退票' AS message;
    RETURN;
  ELSIF v_showtime.start_time - v_now <= INTERVAL '2 hours' THEN
    -- 开场前30分钟至2小时收取30%手续费
    v_fee_percentage := 0.3;
  ELSE
    -- 开场前2小时以上收取10%手续费
    v_fee_percentage := 0.1;
  END IF;
  
  -- 计算退款金额
  v_refund_amount := v_order.total_price * (1 - v_fee_percentage);
  
  -- 获取支付记录
  SELECT * INTO v_payment FROM payments
  WHERE order_id = p_order_id AND status = 'completed'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 如果没有找到支付记录，也允许退款，但记录相关信息
  IF NOT FOUND THEN
    RAISE NOTICE '找不到支付记录，将仅更新订单状态';
  END IF;
  
  -- 开始事务处理
  BEGIN
    -- 1. 更新订单状态为已退款
    UPDATE orders
    SET status = 'refunded',
        refunded_at = v_now
    WHERE id = p_order_id;
    
    -- 2. 添加退款记录（如果找到了原支付记录）
    IF v_payment.id IS NOT NULL THEN
      INSERT INTO payments (
        order_id,
        payment_method_id,
        amount,
        status,
        refund_reason,
        refunded_at,
        reference_payment_id
      ) VALUES (
        p_order_id,
        v_payment.payment_method_id,
        v_refund_amount * -1,  -- 负数表示退款
        'refunded',
        p_reason,
        v_now,
        v_payment.id
      );
    ELSE
      -- 如果没有找到原支付记录，创建一个简单的退款记录
      -- 查询默认支付方式，如果没有则用现金方式
      DECLARE
        v_default_payment_method_id UUID;
      BEGIN
        SELECT id INTO v_default_payment_method_id
        FROM payment_methods
        WHERE code = 'cash'
        LIMIT 1;
        
        IF v_default_payment_method_id IS NULL THEN
          -- 如果找不到默认支付方式，创建一个现金支付方式
          INSERT INTO payment_methods(name, code, description)
          VALUES ('现金', 'cash', '现场现金支付')
          RETURNING id INTO v_default_payment_method_id;
        END IF;
        
        -- 创建退款记录
        INSERT INTO payments (
          order_id,
          payment_method_id,
          amount,
          status,
          refund_reason,
          refunded_at
        ) VALUES (
          p_order_id,
          v_default_payment_method_id,
          v_refund_amount * -1,  -- 负数表示退款
          'refunded',
          p_reason,
          v_now
        );
      END;
    END IF;
    
    -- 3. 记录工作人员操作
    INSERT INTO staff_operations (
      staff_id,
      operation_type,
      order_id,
      details
    ) VALUES (
      p_staff_id,
      'refund',
      p_order_id,
      jsonb_build_object(
        'reason', p_reason,
        'refund_amount', v_refund_amount,
        'fee_percentage', v_fee_percentage
      )
    );
    
    -- 4. 恢复座位状态
    UPDATE seats
    SET is_available = true
    WHERE id IN (
      SELECT seat_id FROM order_seats WHERE order_id = p_order_id
    );
    
    -- 返回成功
    RETURN QUERY SELECT true AS success, '退款成功，退款金额: ' || v_refund_amount::TEXT AS message;
  EXCEPTION WHEN OTHERS THEN
    -- 如果发生错误，回滚事务
    RAISE;
    RETURN QUERY SELECT false AS success, '退款失败: ' || SQLERRM AS message;
  END;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION refund_ticket(TEXT, UUID, TEXT) TO authenticated, service_role;

-- 添加触发器或函数，在支付完成后自动更新订单状态
CREATE OR REPLACE FUNCTION update_order_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是新增支付记录并且状态为completed
  IF NEW.status = 'completed' THEN
    -- 更新对应订单为已支付状态
    UPDATE orders
    SET status = 'paid',
        paid_at = CURRENT_TIMESTAMP
    WHERE id = NEW.order_id 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果触发器不存在，创建触发器
DROP TRIGGER IF EXISTS payments_update_order_status ON payments;
CREATE TRIGGER payments_update_order_status
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_order_status_on_payment();

-- 检查payments表结构，添加必要的列
DO $$
BEGIN
  -- 添加status列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' 
                  AND column_name = 'status') THEN
    ALTER TABLE payments ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';
  END IF;
  
  -- 添加refund_reason列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' 
                  AND column_name = 'refund_reason') THEN
    ALTER TABLE payments ADD COLUMN refund_reason TEXT;
  END IF;
  
  -- 添加refunded_at列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' 
                  AND column_name = 'refunded_at') THEN
    ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- 添加reference_payment_id列（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' 
                  AND column_name = 'reference_payment_id') THEN
    ALTER TABLE payments ADD COLUMN reference_payment_id UUID REFERENCES payments(id);
  END IF;
END
$$; 