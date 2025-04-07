import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Star, Clock, Calendar, Film, User, ChevronDown } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { mockMovies, mockShowtimes, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { Card } from '@/app/components/ui/Card';

export default function MovieDetail({ params }: { params: { id: string } }) {
  // 获取电影详情
  const movie = mockMovies.find(movie => movie.id === params.id);
  
  if (!movie) {
    return (
      <MobileLayout title="电影详情" showBackButton>
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
  
  // 获取该电影的场次
  const movieShowtimes = mockShowtimes.filter(showtime => showtime.movieId === movie.id);
  
  return (
    <MobileLayout title="电影详情" showBackButton>
      {/* 电影封面和基本信息 */}
      <div className="relative w-full h-60 overflow-hidden shadow-lg">
        <Image
          src={movie.poster || defaultImages.moviePoster}
          alt={movie.title}
          fill
          className="object-cover"
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
                {format(movie.releaseDate, 'yyyy年MM月dd日')}上映
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 快速购票按钮 */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-14 z-10">
        <Link
          href={`/movies/${movie.id}/showtimes`}
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
            <div className="flex-1 text-sm">{format(movie.releaseDate, 'yyyy年MM月dd日')}</div>
          </div>
        </div>
      </div>
      
      {/* 近期场次 */}
      <div className="mt-4 bg-white p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">近期场次</h2>
          <Link
            href={`/movies/${movie.id}/showtimes`}
            className="text-indigo-600 text-sm flex items-center"
          >
            全部场次 <ChevronDown className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {movieShowtimes.length > 0 ? (
            movieShowtimes.slice(0, 3).map(showtime => {
              const theater = mockTheaters.find(t => t.id === showtime.theaterId);
              if (!theater) return null;
              
              const startTime = format(showtime.startTime, 'HH:mm');
              const endTime = format(showtime.endTime, 'HH:mm');
              const date = format(showtime.startTime, 'MM月dd日');
              
              return (
                <Card key={showtime.id} className="p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{startTime} - {endTime}</div>
                      <div className="text-xs text-slate-500 mt-1">{date} | {theater.name}</div>
                    </div>
                    <Link
                      href={`/showtimes/${showtime.id}`}
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