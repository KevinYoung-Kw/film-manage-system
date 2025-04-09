import supabase from './supabaseClient';
import { Movie, MovieStatus } from '../types';
import { processImageUrl } from './dataService';

// 电影服务：处理电影的增删改查功能
export const MovieService = {
  // 获取所有电影
  getAllMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('获取电影列表失败:', error);
        return [];
      }

      // 转换数据结构以匹配应用中的Movie类型
      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster),
        webpPoster: movie.webp_poster ? movie.webp_poster : processImageUrl(movie.poster, true),
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating,
        status: movie.status as MovieStatus
      }));
    } catch (error) {
      console.error('获取电影列表失败:', error);
      return [];
    }
  },

  // 根据ID获取电影
  getMovieById: async (id: string): Promise<Movie | undefined> => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取电影失败:', error);
        return undefined;
      }

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster),
        webpPoster: data.webp_poster ? data.webp_poster : processImageUrl(data.poster, true),
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating,
        status: data.status as MovieStatus
      };
    } catch (error) {
      console.error('获取电影失败:', error);
      return undefined;
    }
  },

  // 根据条件筛选电影
  getMoviesByFilter: async (filter: {
    genre?: string;
    search?: string;
    status?: MovieStatus;
  }): Promise<Movie[]> => {
    try {
      // 构建查询
      let query = supabase.from('movies').select('*');

      // 添加过滤条件
      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.genre) {
        // PostgreSQL数组包含查询
        query = query.contains('genre', [filter.genre]);
      }

      if (filter.search) {
        // 模糊搜索
        query = query.or(`title.ilike.%${filter.search}%,director.ilike.%${filter.search}%`);
      }

      // 执行查询
      const { data, error } = await query.order('release_date', { ascending: false });

      if (error) {
        console.error('筛选电影失败:', error);
        return [];
      }

      // 转换数据结构
      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster),
        webpPoster: movie.webp_poster ? movie.webp_poster : processImageUrl(movie.poster, true),
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating,
        status: movie.status as MovieStatus
      }));
    } catch (error) {
      console.error('筛选电影失败:', error);
      return [];
    }
  },

  // 获取正在上映的电影
  getNowShowingMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_now_showing_movies')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.error('获取上映电影失败:', error);
        return [];
      }

      // 转换数据结构
      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster),
        webpPoster: movie.webp_poster ? movie.webp_poster : processImageUrl(movie.poster, true),
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating,
        status: movie.status as MovieStatus
      }));
    } catch (error) {
      console.error('获取上映电影失败:', error);
      return [];
    }
  },

  // 获取即将上映的电影
  getComingSoonMovies: async (): Promise<Movie[]> => {
    try {
      const { data, error } = await supabase
        .from('vw_coming_soon_movies')
        .select('*')
        .order('release_date', { ascending: true });

      if (error) {
        console.error('获取即将上映电影失败:', error);
        return [];
      }

      // 转换数据结构
      return data.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.original_title || undefined,
        poster: processImageUrl(movie.poster),
        webpPoster: movie.webp_poster ? movie.webp_poster : processImageUrl(movie.poster, true),
        duration: movie.duration,
        director: movie.director,
        actors: movie.actors,
        cast: movie.cast || undefined,
        description: movie.description,
        releaseDate: new Date(movie.release_date),
        genre: movie.genre,
        rating: movie.rating,
        status: movie.status as MovieStatus
      }));
    } catch (error) {
      console.error('获取即将上映电影失败:', error);
      return [];
    }
  },

  // 添加新电影 (仅管理员权限)
  addMovie: async (movie: Omit<Movie, 'id'>): Promise<Movie | null> => {
    try {
      // 将Movie类型转换为数据库结构
      const { data, error } = await supabase
        .from('movies')
        .insert({
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
        })
        .select()
        .single();

      if (error) {
        console.error('添加电影失败:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster),
        webpPoster: data.webp_poster ? data.webp_poster : processImageUrl(data.poster, true),
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating,
        status: data.status as MovieStatus
      };
    } catch (error) {
      console.error('添加电影失败:', error);
      return null;
    }
  },

  // 更新电影信息 (仅管理员权限)
  updateMovie: async (id: string, movieData: Partial<Movie>): Promise<Movie | null> => {
    try {
      // 构建更新数据
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
      if (movieData.releaseDate !== undefined) {
        updateData.release_date = movieData.releaseDate.toISOString().split('T')[0];
      }
      if (movieData.genre !== undefined) updateData.genre = movieData.genre;
      if (movieData.rating !== undefined) updateData.rating = movieData.rating;
      if (movieData.status !== undefined) updateData.status = movieData.status;

      // 执行更新
      const { data, error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新电影失败:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        originalTitle: data.original_title || undefined,
        poster: processImageUrl(data.poster),
        webpPoster: data.webp_poster ? data.webp_poster : processImageUrl(data.poster, true),
        duration: data.duration,
        director: data.director,
        actors: data.actors,
        cast: data.cast || undefined,
        description: data.description,
        releaseDate: new Date(data.release_date),
        genre: data.genre,
        rating: data.rating,
        status: data.status as MovieStatus
      };
    } catch (error) {
      console.error('更新电影失败:', error);
      return null;
    }
  },

  // 删除电影 (仅管理员权限)
  deleteMovie: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('删除电影失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('删除电影失败:', error);
      return false;
    }
  }
}; 