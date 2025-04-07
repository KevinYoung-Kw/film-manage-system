'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { CreditCard, ChevronsRight, AlertCircle, Check } from 'lucide-react';
import { mockShowtimes, mockMovies, mockTheaters, mockOrders, defaultImages } from '@/app/lib/mockData';
import { OrderStatus, TicketType } from '@/app/lib/types';
import { userRoutes } from '@/app/lib/utils/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'card'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const showtimeId = searchParams.get('showtimeId');
  
  useEffect(() => {
    // 检查是否有待支付订单
    const pendingOrder = sessionStorage.getItem('pendingOrder');
    if (!pendingOrder) {
      router.push(userRoutes.movieList);
      return;
    }
    
    // 模拟支付倒计时
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handlePaymentSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [router]);
  
  useEffect(() => {
    if (showtimeId) {
      // 获取场次信息
      const targetShowtime = mockShowtimes.find(s => s.id === showtimeId);
      if (targetShowtime) {
        setShowtime(targetShowtime);
        
        // 获取电影信息
        const relatedMovie = mockMovies.find(m => m.id === targetShowtime.movieId);
        if (relatedMovie) setMovie(relatedMovie);
        
        // 获取影厅信息
        const relatedTheater = mockTheaters.find(t => t.id === targetShowtime.theaterId);
        if (relatedTheater) setTheater(relatedTheater);
        
        // 解析座位信息
        const seats = searchParams.get('seats');
        if (seats) {
          const seatList = seats.split(',');
          setSelectedSeats(seatList);
          
          // 计算总价
          const basePricePerSeat = targetShowtime.price[TicketType.NORMAL];
          setTotalPrice(basePricePerSeat * seatList.length);
        }
      }
    }
  }, [searchParams]);
  
  const handlePaymentSuccess = () => {
    setIsLoading(true);
    
    // 模拟支付处理
    setTimeout(() => {
      // 获取待支付订单
      const pendingOrder = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
      
      // 生成随机订单ID
      const orderId = `ORD${Date.now().toString().substring(6)}`;
      
      // 创建订单 (在实际应用中这将是API调用)
      const order = {
        ...pendingOrder,
        id: orderId,
        status: 'PAID',
        createTime: new Date().toISOString(),
        payTime: new Date().toISOString(),
      };
      
      // 获取或初始化订单列表
      let orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.unshift(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // 清除待支付订单
      sessionStorage.removeItem('pendingOrder');
      
      // 跳转到订单成功页面
      router.push(userRoutes.orderSuccess(orderId));
    }, 1000);
  };
  
  if (!movie || !showtime || !theater) {
    return (
      <MobileLayout title="支付" showBackButton>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </MobileLayout>
    );
  }
  
  if (paymentSuccess) {
    return (
      <MobileLayout title="支付成功" showBackButton>
        <div className="flex flex-col items-center justify-center h-96 px-4">
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
  
  return (
    <MobileLayout title="支付中" showBackButton>
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white p-4">
        <Card className="w-full p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold mb-2">支付处理中</h2>
          <p className="text-slate-500 text-center mb-6">
            {countdown > 0 
              ? `请稍候，支付正在处理中...(${countdown}s)` 
              : '支付完成，即将跳转...'}
          </p>
          
          <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
            <div 
              className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || countdown === 0}
            className="w-full"
          >
            取消支付
          </Button>
        </Card>
      </div>
    </MobileLayout>
  );
} 