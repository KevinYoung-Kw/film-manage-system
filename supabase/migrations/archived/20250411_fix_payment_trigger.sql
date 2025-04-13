-- 修复支付成功后更新订单状态的触发器
CREATE OR REPLACE FUNCTION after_payment_success()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理支付成功的新记录 (同时支持'success'和'completed'状态)
    IF NEW.status = 'success' OR NEW.status = 'completed' THEN
        -- 更新订单状态为已支付
        UPDATE orders
        SET status = 'paid', paid_at = NEW.created_at
        WHERE id = NEW.order_id AND status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器并重新创建，确保同时处理插入和更新操作
DROP TRIGGER IF EXISTS update_order_after_payment ON payments;

CREATE TRIGGER update_order_after_payment
AFTER INSERT ON payments
FOR EACH ROW EXECUTE PROCEDURE after_payment_success();

-- 添加更新支付记录时的触发器
CREATE TRIGGER update_order_after_payment_update
AFTER UPDATE OF status ON payments
FOR EACH ROW EXECUTE PROCEDURE after_payment_success(); 