'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Film, Calendar, Clock } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import ShowtimeCard from '@/app/components/ShowtimeCard';
import { mockShowtimes, mockMovies, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { userRoutes } from '@/app/lib/utils/navigation';

export default function ShowtimesPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [showtimes, setShowtimes] = useState<any[]>([]);
  
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
  
  // 获取当天所有场次
  useEffect(() => {
    // 过滤当天的场次
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 使用ref中存储的当前时间
    const now = nowRef.current;
    
    // 查找当天的所有场次，并过滤掉已过期的场次
    const todayShowtimes = mockShowtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      // 如果是今天，则只显示当前时间之后的场次
      if (today.getDate() === now.getDate() && 
          today.getMonth() === now.getMonth() && 
          today.getFullYear() === now.getFullYear()) {
        return showtimeDate >= now && showtimeDate < tomorrow;
      }
      // 如果是未来的日期，显示所有场次
      return showtimeDate >= today && showtimeDate < tomorrow;
    });
    
    // 添加电影和影院信息
    const showtimesWithDetails = todayShowtimes.map(showtime => {
      const movie = mockMovies.find(m => m.id === showtime.movieId);
      const theater = mockTheaters.find(t => t.id === showtime.theaterId);
      
      return {
        ...showtime,
        movie,
        theater
      };
    });
    
    setShowtimes(showtimesWithDetails);
  }, [date]); // 只依赖于date变化
  
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
    return new Date(startTime) < nowRef.current;
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
          {Object.keys(showtimesByMovie).length > 0 ? (
            Object.entries(showtimesByMovie).map(([movieId, movieShowtimes]) => (
              <div key={movieId} className="mb-6">
                <Card className="overflow-hidden">
                  {/* 电影信息 */}
                  <Link href={userRoutes.movieDetail(movieId)}>
                    <div className="p-4 flex space-x-3 border-b border-slate-100">
                      <div className="relative h-24 w-16 rounded overflow-hidden">
                        <Image
                          src={movieShowtimes[0].movie.poster || defaultImages.moviePoster}
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
                                <button disabled className="mt-1 px-3 py-1 bg-slate-300 text-slate-500 text-xs rounded-full cursor-not-allowed">
                                  已过期
                                </button>
                              ) : (
                                <Link href={userRoutes.selectSeats(showtime.id)}>
                                  <button className="mt-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">
                                    选座购票
                                  </button>
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
            <div className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-slate-500">当天暂无场次</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
} 