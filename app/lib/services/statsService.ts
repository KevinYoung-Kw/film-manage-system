import supabase from './supabaseClient';
import { processImageUrl } from './dataService';

/**
 * 统计服务 - 处理系统统计数据相关功能
 */
export const StatsService = {
  /**
   * 获取管理员基础统计数据
   * @returns 统计数据对象
   */
  getAdminStats: async (): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('api_admin_stats')
        .select('*')
        .single();

      if (error) {
        throw new Error('获取管理员统计数据失败: ' + error.message);
      }

      return {
        totalOrders: data.total_orders || 0,
        totalRevenue: data.total_revenue || 0,
        paidOrders: data.paid_orders || 0,
        cancelledOrders: data.cancelled_orders || 0,
        refundedOrders: data.refunded_orders || 0,
        totalUsers: data.total_users || 0,
        customerCount: data.customer_count || 0,
        totalMovies: data.total_movies || 0,
        showingMovies: data.showing_movies || 0,
        upcomingShowtimes: data.upcoming_showtimes || 0
      };
    } catch (error) {
      console.error('获取管理员统计数据失败:', error);
      throw error;
    }
  },

  /**
   * 获取每日收入统计
   * @param days 天数，默认7天
   * @returns 每日收入数据
   */
  getDailyRevenue: async (days: number = 7): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_daily_revenue')
        .select('*')
        .order('date', { ascending: false })
        .limit(days);

      if (error) {
        throw new Error('获取每日收入统计失败: ' + error.message);
      }

      return data.map(item => ({
        date: item.date,
        revenue: item.total_revenue || 0,
        ticketCount: item.ticket_count || 0
      })).reverse();
    } catch (error) {
      console.error('获取每日收入统计失败:', error);
      throw error;
    }
  },

  /**
   * 获取票型分布统计
   * @returns 票型分布数据
   */
  getTicketTypeDistribution: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_ticket_type_distribution')
        .select('*')
        .order('ticket_count', { ascending: false });

      if (error) {
        throw new Error('获取票型分布统计失败: ' + error.message);
      }

      // 计算总票数用于计算百分比
      const totalTickets = data.reduce((sum, item) => sum + (item.ticket_count || 0), 0);

      return data.map(item => ({
        type: item.ticket_type === 'normal' ? '普通票' :
              item.ticket_type === 'student' ? '学生票' :
              item.ticket_type === 'senior' ? '老人票' :
              item.ticket_type === 'child' ? '儿童票' : '其他',
        count: item.ticket_count || 0,
        revenue: item.total_revenue || 0,
        percentage: totalTickets > 0 ? Math.round((item.ticket_count || 0) / totalTickets * 100) : 0
      }));
    } catch (error) {
      console.error('获取票型分布统计失败:', error);
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
        occupancy: Math.round((theater.average_occupancy_rate || 0) * 100)
      }));
    } catch (error) {
      console.error('获取影厅占用率失败:', error);
      throw error;
    }
  },

  /**
   * 获取热门电影榜单
   * @param limit 限制条数，默认5条
   * @returns 热门电影榜单
   */
  getPopularMovies: async (limit: number = 5): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_movie_revenue_ranking')
        .select('*')
        .limit(limit);

      if (error) {
        throw new Error('获取热门电影榜单失败: ' + error.message);
      }

      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        poster: processImageUrl(movie.poster || ''),
        ticketCount: movie.ticket_count || 0,
        totalRevenue: movie.total_revenue || 0,
        releaseDate: movie.release_date || ''
      }));
    } catch (error) {
      console.error('获取热门电影榜单失败:', error);
      throw error;
    }
  },

  /**
   * 获取系统总览统计（包含所有基础统计）
   * @returns 系统总览数据
   */
  getSystemOverview: async (): Promise<any> => {
    try {
      // 获取基础统计
      const basicStats = await StatsService.getAdminStats();
      
      // 获取热门电影
      const popularMovies = await StatsService.getPopularMovies(1);
      const popularMovie = popularMovies.length > 0 ? popularMovies[0].title : '';
      
      // 计算平均上座率
      const theaters = await StatsService.getTheaterOccupancy();
      const averageOccupancy = theaters.length > 0 
        ? Math.round(theaters.reduce((sum, t) => sum + t.occupancy, 0) / theaters.length) 
        : 0;
      
      return {
        totalSales: basicStats.totalRevenue || 0,
        ticketsSold: basicStats.paidOrders || 0,
        averageOccupancy,
        popularMovie,
        totalOrders: basicStats.totalOrders || 0,
        totalUsers: basicStats.totalUsers || 0,
        totalMovies: basicStats.totalMovies || 0
      };
    } catch (error) {
      console.error('获取系统总览统计失败:', error);
      throw error;
    }
  }
}; 