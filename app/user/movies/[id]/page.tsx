'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Star, Clock, Calendar, Film, User, ChevronDown } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { defaultImages } from '@/app/lib/mockData';
import { Card } from '@/app/components/ui/Card';
import { MovieService, ShowtimeService, TheaterService } from '@/app/lib/services/dataService';
import { userRoutes } from '@/app/lib/utils/navigation';
import { Movie, Showtime, Theater } from '@/app/lib/types';

export default function UserMovieDetail() {
  const params = useParams();
  const router = useRouter();
  const movieId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [theaters, setTheaters] = useState<Record<string, Theater>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      if (!movieId) {
        setError("电影ID不存在");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // 获取电影数据
        const movieData = await MovieService.getMovieById(movieId);
        
        if (!movieData) {
          setError("找不到该电影");
          setLoading(false);
          return;
        }
        
        setMovie(movieData);
        
        try {
          // 获取该电影的场次
          const showtimesData = await ShowtimeService.getShowtimesByMovieId(movieId);
          setShowtimes(showtimesData || []);
          
          // 获取所有影厅信息
          const allTheaters = await TheaterService.getAllTheaters();
          const theatersMap: Record<string, Theater> = {};
          
          allTheaters.forEach(theater => {
            theatersMap[theater.id] = theater;
          });
          
          setTheaters(theatersMap);
        } catch (showtimeError) {
          console.error('Failed to fetch showtimes or theaters:', showtimeError);
          // 即使加载场次失败，我们仍然显示电影信息
        }
      } catch (error) {
        console.error('Failed to fetch movie data:', error);
        setError("加载电影数据失败");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [movieId, router]);
  
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
          alt={movie.title}
          fill
          className="object-cover"
          priority
          unoptimized
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
                {movie.genre.join(' / ')} | {movie.duration}分钟
              </p>
              <p className="text-white/70 text-xs mt-1">
                {format(new Date(movie.releaseDate), 'yyyy年MM月dd日')}上映
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 快速购票按钮 */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-14 z-10">
        <Link
          href={userRoutes.showtime(movie.id)}
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
            <div className="flex-1 text-sm">{movie.director}</div>
          </div>
          <div className="flex">
            <div className="w-16 text-slate-500 text-sm">演员</div>
            <div className="flex-1 text-sm">{movie.actors.join('、')}</div>
          </div>
          <div className="flex">
            <div className="w-16 text-slate-500 text-sm">类型</div>
            <div className="flex-1 text-sm">{movie.genre.join('、')}</div>
          </div>
          <div className="flex">
            <div className="w-16 text-slate-500 text-sm">片长</div>
            <div className="flex-1 text-sm">{movie.duration}分钟</div>
          </div>
          <div className="flex">
            <div className="w-16 text-slate-500 text-sm">上映日期</div>
            <div className="flex-1 text-sm">{format(new Date(movie.releaseDate), 'yyyy年MM月dd日')}</div>
          </div>
        </div>
      </div>
      
      {/* 近期场次 */}
      <div className="mt-4 bg-white p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">近期场次</h2>
          <Link
            href={userRoutes.showtime(movie.id)}
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
              const startDate = new Date(showtime.startTime);
              const endDate = new Date(showtime.endTime);
              
              const startTime = isValidDate(startDate) ? format(startDate, 'HH:mm') : '--:--';
              const endTime = isValidDate(endDate) ? format(endDate, 'HH:mm') : '--:--';
              const date = isValidDate(startDate) ? format(startDate, 'MM月dd日') : '';
              
              return (
                <Card key={showtime.id} className="p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{startTime} - {endTime}</div>
                      <div className="text-xs text-slate-500 mt-1">{date} | {theater.name}</div>
                    </div>
                    <Link
                      href={userRoutes.selectSeats(showtime.id)}
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
}

// 辅助函数：检查日期是否有效
function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
} 