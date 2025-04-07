'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, Calendar, MapPin, Trash } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardFooter } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SeatMap from '@/app/components/SeatMap';
import { mockMovies, mockShowtimes, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { TicketType } from '@/app/lib/types';

export default function ShowtimeDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketType, setTicketType] = useState<TicketType>(TicketType.NORMAL);
  
  // 获取场次信息
  const showtime = mockShowtimes.find(s => s.id === params.id);
  
  if (!showtime) {
    return (
      <MobileLayout title="选座购票" showBackButton>
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-lg font-semibold text-slate-800">场次不存在</h2>
          <p className="text-slate-500 mt-2">未找到此场次信息</p>
          <Button 
            onClick={() => router.push('/movies')}
            className="mt-4"
          >
            返回电影列表
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  // 获取电影和影厅信息
  const movie = mockMovies.find(m => m.id === showtime.movieId);
  const theater = mockTheaters.find(t => t.id === showtime.theaterId);
  
  if (!movie || !theater) {
    return (
      <MobileLayout title="选座购票" showBackButton>
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-lg font-semibold text-slate-800">数据错误</h2>
          <p className="text-slate-500 mt-2">电影或影厅数据不存在</p>
          <Button 
            onClick={() => router.push('/movies')}
            className="mt-4"
          >
            返回电影列表
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  // 格式化时间和日期
  const startTime = format(showtime.startTime, 'HH:mm');
  const endTime = format(showtime.endTime, 'HH:mm');
  const date = format(showtime.startTime, 'yyyy年MM月dd日');
  const dayOfWeek = format(showtime.startTime, 'EEEE');
  
  // 处理座位选择
  const handleSeatSelection = (seatId: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };
  
  // 计算总价
  const totalPrice = selectedSeats.length * showtime.price[ticketType];
  
  // 处理票类型选择
  const handleTicketTypeChange = (type: TicketType) => {
    setTicketType(type);
  };
  
  // 显示座位序号
  const getSeatLabel = (seatId: string) => {
    const seat = showtime.availableSeats.find(s => s.id === seatId);
    if (!seat) return '';
    
    // 转换为字母行号 (A, B, C...)
    const rowLabel = String.fromCharCode(64 + seat.row);
    return `${rowLabel}${seat.column}`;
  };
  
  // 处理提交订单
  const handleSubmitOrder = () => {
    if (selectedSeats.length === 0) {
      alert('请至少选择一个座位');
      return;
    }
    
    // 在实际应用中，这里会进行下单操作，然后跳转到支付页面
    // 模拟创建订单并跳转
    const orderData = {
      showtimeId: showtime.id,
      seats: selectedSeats,
      ticketType,
      totalPrice,
      movieTitle: movie.title,
      theaterName: theater.name,
      startTime: showtime.startTime,
    };
    
    // 存储订单数据到sessionStorage
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // 跳转到支付页面
    router.push(`/payment?showtimeId=${showtime.id}`);
  };

  return (
    <MobileLayout title="选座购票" showBackButton>
      {/* 电影和场次信息 */}
      <Card className="rounded-none shadow-none">
        <div className="p-4 border-b border-slate-100">
          <div className="flex space-x-4 p-4 border-b">
            <div className="relative w-20 h-28 flex-shrink-0">
              <Image
                src={movie.poster || defaultImages.moviePoster}
                alt={movie.title}
                fill
                className="object-cover rounded-md"
                unoptimized
              />
            </div>
            <div className="ml-3 flex-1">
              <h1 className="font-semibold text-lg">{movie.title}</h1>
              <div className="text-xs text-slate-500 mt-1">
                {movie.duration}分钟 | {movie.genre.join('/')}
              </div>
              
              <div className="mt-3 text-sm text-slate-700 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {date} {dayOfWeek}
              </div>
              <div className="mt-1 text-sm text-slate-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {startTime} - {endTime}
              </div>
              <div className="mt-1 text-sm text-slate-700 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {theater.name}
              </div>
            </div>
          </div>
        </div>
        
        {/* 票类型选择 */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold mb-3">选择票类型</h2>
          <div className="flex flex-wrap gap-2">
            {Object.values(TicketType).map((type) => (
              <button
                key={type}
                className={`py-1 px-3 rounded-full text-sm ${
                  ticketType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
                onClick={() => handleTicketTypeChange(type)}
              >
                {getTicketTypeLabel(type)} ¥{showtime.price[type]}
              </button>
            ))}
          </div>
        </div>
      </Card>
      
      {/* 座位图 */}
      <div className="bg-white p-4 mt-2">
        <h2 className="font-semibold mb-4">请选择座位</h2>
        <SeatMap
          seats={showtime.availableSeats}
          rows={theater.rows}
          columns={theater.columns}
          selectedSeats={selectedSeats}
          onSeatSelect={handleSeatSelection}
          maxSelectableSeats={4}
        />
      </div>
      
      {/* 已选座位 */}
      <div className="bg-white p-4 mt-2">
        <h2 className="font-semibold mb-3">已选座位</h2>
        {selectedSeats.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSeats.map(seatId => (
              <div 
                key={seatId} 
                className="flex items-center bg-indigo-50 text-indigo-700 rounded-full py-1 px-3"
              >
                <span className="text-sm">{getSeatLabel(seatId)}</span>
                <button 
                  onClick={() => handleSeatSelection(seatId)}
                  className="ml-1 p-1 rounded-full hover:bg-indigo-100"
                >
                  <Trash className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">请至少选择一个座位</p>
        )}
      </div>
      
      {/* 底部结算栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 max-w-md mx-auto z-20">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm text-slate-600">总价</div>
            <div className="text-xl font-semibold text-indigo-600">¥{totalPrice}</div>
          </div>
          <div className="text-sm text-slate-500">
            {selectedSeats.length}张票 × ¥{showtime.price[ticketType]}
          </div>
        </div>
        <Button
          fullWidth
          size="lg"
          disabled={selectedSeats.length === 0}
          onClick={handleSubmitOrder}
        >
          确认选座，前往支付
        </Button>
      </div>
      
      {/* 底部空白区，防止内容被底部栏遮挡 */}
      <div className="h-32"></div>
    </MobileLayout>
  );
}

// 辅助函数：获取票类型的显示名称
function getTicketTypeLabel(type: TicketType): string {
  const labels: Record<TicketType, string> = {
    [TicketType.NORMAL]: '普通票',
    [TicketType.STUDENT]: '学生票',
    [TicketType.SENIOR]: '老人票',
    [TicketType.CHILD]: '儿童票',
    [TicketType.VIP]: 'VIP票'
  };
  return labels[type];
} 