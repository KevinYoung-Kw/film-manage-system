'use client';

import React, { useState, useEffect } from 'react';
import { OrderStatus } from '@/app/lib/types';
import { BarChart, Activity, Ticket, UserRound, Calendar, BarChart2, DollarSign, Users, Percent } from 'lucide-react';
import { StatsService } from '@/app/lib/services/statsService';

// 类型定义
interface DailyRevenue {
  date: string;
  revenue: number;
  ticketCount: number;
}

interface TicketTypeDistribution {
  type: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface TheaterOccupancy {
  id: string;
  name: string;
  showtimeCount: number;
  occupancy: number;
}

interface StatsData {
  totalSales: number;
  ticketsSold: number;
  averageOccupancy: number;
  popularMovie: string;
  totalOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  refundedOrders: number;
  pendingOrders: number;
  ticketTypeDistribution: TicketTypeDistribution[];
  theaterOccupancy: TheaterOccupancy[];
  dailyRevenue: DailyRevenue[];
}

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(true);
  
  // 统计数据状态
  const [stats, setStats] = useState<StatsData>({
    totalSales: 0,
    ticketsSold: 0,
    averageOccupancy: 0,
    popularMovie: '',
    totalOrders: 0,
    cancelledOrders: 0,
    paidOrders: 0, 
    refundedOrders: 0,
    pendingOrders: 0,
    ticketTypeDistribution: [],
    theaterOccupancy: [],
    dailyRevenue: []
  });
  
  // 加载统计数据
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 获取基础统计数据
        const basicStats = await StatsService.getAdminStats();
        
        // 获取票型分布
        const ticketTypes = await StatsService.getTicketTypeDistribution();
        
        // 获取影厅占用率
        const theaters = await StatsService.getTheaterOccupancy();
        
        // 获取每日收入
        const dailyRevenue = await StatsService.getDailyRevenue(7);
        
        // 获取热门电影
        const popularMovies = await StatsService.getPopularMovies(1);
        const popularMovie = popularMovies.length > 0 ? popularMovies[0].title : '无数据';
        
        // 计算平均上座率
        const averageOccupancy = theaters.length > 0 
          ? Math.round(theaters.reduce((sum, t) => sum + t.occupancy, 0) / theaters.length) 
          : 0;
          
        // 更新状态
        setStats({
          totalSales: basicStats.totalRevenue || 0,
          ticketsSold: basicStats.paidOrders || 0,
          averageOccupancy,
          popularMovie,
          totalOrders: basicStats.totalOrders || 0,
          cancelledOrders: basicStats.cancelledOrders || 0,
          paidOrders: basicStats.paidOrders || 0,
          refundedOrders: basicStats.refundedOrders || 0,
          pendingOrders: basicStats.totalOrders - (basicStats.paidOrders + basicStats.cancelledOrders + basicStats.refundedOrders) || 0,
          ticketTypeDistribution: ticketTypes,
          theaterOccupancy: theaters,
          dailyRevenue
        });
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [timeRange]); // 当时间范围变化时重新加载数据

  // 从状态中提取统计数据
  const { 
    totalSales, 
    ticketsSold, 
    averageOccupancy,
    popularMovie,
    pendingOrders,
    paidOrders,
    cancelledOrders,
    refundedOrders,
    ticketTypeDistribution,
    theaterOccupancy,
    dailyRevenue
  } = stats;

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-2xl font-bold">¥{totalSales?.toLocaleString()}</p>
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
            <span className="text-sm text-gray-600">热门电影</span>
          </div>
          <p className="text-2xl font-bold truncate">{popularMovie}</p>
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
            <p className="font-bold text-green-600">{paidOrders}</p>
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
          {ticketTypeDistribution && ticketTypeDistribution.length > 0 ? (
            ticketTypeDistribution.map((ticket: TicketTypeDistribution, index: number) => (
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
            ))
          ) : (
            <p className="text-center text-gray-500">暂无票型分布数据</p>
          )}
        </div>
      </div>
      
      {/* 影厅上座率 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center mb-3">
          <BarChart2 size={16} className="text-indigo-600 mr-2" />
          <h3 className="font-medium">影厅上座率</h3>
        </div>
        
        <div className="space-y-3">
          {theaterOccupancy && theaterOccupancy.length > 0 ? (
            theaterOccupancy.map((theater: TheaterOccupancy, index: number) => (
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
            ))
          ) : (
            <p className="text-center text-gray-500">暂无影厅数据</p>
          )}
        </div>
      </div>
      
      {/* 日收入趋势 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-3">
          <Activity size={16} className="text-green-600 mr-2" />
          <h3 className="font-medium">日收入趋势</h3>
        </div>
        
        {dailyRevenue && dailyRevenue.length > 0 ? (
          <div className="flex items-end h-40 gap-1">
            {dailyRevenue.map((day: DailyRevenue, index: number) => {
              // 找出最大收入用于计算高度比例
              const maxRevenue = Math.max(...dailyRevenue.map((d: DailyRevenue) => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              
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
        ) : (
          <p className="text-center text-gray-500">暂无收入趋势数据</p>
        )}
      </div>
    </div>
  );
} 