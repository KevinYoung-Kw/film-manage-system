'use client';

import React from 'react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import MovieCard from '@/app/components/MovieCard';
import TabGroup from '@/app/components/ui/TabGroup';
import { mockMovies } from '@/app/lib/mockData';
import { Search } from 'lucide-react';

export default function UserMoviesPage() {
  // 把电影按类型分组
  const actionMovies = mockMovies.filter(movie => movie.genre.includes('科幻') || movie.genre.includes('冒险'));
  const comedyMovies = mockMovies.filter(movie => movie.genre.includes('喜剧'));
  const dramaMovies = mockMovies.filter(movie => movie.genre.includes('剧情'));
  const animationMovies = mockMovies.filter(movie => movie.genre.includes('动画'));

  // 定义标签页内容
  const tabs = [
    {
      key: 'all',
      label: '全部',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {mockMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
    {
      key: 'action',
      label: '科幻/冒险',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {actionMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
    {
      key: 'comedy',
      label: '喜剧',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {comedyMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
    {
      key: 'drama',
      label: '剧情',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {dramaMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
    {
      key: 'animation',
      label: '动画',
      content: (
        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          {animationMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
  ];

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