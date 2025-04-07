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
import { defaultImages } from '@/app/lib/mockData';
import { MovieService, TheaterService } from '@/app/lib/services/dataService';
import { userRoutes } from '@/app/lib/utils/navigation';

export default function OrderSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [order, setOrder] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  
  useEffect(() => {
    // 从localStorage获取订单信息
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const currentOrder = orders.find((o: any) => o.id === orderId);
    
    if (!currentOrder) {
      router.push(userRoutes.orders);
      return;
    }
    
    setOrder(currentOrder);
    
    // 获取电影和影院信息
    async function loadData() {
      if (currentOrder.movieTitle) {
        // 已有电影标题，直接使用
        setMovie({ title: currentOrder.movieTitle });
      } else if (currentOrder.showtimeId) {
        // 通过场次ID查找电影
        const allMovies = await MovieService.getAllMovies();
        // 查找电影逻辑 (简化版)
        setMovie(allMovies[0]);
      }
      
      if (currentOrder.theaterName) {
        // 已有影院名称，直接使用
        setTheater({ name: currentOrder.theaterName });
      } else {
        // 获取所有影院信息
        const theaters = await TheaterService.getAllTheaters();
        // 此处简化逻辑，实际应根据场次信息获取影院
        setTheater(theaters[0]);
      }
    }
    
    loadData();
  }, [orderId, router]);
  
  if (!order || !movie) {
    return (
      <MobileLayout title="订单确认" showBackButton>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">加载中...</div>
        </div>
      </MobileLayout>
    );
  }
  
  // 格式化时间
  const formattedTime = order.startTime ? format(new Date(order.startTime), 'yyyy-MM-dd HH:mm') : '';
  
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
              <span>{order.payTime ? format(new Date(order.payTime), 'yyyy-MM-dd HH:mm') : '-'}</span>
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