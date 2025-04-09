'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, isSameDay } from 'date-fns';
import { ChevronRight, Calendar, Clock } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import TabGroup from '@/app/components/ui/TabGroup';
import { defaultImages } from '@/app/lib/mockData';
import { TicketType, Movie } from '@/app/lib/types';
import { ShowtimeService, TheaterService } from '@services/dataService';
import { userRoutes } from '@/app/lib/utils/navigation';
import { useRef } from 'react';

interface MovieShowtimesClientProps {
  movie: Movie;
}

export default function MovieShowtimesClient({ movie }: MovieShowtimesClientProps) {
  const [showtimesByDay, setShowtimesByDay] = useState<Array<{ date: Date; showtimes: any[] }>>([]);
  const [theaters, setTheaters] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用ref跟踪组件是否已挂载和当前电影ID
  const isMounted = useRef(false);
  const prevMovieId = useRef<string | null>(null);
  
  useEffect(() => {
    // 如果电影ID没有变化且已经加载过数据，则跳过重新加载
    if (isMounted.current && prevMovieId.current === movie.id) return;
    
    // 更新当前电影ID
    prevMovieId.current = movie.id;
    isMounted.current = true;
    
    async function loadData() {
      setIsLoading(true);
      try {
        // 获取该电影的场次
        const showtimes = await ShowtimeService.getShowtimesByMovieId(movie.id);
        
        // 获取所有影厅
        const allTheaters = await TheaterService.getAllTheaters();
        const theatersMap: Record<string, any> = {};
        allTheaters.forEach(theater => {
          theatersMap[theater.id] = theater;
        });
        setTheaters(theatersMap);
        
        // 按日期分组场次数据
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 重置时间到当天的0点，便于比较
        
        // 筛选当前时间之后的场次
        const validShowtimes = showtimes.filter(showtime => {
          const showtimeDate = new Date(showtime.startTime);
          return showtimeDate >= today;
        });
        
        const nextDays = Array.from({ length: 4 }, (_, i) => {
          const date = new Date();
          date.setDate(today.getDate() + i);
          return date;
        });
        
        const groupedShowtimes = nextDays.map(day => {
          const showtimesOnDay = validShowtimes
            .filter(showtime => 
              isSameDay(new Date(showtime.startTime), day)
            )
            .sort((a, b) => 
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
          
          return {
            date: day,
            showtimes: showtimesOnDay
          };
        });
        
        setShowtimesByDay(groupedShowtimes);
      } catch (error) {
        console.error('Failed to load showtimes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [movie.id]); // 保留依赖于movie.id，但使用ref处理避免重复加载
  
  const formatDate = (date: Date) => {
    const today = new Date();
    
    if (isSameDay(date, today)) {
      return '今天';
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
      return '明天';
    }
    
    return format(date, 'MM/dd');
  };
  
  // 创建标签页内容
  const tabs = showtimesByDay.map((day) => ({
    key: day.date.toISOString(),
    label: formatDate(day.date),
    content: (
      <div className="px-4 py-3">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : day.showtimes.length > 0 ? (
          <div className="space-y-4">
            {day.showtimes.map(showtime => {
              const theater = theaters[showtime.theaterId];
              return (
                <Card key={showtime.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="font-medium">
                        {format(new Date(showtime.startTime), 'HH:mm')}
                      </span>
                      <span className="mx-2 text-slate-300">-</span>
                      <span className="text-slate-500">
                        {format(new Date(showtime.endTime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-sm text-red-500 font-medium">
                      ¥{showtime.price[TicketType.NORMAL]}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">{theater?.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {theater?.equipment.join(' | ')}
                      </div>
                    </div>
                    <Link href={userRoutes.selectSeats(showtime.id)}>
                      <Button size="sm" variant="primary">
                        选座
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">该日期暂无排期</p>
          </div>
        )}
      </div>
    ),
  }));
  
  return (
    <MobileLayout title="场次选择" showBackButton>
      {/* 电影信息 */}
      <div className="bg-white p-4 mb-4 border-b border-slate-100">
        <div className="flex">
          <div className="relative h-24 w-16 rounded overflow-hidden">
            <Image
              src={movie.poster || defaultImages.moviePoster}
              alt={movie.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="ml-4 flex-1">
            <h1 className="font-semibold">{movie.title}</h1>
            <div className="text-xs text-slate-500 mt-1">
              {movie.duration}分钟 | {movie.genre.join('/')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              导演: {movie.director}
            </div>
            <div className="flex items-center text-yellow-500 text-xs mt-1">
              {movie.rating.toFixed(1)}分
            </div>
          </div>
        </div>
      </div>
      
      {/* 场次列表 */}
      <TabGroup
        tabs={tabs}
        variant="underline"
        fullWidth
      />
    </MobileLayout>
  );
} 