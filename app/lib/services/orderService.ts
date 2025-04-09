import supabase from './supabaseClient';
import { Order, OrderStatus, TicketStatus, TicketType } from '../types';
import { OrderFallbackService } from './fallbackService';
import { mockOrders } from '../mockData';
import { processImageUrl } from './dataService';

// 扩展的订单接口，包含关联信息
export interface ExtendedOrder extends Order {
  // Order接口已经包含了这些字段
}

// 订单相关服务
export const OrderService = {
  // 获取所有订单
  getAllOrders: async (): Promise<ExtendedOrder[]> => {
    try {
      // 使用视图获取订单数据，这样可以包含关联信息
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取所有订单失败:', error);
        return OrderFallbackService.getAllOrders();
      }

      // 转换数据结构
      return data.map(order => {
        const orderObj: ExtendedOrder = {
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
          // 添加关联数据，处理null值
          movieTitle: order.movie_title || undefined,
          theaterName: order.theater_name || undefined,
          moviePoster: order.movie_poster ? processImageUrl(order.movie_poster) : undefined,
          showtime: order.start_time ? new Date(order.start_time) : undefined
        };
        return orderObj;
      });
    } catch (error) {
      console.error('获取所有订单失败:', error);
      return OrderFallbackService.getAllOrders();
    }
  },
  
  // 根据用户ID获取订单
  getOrdersByUserId: async (userId: string): Promise<ExtendedOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`获取用户(ID:${userId})订单失败:`, error);
        return OrderFallbackService.getOrdersByUserId(userId);
      }

      // 转换数据结构
      return data.map(order => {
        const orderObj: ExtendedOrder = {
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
          // 添加关联数据，处理null值
          movieTitle: order.movie_title || undefined,
          theaterName: order.theater_name || undefined,
          moviePoster: order.movie_poster ? processImageUrl(order.movie_poster) : undefined,
          showtime: order.start_time ? new Date(order.start_time) : undefined
        };
        return orderObj;
      });
    } catch (error) {
      console.error(`获取用户(ID:${userId})订单失败:`, error);
      return OrderFallbackService.getOrdersByUserId(userId);
    }
  },
  
  // 根据ID获取订单
  getOrderById: async (id: string): Promise<ExtendedOrder | null> => {
    try {
      const { data, error } = await supabase
        .from('vw_user_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`获取订单(ID:${id})失败:`, error);
        const orders = await OrderFallbackService.getAllOrders();
        const order = orders.find(order => order.id === id);
        return order || null;
      }

      const orderObj: ExtendedOrder = {
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
        // 添加关联数据，处理null值
        movieTitle: data.movie_title || undefined,
        theaterName: data.theater_name || undefined,
        moviePoster: data.movie_poster ? processImageUrl(data.movie_poster) : undefined,
        showtime: data.start_time ? new Date(data.start_time) : undefined
      };
      
      return orderObj;
    } catch (error) {
      console.error(`获取订单(ID:${id})失败:`, error);
      const orders = await OrderFallbackService.getAllOrders();
      const order = orders.find(order => order.id === id);
      return order || null;
    }
  },
  
  // 创建订单
  createOrder: async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    try {
      // 尝试使用存储过程创建订单
      try {
        const { data, error } = await supabase.rpc('create_order', {
          p_user_id: order.userId,
          p_showtime_id: order.showtimeId,
          p_seat_ids: order.seats,
          p_ticket_type: order.ticketType
        });
        
        if (!error && data && data[0] && data[0].success) {
          // 获取创建好的订单
          const orderId = data[0].order_id;
          const newOrder = await OrderService.getOrderById(orderId);
          
          if (!newOrder) {
            throw new Error('无法检索刚创建的订单');
          }
          
          return newOrder;
        }
      } catch (rpcError) {
        console.warn('RPC调用create_order失败，尝试直接插入订单:', rpcError);
        // 如果RPC失败，继续执行插入操作
      }
      
      // 如果RPC失败，直接插入订单记录
      // 先生成订单ID: TK + 年月日 + 4位序号
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // 获取今日订单计数
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const { count, error: countError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());
      
      if (countError) {
        console.error('获取订单计数失败:', countError);
        throw new Error(`创建订单失败: ${countError.message}`);
      }
      
      // 生成4位序号，从现有订单数量+1开始
      const orderCount = count || 0;
      const serialNumber = String(orderCount + 1).padStart(4, '0');
      const orderId = `TK${year.toString().slice(-2)}${month}${day}${serialNumber}`;
      
      // 插入订单记录
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          user_id: order.userId,
          showtime_id: order.showtimeId,
          ticket_type: order.ticketType,
          total_price: order.totalPrice,
          status: OrderStatus.PENDING,
          ticket_status: TicketStatus.UNUSED
        }])
        .select()
        .single();
      
      if (orderError) {
        console.error('插入订单记录失败:', orderError);
        throw new Error(`创建订单失败: ${orderError.message}`);
      }
      
      // 准备座位关联数据
      const seatRelations = order.seats.map(seatId => ({
        order_id: orderId,
        seat_id: seatId
      }));

      // 批量插入座位关联
      if (seatRelations.length > 0) {
        const { error: seatError } = await supabase
          .from('order_seats')
          .insert(seatRelations);
        
        if (seatError) {
          console.error('关联座位失败:', seatError);
          throw new Error(`关联座位失败: ${seatError.message}`);
        }
        
        // 批量更新座位状态
        for (const seatId of order.seats) {
          const { error: updateSeatError } = await supabase
            .from('seats')
            .update({ is_available: false })
            .eq('id', seatId);
          
          if (updateSeatError) {
            console.error(`更新座位(ID:${seatId})状态失败:`, updateSeatError);
            throw new Error(`更新座位状态失败: ${updateSeatError.message}`);
          }
        }
      }
      
      // 返回创建的订单
      const newOrder = await OrderService.getOrderById(orderId);
      if (!newOrder) {
        throw new Error(`无法检索创建的订单: ${orderId}`);
      }
      return newOrder;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  },
  
  // 更新订单状态
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
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) {
        console.error(`更新订单(ID:${orderId})状态失败:`, error);
        throw new Error(`更新订单状态失败: ${error.message}`);
      }
      
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`更新订单(ID:${orderId})状态失败:`, error);
      throw error;
    }
  },
  
  // 取消订单
  cancelOrder: async (orderId: string, userId: string): Promise<Order | null> => {
    try {
      // 使用存储过程取消订单
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: userId
      });
      
      if (error || !data || !data[0] || !data[0].success) {
        console.error('取消订单失败:', error || (data && data[0] ? data[0].message : '未知错误'));
        throw new Error(error?.message || (data && data[0] ? data[0].message : '取消订单失败'));
      }
      
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`取消订单(ID:${orderId})失败:`, error);
      throw error;
    }
  },
  
  // 支付订单
  payOrder: async (orderId: string, paymentMethodId: string): Promise<Order | null> => {
    try {
      // 创建支付记录
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total_price')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        throw new Error(`查询订单金额失败: ${orderError.message}`);
      }
      
      // 插入支付记录
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          payment_method_id: paymentMethodId,
          amount: order.total_price,
          status: 'success'
        });
      
      if (paymentError) {
        throw new Error(`创建支付记录失败: ${paymentError.message}`);
      }
      
      // 支付记录创建成功后，触发器会自动更新订单状态为已支付
      // 获取更新后的订单
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error(`支付订单(ID:${orderId})失败:`, error);
      throw error;
    }
  }
}; 