import { Movie, Theater, Showtime, Order, User } from '../types';
import { mockMovies, mockTheaters, mockShowtimes, mockOrders, mockUsers, defaultImages } from '../mockData';

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
    
    // 在真实应用中，这里会有API调用来保存订单
    // 为了模拟，我们暂时不修改mockOrders数组
    
    return Promise.resolve(newOrder);
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