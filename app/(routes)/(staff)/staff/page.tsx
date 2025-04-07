import React from 'react';
import Link from 'next/link';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Ticket, QrCode, CreditCard, History, Search } from 'lucide-react';
import { mockShowtimes } from '@/app/lib/mockData';
import { format } from 'date-fns';

export default function StaffPage() {
  // 获取当天的场次
  const today = new Date();
  const todayShowtimes = mockShowtimes.filter(showtime => {
    const showtimeDate = new Date(showtime.startTime);
    return (
      showtimeDate.getDate() === today.getDate() &&
      showtimeDate.getMonth() === today.getMonth() &&
      showtimeDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <MobileLayout title="售票系统" userRole="staff">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-3">售票员工作台</h1>
        
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索订单或手机号..."
              className="w-full py-2 pl-10 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-3">
            <CardContent>
              <Link href="/staff/sell" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <Ticket className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-sm font-medium">售票</span>
                <span className="text-xs text-slate-500 mt-1">现场购票</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/staff/check" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <QrCode className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">检票</span>
                <span className="text-xs text-slate-500 mt-1">扫码入场</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/staff/refund" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium">退票</span>
                <span className="text-xs text-slate-500 mt-1">订单处理</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/staff/history" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <History className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">记录</span>
                <span className="text-xs text-slate-500 mt-1">操作历史</span>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-lg font-semibold mb-3">今日场次</h2>
        
        <div className="space-y-3 mb-6">
          {todayShowtimes.length > 0 ? (
            todayShowtimes.map(showtime => (
              <Card key={showtime.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{format(showtime.startTime, 'HH:mm')}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {format(showtime.startTime, 'yyyy-MM-dd')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      影厅: {showtime.theaterId.replace('theater', '')}号厅
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {showtime.availableSeats.filter(seat => seat.available).length} 座可售
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-4 text-slate-500">今日暂无场次</div>
          )}
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h2 className="text-amber-800 font-semibold mb-2">工作提示</h2>
          <p className="text-amber-700 text-sm">
            当前系统正在开发中，以上功能为预览版本，部分功能可能尚未完全实现。
          </p>
        </div>
      </div>
    </MobileLayout>
  );
} 