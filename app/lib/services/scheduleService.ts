import supabase from './supabaseClient';
import { StaffSchedule, ShiftType } from '../types';
import { StaffScheduleFallbackService } from './fallbackService';

// 工作人员排班服务
export const ScheduleService = {
  // 获取所有排班
  getAllSchedules: async (): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .order('schedule_date', { ascending: true });
      
      if (error) {
        console.error('获取排班信息失败:', error);
        return StaffScheduleFallbackService.getAllSchedules();
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
        // 附加信息
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error('获取排班信息失败:', error);
      return StaffScheduleFallbackService.getAllSchedules();
    }
  },
  
  // 获取特定工作人员的排班
  getSchedulesByStaffId: async (staffId: string): Promise<StaffSchedule[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('schedule_date', { ascending: true });
      
      if (error) {
        console.error(`获取工作人员(ID:${staffId})排班失败:`, error);
        return StaffScheduleFallbackService.getSchedulesByStaffId(staffId);
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
        // 附加信息
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error(`获取工作人员(ID:${staffId})排班失败:`, error);
      return StaffScheduleFallbackService.getSchedulesByStaffId(staffId);
    }
  },
  
  // 获取特定日期的排班
  getSchedulesByDate: async (date: Date): Promise<StaffSchedule[]> => {
    try {
      // 转换日期为 ISO 格式的日期字符串 (YYYY-MM-DD)
      const dateString = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .eq('schedule_date', dateString)
        .order('shift', { ascending: true });
      
      if (error) {
        console.error(`获取日期(${dateString})排班失败:`, error);
        return StaffScheduleFallbackService.getSchedulesByDate(date);
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
        // 附加信息
        staffName: schedule.staff_name,
        staffEmail: schedule.staff_email
      }));
    } catch (error) {
      console.error(`获取日期排班失败:`, error);
      return StaffScheduleFallbackService.getSchedulesByDate(date);
    }
  },
  
  // 获取当前和未来的排班
  getUpcomingSchedulesByStaffId: async (staffId: string): Promise<StaffSchedule[]> => {
    try {
      // 直接从数据库获取该工作人员的所有排班
      const { data, error } = await supabase
        .from('vw_staff_schedules')
        .select('*')
        .eq('staff_id', staffId)
        .order('schedule_date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // 获取当前日期，并设置为当天的0点，只比较日期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 转换数据并过滤出当天和未来的排班
      return data
        .map(schedule => ({
          id: schedule.id!,
          staffId: schedule.staff_id!,
          date: new Date(schedule.schedule_date!),
          shift: schedule.shift as ShiftType,
          position: schedule.position!,
          notes: schedule.notes || undefined,
          createdAt: new Date(schedule.created_at!),
          updatedAt: schedule.updated_at ? new Date(schedule.updated_at) : undefined,
          // 附加信息
          staffName: schedule.staff_name,
          staffEmail: schedule.staff_email
        }))
        .filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate >= today;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      console.error(`获取工作人员(ID:${staffId})未来排班失败:`, error);
      
      // 如果出错，尝试使用本地数据
      const schedules = await StaffScheduleFallbackService.getSchedulesByStaffId(staffId);
      const now = new Date();
      
      // 过滤出当天和未来的排班
      return schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        // 设置为当天的0点，只比较日期
        scheduleDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return scheduleDate >= today;
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  },
  
  // 添加排班
  addSchedule: async (schedule: Omit<StaffSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffSchedule> => {
    try {
      // 准备日期格式
      const dateString = schedule.date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('staff_schedules')
        .insert({
          staff_id: schedule.staffId,
          schedule_date: dateString,
          shift: schedule.shift,
          position: schedule.position,
          notes: schedule.notes
        })
        .select()
        .single();
      
      if (error) {
        console.error('添加排班失败:', error);
        throw new Error(`添加排班失败: ${error.message}`);
      }
      
      return {
        id: data.id,
        staffId: data.staff_id,
        date: new Date(data.schedule_date),
        shift: data.shift as ShiftType,
        position: data.position,
        notes: data.notes || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };
    } catch (error) {
      console.error('添加排班失败:', error);
      throw error;
    }
  },
  
  // 更新排班
  updateSchedule: async (id: string, scheduleData: Partial<Omit<StaffSchedule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StaffSchedule> => {
    try {
      // 准备更新数据
      const updateData: any = {};
      
      if (scheduleData.staffId) updateData.staff_id = scheduleData.staffId;
      if (scheduleData.date) updateData.schedule_date = scheduleData.date.toISOString().split('T')[0];
      if (scheduleData.shift) updateData.shift = scheduleData.shift;
      if (scheduleData.position) updateData.position = scheduleData.position;
      if (scheduleData.notes !== undefined) updateData.notes = scheduleData.notes;
      
      const { data, error } = await supabase
        .from('staff_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`更新排班(ID:${id})失败:`, error);
        throw new Error(`更新排班失败: ${error.message}`);
      }
      
      return {
        id: data.id,
        staffId: data.staff_id,
        date: new Date(data.schedule_date),
        shift: data.shift as ShiftType,
        position: data.position,
        notes: data.notes || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
      };
    } catch (error) {
      console.error(`更新排班(ID:${id})失败:`, error);
      throw error;
    }
  },
  
  // 删除排班
  deleteSchedule: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('staff_schedules')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`删除排班(ID:${id})失败:`, error);
        throw new Error(`删除排班失败: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`删除排班(ID:${id})失败:`, error);
      throw error;
    }
  }
}; 