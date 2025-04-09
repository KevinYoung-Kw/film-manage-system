'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { User, Clock, Calendar, Ticket, Settings, LogOut, Bell } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { ScheduleService } from '@services/scheduleService';
import { ShiftType } from '@/app/lib/types';
import { userRoutes } from '@/app/lib/utils/navigation';
import Link from 'next/link';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function StaffProfilePage() {
  const { currentUser, logout, userRole, isAuthenticated } = useAppContext();
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadSchedules() {
      if (!currentUser || !isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // 获取当前工作人员的排班
        const schedules = await ScheduleService.getSchedulesByStaffId(currentUser.id);
        setUpcomingSchedules(schedules);
      } catch (error) {
        console.error('加载排班信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSchedules();
  }, [currentUser, isAuthenticated]);
  
  // 处理退出登录
  const handleLogout = async () => {
    await logout();
  };
  
  // 格式化班次信息
  const formatShift = (shift: ShiftType) => {
    const shifts = {
      [ShiftType.MORNING]: '早班 (8:00-14:00)',
      [ShiftType.AFTERNOON]: '午班 (14:00-20:00)',
      [ShiftType.EVENING]: '晚班 (20:00-次日2:00)'
    };
    return shifts[shift];
  };
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MM月dd日 EEEE', { locale: zhCN });
  };
  
  if (!currentUser) {
    return <div className="p-4 text-center">加载中...</div>;
  }
  
  return (
    <MobileLayout title="个人中心" userRole="staff">
      <div className="pb-20">
        {/* 用户信息卡片 */}
        <div className="relative bg-indigo-600 text-white p-6 pb-16">
          <div className="flex items-center">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white">
              <Image
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt={currentUser.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{currentUser.name}</h2>
              <p className="text-white/80 text-sm">{currentUser.email}</p>
              <div className="mt-1 bg-white/20 text-white text-xs py-1 px-2 rounded-full inline-block">
                工作人员
              </div>
            </div>
          </div>
        </div>
        
        {/* 快捷功能 */}
        <div className="px-4 mt-[-40px] mb-6">
          <Card className="p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">个人信息</h3>
              <span className="text-xs text-indigo-600">员工ID: {currentUser.id.substring(0, 8)}...</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Link href="/staff/history">
                <div className="flex flex-col items-center p-2">
                  <div className="p-2 bg-purple-100 rounded-full mb-1">
                    <Ticket className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs text-slate-600">工作记录</span>
                </div>
              </Link>
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-indigo-100 rounded-full mb-1">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-xs text-slate-600">排班表</span>
              </div>
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-amber-100 rounded-full mb-1">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-xs text-slate-600">通知</span>
              </div>
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-slate-100 rounded-full mb-1">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <span className="text-xs text-slate-600">设置</span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 未来排班 */}
        <div className="px-4 mb-4">
          <h3 className="font-medium mb-3">近期排班</h3>
          <Card>
            {isLoading ? (
              <div className="p-4 text-center text-slate-500">加载中...</div>
            ) : upcomingSchedules.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingSchedules.map((schedule, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{formatDate(schedule.date)}</div>
                        <div className="text-sm text-slate-500 mt-1">{formatShift(schedule.shift)}</div>
                        <div className="text-sm text-slate-500">{schedule.position}</div>
                      </div>
                      {schedule.notes && (
                        <div className="bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500">近期无排班</div>
            )}
          </Card>
        </div>
        
        {/* 系统信息 */}
        <div className="px-4">
          <Card>
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-medium">系统信息</h3>
            </div>
            <div className="p-4">
              <div className="mb-3 flex justify-between">
                <span className="text-sm text-slate-500">系统版本</span>
                <span className="text-sm">1.0.0</span>
              </div>
              <div className="mb-3 flex justify-between">
                <span className="text-sm text-slate-500">上次登录</span>
                <span className="text-sm">{format(new Date(), 'yyyy-MM-dd HH:mm')}</span>
              </div>
              <Button 
                variant="outline" 
                fullWidth
                className="mt-3 text-red-500 border-red-300 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
} 