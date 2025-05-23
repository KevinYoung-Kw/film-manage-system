'use client';

import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Card } from './ui/Card';
import { Showtime, Movie, Theater, TicketType } from '../lib/types';
import { zhCN } from 'date-fns/locale';

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
  const isExpired = new Date(showtime.startTime) < now;
  
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
      
      <div className="flex justify-between items-start mt-3">
        <div>
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
        </div>
        <div className="text-xs text-slate-500">
          {date} {dayOfWeek}
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