import { Movie, Theater, Showtime, Order, User, Seat, OrderStatus, StaffOperation, StaffOperationType, TicketType } from '../types';
import { mockMovies, mockTheaters, mockShowtimes, mockOrders, mockUsers, mockStaffOperations, defaultImages } from '../mockData';

/**
 * 处理图片URL，避免跨域问题
 * 将豆瓣图片URL替换为本地默认图片
 */
export const processImageUrl = (url: string): string => {
  if (!url || url.includes('douban')) {
    return defaultImages.moviePoster;
  }
  return url;
};

/**
 * 数据服务层
 * 所有与数据相关的获取、筛选、处理逻辑都集中在这里
 * 未来切换到真实API时只需要修改这个文件
 */

// 电影相关服务
export const MovieService = {
  // 获取所有电影
  getAllMovies: (): Promise<Movie[]> => {
    // 处理所有电影的图片URL
    const processedMovies = mockMovies.map(movie => ({
      ...movie,
      poster: processImageUrl(movie.poster)
    }));
    return Promise.resolve(processedMovies);
  },
  
  // 根据ID获取电影
  getMovieById: (id: string): Promise<Movie | undefined> => {
    const movie = mockMovies.find(movie => movie.id === id);
    if (movie) {
      // 处理电影图片URL
      return Promise.resolve({
        ...movie,
        poster: processImageUrl(movie.poster)
      });
    }
    return Promise.resolve(movie);
  },
  
  // 根据条件筛选电影
  getMoviesByFilter: (filter: {
    genre?: string;
    search?: string;
  }): Promise<Movie[]> => {
    let filteredMovies = [...mockMovies];
    
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
    
    // 处理所有电影的图片URL
    const processedMovies = filteredMovies.map(movie => ({
      ...movie,
      poster: processImageUrl(movie.poster)
    }));
    
    return Promise.resolve(processedMovies);
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
  // 获取所有影厅
  getAllTheaters: (): Promise<Theater[]> => {
    return Promise.resolve(mockTheaters);
  },
  
  // 根据ID获取影厅
  getTheaterById: (id: string): Promise<Theater | undefined> => {
    const theater = mockTheaters.find(theater => theater.id === id);
    return Promise.resolve(theater);
  }
};

// 场次相关服务
export const ShowtimeService = {
  // 获取所有场次
  getAllShowtimes: (): Promise<Showtime[]> => {
    return Promise.resolve(mockShowtimes);
  },
  
  // 根据电影ID获取场次
  getShowtimesByMovieId: (movieId: string): Promise<Showtime[]> => {
    const showtimes = mockShowtimes.filter(showtime => showtime.movieId === movieId);
    return Promise.resolve(showtimes);
  },
  
  // 获取今日场次
  getTodayShowtimes: (): Promise<Showtime[]> => {
    const today = new Date();
    const todayShowtimes = mockShowtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      return (
        showtimeDate.getDate() === today.getDate() &&
        showtimeDate.getMonth() === today.getMonth() &&
        showtimeDate.getFullYear() === today.getFullYear()
      );
    });
    return Promise.resolve(todayShowtimes);
  },
  
  // 根据ID获取场次
  getShowtimeById: (id: string): Promise<Showtime | undefined> => {
    const showtime = mockShowtimes.find(showtime => showtime.id === id);
    return Promise.resolve(showtime);
  },
  
  // 获取场次的可用座位
  getAvailableSeats: (showtimeId: string): Promise<Seat[]> => {
    const showtime = mockShowtimes.find(s => s.id === showtimeId);
    if (!showtime) {
      return Promise.resolve([]);
    }
    return Promise.resolve(showtime.availableSeats.filter(seat => seat.available));
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
  getAllOrders: (): Promise<Order[]> => {
    return Promise.resolve(mockOrders);
  },
  
  // 根据用户ID获取订单
  getOrdersByUserId: (userId: string): Promise<Order[]> => {
    const orders = mockOrders.filter(order => order.userId === userId);
    return Promise.resolve(orders);
  },
  
  // 根据ID获取订单
  getOrderById: (id: string): Promise<Order | undefined> => {
    const order = mockOrders.find(order => order.id === id);
    return Promise.resolve(order);
  },
  
  // 创建订单
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    const newOrder: Order = {
      ...order,
      id: `order${mockOrders.length + 1}`,
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
  getAllUsers: (): Promise<User[]> => {
    return Promise.resolve(mockUsers);
  },
  
  // 根据ID获取用户
  getUserById: (id: string): Promise<User | undefined> => {
    const user = mockUsers.find(user => user.id === id);
    return Promise.resolve(user);
  }
};

// 工作人员操作服务
export const StaffOperationService = {
  // 获取所有操作记录
  getAllOperations: (): Promise<StaffOperation[]> => {
    return Promise.resolve(mockStaffOperations);
  },
  
  // 获取某员工的操作记录
  getOperationsByStaffId: (staffId: string): Promise<StaffOperation[]> => {
    const operations = mockStaffOperations.filter(op => op.staffId === staffId);
    return Promise.resolve(operations);
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
      // 创建订单
      const newOrder: Order = {
        id: `order${mockOrders.length + 1}`,
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