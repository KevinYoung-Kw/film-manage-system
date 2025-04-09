'use client';

import React, { useState } from 'react';
import { QrCode, TicketCheck, Check, X, Search, Clock, AlertTriangle } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { mockOrders, mockShowtimes, mockMovies, mockTheaters } from '@/app/lib/mockData';
import { OrderStatus, StaffOperationType, TicketStatus } from '@/app/lib/types';
import { format, differenceInMinutes } from 'date-fns';

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
      
      // 检查场次时间
      const now = new Date();
      const showtimeDate = showtime ? new Date(showtime.startTime) : null;
      
      if (!showtimeDate) {
        setCheckedOrder(null);
        setCheckResult('failed');
        return;
      }
      
      // 计算当前时间与开场时间的分钟差
      const minutesToShowtime = differenceInMinutes(showtimeDate, now);
      const minutesAfterStart = differenceInMinutes(now, showtimeDate);
      
      // 电影已经开始超过15分钟，不允许检票
      if (showtimeDate < now && minutesAfterStart > 15) {
        setCheckedOrder({
          ...order,
          showtime,
          movie,
          theater,
          seatCount: order.seats.length,
          isExpired: true,
          minutesLate: minutesAfterStart
        });
        
        setCheckResult('failed');
        return;
      }
      
      // 电影还未开始且距离开场超过30分钟，不允许检票
      if (showtimeDate > now && minutesToShowtime > 30) {
        setCheckedOrder({
          ...order,
          showtime,
          movie,
          theater,
          seatCount: order.seats.length,
          tooEarly: true,
          minutesToShowtime
        });
        
        setCheckResult('failed');
        return;
      }
      
      // 电影已开场但在允许迟到的15分钟内
      const isLate = showtimeDate < now && minutesAfterStart <= 15;
      
      setCheckedOrder({
        ...order,
        showtime,
        movie,
        theater,
        seatCount: order.seats.length,
        isLate,
        minutesLate: isLate ? minutesAfterStart : 0
      });
      
      setCheckResult('success');
      
      // 模拟更新票券状态
      if (order.ticketStatus !== TicketStatus.USED) {
        order.ticketStatus = TicketStatus.USED;
        order.checkedAt = now;
      }
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
          <div className={`p-4 ${checkedOrder.isLate ? 'bg-amber-50 border-b border-amber-100' : 'bg-green-50 border-b border-green-100'} flex items-center`}>
            <div className={`${checkedOrder.isLate ? 'bg-amber-100' : 'bg-green-100'} p-2 rounded-full mr-3`}>
              {checkedOrder.isLate ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <Check className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h3 className={`font-medium ${checkedOrder.isLate ? 'text-amber-800' : 'text-green-800'}`}>
                {checkedOrder.isLate ? '迟到检票成功' : '检票成功'}
              </h3>
              <p className={`text-sm ${checkedOrder.isLate ? 'text-amber-600' : 'text-green-600'}`}>
                订单ID: {checkedOrder.id}
                {checkedOrder.isLate && ` · 迟到${checkedOrder.minutesLate}分钟`}
              </p>
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
            {checkedOrder.isLate && (
              <div className="p-3 bg-amber-50 rounded-md text-sm text-amber-700 mb-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>电影已开始，请提醒观众安静入场</span>
                </div>
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
                {checkedOrder?.isExpired 
                  ? '电影开场已超过15分钟，无法检票' 
                  : checkedOrder?.tooEarly
                  ? '未到检票时间，过早检票'
                  : '订单不存在或已被使用'}
              </p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-slate-600 mb-3">可能的原因:</p>
            <ul className="text-sm text-slate-500 list-disc list-inside space-y-1 mb-3">
              {checkedOrder?.isExpired ? (
                <>
                  <li>电影开场时间：{format(checkedOrder.showtime?.startTime, 'yyyy-MM-dd HH:mm')}</li>
                  <li>当前系统时间：{format(new Date(), 'yyyy-MM-dd HH:mm')}</li>
                  <li>已超过允许入场时间（开场后15分钟内可入场）</li>
                  <li>迟到时间：{checkedOrder.minutesLate}分钟</li>
                </>
              ) : checkedOrder?.tooEarly ? (
                <>
                  <li>距离电影开场还有 {checkedOrder.minutesToShowtime} 分钟</li>
                  <li>电影开场时间：{format(checkedOrder.showtime?.startTime, 'yyyy-MM-dd HH:mm')}</li>
                  <li>当前系统时间：{format(new Date(), 'yyyy-MM-dd HH:mm')}</li>
                  <li>只能在电影开场前30分钟内检票入场</li>
                </>
              ) : (
                <>
                  <li>订单ID输入错误</li>
                  <li>票已被检验过</li>
                  <li>订单已取消或退款</li>
                  <li>订单未完成支付</li>
                </>
              )}
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
                      // 获取当前时间
                      const now = new Date();
                      
                      // 获取可检票的场次（开场前30分钟内或开场后15分钟内的场次）
                      const validShowtimes = mockShowtimes.filter(s => {
                        const showtimeDate = new Date(s.startTime);
                        if (showtimeDate > now) {
                          // 电影未开始：30分钟内可检票
                          const minutesToShowtime = differenceInMinutes(showtimeDate, now);
                          return minutesToShowtime >= 0 && minutesToShowtime <= 30;
                        } else {
                          // 电影已开始：15分钟内可迟到检票
                          const minutesAfterStart = differenceInMinutes(now, showtimeDate);
                          return minutesAfterStart <= 15;
                        }
                      });
                      
                      if (validShowtimes.length > 0) {
                        // 获取有效场次的订单
                        const validOrders = mockOrders.filter(o => 
                          validShowtimes.some(s => s.id === o.showtimeId) && 
                          o.status === OrderStatus.PAID &&
                          o.ticketStatus !== TicketStatus.USED // 票未使用
                        );
                        
                        if (validOrders.length > 0) {
                          // 随机选择一个有效订单
                          const randomOrder = validOrders[Math.floor(Math.random() * validOrders.length)];
                          setTicketCode(randomOrder.id);
                        } else {
                          // 没有有效订单，使用默认ID
                          setTicketCode('TK2504060001');
                        }
                      } else {
                        // 没有可检票的场次，使用默认ID
                        setTicketCode('TK2504060001');
                      }
                      
                      // 进行检票
                      setTimeout(handleCheck, 100);
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