'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Film, Calendar, Search } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { defaultImages } from '@/app/lib/mockData';
import { MovieStatus, Movie, Showtime } from '@/app/lib/types';
import { staffRoutes } from '@/app/lib/utils/navigation';
import { MovieService } from '@/app/lib/services/movieService';
import { ShowtimeService } from '@/app/lib/services/showtimeService';

export default function StaffSellPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取当天有场次的所有电影
  useEffect(() => {
    const fetchMoviesWithShowtimes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取所有正在上映的电影
        const allMovies = await MovieService.getNowShowingMovies();
        
        // 获取当天的场次
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        const todayShowtimes = await ShowtimeService.getShowtimesByDate(now);
        
        // 找出当天有场次的电影
        const movieIds = [...new Set(todayShowtimes.map(showtime => showtime.movieId))];
        
        // 过滤并组织电影数据
        const moviesWithShowtimes = allMovies
          .filter(movie => movieIds.includes(movie.id))
          .map(movie => {
            const movieShowtimes = todayShowtimes.filter(s => s.movieId === movie.id);
            
            return {
              ...movie,
              showtimesCount: movieShowtimes.length,
              earliestShowtime: movieShowtimes.reduce((earliest, current) => 
                earliest.startTime < current.startTime ? earliest : current
              , movieShowtimes[0])
            };
          });
        
        setMovies(moviesWithShowtimes);
      } catch (error) {
        console.error('加载电影和场次数据失败:', error);
        setError('无法获取电影和场次信息');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMoviesWithShowtimes();
  }, []);
  
  // 过滤电影
  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <MobileLayout title="电影售票" userRole="staff">
      <div className="p-4 pb-20">
        {/* 搜索区域 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索电影..."
              className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        
        {/* 电影列表 */}
        <h2 className="font-medium mb-3 flex items-center">
          <Film className="h-5 w-5 mr-2 text-indigo-500" />
          今日可售电影
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              重试
            </Button>
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="space-y-4">
            {filteredMovies.map((movie) => (
              <Link
                href={staffRoutes.sellMovie(movie.id)}
                key={movie.id}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-3 flex space-x-3">
                    <div className="relative h-32 w-24 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={movie.webpPoster || movie.poster || defaultImages.webpMoviePoster || defaultImages.moviePoster}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{movie.title}</h3>
                      <div className="text-xs text-slate-500 mt-1">
                        {movie.duration}分钟 | {movie.genre.join('/')}
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">
                          {movie.rating || '暂无'} 分
                        </div>
                      </div>
                      <div className="mt-6 text-sm text-indigo-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        今日{movie.showtimesCount}场
                      </div>
                      <div className="text-sm text-slate-500">
                        最早: {format(movie.earliestShowtime.startTime, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Film className="h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500">
              {searchQuery ? '没有找到匹配的电影' : '当天无可售电影'}
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
} 