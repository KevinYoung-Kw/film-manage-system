import { Movie, Theater, Showtime, Order, User, Seat, OrderStatus, StaffOperation, StaffOperationType, TicketType, TicketStatus } from '../types';
import { mockMovies, mockTheaters, mockShowtimes, mockOrders, mockUsers, mockStaffOperations, defaultImages } from '../mockData';
import { 
  MovieFallbackService, 
  TheaterFallbackService, 
  ShowtimeFallbackService, 
  OrderFallbackService, 
  UserFallbackService, 
  StaffOperationFallbackService 
} from './fallbackService';

/**
 * 处理图片URL，避免跨域问题
 * 将豆瓣图片URL替换为本地默认图片
 */
export const processImageUrl = (url: string, useWebp: boolean = false): string => {
  if (!url || url.includes('douban')) {
    return useWebp ? defaultImages.webpMoviePoster : defaultImages.moviePoster;
  }
  return url;
};

/**
 * 处理Banner图片URL
 * 优先返回webp格式的图片
 */
export const processBannerUrl = (banner: any): string => {
  if (!banner) {
    return defaultImages.webpBanner || defaultImages.banner;
  }
  
  return banner.webpImageUrl || banner.imageUrl || defaultImages.webpBanner || defaultImages.banner;
};

/**
 * 生成座位数据的辅助函数
 */
export const generateSeats = (theater: Theater): Seat[] => {
  const seats: Seat[] = [];
  
  // 首先检查剧院是否已存在已保存的布局
  const savedLayout = TheaterService._seatLayoutTypes.get(theater.id);
  
  if (savedLayout) {
    // 如果有保存的布局，使用它来生成座位
    for (let row = 1; row <= theater.rows; row++) {
      for (let col = 1; col <= theater.columns; col++) {
        // 获取布局类型（需要调整索引，因为布局数组从0开始）
        const layoutRow = row - 1;
        const layoutCol = col - 1;
        
        // 检查索引是否在范围内
        let type: 'normal' | 'vip' | 'couple' | 'disabled' = 'normal';
        let shouldAddSeat = true;
        
        if (
          layoutRow >= 0 && 
          layoutRow < savedLayout.length && 
          layoutCol >= 0 && 
          layoutCol < savedLayout[layoutRow].length
        ) {
          const layoutType = savedLayout[layoutRow][layoutCol];
          if (layoutType === 'empty') {
            shouldAddSeat = false; // 空位不添加
          } else if (layoutType === 'vip' || layoutType === 'couple' || layoutType === 'disabled') {
            type = layoutType as 'vip' | 'couple' | 'disabled';
          }
        }
        
        if (shouldAddSeat) {
          seats.push({
            id: `seat-${theater.id}-${row}-${col}`,
            row,
            column: col,
            type,
            available: Math.random() > 0.2 // 随机可用性
          });
        }
      }
    }
  } else {
    // 如果没有保存的布局，使用默认逻辑
    for (let row = 1; row <= theater.rows; row++) {
      for (let col = 1; col <= theater.columns; col++) {
        let type: 'normal' | 'vip' | 'couple' | 'disabled' = 'normal';
        
        if ((row === 1 && col === 1) || (row === theater.rows && col === theater.columns)) {
          type = 'couple';
        } else if (row === Math.floor(theater.rows / 2) || row === Math.floor(theater.rows / 2) + 1) {
          type = 'vip';
        } else if (row === theater.rows && col === 1) {
          type = 'disabled';
        }
        
        seats.push({
          id: `seat-${theater.id}-${row}-${col}`,
          row,
          column: col,
          type,
          available: Math.random() > 0.2
        });
      }
    }
  }
  
  return seats;
};

/**
 * 数据服务层
 * 所有与数据相关的获取、筛选、处理逻辑都集中在这里
 * 优先从Supabase获取数据，失败时使用本地静态数据
 */

