'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CheckCircle, Clock, Calendar, MapPin } from 'lucide-react';
import { defaultImages, mockShowtimes, mockMovies, mockTheaters } from '@/app/lib/mockData';
import { userRoutes } from '@/app/lib/utils/navigation';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const { orders, refreshData } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  
  // 页面加载时刷新数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  useEffect(() => {
    if (!orderId || orders.length === 0) return;
    
    // 从AppContext中获取订单信息
    const currentOrder = orders.find(o => o.id === orderId);
    
    if (!currentOrder) {
      router.push(userRoutes.orders);
      return;
    }
    
    setOrder(currentOrder);
    
    // 获取场次信息
    const showtimeData = mockShowtimes.find(s => s.id === currentOrder.showtimeId);
    if (!showtimeData) {
      router.push(userRoutes.orders);
      return;
    }
    
    setShowtime(showtimeData);
    
    // 获取电影和影院信息
    const movieData = mockMovies.find(m => m.id === showtimeData.movieId);
    if (movieData) setMovie(movieData);
    
    const theaterData = mockTheaters.find(t => t.id === showtimeData.theaterId);
    if (theaterData) setTheater(theaterData);
    
    setLoading(false);
  }, [orderId, orders, router]);
  
  if (loading || !order || !movie) {
    return (
      <MobileLayout title="订单确认" showBackButton>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">加载中...</div>
        </div>
      </MobileLayout>
    );
  }
  
  // 格式化时间
  const formattedTime = showtime ? format(new Date(showtime.startTime), 'yyyy-MM-dd HH:mm') : '';
  
  return (
    <MobileLayout title="订单确认" showBackButton>
      <div className="p-4 space-y-4">
        {/* 订单状态 */}
        <Card className="p-6 flex flex-col items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-xl font-semibold mb-2">订单已完成</h1>
          <p className="text-slate-500 mb-6">感谢您的购买，祝您观影愉快！</p>
          
          <div className="w-full border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500">订单编号</span>
              <span className="font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">支付时间</span>
              <span>{order.paidAt ? format(new Date(order.paidAt), 'yyyy-MM-dd HH:mm') : '-'}</span>
            </div>
          </div>
        </Card>
        
        {/* 电影信息 */}
        <Card className="p-4">
          <div className="flex space-x-3">
            <div className="relative h-20 w-14 rounded overflow-hidden">
              <Image
                src={movie.poster || defaultImages.moviePoster}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div>
              <h2 className="font-semibold">{movie.title}</h2>
              {theater && <p className="text-sm text-slate-500">{theater.name}</p>}
              
              <div className="flex items-center mt-2 text-xs text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formattedTime}</span>
              </div>
              
              <div className="mt-2 text-xs">
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  {order.seats?.length || 0}个座位
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* 座位信息 */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">座位信息</h3>
          <div className="flex flex-wrap gap-2">
            {order.seats.map((seatId: string) => {
              const seat = showtime?.availableSeats.find((s: any) => s.id === seatId);
              if (!seat) return null;
              
              // 转换为字母行号 (A, B, C...)
              const rowLabel = String.fromCharCode(64 + seat.row);
              const seatLabel = `${rowLabel}${seat.column}`;
              
              return (
                <span key={seatId} className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {seatLabel}
                </span>
              );
            })}
          </div>
        </Card>
        
        {/* 按钮 */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(userRoutes.movieList)}
          >
            返回首页
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => router.push(userRoutes.orders)}
          >
            查看订单
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
} 