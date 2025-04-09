import { Movie, Theater, Showtime, Order, User, UserRole, Seat, StaffOperation, TicketType, MovieStatus, OrderStatus, StaffOperationType, TicketStatus } from '../types';
import { mockMovies, mockTheaters, mockShowtimes, mockOrders, mockUsers, mockStaffOperations } from '../mockData';
import supabase from './supabaseClient';

/**
 * 回退服务
 * 提供数据获取的回退逻辑，优先从Supabase获取数据，获取失败时使用本地静态数据
 */

// 检查Supabase连接是否可用
export const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('movies').select('id').limit(1);
    return !error && !!data;
  } catch (error) {
    console.error('Supabase连接检查失败:', error);
    return false;
  }
};

// 数据库枚举类型到应用枚举类型的映射
const mapMovieStatus = (status: string | null): MovieStatus | undefined => {
  if (!status) return undefined;
  return status as MovieStatus; // 数据库与应用中的枚举值相同
};

const mapTicketType = (type: string): TicketType => {
  switch (type) {
    case 'normal': return TicketType.NORMAL;
    case 'student': return TicketType.STUDENT;
    case 'senior': return TicketType.SENIOR;
    case 'child': return TicketType.CHILD;
    default: return TicketType.NORMAL;
  }
};

const mapTicketStatus = (status: string | null): TicketStatus | undefined => {
  if (!status) return undefined;
  
  switch (status) {
    case 'unused': return TicketStatus.UNUSED;
    case 'used': return TicketStatus.USED;
    case 'expired': return TicketStatus.EXPIRED;
    case 'soon': return TicketStatus.AVAILABLE_SOON;
    case 'now': return TicketStatus.AVAILABLE_NOW;
    case 'late': return TicketStatus.LATE;
    default: return undefined;
  }
};

const mapStaffOperationType = (type: string): StaffOperationType => {
  switch (type) {
    case 'sell': return StaffOperationType.SELL;
    case 'check': return StaffOperationType.CHECK;
    case 'refund': return StaffOperationType.REFUND;
    case 'modify': return StaffOperationType.MODIFY;
    default: return StaffOperationType.SELL;
  }
};

// 电影数据回退服务
export const MovieFallbackService = {
  // 优先从Supabase获取所有电影，失败时使用本地数据
  getAllMovies: async (processImageFn?: (url: string, useWebp?: boolean) => string): Promise<Movie[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) throw error;

      // 转换数据结构
      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageFn ? processImageFn(movie.poster) : movie.poster,
        webpPoster: movie.webp_poster 
          ? movie.webp_poster 
          : (processImageFn ? processImageFn(movie.poster, true) : movie.poster),
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating || 0, // 确保评分不为null
        status: mapMovieStatus(movie.status)
      }));
    } catch (error) {
      console.error('从Supabase获取电影列表失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      if (processImageFn) {
        return mockMovies.map(movie => ({
          ...movie,
          poster: processImageFn(movie.poster),
          webpPoster: movie.webpPoster ? movie.webpPoster : processImageFn(movie.poster, true)
        }));
      }
      
      return mockMovies;
    }
  },
  
  // 优先从Supabase获取电影详情，失败时使用本地数据
  getMovieById: async (id: string, processImageFn?: (url: string, useWebp?: boolean) => string): Promise<Movie | undefined> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageFn ? processImageFn(data.poster) : data.poster,
        webpPoster: data.webp_poster 
          ? data.webp_poster 
          : (processImageFn ? processImageFn(data.poster, true) : data.poster),
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating || 0, // 确保评分不为null
        status: mapMovieStatus(data.status)
      };
    } catch (error) {
      console.error(`从Supabase获取电影(ID:${id})失败，使用本地数据:`, error);
      
      // 使用本地数据作为回退
      const movie = mockMovies.find(movie => movie.id === id);
      if (movie && processImageFn) {
        return {
          ...movie,
          poster: processImageFn(movie.poster),
          webpPoster: movie.webpPoster ? movie.webpPoster : processImageFn(movie.poster, true)
        };
      }
      
      return movie;
    }
  }
};

// 影厅数据回退服务
export const TheaterFallbackService = {
  // 优先从Supabase获取所有影厅，失败时使用本地数据
  getAllTheaters: async (): Promise<Theater[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('theaters')
        .select('*')
        .order('name');

      if (error) throw error;

      // 转换数据结构
      return data.map(theater => ({
        id: theater.id,
        name: theater.name,
        rows: theater.rows,
        columns: theater.columns,
        totalSeats: theater.total_seats,
        equipment: theater.equipment || []
      }));
    } catch (error) {
      console.error('从Supabase获取影厅列表失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      return mockTheaters;
    }
  },
  
  // 优先从Supabase获取影厅详情，失败时使用本地数据
  getTheaterById: async (id: string): Promise<Theater | undefined> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('theaters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        rows: data.rows,
        columns: data.columns,
        totalSeats: data.total_seats,
        equipment: data.equipment || []
      };
    } catch (error) {
      console.error(`从Supabase获取影厅(ID:${id})失败，使用本地数据:`, error);
      
      // 使用本地数据作为回退
      return mockTheaters.find(theater => theater.id === id);
    }
  }
};