// 电影相关服务
export const MovieService = {
  // 获取所有电影
  getAllMovies: async (): Promise<Movie[]> => {
    return MovieFallbackService.getAllMovies(processImageUrl);
  },
  
  // 根据ID获取电影
  getMovieById: async (id: string): Promise<Movie | undefined> => {
    return MovieFallbackService.getMovieById(id, processImageUrl);
  },
  
  // 根据条件筛选电影
  getMoviesByFilter: async (filter: {
    genre?: string;
    search?: string;
  }): Promise<Movie[]> => {
    try {
      // 先获取所有电影
      const allMovies = await MovieFallbackService.getAllMovies(processImageUrl);
      
      // 进行客户端筛选
      let filteredMovies = [...allMovies];
      
      if (filter.genre) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.genre.includes(filter.genre!)
        );
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredMovies = filteredMovies.filter(movie => 
          movie.title.toLowerCase().includes(searchLower) ||
          movie.director.toLowerCase().includes(searchLower) ||
          movie.actors.some(actor => actor.toLowerCase().includes(searchLower))
        );
      }
      
      return filteredMovies;
    } catch (error) {
      console.error('筛选电影失败:', error);
      return [];
    }
  },
  
  // 添加新电影
  addMovie: (movie: Omit<Movie, 'id'>): Promise<Movie> => {
    const newId = `movie${mockMovies.length + 1}`;
    const newMovie: Movie = {
      ...movie,
      id: newId
    };
    
    mockMovies.push(newMovie);
    return Promise.resolve(newMovie);
  },
  
  // 更新电影信息
  updateMovie: (id: string, movieData: Partial<Movie>): Promise<Movie | null> => {
    const movieIndex = mockMovies.findIndex(movie => movie.id === id);
    if (movieIndex === -1) {
      return Promise.resolve(null);
    }
    
    const updatedMovie = {
      ...mockMovies[movieIndex],
      ...movieData
    };
    
    mockMovies[movieIndex] = updatedMovie;
    return Promise.resolve(updatedMovie);
  },
  
  // 删除电影
  deleteMovie: (id: string): Promise<boolean> => {
    const initialLength = mockMovies.length;
    const filteredMovies = mockMovies.filter(movie => movie.id !== id);
    
    // 如果有变化，更新数组
    if (filteredMovies.length !== initialLength) {
      mockMovies.length = 0;
      mockMovies.push(...filteredMovies);
      return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
  }
};

