'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CreditCard, AlertCircle, Check, X } from 'lucide-react';
import { mockShowtimes, mockMovies, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { OrderStatus, TicketType } from '@/app/lib/types';
import { userRoutes } from '@/app/lib/utils/navigation';
import { PaymentMethod, PaymentStatus } from '@/app/lib/services/paymentService';
import { useAppContext } from '@/app/lib/context/AppContext';

// 创建一个使用 useSearchParams 的组件，这样可以在 Suspense 边界中使用它
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshData, orders, selectShowtime, selectedShowtime, selectSeat, clearSelectedSeats, currentUser } = useAppContext();
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
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  
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
    
    const loadData = async () => {
      try {
        // 获取场次信息
        const targetShowtime = mockShowtimes.find(s => s.id === showtimeId);
        if (!targetShowtime) {
          router.push(userRoutes.movieList);
          return;
        }
        
        // 检查场次是否已过期
        const now = new Date();
        const showtimeDate = new Date(targetShowtime.startTime);
        
        if (showtimeDate < now) {
          alert('该场次已开始，无法支付');
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
        const relatedMovie = mockMovies.find(m => m.id === targetShowtime.movieId);
        if (relatedMovie) setMovie(relatedMovie);
        
        // 获取影厅信息
        const relatedTheater = mockTheaters.find(t => t.id === targetShowtime.theaterId);
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
  }, [showtimeId, seats, router, initialized, selectShowtime, orders]);
  
  // 修改倒计时效果，在结束时显示弹窗
  useEffect(() => {
    // 仅当处于待支付状态时才启动倒计时
    if (paymentStatus !== PaymentStatus.PENDING) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 倒计时结束后显示超时弹窗
          setShowTimeoutModal(true);
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
  
  // 自定义购票流程，不依赖AppContext的createOrder
  const handlePurchase = async () => {
    if (isLoading || !showtime || !currentUser) return;
    
    setIsLoading(true);
    setPaymentStatus(PaymentStatus.PROCESSING);
    
    try {
      console.log("开始自定义购票流程:", {
        showtimeId: showtime.id,
        seats: selectedSeats,
        userId: currentUser.id
      });
      
      // 直接使用OrderService创建订单
      // 为此我们需要导入OrderService
      const { OrderService } = await import('@/app/lib/services/dataService');
      
      // 如果已有订单ID，则更新订单而不是创建新订单
      let targetOrderId = orderId;
      
      if (!targetOrderId) {
        // 准备订单数据
        const orderData = {
          userId: currentUser.id,
          showtimeId: showtime.id,
          seats: selectedSeats,
          ticketType: TicketType.NORMAL,
          totalPrice: selectedSeats.length * showtime.price[TicketType.NORMAL],
          status: OrderStatus.PENDING
        };
        
        console.log("准备创建订单:", orderData);
        
        // 创建订单
        const newOrder = await OrderService.createOrder(orderData);
        console.log("订单创建成功:", newOrder);
        
        // 设置订单ID
        targetOrderId = newOrder.id;
        setOrderId(targetOrderId);
      } else {
        console.log("使用现有订单:", targetOrderId);
      }
      
      // 模拟支付结果
      const paymentResult = {
        status: PaymentStatus.SUCCESS,
        message: '支付成功',
        transactionId: 'txn_' + Date.now(),
        timestamp: new Date().toISOString(),
        orderId: targetOrderId
      };
      
      // 设置支付状态
      setPaymentStatus(paymentResult.status);
      
      // 使用OrderService更新订单状态为已支付
      if (paymentResult.status === PaymentStatus.SUCCESS && targetOrderId) {
        await OrderService.updateOrderStatus(targetOrderId, OrderStatus.PAID);
        console.log("订单状态已更新为已支付");
        
        // 刷新上下文中的数据
        await refreshData();
        
        // 立即跳转到成功页面，使用正确的订单ID
        router.push(userRoutes.orderSuccess(targetOrderId));
      }
      
      console.log("支付流程完成");
      
    } catch (error) {
      console.error("支付流程错误:", error);
      setPaymentStatus(PaymentStatus.FAILED);
      setPaymentError('支付处理过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 订单详情卡片
  const renderOrderSummary = () => {
    if (!showtime || !movie) return null;
    
    return (
      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">订单详情</h2>
        
        <div className="flex mb-4">
          <div className="w-24 h-36 rounded overflow-hidden mr-4">
            <Image
              src={movie.poster || defaultImages.moviePoster}
              alt={movie.title}
              width={96}
              height={144}
              className="object-cover"
            />
          </div>
          
          <div>
            <h3 className="font-semibold">{movie.title}</h3>
            <p className="text-sm text-gray-600 mb-1">
              {format(new Date(showtime.startTime), 'MM月dd日 HH:mm')}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              {theater?.name}
            </p>
            <div className="mt-2">
              <p className="text-sm">
                <span className="font-medium">座位：</span>
                {selectedSeats.map((seat) => (
                  <span 
                    key={seat}
                    className={`inline-block px-1.5 py-0.5 mr-1 mb-1 text-xs rounded
                      ${getSeatTypeColor(getSeatType(seat, showtime))}
                    `}
                  >
                    {getSeatLabel(seat, showtime)}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">影票单价</span>
            <span>¥{showtime.price[TicketType.NORMAL]}</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">座位数量</span>
            <span>{selectedSeats.length}个</span>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-semibold">
            <span>总计金额</span>
            <span className="text-lg text-red-600">¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </Card>
    );
  };
  
  // 获取座位标签
  const getSeatLabel = (seatId: string, currentShowtime: any): string => {
    const seat = currentShowtime.availableSeats.find((s: any) => s.id === seatId);
    if (!seat) return seatId;
    
    return `${seat.row}排${seat.column}号`;
  };
  
  // 获取座位类型
  const getSeatType = (seatId: string, currentShowtime: any): string => {
    const seat = currentShowtime.availableSeats.find((s: any) => s.id === seatId);
    return seat ? seat.type : 'normal';
  };
  
  // 获取座位类型标签
  const getSeatTypeLabel = (type: string): string => {
    switch (type) {
      case 'vip': return 'VIP座';
      case 'disabled': return '无障碍座';
      default: return '普通座';
    }
  };
  
  // 获取座位类型颜色样式
  const getSeatTypeColor = (type: string): string => {
    switch (type) {
      case 'vip':
        return 'bg-amber-100 text-amber-800';
      case 'disabled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 支付方式选择
  const renderPaymentMethods = () => {
    return (
      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">选择支付方式</h2>
        <div className="space-y-2">
          <div
            className={`flex items-center p-3 border rounded cursor-pointer
              ${paymentMethod === PaymentMethod.WECHAT 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200'}
            `}
            onClick={() => setPaymentMethod(PaymentMethod.WECHAT)}
          >
            <div className="w-6 h-6 mr-3 flex items-center justify-center">
              <Image
                src="/images/wechat-pay.png"
                alt="微信支付"
                width={24}
                height={24}
              />
            </div>
            <div className="flex-1">
              <p className="font-medium">微信支付</p>
            </div>
            {paymentMethod === PaymentMethod.WECHAT && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
          
          <div
            className={`flex items-center p-3 border rounded cursor-pointer
              ${paymentMethod === PaymentMethod.ALIPAY 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'}
            `}
            onClick={() => setPaymentMethod(PaymentMethod.ALIPAY)}
          >
            <div className="w-6 h-6 mr-3 flex items-center justify-center">
              <Image
                src="/images/alipay.png"
                alt="支付宝"
                width={24}
                height={24}
              />
            </div>
            <div className="flex-1">
              <p className="font-medium">支付宝</p>
            </div>
            {paymentMethod === PaymentMethod.ALIPAY && (
              <Check className="w-5 h-5 text-blue-500" />
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  // 渲染超时弹窗
  const renderTimeoutModal = () => {
    if (!showTimeoutModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-sm p-6">
          <div className="mb-4 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">支付超时</h3>
            <p className="text-gray-600 mt-1">
              订单已超时，请重新选择座位下单
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={handleTimeoutReturn}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染结果提示
  const renderPaymentStatus = () => {
    if (paymentStatus === PaymentStatus.PENDING) return null;
    
    let statusIcon, statusText, statusColor;
    
    switch (paymentStatus) {
      case PaymentStatus.PROCESSING:
        statusIcon = (
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        );
        statusText = "支付处理中...";
        statusColor = "text-indigo-600";
        break;
      case PaymentStatus.SUCCESS:
        statusIcon = <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />;
        statusText = "支付成功";
        statusColor = "text-green-600";
        break;
      case PaymentStatus.FAILED:
        statusIcon = <X className="w-12 h-12 text-red-500 mx-auto mb-2" />;
        statusText = "支付失败";
        statusColor = "text-red-600";
        break;
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg w-full max-w-sm p-6 text-center">
          {statusIcon}
          <h3 className={`text-lg font-semibold ${statusColor}`}>{statusText}</h3>
          
          {paymentStatus === PaymentStatus.FAILED && (
            <>
              <p className="text-gray-600 mt-1 mb-4">
                {paymentError || '支付过程中发生错误，请稍后再试'}
              </p>
              <Button
                onClick={() => setPaymentStatus(PaymentStatus.PENDING)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                重新支付
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <MobileLayout title="订单支付" showBackButton>
      <div className="px-4 py-6">
        {countdown > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              请在 <span className="font-bold">{countdown}</span> 秒内完成支付，超时订单将自动取消
            </p>
          </div>
        )}
        
        {renderOrderSummary()}
        {renderPaymentMethods()}
        
        <Button
          onClick={handlePurchase}
          disabled={isLoading || paymentStatus !== PaymentStatus.PENDING}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base"
        >
          {isLoading ? '处理中...' : `支付 ¥${totalPrice.toFixed(2)}`}
        </Button>
        
        {renderTimeoutModal()}
        {renderPaymentStatus()}
      </div>
    </MobileLayout>
  );
}

// 加载中的占位组件
function PaymentLoading() {
  return (
    <MobileLayout title="订单支付" showBackButton>
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </MobileLayout>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  );
} 