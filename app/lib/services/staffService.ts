import supabase from './supabaseClient';
import { Order, OrderStatus, StaffOperation, StaffOperationType, TicketType } from '../types';
import { OrderService } from './orderService';

// 工作人员操作服务
export const StaffService = {
  // 获取所有工作人员操作记录
  getAllOperations: async (): Promise<StaffOperation[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_operations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('获取工作人员操作记录失败:', error);
        throw new Error(`获取工作人员操作记录失败: ${error.message}`);
      }

      return data.map(op => ({
        id: op.id!,
        staffId: op.staff_id!,
        type: op.operation_type as StaffOperationType,
        orderId: op.order_id || undefined,
        showtimeId: op.showtime_id || undefined,
        details: op.details ? JSON.stringify(op.details) : '',
        createdAt: new Date(op.created_at!)
      }));
    } catch (error) {
      console.error('获取工作人员操作记录失败:', error);
      throw error;
    }
  },
  
  // 获取特定工作人员的操作记录
  getOperationsByStaffId: async (staffId: string): Promise<StaffOperation[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_operations')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`获取工作人员(ID:${staffId})操作记录失败:`, error);
        throw new Error(`获取工作人员操作记录失败: ${error.message}`);
      }

      return data.map(op => ({
        id: op.id!,
        staffId: op.staff_id!,
        type: op.operation_type as StaffOperationType,
        orderId: op.order_id || undefined,
        showtimeId: op.showtime_id || undefined,
        details: op.details ? JSON.stringify(op.details) : '',
        createdAt: new Date(op.created_at!)
      }));
    } catch (error) {
      console.error(`获取工作人员(ID:${staffId})操作记录失败:`, error);
      throw error;
    }
  },
  
  // 售票操作
  sellTicket: async (
    staffId: string, 
    showtimeId: string, 
    seats: string[], 
    ticketType: TicketType, 
    paymentMethodId: string
  ): Promise<Order | null> => {
    try {
      // 使用存储过程售票
      const { data, error } = await supabase.rpc('sell_ticket', {
        p_staff_id: staffId,
        p_showtime_id: showtimeId,
        p_seat_ids: seats,
        p_ticket_type: ticketType,
        p_payment_method_id: paymentMethodId
      });
      
      if (error || !data || !data[0] || !data[0].success) {
        console.error('售票操作失败:', error || (data && data[0] ? data[0].message : '未知错误'));
        throw new Error(error?.message || (data && data[0] ? data[0].message : '售票操作失败'));
      }
      
      // 获取创建好的订单
      const orderId = data[0].order_id;
      return await OrderService.getOrderById(orderId);
    } catch (error) {
      console.error('售票操作失败:', error);
      throw error;
    }
  },
  
  // 检票操作
  checkTicket: async (
    staffId: string,
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // 使用存储过程检票
      const { data, error } = await supabase.rpc('check_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId
      });
      
      if (error) {
        console.error('检票操作失败:', error);
        return { success: false, message: `检票失败: ${error.message}` };
      }
      
      if (!data || !data[0]) {
        return { success: false, message: '检票操作返回结果为空' };
      }
      
      return {
        success: data[0].success,
        message: data[0].message
      };
    } catch (error) {
      console.error('检票操作失败:', error);
      return { success: false, message: `操作失败: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  },
  
  // 退票操作
  refundTicket: async (
    staffId: string,
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; message: string; refundAmount?: number }> => {
    try {
      // 使用存储过程退票
      const { data, error } = await supabase.rpc('refund_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId,
        p_reason: reason
      });
      
      if (error) {
        console.error('退票操作失败:', error);
        return { success: false, message: `退票失败: ${error.message}` };
      }
      
      if (!data || !data[0]) {
        return { success: false, message: '退票操作返回结果为空' };
      }
      
      return {
        success: data[0].success,
        message: data[0].message,
        refundAmount: data[0].refund_amount
      };
    } catch (error) {
      console.error('退票操作失败:', error);
      return { success: false, message: `操作失败: ${error instanceof Error ? error.message : '未知错误'}` };
    }
  },
  
  // 添加操作记录
  addOperation: async (operation: Omit<StaffOperation, 'id' | 'createdAt'>): Promise<StaffOperation> => {
    try {
      const { data, error } = await supabase
        .from('staff_operations')
        .insert({
          staff_id: operation.staffId,
          operation_type: operation.type,
          order_id: operation.orderId,
          showtime_id: operation.showtimeId,
          details: operation.details ? JSON.parse(operation.details) : null
        })
        .select()
        .single();
      
      if (error) {
        console.error('添加操作记录失败:', error);
        throw new Error(`添加操作记录失败: ${error.message}`);
      }
      
      return {
        id: data.id,
        staffId: data.staff_id,
        type: data.operation_type as StaffOperationType,
        orderId: data.order_id || undefined,
        showtimeId: data.showtime_id || undefined,
        details: data.details ? JSON.stringify(data.details) : '',
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('添加操作记录失败:', error);
      throw error;
    }
  }
}; 