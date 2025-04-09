'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format, differenceInMinutes } from 'date-fns';
import { CreditCard, Film, Clock, Check, X, RefreshCcw, AlertTriangle, Ticket } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import TabGroup from '@/app/components/ui/TabGroup';
import Button from '@/app/components/ui/Button';
import { Order, OrderStatus, TicketStatus } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';
import { defaultImages } from '@/app/lib/mockData';
import { processImageUrl } from '@/app/lib/services/dataService';

// 扩展Order类型以包含前端需要的额外数据
interface ExtendedOrder extends Order {
  showtime?: {
    startTime: Date | string;
    endTime: Date | string;
  };
  movie?: {
    title: string;
    poster: string;
    webpPoster?: string;
  };
  theater?: {
    name: string;
  };
  seatLocations?: string[];
  checked?: boolean;
  // 可能从API直接返回的电影信息字段
  movieTitle?: string;
  moviePoster?: string;
  theaterName?: string;
  // 数据库关联数据
  order_seats?: Array<{seat_id: string} | string>;
  // 座位详细信息（如果有）
  seats_info?: Array<{
    id: string;
    row_num: number;
    column_num: number;
    seat_type?: string;
  }>;
  // 从数据库直接返回的格式
  showtime_id?: {
    start_time?: string;
    end_time?: string;
    movie_id?: {
      title?: string;
    };
    theater_id?: {
      name?: string;
    };
  };
}

// 解析座位ID获取行列信息的辅助函数
const parseSeatId = (seatId: string, order?: ExtendedOrder): { row?: number; column?: number; type?: string } => {
  try {
    // 首先检查订单中是否有对应的seats_info
    if (order?.seats_info) {
      const seatInfo = order.seats_info.find(s => s.id === seatId);
      if (seatInfo) {
        return {
          row: seatInfo.row_num,
          column: seatInfo.column_num,
          type: seatInfo.seat_type || 'normal'
        };
      }
    }
    
    // 尝试解析常规格式: seat-{theaterId}-{row}-{column}-{randomId} 或 seat-{theaterId}-{row}-{column}
    const parts = seatId.split('-');
    if (parts.length >= 4 && parts[0] === 'seat') {
      return {
        row: parseInt(parts[2]),
        column: parseInt(parts[3]),
        type: 'normal' // 没有更多信息默认为normal
      };
    }
    
    // 如果是纯数字，可能是座位序号
    if (/^\d+$/.test(seatId)) {
      const seatNum = parseInt(seatId);
      // 假设每排有10个座位(常见影院布局)，从座位序号推断行列
      const row = Math.floor(seatNum / 10) + 1;
      const column = seatNum % 10 || 10; // 如果余数为0,则是第10列
      return { row, column, type: 'normal' };
    }
    
    // 如果是UUID格式的ID，我们没法提取行列信息
    console.log('无法解析座位ID格式:', seatId);
    return {};
  } catch (error) {
    console.error('解析座位ID错误:', error, seatId);
    return {};
  }
};

// 格式化座位信息为用户友好的格式
const formatSeatInfo = (seats: string[], order?: ExtendedOrder): string => {
  if (!Array.isArray(seats) || seats.length === 0) {
    console.log('无有效座位数据', seats);
    return '未知座位';
  }

  console.log('尝试格式化座位:', seats, '订单:', order?.id);
  
  // 尝试直接识别座位格式：如果是"1-2"这种格式，直接表示行列
  if (seats.some(seat => /^\d+-\d+$/.test(seat))) {
    const formattedDirectSeats = seats.map(seat => {
      if (/^\d+-\d+$/.test(seat)) {
        const [row, column] = seat.split('-').map(Number);
        return `${row}排${column}座`;
      }
      return seat;
    });
    console.log('使用直接行列格式:', formattedDirectSeats);
    return formattedDirectSeats.join(', ');
  }

  // 尝试解析每个座位ID并格式化为行列信息
  const formattedSeats = seats.map(seatId => {
    const { row, column, type } = parseSeatId(seatId, order);
    if (row && column) {
      let seatInfo = `${row}排${column}座`;
      if (type && type !== 'normal') {
        if (type === 'vip') seatInfo += '(VIP)';
        else if (type === 'couple') seatInfo += '(情侣)';
        else if (type === 'disabled') seatInfo += '(无障碍)';
      }
      return seatInfo;
    }
    // 无法解析时显示ID的一部分，或者尝试使用其他可读格式
    return seatId.length > 8 ? seatId.substring(0, 8) + '...' : seatId;
  });

  console.log('格式化后的座位:', formattedSeats);
  return formattedSeats.join(', ');
};

