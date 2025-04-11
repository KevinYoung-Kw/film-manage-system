'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Filter, Activity } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { StaffOperationType } from '@/app/lib/types';
import supabase from '@/app/lib/services/supabaseClient';
import { useAppContext } from '@/app/lib/context/AppContext';
import { processImageUrl } from '@/app/lib/services/dataService';

// 定义从数据库返回的操作记录类型
interface DbOperation {
  id: string;
  operation_type: string;
  order_id: string | null;
  showtime_id: string | null;
  details: any;
  created_at: string;
  orders: {
    id: string;
    status: string;
    total_price: number;
    showtime_id: string;
  } | null;
  // 其他可能的字段
}

// 定义展示用的操作记录类型
interface EnhancedOperation {
  id: string;
  type: StaffOperationType;
  orderId: string | null;
  showtimeId: string | null;
  createdAt: Date;
  order: any | null;
  showtime: any | null;
  movie: any | null;
  details: any;
}

export default function StaffHistoryPage() {
  const [operations, setOperations] = useState<EnhancedOperation[]>([]);
  const [filterType, setFilterType] = useState<StaffOperationType | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppContext();
  
  // 加载操作记录
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        setLoading(true);
        console.log('开始获取操作记录...');
        
        // 创建查询
        let query = supabase
          .from('vw_staff_operations')
          .select('*')
          .order('created_at', { ascending: false });
        
        // 如果不是管理员，只显示当前工作人员的操作记录
        if (currentUser?.role === 'staff') {
          query = query.eq('staff_id', currentUser.id);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('获取操作记录失败:', error);
          return;
        }
        
        console.log('成功获取操作记录数据:', data?.length || 0);
        
        // 处理数据
        const enhancedOperations = (data || []).map(operation => {
          // 处理电影和场次信息
          return {
            id: operation.id,
            type: operation.operation_type as StaffOperationType,
            orderId: operation.order_id,
            showtimeId: operation.showtime_id,
            createdAt: new Date(operation.created_at),
            order: {
              id: operation.related_order_id,
              status: operation.order_status,
              totalPrice: operation.total_price
            },
            showtime: operation.start_time ? {
              id: operation.showtime_id,
              start_time: operation.start_time,
              theaterName: operation.theater_name
            } : null,
            movie: operation.movie_title ? {
              title: operation.movie_title
            } : null,
            details: operation.details || {}
          };
        });
        
        setOperations(enhancedOperations);
      } catch (error) {
        console.error('获取操作记录异常:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOperations();
  }, [currentUser]);
  
  // 过滤操作记录
  const filteredOperations = operations.filter(operation => {
    // 过滤操作类型
    if (filterType !== 'all' && operation.type !== filterType) {
      return false;
    }
    
    // 过滤日期范围
    if (dateRange !== 'all') {
      const now = new Date();
      const opDate = new Date(operation.createdAt);
      
      if (dateRange === 'today') {
        return opDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return opDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return opDate >= monthAgo;
      }
    }
    
    return true;
  });
  
  // 格式化操作类型
  const formatOperationType = (type: StaffOperationType) => {
    const types = {
      [StaffOperationType.SELL]: '售票',
      [StaffOperationType.CHECK]: '检票',
      [StaffOperationType.REFUND]: '退票',
      [StaffOperationType.MODIFY]: '改签'
    };
    return types[type];
  };
  
  // 获取操作描述
  const getOperationDescription = (operation: EnhancedOperation) => {
    switch(operation.type) {
      case StaffOperationType.SELL:
        return `售出 ${operation.details.seats?.length || 1} 张票`;
      case StaffOperationType.CHECK:
        return `验票成功`;
      case StaffOperationType.REFUND:
        return `退款 ¥${operation.details.refund_amount || operation.details.refundAmount || 0}`;
      case StaffOperationType.MODIFY:
        return `修改订单`;
      default:
        return '操作记录';
    }
  };
  
  return (
    <MobileLayout title="操作记录" userRole="staff">
      <div className="p-4 pb-20">
        {/* 过滤选项 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Filter className="h-4 w-4 text-slate-500 mr-2" />
            <h3 className="font-medium">操作类型</h3>
          </div>
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={filterType === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              全部
            </Button>
            {Object.values(StaffOperationType).map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {formatOperationType(type)}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 text-slate-500 mr-2" />
            <h3 className="font-medium">时间范围</h3>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={dateRange === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('all')}
            >
              全部
            </Button>
            <Button
              variant={dateRange === 'today' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('today')}
            >
              今天
            </Button>
            <Button
              variant={dateRange === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('week')}
            >
              本周
            </Button>
            <Button
              variant={dateRange === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange('month')}
            >
              本月
            </Button>
          </div>
        </div>
        
        {/* 操作记录列表 */}
        <div className="mt-4">
          <div className="flex items-center mb-3">
            <Activity className="h-5 w-5 text-indigo-500 mr-2" />
            <h2 className="font-medium">操作记录 ({filteredOperations.length})</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-slate-500">加载操作记录中...</p>
            </div>
          ) : filteredOperations.length > 0 ? (
            <Card>
              <div className="divide-y divide-slate-100">
                {filteredOperations.map((operation) => (
                  <div key={operation.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                          operation.type === StaffOperationType.SELL ? 'bg-indigo-100 text-indigo-800' :
                          operation.type === StaffOperationType.CHECK ? 'bg-green-100 text-green-800' :
                          operation.type === StaffOperationType.REFUND ? 'bg-amber-100 text-amber-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {formatOperationType(operation.type)}
                        </span>
                        <h3 className="font-medium mt-1">{getOperationDescription(operation)}</h3>
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(operation.createdAt, 'MM-dd HH:mm')}
                      </div>
                    </div>
                    
                    {operation.movie && (
                      <div className="text-sm text-slate-700 mt-1">
                        {operation.movie.title}
                      </div>
                    )}
                    
                    {operation.showtime && operation.showtime.start_time && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        场次: {format(new Date(operation.showtime.start_time), 'MM-dd HH:mm')}
                      </div>
                    )}
                    
                    {operation.orderId && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        订单号: {operation.orderId}
                      </div>
                    )}
                    
                    {operation.type === StaffOperationType.SELL && operation.details.payment_method && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded">
                        <span className="text-slate-500">支付方式: </span>
                        <span className="font-medium">{
                          operation.details.payment_method === 'cash' ? '现金' :
                          operation.details.payment_method === 'wechat' ? '微信支付' :
                          operation.details.payment_method === 'alipay' ? '支付宝' : 
                          operation.details.payment_method
                        }</span>
                      </div>
                    )}
                    
                    {operation.type === StaffOperationType.REFUND && operation.details.reason && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded">
                        <span className="text-slate-500">退款原因: </span>
                        <span className="font-medium">{operation.details.reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="text-center py-16">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无符合条件的操作记录</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
} 