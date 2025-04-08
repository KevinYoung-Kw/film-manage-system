'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Settings, CreditCard, Ticket, LogOut, ChevronRight, 
  Heart, History, Phone, Mail, Gift, HelpCircle
} from 'lucide-react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { mockUsers, siteInfo } from '@/app/lib/mockData';
import { UserRole } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { logout } = useAppContext();
  
  useEffect(() => {
    // 从本地存储获取用户信息，或使用模拟用户
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // 如果没有登录，使用默认用户
      setCurrentUser(mockUsers[2]); // 使用第一个普通用户
    }
  }, []);
  
  if (!currentUser) {
    return (
      <MobileLayout title="个人中心">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
          <p className="mt-4 text-slate-500">加载中...</p>
        </div>
      </MobileLayout>
    );
  }
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <MobileLayout title="个人中心">
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
              {currentUser.role === UserRole.CUSTOMER ? '普通会员' : 
               currentUser.role === UserRole.STAFF ? '工作人员' : '管理员'}
            </div>
          </div>
        </div>
      </div>
      
      {/* 会员卡片 */}
      <div className="px-4 mt-[-40px] mb-6">
        <Card className="p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">我的会员卡</h3>
            <span className="text-xs text-indigo-600">查看详情</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-500">积分</div>
              <div className="text-2xl font-bold">520</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">优惠券</div>
              <div className="text-2xl font-bold">3</div>
            </div>
            <div>
              <Button size="sm" variant="primary">
                <Gift className="h-4 w-4 mr-1" />
                签到
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 常用功能 */}
      <div className="px-4 mb-6">
        <h3 className="text-slate-800 font-medium mb-3">我的功能</h3>
        <Card className="divide-y divide-slate-100">
          <Link href="/user/orders" className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Ticket className="h-5 w-5 text-indigo-500 mr-3" />
              <span>我的订单</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link href="/user/favorites" className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-red-500 mr-3" />
              <span>我喜欢的电影</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link href="/user/history" className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <History className="h-5 w-5 text-amber-500 mr-3" />
              <span>观影历史</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <Link href="/user/faq" className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 text-green-500 mr-3" />
              <span>常见问题</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </Card>
      </div>
      
      {/* 账户设置 */}
      <div className="px-4 mb-6">
        <h3 className="text-slate-800 font-medium mb-3">账户设置</h3>
        <Card className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-slate-500 mr-3" />
              <span>个人资料</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-slate-500 mr-3" />
              <span>手机号</span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-400 text-sm mr-2">绑定</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-slate-500 mr-3" />
              <span>邮箱</span>
            </div>
            <div className="flex items-center">
              <span className="text-slate-400 text-sm mr-2">{currentUser.email}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-slate-500 mr-3" />
              <span>设置</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </Card>
      </div>
      
      {/* 退出登录 */}
      <div className="px-4 mb-8">
        <Card>
          <Button 
            variant="outline" 
            className="w-full py-3 text-red-500 border-red-100"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            退出登录
          </Button>
        </Card>
      </div>
      
      {/* 底部版本信息 */}
      <div className="text-center p-4 text-xs text-slate-400">
        <p>{siteInfo.name} v1.0.0</p>
        <p className="mt-1">{siteInfo.copyright}</p>
      </div>
    </MobileLayout>
  );
} 