// 影厅相关服务
export const TheaterService = {
  // 存储座位类型布局
  _seatLayoutTypes: new Map<string, Array<Array<string>>>(),
  
  // 获取所有影厅
  getAllTheaters: async (): Promise<Theater[]> => {
    return TheaterFallbackService.getAllTheaters();
  },
  
  // 根据ID获取影厅
  getTheaterById: async (id: string): Promise<Theater | undefined> => {
    return TheaterFallbackService.getTheaterById(id);
  },
  
  // 更新影厅信息
  updateTheater: (id: string, theaterData: Partial<Theater>): Promise<Theater | null> => {
    const theaterIndex = mockTheaters.findIndex(theater => theater.id === id);
    if (theaterIndex === -1) {
      return Promise.resolve(null);
    }
    
    const updatedTheater = {
      ...mockTheaters[theaterIndex],
      ...theaterData
    };
    
    mockTheaters[theaterIndex] = updatedTheater;
    
    // 如果存在与该影厅关联的场次，也要更新这些场次的信息
    mockShowtimes.forEach(showtime => {
      if (showtime.theaterId === id) {
        // 仅在需要时更新座位信息
        if (theaterData.rows !== undefined || theaterData.columns !== undefined || theaterData.totalSeats !== undefined) {
          showtime.availableSeats = generateSeats(updatedTheater);
        }
      }
    });
    
    return Promise.resolve(updatedTheater);
  },
  
  // 添加新影厅
  addTheater: (theater: Omit<Theater, 'id'>): Promise<Theater> => {
    const newId = `theater${mockTheaters.length + 1}`;
    const newTheater: Theater = {
      ...theater,
      id: newId
    };
    
    mockTheaters.push(newTheater);
    return Promise.resolve(newTheater);
  },
  
  // 删除影厅
  deleteTheater: (id: string): Promise<boolean> => {
    const initialLength = mockTheaters.length;
    const filteredTheaters = mockTheaters.filter(theater => theater.id !== id);
    
    // 如果有变化，更新数组
    if (filteredTheaters.length !== initialLength) {
      mockTheaters.length = 0;
      mockTheaters.push(...filteredTheaters);
      return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
  },
  
  // 更新影厅座位布局
  updateTheaterLayout: (id: string, rows: number, columns: number): Promise<Theater | null> => {
    const theaterIndex = mockTheaters.findIndex(theater => theater.id === id);
    if (theaterIndex === -1) {
      return Promise.resolve(null);
    }
    
    const updatedTheater = {
      ...mockTheaters[theaterIndex],
      rows,
      columns,
      totalSeats: rows * columns
    };
    
    mockTheaters[theaterIndex] = updatedTheater;
    
    // 同时更新所有使用此影厅的场次的座位信息
    mockShowtimes.forEach(showtime => {
      if (showtime.theaterId === id) {
        showtime.availableSeats = generateSeats(updatedTheater);
      }
    });
    
    return Promise.resolve(updatedTheater);
  },
  
  // 获取座位类型布局
  getSeatLayoutTypes: (theaterId: string): Promise<Array<Array<string>> | null> => {
    const layout = TheaterService._seatLayoutTypes.get(theaterId) || null;
    return Promise.resolve(layout);
  },
  
  // 更新座位类型布局
  updateSeatLayoutTypes: (theaterId: string, layout: Array<Array<string>>): Promise<boolean> => {
    TheaterService._seatLayoutTypes.set(theaterId, layout);
    
    // 更新相关场次的座位类型
    // 这里我们需要将二维布局数组转换为Seat对象数组
    const theater = mockTheaters.find(theater => theater.id === theaterId);
    if (!theater) return Promise.resolve(false);
    
    mockShowtimes.forEach(showtime => {
      if (showtime.theaterId === theaterId) {
        // 先获取现有的座位信息，以保留可用状态
        const existingSeats = new Map(
          showtime.availableSeats.map(seat => [
            `${seat.row}-${seat.column}`,
            seat.available
          ])
        );
        
        // 创建新的座位数组，使用布局信息更新类型
        const newSeats = [];
        for (let row = 1; row <= theater.rows; row++) {
          for (let col = 1; col <= theater.columns; col++) {
            // 读取对应位置的座位类型（需要调整索引：二维数组从0开始，座位从1开始）
            const layoutRow = row - 1;
            const layoutCol = col - 1;
            
            // 判断索引是否在布局数组范围内
            let type: 'normal' | 'vip' | 'couple' | 'disabled' = 'normal';
            if (
              layoutRow >= 0 && 
              layoutRow < layout.length && 
              layoutCol >= 0 && 
              layoutCol < layout[layoutRow].length
            ) {
              const layoutType = layout[layoutRow][layoutCol];
              // 将字符串类型转换为Seat接口需要的类型
              if (layoutType === 'vip' || layoutType === 'couple' || layoutType === 'disabled') {
                type = layoutType;
              } else if (layoutType !== 'empty') {
                // empty不是Seat类型，所以不能用于availableSeats
                type = 'normal';
              }
            }
            
            // 获取座位的可用状态，如果存在的话，否则默认为可用
            const seatKey = `${row}-${col}`;
            const available = existingSeats.has(seatKey) 
              ? existingSeats.get(seatKey) 
              : (layoutRow >= 0 && 
                 layoutRow < layout.length && 
                 layoutCol >= 0 && 
                 layoutCol < layout[layoutRow].length && 
                 layout[layoutRow][layoutCol] !== 'empty');
            
            // 只添加非empty的座位
            if (type === 'normal' || type === 'vip' || type === 'couple' || type === 'disabled') {
              newSeats.push({
                id: `seat-${theater.id}-${row}-${col}`,
                row,
                column: col,
                type,
                available: !!available // 确保是布尔值
              });
            }
          }
        }
        
        // 更新场次的座位信息
        showtime.availableSeats = newSeats;
      }
    });
    
    return Promise.resolve(true);
  }
};

// 场次相关服务
export const ShowtimeService = {
  // 获取所有场次
  getAllShowtimes: async (): Promise<Showtime[]> => {
    return ShowtimeFallbackService.getAllShowtimes();
  },
  
  // 根据电影ID获取场次
  getShowtimesByMovieId: async (movieId: string): Promise<Showtime[]> => {
    const showtimes = await ShowtimeFallbackService.getAllShowtimes();
    return showtimes.filter(showtime => showtime.movieId === movieId);
  },
  
  // 获取今日场次
  getTodayShowtimes: async (): Promise<Showtime[]> => {
    return ShowtimeFallbackService.getTodayShowtimes();
  },
  
  // 根据ID获取场次
  getShowtimeById: async (id: string): Promise<Showtime | undefined> => {
    const showtimes = await ShowtimeFallbackService.getAllShowtimes();
    return showtimes.find(showtime => showtime.id === id);
  },
  
  // 获取场次的可用座位
  getAvailableSeats: async (showtimeId: string): Promise<Seat[]> => {
    const showtime = await ShowtimeService.getShowtimeById(showtimeId);
    if (!showtime) {
      return [];
    }
    return showtime.availableSeats.filter(seat => seat.available);
  },
  
  // 更新座位状态
  updateSeatStatus: (showtimeId: string, seatIds: string[], isAvailable: boolean): Promise<boolean> => {
    const showtime = mockShowtimes.find(s => s.id === showtimeId);
    if (!showtime) {
      return Promise.resolve(false);
    }
    
    showtime.availableSeats = showtime.availableSeats.map(seat => {
      if (seatIds.includes(seat.id)) {
        return { ...seat, available: isAvailable };
      }
      return seat;
    });
    
    return Promise.resolve(true);
  },
  
  // 添加新场次
  addShowtime: (showtime: Omit<Showtime, 'id'>): Promise<Showtime> => {
    const newId = `showtime${mockShowtimes.length + 1}`;
    const newShowtime: Showtime = {
      ...showtime,
      id: newId
    };
    
    mockShowtimes.push(newShowtime);
    return Promise.resolve(newShowtime);
  },
  
  // 更新场次信息
  updateShowtime: (id: string, showtimeData: Partial<Showtime>): Promise<Showtime | null> => {
    const showtimeIndex = mockShowtimes.findIndex(showtime => showtime.id === id);
    if (showtimeIndex === -1) {
      return Promise.resolve(null);
    }
    
    const updatedShowtime = {
      ...mockShowtimes[showtimeIndex],
      ...showtimeData
    };
    
    mockShowtimes[showtimeIndex] = updatedShowtime;
    return Promise.resolve(updatedShowtime);
  },
  
  // 删除场次
  deleteShowtime: (id: string): Promise<boolean> => {
    const initialLength = mockShowtimes.length;
    const filteredShowtimes = mockShowtimes.filter(showtime => showtime.id !== id);
    
    // 如果有变化，更新数组
    if (filteredShowtimes.length !== initialLength) {
      mockShowtimes.length = 0;
      mockShowtimes.push(...filteredShowtimes);
      return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
  }
};

// 订单相关服务
export const OrderService = {
  // 获取所有订单
  getAllOrders: async (): Promise<Order[]> => {
    return OrderFallbackService.getAllOrders();
  },
  
  // 根据用户ID获取订单
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    return OrderFallbackService.getOrdersByUserId(userId);
  },
  
  // 根据ID获取订单
  getOrderById: async (id: string): Promise<Order | undefined> => {
    const orders = await OrderFallbackService.getAllOrders();
    return orders.find(order => order.id === id);
  },
  
  // 创建订单
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    // 生成订单号：TK + 年月日 + 4位序号
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 生成4位序号，从现有订单数量+1开始
    const orderCount = mockOrders.length + 1;
    const serialNumber = String(orderCount).padStart(4, '0');
    
    const orderId = `TK${year.toString().slice(-2)}${month}${day}${serialNumber}`;
    
    const newOrder: Order = {
      ...order,
      id: orderId,
      createdAt: new Date()
    };
    
    // 添加新订单到 mockOrders 数组
    mockOrders.push(newOrder);
    
    // 更新场次中的座位状态
    const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
    if (showtime) {
      showtime.availableSeats = showtime.availableSeats.map(seat => {
        if (order.seats.includes(seat.id)) {
          return { ...seat, available: false };
        }
        return seat;
      });
    }
    
    return Promise.resolve(newOrder);
  },
  
  // 更新订单状态
  updateOrderStatus: (orderId: string, status: OrderStatus): Promise<Order | null> => {
    const orderIndex = mockOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      return Promise.resolve(null);
    }
    
    // 克隆订单并更新状态
    const updatedOrder = { 
      ...mockOrders[orderIndex],
      status 
    };
    
    // 根据状态设置相应的时间戳
    switch (status) {
      case OrderStatus.PAID:
        updatedOrder.paidAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updatedOrder.cancelledAt = new Date();
        break;
      case OrderStatus.REFUNDED:
        updatedOrder.refundedAt = new Date();
        break;
    }
    
    // 更新订单
    mockOrders[orderIndex] = updatedOrder;
    
    return Promise.resolve(updatedOrder);
  },
  
  // 取消订单并释放座位
  cancelOrder: (orderId: string): Promise<Order | null> => {
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return Promise.resolve(null);
    }
    
    // 更新订单状态
    const updatedOrder = { 
      ...order,
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date()
    };
    
    // 更新订单数组
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      mockOrders[orderIndex] = updatedOrder;
    }
    
    // 释放座位
    const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
    if (showtime) {
      showtime.availableSeats = showtime.availableSeats.map(seat => {
        if (order.seats.includes(seat.id)) {
          return { ...seat, available: true };
        }
        return seat;
      });
    }
    
    return Promise.resolve(updatedOrder);
  }
};

