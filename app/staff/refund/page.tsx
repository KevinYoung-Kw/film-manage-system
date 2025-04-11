'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, AlertCircle, ArrowLeft, Check, RefreshCcw } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { useAppContext } from '@/app/lib/context/AppContext';
import { Order, OrderStatus } from '@/app/lib/types';

// 扩展Order类型，添加退款相关字段
interface RefundOrderInfo extends Order {
  refundAmount: number;
  canFullRefund: boolean;
}

export default function StaffRefundPage() {
  const { refundTicket } = useAppContext();
  const [orderCode, setOrderCode] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<RefundOrderInfo | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundStep, setRefundStep] = useState<'search' | 'confirm' | 'success'>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // 搜索订单
  const handleSearch = async () => {
    if (!orderCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 调用API获取订单信息
      const response = await fetch(`/api/orders/${orderCode}`);
      
      if (!response.ok) {
        throw new Error('订单查询失败');
      }
      
      const orderData = await response.json();
      
      if (orderData && orderData.status === OrderStatus.PAID) {
        // 计算是否可以全额退款（距离开场2小时以上）
        const now = new Date();
        const showtimeStart = orderData.showtime ? new Date(orderData.showtime) : new Date();
        const hoursDiff = (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        const canFullRefund = hoursDiff >= 2;
        
        setSearchedOrder({
          ...orderData,
          refundAmount: canFullRefund ? orderData.totalPrice : Math.floor(orderData.totalPrice * 0.8), // 80%退款
          canFullRefund
        });
        
        setRefundStep('confirm');
      } else if (orderData) {
        setError(`该订单状态为 ${orderData.status}，无法退票`);
      } else {
        setError('订单不存在或无法查询');
      }
    } catch (err: any) {
      setError(err.message || '订单查询失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 确认退款
  const handleConfirmRefund = async () => {
    if (!searchedOrder || !refundReason) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 调用退款API
      const result = await refundTicket(searchedOrder.id, refundReason);
      
      if (result.success) {
        setSuccessMessage(result.message);
        setRefundStep('success');
      } else {
        setError(result.message || '退款失败');
      }
    } catch (err: any) {
      setError(err.message || '退款处理失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置
  const handleReset = () => {
    setOrderCode('');
    setSearchedOrder(null);
    setRefundReason('');
    setRefundStep('search');
    setError('');
    setSuccessMessage('');
  };
  
  return (
    <MobileLayout title="退票管理" userRole="staff">
      <div className="p-4 pb-20">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {refundStep === 'search' && (
          <>
            <Card className="mb-4">
              <div className="p-4">
                <h3 className="font-medium mb-3">输入订单号</h3>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="请输入订单编号..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSearch}
                  disabled={!orderCode || loading}
                  isLoading={loading}
                >
                  <Search className="h-4 w-4 mr-2" />
                  查询订单
                </Button>
              </div>
            </Card>
            
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-medium">退票须知</h3>
              </div>
              <div className="p-4">
                <div className="bg-amber-50 p-3 rounded-lg mb-4 flex">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">退票规则:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>开场前2小时以上可全额退款</li>
                      <li>开场前2小时内退款收取20%手续费</li>
                      <li>电影开场后不可退款</li>
                    </ul>
                  </div>
                </div>
                
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                    <span>查询订单，确认订单信息</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                    <span>选择退款原因，确认退款金额</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                    <span>提交退款申请并等待系统处理</span>
                  </li>
                </ul>
              </div>
            </Card>
          </>
        )}
        
        {refundStep === 'confirm' && searchedOrder && (
          <>
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => setRefundStep('search')}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            
            <Card className="mb-4">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-medium">订单信息</h3>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <span className="text-sm text-slate-500">订单ID:</span>
                  <span className="font-medium ml-2">{searchedOrder.id}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-slate-500">电影:</span>
                  <span className="font-medium ml-2">{searchedOrder.movieTitle}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-slate-500">场次:</span>
                  <span className="font-medium ml-2">
                    {searchedOrder.showtime && format(new Date(searchedOrder.showtime), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-slate-500">影厅:</span>
                  <span className="font-medium ml-2">{searchedOrder.theaterName}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-slate-500">座位数:</span>
                  <span className="font-medium ml-2">{searchedOrder.seats?.length}个</span>
                </div>
                <div className="mb-1">
                  <span className="text-sm text-slate-500">支付金额:</span>
                  <span className="font-medium ml-2">¥{searchedOrder.totalPrice}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-slate-500">退款金额:</span>
                  <span className="text-lg text-red-500 font-bold ml-2">
                    ¥{searchedOrder.refundAmount}
                  </span>
                  {!searchedOrder.canFullRefund && (
                    <span className="text-xs text-amber-600 ml-2">
                      (收取20%手续费)
                    </span>
                  )}
                </div>
              </div>
            </Card>
            
            <Card className="mb-4">
              <div className="p-4">
                <h3 className="font-medium mb-3">选择退款原因</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['客户原因', '临时有事', '重复购票', '场次变更', '座位不合适', '其他原因'].map((reason) => (
                    <Button
                      key={reason}
                      variant={refundReason === reason ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setRefundReason(reason)}
                      disabled={loading}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
                
                {refundReason === '其他原因' && (
                  <textarea
                    placeholder="请输入具体原因..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    rows={3}
                  ></textarea>
                )}
                
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleConfirmRefund}
                  disabled={!refundReason || loading}
                  isLoading={loading}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  确认退款
                </Button>
              </div>
            </Card>
          </>
        )}
        
        {refundStep === 'success' && (
          <Card className="text-center p-6">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-green-800 mb-2">退款成功</h3>
            <p className="text-slate-600 mb-6">
              {successMessage || `退款金额 ¥${searchedOrder?.refundAmount} 将在1-3个工作日内退回原支付账户`}
            </p>
            <Button
              variant="primary"
              onClick={handleReset}
            >
              继续退票
            </Button>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
} 