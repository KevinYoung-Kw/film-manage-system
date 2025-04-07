/**
 * 应用中的路由定义和导航逻辑
 * 集中管理所有路由路径，确保页面之间的交互连贯
 */

// 用户相关路由
export const userRoutes = {
  // 身份验证相关
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  
  // 用户中心
  profile: '/user/profile',
  orders: '/user/orders',
  favorites: '/user/favorites',
  settings: '/user/settings',
  
  // 购票流程
  movieList: '/',
  movieDetail: (id: string) => `/movies/${id}`,
  showtime: (movieId: string) => `/movies/${movieId}/showtimes`,
  selectSeats: (showtimeId: string) => `/showtimes/${showtimeId}`,
  checkout: (showtimeId: string) => `/payment?showtimeId=${showtimeId}`,
  orderSuccess: (orderId: string) => `/orders/${orderId}/success`,
};

// 工作人员相关路由
export const staffRoutes = {
  dashboard: '/staff',
  sell: '/staff/sell',
  sellMovie: (movieId: string) => `/staff/sell/movie/${movieId}`,
  sellShowtime: (movieId: string) => `/staff/sell/movie/${movieId}/showtimes`,
  sellSeats: (showtimeId: string) => `/staff/sell/showtime/${showtimeId}/seats`,
  sellCheckout: (showtimeId: string) => `/staff/sell/showtime/${showtimeId}/checkout`,
  sellSuccess: (orderId: string) => `/staff/sell/order/${orderId}/success`,
  
  check: '/staff/check',
  refund: '/staff/refund',
  history: '/staff/history',
};

// 管理员相关路由
export const adminRoutes = {
  dashboard: '/admin',
  
  // 电影管理
  movies: '/admin/movies',
  movieCreate: '/admin/movies/create',
  movieEdit: (id: string) => `/admin/movies/${id}/edit`,
  
  // 排片管理
  showtimes: '/admin/showtimes',
  showtimeCreate: '/admin/showtimes/create',
  showtimeEdit: (id: string) => `/admin/showtimes/${id}/edit`,
  
  // 订单管理
  orders: '/admin/orders',
  orderDetail: (id: string) => `/admin/orders/${id}`,
  
  // 用户管理
  users: '/admin/users',
  userCreate: '/admin/users/create',
  userEdit: (id: string) => `/admin/users/${id}/edit`,
  
  // 系统设置
  settings: '/admin/settings',
};

// 导航工具函数
export const navigationUtils = {
  /**
   * 构建包含查询参数的URL
   */
  buildUrl: (base: string, params: Record<string, string | number | boolean>) => {
    const url = new URL(base, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
    return url.pathname + url.search;
  },
  
  /**
   * 从URL中获取查询参数
   */
  getQueryParam: (param: string) => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
}; 