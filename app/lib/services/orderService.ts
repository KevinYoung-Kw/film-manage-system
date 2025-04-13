import supabase from './supabaseClient';
import { Order, OrderStatus, TicketStatus, TicketType } from '../types';
import { processImageUrl } from './dataService';
import { createClient } from '@supabase/supabase-js';
import { PaymentStatus } from './paymentService';

/**
 * 订单服务 - 处理订单管理相关功能
 */
export const OrderService = {
  /**
   * 获取所有订单
   * @returns 订单列表
   */
  getAllOrders: async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('获取所有订单失败: ' + error.message);
      }

      return data.map(order => ({
        id: order.id!,
        userId: order.user_id!,
        showtimeId: order.showtime_id!,
        seats: order.seat_locations || [],
        ticketType: order.ticket_type as TicketType,
        totalPrice: order.total_price || 0,
        status: order.status as OrderStatus,
        ticketStatus: order.ticket_status as TicketStatus || undefined,
        createdAt: new Date(order.created_at!),
        paidAt: order.paid_at ? new Date(order.paid_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        refundedAt: order.refunded_at ? new Date(order.refunded_at) : undefined,
        checkedAt: order.checked_at ? new Date(order.checked_at) : undefined,
        movieTitle: order.movie_title || undefined,
        theaterName: order.theater_name || undefined,
        moviePoster: order.movie_poster ? processImageUrl(order.movie_poster) : undefined,
        showtime: order.start_time ? new Date(order.start_time) : undefined
      }));
    } catch (error) {
      console.error('获取所有订单失败:', error);
      throw error;
    }
  },
  
  /**
   * 根据用户ID获取订单
   * @param userId 用户ID
   * @returns 该用户的订单列表
   */
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取用户(ID:${userId})订单失败: ${error.message}`);
      }

      return data.map(order => ({
        id: order.id!,
        userId: order.user_id!,
        showtimeId: order.showtime_id!,
        seats: order.seat_locations || [],
        ticketType: order.ticket_type as TicketType,
        totalPrice: order.total_price || 0,
        status: order.status as OrderStatus,
        ticketStatus: order.ticket_status as TicketStatus || undefined,
        createdAt: new Date(order.created_at!),
        paidAt: order.paid_at ? new Date(order.paid_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        refundedAt: order.refunded_at ? new Date(order.refunded_at) : undefined,
        checkedAt: order.checked_at ? new Date(order.checked_at) : undefined,
        movieTitle: order.movie_title || undefined,
        theaterName: order.theater_name || undefined,
        moviePoster: order.movie_poster ? processImageUrl(order.movie_poster) : undefined,
        showtime: order.start_time ? new Date(order.start_time) : undefined
      }));
    } catch (error) {
      console.error(`获取用户(ID:${userId})订单失败:`, error);
      throw error;
    }
  },
  
  /**
   * 根据ID获取订单
   * @param id 订单ID
   * @returns 订单信息
   */
  getOrderById: async (id: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`获取订单(ID:${id})失败: ${error.message}`);
      }

      return {
        id: data.id!,
        userId: data.user_id!,
        showtimeId: data.showtime_id!,
        seats: data.seat_locations || [],
        ticketType: data.ticket_type as TicketType,
        totalPrice: data.total_price || 0,
        status: data.status as OrderStatus,
        ticketStatus: data.ticket_status as TicketStatus || undefined,
        createdAt: new Date(data.created_at!),
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : undefined,
        refundedAt: data.refunded_at ? new Date(data.refunded_at) : undefined,
        checkedAt: data.checked_at ? new Date(data.checked_at) : undefined,
        movieTitle: data.movie_title || undefined,
        theaterName: data.theater_name || undefined,
        moviePoster: data.movie_poster ? processImageUrl(data.movie_poster) : undefined,
        showtime: data.start_time ? new Date(data.start_time) : undefined
      };
    } catch (error) {
      console.error(`获取订单(ID:${id})失败:`, error);
      return null;
    }
  },
  
  /**
   * 创建订单
   * @param order 订单信息
   * @param paymentMethodId 可选的支付方式ID，如果提供则自动支付
   * @returns 创建的订单
   */
  createOrder: async (order: {
    userId: string;
    showtimeId: string;
    seats: string[];
    ticketType: TicketType;
  }, paymentMethodId?: string): Promise<Order> => {
    try {
      console.log('开始创建订单:', order);
      
      // 调用存储过程创建订单
      const { data, error } = await supabase.rpc('create_order', {
        p_user_id: order.userId,
        p_showtime_id: order.showtimeId,
        p_seat_ids: order.seats,
        p_ticket_type: order.ticketType,
        p_payment_method_id: paymentMethodId
      });
      
      if (error || !data || data.length === 0 || !data[0].success) {
        console.error('创建订单失败:', error || (data && data[0] ? data[0].message : '未知错误'));
        throw new Error('创建订单失败: ' + (error?.message || (data && data[0] ? data[0].message : '未知错误')));
      }
      
      // 获取创建好的订单ID
      const orderId = data[0].order_id;
      console.log('订单创建成功:', orderId);
      
      // 如果提供了支付方式ID，但存储过程未处理支付（可能是因为存储过程不支持直接支付）
      if (paymentMethodId && orderId) {
        try {
          // 检查订单状态，如果仍然是pending则添加支付记录
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status, total_price')
            .eq('id', orderId)
            .single();
          
          if (!orderError && orderData && orderData.status === OrderStatus.PENDING) {
            console.log('订单需要手动添加支付记录');
            
            // 插入支付记录
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                order_id: orderId,
                payment_method_id: paymentMethodId,
                amount: orderData.total_price,
                status: 'completed'
              });
            
            if (paymentError) {
              console.error('创建支付记录失败:', paymentError);
            } else {
              // 更新订单状态
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: OrderStatus.PAID,
                  paid_at: new Date().toISOString()
                })
                .eq('id', orderId);
              
              if (updateError) {
                console.error('更新订单状态失败:', updateError);
              } else {
                console.log('订单手动支付成功');
              }
            }
          } else {
            console.log('订单状态不需要处理或已处理:', orderData?.status);
          }
        } catch (paymentError) {
          console.error('处理支付记录时发生错误:', paymentError);
          // 不抛出异常，因为订单已经创建成功
        }
      }
      
      // 获取创建好的订单
      const newOrder = await OrderService.getOrderById(orderId);
      
      if (!newOrder) {
        throw new Error('无法检索刚创建的订单');
      }
      
      return newOrder;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  },
  
  /**
   * 更新订单状态
   * @param orderId 订单ID
   * @param status 新状态
   * @returns 更新后的订单
   */
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order | null> => {
    try {
      // 构建更新数据
      const updateData: Record<string, any> = { status };
      
      // 根据状态添加时间戳
      switch (status) {
        case OrderStatus.PAID:
          updateData.paid_at = new Date().toISOString();
          break;
        case OrderStatus.CANCELLED:
          updateData.cancelled_at = new Date().toISOString();
          break;
        case OrderStatus.REFUNDED:
          updateData.refunded_at = new Date().toISOString();
          break;
      }
      
      // 更新订单
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);
      
      if (error) {
        throw new Error(`更新订单(ID:${orderId})状态失败: ${error.message}`);
      }
      
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`更新订单(ID:${orderId})状态失败:`, error);
      throw error;
    }
  },
  
  /**
   * 取消订单
   * @param orderId 订单ID
   * @param userId 用户ID
   * @returns 取消后的订单
   */
  cancelOrder: async (orderId: string, userId: string): Promise<Order | null> => {
    try {
      // 使用存储过程取消订单
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: userId
      });
      
      if (error || !data || data.length === 0 || !data[0].success) {
        throw new Error('取消订单失败: ' + (error?.message || (data && data[0] ? data[0].message : '未知错误')));
      }
      
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`取消订单(ID:${orderId})失败:`, error);
      throw error;
    }
  },
  
  /**
   * 支付订单
   * @param orderId 订单ID
   * @param paymentMethodId 支付方式ID
   * @returns 支付后的订单
   */
  payOrder: async (orderId: string, paymentMethodId: string): Promise<Order | null> => {
    try {
      console.log('开始支付订单:', orderId, '支付方式:', paymentMethodId);
      
      // 查询订单金额
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total_price, status')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('查询订单金额失败:', orderError);
        throw new Error(`查询订单金额失败: ${orderError.message}`);
      }
      
      // 检查订单状态
      if (order.status !== OrderStatus.PENDING) {
        console.error('只有待支付状态的订单可以支付');
        throw new Error('只有待支付状态的订单可以支付');
      }
      
      console.log('订单金额:', order.total_price);
      
      // 插入支付记录
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method_id: paymentMethodId,
          amount: order.total_price,
          status: 'completed'
        })
        .select()
        .single();
      
      if (paymentError) {
        console.error('创建支付记录失败:', paymentError);
        throw new Error(`创建支付记录失败: ${paymentError.message}`);
      }
      
      console.log('支付记录创建成功:', payment);
      
      // 支付记录创建成功后，手动更新订单状态为已支付
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: OrderStatus.PAID,
          paid_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (updateError) {
        console.error('更新订单状态失败:', updateError);
        throw new Error(`更新订单状态失败: ${updateError.message}`);
      }
      
      console.log('订单状态更新成功');
      
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`支付订单(ID:${orderId})失败:`, error);
      throw error;
    }
  },
  
  /**
   * 工作人员退款处理
   * @param orderId 订单ID
   * @param reason 退款原因
   * @param staffId 工作人员ID
   * @returns 退款结果
   */
  refundTicket: async (orderId: string, reason: string, staffId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 调用存储过程退款
      const { data, error } = await supabase.rpc('refund_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId,
        p_reason: reason
      });
      
      if (error) {
        throw new Error('退款失败: ' + error.message);
      }
      
      if (Array.isArray(data) && data.length > 0) {
        return { 
          success: Boolean(data[0].success), 
          message: data[0].message || '退款成功' 
        };
      }
      
      return { success: false, message: '退款操作没有返回结果' };
    } catch (error: any) {
      console.error('退款失败:', error);
      return { 
        success: false, 
        message: error.message || '退款失败' 
      };
    }
  },
  
  /**
   * 检票
   * @param orderId 订单ID
   * @param staffId 工作人员ID
   * @returns 检票结果
   */
  checkTicket: async (orderId: string, staffId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 调用存储过程检票
      const { data, error } = await supabase.rpc('check_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId
      });
      
      if (error) {
        throw new Error('检票失败: ' + error.message);
      }
      
      if (Array.isArray(data) && data.length > 0) {
        return { 
          success: Boolean(data[0].success), 
          message: data[0].message || '检票成功' 
        };
      }
      
      return { success: false, message: '检票操作没有返回结果' };
    } catch (error: any) {
      console.error('检票失败:', error);
      return { 
        success: false, 
        message: error.message || '检票失败' 
      };
    }
  },

  /**
   * 工作人员售票
   * @param staffId 工作人员ID
   * @param showtimeId 场次ID
   * @param seatIds 座位ID列表
   * @param ticketType 票型
   * @param paymentMethodId 支付方式ID
   * @returns 售票结果
   */
  sellTicket: async (
    staffId: string,
    showtimeId: string,
    seatIds: string[],
    ticketType: TicketType,
    paymentMethodId: string
  ): Promise<{ success: boolean; message: string; orderId?: string; totalPrice?: number }> => {
    try {
      console.log('开始工作人员售票:',
        '工作人员:', staffId,
        '场次:', showtimeId,
        '座位:', seatIds,
        '票型:', ticketType,
        '支付方式:', paymentMethodId
      );
      
      // 调用存储过程创建订单并直接支付
      const { data, error } = await supabase.rpc('sell_ticket', {
        p_staff_id: staffId,
        p_showtime_id: showtimeId,
        p_seat_ids: seatIds,
        p_ticket_type: ticketType,
        p_payment_method_id: paymentMethodId
      });
      
      if (error) {
        console.error('售票失败:', error);
        throw new Error('售票失败: ' + error.message);
      }
      
      if (!Array.isArray(data) || data.length === 0 || !data[0].success) {
        const errorMsg = (data && data[0]) ? data[0].message || '未知错误' : '售票操作没有返回结果';
        console.error('售票失败:', errorMsg);
        return { success: false, message: errorMsg };
      }
      
      const orderId = data[0].order_id;
      const totalPrice = data[0].total_price;
      
      console.log('售票成功:', orderId, '总价:', totalPrice);
      
      // 如果存储过程未自动处理支付，手动添加支付记录
      if (paymentMethodId && orderId) {
        try {
          // 检查订单状态，如果仍然是pending则添加支付记录
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();
          
          if (!orderError && orderData && orderData.status === OrderStatus.PENDING) {
            console.log('订单需要手动添加支付记录');
            
            // 插入支付记录
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                order_id: orderId,
                payment_method_id: paymentMethodId,
                amount: totalPrice,
                status: 'completed'
              });
            
            if (paymentError) {
              console.error('创建支付记录失败:', paymentError);
            } else {
              // 更新订单状态
              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: OrderStatus.PAID,
                  paid_at: new Date().toISOString()
                })
                .eq('id', orderId);
              
              if (updateError) {
                console.error('更新订单状态失败:', updateError);
              } else {
                console.log('订单手动支付成功');
              }
            }
          } else {
            console.log('订单状态不需要处理或已处理:', orderData?.status);
          }
        } catch (paymentError) {
          console.error('处理支付记录时发生错误:', paymentError);
          // 不抛出异常，因为订单已经创建成功
        }
      }
      
      return { 
        success: true, 
        message: data[0].message || '售票成功',
        orderId: orderId,
        totalPrice: totalPrice
      };
    } catch (error: any) {
      console.error('售票失败:', error);
      return { 
        success: false, 
        message: error.message || '售票失败' 
      };
    }
  }
}; 