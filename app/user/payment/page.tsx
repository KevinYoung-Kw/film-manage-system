'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CreditCard, AlertCircle, Check, X } from 'lucide-react';
// 移除对mockData的依赖
// import { mockShowtimes, mockMovies, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { OrderStatus, TicketType } from '@/app/lib/types';
import { userRoutes } from '@/app/lib/utils/navigation';
import { useAppContext } from '@/app/lib/context/AppContext';
import { OrderService } from '@/app/lib/services/orderService';
import supabase from '@/app/lib/services/supabaseClient';

// 定义默认图片路径常量
const DEFAULT_MOVIE_POSTER = '/images/default-poster.jpg';

// 从正确的路径导入PaymentService
import { PaymentMethod, PaymentStatus } from '@/app/lib/services/paymentService';

// 创建一个使用 useSearchParams 的组件，这样可以在 Suspense 边界中使用它
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    refreshData, 
    orders, 
    movies,
    theaters,
    showtimes, 
    selectShowtime, 
    selectedShowtime, 
    selectSeat, 
    clearSelectedSeats, 
    currentUser 
  } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WECHAT);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isMovieStarted, setIsMovieStarted] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  
  const showtimeId = searchParams.get('showtimeId');
  const seatsParam = searchParams.get('seats');
  const seats = seatsParam ? seatsParam.split(',') : [];
  
  // 初始化数据，只运行一次
  useEffect(() => {
    if (initialized) return;
    
    // 检查必要参数
    if (!showtimeId) {
      router.push(userRoutes.movieList);
      return;
    }
    
    // 确保数据已加载
    refreshData();
    
    const loadData = async () => {
      try {
        // 获取场次信息
        const targetShowtime = showtimes.find(s => s.id === showtimeId);
        if (!targetShowtime) {
          router.push(userRoutes.movieList);
          return;
        }
        
        // 检查场次是否已过期
        const now = new Date();
        const showtimeDate = new Date(targetShowtime.startTime);
        
        // 获取日期部分进行比较
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const showtimeDay = new Date(showtimeDate);
        showtimeDay.setHours(0, 0, 0, 0);
        
        // 未来日期的场次永远不会过期
        const isFutureDay = showtimeDay > today;
        
        // 计算电影是否已开场超过15分钟
        const minutesAfterStart = showtimeDate < now ? 
          Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60)) : 0;
        
        // 如果电影已开场超过15分钟，才视为"过期"无法支付（但未来日期的永远可支付）
        if (!isFutureDay && showtimeDate < now && minutesAfterStart > 15) {
          alert('该场次已开始超过15分钟，无法支付');
          // 立即跳转到订单列表页面，不等待用户确认
          router.push(userRoutes.orders);
          return;
        }
        
        setShowtime(targetShowtime);
        
        // 如果是从订单页面过来的（没有seats参数），则从订单中获取座位信息
        let seatArray = seats;
        if (seats.length === 0) {
          // 查找对应场次的待支付订单
          const pendingOrder = orders.find(
            o => o.showtimeId === showtimeId && o.status === OrderStatus.PENDING
          );
          
          if (pendingOrder) {
            seatArray = pendingOrder.seats;
            setSelectedSeats(pendingOrder.seats);
            setOrderId(pendingOrder.id); // 保存原订单ID，后续用于更新而非创建新订单
          } else {
            router.push(userRoutes.movieList);
            return;
          }
        } else {
          setSelectedSeats(seats);
        }
        
        // 获取电影信息
        const relatedMovie = movies.find(m => m.id === targetShowtime.movieId);
        if (relatedMovie) setMovie(relatedMovie);
        
        // 获取影厅信息
        const relatedTheater = theaters.find(t => t.id === targetShowtime.theaterId);
        if (relatedTheater) setTheater(relatedTheater);
        
        // 计算总价
        let totalAmount = 0;
        // 对每个选中的座位，计算其价格
        seatArray.forEach(seatId => {
          const seat = targetShowtime.availableSeats.find((s: any) => s.id === seatId);
          if (seat) {
            // 基础票价
            const basePrice = targetShowtime.price[TicketType.NORMAL];
            // 根据座位类型应用乘数
            const multiplier = seat.type === 'vip' ? 1.2 : 
                            seat.type === 'disabled' ? 0.6 : 1.0;
            
            totalAmount += basePrice * multiplier;
          }
        });
        setTotalPrice(totalAmount);
        
        // 设置 selectedShowtime 以便在 createOrder 时使用
        selectShowtime(targetShowtime);
        
        setInitialized(true);
      } catch (error) {
        console.error('加载数据失败:', error);
        router.push(userRoutes.movieList);
      }
    };
    
    loadData();
  }, [showtimeId, seats, router, initialized, selectShowtime, orders, showtimes, movies, theaters, refreshData]);
  
  // 修改倒计时效果，在结束时显示弹窗
  useEffect(() => {
    // 仅当处于待支付状态时才启动倒计时
    if (paymentStatus !== PaymentStatus.PENDING) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 倒计时结束后直接跳转，不显示弹窗
          handleTimeoutReturn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [paymentStatus]);
  
  // 处理超时后返回
  const handleTimeoutReturn = () => {
    // 显示一个简短的提示
    alert('支付超时，订单已取消');
    router.push(userRoutes.movieList);
  };
  
  // 根据支付状态进行路由跳转
  useEffect(() => {
    // 支付成功的跳转逻辑已移到handlePurchase函数中直接处理
    // 这里不再需要额外的跳转逻辑
  }, [paymentStatus]);
  
  // 增加新的useEffect来监听selectedShowtime的变化
  useEffect(() => {
    if (selectedShowtime && selectedSeats.length > 0) {
      // 当selectedShowtime更新后，确保所有座位被正确设置
      console.log("selectedShowtime已设置，更新座位选择");
      // 先清除所有选中的座位
      clearSelectedSeats();
      
      // 添加当前页面中选择的座位
      for (const seatId of selectedSeats) {
        selectSeat(seatId);
      }
    }
  }, [selectedShowtime, selectedSeats, clearSelectedSeats, selectSeat]);
  
  // 更新isMovieStarted状态
  useEffect(() => {
    if (!showtime) return;
    
    const showtimeDate = new Date(showtime.startTime);
    const now = new Date();
    
    if (showtimeDate < now) {
      setIsMovieStarted(true);
      
      // 计算剩余分钟数
      const minutesAfterStart = Math.floor((now.getTime() - showtimeDate.getTime()) / (1000 * 60));
      const remaining = Math.max(0, 15 - minutesAfterStart);
      setRemainingMinutes(remaining);
    }
  }, [showtime]);
  
  // 自定义购票流程，不依赖AppContext的createOrder
  const handlePurchase = async () => {
    if (isLoading || !showtime || !currentUser) {
      if (!currentUser) {
        setPaymentError('请先登录再进行支付');
        setPaymentStatus(PaymentStatus.FAILED);
        return;
      }
      return;
    }
    
    setIsLoading(true);
    setPaymentStatus(PaymentStatus.PROCESSING);
    
    try {
      console.log("开始购票流程:", {
        showtimeId: showtime.id,
        seats: selectedSeats,
        userId: currentUser.id
      });
      
      // 检查localStorage中是否有session并验证有效性
      const sessionStr = localStorage.getItem('session');
      if (!sessionStr) {
        throw new Error('用户未登录或会话已过期，请重新登录');
      }
      
      // 验证session结构
      let session;
      try {
        session = JSON.parse(sessionStr);
        if (!session || !session.user_id || !session.role) {
          localStorage.removeItem('session');
          throw new Error('登录会话已损坏，请重新登录');
        }
      } catch (e) {
        throw new Error('登录会话已损坏，请重新登录');
      }
      
      // 模拟支付请求过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let targetOrderId = orderId;
      
      // 如果没有现有订单ID，则查找对应场次的待支付订单
      if (!targetOrderId) {
        try {
          console.log("未找到待支付订单，创建新订单");
          
          if (!selectedShowtime) {
            throw new Error('无法创建订单：未选择场次');
          }
          
          if (selectedSeats.length === 0) {
            throw new Error('无法创建订单：未选择座位');
          }

          // 生成订单号 (格式: TK + 年月日 + 随机数, 例如 TK2405104321)
          const now = new Date();
          const orderDate = now.getFullYear().toString().slice(-2) + 
                            (now.getMonth() + 1).toString().padStart(2, '0') + 
                            now.getDate().toString().padStart(2, '0');
          const randomNum = Math.floor(1000 + Math.random() * 9000); // 4位随机数
          const newOrderId = `TK${orderDate}${randomNum}`;
          
          // 计算总价
          let totalPrice = 0;
          selectedSeats.forEach(seatId => {
            const seat = showtime.availableSeats.find((s: any) => s.id === seatId);
            if (seat) {
              // 基础票价
              const basePrice = showtime.price[TicketType.NORMAL];
              // 根据座位类型应用乘数
              const multiplier = seat.type === 'vip' ? 1.2 : 
                                seat.type === 'disabled' ? 0.6 : 1.0;
              totalPrice += basePrice * multiplier;
            }
          });
          
          // 使用存储过程创建订单
          console.log("调用create_order存储过程创建订单", {
            p_user_id: currentUser.id,
            p_showtime_id: showtime.id,
            p_seat_ids: selectedSeats,
            p_ticket_type: TicketType.NORMAL
          });
          
          const { data: procData, error: procError } = await supabase.rpc('create_order', {
            p_user_id: currentUser.id,
            p_showtime_id: showtime.id,
            p_seat_ids: selectedSeats,
            p_ticket_type: TicketType.NORMAL,
            p_payment_method_id: null
          });
          
          if (procError || !procData || procData.length === 0 || !procData[0].success) {
            throw new Error('创建订单失败: ' + (procError?.message || (procData && procData[0] ? procData[0].message : '未知错误')));
          }
          
          // 获取创建的订单ID
          targetOrderId = procData[0].order_id;
          console.log("新订单已创建:", targetOrderId);
        } catch (createError: any) {
          console.error("创建订单失败:", createError);
          throw new Error(`创建订单失败: ${createError.message}`);
        }
      } else {
        // 已有订单ID，只需要支付
        try {
          const paymentMethodId = paymentMethod === PaymentMethod.WECHAT ? "wechat" : "alipay";
          const paidOrder = await OrderService.payOrder(targetOrderId, paymentMethodId);
          
          if (!paidOrder) {
            throw new Error('支付失败：无法更新订单状态');
          }
          
          console.log("订单支付成功:", paidOrder);
        } catch (payError: any) {
          console.error("支付失败:", payError);
          throw new Error(`支付失败: ${payError.message}`);
        }
      }
      
      // 模拟支付成功
      setPaymentStatus(PaymentStatus.COMPLETED);
      
      // 提前设置状态，避免页面闪烁
      refreshData();
      
      // 模拟支付成功后的跳转延迟
      setTimeout(() => {
        if (!targetOrderId) {
          // 如果没有订单ID，则跳转到订单列表页面
          router.push(userRoutes.orders);
          return;
        }
        router.push(userRoutes.orderSuccess(targetOrderId));
      }, 1000);
    } catch (error: any) {
      console.error('支付失败:', error);
      setPaymentError(error.message || '支付失败，请稍后重试');
      setPaymentStatus(PaymentStatus.FAILED);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 计算座位类型
  const getSeatTypeLabel = (type: string): string => {
    switch (type) {
      case 'vip': return 'VIP座';
      case 'couple': return '情侣座';
      case 'disabled': return '无障碍座';
      default: return '普通座';
    }
  };
  
  const getSeatTypeColor = (type: string): string => {
    switch (type) {
      case 'vip': return 'bg-amber-100 text-amber-800';
      case 'couple': return 'bg-pink-100 text-pink-800';
      case 'disabled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };
  
  const renderOrderSummary = () => {
    if (!movie || !showtime || !theater) return null;
    
    return (
      <div className="mb-4">
        <Card className="p-4 mb-2">
          <div className="flex mb-4">
            <div className="relative h-24 w-16 rounded overflow-hidden mr-3">
              <Image 
                src={movie.poster || DEFAULT_MOVIE_POSTER} 
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{movie.title}</h3>
              <div className="text-sm text-slate-500">
                {movie.duration}分钟 | {movie.genre.join('/')}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {format(new Date(showtime.startTime), 'yyyy年MM月dd日 HH:mm')}
              </div>
              <div className="text-xs text-slate-500">
                {theater.name}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">已选座位</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seatId => {
                const seat = showtime.availableSeats.find((s: any) => s.id === seatId);
                if (!seat) return null;
                
                const row = seat.row;
                const col = seat.column;
                const seatLabel = `${row}排${col}座`;
                const seatType = seat.type;
                const typeLabel = getSeatTypeLabel(seatType);
                const typeColor = getSeatTypeColor(seatType);
                
                return (
                  <div key={seatId} className="flex flex-col items-center">
                    <span className="text-sm mb-1">{seatLabel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor}`}>
                      {typeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">总价</span>
            <span className="text-xl font-bold">¥{totalPrice.toFixed(2)}</span>
          </div>
        </Card>
      </div>
    );
  };
  
  // 获取座位标签
  const getSeatLabel = (seatId: string, currentShowtime: any): string => {
    const seat = currentShowtime.availableSeats.find((s: any) => s.id === seatId);
    if (!seat) return '未知座位';
    return `${seat.row}排${seat.column}座`;
  };
  
  // 获取座位类型
  const getSeatType = (seatId: string, currentShowtime: any): string => {
    const seat = currentShowtime.availableSeats.find((s: any) => s.id === seatId);
    if (!seat) return 'normal';
    return seat.type;
  };
  
  const renderPaymentMethods = () => {
    return (
      <div className="mb-4">
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">选择支付方式</h3>
          
          <div 
            className={`flex items-center p-3 rounded-lg border ${
              paymentMethod === PaymentMethod.WECHAT 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-200'
            } mb-2 cursor-pointer`}
            onClick={() => setPaymentMethod(PaymentMethod.WECHAT)}
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <div className="text-white font-bold">微</div>
            </div>
            <div className="flex-1">
              <div className="font-medium">微信支付</div>
              <div className="text-xs text-slate-500">使用微信扫码支付</div>
            </div>
            {paymentMethod === PaymentMethod.WECHAT && (
              <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          <div 
            className={`flex items-center p-3 rounded-lg border ${
              paymentMethod === PaymentMethod.ALIPAY 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-200'
            } mb-2 cursor-pointer`}
            onClick={() => setPaymentMethod(PaymentMethod.ALIPAY)}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <div className="text-white font-bold">支</div>
            </div>
            <div className="flex-1">
              <div className="font-medium">支付宝</div>
              <div className="text-xs text-slate-500">使用支付宝扫码支付</div>
            </div>
            {paymentMethod === PaymentMethod.ALIPAY && (
              <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };
  
  const renderPaymentStatus = () => {
    if (paymentStatus === PaymentStatus.PENDING) {
      return null;
    }
    
    if (paymentStatus === PaymentStatus.PROCESSING) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">处理中</h3>
            <p className="text-slate-600 mb-4">正在处理您的支付，请稍候...</p>
          </div>
        </div>
      );
    }
    
    if (paymentStatus === PaymentStatus.COMPLETED) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <div className="bg-green-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">支付成功</h3>
            <p className="text-slate-600 mb-4">您的订单已支付成功</p>
            <p className="text-sm text-slate-500">正在为您跳转...</p>
          </div>
        </div>
      );
    }
    
    if (paymentStatus === PaymentStatus.FAILED) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <div className="bg-red-100 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">支付失败</h3>
            <p className="text-slate-600 mb-4">{paymentError || '支付过程中出现错误'}</p>
            <Button 
              className="w-full" 
              onClick={() => setPaymentStatus(PaymentStatus.PENDING)}
            >
              重新支付
            </Button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="px-4 pb-8">
      {/* 提示：电影已开场 */}
      {isMovieStarted && remainingMinutes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
          <AlertCircle className="text-amber-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">电影已开场</h3>
            <p className="text-sm text-amber-700">
              电影已开场 {15 - remainingMinutes} 分钟，您还有 {remainingMinutes} 分钟购票时间
            </p>
          </div>
        </div>
      )}
      
      {/* 内容容器 */}
      <div>
        {/* 订单摘要 */}
        {renderOrderSummary()}
        
        {/* 支付方式 */}
        {renderPaymentMethods()}
        
        {/* 支付按钮和倒计时 - 放在内容下方 */}
        <div className="mt-6 mb-16 bg-white p-4 rounded-lg shadow-md">
          <div className="text-xs text-slate-500 mb-3 text-center">
            请在 <span className="text-red-500 font-semibold">{countdown}</span> 秒内完成支付，超时订单将自动取消
          </div>
          <Button
            onClick={handlePurchase}
            disabled={isLoading || !movie || !showtime || !theater || selectedSeats.length === 0}
            className="w-full py-4 text-lg font-medium relative"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            <span>支付 ¥{totalPrice.toFixed(2)}</span>
          </Button>
        </div>
      </div>
      
      {/* 支付状态弹窗 */}
      {renderPaymentStatus()}
    </div>
  );
}

function PaymentLoading() {
  return (
    <div className="p-4 flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-slate-500">正在加载支付页面...</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <MobileLayout title="在线支付" showBackButton>
      <Suspense fallback={<PaymentLoading />}>
        <PaymentContent />
      </Suspense>
    </MobileLayout>
  );
} 