'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { Movie } from '../lib/types';
import { defaultImages } from '../lib/mockData';
import { userRoutes } from '../lib/utils/navigation';

interface MovieCardProps {
  movie: Movie;
  variant?: 'default' | 'compact';
  className?: string;
}

// 辅助函数：检查日期是否有效
function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  variant = 'default',
  className 
}) => {
  // 安全地获取有效的日期格式
  const releaseDate = isValidDate(movie.releaseDate) 
    ? format(movie.releaseDate, 'yyyy-MM-dd')
    : '未知日期';
  
  // 获取封面图片，优先使用webp格式，确保有兜底图
  const posterSrc = movie.webpPoster || movie.poster || defaultImages.webpMoviePoster || defaultImages.moviePoster;
  
  // 确保所有需要的数据字段都存在
  const title = movie.title || '无标题电影';
  const duration = movie.duration || 0;
  const rating = movie.rating || 0;
  const genre = Array.isArray(movie.genre) ? movie.genre : [];
  const director = movie.director || '未知导演';
  
  // 根据variant选择不同的卡片样式
  if (variant === 'compact') {
    return (
      <Link href={userRoutes.movieDetail(movie.id)}>
        <Card
          className={`flex flex-row h-28 overflow-hidden ${className}`}
          withHover
        >
          <div className="relative w-24 h-full flex-shrink-0">
            <Image
              src={posterSrc}
              alt={title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
          <div className="flex-1 p-2 overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
              <div className="flex items-center text-yellow-500 text-xs">
                <Star size={12} className="fill-yellow-500" />
                <span className="ml-1">{rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {duration}分钟 | {genre.join('/')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {releaseDate}上映
            </p>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={userRoutes.movieDetail(movie.id)}>
      <Card
        className={`overflow-hidden ${className}`}
        withHover
      >
        <div className="relative w-full h-48">
          <Image
            src={posterSrc}
            alt={title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Star size={12} className="fill-yellow-500 mr-1" />
            {rating.toFixed(1)}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-1">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {duration}分钟 | {genre.join('/')}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            导演: {director}
          </p>
        </div>
      </Card>
    </Link>
  );
};

export default MovieCard; 