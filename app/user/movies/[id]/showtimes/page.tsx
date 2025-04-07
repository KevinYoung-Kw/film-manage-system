import React from 'react';
import { MovieService } from '@/app/lib/services/dataService';
import MovieShowtimesClient from './MovieShowtimesClient';

export default async function UserMovieShowtimesPage({ params }: { params: { id: string } }) {
  // 先解构 params，处理 Promise
  const resolvedParams = await params;
  const movieId = resolvedParams.id;
  
  // 获取电影信息
  const movieData = await MovieService.getMovieById(movieId);
  
  if (!movieData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">电影不存在</h2>
        <p className="text-slate-500 mt-2">未找到此电影信息</p>
      </div>
    );
  }
  
  return <MovieShowtimesClient movie={movieData} />;
} 