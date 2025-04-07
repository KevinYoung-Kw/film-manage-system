import React from 'react';
import { MovieService, ShowtimeService, TheaterService } from '@/app/lib/services/dataService';
import { Movie, Showtime, Theater } from '@/app/lib/types';
import ShowtimeDetailClient from './ShowtimeDetailClient';

// 将页面转换为服务器组件
export default async function ShowtimePage({ params }: { params: { id: string } }) {
  // 先解构 params，处理 Promise
  const resolvedParams = await params;
  const showtimeId = resolvedParams.id;
  
  // 服务器组件中直接使用异步数据获取
  const showtimeData = await ShowtimeService.getShowtimeById(showtimeId);
  
  if (!showtimeData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">场次不存在</h2>
        <p className="text-slate-500 mt-2">未找到此场次信息</p>
      </div>
    );
  }
  
  // 获取电影和影厅信息
  const [movieData, theaterData] = await Promise.all([
    MovieService.getMovieById(showtimeData.movieId),
    TheaterService.getTheaterById(showtimeData.theaterId)
  ]);
  
  if (!movieData || !theaterData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">数据错误</h2>
        <p className="text-slate-500 mt-2">电影或影厅数据不存在</p>
      </div>
    );
  }
  
  // 将数据传递给客户端组件进行交互
  return <ShowtimeDetailClient showtime={showtimeData} movie={movieData} theater={theaterData} />;
} 