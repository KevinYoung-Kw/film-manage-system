import supabase, { getAdminClient } from './supabaseClient';
import { Showtime, Seat, TicketType } from '../types';

// 座位工具函数 - 将数据库座位数据转换为前端模型
const formatSeat = (seat: any): Seat => ({
  id: seat.id,
  row: seat.row_num,
  column: seat.column_num,
  type: seat.seat_type,
  available: seat.is_available
});

// 场次服务：处理电影场次的查询、管理等功能
export const ShowtimeService = {
  // 获取所有场次
  getAllShowtimes: async (): Promise<Showtime[]> => {
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .order('start_time');
        
      if (error) {
        console.error('获取场次列表失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime: any) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 安全地访问嵌套属性
          const movies = showtime.movies || {};
          const theaters = showtime.theaters || {};
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: movies.title || '',
            moviePoster: movies.webp_poster || movies.poster || '',
            movieDuration: movies.duration || 0,
            theaterName: theaters.name || '',
            startTime: new Date(showtime.start_time),
            endTime: new Date(showtime.end_time),
            price: {
              [TicketType.NORMAL]: showtime.price_normal,
              [TicketType.STUDENT]: showtime.price_student,
              [TicketType.SENIOR]: showtime.price_senior,
              [TicketType.CHILD]: showtime.price_child
            },
            availableSeats: seats
          } as Showtime;
        })
      );
      
      return showtimes;
    } catch (error) {
      console.error('获取场次列表失败:', error);
      return [];
    }
  },
  
  // 获取今日场次
  getTodayShowtimes: async (): Promise<Showtime[]> => {
    try {
      // 获取今天的日期范围
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // 查询今天的场次
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time');
        
      if (error) {
        console.error('获取今日场次失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime: any) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 安全地访问嵌套属性
          const movies = showtime.movies || {};
          const theaters = showtime.theaters || {};
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: movies.title || '',
            moviePoster: movies.webp_poster || movies.poster || '',
            movieDuration: movies.duration || 0,
            theaterName: theaters.name || '',
            startTime: new Date(showtime.start_time),
            endTime: new Date(showtime.end_time),
            price: {
              [TicketType.NORMAL]: showtime.price_normal,
              [TicketType.STUDENT]: showtime.price_student,
              [TicketType.SENIOR]: showtime.price_senior,
              [TicketType.CHILD]: showtime.price_child
            },
            availableSeats: seats
          } as Showtime;
        })
      );
      
      return showtimes;
    } catch (error) {
      console.error('获取今日场次失败:', error);
      return [];
    }
  },
  
  // 根据电影ID获取场次
  getShowtimesByMovieId: async (movieId: string): Promise<Showtime[]> => {
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .eq('movie_id', movieId)
        .order('start_time');
        
      if (error) {
        console.error('获取电影场次失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime: any) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 安全地访问嵌套属性
          const movies = showtime.movies || {};
          const theaters = showtime.theaters || {};
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: movies.title || '',
            moviePoster: movies.webp_poster || movies.poster || '',
            movieDuration: movies.duration || 0,
            theaterName: theaters.name || '',
            startTime: new Date(showtime.start_time),
            endTime: new Date(showtime.end_time),
            price: {
              [TicketType.NORMAL]: showtime.price_normal,
              [TicketType.STUDENT]: showtime.price_student,
              [TicketType.SENIOR]: showtime.price_senior,
              [TicketType.CHILD]: showtime.price_child
            },
            availableSeats: seats
          } as Showtime;
        })
      );
      
      return showtimes;
    } catch (error) {
      console.error('获取电影场次失败:', error);
      return [];
    }
  },
  
  // 根据ID获取场次
  getShowtimeById: async (id: string): Promise<Showtime | undefined> => {
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('获取场次详情失败:', error);
        return undefined;
      }
      
      // 获取场次座位数据
      const seats = await ShowtimeService.getSeatsForShowtime(id);
      
      // 安全地访问嵌套属性
      const movies = data.movies || {};
      const theaters = data.theaters || {};
      
      return {
        id: data.id,
        movieId: data.movie_id,
        theaterId: data.theater_id,
        movieTitle: movies.title || '',
        moviePoster: movies.webp_poster || movies.poster || '',
        movieDuration: movies.duration || 0,
        theaterName: theaters.name || '',
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        price: {
          [TicketType.NORMAL]: data.price_normal,
          [TicketType.STUDENT]: data.price_student,
          [TicketType.SENIOR]: data.price_senior,
          [TicketType.CHILD]: data.price_child
        },
        availableSeats: seats
      };
    } catch (error) {
      console.error('获取场次详情失败:', error);
      return undefined;
    }
  },
  
  // 获取场次的所有座位
  getSeatsForShowtime: async (showtimeId: string): Promise<Seat[]> => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('showtime_id', showtimeId)
        .order('row_num')
        .order('column_num');
        
      if (error) {
        console.error('获取场次座位失败:', error);
        return [];
      }
      
      return data.map(formatSeat);
    } catch (error) {
      console.error('获取场次座位失败:', error);
      return [];
    }
  },
  
  // 获取场次的可用座位
  getAvailableSeats: async (showtimeId: string): Promise<Seat[]> => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('showtime_id', showtimeId)
        .eq('is_available', true)
        .order('row_num')
        .order('column_num');
        
      if (error) {
        console.error('获取可用座位失败:', error);
        return [];
      }
      
      return data.map(formatSeat);
    } catch (error) {
      console.error('获取可用座位失败:', error);
      return [];
    }
  },
  
  // 更新座位状态
  updateSeatStatus: async (showtimeId: string, seatIds: string[], isAvailable: boolean): Promise<boolean> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      const { error } = await adminClient
        .from('seats')
        .update({ is_available: isAvailable })
        .in('id', seatIds)
        .eq('showtime_id', showtimeId);
        
      if (error) {
        console.error('更新座位状态失败:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('更新座位状态失败:', error);
      return false;
    }
  },
  
  // 添加新场次
  addShowtime: async (showtime: Omit<Showtime, 'id' | 'availableSeats'>): Promise<Showtime | null> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      const { data, error } = await adminClient
        .from('showtimes')
        .insert({
          movie_id: showtime.movieId,
          theater_id: showtime.theaterId,
          start_time: showtime.startTime.toISOString(),
          end_time: showtime.endTime.toISOString(),
          price_normal: showtime.price[TicketType.NORMAL],
          price_student: showtime.price[TicketType.STUDENT],
          price_senior: showtime.price[TicketType.SENIOR],
          price_child: showtime.price[TicketType.CHILD]
        })
        .select()
        .single();
        
      if (error) {
        console.error('添加场次失败:', error);
        return null;
      }
      
      // 触发器会自动生成座位，返回完整场次信息
      const newShowtime = await ShowtimeService.getShowtimeById(data.id);
      return newShowtime || null;
    } catch (error) {
      console.error('添加场次失败:', error);
      return null;
    }
  },
  
  // 更新场次信息
  updateShowtime: async (id: string, showtimeData: Partial<Showtime>): Promise<Showtime | null> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      // 构建更新对象，将前端命名转换为数据库命名
      const updateData: any = {};
      
      if (showtimeData.movieId !== undefined) updateData.movie_id = showtimeData.movieId;
      if (showtimeData.theaterId !== undefined) updateData.theater_id = showtimeData.theaterId;
      if (showtimeData.startTime !== undefined) updateData.start_time = showtimeData.startTime.toISOString();
      if (showtimeData.endTime !== undefined) updateData.end_time = showtimeData.endTime.toISOString();
      if (showtimeData.price !== undefined) {
        updateData.price_normal = showtimeData.price[TicketType.NORMAL];
        updateData.price_student = showtimeData.price[TicketType.STUDENT];
        updateData.price_senior = showtimeData.price[TicketType.SENIOR];
        updateData.price_child = showtimeData.price[TicketType.CHILD];
      }
      
      const { error } = await adminClient
        .from('showtimes')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        console.error('更新场次失败:', error);
        return null;
      }
      
      // 返回更新后的场次信息
      const updatedShowtime = await ShowtimeService.getShowtimeById(id);
      return updatedShowtime || null;
    } catch (error) {
      console.error('更新场次失败:', error);
      return null;
    }
  },
  
  // 删除场次
  deleteShowtime: async (id: string): Promise<boolean> => {
    try {
      // 获取带有认证的管理员客户端
      const adminClient = await getAdminClient();
      
      const { error } = await adminClient
        .from('showtimes')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('删除场次失败:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('删除场次失败:', error);
      return false;
    }
  },
  
  // 获取指定日期的场次
  getShowtimesByDate: async (date: Date): Promise<Showtime[]> => {
    try {
      // 确保使用本地日期的开始和结束时间
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 构建查询
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .order('start_time');
        
      if (error) {
        console.error(`获取场次失败:`, error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime: any) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 安全地访问嵌套属性
          const movies = showtime.movies || {};
          const theaters = showtime.theaters || {};
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: movies.title || '',
            moviePoster: movies.webp_poster || movies.poster || '',
            movieDuration: movies.duration || 0,
            theaterName: theaters.name || '',
            startTime: new Date(showtime.start_time),
            endTime: new Date(showtime.end_time),
            price: {
              [TicketType.NORMAL]: showtime.price_normal,
              [TicketType.STUDENT]: showtime.price_student,
              [TicketType.SENIOR]: showtime.price_senior,
              [TicketType.CHILD]: showtime.price_child
            },
            availableSeats: seats
          } as Showtime;
        })
      );
      
      return showtimes;
    } catch (error) {
      console.error(`获取日期场次失败:`, error);
      return [];
    }
  },
  
  // 根据日期范围获取场次
  getShowtimesByDateRange: async (startDate: Date, endDate: Date): Promise<Showtime[]> => {
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          start_time,
          end_time,
          price_normal,
          price_student,
          price_senior,
          price_child,
          movies!inner (
            title, 
            poster, 
            webp_poster, 
            duration
          ),
          theaters!inner (
            name
          )
        `)
        .gte('start_time', startDate.toISOString())
        .lt('start_time', endDate.toISOString())
        .order('start_time');
        
      if (error) {
        console.error('获取日期范围内场次失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime: any) => {
          // 获取场次座位数据
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 安全地访问嵌套属性
          const movies = showtime.movies || {};
          const theaters = showtime.theaters || {};
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: movies.title || '',
            moviePoster: movies.webp_poster || movies.poster || '',
            movieDuration: movies.duration || 0,
            theaterName: theaters.name || '',
            startTime: new Date(showtime.start_time),
            endTime: new Date(showtime.end_time),
            price: {
              [TicketType.NORMAL]: showtime.price_normal,
              [TicketType.STUDENT]: showtime.price_student,
              [TicketType.SENIOR]: showtime.price_senior,
              [TicketType.CHILD]: showtime.price_child
            },
            availableSeats: seats
          } as Showtime;
        })
      );
      
      return showtimes;
    } catch (error) {
      console.error('获取日期范围内场次失败:', error);
      return [];
    }
  },
}; 