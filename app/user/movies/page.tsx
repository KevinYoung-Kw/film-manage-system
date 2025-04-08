'use client';

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import MovieCard from '@/app/components/MovieCard';
import TabGroup from '@/app/components/ui/TabGroup';
import { Search } from 'lucide-react';
import { MovieService } from '@/app/lib/services/dataService';
import { Movie } from '@/app/lib/types';

export default function UserMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 加载电影数据
  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        setError(null);
        
        const moviesData = await MovieService.getAllMovies();
        setMovies(moviesData);
      } catch (err) {
        console.error('Failed to load movies:', err);
        setError('无法加载电影列表，请稍后再试');
      } finally {
        setLoading(false);
      }
    }
    
    loadMovies();
  }, []);
  
  // 搜索过滤电影
  const filteredMovies = searchQuery.trim() 
    ? movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : movies;
  
  // 把电影按类型分组
  const actionMovies = filteredMovies.filter(movie => movie.genre.includes('科幻') || movie.genre.includes('冒险'));
  const comedyMovies = filteredMovies.filter(movie => movie.genre.includes('喜剧'));
  const dramaMovies = filteredMovies.filter(movie => movie.genre.includes('剧情'));
  const animationMovies = filteredMovies.filter(movie => movie.genre.includes('动画'));

  // 定义标签页内容
  const tabs = [
    {
      key: 'all',
      label: '全部',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {filteredMovies.length > 0 ? (
            filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">
              {loading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-3">加载中...</p>
                </div>
              ) : error ? (
                <p>{error}</p>
              ) : searchQuery ? (
                <p>未找到符合"{searchQuery}"的电影</p>
              ) : (
                <p>暂无电影信息</p>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: '科幻/冒险',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {actionMovies.length > 0 ? (
            actionMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">
              {searchQuery ? <p>未找到符合条件的科幻/冒险电影</p> : <p>暂无科幻/冒险电影</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'comedy',
      label: '喜剧',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {comedyMovies.length > 0 ? (
            comedyMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">
              {searchQuery ? <p>未找到符合条件的喜剧电影</p> : <p>暂无喜剧电影</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'drama',
      label: '剧情',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {dramaMovies.length > 0 ? (
            dramaMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">
              {searchQuery ? <p>未找到符合条件的剧情电影</p> : <p>暂无剧情电影</p>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'animation',
      label: '动画',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {animationMovies.length > 0 ? (
            animationMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-slate-500">
              {searchQuery ? <p>未找到符合条件的动画电影</p> : <p>暂无动画电影</p>}
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <MobileLayout 
      title="电影" 
      showBackButton 
      rightAction={
        <button className="p-2 rounded-full hover:bg-slate-100">
          <Search className="h-5 w-5 text-slate-600" />
        </button>
      }
    >
      {/* 搜索框 */}
      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索电影..."
            className="w-full py-2 pl-10 pr-4 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* 电影分类标签页 */}
      <TabGroup
        tabs={tabs}
        variant="pills"
        className="px-4"
        fullWidth
      />
    </MobileLayout>
  );
} 