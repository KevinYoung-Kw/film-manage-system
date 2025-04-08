'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { User, BarChart, Film, Calendar, Settings, LogOut, Users, DollarSign } from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { mockUsers, mockAdminStats } from '@/app/lib/mockData';
import { userRoutes } from '@/app/lib/utils/navigation';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function AdminProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const { logout } = useAppContext();
  
  useEffect(() => {
    // 假设当前登录的管理员ID是admin1
    const adminId = 'admin1';
    const user = mockUsers.find(u => u.id === adminId);
    setCurrentUser(user);
    
    // 获取统计数据
    setStats(mockAdminStats);
  }, []);
  
  if (!currentUser) {
    return <div className="p-4 text-center">加载中...</div>;
  }
  
  // 处理退出登录
  const handleLogout = async () => {
    await logout();
  };
  
  return (

    <div className="pb-20">
      {/* 用户信息卡片 */}
      <div className="relative bg-indigo-600 text-white p-6 pb-16">
        <div className="flex items-center">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white">
            <Image
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
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
              系统管理员
            </div>
          </div>
        </div>
      </div>
      
      {/* 快捷功能 */}
      <div className="px-4 mt-[-40px] mb-6">
        <Card className="p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">管理功能</h3>
            <span className="text-xs text-indigo-600">管理员ID: {currentUser.id}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Link href="/admin/movies">
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-blue-100 rounded-full mb-1">
                  <Film className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs text-slate-600">电影管理</span>
              </div>
            </Link>
            <Link href="/admin/showtimes">
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-purple-100 rounded-full mb-1">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs text-slate-600">排片管理</span>
              </div>
            </Link>
            <Link href="/admin/staff">
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-green-100 rounded-full mb-1">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs text-slate-600">员工管理</span>
              </div>
            </Link>
            <Link href="/admin/stats">
              <div className="flex flex-col items-center p-2">
                <div className="p-2 bg-amber-100 rounded-full mb-1">
                  <BarChart className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-xs text-slate-600">统计数据</span>
              </div>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* 系统概览 */}
      <div className="px-4 mb-4">
        <h3 className="font-medium mb-3">系统概览</h3>
        <Card>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">今日销售额</div>
              <div className="text-xl font-semibold mt-1">¥{stats?.totalSales || 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">售出票数</div>
              <div className="text-xl font-semibold mt-1">{stats?.ticketsSold || 0}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">上座率</div>
              <div className="text-xl font-semibold mt-1">{stats?.averageOccupancy || 0}%</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-500">热映电影</div>
              <div className="text-xl font-semibold mt-1 truncate">星际迷航</div>
            </div>
          </div>
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
            <div className="mb-3 flex justify-between">
              <span className="text-sm text-slate-500">注册时间</span>
              <span className="text-sm">{format(new Date(currentUser.createdAt), 'yyyy-MM-dd')}</span>
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

  );
} 