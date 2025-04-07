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

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [showtime, setShowtime] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'card'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  useEffect(() => {
    const showtimeId = searchParams.get('showtimeId');
    const seats = searchParams.get('seats');
    
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
  
  const handlePayment = () => {
    setIsProcessing(true);
    
    // 模拟支付处理
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      // 生成新订单
      const newOrder = {
        id: `order${Date.now()}`,
        userId: 'customer1', // 假设当前用户ID
        showtimeId: showtime.id,
        seats: selectedSeats,
        ticketType: TicketType.NORMAL,
        totalPrice: totalPrice,
        status: OrderStatus.PAID,
        createdAt: new Date(),
        paidAt: new Date()
      };
      
      // 存储新订单到本地存储
      const storedOrders = localStorage.getItem('orders');
      let orders = [];
      
      if (storedOrders) {
        orders = JSON.parse(storedOrders);
      }
      
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // 2秒后跳转到订单详情页
      setTimeout(() => {
        router.push(`/orders/${newOrder.id}`);
      }, 2000);
    }, 1500);
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
    <MobileLayout title="支付" showBackButton>
      <div className="p-4">
        {/* 订单信息 */}
        <Card className="mb-6">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold mb-4">订单信息</h3>
            <div className="flex">
              <div className="relative h-16 w-12 rounded overflow-hidden">
                <Image
                  src={movie.poster || defaultImages.moviePoster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="font-medium">{movie.title}</h4>
                <div className="text-xs text-slate-500 mt-1">
                  {theater.name}
                </div>
                <div className="text-sm mt-1">
                  {format(new Date(showtime.startTime), 'yyyy/MM/dd HH:mm')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">座位</span>
              <span>
                {selectedSeats.length}个座位
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">单价</span>
              <span>¥{showtime.price[TicketType.NORMAL]}</span>
            </div>
            <div className="flex justify-between font-medium pt-3 border-t border-slate-100">
              <span>应付金额</span>
              <span className="text-red-500">¥{totalPrice}</span>
            </div>
          </div>
        </Card>
        
        {/* 支付方式 */}
        <Card className="mb-6">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold mb-4">支付方式</h3>
            <div>
              <div
                className="flex justify-between items-center p-3 rounded-md mb-3 border cursor-pointer"
                onClick={() => setPaymentMethod('wechat')}
                style={{ borderColor: paymentMethod === 'wechat' ? '#4F46E5' : '#E2E8F0' }}
              >
                <div className="flex items-center">
                  <div className="bg-green-50 rounded-full p-2 mr-3">
                    <Image
                      src="https://img.icons8.com/color/48/000000/wechat.png"
                      alt="微信支付"
                      width={24}
                      height={24}
                      unoptimized
                    />
                  </div>
                  <span>微信支付</span>
                </div>
                {paymentMethod === 'wechat' && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              
              <div
                className="flex justify-between items-center p-3 rounded-md mb-3 border cursor-pointer"
                onClick={() => setPaymentMethod('alipay')}
                style={{ borderColor: paymentMethod === 'alipay' ? '#4F46E5' : '#E2E8F0' }}
              >
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-full p-2 mr-3">
                    <Image
                      src="https://img.icons8.com/color/48/000000/alipay.png"
                      alt="支付宝"
                      width={24}
                      height={24}
                      unoptimized
                    />
                  </div>
                  <span>支付宝</span>
                </div>
                {paymentMethod === 'alipay' && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              
              <div
                className="flex justify-between items-center p-3 rounded-md border cursor-pointer"
                onClick={() => setPaymentMethod('card')}
                style={{ borderColor: paymentMethod === 'card' ? '#4F46E5' : '#E2E8F0' }}
              >
                <div className="flex items-center">
                  <div className="bg-purple-50 rounded-full p-2 mr-3">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                  </div>
                  <span>银行卡支付</span>
                </div>
                {paymentMethod === 'card' && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* 支付提示 */}
        <Card className="p-4 bg-amber-50 border border-amber-100 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-700">
                请确认订单信息无误后再支付，订单支付成功后将无法退款。
              </p>
            </div>
          </div>
        </Card>
        
        {/* 提交按钮 */}
        <div className="mt-6">
          <Button
            className="w-full py-3 text-base"
            variant="primary"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                处理中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span>立即支付</span>
                <ChevronsRight className="h-5 w-5 ml-1" />
              </span>
            )}
          </Button>
          <p className="text-center text-xs text-slate-500 mt-3">
            点击上方按钮表示您已同意《电影票务购票协议》
          </p>
        </div>
      </div>
    </MobileLayout>
  );
} 