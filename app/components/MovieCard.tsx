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

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  variant = 'default',
  className 
}) => {
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
              src={movie.poster || defaultImages.moviePoster}
              alt={movie.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 p-2 overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-sm line-clamp-1">{movie.title}</h3>
              <div className="flex items-center text-yellow-500 text-xs">
                <Star size={12} className="fill-yellow-500" />
                <span className="ml-1">{movie.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {movie.duration}分钟 | {movie.genre.join('/')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {format(movie.releaseDate, 'yyyy-MM-dd')}上映
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
            src={movie.poster || defaultImages.moviePoster}
            alt={movie.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Star size={12} className="fill-yellow-500 mr-1" />
            {movie.rating.toFixed(1)}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-1">{movie.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {movie.duration}分钟 | {movie.genre.join('/')}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            导演: {movie.director}
          </p>
        </div>
      </Card>
    </Link>
  );
};

export default MovieCard; 