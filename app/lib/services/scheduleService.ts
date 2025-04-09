import supabase from './supabaseClient';
import { StaffSchedule, ShiftType } from '../types';

/**
 * 排班服务 - 处理员工排班管理相关功能
 */
export const ScheduleService = {
  /**
   * 获取所有排班
   * @returns 排班列表
   */
  getAllSchedules: async (): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .order('schedule_date', { ascending: true });

      if (error) {
        throw new Error('获取排班列表失败: ' + error.message);
      }

      return data.map(schedule => ({
        id: schedule.id!,
        staffId: schedule.staff_id!,
        date: new Date(schedule.schedule_date!),
        shift: schedule.shift as ShiftType,
        position: schedule.position!,
        notes: schedule.notes || undefined,
        createdAt: new Date(schedule.created_at!),
        updatedAt: schedule.updated_at ? new Date(schedule.updated_at) : undefined,
        // 扩展属性
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error('获取排班列表失败:', error);
      throw error;
    }
  },

  /**
   * 根据日期范围获取排班
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 排班列表
   */
  getSchedulesByDateRange: async (startDate: Date, endDate: Date): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .gte('schedule_date', startDate.toISOString().split('T')[0])
        .lte('schedule_date', endDate.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true });

      if (error) {
        throw new Error('获取日期范围排班失败: ' + error.message);
      }

      return data.map(schedule => ({
        id: schedule.id!,
        staffId: schedule.staff_id!,
        date: new Date(schedule.schedule_date!),
        shift: schedule.shift as ShiftType,
        position: schedule.position!,
        notes: schedule.notes || undefined,
        createdAt: new Date(schedule.created_at!),
        updatedAt: schedule.updated_at ? new Date(schedule.updated_at) : undefined,
        // 扩展属性
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error('获取日期范围排班失败:', error);
      throw error;
    }
  },

  /**
   * 根据员工ID获取排班
   * @param staffId 员工ID
   * @returns 员工的排班列表
   */
  getSchedulesByStaffId: async (staffId: string): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('schedule_date', { ascending: true });

      if (error) {
        throw new Error(`获取员工(ID:${staffId})排班失败: ${error.message}`);
      }

      return data.map(schedule => ({
        id: schedule.id!,
        staffId: schedule.staff_id!,
        date: new Date(schedule.schedule_date!),
        shift: schedule.shift as ShiftType,
        position: schedule.position!,
        notes: schedule.notes || undefined,
        createdAt: new Date(schedule.created_at!),
        updatedAt: schedule.updated_at ? new Date(schedule.updated_at) : undefined,
        // 扩展属性
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error(`获取员工(ID:${staffId})排班失败:`, error);
      throw error;
    }
  },

  /**
   * 获取排班详情
   * @param scheduleId 排班ID
   * @returns 排班详情
   */
  getScheduleById: async (scheduleId: string): Promise<StaffSchedule | null> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error) {
        throw new Error(`获取排班(ID:${scheduleId})详情失败: ${error.message}`);
      }

      return {
        id: data.id!,
        staffId: data.staff_id!,
        date: new Date(data.schedule_date!),
        shift: data.shift as ShiftType,
        position: data.position!,
        notes: data.notes || undefined,
        createdAt: new Date(data.created_at!),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        // 扩展属性
        staffName: data.staff_name,
        staffEmail: data.staff_email
      };
    } catch (error) {
      console.error(`获取排班(ID:${scheduleId})详情失败:`, error);
      return null;
    }
  },

  /**
   * 创建排班
   * @param schedule 排班信息
   * @returns 创建的排班
   */
  createSchedule: async (schedule: {
    staffId: string;
    date: Date;
    shift: ShiftType;
    position: string;
    notes?: string;
  }): Promise<StaffSchedule | null> => {
    try {
      // 检查是否存在冲突的排班
      const { count, error: countError } = await supabase
        .from('staff_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('staff_id', schedule.staffId)
        .eq('schedule_date', schedule.date.toISOString().split('T')[0])
        .eq('shift', schedule.shift);

      if (countError) {
        throw new Error('检查排班冲突失败: ' + countError.message);
      }

      if (count && count > 0) {
        throw new Error('该员工在相同日期和班次已有排班');
      }

      // 创建排班
      const { data, error } = await supabase
        .from('staff_schedules')
        .insert([{
          staff_id: schedule.staffId,
          schedule_date: schedule.date.toISOString().split('T')[0],
          shift: schedule.shift,
          position: schedule.position,
          notes: schedule.notes
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建排班失败: ' + error.message);
      }

      // 获取完整排班信息
      return await ScheduleService.getScheduleById(data.id);
    } catch (error) {
      console.error('创建排班失败:', error);
      throw error;
    }
  },

  /**
   * 更新排班
   * @param scheduleId 排班ID
   * @param scheduleData 更新的排班数据
   * @returns 更新后的排班
   */
  updateSchedule: async (
    scheduleId: string,
    scheduleData: Partial<StaffSchedule>
  ): Promise<StaffSchedule | null> => {
    try {
      // 转换为数据库格式
      const updateData: any = {};
      if (scheduleData.staffId !== undefined) updateData.staff_id = scheduleData.staffId;
      if (scheduleData.date !== undefined) updateData.schedule_date = scheduleData.date.toISOString().split('T')[0];
      if (scheduleData.shift !== undefined) updateData.shift = scheduleData.shift;
      if (scheduleData.position !== undefined) updateData.position = scheduleData.position;
      if (scheduleData.notes !== undefined) updateData.notes = scheduleData.notes;

      // 如果更改了员工、日期或班次，需要检查冲突
      if (scheduleData.staffId !== undefined || scheduleData.date !== undefined || scheduleData.shift !== undefined) {
        // 获取当前排班数据
        const currentSchedule = await ScheduleService.getScheduleById(scheduleId);
        if (!currentSchedule) {
          throw new Error('未找到要更新的排班');
        }

        // 构建用于检查冲突的查询参数
        const staffId = scheduleData.staffId || currentSchedule.staffId;
        const date = scheduleData.date || currentSchedule.date;
        const shift = scheduleData.shift || currentSchedule.shift;

        // 检查是否存在冲突的排班
        const { count, error: countError } = await supabase
          .from('staff_schedules')
          .select('id', { count: 'exact', head: true })
          .eq('staff_id', staffId)
          .eq('schedule_date', date.toISOString().split('T')[0])
          .eq('shift', shift)
          .neq('id', scheduleId); // 排除当前正在更新的排班

        if (countError) {
          throw new Error('检查排班冲突失败: ' + countError.message);
        }

        if (count && count > 0) {
          throw new Error('该员工在相同日期和班次已有排班');
        }
      }

      // 更新排班
      const { error } = await supabase
        .from('staff_schedules')
        .update(updateData)
        .eq('id', scheduleId);

      if (error) {
        throw new Error('更新排班失败: ' + error.message);
      }

      // 获取更新后的排班
      return await ScheduleService.getScheduleById(scheduleId);
    } catch (error) {
      console.error('更新排班失败:', error);
      throw error;
    }
  },

  /**
   * 删除排班
   * @param scheduleId 排班ID
   * @returns 是否成功
   */
  deleteSchedule: async (scheduleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw new Error('删除排班失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除排班失败:', error);
      throw error;
    }
  },

  /**
   * 批量创建排班
   * @param schedules 排班列表
   * @returns 创建的排班列表
   */
  createBatchSchedules: async (
    schedules: Array<{
      staffId: string;
      date: Date;
      shift: ShiftType;
      position: string;
      notes?: string;
    }>
  ): Promise<{ success: boolean; created: number; errors: any[] }> => {
    try {
      // 转换为数据库格式
      const scheduleData = schedules.map(schedule => ({
        staff_id: schedule.staffId,
        schedule_date: schedule.date.toISOString().split('T')[0],
        shift: schedule.shift,
        position: schedule.position,
        notes: schedule.notes
      }));

      // 批量插入
      const { data, error } = await supabase
        .from('staff_schedules')
        .insert(scheduleData)
        .select();

      if (error) {
        throw new Error('批量创建排班失败: ' + error.message);
      }

      return {
        success: true,
        created: data.length,
        errors: []
      };
    } catch (error) {
      console.error('批量创建排班失败:', error);
      return {
        success: false,
        created: 0,
        errors: [error]
      };
    }
  }
}; 