// 用户相关服务
export const UserService = {
  // 获取所有用户
  getAllUsers: async (): Promise<User[]> => {
    return UserFallbackService.getAllUsers();
  },
  
  // 根据ID获取用户
  getUserById: async (id: string): Promise<User | undefined> => {
    return UserFallbackService.getUserById(id);
  }
};

// 工作人员操作服务
export const StaffOperationService = {
  // 获取所有操作记录
  getAllOperations: async (): Promise<StaffOperation[]> => {
    return StaffOperationFallbackService.getAllOperations();
  },
  
  // 获取某员工的操作记录
  getOperationsByStaffId: async (staffId: string): Promise<StaffOperation[]> => {
    return StaffOperationFallbackService.getOperationsByStaffId(staffId);
  },
  
  // 添加操作记录
  addOperation: (operation: Omit<StaffOperation, 'id' | 'createdAt'>): Promise<StaffOperation> => {
    const newOperation: StaffOperation = {
      ...operation,
      id: `operation${mockStaffOperations.length + 1}`,
      createdAt: new Date()
    };
    
    mockStaffOperations.push(newOperation);
    return Promise.resolve(newOperation);
  },
  
  // 售票操作
  sellTicket: (
    staffId: string, 
    showtimeId: string, 
    seats: string[], 
    ticketType: TicketType, 
    paymentMethod: string
  ): Promise<Order | null> => {
    // 查找场次
    const showtime = mockShowtimes.find(s => s.id === showtimeId);
    if (!showtime) return Promise.resolve(null);
    
    // 验证座位是否可用
    const availableSeats = showtime.availableSeats.filter(seat => 
      seats.includes(seat.id) && seat.available
    );
    
    if (availableSeats.length !== seats.length) {
      return Promise.resolve(null); // 有座位不可用
    }
    
    try {
      // 生成订单号：TK + 年月日 + 4位序号
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // 生成4位序号，从现有订单数量+1开始
      const orderCount = mockOrders.length + 1;
      const serialNumber = String(orderCount).padStart(4, '0');
      
      const orderId = `TK${year.toString().slice(-2)}${month}${day}${serialNumber}`;
      
      // 创建订单
      const newOrder: Order = {
        id: orderId,
        userId: `staff-customer-${Date.now()}`, // 线下顾客临时ID
        showtimeId,
        seats,
        ticketType,
        totalPrice: seats.length * showtime.price[ticketType],
        status: OrderStatus.PAID, // 线下售票，直接设为已支付
        createdAt: new Date(),
        paidAt: new Date()
      };
      
      // 添加到订单列表
      mockOrders.push(newOrder);
      
      // 更新座位状态
      showtime.availableSeats = showtime.availableSeats.map(seat => {
        if (seats.includes(seat.id)) {
          return { ...seat, available: false };
        }
        return seat;
      });
      
      // 添加操作记录
      const operationDetails = {
        ticketType,
        seats,
        totalPrice: newOrder.totalPrice,
        paymentMethod
      };
      
      mockStaffOperations.push({
        id: `operation${mockStaffOperations.length + 1}`,
        staffId,
        orderId: newOrder.id,
        showtimeId,
        type: StaffOperationType.SELL,
        details: JSON.stringify(operationDetails),
        createdAt: new Date()
      });
      
      return Promise.resolve(newOrder);
    } catch (error) {
      console.error('售票操作失败:', error);
      return Promise.resolve(null);
    }
  },
  
  // 检票操作
  checkTicket: (
    staffId: string,
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    // 查找订单
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return Promise.resolve({ success: false, message: '订单不存在' });
    }
    
    // 验证订单状态
    if (order.status !== OrderStatus.PAID) {
      return Promise.resolve({ success: false, message: '订单未支付，无法检票' });
    }
    
    try {
      // 添加操作记录
      const operationDetails = {
        checkTime: new Date().toISOString(),
        status: 'success'
      };
      
      mockStaffOperations.push({
        id: `operation${mockStaffOperations.length + 1}`,
        staffId,
        orderId,
        showtimeId: order.showtimeId,
        type: StaffOperationType.CHECK,
        details: JSON.stringify(operationDetails),
        createdAt: new Date()
      });
      
      return Promise.resolve({ success: true, message: '检票成功' });
    } catch (error) {
      console.error('检票操作失败:', error);
      return Promise.resolve({ success: false, message: '操作失败，请重试' });
    }
  },
  
  // 退票操作
  refundTicket: (
    staffId: string,
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    // 查找订单
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return Promise.resolve({ success: false, message: '订单不存在' });
    }
    
    // 验证订单状态
    if (order.status !== OrderStatus.PAID) {
      return Promise.resolve({ success: false, message: '只有已支付的订单可以退票' });
    }
    
    try {
      // 更新订单状态
      const orderIndex = mockOrders.findIndex(o => o.id === orderId);
      mockOrders[orderIndex] = {
        ...order,
        status: OrderStatus.REFUNDED,
        refundedAt: new Date()
      };
      
      // 释放座位
      const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
      if (showtime) {
        showtime.availableSeats = showtime.availableSeats.map(seat => {
          if (order.seats.includes(seat.id)) {
            return { ...seat, available: true };
          }
          return seat;
        });
      }
      
      // 添加操作记录
      const operationDetails = {
        refundAmount: order.totalPrice,
        reason,
        refundMethod: 'original'
      };
      
      mockStaffOperations.push({
        id: `operation${mockStaffOperations.length + 1}`,
        staffId,
        orderId,
        showtimeId: order.showtimeId,
        type: StaffOperationType.REFUND,
        details: JSON.stringify(operationDetails),
        createdAt: new Date()
      });
      
      return Promise.resolve({ success: true, message: '退票成功' });
    } catch (error) {
      console.error('退票操作失败:', error);
      return Promise.resolve({ success: false, message: '操作失败，请重试' });
    }
  }
}; 