'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, TicketCheck, Check, X, Search, Clock, AlertTriangle } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { OrderStatus, StaffOperationType, TicketStatus } from '@/app/lib/types';
import { format, differenceInMinutes } from 'date-fns';
import { StaffService } from '@/app/lib/services/staffService';
import { useAppContext } from '@/app/lib/context/AppContext';
import { OrderService } from '@/app/lib/services/orderService';

export default function StaffCheckPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'scan'>('manual');
  const [checkResult, setCheckResult] = useState<'success' | 'failed' | null>(null);
  const [checkedOrder, setCheckedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { currentUser } = useAppContext();
  
  // 处理检票
  const handleCheck = async () => {
    if (!ticketCode || !currentUser?.id) {
      console.log('检票缺少必要参数', { ticketCode, userId: currentUser?.id });
      return;
    }
    
    setIsLoading(true);
    console.log('开始检票处理', { ticketCode, userId: currentUser.id });
    
    try {
      // 调用检票API
      console.log('调用检票API', { orderId: ticketCode, staffId: currentUser.id });
      const result = await StaffService.checkTicket(currentUser.id, ticketCode);
      console.log('检票API返回结果', result);
      
      if (result.success) {
        // 检票成功，尝试获取订单详情
        console.log('检票成功，获取订单详情');
        const orderDetails = await OrderService.getOrderById(ticketCode);
        console.log('订单详情', orderDetails);
        
        if (orderDetails) {
          console.log('订单详情中的showtime', orderDetails.showtime);
          
          // 设置检票成功结果
          setCheckedOrder({
            ...orderDetails,
            id: ticketCode,
            seatCount: orderDetails.seats?.length || 0
          });
          
          setCheckResult('success');
          console.log('检票处理完成: 成功');
        } else {
          // 找不到订单详情，但检票操作已成功
          console.log('找不到订单详情，但检票操作已成功');
          setCheckedOrder({
            id: ticketCode
          });
          setCheckResult('success');
        }
      } else {
        // 检票失败
        console.log('检票失败', result.message);
        
        // 处理时间相关的错误信息
        const isTimeRelatedError = 
          result.message?.includes('开场前30分钟') ||
          result.message?.includes('分钟的迟到入场时间');
        
        setErrorMessage(result.message);
        
        // 如果是时间相关的错误，可以获取订单并展示更多信息
        if (isTimeRelatedError) {
          try {
            const orderDetails = await OrderService.getOrderById(ticketCode);
            if (orderDetails && orderDetails.showtime) {
              setCheckedOrder({
                ...orderDetails,
                id: ticketCode,
                timeError: true,
                errorMessage: result.message
              });
            }
          } catch (err) {
            console.error('获取订单信息失败', err);
          }
        } else {
          setCheckedOrder(null);
        }
        
        setCheckResult('failed');
      }
    } catch (error) {
      console.error('检票过程发生错误:', error);
      setErrorMessage(error instanceof Error ? error.message : '未知错误');
      setCheckedOrder(null);
      setCheckResult('failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 重置检票状态
  const resetCheck = () => {
    setTicketCode('');
    setCheckResult(null);
    setCheckedOrder(null);
    setErrorMessage('');
  };
  
  // 渲染检票结果
  const renderCheckResult = () => {
    if (checkResult === 'success') {
      return (
        <Card className="mb-4">
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">检票成功</h3>
              <p className="text-sm text-green-600">
                订单ID: {checkedOrder?.id}
              </p>
            </div>
          </div>
          <div className="p-4">
            {checkedOrder?.movie && (
              <div className="mb-2">
                <span className="text-sm text-slate-500">电影:</span>
                <span className="font-medium ml-2">{checkedOrder.movie?.title}</span>
              </div>
            )}
            {checkedOrder?.showtime && (
              <div className="mb-2">
                <span className="text-sm text-slate-500">场次:</span>
                <span className="font-medium ml-2">
                  {checkedOrder.showtime.startTime && 
                   format(new Date(checkedOrder.showtime.startTime), 'MM-dd HH:mm')}
                </span>
              </div>
            )}
            {checkedOrder?.theater && (
              <div className="mb-2">
                <span className="text-sm text-slate-500">影厅:</span>
                <span className="font-medium ml-2">{checkedOrder.theater?.name}</span>
              </div>
            )}
            {checkedOrder?.seatCount > 0 && (
              <div className="mb-2">
                <span className="text-sm text-slate-500">座位数:</span>
                <span className="font-medium ml-2">{checkedOrder.seatCount}个</span>
              </div>
            )}
            <Button
              variant="primary"
              fullWidth
              className="mt-3"
              onClick={resetCheck}
            >
              <TicketCheck className="h-4 w-4 mr-2" />
              继续检票
            </Button>
          </div>
        </Card>
      );
    }
    
    if (checkResult === 'failed') {
      return (
        <Card className="mb-4">
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">检票失败</h3>
              <p className="text-sm text-red-600">
                {errorMessage || '订单不存在或已被使用'}
              </p>
            </div>
          </div>
          <div className="p-4">
            {checkedOrder?.timeError ? (
              <>
                <p className="text-slate-600 mb-3">检票时间限制:</p>
                <div className="bg-amber-50 p-3 rounded-md mb-3">
                  <div className="flex items-start mb-1">
                    <Clock className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                    <p className="text-sm text-amber-700">{errorMessage}</p>
                  </div>
                  {checkedOrder?.showtime?.startTime && (
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-amber-600 mr-2">开场时间:</span>
                      <span className="text-sm font-medium text-amber-800">
                        {format(new Date(checkedOrder.showtime.startTime), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">提示: 请在电影开场前30分钟内或开场后15分钟内检票</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 mb-3">可能的原因:</p>
                <ul className="text-sm text-slate-500 list-disc list-inside space-y-1 mb-3">
                  <li>订单ID输入错误</li>
                  <li>票已被检验过</li>
                  <li>订单已取消或退款</li>
                  <li>订单未完成支付</li>
                </ul>
              </>
            )}
            <Button
              variant="primary"
              fullWidth
              onClick={resetCheck}
            >
              <TicketCheck className="h-4 w-4 mr-2" />
              重新检票
            </Button>
          </div>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <MobileLayout title="电影检票" userRole="staff">
      <div className="p-4 pb-20">
        {/* 检票结果 */}
        {renderCheckResult()}
        
        {/* 检票模式选择 */}
        {!checkResult && (
          <>
            <div className="flex mb-4">
              <Button
                variant={scanMode === 'manual' ? 'primary' : 'outline'}
                className="flex-1 mr-2"
                onClick={() => setScanMode('manual')}
              >
                <Search className="h-4 w-4 mr-1" />
                手动查询
              </Button>
              <Button
                variant={scanMode === 'scan' ? 'primary' : 'outline'}
                className="flex-1"
                onClick={() => setScanMode('scan')}
              >
                <QrCode className="h-4 w-4 mr-1" />
                扫码检票
              </Button>
            </div>
            
            {/* 手动输入检票 */}
            {scanMode === 'manual' && (
              <Card className="mb-4">
                <div className="p-4">
                  <h3 className="font-medium mb-3">输入订单ID</h3>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="请输入订单编号..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleCheck}
                    disabled={!ticketCode || isLoading}
                    isLoading={isLoading}
                  >
                    <TicketCheck className="h-4 w-4 mr-2" />
                    验票
                  </Button>
                </div>
              </Card>
            )}
            
            {/* 扫码检票 */}
            {scanMode === 'scan' && (
              <Card className="mb-4">
                <div className="p-4 text-center">
                  <div className="bg-slate-100 p-4 rounded-lg mb-3 flex flex-col items-center justify-center" style={{ height: '240px' }}>
                    <QrCode className="h-16 w-16 text-slate-400 mb-3" />
                    <p className="text-slate-500">模拟扫码区域</p>
                    <p className="text-xs text-slate-400 mt-1">实际应用中接入摄像头扫码</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      // 在实际环境中这里会调用相机扫描二维码
                      // 为了测试，这里手动设置一个简单的订单ID
                      setTicketCode('TK' + Date.now().toString().substring(6, 13));
                      setTimeout(handleCheck, 100);
                    }}
                    disabled={isLoading}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    模拟扫码
                  </Button>
                </div>
              </Card>
            )}
            
            {/* 检票说明 */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-medium">检票说明</h3>
              </div>
              <div className="p-4">
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                    <span>检票前请确认电影场次信息</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                    <span>开场前30分钟至开场后15分钟内可检票入场</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                    <span>一张票只能检一次，请勿重复检票</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                    <span>遇到检票问题请联系技术支持</span>
                  </li>
                </ul>
              </div>
            </Card>
          </>
        )}
      </div>
    </MobileLayout>
  );
} 