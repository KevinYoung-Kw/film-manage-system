'use client';

import React from 'react';
import MainLayout from './MainLayout';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showBottomNav?: boolean;
  rightAction?: React.ReactNode;
  userRole?: 'customer' | 'admin' | 'staff';
}

// 重定向到新的MainLayout组件以保持向后兼容性
const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = true,
  showBottomNav = true,
  rightAction,
  userRole,
}) => {
  return (
    <MainLayout
      title={title}
      showBackButton={showBackButton}
      showBottomNav={showBottomNav}
      rightAction={rightAction}
    >
      {children}
    </MainLayout>
  );
};

export default MobileLayout; 