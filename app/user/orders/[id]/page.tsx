'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { format, differenceInMinutes } from 'date-fns';
import { ChevronLeft, MapPin, Clock, Calendar, Users, TicketIcon, ArrowLeft, Check, AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';
import { Order, TicketStatus, OrderStatus } from '@/app/lib/types';
import { mockMovies, mockShowtimes, mockTheaters } from '@/app/lib/mockData';
import MobileLayout from '@/app/components/layout/MobileLayout';
import Button from '@/app/components/ui/Button';
import { defaultImages } from '@/app/lib/mockData';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { orders, refreshData } = useAppContext();
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  useEffect(() => {
    const foundOrder = orders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [orderId, orders]);
  
  if (!order) {
    return (
      <MobileLayout title="订单详情">
        <div className="p-4">
          <p className="text-center py-8">正在加载订单...</p>
        </div>
      </MobileLayout>
    );
  }
  
  // 获取相关的电影场次信息
  const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
  if (!showtime) {
    return (
      <MobileLayout title="订单详情">
        <div className="p-4">
          <p className="text-center py-8">未找到场次信息</p>
        </div>
      </MobileLayout>
    );
  }
  
  const movie = mockMovies.find(m => m.id === showtime.movieId);
  const theater = mockTheaters.find(t => t.id === showtime.theaterId);
  
  if (!movie || !theater) {
    return (
      <MobileLayout title="订单详情">
        <div className="p-4">
          <p className="text-center py-8">未找到相关信息</p>
        </div>
      </MobileLayout>
    );
  }
  
  // 确定票券状态
  const getTicketStatusDetails = () => {
    const now = new Date();
    const showtimeDate = new Date(showtime.startTime);
    
    // 如果票已经被检过，状态为已使用
    if (order.checkedAt) {
      return {
        status: TicketStatus.USED,
        label: '已使用',
        color: 'bg-emerald-50 text-emerald-600',
        icon: <Check className="w-5 h-5 mr-2" />,
        description: `电影票已于 ${format(new Date(order.checkedAt), 'yyyy年MM月dd日 HH:mm')} 检票入场`
      };
    }
    
    // 如果电影已经开始超过15分钟，状态为已过期
    if (showtimeDate < now) {
      const minutesAfterStart = differenceInMinutes(now, showtimeDate);
      if (minutesAfterStart > 15) {
        return {
          status: TicketStatus.EXPIRED,
          label: '已过期',
          color: 'bg-red-50 text-red-600',
          icon: <X className="w-5 h-5 mr-2" />,
          description: '电影已开始超过15分钟，票券已过期'
        };
      } else {
        // 电影已开始但在15分钟内，状态为迟到可入场
        return {
          status: TicketStatus.LATE,
          label: '迟到可入场',
          color: 'bg-amber-50 text-amber-600',
          icon: <AlertTriangle className="w-5 h-5 mr-2" />,
          description: '电影已开场，但您仍可在15分钟内入场'
        };
      }
    }
    
    // 如果电影即将开始（30分钟内），状态为可入场
    const minutesToShowtime = differenceInMinutes(showtimeDate, now);
    if (minutesToShowtime <= 30) {
      return {
        status: TicketStatus.AVAILABLE_NOW,
        label: '可立即入场',
        color: 'bg-emerald-50 text-emerald-600',
        icon: <Check className="w-5 h-5 mr-2" />,
        description: '您可以立即前往影院检票入场'
      };
    }
    
    // 其他情况，状态为未使用（未到检票时间）
    return {
      status: TicketStatus.AVAILABLE_SOON,
      label: '未到检票时间',
      color: 'bg-blue-50 text-blue-600',
      icon: <Clock className="w-5 h-5 mr-2" />,
      description: `请于电影开场前30分钟到达影院检票入场`
    };
  };
  
  const ticketStatusDetails = getTicketStatusDetails();
  const isTicketValid = order.status === OrderStatus.PAID && 
    (ticketStatusDetails.status === TicketStatus.AVAILABLE_NOW || 
     ticketStatusDetails.status === TicketStatus.AVAILABLE_SOON ||
     ticketStatusDetails.status === TicketStatus.LATE);
  
  return (
    <MobileLayout title="票券详情" showBackButton>
      <div className="bg-white min-h-screen">
        {/* 票券状态 */}
        <div className={`p-4 ${ticketStatusDetails.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {ticketStatusDetails.icon}
              <h2 className="text-lg font-semibold">{ticketStatusDetails.label}</h2>
            </div>
            <span className="text-sm">订单号: {order.id}</span>
          </div>
          <p className="mt-2 text-sm">{ticketStatusDetails.description}</p>
        </div>
        
        {/* 电影票二维码 */}
        {isTicketValid && (
          <div className="p-6 flex flex-col items-center bg-white border-b border-slate-100">
            <div className="mb-3 text-center">
              <h3 className="text-md font-semibold">请出示此二维码进行检票</h3>
              <p className="text-xs text-slate-500">工作人员扫描后即可入场观影</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <QRCode
                size={180}
                value={`CINEMA_TICKET:${order.id}`}
                viewBox={`0 0 256 256`}
              />
            </div>
            
            {ticketStatusDetails.status === TicketStatus.LATE && (
              <div className="mt-4 px-3 py-2 bg-amber-50 text-amber-600 flex items-center rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span>电影已开场，请尽快入场</span>
              </div>
            )}
          </div>
        )}
        
        {ticketStatusDetails.status === TicketStatus.EXPIRED && (
          <div className="p-6 flex flex-col items-center bg-white border-b border-slate-100">
            <div className="mb-3 text-center">
              <h3 className="text-md font-semibold">票券已过期</h3>
              <p className="text-xs text-slate-500">电影已开始超过15分钟，无法入场</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 opacity-50">
              <QRCode
                size={180}
                value={`CINEMA_TICKET:${order.id}`}
                viewBox={`0 0 256 256`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg border border-red-200 transform rotate-45">
                  已过期
                </div>
              </div>
            </div>
          </div>
        )}
        
        {ticketStatusDetails.status === TicketStatus.USED && (
          <div className="p-6 flex flex-col items-center bg-white border-b border-slate-100">
            <div className="mb-3 text-center">
              <h3 className="text-md font-semibold">票券已使用</h3>
              <p className="text-xs text-slate-500">
                检票时间：{format(new Date(order.checkedAt!), 'yyyy年MM月dd日 HH:mm')}
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 opacity-50 relative">
              <QRCode
                size={180}
                value={`CINEMA_TICKET:${order.id}`}
                viewBox={`0 0 256 256`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-200 transform rotate-45">
                  已使用
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 影片信息 */}
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="flex">
            <div className="relative h-24 w-16 rounded overflow-hidden">
              <Image 
                src={movie.webpPoster || movie.poster || defaultImages.moviePoster} 
                alt={movie.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            
            <div className="ml-3 flex-1">
              <h3 className="font-semibold">{movie.title}</h3>
              <div className="text-sm text-slate-500">
                {movie.duration}分钟 | {movie.genre.join('/')}
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(showtime.startTime, 'yyyy年MM月dd日')}
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(showtime.startTime, 'HH:mm')} - 
                  {format(new Date(new Date(showtime.startTime).getTime() + movie.duration * 60000), 'HH:mm')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 影院和座位信息 */}
        <div className="p-4 bg-white border-b border-slate-100">
          <h3 className="font-semibold mb-2">影院信息</h3>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
              <div>
                <div className="font-medium">{theater.name}</div>
                <div className="text-sm text-slate-500">地址信息</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <TicketIcon className="h-4 w-4 mr-2 text-slate-400 mt-0.5" />
              <div>
                <div className="font-medium">影厅信息</div>
                <div className="text-sm text-slate-500">
                  {order.seats.map(seat => {
                    const seatParts = seat.split('-');
                    const row = seatParts[seatParts.length - 2];
                    const col = seatParts[seatParts.length - 1];
                    return `${row}排${col}座`;
                  }).join('、')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 订单信息 */}
        <div className="p-4 bg-white border-b border-slate-100">
          <h3 className="font-semibold mb-2">订单信息</h3>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">订单编号</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">购票时间</span>
              <span>{format(order.createdAt, 'yyyy-MM-dd HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">票数</span>
              <span>{order.seats.length}张</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">总价</span>
              <span className="font-medium">¥{order.totalPrice}</span>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <span className="text-slate-500">支付时间</span>
                <span>{format(new Date(order.paidAt), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 提示信息 */}
        <div className="p-4 bg-white">
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            <h4 className="font-medium text-slate-700 mb-1">温馨提示</h4>
            <ul className="space-y-1 list-disc pl-4">
              <li>请至少提前15分钟到达影院，以便有充分时间取票入场</li>
              <li>电影开始15分钟后将无法入场，票款不予退还</li>
              <li>请保持手机电量充足，以便顺利出示电子票进行检票</li>
              <li>如需退票或改签，请至少在电影开场前1小时操作</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <Link href="/user/orders">
              <Button variant="outline" className="w-full flex justify-center items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回订单列表
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
} 