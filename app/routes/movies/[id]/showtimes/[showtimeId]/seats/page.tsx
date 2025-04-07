'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SeatMap from '@/app/components/SeatMap';
import { mockMovies, mockShowtimes, mockTheaters } from '@/app/lib/mockData';
import { TicketType } from '@/app/lib/types';
import { MinusCircle, PlusCircle, CreditCard, AlertCircle } from 'lucide-react';

export default function SeatSelectionPage({ 
  params 
}: { 
  params: { id: string; showtimeId: string } 
}) {
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketCount, setTicketCount] = useState(1);
  
  useEffect(() => {
    // 获取场次信息
    const targetShowtime = mockShowtimes.find(s => s.id === params.showtimeId);
    
    if (targetShowtime) {
      setShowtime(targetShowtime);
      
      // 获取电影信息
      const targetMovie = mockMovies.find(m => m.id === targetShowtime.movieId);
      if (targetMovie) setMovie(targetMovie);
      
      // 获取影厅信息
      const targetTheater = mockTheaters.find(t => t.id === targetShowtime.theaterId);
      if (targetTheater) setTheater(targetTheater);
    }
  }, [params.id, params.showtimeId]);
  
  const handleSeatSelect = (seatId: string) => {
    // 如果已经选择了这个座位，则取消选择
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      return;
    }
    
    // 如果选择的座位数量超过票数，则取消最早选择的座位
    if (selectedSeats.length >= ticketCount) {
      setSelectedSeats([...selectedSeats.slice(1), seatId]);
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };
  
  const handleTicketCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(4, count));
    setTicketCount(newCount);
    
    // 如果减少票数，则移除多余的座位
    if (newCount < selectedSeats.length) {
      setSelectedSeats(selectedSeats.slice(0, newCount));
    }
  };
  
  const handleConfirmSelection = () => {
    if (selectedSeats.length < ticketCount) {
      alert(`请选择${ticketCount}个座位`);
      return;
    }
    
    // 跳转到支付页面
    router.push(`/payment?showtimeId=${showtime.id}&seats=${selectedSeats.join(',')}`);
  };
  
  if (!movie || !showtime || !theater) {
    return (
      <MobileLayout title="选择座位" showBackButton>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </MobileLayout>
    );
  }
  
  const totalPrice = ticketCount * showtime.price[TicketType.NORMAL];
  
  return (
    <MobileLayout title="选择座位" showBackButton>
      {/* 影片和场次信息 */}
      <div className="bg-white p-4 border-b border-slate-100">
        <h1 className="font-semibold">{movie.title}</h1>
        <div className="flex text-sm text-slate-500 mt-1">
          <span>{format(new Date(showtime.startTime), 'yyyy年MM月dd日')}</span>
          <span className="mx-2">|</span>
          <span>{format(new Date(showtime.startTime), 'HH:mm')}-{format(new Date(showtime.endTime), 'HH:mm')}</span>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          {theater.name}
        </div>
      </div>
      
      {/* 选票数量 */}
      <div className="bg-white p-4 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-medium">选择票数</div>
            <div className="text-sm text-slate-500 mt-1">
              单价: ¥{showtime.price[TicketType.NORMAL]} × {ticketCount}张
            </div>
          </div>
          <div className="flex items-center">
            <button 
              className="text-slate-400 disabled:text-slate-200"
              onClick={() => handleTicketCountChange(ticketCount - 1)}
              disabled={ticketCount <= 1}
            >
              <MinusCircle className="h-6 w-6" />
            </button>
            <span className="mx-3 font-medium text-lg">{ticketCount}</span>
            <button 
              className="text-indigo-500 disabled:text-indigo-200"
              onClick={() => handleTicketCountChange(ticketCount + 1)}
              disabled={ticketCount >= 4}
            >
              <PlusCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* 提示信息 */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-indigo-700">
            请选择{ticketCount}个座位，已选择{selectedSeats.length}个座位。
          </p>
        </div>
      </div>
      
      {/* 座位图 */}
      <div className="p-4">
        <Card className="p-4 mb-6 overflow-auto">
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <div className="w-64 h-6 bg-slate-300 rounded-t-lg flex items-center justify-center text-white text-xs">
                银幕方向
              </div>
            </div>
          </div>
          
          <div className="overflow-auto">
            <SeatMap
              seats={showtime.availableSeats}
              rows={theater.rows}
              columns={theater.columns}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              maxSelectableSeats={ticketCount}
            />
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-slate-200 mr-2"></div>
              <span className="text-xs text-slate-500">可选</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-indigo-500 mr-2"></div>
              <span className="text-xs text-slate-500">已选</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-slate-400 mr-2"></div>
              <span className="text-xs text-slate-500">已售</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-amber-500 mr-2"></div>
              <span className="text-xs text-slate-500">VIP</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-sm bg-red-500 mr-2"></div>
              <span className="text-xs text-slate-500">情侣</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm">总计</div>
          <div className="text-red-500 font-bold">¥{totalPrice}</div>
        </div>
        <Button
          variant="primary"
          disabled={selectedSeats.length < ticketCount}
          onClick={handleConfirmSelection}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          确认选座
        </Button>
      </div>
      
      {/* 底部空白区域，避免内容被固定底栏遮挡 */}
      <div className="h-24"></div>
    </MobileLayout>
  );
} 