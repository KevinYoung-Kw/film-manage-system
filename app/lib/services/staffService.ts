import supabase from './supabaseClient';
import { User, UserRole, StaffOperation, StaffOperationType } from '../types';

/**
 * 工作人员服务 - 处理工作人员相关功能
 */
export const StaffService = {
  /**
   * 获取所有工作人员
   * @returns 工作人员列表
   */
  getAllStaff: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', UserRole.STAFF);

      if (error) {
        throw new Error('获取工作人员列表失败: ' + error.message);
      }

      return data.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role as UserRole,
        createdAt: new Date(staff.created_at),
        updatedAt: staff.updated_at ? new Date(staff.updated_at) : undefined,
      }));
    } catch (error) {
      console.error('获取工作人员列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取工作人员详情
   * @param staffId 工作人员ID
   * @returns 工作人员详情
   */
  getStaffById: async (staffId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', staffId)
        .eq('role', UserRole.STAFF)
        .single();

      if (error) {
        throw new Error(`获取工作人员(ID:${staffId})详情失败: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      };
    } catch (error) {
      console.error(`获取工作人员(ID:${staffId})详情失败:`, error);
      return null;
    }
  },

  /**
   * 记录工作人员操作
   * @param staffId 工作人员ID
   * @param operationType 操作类型
   * @param details 操作详情
   * @returns 记录的操作
   */
  recordOperation: async (
    staffId: string,
    operationType: StaffOperationType,
    details: Record<string, any>
  ): Promise<StaffOperation | null> => {
    try {
      const { data, error } = await supabase
        .from('staff_operations')
        .insert([{
          staff_id: staffId,
          operation_type: operationType,
          details: details
        }])
        .select()
        .single();

      if (error) {
        throw new Error('记录工作人员操作失败: ' + error.message);
      }

      return {
        id: data.id,
        staffId: data.staff_id,
        operationType: data.operation_type as StaffOperationType,
        details: data.details,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('记录工作人员操作失败:', error);
      return null;
    }
  },

  /**
   * 获取工作人员操作历史
   * @param staffId 工作人员ID
   * @returns 操作历史列表
   */
  getOperations: async (staffId?: string): Promise<StaffOperation[]> => {
    try {
      let query = supabase
        .from('staff_operations')
        .select('*, staff:staff_id(name)')
        .order('created_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('获取工作人员操作历史失败: ' + error.message);
      }

      return data.map(op => ({
        id: op.id,
        staffId: op.staff_id,
        staffName: op.staff?.name,
        operationType: op.operation_type as StaffOperationType,
        details: op.details,
        createdAt: new Date(op.created_at),
      }));
    } catch (error) {
      console.error('获取工作人员操作历史失败:', error);
      return [];
    }
  },

  /**
   * 退票处理
   * @param staffId 工作人员ID
   * @param orderId 订单ID
   * @param reason 退票原因
   * @returns 退票结果
   */
  refundTicket: async (
    staffId: string,
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('refund_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId,
        p_reason: reason
      });

      if (error) {
        throw new Error('退票失败: ' + error.message);
      }

      if (Array.isArray(data) && data.length > 0) {
        return {
          success: Boolean(data[0].success),
          message: data[0].message || '退票成功'
        };
      }

      return { success: false, message: '退票操作没有返回结果' };
    } catch (error: any) {
      console.error('退票失败:', error);
      return {
        success: false,
        message: error.message || '退票失败'
      };
    }
  },

  /**
   * 检票处理
   * @param staffId 工作人员ID
   * @param orderId 订单ID
   * @returns 检票结果
   */
  checkTicket: async (
    staffId: string,
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.rpc('check_ticket', {
        p_order_id: orderId,
        p_staff_id: staffId // Supabase 会自动处理 UUID 转换
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
  }
}; 