import supabase from './supabaseClient';
import { Movie, MovieStatus } from '../types';
import { processImageUrl } from './dataService';

/**
 * 电影服务 - 处理电影相关功能
 */
export const MovieService = {
  /**
   * 获取所有电影
   * @returns 电影列表
   */
  getAllMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        throw new Error('获取电影列表失败: ' + error.message);
      }

      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster),
        webpPoster: movie.webp_poster ? processImageUrl(movie.webp_poster) : undefined,
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating || 0,
        status: movie.status as MovieStatus || MovieStatus.COMING_SOON
      }));
    } catch (error) {
      console.error('获取电影列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取正在上映的电影
   * @returns 正在上映的电影列表
   */
  getNowShowingMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_now_showing_movies')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        throw new Error('获取正在上映电影失败: ' + error.message);
      }

      return data.map(movie => ({
        id: movie.id!,
        title: movie.title!,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster!),
        webpPoster: movie.webp_poster ? processImageUrl(movie.webp_poster) : undefined,
        duration: movie.duration!,
        director: movie.director!,
        actors: movie.actors || [],
        cast: movie.cast || undefined,
        description: movie.description!,
        releaseDate: new Date(movie.release_date!),
        genre: movie.genre || [],
        rating: movie.rating || 0,
        status: movie.status as MovieStatus || MovieStatus.SHOWING,
        showtimeCount: movie.showtime_count || 0
      }));
    } catch (error) {
      console.error('获取正在上映电影失败:', error);
      throw error;
    }
  },

  /**
   * 获取即将上映的电影
   * @returns 即将上映的电影列表
   */
  getComingSoonMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_coming_soon_movies')
        .select('*')
        .order('release_date', { ascending: true });

      if (error) {
        throw new Error('获取即将上映电影失败: ' + error.message);
      }

      return data.map(movie => ({
        id: movie.id!,
        title: movie.title!,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster!),
        webpPoster: movie.webp_poster ? processImageUrl(movie.webp_poster) : undefined,
        duration: movie.duration!,
        director: movie.director!,
        actors: movie.actors || [],
        cast: movie.cast || undefined,
        description: movie.description!,
        releaseDate: new Date(movie.release_date!),
        genre: movie.genre || [],
        rating: movie.rating || 0,
        status: movie.status as MovieStatus || MovieStatus.COMING_SOON
      }));
    } catch (error) {
      console.error('获取即将上映电影失败:', error);
      throw error;
    }
  },

  /**
   * 获取电影详情
   * @param movieId 电影ID
   * @returns 电影详情
   */
  getMovieById: async (movieId: string): Promise<Movie | null> => {
    try {
      const { data, error } = await supabase
        .from('vw_movie_details')
        .select('*')
        .eq('id', movieId)
        .single();

      if (error || !data) {
        console.error('获取电影详情失败:', error);
        return null;
      }

      return {
        id: data.id!,
        title: data.title!,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster!),
        webpPoster: data.webp_poster ? processImageUrl(data.webp_poster) : undefined,
        duration: data.duration!,
        director: data.director!,
        actors: data.actors || [],
        cast: data.cast || undefined,
        description: data.description!,
        releaseDate: new Date(data.release_date!),
        genre: data.genre || [],
        rating: data.rating || 0,
        status: data.status as MovieStatus || MovieStatus.COMING_SOON,
        totalShowtimes: data.total_showtimes || 0,
        totalOrders: data.total_orders || 0,
        totalRevenue: data.total_revenue || 0
      };
    } catch (error) {
      console.error('获取电影详情失败:', error);
      return null;
    }
  },

  /**
   * 添加电影
   * @param movie 电影信息
   * @returns 添加的电影信息
   */
  addMovie: async (movie: Omit<Movie, 'id'>): Promise<Movie | null> => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .insert([{
          title: movie.title,
          original_title: movie.originalTitle,
          poster: movie.poster,
          webp_poster: movie.webpPoster,
          duration: movie.duration,
          director: movie.director,
          actors: movie.actors,
          cast: movie.cast,
          description: movie.description,
          release_date: movie.releaseDate.toISOString().split('T')[0],
          genre: movie.genre,
          rating: movie.rating,
          status: movie.status || 'coming_soon'
        }])
        .select()
        .single();

      if (error || !data) {
        throw new Error('添加电影失败: ' + error?.message || '未知错误');
      }

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster),
        webpPoster: data.webp_poster ? processImageUrl(data.webp_poster) : undefined,
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating || 0,
        status: data.status as MovieStatus || MovieStatus.COMING_SOON
      };
    } catch (error) {
      console.error('添加电影失败:', error);
      throw error;
    }
  },

  /**
   * 更新电影信息
   * @param movieId 电影ID
   * @param movieData 更新的电影数据
   * @returns 更新后的电影信息
   */
  updateMovie: async (movieId: string, movieData: Partial<Movie>): Promise<Movie | null> => {
    try {
      // 转换为数据库格式
      const updateData: any = {};
      if (movieData.title !== undefined) updateData.title = movieData.title;
      if (movieData.originalTitle !== undefined) updateData.original_title = movieData.originalTitle;
      if (movieData.poster !== undefined) updateData.poster = movieData.poster;
      if (movieData.webpPoster !== undefined) updateData.webp_poster = movieData.webpPoster;
      if (movieData.duration !== undefined) updateData.duration = movieData.duration;
      if (movieData.director !== undefined) updateData.director = movieData.director;
      if (movieData.actors !== undefined) updateData.actors = movieData.actors;
      if (movieData.cast !== undefined) updateData.cast = movieData.cast;
      if (movieData.description !== undefined) updateData.description = movieData.description;
      if (movieData.releaseDate !== undefined) updateData.release_date = movieData.releaseDate.toISOString().split('T')[0];
      if (movieData.genre !== undefined) updateData.genre = movieData.genre;
      if (movieData.rating !== undefined) updateData.rating = movieData.rating;
      if (movieData.status !== undefined) updateData.status = movieData.status;

      const { data, error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movieId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('更新电影信息失败: ' + error?.message || '未知错误');
      }

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster),
        webpPoster: data.webp_poster ? processImageUrl(data.webp_poster) : undefined,
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating || 0,
        status: data.status as MovieStatus || MovieStatus.COMING_SOON
      };
    } catch (error) {
      console.error('更新电影信息失败:', error);
      throw error;
    }
  },

  /**
   * 更新电影状态
   * @param movieId 电影ID
   * @param status 新状态
   * @returns 是否成功
   */
  updateMovieStatus: async (movieId: string, status: MovieStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('movies')
        .update({ status })
        .eq('id', movieId);

      if (error) {
        throw new Error('更新电影状态失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('更新电影状态失败:', error);
      throw error;
    }
  },

  /**
   * 删除电影
   * @param movieId 电影ID
   * @returns 是否成功
   */
  deleteMovie: async (movieId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movieId);

      if (error) {
        throw new Error('删除电影失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除电影失败:', error);
      throw error;
    }
  },

  /**
   * 获取电影排行榜
   * @param limit 限制数量
   * @returns 电影排行榜
   */
  getMovieRanking: async (limit = 10): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_movie_revenue_ranking')
        .select('*')
        .limit(limit);

      if (error) {
        throw new Error('获取电影排行榜失败: ' + error.message);
      }

      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        poster: processImageUrl(movie.poster || ''),
        releaseDate: new Date(movie.release_date || new Date()),
        ticketCount: movie.ticket_count || 0,
        totalRevenue: movie.total_revenue || 0
      }));
    } catch (error) {
      console.error('获取电影排行榜失败:', error);
      throw error;
    }
  }
}; 