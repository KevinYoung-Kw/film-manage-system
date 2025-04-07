'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CreditCard, ChevronsRight, AlertCircle, Check, X } from 'lucide-react';
import { mockShowtimes, mockMovies, mockTheaters, mockOrders, defaultImages } from '@/app/lib/mockData';
import { OrderStatus, TicketType } from '@/app/lib/types';
import { userRoutes } from '@/app/lib/utils/navigation';
import { PaymentService, PaymentMethod, PaymentStatus } from '@/app/lib/services/paymentService';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  
  const showtimeId = searchParams.get('showtimeId');
  const seats = searchParams.get('seats')?.split(',') || [];
  
  // 初始化数据，只运行一次
  useEffect(() => {
    if (initialized) return;
    
    // 检查必要参数
    if (!showtimeId || seats.length === 0) {
      router.push(userRoutes.movieList);
      return;
    }
    
    // 获取场次信息
    const targetShowtime = mockShowtimes.find(s => s.id === showtimeId);
    if (targetShowtime) {
      setShowtime(targetShowtime);
      setSelectedSeats(seats);
      
      // 获取电影信息
      const relatedMovie = mockMovies.find(m => m.id === targetShowtime.movieId);
      if (relatedMovie) setMovie(relatedMovie);
      
      // 获取影厅信息
      const relatedTheater = mockTheaters.find(t => t.id === targetShowtime.theaterId);
      if (relatedTheater) setTheater(relatedTheater);
      
      // 计算总价
      const basePricePerSeat = targetShowtime.price[TicketType.NORMAL];
      setTotalPrice(basePricePerSeat * seats.length);
      
      setInitialized(true);
    } else {
      router.push(userRoutes.movieList);
    }
  }, [showtimeId, seats, router, initialized]);
  
  // 单独的倒计时效果
  useEffect(() => {
    // 仅当处于待支付状态时才启动倒计时
    if (paymentStatus !== PaymentStatus.PENDING) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 倒计时结束后，如果用户仍未支付，则跳转回电影列表
          router.push(userRoutes.movieList);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [paymentStatus, router]);
  
  // 根据支付状态进行路由跳转
  useEffect(() => {
    if (paymentStatus === PaymentStatus.SUCCESS) {
      // 获取订单ID
      const pendingOrderJson = sessionStorage.getItem('pendingOrder');
      if (pendingOrderJson) {
        const pendingOrder = JSON.parse(pendingOrderJson);
        // 短暂延迟后跳转到成功页面
        const timer = setTimeout(() => {
          router.push(userRoutes.orderSuccess(pendingOrder.id));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [paymentStatus, router]);
  
  // 支付处理函数
  const handlePayment = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setPaymentStatus(PaymentStatus.PROCESSING);
    
    try {
      // 生成订单ID
      const orderId = `ORD${Date.now().toString().slice(-6)}`;
      
      // 创建订单对象
      const order = {
        id: orderId,
        userId: "current-user", // 实际应用中应该从登录状态获取
        showtimeId: showtimeId!,
        seats: selectedSeats,
        ticketType: TicketType.NORMAL,
        totalPrice,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        movieTitle: movie?.title,
        theaterName: theater?.name,
        startTime: showtime?.startTime
      };
      
      // 保存待支付订单到sessionStorage
      sessionStorage.setItem('pendingOrder', JSON.stringify(order));
      
      // 获取或初始化订单列表
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.unshift(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // 调用支付服务
      const paymentResult = await PaymentService.initiatePayment({
        orderId,
        amount: totalPrice,
        method: paymentMethod,
        userId: "current-user",
        description: `购买电影票：${movie?.title}`,
        metadata: {
          showtimeId,
          seats: selectedSeats,
          movieTitle: movie?.title
        }
      });
      
      // 保存支付结果
      PaymentService.savePaymentResult(paymentResult);
      
      // 根据支付结果设置状态
      setPaymentStatus(paymentResult.status);
      
      if (paymentResult.status === PaymentStatus.FAILED) {
        setPaymentError(paymentResult.message || '支付处理失败，请稍后重试');
      }
    } catch (error) {
      console.error('支付处理错误:', error);
      setPaymentStatus(PaymentStatus.FAILED);
      setPaymentError('支付处理过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 订单详情卡片
  const renderOrderSummary = () => {
    if (!movie || !showtime || !theater) return null;
    
    return (
      <Card className="mb-6">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-lg">订单详情</h2>
        </div>
        <div className="p-4">
          <div className="flex mb-4">
            <div className="relative h-20 w-14 rounded overflow-hidden">
              <Image
                src={movie.poster || defaultImages.moviePoster}
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="ml-3">
              <h3 className="font-medium">{movie.title}</h3>
              <p className="text-sm text-slate-500">{theater.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(showtime.startTime), 'MM月dd日 HH:mm')}
              </p>
              <div className="mt-1 text-xs">
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  {selectedSeats.length}张票
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">票价</span>
              <span>¥{showtime.price[TicketType.NORMAL]} × {selectedSeats.length}</span>
            </div>
            <div className="flex justify-between items-center mt-2 font-semibold">
              <span>总计</span>
              <span className="text-lg">¥{totalPrice}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };
  
  // 支付方式选择卡片
  const renderPaymentMethods = () => {
    return (
      <Card className="mb-6">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-lg">支付方式</h2>
        </div>
        <div className="p-4">
          <div 
            className={`flex items-center justify-between p-3 rounded-md mb-2 cursor-pointer ${paymentMethod === PaymentMethod.WECHAT ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
            onClick={() => setPaymentMethod(PaymentMethod.WECHAT)}
          >
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.75 13.5C9.16421 13.5 9.5 13.1642 9.5 12.75C9.5 12.3358 9.16421 12 8.75 12C8.33579 12 8 12.3358 8 12.75C8 13.1642 8.33579 13.5 8.75 13.5Z"/>
                  <path d="M11.75 13.5C12.1642 13.5 12.5 13.1642 12.5 12.75C12.5 12.3358 12.1642 12 11.75 12C11.3358 12 11 12.3358 11 12.75C11 13.1642 11.3358 13.5 11.75 13.5Z"/>
                  <path d="M15.25 12.75C15.25 13.1642 14.9142 13.5 14.5 13.5C14.0858 13.5 13.75 13.1642 13.75 12.75C13.75 12.3358 14.0858 12 14.5 12C14.9142 12 15.25 12.3358 15.25 12.75Z"/>
                  <path d="M18.25 12.75C18.25 13.1642 17.9142 13.5 17.5 13.5C17.0858 13.5 16.75 13.1642 16.75 12.75C16.75 12.3358 17.0858 12 17.5 12C17.9142 12 18.25 12.3358 18.25 12.75Z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"/>
                </svg>
              </div>
              <span>微信支付</span>
            </div>
            {paymentMethod === PaymentMethod.WECHAT && (
              <Check className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          
          <div 
            className={`flex items-center justify-between p-3 rounded-md mb-2 cursor-pointer ${paymentMethod === PaymentMethod.ALIPAY ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
            onClick={() => setPaymentMethod(PaymentMethod.ALIPAY)}
          >
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.0666 7C11.4 7 11.6666 7.26667 11.6666 7.6V10.0667H14.1333C14.4666 10.0667 14.7333 10.3333 14.7333 10.6667C14.7333 11 14.4666 11.2667 14.1333 11.2667H11.6666V13.7333C11.6666 14.0667 11.4 14.3333 11.0666 14.3333C10.7333 14.3333 10.4666 14.0667 10.4666 13.7333V11.2667H8C7.66667 11.2667 7.4 11 7.4 10.6667C7.4 10.3333 7.66667 10.0667 8 10.0667H10.4666V7.6C10.4666 7.26667 10.7333 7 11.0666 7Z"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"/>
                </svg>
              </div>
              <span>支付宝</span>
            </div>
            {paymentMethod === PaymentMethod.ALIPAY && (
              <Check className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          
          <div 
            className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${paymentMethod === PaymentMethod.CARD ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
            onClick={() => setPaymentMethod(PaymentMethod.CARD)}
          >
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white mr-3">
                <CreditCard className="h-4 w-4" />
              </div>
              <span>银行卡支付</span>
            </div>
            {paymentMethod === PaymentMethod.CARD && (
              <Check className="h-5 w-5 text-indigo-600" />
            )}
          </div>
        </div>
      </Card>
    );
  };
  
  // 根据支付状态渲染不同内容
  if (paymentStatus === PaymentStatus.PROCESSING) {
    return (
      <MobileLayout title="支付中" showBackButton>
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white p-4">
          <Card className="w-full p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">支付处理中</h2>
            <p className="text-slate-500 text-center mb-6">
              请稍候，支付正在处理中...
            </p>
            
            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div 
                className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-300"
                style={{ width: '50%' }}
              ></div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={true}
              className="w-full"
            >
              请勿关闭页面
            </Button>
          </Card>
        </div>
      </MobileLayout>
    );
  }
  
  if (paymentStatus === PaymentStatus.SUCCESS) {
    return (
      <MobileLayout title="支付成功" showBackButton>
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <Check className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">支付成功</h2>
          <p className="text-center text-slate-600 mb-6">
            您的电影票已经预订成功，正在为您准备票券...
          </p>
          <div className="animate-pulse flex space-x-2 justify-center">
            <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
            <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
            <div className="h-2 w-2 bg-indigo-300 rounded-full"></div>
          </div>
        </div>
      </MobileLayout>
    );
  }
  
  if (paymentStatus === PaymentStatus.FAILED) {
    return (
      <MobileLayout title="支付失败" showBackButton>
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="bg-red-100 rounded-full p-4 mb-4">
            <X className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">支付失败</h2>
          <p className="text-center text-slate-600 mb-6">
            {paymentError || '支付处理失败，请稍后重试'}
          </p>
          <Button 
            variant="primary"
            onClick={() => {
              setPaymentStatus(PaymentStatus.PENDING);
              setPaymentError(null);
            }}
            className="w-full max-w-xs"
          >
            重新支付
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="支付" showBackButton>
      <div className="bg-slate-50 min-h-screen pb-8">
        <div className="p-4">
          {/* 倒计时 */}
          <div className="bg-amber-50 p-3 rounded-md flex items-center mb-4 border border-amber-100">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-amber-800">请在 {countdown} 秒内完成支付，超时订单将自动取消</span>
          </div>
          
          {/* 订单摘要 */}
          {renderOrderSummary()}
          
          {/* 支付方式 */}
          {renderPaymentMethods()}
          
          {/* 支付按钮 */}
          <Button 
            variant="primary" 
            className="w-full py-3 text-base"
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : `确认支付 ¥${totalPrice}`}
          </Button>
          
          <p className="text-xs text-center text-slate-500 mt-4">
            点击上方按钮，表示您同意《购票协议》和《支付条款》
          </p>
        </div>
      </div>
    </MobileLayout>
  );
} 