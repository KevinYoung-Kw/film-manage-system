'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MovieService } from '@services/dataService';
import MovieShowtimesClient from './MovieShowtimesClient';
import { Movie } from '@/app/lib/types';

export default function UserMovieShowtimesPage() {
  const params = useParams();
  const movieId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 获取电影信息
        const movieData = await MovieService.getMovieById(movieId);
        setMovie(movieData || null);
      } catch (error) {
        console.error('Failed to fetch movie data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (movieId) {
      fetchData();
    }
  }, [movieId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }
  
  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-lg font-semibold text-slate-800">电影不存在</h2>
        <p className="text-slate-500 mt-2">未找到此电影信息</p>
      </div>
    );
  }
  
  return <MovieShowtimesClient movie={movie} />;
} 