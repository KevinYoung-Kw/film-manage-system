'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MovieService } from '@/app/lib/services/movieService';
import { ShowtimeService } from '@/app/lib/services/showtimeService';
import { TheaterService } from '@/app/lib/services/theaterService';
import { Movie, Showtime, Theater } from '@/app/lib/types';
import ShowtimeDetailClient from './ShowtimeDetailClient';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function ShowtimePage() {
  const params = useParams();
  const showtimeId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const { showtimes, movies, theaters, refreshData } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theater, setTheater] = useState<Theater | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 页面加载时刷新数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 优先从AppContext中获取数据
        const showtimeData = showtimes.find(s => s.id === showtimeId) || 
                             await ShowtimeService.getShowtimeById(showtimeId);
        
        if (!showtimeData) {
          setError('场次不存在');
          setLoading(false);
          return;
        }
        
        setShowtime(showtimeData);
        
        // 获取电影和影厅信息，优先从缓存中获取
        const movieData = movies.find(m => m.id === showtimeData.movieId) ||
                          await MovieService.getMovieById(showtimeData.movieId);
                          
        const theaterData = theaters.find(t => t.id === showtimeData.theaterId) ||
                            await TheaterService.getTheaterById(showtimeData.theaterId);
        
        if (!movieData || !theaterData) {
          setError('电影或影厅数据不存在');
          setLoading(false);
          return;
        }
        
        setMovie(movieData);
        setTheater(theaterData);
      } catch (err) {
        console.error('Failed to fetch showtime data:', err);
        setError('加载数据时出错');
      } finally {
        setLoading(false);
      }
    }
    
    if (showtimeId) {
      fetchData();
    }
  }, [showtimeId, showtimes, movies, theaters]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }
  
  if (error || !showtime || !movie || !theater) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">{error || '数据错误'}</h2>
        <p className="text-slate-500 mt-2">
          {error ? '' : '无法加载场次、电影或影厅数据'}
        </p>
      </div>
    );
  }
  
  // 将数据传递给客户端组件进行交互
  return <ShowtimeDetailClient showtime={showtime} movie={movie} theater={theater} />;
} 