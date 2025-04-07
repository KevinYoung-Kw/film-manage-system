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
import { mockMovies, mockShowtimes, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { TicketType } from '@/app/lib/types';

export default function MovieShowtimesPage({ params }: { params: { id: string } }) {
  // 获取电影详情
  const movie = mockMovies.find(movie => movie.id === params.id);
  
  // 获取该电影的场次（未来4天）
  const today = new Date();
  const nextDays = Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() + i);
    return date;
  });
  
  // 按日期分组获取电影场次
  const showtimesByDay = nextDays.map(day => {
    const showtimesOnDay = mockShowtimes
      .filter(showtime => 
        showtime.movieId === movie?.id && 
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
        {day.showtimes.length > 0 ? (
          <div className="space-y-4">
            {day.showtimes.map(showtime => {
              const theater = mockTheaters.find(theater => theater.id === showtime.theaterId);
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
                    <Link href={`/movies/${movie?.id}/showtimes/${showtime.id}/seats`}>
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
  
  if (!movie) {
    return (
      <MobileLayout title="场次选择" showBackButton>
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-lg font-semibold text-slate-800">电影不存在</h2>
          <p className="text-slate-500 mt-2">未找到此电影信息</p>
          <Link 
            href="/movies"
            className="mt-4 text-indigo-600 font-medium"
          >
            返回电影列表
          </Link>
        </div>
      </MobileLayout>
    );
  }
  
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