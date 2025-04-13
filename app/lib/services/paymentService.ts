import supabase from './supabaseClient';

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  CASH = 'cash',
  CARD = 'card'
}

/**
 * 支付状态枚举
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * 支付服务 - 处理支付相关功能
 */
export const PaymentService = {
  /**
   * 创建支付记录
   * @param orderId 订单ID
   * @param amount 支付金额
   * @param method 支付方式
   * @returns 支付记录
   */
  createPayment: async (
    orderId: string,
    amount: number,
    method: PaymentMethod
  ): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          order_id: orderId,
          amount,
          method,
          status: PaymentStatus.PENDING
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建支付记录失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('创建支付记录失败:', error);
      throw error;
    }
  },

  /**
   * 处理支付
   * @param paymentId 支付ID
   * @returns 更新后的支付记录
   */
  processPayment: async (paymentId: string): Promise<any> => {
    try {
      // 模拟支付处理
      const { data, error } = await supabase
        .from('payments')
        .update({ status: PaymentStatus.PROCESSING })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error('处理支付失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('处理支付失败:', error);
      throw error;
    }
  },

  /**
   * 完成支付
   * @param paymentId 支付ID
   * @returns 更新后的支付记录
   */
  completePayment: async (paymentId: string): Promise<any> => {
    try {
      // 模拟支付完成
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: PaymentStatus.COMPLETED,
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error('完成支付失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined
      };
    } catch (error) {
      console.error('完成支付失败:', error);
      throw error;
    }
  },

  /**
   * 支付失败
   * @param paymentId 支付ID
   * @param reason 失败原因
   * @returns 更新后的支付记录
   */
  failPayment: async (paymentId: string, reason: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: PaymentStatus.FAILED,
          failure_reason: reason
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error('更新支付失败状态失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        failureReason: data.failure_reason,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('更新支付失败状态失败:', error);
      throw error;
    }
  },

  /**
   * 退款
   * @param paymentId 支付ID
   * @param reason 退款原因
   * @returns 更新后的支付记录
   */
  refundPayment: async (paymentId: string, reason: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: PaymentStatus.REFUNDED,
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error('退款失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        refundReason: data.refund_reason,
        createdAt: new Date(data.created_at),
        refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined
      };
    } catch (error) {
      console.error('退款失败:', error);
      throw error;
    }
  },

  /**
   * 获取支付记录
   * @param orderId 订单ID
   * @returns 支付记录
   */
  getPaymentByOrderId: async (orderId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // 未找到记录
        }
        throw new Error('获取支付记录失败: ' + error.message);
      }

      return {
        id: data.id,
        orderId: data.order_id,
        amount: data.amount,
        method: data.method,
        status: data.status,
        failureReason: data.failure_reason,
        refundReason: data.refund_reason,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined
      };
    } catch (error) {
      console.error('获取支付记录失败:', error);
      return null;
    }
  }
}; 