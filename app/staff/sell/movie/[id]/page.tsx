'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format, isToday, isTomorrow } from 'date-fns';
import { Clock, Users, Star, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { defaultImages } from '@/app/lib/mockData';
import { Movie, Showtime, Theater } from '@/app/lib/types';
import { staffRoutes } from '@/app/lib/utils/navigation';
import { MovieService } from '@/app/lib/services/movieService';
import { ShowtimeService } from '@/app/lib/services/showtimeService';
import { TheaterService } from '@/app/lib/services/theaterService';

// 扩展Showtime类型，添加theater属性
interface ShowtimeWithTheater extends Showtime {
  theater?: Theater;
}

export default function StaffMovieDetailPage() {
  const router = useRouter();
  const params = useParams();
  const movieId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [movie, setMovie] = useState<Movie | null>(null);
  const [todayShowtimes, setTodayShowtimes] = useState<ShowtimeWithTheater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取电影和今日场次
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取电影详情
        const movieData = await MovieService.getMovieById(movieId);
        
        if (!movieData) {
          setError('无法找到电影信息');
          return;
        }
        
        setMovie(movieData);
        
        // 获取今天的场次
        const now = new Date();
        const todayShowtimesData = await ShowtimeService.getShowtimesByDate(now);
        
        // 找出当天该电影的场次
        const showtimesForMovie = todayShowtimesData.filter(showtime => 
          showtime.movieId === movieId && 
          showtime.startTime > now
        );
        
        // 如果场次已经包含影厅信息，直接使用
        const showtimesWithTheater: ShowtimeWithTheater[] = [];
        
        // 为每个场次获取影厅信息（如果需要）
        for (const showtime of showtimesForMovie) {
          let theater: Theater | undefined = undefined;
          
          // 如果场次没有影厅信息，获取影厅详情
          if (showtime.theaterId) {
            const theaterData = await TheaterService.getTheaterById(showtime.theaterId);
            if (theaterData) {
              theater = theaterData;
            }
          }
          
          showtimesWithTheater.push({
            ...showtime,
            theater
          });
        }
        
        // 按时间排序
        const sortedShowtimes = showtimesWithTheater.sort((a, b) => 
          a.startTime.getTime() - b.startTime.getTime()
        );
        
        setTodayShowtimes(sortedShowtimes);
      } catch (err) {
        console.error('获取电影和场次数据失败:', err);
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    if (movieId) {
      fetchData();
    }
  }, [movieId]);
  
  // 格式化电影时长
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
  };
  
  // 格式化日期
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return `今天 ${format(date, 'HH:mm')}`;
    } else if (isTomorrow(date)) {
      return `明天 ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MM月dd日 HH:mm');
    }
  };
  
  // 获取价格范围
  const getPriceRange = (showtime: ShowtimeWithTheater) => {
    if (!showtime.price) return '暂无价格';
    
    const prices = Object.values(showtime.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `¥${minPrice}`;
    }
    
    return `¥${minPrice}-${maxPrice}`;
  };
  
  if (loading) {
    return (
      <MobileLayout title="电影详情" userRole="staff" showBackButton>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </MobileLayout>
    );
  }
  
  if (error || !movie) {
    return (
      <MobileLayout title="电影详情" userRole="staff" showBackButton>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-red-500 font-medium">{error || '加载失败'}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={() => router.push(staffRoutes.sell)}
          >
            返回
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="电影详情" userRole="staff" showBackButton>
      <div>
        {/* 电影基本信息 */}
        <div className="bg-indigo-900 text-white">
          <div className="p-4 flex space-x-4">
            <div className="relative h-40 w-28 flex-shrink-0 rounded overflow-hidden">
              <Image
                src={movie.webpPoster || movie.poster || defaultImages.webpMoviePoster || defaultImages.moviePoster}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-xl mb-1">{movie.title}</h1>
              {movie.originalTitle && (
                <h2 className="text-indigo-200 text-sm mb-2">{movie.originalTitle}</h2>
              )}
              <div className="flex items-center space-x-2 mb-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm">{movie.rating || '暂无评分'}</span>
              </div>
              <div className="text-sm text-indigo-200 mb-1">
                <Clock className="h-3 w-3 inline mr-1" /> {formatDuration(movie.duration)}
              </div>
              <div className="text-sm text-indigo-200 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" /> {format(movie.releaseDate, 'yyyy年MM月dd日')}
              </div>
              <div className="text-sm text-indigo-200 mb-1">
                <Users className="h-3 w-3 inline mr-1" /> {movie.director}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {movie.genre.map((genre, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-0.5 text-xs bg-indigo-700 text-indigo-100 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 简介 */}
        <Card className="rounded-none shadow-none">
          <div className="p-4">
            <h2 className="font-medium mb-2">电影简介</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {movie.description}
            </p>
          </div>
        </Card>
        
        {/* 演职人员 */}
        <Card className="rounded-none shadow-none mt-2">
          <div className="p-4">
            <h2 className="font-medium mb-2">演职人员</h2>
            <div>
              <h3 className="text-sm text-slate-500 mb-1">导演</h3>
              <p className="text-sm mb-2">{movie.director}</p>
            </div>
            <div>
              <h3 className="text-sm text-slate-500 mb-1">主演</h3>
              <p className="text-sm">{movie.actors.join('、')}</p>
            </div>
          </div>
        </Card>
        
        {/* 今日场次 */}
        <div className="bg-white p-4 mt-2">
          <h2 className="font-medium mb-3">可售场次</h2>
          
          {todayShowtimes.length > 0 ? (
            <div className="space-y-3">
              {todayShowtimes.map((showtime) => (
                <Link
                  href={staffRoutes.sellSeats(showtime.id)}
                  key={showtime.id}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-medium">
                          {format(showtime.startTime, 'HH:mm')}
                        </div>
                        <div className="text-indigo-600 font-medium">
                          {getPriceRange(showtime)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm text-slate-500">
                          {showtime.theaterName || showtime.theater?.name || '未知影厅'} 
                          {showtime.theater?.equipment && showtime.theater.equipment.length > 0 && (
                            <span className="ml-1">({showtime.theater.equipment.join('/')})</span>
                          )}
                        </div>
                        <div className="flex items-center text-indigo-600">
                          <span className="text-sm mr-1">选座</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mb-2" />
              <p className="text-slate-500">今日无可售场次</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
} 