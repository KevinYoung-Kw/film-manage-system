'use client';

import React, { useState } from 'react';
import { mockOrders, mockMovies, mockShowtimes, mockAdminStats } from '@/app/lib/mockData';
import { OrderStatus } from '@/app/lib/types';
import { BarChart, Activity, Ticket, UserRound, Calendar, BarChart2, DollarSign, Users, Percent } from 'lucide-react';

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // 使用mockAdminStats中的数据
  const { 
    totalSales, 
    ticketsSold, 
    averageOccupancy,
    popularMovie,
    popularShowtime,
    dailyRevenue,
    ticketTypeDistribution,
    theaterOccupancy
  } = mockAdminStats;
  
  // 当前订单数据（仍保留这部分逻辑，可以与统计数据结合使用）
  const pendingOrders = mockOrders.filter(order => order.status === OrderStatus.PENDING).length;
  const paidOrdersCount = mockOrders.filter(order => order.status === OrderStatus.PAID).length;
  const cancelledOrders = mockOrders.filter(order => order.status === OrderStatus.CANCELLED).length;
  const refundedOrders = mockOrders.filter(order => order.status === OrderStatus.REFUNDED).length;

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
            <DollarSign size={16} className="text-green-500 mr-1" />
            <span className="text-sm text-gray-600">总收入</span>
          </div>
          <p className="text-2xl font-bold">¥{totalSales.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Ticket size={16} className="text-blue-500 mr-1" />
            <span className="text-sm text-gray-600">售票数</span>
          </div>
          <p className="text-2xl font-bold">{ticketsSold}张</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Percent size={16} className="text-amber-500 mr-1" />
            <span className="text-sm text-gray-600">平均上座率</span>
          </div>
          <p className="text-2xl font-bold">{averageOccupancy}%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Calendar size={16} className="text-purple-500 mr-1" />
            <span className="text-sm text-gray-600">热门场次</span>
          </div>
          <p className="text-2xl font-bold">{popularShowtime}</p>
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
      
      {/* 票型分布 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center mb-3">
          <Users size={16} className="text-indigo-600 mr-2" />
          <h3 className="font-medium">票型分布</h3>
        </div>
        
        <div className="space-y-3">
          {ticketTypeDistribution.map((ticket, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{ticket.type}</span>
                  <span className="text-sm text-gray-500">{ticket.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${ticket.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 影厅上座率 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center mb-3">
          <BarChart2 size={16} className="text-indigo-600 mr-2" />
          <h3 className="font-medium">影厅上座率</h3>
        </div>
        
        <div className="space-y-3">
          {theaterOccupancy.map((theater, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{theater.name}</span>
                  <span className="text-sm text-gray-500">{theater.occupancy}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      theater.occupancy > 80 ? 'bg-red-500' : 
                      theater.occupancy > 60 ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${theater.occupancy}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 日收入趋势 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <Activity size={16} className="text-green-600 mr-2" />
          <h3 className="font-medium">日收入趋势</h3>
        </div>
        
        <div className="flex items-end h-40 gap-1">
          {dailyRevenue.map((day, index) => {
            // 找出最大收入用于计算高度比例
            const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
            const height = (day.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-indigo-500 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
                <div className="text-xs mt-1 text-gray-500">{day.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 