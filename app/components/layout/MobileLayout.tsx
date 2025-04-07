'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Ticket, User, Home } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showBottomNav?: boolean;
  rightAction?: React.ReactNode;
  userRole?: 'customer' | 'admin' | 'staff';
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  showBottomNav = true,
  rightAction,
  userRole = 'customer'
}) => {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => window.history.back()}
                className="mr-2 p-1 rounded-full hover:bg-slate-100"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </button>
            )}
            {title && <h1 className="font-medium text-lg">{title}</h1>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>

      {/* 底部导航栏 */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 shadow-md">
          <div className="flex justify-around py-2">
            {getNavItems(userRole).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-1 rounded-md text-slate-600 hover:text-indigo-600"
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

function getNavItems(userRole: 'customer' | 'admin' | 'staff') {
  // 根据用户角色返回不同的导航项
  const commonItems = [
    { label: '首页', href: '/user', icon: Home }
  ];

  if (userRole === 'customer') {
    return [
      ...commonItems,
      { label: '电影', href: '/user/movies', icon: Film },
      { label: '订单', href: '/user/orders', icon: Ticket },
      { label: '我的', href: '/user/profile', icon: User }
    ];
  } else if (userRole === 'admin') {
    return [
      ...commonItems,
      { label: '管理', href: '/admin', icon: Film },
      { label: '统计', href: '/admin/stats', icon: Ticket },
      { label: '设置', href: '/admin/settings', icon: User }
    ];
  } else if (userRole === 'staff') {
    return [
      ...commonItems,
      { label: '售票', href: '/staff', icon: Ticket },
      { label: '检票', href: '/staff/check', icon: Film },
      { label: '我的', href: '/profile', icon: User }
    ];
  }

  return commonItems;
}

export default MobileLayout; 