import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import MovieCard from '@/app/components/MovieCard';
import { mockMovies, mockBanners, siteInfo } from '@/app/lib/mockData';
import { defaultImages } from '@/app/lib/mockData';
import { Film, Calendar, Ticket, ChevronRight } from 'lucide-react';
import { MovieStatus } from '@/app/lib/types';

export default function UserHome() {
  // 选择一部热门电影作为Banner
  const featuredBanner = mockBanners[0]; // 使用轮播图数据的第一项
  
  // 热门电影列表
  const popularMovies = mockMovies.slice(0, 4);
  
  // 即将上映的电影
  const upcomingMovies = mockMovies.filter(movie => movie.status === MovieStatus.COMING_SOON).slice(0, 4);

  return (
    <MobileLayout title="我的影院">
      {/* Banner区域 */}
      <div className="relative w-full h-64 mb-6">
        <Image
          src={featuredBanner.imageUrl || defaultImages.banner}
          alt="Banner"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <h1 className="text-white text-2xl font-bold">{featuredBanner.title}</h1>
          <p className="text-white/80 text-sm line-clamp-2 mt-1">
            {featuredBanner.description}
          </p>
          <Link
            href={featuredBanner.link}
            className="bg-indigo-600 text-white text-center py-2 px-4 rounded-md mt-3 inline-block"
          >
            立即购票
          </Link>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-3 gap-4 mb-6 px-4">
        <Card className="p-3 text-center">
          <CardContent>
            <Link href="/user/movies" className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                <Film className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm">电影</span>
            </Link>
          </CardContent>
        </Card>
        <Card className="p-3 text-center">
          <CardContent>
            <Link href="/user/showtimes" className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-sm">场次</span>
            </Link>
          </CardContent>
        </Card>
        <Card className="p-3 text-center">
          <CardContent>
            <Link href="/user/orders" className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <Ticket className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm">订单</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 热门电影 */}
      <div className="mb-6">
        <div className="flex justify-between items-center px-4 mb-3">
          <h2 className="text-lg font-semibold">热门电影</h2>
          <Link href="/user/movies" className="text-indigo-600 text-sm flex items-center">
            查看全部 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto pb-4">
          <div className="flex px-4 gap-4" style={{ minWidth: 'max-content' }}>
            {popularMovies.map(movie => (
              <div key={movie.id} style={{ width: '150px' }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 即将上映 */}
      <div className="mb-6">
        <div className="flex justify-between items-center px-4 mb-3">
          <h2 className="text-lg font-semibold">即将上映</h2>
          <Link href="/user/upcoming" className="text-indigo-600 text-sm flex items-center">
            查看全部 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="px-4 space-y-3">
          {upcomingMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} variant="compact" />
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="text-center mt-8 mb-4 px-4 text-slate-400 text-xs">
        <p>{siteInfo.copyright}</p>
        <p className="mt-1">影院地址: {siteInfo.address}</p>
        <p className="mt-1">营业时间: {siteInfo.workingHours}</p>
      </div>
    </MobileLayout>
  );
} 