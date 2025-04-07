/**
 * 支付服务模块，提供支付相关的API
 */

import { OrderStatus } from '../types';

// 支付方式
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card'
}

// 支付状态
export enum PaymentStatus {
  PENDING = 'pending',     // 待支付
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',     // 支付成功
  FAILED = 'failed'        // 支付失败
}

// 支付结果
export interface PaymentResult {
  status: PaymentStatus;
  orderId?: string;
  message?: string;
  transactionId?: string;
  paidAt?: Date;
}

// 支付请求参数
export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * 支付服务
 */
export const PaymentService = {
  /**
   * 模拟发起支付请求
   * @param request 支付请求参数
   * @returns 支付结果
   */
  initiatePayment: async (request: PaymentRequest): Promise<PaymentResult> => {
    // 模拟支付过程
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟成功率95%
        const isSuccess = Math.random() < 0.95;
        
        if (isSuccess) {
          resolve({
            status: PaymentStatus.SUCCESS,
            orderId: request.orderId,
            message: '支付成功',
            transactionId: `T${Date.now()}`,
            paidAt: new Date()
          });
        } else {
          resolve({
            status: PaymentStatus.FAILED,
            orderId: request.orderId,
            message: '支付失败，请稍后重试'
          });
        }
      }, 1500); // 模拟网络延迟
    });
  },
  
  /**
   * 获取支付状态
   * @param orderId 订单ID
   * @returns 支付状态
   */
  getPaymentStatus: async (orderId: string): Promise<PaymentStatus> => {
    // 这里应该是从本地存储或API获取支付状态
    // 模拟实现，随机返回支付状态
    const statuses = [
      PaymentStatus.PENDING, 
      PaymentStatus.PROCESSING,
      PaymentStatus.SUCCESS
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  },
  
  /**
   * 保存支付结果到本地
   * @param result 支付结果
   */
  savePaymentResult: (result: PaymentResult): void => {
    // 保存到localStorage
    const paymentRecord = {
      ...result,
      savedAt: new Date().toISOString()
    };
    
    // 获取现有支付记录
    const paymentsJson = localStorage.getItem('payments') || '[]';
    const payments = JSON.parse(paymentsJson);
    
    // 添加新记录
    payments.unshift(paymentRecord);
    
    // 保存回本地存储
    localStorage.setItem('payments', JSON.stringify(payments));
    
    // 如果支付成功，更新订单状态
    if (result.status === PaymentStatus.SUCCESS && result.orderId) {
      // 获取订单
      const ordersJson = localStorage.getItem('orders') || '[]';
      const orders = JSON.parse(ordersJson);
      
      // 更新对应订单状态
      const updatedOrders = orders.map((order: any) => {
        if (order.id === result.orderId) {
          return {
            ...order,
            status: OrderStatus.PAID,
            paidAt: new Date().toISOString(),
            transactionId: result.transactionId
          };
        }
        return order;
      });
      
      // 保存更新后的订单
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    }
  }
}; 