// 场次数据回退服务
export const ShowtimeFallbackService = {
  // 优先从Supabase获取所有场次，失败时使用本地数据
  getAllShowtimes: async (): Promise<Showtime[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          movie:movie_id(title, poster, webp_poster),
          theater:theater_id(name)
        `)
        .order('start_time');

      if (error) throw error;

      // 获取每个场次的座位信息
      const showtimesWithSeats = await Promise.all(data.map(async (showtime) => {
        const { data: seatsData, error: seatsError } = await supabase
          .from('seats')
          .select('*')
          .eq('showtime_id', showtime.id);
          
        if (seatsError) throw seatsError;
        
        // 转换座位数据结构
        const seats: Seat[] = seatsData.map(seat => ({
          id: seat.id,
          row: seat.row_num,
          column: seat.column_num,
          type: seat.seat_type,
          available: seat.is_available
        }));
        
        // 转换价格格式
        const priceMap: Record<TicketType, number> = {
          [TicketType.NORMAL]: showtime.price_normal,
          [TicketType.STUDENT]: showtime.price_student,
          [TicketType.SENIOR]: showtime.price_senior,
          [TicketType.CHILD]: showtime.price_child
        };
        
        return {
          id: showtime.id,
          movieId: showtime.movie_id,
          theaterId: showtime.theater_id,
          startTime: new Date(showtime.start_time),
          endTime: new Date(showtime.end_time),
          price: priceMap,
          type: '2D', // 假设默认值，实际应从数据库中读取
          language: '原声', // 假设默认值，实际应从数据库中读取
          availableSeats: seats,
          movieTitle: showtime.movie.title,
          theaterName: showtime.theater.name,
          moviePoster: showtime.movie.webp_poster || showtime.movie.poster
        };
      }));

      return showtimesWithSeats;
    } catch (error) {
      console.error('从Supabase获取场次列表失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      return mockShowtimes;
    }
  },
  
  // 优先从Supabase获取今日场次，失败时使用本地数据
  getTodayShowtimes: async (): Promise<Showtime[]> => {
    try {
      // 获取今天的日期范围
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          movie:movie_id(title, poster, webp_poster),
          theater:theater_id(name)
        `)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      if (error) throw error;

      // 获取每个场次的座位信息
      const showtimesWithSeats = await Promise.all(data.map(async (showtime) => {
        const { data: seatsData, error: seatsError } = await supabase
          .from('seats')
          .select('*')
          .eq('showtime_id', showtime.id);
          
        if (seatsError) throw seatsError;
        
        // 转换座位数据结构
        const seats: Seat[] = seatsData.map(seat => ({
          id: seat.id,
          row: seat.row_num,
          column: seat.column_num,
          type: seat.seat_type,
          available: seat.is_available
        }));
        
        // 转换价格格式
        const priceMap: Record<TicketType, number> = {
          [TicketType.NORMAL]: showtime.price_normal,
          [TicketType.STUDENT]: showtime.price_student,
          [TicketType.SENIOR]: showtime.price_senior,
          [TicketType.CHILD]: showtime.price_child
        };
        
        return {
          id: showtime.id,
          movieId: showtime.movie_id,
          theaterId: showtime.theater_id,
          startTime: new Date(showtime.start_time),
          endTime: new Date(showtime.end_time),
          price: priceMap,
          type: '2D', // 假设默认值，实际应从数据库中读取
          language: '原声', // 假设默认值，实际应从数据库中读取
          availableSeats: seats,
          movieTitle: showtime.movie.title,
          theaterName: showtime.theater.name,
          moviePoster: showtime.movie.webp_poster || showtime.movie.poster
        };
      }));

      return showtimesWithSeats;
    } catch (error) {
      console.error('从Supabase获取今日场次失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      const today = new Date();
      const todayShowtimes = mockShowtimes.filter(showtime => {
        const showtimeDate = new Date(showtime.startTime);
        return (
          showtimeDate.getDate() === today.getDate() &&
          showtimeDate.getMonth() === today.getMonth() &&
          showtimeDate.getFullYear() === today.getFullYear()
        );
      });
      
      return todayShowtimes;
    }
  }
};