export default function OrdersPage() {
  const { orders: contextOrders, refreshData, cancelOrder } = useAppContext();
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  // 使用AppContext中的订单数据
  useEffect(() => {
    console.log('接收到订单数据:', contextOrders);
    // 检查订单数据结构
    if (contextOrders && contextOrders.length > 0) {
      const firstOrder = contextOrders[0];
      // 打印所有字段，帮助排查数据结构
      console.log('订单数据结构示例:', Object.keys(firstOrder));
      
      // 检查座位信息
      if (firstOrder.seats) {
        console.log('座位信息示例:', firstOrder.seats);
      }
      // 使用类型断言避免TypeScript错误
      const extendedOrder = firstOrder as ExtendedOrder;
      if (extendedOrder.order_seats) {
        console.log('order_seats信息示例:', extendedOrder.order_seats);
      }
    }
    
    setOrders(contextOrders as ExtendedOrder[]);
  }, [contextOrders]);
  
  // 页面加载时刷新数据并更新票券状态
  useEffect(() => {
    setIsLoading(true);
    refreshData().then(() => {
      setIsLoading(false);
    });
    updateTicketStatuses();
  }, [refreshData]);
  
  // 筛选不同状态的订单
  const pendingOrders = orders.filter(order => order.status === OrderStatus.PENDING);
  const paidOrders = orders.filter(order => order.status === OrderStatus.PAID);
  const cancelledOrders = orders.filter(order => 
    order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED
  );
  
  // 基于当前索引获取过滤订单
  const getFilteredOrders = () => {
    switch (activeTabIndex) {
      case 0: return orders; // 全部
      case 1: return pendingOrders; // 待支付
      case 2: return paidOrders; // 已支付
      case 3: return cancelledOrders; // 已取消
      default: return orders;
    }
  };
  
  // 更新票券状态
  const updateTicketStatuses = () => {
    const now = new Date();
    
    const updatedOrders = orders.map(order => {
      // 只处理已支付的订单
      if (order.status !== OrderStatus.PAID) return order;
      
      // Ticket status only applies to paid orders
      let ticketStatus = order.ticketStatus;
      
      // 如果有场次信息，则需要更新票券状态
      if (order.showtime) {
        try {
          const showtimeStartTime = order.showtime.startTime;
          const showtimeEndTime = order.showtime.endTime;
          
          if (!showtimeStartTime || !showtimeEndTime) {
            console.error('场次时间信息不完整:', order.id);
            return { ...order, ticketStatus: ticketStatus || TicketStatus.UNUSED };
          }
          
          const showtimeStartDate = new Date(showtimeStartTime);
          const showtimeEndDate = new Date(showtimeEndTime);
          
          // 检查日期是否有效
          if (isNaN(showtimeStartDate.getTime()) || isNaN(showtimeEndDate.getTime())) {
            console.error('无效的场次时间:', order.id, showtimeStartTime, showtimeEndTime);
            return { ...order, ticketStatus: ticketStatus || TicketStatus.UNUSED };
          }
          
          // 检票时间前30分钟至电影结束后15分钟
          const checkInWindow = 30; // 分钟
          const lateWindow = 15; // 分钟
          
          const minutesToShowtime = differenceInMinutes(showtimeStartDate, now);
          const minutesSinceEnd = differenceInMinutes(now, showtimeEndDate);
          
          if (minutesToShowtime > checkInWindow) {
            ticketStatus = TicketStatus.AVAILABLE_SOON; // 还未到检票时间
          } else if (minutesToShowtime <= checkInWindow && minutesToShowtime > 0) {
            ticketStatus = TicketStatus.AVAILABLE_NOW; // 可以检票
          } else if (minutesToShowtime <= 0 && minutesSinceEnd <= lateWindow) {
            ticketStatus = TicketStatus.LATE; // 迟到
          } else if (minutesSinceEnd > lateWindow) {
            ticketStatus = TicketStatus.EXPIRED; // 已过期
          } else {
            ticketStatus = ticketStatus || TicketStatus.UNUSED;
          }
        } catch (error) {
          console.error('更新票券状态错误:', order.id, error);
          ticketStatus = ticketStatus || TicketStatus.UNUSED;
        }
      }
      
      return {
        ...order,
        ticketStatus
      };
    });
    
    setOrders(updatedOrders);
  };
  
  // 取消订单
  const handleCancelOrder = async (orderId: string) => {
    if (confirm('确定要取消此订单吗？')) {
      try {
        setIsLoading(true);
        const cancelledOrder = await cancelOrder(orderId);
        if (cancelledOrder) {
          alert('订单已取消');
        } else {
          alert('订单取消失败');
        }
      } catch (error) {
        console.error('取消订单失败:', error);
        alert('订单取消失败');
      } finally {
        setIsLoading(false);
        refreshData();
      }
    }
  };
  
  // 获取当前过滤的订单列表
  const filteredOrders = getFilteredOrders();
  
  // 构建Tab项
  const tabs = [
    { 
      key: 'all', 
      label: '全部',
      content: (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">加载中...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-100 rounded-full">
                <Ticket className="h-8 w-8 text-slate-400" />
              </div>
              <p>暂无订单记录</p>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'pending', 
      label: '待支付',
      content: (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">加载中...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-100 rounded-full">
                <Ticket className="h-8 w-8 text-slate-400" />
              </div>
              <p>暂无待支付订单</p>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'paid', 
      label: '已支付',
      content: (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">加载中...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-100 rounded-full">
                <Ticket className="h-8 w-8 text-slate-400" />
              </div>
              <p>暂无已支付订单</p>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'cancelled', 
      label: '已取消',
      content: (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">加载中...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-100 rounded-full">
                <Ticket className="h-8 w-8 text-slate-400" />
              </div>
              <p>暂无已取消订单</p>
            </div>
          )}
        </div>
      )
    }
  ];
  
  return (
    <MobileLayout title="我的订单">
      <div className="p-4">
        <TabGroup
          tabs={tabs}
          onChange={setActiveTabIndex}
          variant="underline"
          fullWidth
        />
      </div>
    </MobileLayout>
  );
}

// 订单卡片组件
interface OrderCardProps {
  order: ExtendedOrder;
  onCancel: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel }) => {
  // 格式化时间
  const formattedTime = (() => {
    try {
      // 尝试新数据结构
      if (order.showtime_id?.start_time) {
        const startDate = new Date(order.showtime_id.start_time);
        if (!isNaN(startDate.getTime())) {
          return `${format(startDate, 'MM-dd HH:mm')} 场`;
        }
      }
      
      // 尝试标准数据结构
      if (order.showtime?.startTime) {
        const startTime = new Date(order.showtime.startTime);
        if (!isNaN(startTime.getTime())) {
          return `${format(startTime, 'MM-dd HH:mm')} 场`;
        }
      }
      
      // 尝试直接使用showtime字段（如果是日期对象）
      if (order.showtime instanceof Date) {
        if (!isNaN(order.showtime.getTime())) {
          return `${format(order.showtime, 'MM-dd HH:mm')} 场`;
        }
      }
      
      console.log('无法格式化时间:', order.id, order);
      return '未知场次';
    } catch (error) {
      console.error('格式化场次时间错误:', error);
      return '未知场次';
    }
  })();
  
  // 订单状态对应的颜色和图标
  const statusConfig = {
    [OrderStatus.PENDING]: {
      color: 'text-amber-500 bg-amber-50',
      icon: <CreditCard className="h-4 w-4" />,
      text: '待支付'
    },
    [OrderStatus.PAID]: {
      color: 'text-green-500 bg-green-50',
      icon: <Check className="h-4 w-4" />,
      text: '已支付'
    },
    [OrderStatus.CANCELLED]: {
      color: 'text-slate-500 bg-slate-50',
      icon: <X className="h-4 w-4" />,
      text: '已取消'
    },
    [OrderStatus.REFUNDED]: {
      color: 'text-blue-500 bg-blue-50',
      icon: <RefreshCcw className="h-4 w-4" />,
      text: '已退款'
    }
  };
  
  // 票券状态
  const ticketStatusConfig = {
    [TicketStatus.UNUSED]: {
      color: 'text-slate-500',
      text: '未使用'
    },
    [TicketStatus.USED]: {
      color: 'text-slate-400',
      text: '已使用'
    },
    [TicketStatus.EXPIRED]: {
      color: 'text-red-500',
      text: '已过期'
    },
    [TicketStatus.AVAILABLE_SOON]: {
      color: 'text-amber-500',
      text: '即将可用'
    },
    [TicketStatus.AVAILABLE_NOW]: {
      color: 'text-green-500',
      text: '可检票'
    },
    [TicketStatus.LATE]: {
      color: 'text-red-500',
      text: '已迟到'
    }
  };
  
  const { color, icon, text } = statusConfig[order.status];
  const ticketInfo = order.ticketStatus && ticketStatusConfig[order.ticketStatus];
  
  // 影院和厅信息
  const theaterInfo = (() => {
    if (order.theater?.name) {
      return order.theater.name;
    }
    if (order.showtime_id?.theater_id?.name) {
      return order.showtime_id.theater_id.name;
    }
    if (order.theaterName) {
      return order.theaterName;
    }
    return '未知影厅';
  })();
  
  // 座位信息
  const seatList = (() => {
    // 如果有seatLocations属性，优先使用
    if (Array.isArray(order.seatLocations) && order.seatLocations.length > 0) {
      return formatSeatInfo(order.seatLocations, order);
    }
    
    // 如果有seats属性，其次使用
    if (Array.isArray(order.seats) && order.seats.length > 0) {
      return formatSeatInfo(order.seats, order);
    }
    
    // 检查是否有order_seats关联
    if (order.order_seats && Array.isArray(order.order_seats)) {
      const seatIds = order.order_seats.map(s => 
        typeof s === 'string' ? s : (s.seat_id || '')
      );
      return formatSeatInfo(seatIds, order);
    }
    
    return '未知座位';
  })();
  
  // 时间格式化
  const createdTime = (() => {
    try {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      if (createdAt && !isNaN(createdAt.getTime())) {
        return format(createdAt, 'yyyy-MM-dd HH:mm');
      }
      return '未知时间';
    } catch (error) {
      console.error('格式化创建时间错误:', error);
      return '未知时间';
    }
  })();
  
  // 电影信息
  const movieTitle = (() => {
    if (order.movie?.title) {
      return order.movie.title;
    }
    if (order.showtime_id?.movie_id?.title) {
      return order.showtime_id.movie_id.title;
    }
    if (order.movieTitle) {
      return order.movieTitle;
    }
    console.log('订单电影信息缺失:', order.id, order);
    return '未知电影';
  })();
  
  const moviePoster = (() => {
    let posterUrl = '';
    
    // 优先使用直接的电影对象中的海报
    if (order.movie) {
      if (order.movie.webpPoster) posterUrl = order.movie.webpPoster;
      else if (order.movie.poster) posterUrl = order.movie.poster;
    }
    
    // 然后尝试订单扩展字段中的海报URL
    if (!posterUrl && order.moviePoster) {
      posterUrl = order.moviePoster;
    }
    
    // 如果没有获取到海报，使用默认图片
    if (!posterUrl) {
      posterUrl = defaultImages.moviePoster;
    }
    
    // 使用processImageUrl处理图片路径
    return processImageUrl(posterUrl);
  })();
  
  return (
    <Link href={`/user/orders/${order.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* 订单状态 */}
        <div className="flex justify-between items-center p-3 border-b">
          <div className="flex items-center">
            <div className={`p-1 rounded-md ${color} mr-2`}>
              {icon}
            </div>
            <span className="text-sm font-medium">{text}</span>
          </div>
          {ticketInfo && order.status === OrderStatus.PAID && (
            <span className={`text-xs ${ticketInfo.color}`}>
              {ticketInfo.text}
            </span>
          )}
        </div>
        
        {/* 电影信息 */}
        <div className="flex p-3">
          <div className="w-20 h-28 relative flex-shrink-0 rounded overflow-hidden">
            <Image
              src={moviePoster}
              alt={movieTitle}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="font-semibold line-clamp-1">{movieTitle}</h3>
            <div className="mt-1 text-xs text-slate-500 space-y-1">
              <p className="flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {formattedTime}
              </p>
              <p className="flex items-center">
                <Film className="h-3 w-3 mr-1" /> {theaterInfo}
              </p>
              <p className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> 座位: {seatList}
              </p>
            </div>
          </div>
        </div>
        
        {/* 订单操作 */}
        <div className="flex justify-between items-center p-3 bg-slate-50">
          <div className="text-xs text-slate-500">
            订单号: {order.id.substring(0, 8)}...
          </div>
          <div className="flex space-x-2">
            {order.status === OrderStatus.PENDING && (
              <Button 
                size="xs" 
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
              >
                取消订单
              </Button>
            )}
            {order.status === OrderStatus.PAID && !order.checked && (
              <Button size="xs">查看票券</Button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}; 