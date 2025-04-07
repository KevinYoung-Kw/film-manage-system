'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { CreditCard, Check, MapPin } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SeatMap from '@/app/components/SeatMap';
import { mockShowtimes, mockMovies, mockTheaters } from '@/app/lib/mockData';
import { TicketType } from '@/app/lib/types';
import { staffRoutes } from '@/app/lib/utils/navigation';

export default function StaffSeatSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const showtimeId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [showtime, setShowtime] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketType, setTicketType] = useState<TicketType>(TicketType.NORMAL);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  useEffect(() => {
    // 获取场次、电影和影厅信息
    const foundShowtime = mockShowtimes.find(s => s.id === showtimeId);
    
    if (!foundShowtime) {
      router.push(staffRoutes.sell);
      return;
    }
    
    setShowtime(foundShowtime);
    
    const foundMovie = mockMovies.find(m => m.id === foundShowtime.movieId);
    const foundTheater = mockTheaters.find(t => t.id === foundShowtime.theaterId);
    
    if (foundMovie && foundTheater) {
      setMovie(foundMovie);
      setTheater(foundTheater);
    }
  }, [showtimeId, router]);
  
  // 处理座位选择
  const handleSeatSelection = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length < ticketCount) {
        setSelectedSeats(prev => [...prev, seatId]);
      } else {
        alert(`最多只能选择${ticketCount}个座位`);
      }
    }
  };
  
  // 处理票类型选择
  const handleTicketTypeChange = (type: TicketType) => {
    setTicketType(type);
  };
  
  // 显示座位序号
  const getSeatLabel = (seatId: string) => {
    if (!showtime) return '';
    
    const seat = showtime.availableSeats.find((s: any) => s.id === seatId);
    if (!seat) return '';
    
    // 转换为字母行号 (A, B, C...)
    const rowLabel = String.fromCharCode(64 + seat.row);
    return `${rowLabel}${seat.column}`;
  };
  
  // 计算总价
  const totalPrice = selectedSeats.length * (showtime?.price[ticketType] || 0);
  
  // 处理提交订单
  const handleSubmitOrder = () => {
    if (selectedSeats.length === 0) {
      alert('请至少选择一个座位');
      return;
    }
    
    if (selectedSeats.length !== ticketCount) {
      alert(`请选择${ticketCount}个座位`);
      return;
    }
    
    // 在实际应用中，这里会调用API创建订单
    // 简单模拟创建订单并跳转
    const orderData = {
      showtimeId: showtime.id,
      movieId: movie.id,
      theaterId: theater.id,
      seats: selectedSeats,
      ticketType,
      ticketCount,
      totalPrice,
      customerName,
      customerPhone,
      movieTitle: movie.title,
      theaterName: theater.name,
      startTime: showtime.startTime
    };
    
    // 存储订单数据到sessionStorage
    sessionStorage.setItem('pendingStaffOrder', JSON.stringify(orderData));
    
    // 跳转到支付页面
    router.push(staffRoutes.sellCheckout(showtime.id));
  };
  
  // 获取票类型的显示名称
  const getTicketTypeLabel = (type: TicketType): string => {
    const labels: Record<TicketType, string> = {
      [TicketType.NORMAL]: '普通票',
      [TicketType.STUDENT]: '学生票',
      [TicketType.SENIOR]: '老人票',
      [TicketType.CHILD]: '儿童票',
      [TicketType.VIP]: 'VIP票'
    };
    return labels[type];
  };
  
  if (!showtime || !movie || !theater) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }
  
  return (
    <MobileLayout title="选座售票" userRole="staff" showBackButton>
      <div className="pb-24">
        {/* 场次信息 */}
        <Card className="rounded-none shadow-none">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-medium">{movie.title}</h2>
            <div className="text-sm text-slate-500 mt-1 flex">
              <span className="mr-3">{format(new Date(showtime.startTime), 'MM月dd日 HH:mm')}</span>
              <span>{theater.name}</span>
            </div>
          </div>
          
          {/* 客户信息 */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-medium mb-3">客户信息</h3>
            <div className="mb-3">
              <label className="block text-sm text-slate-500 mb-1">姓名（选填）</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="请输入客户姓名"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">手机号（选填）</label>
              <input
                type="tel"
                className="w-full p-2 border border-slate-300 rounded"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="请输入客户手机号"
              />
            </div>
          </div>
          
          {/* 票数选择 */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-medium mb-3">选择票数</h3>
            <div className="flex space-x-3">
              {[1, 2, 3, 4].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    setTicketCount(count);
                    setSelectedSeats([]);  // 清空已选座位
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ticketCount === count 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          {/* 票类型选择 */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-medium mb-3">选择票类型</h3>
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
          <h3 className="font-medium mb-4">请选择座位</h3>
          <SeatMap
            seats={showtime.availableSeats}
            rows={theater.rows}
            columns={theater.columns}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelection}
            maxSelectableSeats={ticketCount}
          />
        </div>
        
        {/* 已选座位 */}
        <div className="bg-white p-4 mt-2">
          <h3 className="font-medium mb-3">已选座位</h3>
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
                    <span className="sr-only">移除</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">请在座位图上选择座位</p>
          )}
        </div>
      </div>
      
      {/* 底部结算栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 max-w-md mx-auto z-20">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm text-slate-600">总价</div>
            <div className="text-xl font-semibold text-indigo-600">¥{totalPrice}</div>
          </div>
          <div className="text-sm text-slate-500">
            {selectedSeats.length}张票 × ¥{showtime.price[ticketType]}
          </div>
        </div>
        <Button
          variant="primary"
          fullWidth
          disabled={selectedSeats.length !== ticketCount}
          onClick={handleSubmitOrder}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          确认选座并结算
        </Button>
      </div>
    </MobileLayout>
  );
} 