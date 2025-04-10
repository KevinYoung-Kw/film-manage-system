'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import MovieCard from '@/app/components/MovieCard';
import { Film, Calendar, Ticket, ChevronRight } from 'lucide-react';
import { MovieStatus, Movie } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';
import { processImageUrl } from '@/app/lib/services/dataService';
import supabase from '@/app/lib/services/supabaseClient';

// 定义默认图片路径
const DEFAULT_BANNER = '/images/default-banner.webp';

export default function UserHome() {
  const { movies, refreshData, isLoading } = useAppContext();
  const [banners, setBanners] = useState<any[]>([]);
  const [featuredBanner, setFeaturedBanner] = useState<any>(null);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [siteInfo, setSiteInfo] = useState<any>({
    name: '电影票务系统',
    address: '中国某省某市某区某街道123号',
    phone: '400-123-4567'
  });
  
  useEffect(() => {
    // 刷新数据
    refreshData();
    
    // 获取轮播图数据
    const fetchBanners = async () => {
      try {
        const { data } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('order_num');
          
        if (data && data.length > 0) {
          setBanners(data);
          setFeaturedBanner(data[0]);
        }
      } catch (error) {
        console.error('获取轮播图失败:', error);
      }
    };
    
    // 获取站点信息
    const fetchSiteInfo = async () => {
      try {
        const { data } = await supabase
          .from('site_info')
          .select('*')
          .single();
          
        if (data) {
          setSiteInfo(data);
        }
      } catch (error) {
        console.error('获取站点信息失败:', error);
      }
    };
    
    fetchBanners();
    fetchSiteInfo();
  }, [refreshData]);
  
  useEffect(() => {
    if (movies.length > 0) {
      // 热门电影列表
      const popular = movies
        .filter(movie => movie.status === MovieStatus.SHOWING)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      setPopularMovies(popular);
      
      // 即将上映的电影
      const upcoming = movies
        .filter(movie => movie.status === MovieStatus.COMING_SOON)
        .slice(0, 4);
      setUpcomingMovies(upcoming);
    }
  }, [movies]);
  
  // 获取有效的banner图片URL
  const bannerImageUrl = featuredBanner 
    ? processImageUrl(featuredBanner.imageUrl) 
    : DEFAULT_BANNER;
  
  return (
    <MobileLayout title="首页" showBackButton={false}>
      {/* 热门banner */}
      <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
        {featuredBanner ? (
          <>
            <Image
              src={bannerImageUrl}
              alt={featuredBanner.title || "电影banner"}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
              <h2 className="text-white text-xl font-bold">{featuredBanner.title}</h2>
              <p className="text-white/80 text-sm">{featuredBanner.description}</p>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-slate-500">加载中...</p>
          </div>
        )}
      </div>
      
      {/* 快捷操作 */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <Link href="/user/movies">
          <Card className="flex flex-col items-center py-4 hover:bg-slate-50">
            <Film className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-xs text-slate-700">电影</span>
          </Card>
        </Link>
        <Link href="/user/showtimes">
          <Card className="flex flex-col items-center py-4 hover:bg-slate-50">
            <Calendar className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-xs text-slate-700">场次</span>
          </Card>
        </Link>
        <Link href="/user/orders">
          <Card className="flex flex-col items-center py-4 hover:bg-slate-50">
            <Ticket className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-xs text-slate-700">订单</span>
          </Card>
        </Link>
      </div>
      
      {/* 热门电影 */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">热门电影</h2>
          <Link href="/user/movies" className="text-xs text-indigo-600 flex items-center">
            查看全部 <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <div className="col-span-2 py-10 text-center text-slate-500">加载中...</div>
          ) : popularMovies.length > 0 ? (
            popularMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-slate-500">暂无热门电影</div>
          )}
        </div>
      </div>
      
      {/* 即将上映 */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">即将上映</h2>
          <Link href="/user/movies" className="text-xs text-indigo-600 flex items-center">
            查看全部 <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <div className="col-span-2 py-10 text-center text-slate-500">加载中...</div>
          ) : upcomingMovies.length > 0 ? (
            upcomingMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-slate-500">暂无即将上映电影</div>
          )}
        </div>
      </div>
      
      {/* 影院信息 */}
      <div className="px-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">影院信息</h3>
            <p className="text-sm text-slate-600 mb-1">{siteInfo.name}</p>
            <p className="text-xs text-slate-500 mb-1">{siteInfo.address}</p>
            <p className="text-xs text-slate-500">电话: {siteInfo.phone}</p>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
} 