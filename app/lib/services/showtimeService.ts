import supabase from './supabaseClient';
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
          movies(title, poster, webp_poster, duration),
          theaters(name)
        `)
        .order('start_time');
        
      if (error) {
        console.error('获取场次列表失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: showtime.movies.title,
            moviePoster: showtime.movies.webp_poster || showtime.movies.poster,
            movieDuration: showtime.movies.duration,
            theaterName: showtime.theaters.name,
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
      const { data, error } = await supabase
        .from('vw_today_showtimes')
        .select('*')
        .order('start_time');
        
      if (error) {
        console.error('获取今日场次失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          
          // 确保所有字段都有有效值，避免null值导致类型错误
          const moviePoster = typeof showtime.movie_poster === 'string' ? showtime.movie_poster : '';
          const movieDuration = typeof showtime.movie_duration === 'number' ? showtime.movie_duration : 0;
          const theaterName = typeof showtime.theater_name === 'string' ? showtime.theater_name : '';
          
          // 确保日期字段是有效的日期对象
          const startTime = showtime.start_time ? new Date(showtime.start_time) : new Date();
          const endTime = showtime.end_time ? new Date(showtime.end_time) : new Date();
          
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: showtime.movie_title,
            moviePoster,
            movieDuration,
            theaterName,
            startTime,
            endTime,
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
          movies(title, poster, webp_poster, duration),
          theaters(name)
        `)
        .eq('movie_id', movieId)
        .order('start_time');
        
      if (error) {
        console.error('获取电影场次失败:', error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
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
          movies(title, poster, webp_poster, duration),
          theaters(name)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('获取场次详情失败:', error);
        return undefined;
      }
      
      // 获取场次座位数据
      const seats = await ShowtimeService.getSeatsForShowtime(id);
      
      return {
        id: data.id,
        movieId: data.movie_id,
        theaterId: data.theater_id,
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
        .from('vw_available_seats')
        .select('*')
        .eq('showtime_id', showtimeId)
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
      const { error } = await supabase
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
      const { data, error } = await supabase
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
      
      const { error } = await supabase
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
      const { error } = await supabase
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
      // 将输入日期转换为ISO日期格式字符串 (YYYY-MM-DD)
      const dateStr = date.toISOString().split('T')[0];
      
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
          movies(title, poster, webp_poster, duration),
          theaters(name)
        `)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lt('start_time', `${dateStr}T23:59:59`)
        .order('start_time');
        
      if (error) {
        console.error(`获取${dateStr}场次失败:`, error);
        return [];
      }
      
      // 查询每个场次的座位数据
      const showtimes = await Promise.all(
        data.map(async (showtime) => {
          const seats = await ShowtimeService.getSeatsForShowtime(showtime.id);
          return {
            id: showtime.id,
            movieId: showtime.movie_id,
            theaterId: showtime.theater_id,
            movieTitle: showtime.movies ? showtime.movies.title : undefined,
            moviePoster: showtime.movies ? (showtime.movies.webp_poster || showtime.movies.poster) : undefined,
            movieDuration: showtime.movies ? showtime.movies.duration : undefined,
            theaterName: showtime.theaters ? showtime.theaters.name : undefined,
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
}; 