'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Calendar, MapPin, Trash, AlertTriangle } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardFooter } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SeatMap from '@/app/components/SeatMap';
import { defaultImages } from '@/app/lib/mockData';
import { Movie, Showtime, Theater, TicketType } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';
import { userRoutes } from '@/app/lib/utils/navigation';

interface ShowtimeDetailClientProps {
  showtime: Showtime;
  movie: Movie;
  theater: Theater;
}

export default function ShowtimeDetailClient({ showtime, movie, theater }: ShowtimeDetailClientProps) {
  const router = useRouter();
  const { selectShowtime, selectedSeats, selectSeat, unselectSeat, clearSelectedSeats } = useAppContext();
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType>(TicketType.NORMAL);
  
  // 使用ref跟踪初始化状态，避免重复设置
  const isInitialized = useRef(false);
  
  // 检查场次是否已过期
  const now = new Date();
  const showtimeDate = new Date(showtime.startTime);
  
  // 获取日期部分进行比较
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const showtimeDay = new Date(showtimeDate);
  showtimeDay.setHours(0, 0, 0, 0);
  
  // 未来日期的场次永远不会过期
  const isFutureDay = showtimeDay > today;
  
  // 计算开场后的分钟数
  const minutesAfterStart = showtimeDate < now ? 
    Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60)) : 0;
  
  // 只有当场次日期是当天或过去的日期，且开场超过15分钟才算真正过期
  const isExpired = !isFutureDay && showtimeDate < now && minutesAfterStart > 15;
  
  // 是否已开场但在允许购票时间内
  const isStartedButAllowed = showtimeDate < now && minutesAfterStart <= 15;
  
  // 组件挂载时设置选中的场次，只执行一次
  useEffect(() => {
    if (!isInitialized.current) {
      selectShowtime(showtime);
      isInitialized.current = true;
    }
    
    // 如果场次已过期，自动跳转到场次列表页面
    if (isExpired) {
      // 立即跳转到场次列表页面，不设置延迟
      router.push('/user/showtimes');
      return;
    }
    
    // 清理函数
    return () => {
      // 退出页面时清除选择的座位
      clearSelectedSeats();
    };
  }, [selectShowtime, clearSelectedSeats, isExpired, router]); 
  
  // 格式化时间和日期
  const startTime = format(new Date(showtime.startTime), 'HH:mm');
  const endTime = format(new Date(showtime.endTime), 'HH:mm');
  const date = format(new Date(showtime.startTime), 'yyyy年MM月dd日');
  const dayOfWeek = format(new Date(showtime.startTime), 'EEEE', { locale: zhCN });
  
  // 处理座位选择
  const handleSeatSelection = (seatId: string) => {
    if (isExpired) return; // 如果场次已过期，禁止选座
    
    if (selectedSeats.includes(seatId)) {
      unselectSeat(seatId);
    } else {
      // 检查是否超过最大可选座位数
      if (selectedSeats.length < 4) {
        selectSeat(seatId);
      } else {
        alert('最多只能选择4个座位');
      }
    }
  };
  
  // 计算总价，根据座位类型和票类型
  const calculateTotalPrice = () => {
    let total = 0;
    
    // 对每个选中的座位，计算其价格
    selectedSeats.forEach(seatId => {
      const seat = showtime.availableSeats.find((s: any) => s.id === seatId);
      if (seat) {
        // 基础票价取决于票类型
        const basePrice = showtime.price[selectedTicketType];
        // 根据座位类型应用乘数
        const multiplier = seat.type === 'vip' ? 1.2 : 
                         seat.type === 'disabled' ? 0.6 : 1.0;
        
        total += basePrice * multiplier;
      }
    });
    
    return total;
  };
  
  const totalPrice = calculateTotalPrice();
  
  // 处理票类型选择
  const handleTicketTypeChange = (type: TicketType) => {
    if (isExpired) return; // 如果场次已过期，禁止更改票类型
    setSelectedTicketType(type);
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
    if (isExpired) {
      alert('该场次已过期，无法购票');
      return;
    }
    
    if (selectedSeats.length === 0) {
      alert('请至少选择一个座位');
      return;
    }
    
    // 在实际应用中，这里会进行下单操作，然后跳转到支付页面
    // 模拟创建订单并跳转
    const orderData = {
      showtimeId: showtime.id,
      seats: selectedSeats,
      ticketType: selectedTicketType,
      totalPrice,
      movieTitle: movie.title,
      theaterName: theater.name,
      startTime: showtime.startTime,
    };
    
    // 存储订单数据到sessionStorage
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // 跳转到支付页面，并传递所选座位
    router.push(userRoutes.checkout(showtime.id, selectedSeats.join(',')));
  };

  return (
    <MobileLayout title="选座购票" showBackButton>
      {/* 已开场但仍可购票提示 */}
      {isStartedButAllowed && (
        <div className="p-4 bg-yellow-50 flex items-center text-yellow-600 border-b border-yellow-100">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">该场次已开始放映</p>
            <p className="text-sm">您还有 {15 - minutesAfterStart} 分钟的时间完成购票，请尽快选座并支付</p>
          </div>
        </div>
      )}
      
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
              {theater.equipment && theater.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {theater.equipment.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              )}
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
                  selectedTicketType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                } ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleTicketTypeChange(type)}
                disabled={isExpired}
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
          disabled={isExpired}
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
                  disabled={isExpired}
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
          <div className="text-sm text-slate-500 text-right">
            <div>{selectedSeats.length}张{getTicketTypeLabel(selectedTicketType)}</div>
            <div className="mt-1 text-xs">
              {selectedSeats.some(seatId => {
                const seat = showtime.availableSeats.find(s => s.id === seatId);
                return seat && seat.type === 'vip';
              }) && <span className="text-amber-600 mr-2">含VIP座位(×1.2)</span>}
              
              {selectedSeats.some(seatId => {
                const seat = showtime.availableSeats.find(s => s.id === seatId);
                return seat && seat.type === 'disabled';
              }) && <span className="text-green-600">含无障碍座位(×0.6)</span>}
            </div>
          </div>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          onClick={handleSubmitOrder}
          disabled={selectedSeats.length === 0 || isExpired}
        >
          {isExpired ? '场次已过期' : '确认选座并支付'}
        </Button>
      </div>
      
      {/* 底部空间填充，避免内容被固定底栏遮挡 */}
      <div className="h-32"></div>
    </MobileLayout>
  );
}

function getTicketTypeLabel(type: TicketType): string {
  switch (type) {
    case TicketType.NORMAL:
      return '普通票';
    case TicketType.STUDENT:
      return '学生票';
    case TicketType.SENIOR:
      return '老人票';
    case TicketType.CHILD:
      return '儿童票';
    default:
      return '普通票';
  }
} 