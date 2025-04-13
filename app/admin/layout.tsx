'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { AuthService } from '@/app/lib/services/authService';
import { UserRole } from '@/app/lib/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 验证当前用户是否有管理员权限
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // 获取当前用户信息
        const user = await AuthService.getCurrentUser();
        
        // 检查用户是否为管理员或工作人员
        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF)) {
          console.error('访问被拒绝: 需要管理员或工作人员权限');
          setIsAuthorized(false);
          
          // 可选：重定向到登录页面
          setTimeout(() => {
            router.push('/login?redirect=' + encodeURIComponent(pathname));
          }, 2000);
        } else {
          console.log('授权访问管理界面', user);
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('验证用户权限时出错:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, router]);
  
  // 根据路径确定标题
  const getTitle = () => {
    if (pathname.includes('/admin/movies')) return '电影管理';
    if (pathname.includes('/admin/showtimes')) return '排片管理';
    if (pathname.includes('/admin/theaters')) return '影厅管理';
    if (pathname.includes('/admin/staff')) return '员工管理';
    if (pathname.includes('/admin/pricing')) return '票价设置';
    if (pathname.includes('/admin/stats')) return '数据统计';
    if (pathname.includes('/admin/settings')) return '系统设置';
    if (pathname.includes('/admin/profile')) return '个人中心';
    return '管理系统';
  };
  
  // 显示加载或未授权消息
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
        <p className="mt-4 text-lg text-gray-600">验证权限中...</p>
      </div>
    );
  }
  
  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h1>
          <p className="text-gray-700 mb-6">您没有权限访问管理页面。此页面仅限管理员和工作人员访问。</p>
          <p className="text-gray-700 mb-6">即将跳转到登录页面...</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-200"
          >
            立即登录
          </button>
          <button 
            onClick={() => router.push('/')}
            className="w-full mt-2 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition duration-200"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
  
  // 用户已授权，显示管理界面
  return (
    <MobileLayout userRole="admin" title={getTitle()}>
      {children}
    </MobileLayout>
  );
} 