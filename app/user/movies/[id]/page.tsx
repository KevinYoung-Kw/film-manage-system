'use client';

import React, { useState, useEffect, Component } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Star, Clock, Calendar, Film, User, ChevronDown } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { defaultImages } from '@/app/lib/mockData';
import { Card } from '@/app/components/ui/Card';
import { MovieService } from '@/app/lib/services/movieService';
import { ShowtimeService } from '@/app/lib/services/showtimeService';
import { TheaterService } from '@/app/lib/services/theaterService';
import { userRoutes } from '@/app/lib/utils/navigation';
import { Movie, Showtime, Theater } from '@/app/lib/types';

// 启用调试日志
const DEBUG = true;

// 日志函数
function logDebug(message: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[电影详情][DEBUG] ${message}`, ...args);
  }
}

function logError(message: string, ...args: any[]) {
  console.error(`[电影详情][ERROR] ${message}`, ...args);
}

// 错误边界组件
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError("组件渲染错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <MobileLayout title="电影详情" showBackButton>
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">页面出错</h2>
            <p className="text-slate-500 mb-6 text-center">渲染电影详情时发生错误</p>
            <Link 
              href={userRoutes.movieList}
              prefetch={false}
              replace={true}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              返回电影列表
            </Link>
          </div>
        </MobileLayout>
      );
    }

    return this.props.children;
  }
}

export default function UserMovieDetail() {
  const params = useParams();
  const router = useRouter();
  const movieId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [theaters, setTheaters] = useState<Record<string, Theater>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 添加调试信息
  useEffect(() => {
    logDebug("[DEBUG] 电影详情页初始化, ID:", movieId);
    
    return () => {
      logDebug("[DEBUG] 电影详情页卸载, ID:", movieId);
    };
  }, [movieId]);
  
  useEffect(() => {
    async function fetchData() {
      if (!movieId) {
        logError("[ERROR] 电影ID不存在");
        setError("电影ID不存在");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        logDebug("[DEBUG] 开始获取电影数据, ID:", movieId);
        
        // 获取电影数据并添加更多调试信息
        logDebug("[DEBUG] 调用 MovieService.getMovieById, URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        const movieData = await MovieService.getMovieById(movieId);
        
        if (!movieData) {
          logError("[ERROR] 找不到该电影, ID:", movieId);
          setError("找不到该电影");
          setLoading(false);
          return;
        }
        
        logDebug("[DEBUG] 成功获取电影数据:", movieData);
        setMovie(movieData);
        
        try {
          // 获取该电影的场次
          logDebug("[DEBUG] 开始获取场次数据");
          const showtimesData = await ShowtimeService.getShowtimesByMovieId(movieId);
          setShowtimes(showtimesData || []);
          logDebug("[DEBUG] 场次数据数量:", showtimesData?.length || 0);
          
          // 获取所有影厅信息
          logDebug("[DEBUG] 开始获取影厅数据");
          const allTheaters = await TheaterService.getAllTheaters();
          const theatersMap: Record<string, Theater> = {};
          
          allTheaters.forEach(theater => {
            theatersMap[theater.id] = theater;
          });
          
          setTheaters(theatersMap);
          logDebug("[DEBUG] 影厅数据数量:", Object.keys(theatersMap).length);
        } catch (showtimeError) {
          logError('[ERROR] 获取场次或影厅失败:', showtimeError);
          // 即使加载场次失败，我们仍然显示电影信息
        }
      } catch (error) {
        logError('[ERROR] 获取电影数据失败:', error);
        setError("加载电影数据失败");
      } finally {
        setLoading(false);
        logDebug("[DEBUG] 加载电影数据完成");
      }
    }
    
    fetchData();
  }, [movieId, router]);
  
  // 添加全局错误处理，防止整个应用崩溃
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError('全局错误捕获:', event.error);
      // 防止默认行为（崩溃）
      event.preventDefault();
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // 包装实际的内容渲染
  const renderContent = () => {
    if (loading) {
      return (
        <MobileLayout title="电影详情" showBackButton>
          <div className="flex justify-center items-center p-8 min-h-[70vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-slate-500">加载中...</p>
            </div>
          </div>
        </MobileLayout>
      );
    }
    
    if (error || !movie) {
      return (
        <MobileLayout title="电影详情" showBackButton>
          <div className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
            <div className="bg-red-50 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">出错了</h2>
            <p className="text-slate-500 mb-6 text-center">{error || "无法加载电影信息"}</p>
            <Link 
              href={userRoutes.movieList}
              prefetch={false}
              replace={true}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              返回电影列表
            </Link>
          </div>
        </MobileLayout>
      );
    }
    
    // 安全地获取图片URL
    const posterSrc = movie.webpPoster || movie.poster || defaultImages.webpMoviePoster || defaultImages.moviePoster;
    
    return (
      <MobileLayout title="电影详情" showBackButton>
        {/* 电影封面和基本信息 */}
        <div className="relative w-full h-60 overflow-hidden shadow-lg">
          <Image
            src={posterSrc}
            alt={movie.title || '电影海报'}
            fill
            className="object-cover"
            priority
            unoptimized
            onError={(e) => {
              // 图片加载失败时使用默认图片
              const imgElement = e.currentTarget as HTMLImageElement;
              imgElement.onerror = null; // 防止循环触发
              imgElement.src = defaultImages.moviePoster;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-white text-2xl font-bold">{movie.title}</h1>
                <div className="flex items-center text-yellow-400 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                  <span className="text-sm">{movie.rating.toFixed(1)}</span>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {movie.genre && Array.isArray(movie.genre) ? movie.genre.join(' / ') : '未分类'} | {movie.duration}分钟
                </p>
                <p className="text-white/70 text-xs mt-1">
                  {isValidDate(movie.releaseDate) ? 
                    safeFormatDate(movie.releaseDate, 'yyyy年MM月dd日') : 
                    '日期未知'
                  }上映
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 快速购票按钮 */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-14 z-10">
          <Link
            href={userRoutes.showtime(movie.id)}
            prefetch={false}
            replace={true}
            className="block w-full bg-indigo-600 text-white py-3 rounded-md text-center font-medium"
          >
            立即购票
          </Link>
        </div>
        
        {/* 电影详情 */}
        <div className="bg-white p-4">
          <h2 className="text-lg font-semibold mb-2">剧情简介</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            {movie.description}
          </p>
          
          <div className="mt-4 space-y-3">
            <div className="flex">
              <div className="w-16 text-slate-500 text-sm">导演</div>
              <div className="flex-1 text-sm">{movie.director || '未知'}</div>
            </div>
            <div className="flex">
              <div className="w-16 text-slate-500 text-sm">演员</div>
              <div className="flex-1 text-sm">{movie.actors && Array.isArray(movie.actors) ? movie.actors.join('、') : '未知'}</div>
            </div>
            <div className="flex">
              <div className="w-16 text-slate-500 text-sm">类型</div>
              <div className="flex-1 text-sm">{movie.genre && Array.isArray(movie.genre) ? movie.genre.join('、') : '未分类'}</div>
            </div>
            <div className="flex">
              <div className="w-16 text-slate-500 text-sm">片长</div>
              <div className="flex-1 text-sm">{movie.duration}分钟</div>
            </div>
            <div className="flex">
              <div className="w-16 text-slate-500 text-sm">上映日期</div>
              <div className="flex-1 text-sm">
                {isValidDate(movie.releaseDate) ? 
                  safeFormatDate(movie.releaseDate, 'yyyy年MM月dd日') : 
                  '日期未知'
                }
              </div>
            </div>
          </div>
        </div>
        
        {/* 近期场次 */}
        <div className="mt-4 bg-white p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">近期场次</h2>
            <Link
              href={userRoutes.showtime(movie.id)}
              prefetch={false}
              replace={true}
              className="text-indigo-600 text-sm flex items-center"
            >
              全部场次 <ChevronDown className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {showtimes.length > 0 ? (
              showtimes.slice(0, 3).map(showtime => {
                const theater = theaters[showtime.theaterId];
                if (!theater) return null;
                
                // 安全地处理日期
                const startDate = showtime.startTime ? new Date(showtime.startTime) : null;
                const endDate = showtime.endTime ? new Date(showtime.endTime) : null;
                
                const startTime = startDate && isValidDate(startDate) ? safeFormatDate(startDate, 'HH:mm') : '--:--';
                const endTime = endDate && isValidDate(endDate) ? safeFormatDate(endDate, 'HH:mm') : '--:--';
                const date = startDate && isValidDate(startDate) ? safeFormatDate(startDate, 'MM月dd日') : '';
                
                return (
                  <Card key={showtime.id} className="p-3">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">{startTime} - {endTime}</div>
                        <div className="text-xs text-slate-500 mt-1">{date} | {theater.name}</div>
                      </div>
                      <Link
                        href={userRoutes.selectSeats(showtime.id)}
                        prefetch={false}
                        replace={true}
                        className="bg-indigo-50 text-indigo-600 text-sm py-1 px-3 rounded-md self-center hover:bg-indigo-100"
                      >
                        购票
                      </Link>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500">暂无排期场次</div>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  };
  
  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );
}

// 辅助函数：检查日期是否有效
function isValidDate(date: any): boolean {
  if (!date) return false;
  
  // 如果已经是Date对象
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  // 如果是字符串或数字，尝试创建Date对象
  try {
    const d = new Date(date);
    // 确保年份是合理的（避免极端情况）
    if (d.getFullYear() < 1900 || d.getFullYear() > 2100) {
      return false;
    }
    return !isNaN(d.getTime());
  } catch (e) {
    logError("日期解析错误:", e);
    return false;
  }
}

// 安全的日期格式化函数
function safeFormatDate(date: any, formatStr: string): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, formatStr);
  } catch (e) {
    logError("日期格式化错误:", e);
    return '日期未知';
  }
} 