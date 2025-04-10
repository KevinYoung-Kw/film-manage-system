'use client';

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, Film } from 'lucide-react';
import { Card } from './ui/Card';
import { Showtime, Movie, Theater, TicketType } from '../lib/types';
import { zhCN } from 'date-fns/locale';
// 移除对mockData的依赖
// import { defaultImages } from '../lib/mockData';

// 定义默认图片路径常量
const DEFAULT_MOVIE_POSTER = '/images/default-poster.jpg';
const DEFAULT_WEBP_MOVIE_POSTER = '/images/default-poster.webp';

interface ShowtimeCardProps {
  showtime: Showtime;
  movie: Movie;
  theater: Theater;
  className?: string;
}

const ShowtimeCard: React.FC<ShowtimeCardProps> = ({
  showtime,
  movie,
  theater,
  className
}) => {
  // 计算座位相关信息
  const totalSeats = theater.totalSeats;
  const availableSeatsCount = showtime.availableSeats.filter(seat => seat.available).length;
  const percentFull = ((totalSeats - availableSeatsCount) / totalSeats) * 100;
  
  // 格式化时间和日期
  const startTime = format(showtime.startTime, 'HH:mm');
  const endTime = format(showtime.endTime, 'HH:mm');
  const date = format(showtime.startTime, 'MM-dd');
  const dayOfWeek = format(showtime.startTime, 'EEEE', { locale: zhCN });
  
  // 获取普通票价
  const normalPrice = showtime.price[TicketType.NORMAL];
  
  // 检查场次是否已过期
  const now = new Date();
  const showtimeDate = new Date(showtime.startTime);
  // 计算开场后的分钟数，仅当场次日期是今天或已过去时才有意义
  const minutesAfterStart = showtimeDate < now ? 
    Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60)) : 0;
  
  // 只有当场次日期是当天或过去的日期，且开场超过15分钟才算真正过期
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const showtimeDay = new Date(showtimeDate);
  showtimeDay.setHours(0, 0, 0, 0);
  
  // 未来日期的场次永远不会过期
  const isFutureDay = showtimeDay > today;
  const isExpired = !isFutureDay && showtimeDate < now && minutesAfterStart > 15;

  // 是否已开场但在允许购票时间内（当天场次且开场后15分钟内）
  const isStartedButAllowed = showtimeDate < now && minutesAfterStart <= 15;

  // 选择最佳海报图片，优先使用webp格式
  const posterSrc = movie.webpPoster || movie.poster || DEFAULT_WEBP_MOVIE_POSTER || DEFAULT_MOVIE_POSTER;
  
  return (
    <Card className={`p-3 ${className}`} withHover>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <span className="text-lg font-semibold">{startTime}</span>
            <span className="mx-2 text-slate-400">-</span>
            <span className="text-slate-500">{endTime}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <Clock size={12} className="mr-1" />
            <span>{movie.duration}分钟</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold text-indigo-600">¥{normalPrice}</span>
          <div className="text-xs text-slate-500 mt-1">起</div>
        </div>
      </div>
      
      <div className="flex items-center mt-3">
        <div className="w-12 h-16 relative rounded overflow-hidden mr-2 flex-shrink-0">
          <Image 
            src={posterSrc}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium">{theater.name}</div>
          {theater.equipment && theater.equipment.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {theater.equipment.map((item, idx) => (
                <span key={idx} className="inline-flex text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {item}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            {date} {dayOfWeek}
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${
              percentFull > 80 ? 'bg-red-500' : percentFull > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentFull}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-500">剩余 {availableSeatsCount} 座</span>
          <span className="text-slate-500">总共 {totalSeats} 座</span>
        </div>
      </div>
      
      {isExpired ? (
        <button 
          disabled
          className="block w-full text-center bg-slate-300 text-slate-500 py-2 rounded-md mt-3 text-sm font-medium cursor-not-allowed"
        >
          已过期
        </button>
      ) : isStartedButAllowed ? (
        <Link 
          href={`/showtimes/${showtime.id}`}
          className="block w-full text-center bg-yellow-500 text-white py-2 rounded-md mt-3 text-sm font-medium hover:bg-yellow-600 transition-colors"
        >
          抢购（剩余{15 - minutesAfterStart}分钟）
        </Link>
      ) : (
        <Link 
          href={`/showtimes/${showtime.id}`}
          className="block w-full text-center bg-indigo-600 text-white py-2 rounded-md mt-3 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          选座购票
        </Link>
      )}
    </Card>
  );
};

export default ShowtimeCard; 