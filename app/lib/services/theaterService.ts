import supabase, { getAdminClient } from './supabaseClient';
import { Theater, TheaterSeatLayout } from '../types';

/**
 * 影厅服务 - 处理影厅管理相关功能
 */
export const TheaterService = {
  /**
   * 获取所有影厅
   * @returns 影厅列表
   */
  getAllTheaters: async (): Promise<Theater[]> => {
    try {
      const { data, error } = await supabase
        .from('theaters')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error('获取影厅列表失败: ' + error.message);
      }

      return data.map(theater => ({
        id: theater.id,
        name: theater.name,
        totalSeats: theater.total_seats,
        rows: theater.rows,
        columns: theater.columns,
        equipment: theater.equipment || []
      }));
    } catch (error) {
      console.error('获取影厅列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取影厅详情
   * @param theaterId 影厅ID
   * @returns 影厅详情
   */
  getTheaterById: async (theaterId: string): Promise<Theater | null> => {
    try {
      const { data, error } = await supabase
        .from('theaters')
        .select('*')
        .eq('id', theaterId)
        .single();

      if (error) {
        throw new Error(`获取影厅(ID:${theaterId})详情失败: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        totalSeats: data.total_seats,
        rows: data.rows,
        columns: data.columns,
        equipment: data.equipment || []
      };
    } catch (error) {
      console.error(`获取影厅(ID:${theaterId})详情失败:`, error);
      return null;
    }
  },

  /**
   * 创建影厅
   * @param theater 影厅信息
   * @returns 创建的影厅信息
   */
  createTheater: async (theater: Omit<Theater, 'id'>): Promise<Theater | null> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      const { data, error } = await adminClient
        .from('theaters')
        .insert([{
          name: theater.name,
          total_seats: theater.totalSeats,
          rows: theater.rows,
          columns: theater.columns,
          equipment: theater.equipment || []
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建影厅失败: ' + error.message);
      }

      return {
        id: data.id,
        name: data.name,
        totalSeats: data.total_seats,
        rows: data.rows,
        columns: data.columns,
        equipment: data.equipment || []
      };
    } catch (error) {
      console.error('创建影厅失败:', error);
      throw error;
    }
  },

  /**
   * 更新影厅信息
   * @param theaterId 影厅ID
   * @param theaterData 更新的影厅数据
   * @returns 更新后的影厅信息
   */
  updateTheater: async (theaterId: string, theaterData: Partial<Theater>): Promise<Theater | null> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      // 转换为数据库格式
      const updateData: any = {};
      if (theaterData.name !== undefined) updateData.name = theaterData.name;
      if (theaterData.totalSeats !== undefined) updateData.total_seats = theaterData.totalSeats;
      if (theaterData.rows !== undefined) updateData.rows = theaterData.rows;
      if (theaterData.columns !== undefined) updateData.columns = theaterData.columns;
      if (theaterData.equipment !== undefined) updateData.equipment = theaterData.equipment;

      const { error } = await adminClient
        .from('theaters')
        .update(updateData)
        .eq('id', theaterId);

      if (error) {
        throw new Error('更新影厅失败: ' + error.message);
      }

      // 获取更新后的影厅
      return await TheaterService.getTheaterById(theaterId);
    } catch (error) {
      console.error('更新影厅失败:', error);
      throw error;
    }
  },

  /**
   * 删除影厅
   * @param theaterId 影厅ID
   * @returns 是否成功
   */
  deleteTheater: async (theaterId: string): Promise<boolean> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      // 检查是否有关联的场次
      const { count, error: countError } = await adminClient
        .from('showtimes')
        .select('id', { count: 'exact', head: true })
        .eq('theater_id', theaterId);

      if (countError) {
        throw new Error('检查关联场次失败: ' + countError.message);
      }

      if (count && count > 0) {
        throw new Error('该影厅已有关联场次，无法删除');
      }

      const { error } = await adminClient
        .from('theaters')
        .delete()
        .eq('id', theaterId);

      if (error) {
        throw new Error('删除影厅失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除影厅失败:', error);
      throw error;
    }
  },

  /**
   * 获取影厅占用率
   * @returns 影厅占用率数据
   */
  getTheaterOccupancy: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_theater_occupancy')
        .select('*')
        .order('average_occupancy_rate', { ascending: false });

      if (error) {
        throw new Error('获取影厅占用率失败: ' + error.message);
      }

      return data.map(theater => ({
        id: theater.theater_id,
        name: theater.theater_name,
        showtimeCount: theater.showtime_count || 0,
        occupancyRate: theater.average_occupancy_rate || 0
      }));
    } catch (error) {
      console.error('获取影厅占用率失败:', error);
      throw error;
    }
  },

  /**
   * 获取影厅座位布局
   * @param theaterId 影厅ID
   * @returns 座位布局
   */
  getTheaterSeatLayout: async (theaterId: string): Promise<TheaterSeatLayout | null> => {
    try {
      const { data, error } = await supabase
        .from('theater_seat_layouts')
        .select('*')
        .eq('theater_id', theaterId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到记录
          // 尝试创建默认布局
          return await TheaterService.createDefaultSeatLayout(theaterId);
        }
        throw new Error(`获取影厅(ID:${theaterId})座位布局失败: ${error.message}`);
      }

      return {
        theaterId: data.theater_id,
        layout: data.layout as Array<Array<string>>
      };
    } catch (error) {
      console.error(`获取影厅(ID:${theaterId})座位布局失败:`, error);
      return null;
    }
  },

  /**
   * 创建默认座位布局
   * @param theaterId 影厅ID
   * @returns 默认座位布局
   */
  createDefaultSeatLayout: async (theaterId: string): Promise<TheaterSeatLayout | null> => {
    try {
      // 获取影厅信息
      const theater = await TheaterService.getTheaterById(theaterId);
      if (!theater) {
        throw new Error(`未找到影厅(ID:${theaterId})`);
      }

      // 创建默认布局数组
      const layout: string[][] = [];
      for (let i = 0; i < theater.rows; i++) {
        const row: string[] = [];
        for (let j = 0; j < theater.columns; j++) {
          row.push('normal'); // 所有座位默认为普通座位
        }
        layout.push(row);
      }

      // 保存布局到数据库
      const { data, error } = await supabase
        .from('theater_seat_layouts')
        .insert([{
          theater_id: theaterId,
          layout
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建默认座位布局失败: ' + error.message);
      }

      return {
        theaterId: data.theater_id,
        layout: data.layout as Array<Array<string>>
      };
    } catch (error) {
      console.error('创建默认座位布局失败:', error);
      return null;
    }
  },

  /**
   * 更新座位布局
   * @param theaterId 影厅ID
   * @param layout 新布局
   * @returns 更新后的座位布局
   */
  updateSeatLayout: async (theaterId: string, layout: Array<Array<string>>): Promise<TheaterSeatLayout | null> => {
    try {
      // 检查或创建布局记录
      let existingLayout = await TheaterService.getTheaterSeatLayout(theaterId);
      
      if (!existingLayout) {
        // 创建新布局
        const { error } = await supabase
          .from('theater_seat_layouts')
          .insert([{
            theater_id: theaterId,
            layout
          }]);

        if (error) {
          throw new Error('创建座位布局失败: ' + error.message);
        }
      } else {
        // 更新现有布局
        const { error } = await supabase
          .from('theater_seat_layouts')
          .update({ layout })
          .eq('theater_id', theaterId);

        if (error) {
          throw new Error('更新座位布局失败: ' + error.message);
        }
      }

      return {
        theaterId,
        layout
      };
    } catch (error) {
      console.error('更新座位布局失败:', error);
      throw error;
    }
  }
}; 