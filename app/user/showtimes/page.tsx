'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Film, Calendar, Clock } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import ShowtimeCard from '@/app/components/ShowtimeCard';
// 移除对mockData的依赖
// import { defaultImages } from '@/app/lib/mockData';
import { userRoutes } from '@/app/lib/utils/navigation';
import { useAppContext } from '@/app/lib/context/AppContext';

// 定义默认图片路径常量
const DEFAULT_MOVIE_POSTER = '/images/default-poster.jpg';
const DEFAULT_WEBP_MOVIE_POSTER = '/images/default-poster.webp';

export default function ShowtimesPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 使用全局应用上下文
  const { refreshData, todayShowtimes, showtimes: allShowtimes, movies, theaters } = useAppContext();
  
  // 将当前时间存储在ref中，这样它不会在每次渲染时改变
  const nowRef = useRef(new Date());
  
  // 获取未来7天的日期列表
  const dateList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  
  // 格式化星期
  const formatWeekday = (date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };
  
  // 初始化时刷新数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // 获取当天所有场次
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoading(true);
      try {
        // 过滤当天的场次
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 使用ref中存储的当前时间
        const now = nowRef.current;
        
        // 从全部场次中筛选指定日期的场次
        // 首先是否是今天，如果是则使用todayShowtimes
        const isToday = today.getDate() === new Date().getDate() &&
                        today.getMonth() === new Date().getMonth() &&
                        today.getFullYear() === new Date().getFullYear();
        
        let showtimesToDisplay = isToday ? todayShowtimes : allShowtimes.filter(showtime => {
          const showtimeDate = new Date(showtime.startTime);
          const showtimeDay = new Date(showtimeDate);
          showtimeDay.setHours(0, 0, 0, 0);
          
          return showtimeDay.getTime() === today.getTime();
        });
        
        // 查找当天的所有场次，并过滤掉已过期的场次
        const filteredShowtimes = showtimesToDisplay.filter(showtime => {
          const showtimeDate = new Date(showtime.startTime);
          
          // 如果是今天的场次，需要过滤掉已经过期超过15分钟的场次
          if (isToday) {
            // 计算场次开场后的分钟数
            const minutesAfterStart = showtimeDate < now ? 
              Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60)) : 0;
            
            // 过滤条件：未开场 或 已开场但在15分钟内
            return showtimeDate >= now || minutesAfterStart <= 15;
          }
          
          // 如果是未来的日期，显示所有场次
          return true;
        });
        
        // 添加电影和影院信息
        const showtimesWithDetails = filteredShowtimes.map(showtime => {
          // 从缓存中查找电影和影院信息
          const movie = movies.find(m => m.id === showtime.movieId);
          const theater = theaters.find(t => t.id === showtime.theaterId);
          
          return {
            ...showtime,
            movie,
            theater
          };
        });
        
        setShowtimes(showtimesWithDetails);
      } catch (error) {
        console.error('获取场次数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShowtimes();
  }, [date, todayShowtimes, allShowtimes, movies, theaters]); // 依赖于date和上下文数据的变化
  
  // 分组展示场次（按电影分组）
  const showtimesByMovie: Record<string, any[]> = {};
  
  showtimes.forEach(showtime => {
    if (!showtime.movie) return;
    
    const movieId = showtime.movie.id;
    if (!showtimesByMovie[movieId]) {
      showtimesByMovie[movieId] = [];
    }
    
    showtimesByMovie[movieId].push(showtime);
  });
  
  // 检查场次是否已过期
  const isShowtimeExpired = (startTime: Date) => {
    const showtimeDate = new Date(startTime);
    const now = nowRef.current;
    
    // 获取日期部分进行比较
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const showtimeDay = new Date(showtimeDate);
    showtimeDay.setHours(0, 0, 0, 0);
    
    // 未来日期的场次永远不会过期
    const isFutureDay = showtimeDay > today;
    
    // 计算场次开场后的分钟数
    const minutesAfterStart = showtimeDate < now ? 
      Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60)) : 0;
    
    // 只有当场次日期是当天或过去的日期，且开场超过15分钟才算真正过期
    return !isFutureDay && showtimeDate < now && minutesAfterStart > 15;
  };
  
  // 检查场次是否已开场但仍在可购买时间内（开场后15分钟内）
  const isShowtimeStartedButAllowed = (startTime: Date) => {
    const showtimeDate = new Date(startTime);
    const now = nowRef.current;
    
    if (showtimeDate >= now) return false;
    
    const minutesAfterStart = Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60));
    return minutesAfterStart <= 15;
  };
  
  return (
    <MobileLayout title="场次列表">
      <div className="pb-8">
        {/* 日期选择器 */}
        <div className="p-4 bg-white sticky top-14 z-10 border-b border-slate-100">
          <div className="flex overflow-x-auto pb-2 -mx-1">
            {dateList.map((d, index) => (
              <div 
                key={index} 
                className={`flex-shrink-0 px-1`}
              >
                <button
                  onClick={() => setDate(d)}
                  className={`w-16 py-2 rounded-lg flex flex-col items-center justify-center ${
                    d.getDate() === date.getDate() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-xs">{formatWeekday(d)}</span>
                  <span className="text-lg font-medium">{d.getDate()}</span>
                  <span className="text-xs">{d.getMonth() + 1}月</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* 场次列表 */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-slate-500">加载场次中...</p>
              </div>
            </div>
          ) : Object.keys(showtimesByMovie).length > 0 ? (
            Object.entries(showtimesByMovie).map(([movieId, movieShowtimes]) => (
              <div key={movieId} className="mb-6">
                <Card className="overflow-hidden">
                  {/* 电影信息 */}
                  <Link href={userRoutes.movieDetail(movieId)}>
                    <div className="p-4 flex space-x-3 border-b border-slate-100">
                      <div className="relative h-24 w-16 rounded overflow-hidden">
                        <Image
                          src={movieShowtimes[0].movie.webpPoster || movieShowtimes[0].movie.poster || DEFAULT_WEBP_MOVIE_POSTER || DEFAULT_MOVIE_POSTER}
                          alt={movieShowtimes[0].movie.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{movieShowtimes[0].movie.title}</h3>
                        <div className="text-xs text-slate-500 mt-1">
                          {movieShowtimes[0].movie.duration}分钟 | {movieShowtimes[0].movie.genre.join('/')}
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">
                            {movieShowtimes[0].movie.rating || '暂无'} 分
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* 场次列表 */}
                  <div className="divide-y divide-slate-100">
                    {movieShowtimes.map(showtime => {
                      const expired = isShowtimeExpired(showtime.startTime);
                      return (
                        <div
                          key={showtime.id}
                          className="block p-4 hover:bg-slate-50"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {format(new Date(showtime.startTime), 'HH:mm')}
                                <span className="text-slate-500 text-sm ml-2">
                                  - {format(new Date(new Date(showtime.startTime).getTime() + movieShowtimes[0].movie.duration * 60000), 'HH:mm')}
                                </span>
                              </div>
                              <div className="text-sm text-slate-500 mt-1">
                                {showtime.theater.name} | {showtime.language}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-indigo-600 font-medium">¥{showtime.price.normal}</div>
                              {expired ? (
                                <div className="text-slate-400 text-xs mt-1">已过期</div>
                              ) : isShowtimeStartedButAllowed(showtime.startTime) ? (
                                <Link 
                                  href={userRoutes.selectSeats(showtime.id)}
                                  className="mt-1 inline-block px-3 py-1 text-xs font-medium bg-amber-500 text-white rounded"
                                >
                                  立即抢票
                                </Link>
                              ) : (
                                <Link 
                                  href={userRoutes.selectSeats(showtime.id)}
                                  className="mt-1 inline-block px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded"
                                >
                                  选座购票
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Film className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">暂无放映场次</h3>
              <p className="text-sm text-slate-500">
                {format(date, 'yyyy年MM月dd日')} 暂无场次，请选择其他日期
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
} 