'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Film, Ticket, User, Home, Calendar, Settings, Layout, 
  LogOut, BarChart, Users, DollarSign, History, Search, RefreshCcw, Clock, ChevronLeft, Plus, Undo, CheckSquare, Briefcase, CalendarClock
} from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';
import { UserRole } from '@/app/lib/types';
import ThemeToggle from '../ThemeToggle';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showBottomNav?: boolean;
  rightAction?: ReactNode;
}

// 导航项类型
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // 哪些角色可以看到此项
}

// 所有导航项定义
const navItems: NavItem[] = [
  // 共享的导航项
  { 
    label: '首页', 
    href: '/', 
    icon: Home, 
    roles: [UserRole.CUSTOMER]
  },
  
  // 用户导航项
  { 
    label: '电影', 
    href: '/user/movies', 
    icon: Film, 
    roles: [UserRole.CUSTOMER] 
  },
  { 
    label: '场次', 
    href: '/user/showtimes', 
    icon: Calendar, 
    roles: [UserRole.CUSTOMER] 
  },
  { 
    label: '订单', 
    href: '/user/orders', 
    icon: Ticket, 
    roles: [UserRole.CUSTOMER] 
  },
  { 
    label: '我的', 
    href: '/user/profile', 
    icon: User, 
    roles: [UserRole.CUSTOMER] 
  },
  
  // 售票员导航项
  { 
    label: '售票', 
    href: '/staff/sell', 
    icon: Ticket, 
    roles: [UserRole.STAFF] 
  },
  { 
    label: '检票', 
    href: '/staff/check', 
    icon: Search, 
    roles: [UserRole.STAFF] 
  },
  { 
    label: '退票', 
    href: '/staff/refund', 
    icon: RefreshCcw, 
    roles: [UserRole.STAFF] 
  },
  { 
    label: '记录', 
    href: '/staff/history', 
    icon: History, 
    roles: [UserRole.STAFF] 
  },
  { 
    label: '我的', 
    href: '/staff/profile', 
    icon: User, 
    roles: [UserRole.STAFF] 
  },
  
  // 管理员导航项
  { 
    label: '电影', 
    href: '/admin/movies', 
    icon: Film, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '排片', 
    href: '/admin/showtimes', 
    icon: Calendar, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '影厅', 
    href: '/admin/theaters', 
    icon: Layout, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '员工', 
    href: '/admin/staff', 
    icon: Users, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '我的', 
    href: '/admin/profile', 
    icon: User, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '统计', 
    href: '/admin/stats', 
    icon: BarChart, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '票价', 
    href: '/admin/pricing', 
    icon: DollarSign, 
    roles: [UserRole.ADMIN] 
  },
  { 
    label: '设置', 
    href: '/admin/settings', 
    icon: Settings, 
    roles: [UserRole.ADMIN] 
  },
];

// 主布局组件
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showBackButton = true,
  showBottomNav = true,
  rightAction,
}) => {
  const pathname = usePathname();
  const { userRole, logout, isAuthenticated } = useAppContext();
  
  // 获取当前角色的导航项
  const getNavItemsForCurrentRole = (): NavItem[] => {
    if (!userRole) {
      // 如果没有角色信息，返回公共导航项
      return navItems.filter(item => item.roles.includes(UserRole.CUSTOMER)).slice(0, 4);
    }
    
    // 根据当前用户角色过滤导航项
    return navItems.filter(item => item.roles.includes(userRole));
  };
  
  // 确定页面标题
  const getPageTitle = (): string => {
    if (title) return title;
    
    // 根据路径返回标题
    if (pathname.includes('/user/movies')) return '电影列表';
    if (pathname.includes('/user/showtimes')) return '场次查询';
    if (pathname.includes('/user/profile')) return '个人中心';
    if (pathname.includes('/user/orders')) return '我的订单';
    
    if (pathname.includes('/staff/sell')) return '售票服务';
    if (pathname.includes('/staff/check')) return '检票验证';
    if (pathname.includes('/staff/refund')) return '退票处理';
    if (pathname.includes('/staff/history')) return '操作记录';
    
    if (pathname.includes('/admin/movies')) return '电影管理';
    if (pathname.includes('/admin/showtimes')) return '排片管理';
    if (pathname.includes('/admin/theaters')) return '影厅管理';
    if (pathname.includes('/admin/staff')) return '员工管理';
    if (pathname.includes('/admin/stats')) return '数据统计';
    if (pathname.includes('/admin/pricing')) return '票价设置';
    if (pathname.includes('/admin/settings')) return '系统设置';
    
    return '电影票务系统';
  };
  
  // 获取角色中文名称
  const getRoleName = (): string => {
    switch (userRole) {
      case UserRole.ADMIN:
        return '管理员';
      case UserRole.STAFF:
        return '售票员';
      case UserRole.CUSTOMER:
        return '用户';
      default:
        return '访客';
    }
  };
  
  // 显示在底部导航中的项目
  const bottomNavItems = getNavItemsForCurrentRole().slice(0, 5);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-3">
            {/* 返回按钮 */}
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-slate-600"
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
            
            {/* 页面标题 */}
            <h1 className="text-lg font-semibold text-slate-800">
              {getPageTitle()}
              {userRole && <span className="ml-2 text-xs text-slate-500">({getRoleName()})</span>}
            </h1>
          </div>
          
          {/* 右侧操作区 */}
          <div className="flex items-center space-x-2">
            {/* 主题切换按钮 */}
            <ThemeToggle />

            {/* 其他操作按钮 */}
            {rightAction}
          </div>
        </div>
      </header>
      
      {/* 页面内容 */}
      <main className="flex-1 max-w-md mx-auto w-full">
        {children}
      </main>
      
      {/* 底部导航 */}
      {showBottomNav && bottomNavItems.length > 0 && (
        <nav className="bg-white border-t border-slate-200 sticky bottom-0 z-10">
          <div className="max-w-md mx-auto flex justify-around py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const IconComponent = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-1 px-3 rounded-md ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      
      {/* 安全区域 - 防止内容被底部导航遮挡 */}
      {showBottomNav}
    </div>
  );
};

export default MainLayout; 