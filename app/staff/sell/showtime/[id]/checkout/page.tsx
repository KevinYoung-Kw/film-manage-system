'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { CreditCard, Check, Banknote, Wallet } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { TicketType } from '@/app/lib/types';
import { staffRoutes } from '@/app/lib/utils/navigation';

enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  WECHAT = 'wechat',
  ALIPAY = 'alipay'
}

export default function StaffCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const showtimeId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    // 从sessionStorage获取订单数据
    const savedOrder = sessionStorage.getItem('pendingStaffOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        if (parsedOrder.showtimeId === showtimeId) {
          setOrderData(parsedOrder);
          // 设置默认收款金额为订单总价
          setReceivedAmount(parsedOrder.totalPrice.toString());
        } else {
          // 订单ID不匹配，重定向到售票页面
          router.push(staffRoutes.sell);
        }
      } catch (e) {
        console.error('解析订单数据失败', e);
        router.push(staffRoutes.sell);
      }
    } else {
      // 没有找到订单数据，重定向到售票页面
      router.push(staffRoutes.sell);
    }
  }, [showtimeId, router]);
  
  // 获取票类型的显示名称
  const getTicketTypeLabel = (type: TicketType): string => {
    const labels: Record<TicketType, string> = {
      [TicketType.NORMAL]: '普通票',
      [TicketType.STUDENT]: '学生票',
      [TicketType.SENIOR]: '老人票',
      [TicketType.CHILD]: '儿童票'
    };
    return labels[type];
  };
  
  // 获取座位标签
  const formatSeats = (seats: string[]): string => {
    if (!seats || seats.length === 0) return '';
    
    // 简化展示，这里仅显示座位数量
    return `${seats.length}个座位`;
  };
  
  // 获取支付方式图标
  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <Banknote className="h-5 w-5" />;
      case PaymentMethod.CREDIT_CARD:
        return <CreditCard className="h-5 w-5" />;
      case PaymentMethod.WECHAT:
      case PaymentMethod.ALIPAY:
        return <Wallet className="h-5 w-5" />;
    }
  };
  
  // 获取支付方式名称
  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: '现金支付',
      [PaymentMethod.CREDIT_CARD]: '刷卡支付',
      [PaymentMethod.WECHAT]: '微信支付',
      [PaymentMethod.ALIPAY]: '支付宝支付'
    };
    return labels[method];
  };
  
  // 计算找零
  const calculateChange = (): number => {
    if (!orderData || !receivedAmount) return 0;
    
    const received = parseFloat(receivedAmount);
    const total = orderData.totalPrice;
    
    return Math.max(0, received - total);
  };
  
  // 处理订单完成
  const handleCompleteOrder = () => {
    // 验证收款金额（仅对现金支付）
    if (paymentMethod === PaymentMethod.CASH) {
      const received = parseFloat(receivedAmount);
      if (isNaN(received) || received < orderData.totalPrice) {
        alert('收款金额不能小于订单总价');
        return;
      }
    }
    
    setLoading(true);
    
    // 在实际应用中，这里会调用API完成订单
    // 模拟API请求延迟
    setTimeout(() => {
      // 清除sessionStorage中的订单数据
      sessionStorage.removeItem('pendingStaffOrder');
      
      // 显示成功页面
      setShowSuccess(true);
      setLoading(false);
    }, 1500);
  };
  
  // 处理回到售票页面
  const handleBackToSell = () => {
    router.push(staffRoutes.sell);
  };
  
  if (!orderData) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }
  
  // 成功页面
  if (showSuccess) {
    return (
      <MobileLayout title="支付成功" userRole="staff">
        <div className="flex flex-col items-center p-8">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">支付成功</h2>
          <p className="text-slate-500 mb-6 text-center">
            已成功完成订单支付，票务已生成
          </p>
          
          <Card className="w-full mb-6">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-medium">订单详情</h3>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-slate-500">电影</span>
              <span className="font-medium">{orderData.movieTitle}</span>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-slate-500">影厅</span>
              <span className="font-medium">{orderData.theaterName}</span>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-slate-500">场次</span>
              <span className="font-medium">
                {format(new Date(orderData.startTime), 'MM月dd日 HH:mm')}
              </span>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-slate-500">票型</span>
              <span className="font-medium">{getTicketTypeLabel(orderData.ticketType)}</span>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
              <span className="text-slate-500">数量</span>
              <span className="font-medium">{orderData.ticketCount}张</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-slate-500">金额</span>
              <span className="font-medium text-indigo-600">¥{orderData.totalPrice}</span>
            </div>
          </Card>
          
          <Button variant="primary" fullWidth onClick={handleBackToSell}>
            继续售票
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout title="订单结算" userRole="staff" showBackButton>
      <div className="pb-24">
        {/* 订单摘要 */}
        <Card className="rounded-none shadow-none">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-medium">订单摘要</h2>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
            <span className="text-slate-500">电影</span>
            <span className="font-medium">{orderData.movieTitle}</span>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
            <span className="text-slate-500">影厅</span>
            <span className="font-medium">{orderData.theaterName}</span>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
            <span className="text-slate-500">场次</span>
            <span className="font-medium">
              {format(new Date(orderData.startTime), 'MM月dd日 HH:mm')}
            </span>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
            <span className="text-slate-500">票型</span>
            <span className="font-medium">{getTicketTypeLabel(orderData.ticketType)}</span>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between">
            <span className="text-slate-500">座位</span>
            <span className="font-medium">{formatSeats(orderData.seats)}</span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-slate-500">客户信息</span>
            <span className="font-medium">
              {orderData.customerName || '未提供'} 
              {orderData.customerPhone ? ` (${orderData.customerPhone})` : ''}
            </span>
          </div>
        </Card>
        
        {/* 支付方式 */}
        <div className="bg-white p-4 mt-2">
          <h3 className="font-medium mb-3">支付方式</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(PaymentMethod).map((method) => (
              <button
                key={method}
                className={`flex items-center p-3 rounded-lg border ${
                  paymentMethod === method
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-700'
                }`}
                onClick={() => setPaymentMethod(method)}
              >
                <span className="p-2 bg-white rounded-full mr-2 shadow-sm">
                  {getPaymentIcon(method)}
                </span>
                <span>{getPaymentMethodLabel(method)}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 收款金额（仅现金支付时显示） */}
        {paymentMethod === PaymentMethod.CASH && (
          <div className="bg-white p-4 mt-2">
            <h3 className="font-medium mb-3">收款金额</h3>
            <div className="mb-3">
              <input
                type="number"
                className="w-full p-3 border border-slate-300 rounded-lg text-xl"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                min={orderData.totalPrice}
                step="0.01"
              />
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">找零</span>
              <span className="font-medium">¥{calculateChange().toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部结算栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 max-w-md mx-auto z-20">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-sm text-slate-600">总价</div>
            <div className="text-xl font-semibold text-indigo-600">¥{orderData.totalPrice}</div>
          </div>
          <div className="text-sm text-slate-500">
            {orderData.ticketCount}张票
          </div>
        </div>
        <Button
          variant="primary"
          fullWidth
          disabled={loading}
          onClick={handleCompleteOrder}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </span>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              确认支付
            </>
          )}
        </Button>
      </div>
    </MobileLayout>
  );
} 