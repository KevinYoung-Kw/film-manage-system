'use client';

import React, { useState } from 'react';
import { mockOrders, mockMovies, mockShowtimes } from '@/app/lib/mockData';
import { OrderStatus } from '@/app/lib/types';
import { BarChart, Activity, Ticket, UserRound, Calendar, BarChart2 } from 'lucide-react';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // 计算订单统计信息
  const paidOrders = mockOrders.filter(order => order.status === OrderStatus.PAID);
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalTicketsSold = paidOrders.reduce((sum, order) => sum + order.seats.length, 0);
  
  // 当前订单数据
  const pendingOrders = mockOrders.filter(order => order.status === OrderStatus.PENDING).length;
  const paidOrdersCount = paidOrders.length;
  const cancelledOrders = mockOrders.filter(order => order.status === OrderStatus.CANCELLED).length;
  const refundedOrders = mockOrders.filter(order => order.status === OrderStatus.REFUNDED).length;
  
  // 获取电影热度排行
  const getMoviePopularity = () => {
    const movieTickets: Record<string, { count: number, title: string }> = {};
    
    // 统计每部电影售出的票数
    paidOrders.forEach(order => {
      const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
      if (!showtime) return;
      
      const movieId = showtime.movieId;
      if (!movieTickets[movieId]) {
        const movie = mockMovies.find(m => m.id === movieId);
        movieTickets[movieId] = { 
          count: 0, 
          title: movie ? movie.title : '未知电影' 
        };
      }
      
      movieTickets[movieId].count += order.seats.length;
    });
    
    // 转换为数组并排序
    return Object.values(movieTickets)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 取前5名
  };
  
  const popularMovies = getMoviePopularity();

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <BarChart size={24} className="text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold">数据统计</h1>
      </div>
      
      {/* 时间范围选择 */}
      <div className="flex gap-2 mb-6 bg-white rounded-lg shadow p-2">
        {[
          { value: 'day', label: '今日' },
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
          { value: 'year', label: '今年' }
        ].map(option => (
          <button 
            key={option.value}
            onClick={() => setTimeRange(option.value as any)}
            className={`py-1 px-3 rounded-md text-sm flex-1 ${
              timeRange === option.value
                ? 'bg-indigo-600 text-white' 
                : 'bg-transparent text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      {/* 主要统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Activity size={16} className="text-green-500 mr-1" />
            <span className="text-sm text-gray-600">总收入</span>
          </div>
          <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Ticket size={16} className="text-blue-500 mr-1" />
            <span className="text-sm text-gray-600">售票数</span>
          </div>
          <p className="text-2xl font-bold">{totalTicketsSold}张</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <UserRound size={16} className="text-amber-500 mr-1" />
            <span className="text-sm text-gray-600">观影人次</span>
          </div>
          <p className="text-2xl font-bold">{totalTicketsSold}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Calendar size={16} className="text-purple-500 mr-1" />
            <span className="text-sm text-gray-600">场次数</span>
          </div>
          <p className="text-2xl font-bold">{mockShowtimes.length}</p>
        </div>
      </div>
      
      {/* 订单统计 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-medium mb-3">订单状态统计</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-sm text-gray-500">待支付</p>
            <p className="font-bold text-yellow-500">{pendingOrders}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">已支付</p>
            <p className="font-bold text-green-600">{paidOrdersCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">已取消</p>
            <p className="font-bold text-gray-500">{cancelledOrders}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">已退款</p>
            <p className="font-bold text-red-500">{refundedOrders}</p>
          </div>
        </div>
      </div>
      
      {/* 电影热度排行 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <BarChart2 size={16} className="text-indigo-600 mr-2" />
          <h3 className="font-medium">电影热度排行</h3>
        </div>
        
        <div className="space-y-3">
          {popularMovies.map((movie, index) => (
            <div key={index} className="flex items-center">
              <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full mr-2 text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{movie.title}</span>
                  <span className="text-sm text-gray-500">{movie.count}张</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (movie.count / (popularMovies[0]?.count || 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 