// 订单数据回退服务
export const OrderFallbackService = {
  // 优先从Supabase获取所有订单，失败时使用本地数据
  getAllOrders: async (): Promise<Order[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:user_id(name, email),
          showtime:showtime_id(
            start_time,
            movie_id(title),
            theater_id(name)
          ),
          order_seats(seat_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 转换数据结构
      return data.map(order => ({
        id: order.id,
        userId: order.user_id,
        showtimeId: order.showtime_id,
        createdAt: new Date(order.created_at),
        status: order.status as OrderStatus,
        ticketType: mapTicketType(order.ticket_type),
        totalPrice: order.total_price,
        seats: order.order_seats.map((s: any) => s.seat_id),
        // 可选字段
        paidAt: order.paid_at ? new Date(order.paid_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        refundedAt: order.refunded_at ? new Date(order.refunded_at) : undefined,
        checkedAt: order.checked_at ? new Date(order.checked_at) : undefined,
        ticketStatus: mapTicketStatus(order.ticket_status),
        // 附加信息
        userName: order.user.name,
        userEmail: order.user.email,
        movieTitle: order.showtime.movie_id.title,
        theaterName: order.showtime.theater_id.name,
        showtime: new Date(order.showtime.start_time)
      }));
    } catch (error) {
      console.error('从Supabase获取订单列表失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      return mockOrders;
    }
  },
  
  // 优先从Supabase获取用户订单，失败时使用本地数据
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:user_id(name, email),
          showtime:showtime_id(
            start_time,
            movie_id(title),
            theater_id(name)
          ),
          order_seats(seat_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 转换数据结构
      return data.map(order => ({
        id: order.id,
        userId: order.user_id,
        showtimeId: order.showtime_id,
        createdAt: new Date(order.created_at),
        status: order.status as OrderStatus,
        ticketType: mapTicketType(order.ticket_type),
        totalPrice: order.total_price,
        seats: order.order_seats.map((s: any) => s.seat_id),
        // 可选字段
        paidAt: order.paid_at ? new Date(order.paid_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        refundedAt: order.refunded_at ? new Date(order.refunded_at) : undefined,
        checkedAt: order.checked_at ? new Date(order.checked_at) : undefined,
        ticketStatus: mapTicketStatus(order.ticket_status),
        // 附加信息
        userName: order.user.name,
        userEmail: order.user.email,
        movieTitle: order.showtime.movie_id.title,
        theaterName: order.showtime.theater_id.name,
        showtime: new Date(order.showtime.start_time)
      }));
    } catch (error) {
      console.error(`从Supabase获取用户(ID:${userId})订单失败，使用本地数据:`, error);
      
      // 使用本地数据作为回退
      return mockOrders.filter(order => order.userId === userId);
    }
  }
};

// 用户数据回退服务
export const UserFallbackService = {
  // 优先从Supabase获取所有用户，失败时使用本地数据
  getAllUsers: async (): Promise<User[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;

      // 转换数据结构
      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      }));
    } catch (error) {
      console.error('从Supabase获取用户列表失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      return mockUsers;
    }
  },
  
  // 优先从Supabase获取用户详情，失败时使用本地数据
  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error(`从Supabase获取用户(ID:${id})失败，使用本地数据:`, error);
      
      // 使用本地数据作为回退
      return mockUsers.find(user => user.id === id);
    }
  }
};

// 工作人员操作数据回退服务
export const StaffOperationFallbackService = {
  // 优先从Supabase获取所有操作记录，失败时使用本地数据
  getAllOperations: async (): Promise<StaffOperation[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('staff_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 转换数据结构
      return data.map(op => ({
        id: op.id,
        staffId: op.staff_id,
        type: mapStaffOperationType(op.operation_type),
        orderId: op.order_id || undefined,
        showtimeId: op.showtime_id || undefined,
        details: op.details ? JSON.stringify(op.details) : '',
        createdAt: new Date(op.created_at)
      }));
    } catch (error) {
      console.error('从Supabase获取工作人员操作记录失败，使用本地数据:', error);
      
      // 使用本地数据作为回退
      return mockStaffOperations;
    }
  },
  
  // 优先从Supabase获取某员工的操作记录，失败时使用本地数据
  getOperationsByStaffId: async (staffId: string): Promise<StaffOperation[]> => {
    try {
      // 尝试从Supabase获取数据
      const { data, error } = await supabase
        .from('staff_operations')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 转换数据结构
      return data.map(op => ({
        id: op.id,
        staffId: op.staff_id,
        type: mapStaffOperationType(op.operation_type),
        orderId: op.order_id || undefined,
        showtimeId: op.showtime_id || undefined,
        details: op.details ? JSON.stringify(op.details) : '',
        createdAt: new Date(op.created_at)
      }));
    } catch (error) {
      console.error(`从Supabase获取员工(ID:${staffId})操作记录失败，使用本地数据:`, error);
      
      // 使用本地数据作为回退
      return mockStaffOperations.filter(op => op.staffId === staffId);
    }
  }
}; 