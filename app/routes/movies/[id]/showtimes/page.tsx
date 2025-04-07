import React from 'react';
import MovieShowtimesClient from './MovieShowtimesClient';
import { MovieService } from '@/app/lib/services/dataService';

export default async function MovieShowtimesPage({ params }: { params: { id: string } }) {
  // 服务器组件中解析params
  const resolvedParams = await params;
  const movieId = resolvedParams.id;

  // 获取电影详情
  const movie = await MovieService.getMovieById(movieId);
  
  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">电影不存在</h2>
        <p className="text-slate-500 mt-2">未找到此电影信息</p>
      </div>
    );
  }
  
  // 渲染客户端组件
  return <MovieShowtimesClient movie={movie} />;
} 