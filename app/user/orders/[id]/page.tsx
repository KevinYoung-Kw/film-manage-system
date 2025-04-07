'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import QRCodeTicket from '@/app/components/ui/QRCodeTicket';
import { mockOrders, mockMovies, mockShowtimes, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { Order, OrderStatus, Seat } from '@/app/lib/types';
import { Film, Calendar, MapPin, Clock, AlertCircle, Download, Share2 } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  
  useEffect(() => {
    // 获取订单信息 - 从localStorage和mockData合并
    let foundOrder = mockOrders.find(o => o.id === orderId);
    
    // 如果mock数据中没有找到，尝试从localStorage中查找
    if (!foundOrder) {
      const localOrdersJson = localStorage.getItem('orders');
      if (localOrdersJson) {
        const localOrders = JSON.parse(localOrdersJson);
        foundOrder = localOrders.find((o: any) => o.id === orderId);
      }
    }
    
    if (foundOrder) {
      setOrder(foundOrder);
      
      // 获取相关联的场次信息
      const relatedShowtime = mockShowtimes.find(s => s.id === foundOrder.showtimeId);
      
      if (relatedShowtime) {
        setShowtime(relatedShowtime);
        
        // 获取电影信息
        const relatedMovie = mockMovies.find(m => m.id === relatedShowtime.movieId);
        if (relatedMovie) setMovie(relatedMovie);
        
        // 获取影厅信息
        const relatedTheater = mockTheaters.find(t => t.id === relatedShowtime.theaterId);
        if (relatedTheater) setTheater(relatedTheater);
      }
    }
  }, [orderId]);
  
  // 获取座位信息
  const getSeatInfo = (seatId: string) => {
    if (!showtime) return { row: 0, column: 0 };
    
    const seat = showtime.availableSeats.find((s: Seat) => s.id === seatId);
    
    if (!seat) return { row: 0, column: 0 };
    return { row: seat.row, column: seat.column };
  };
  
  // 下载电子票
  const handleDownloadTicket = () => {
    alert('电子票下载功能将在后续版本中推出');
  };
  
  // 分享电子票
  const handleShareTicket = () => {
    // 检查Navigator API中是否有分享功能
    if (navigator.share) {
      navigator.share({
        title: `${movie?.title} 电影票`,
        text: `我购买了${movie?.title}的电影票，时间：${format(new Date(showtime?.startTime), 'yyyy-MM-dd HH:mm')}`,
        url: window.location.href,
      })
      .catch((error) => alert('分享失败: ' + error));
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('链接已复制到剪贴板，您可以手动分享'))
        .catch(() => alert('复制失败，请手动复制链接'));
    }
  };
  
  if (!order || !movie || !showtime || !theater) {
    return (
      <MobileLayout title="票券详情" showBackButton>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </MobileLayout>
    );
  }
  
  // 格式化座位信息
  const formattedSeats = order.seats.map(seatId => {
    const { row, column } = getSeatInfo(seatId);
    return `${row}排${column}座`;
  });
  
  // 票据数据
  const ticketData = {
    orderId: order.id,
    movieTitle: movie.title,
    theaterName: theater.name,
    startTime: showtime.startTime,
    seats: formattedSeats
  };
  
  return (
    <MobileLayout title="票券详情" showBackButton>
      <div className="px-4 py-6">
        {/* 电影票卡片 */}
        <Card className="mb-6 overflow-hidden relative">
          {/* 票券头部 */}
          <div className="bg-indigo-600 p-4 text-white">
            <div className="flex items-center">
              <div className="relative h-20 w-14 rounded overflow-hidden bg-white/10">
                <Image
                  src={movie.poster || defaultImages.moviePoster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="ml-3 flex-1">
                <h2 className="font-bold text-lg">{movie.title}</h2>
                <div className="text-white/80 text-sm mt-1">
                  {movie.duration}分钟 | {movie.genre.join('/')}
                </div>
              </div>
            </div>
          </div>
          
          {/* 虚线边框 */}
          <div className="border-dashed border-t border-slate-200 flex relative">
            <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-slate-100 transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute right-0 top-0 h-4 w-4 rounded-full bg-slate-100 transform translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* 票券详情 */}
          <div className="p-4">
            <div className="flex mb-4">
              <Calendar className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">日期和时间</div>
                <div className="text-slate-600">
                  {format(new Date(showtime.startTime), 'yyyy年MM月dd日 HH:mm')}
                </div>
              </div>
            </div>
            
            <div className="flex mb-4">
              <MapPin className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">影院信息</div>
                <div className="text-slate-600">{theater.name}</div>
              </div>
            </div>
            
            <div className="flex mb-4">
              <Film className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">座位</div>
                <div className="text-slate-600">
                  {formattedSeats.join('、')}
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 mb-2">
              <div className="text-sm text-slate-500 mb-4">请向工作人员出示二维码</div>
              
              {/* 使用新的QRCodeTicket组件 */}
              <QRCodeTicket ticketData={ticketData} />
            </div>
          </div>
        </Card>
        
        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleDownloadTicket}
          >
            <Download className="h-4 w-4 mr-2" />
            保存票券
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShareTicket}
          >
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
        </div>
        
        {/* 观影提醒 */}
        <Card className="p-4 bg-amber-50 border border-amber-100">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">观影提醒</h3>
              <p className="text-sm text-amber-700 mt-1">
                请在观影开始前15分钟到达影院，超过开场时间15分钟后将无法入场。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
} 