'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { CreditCard, Film, Clock, Check, X, RefreshCcw } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import TabGroup from '@/app/components/ui/TabGroup';
import Button from '@/app/components/ui/Button';
import { mockMovies, mockShowtimes, mockTheaters, defaultImages } from '@/app/lib/mockData';
import { Order, OrderStatus } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function OrdersPage() {
  const { orders: contextOrders, refreshData, cancelOrder } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用AppContext中的订单数据
  useEffect(() => {
    setOrders(contextOrders);
  }, [contextOrders]);
  
  // 页面加载时刷新数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // 按状态过滤订单
  const pendingOrders = orders.filter(order => order.status === OrderStatus.PENDING);
  const paidOrders = orders.filter(order => order.status === OrderStatus.PAID);
  const cancelledOrders = orders.filter(
    order => order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED
  );
  
  // 获取关联的电影和场次信息
  const getOrderDetails = (order: Order) => {
    const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
    if (!showtime) return null;
    
    const movie = mockMovies.find(m => m.id === showtime.movieId);
    const theater = mockTheaters.find(t => t.id === showtime.theaterId);
    
    if (!movie || !theater) return null;
    
    return { movie, showtime, theater };
  };
  
  // 定义状态标签
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <span className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3 mr-1" />
            待支付
          </span>
        );
      case OrderStatus.PAID:
        return (
          <span className="flex items-center text-emerald-600 text-xs bg-emerald-50 px-2 py-1 rounded-full">
            <Check className="h-3 w-3 mr-1" />
            已支付
          </span>
        );
      case OrderStatus.CANCELLED:
        return (
          <span className="flex items-center text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded-full">
            <X className="h-3 w-3 mr-1" />
            已取消
          </span>
        );
      case OrderStatus.REFUNDED:
        return (
          <span className="flex items-center text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-full">
            <RefreshCcw className="h-3 w-3 mr-1" />
            已退款
          </span>
        );
      default:
        return null;
    }
  };
  
  // 处理取消订单
  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('确定要取消该订单吗？取消后无法恢复。')) {
      setIsLoading(true);
      try {
        await cancelOrder(orderId);
        refreshData(); // 刷新数据
      } catch (error) {
        console.error('取消订单失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // 渲染单个订单卡片
  const renderOrderCard = (order: Order) => {
    const details = getOrderDetails(order);
    if (!details) return null;
    
    const { movie, showtime, theater } = details;
    
    return (
      <Card key={order.id} className="mb-4">
        <div className="p-4 border-b border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">{movie.title}</h3>
            {getStatusLabel(order.status)}
          </div>
          
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
              <div className="text-xs text-slate-500">
                {theater.name}
              </div>
              <div className="text-sm mt-1">
                {format(showtime.startTime, 'yyyy年MM月dd日 HH:mm')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {order.seats.length}张 | 总价 ¥{order.totalPrice}
              </div>
              
              <div className="mt-3 flex gap-2">
                {order.status === OrderStatus.PENDING && (
                  <Link href={`/user/payment?showtimeId=${order.showtimeId}`}>
                    <Button size="sm" variant="primary">
                      <CreditCard className="h-4 w-4 mr-1" />
                      去支付
                    </Button>
                  </Link>
                )}
                
                {order.status === OrderStatus.PAID && (
                  <Link href={`/user/orders/${order.id}`}>
                    <Button size="sm" variant="outline">
                      <Film className="h-4 w-4 mr-1" />
                      查看票券
                    </Button>
                  </Link>
                )}
                
                {order.status === OrderStatus.PENDING && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    取消订单
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };
  
  // 定义标签页内容
  const tabs = [
    {
      key: 'all',
      label: '全部',
      content: (
        <div className="px-4 py-3">
          {orders.length > 0 ? (
            orders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无订单</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'pending',
      label: '待支付',
      content: (
        <div className="px-4 py-3">
          {pendingOrders.length > 0 ? (
            pendingOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无待支付订单</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'paid',
      label: '已支付',
      content: (
        <div className="px-4 py-3">
          {paidOrders.length > 0 ? (
            paidOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无已支付订单</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'cancelled',
      label: '已取消',
      content: (
        <div className="px-4 py-3">
          {cancelledOrders.length > 0 ? (
            cancelledOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">暂无已取消订单</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <MobileLayout title="我的订单">
      <TabGroup
        tabs={tabs}
        variant="underline"
        fullWidth
      />
    </MobileLayout>
  );
} 