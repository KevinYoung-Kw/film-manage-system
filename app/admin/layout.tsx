'use client';

import { usePathname } from 'next/navigation';
import MobileLayout from '@/app/components/layout/MobileLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 根据路径确定标题
  const getTitle = () => {
    if (pathname.includes('/admin/movies')) return '电影管理';
    if (pathname.includes('/admin/showtimes')) return '排片管理';
    if (pathname.includes('/admin/theaters')) return '影厅管理';
    if (pathname.includes('/admin/staff')) return '员工管理';
    if (pathname.includes('/admin/pricing')) return '票价设置';
    if (pathname.includes('/admin/stats')) return '数据统计';
    if (pathname.includes('/admin/settings')) return '系统设置';
    return '管理系统';
  };
  
  return (
    <MobileLayout userRole="admin" title={getTitle()}>
      {children}
    </MobileLayout>
  );
} 