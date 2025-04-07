'use client';

import React, { useState } from 'react';
import { QrCode, TicketCheck, Check, X, Search } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { mockOrders, mockShowtimes, mockMovies, mockTheaters } from '@/app/lib/mockData';
import { OrderStatus, StaffOperationType } from '@/app/lib/types';
import { format } from 'date-fns';

export default function StaffCheckPage() {
  const [ticketCode, setTicketCode] = useState('');
  const [scanMode, setScanMode] = useState<'manual' | 'scan'>('manual');
  const [checkResult, setCheckResult] = useState<'success' | 'failed' | null>(null);
  const [checkedOrder, setCheckedOrder] = useState<any>(null);
  
  // 处理检票
  const handleCheck = () => {
    // 模拟检票过程，实际中应当调用API检查票码是否有效
    // 这里简单地通过订单ID匹配
    const order = mockOrders.find(o => o.id === ticketCode);
    
    if (order && order.status === OrderStatus.PAID) {
      // 查找场次和电影信息
      const showtime = mockShowtimes.find(s => s.id === order.showtimeId);
      const movie = showtime ? mockMovies.find(m => m.id === showtime.movieId) : null;
      const theater = showtime ? mockTheaters.find(t => t.id === showtime.theaterId) : null;
      
      setCheckedOrder({
        ...order,
        showtime,
        movie,
        theater,
        seatCount: order.seats.length
      });
      
      setCheckResult('success');
    } else {
      setCheckedOrder(null);
      setCheckResult('failed');
    }
  };
  
  // 重置检票状态
  const resetCheck = () => {
    setTicketCode('');
    setCheckResult(null);
    setCheckedOrder(null);
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
              <p className="text-sm text-green-600">订单ID: {checkedOrder.id}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-2">
              <span className="text-sm text-slate-500">电影:</span>
              <span className="font-medium ml-2">{checkedOrder.movie?.title}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-slate-500">场次:</span>
              <span className="font-medium ml-2">
                {format(checkedOrder.showtime?.startTime, 'MM-dd HH:mm')}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-slate-500">影厅:</span>
              <span className="font-medium ml-2">{checkedOrder.theater?.name}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-slate-500">座位数:</span>
              <span className="font-medium ml-2">{checkedOrder.seatCount}个</span>
            </div>
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
              <p className="text-sm text-red-600">订单不存在或已被使用</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-slate-600 mb-3">可能的原因:</p>
            <ul className="text-sm text-slate-500 list-disc list-inside space-y-1 mb-3">
              <li>订单ID输入错误</li>
              <li>票已被检验过</li>
              <li>订单已取消或退款</li>
              <li>订单未完成支付</li>
            </ul>
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
                    disabled={!ticketCode}
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
                      // 模拟扫描，使用示例订单ID
                      setTicketCode('order1');
                      handleCheck();
                    }}
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
                    <span>一张票只能检一次，请勿重复检票</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-100 text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
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