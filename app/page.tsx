'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './lib/context/AppContext';
import { UserRole } from './lib/types';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, currentUser, userRole } = useAppContext();

  // 页面加载时重定向
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // 已登录用户重定向到对应的角色页面
      switch (userRole) {
        case UserRole.ADMIN:
          router.push('/admin');
          break;
        case UserRole.STAFF:
          router.push('/staff');
          break;
        case UserRole.CUSTOMER:
          router.push('/user');
          break;
      }
    } else {
      // 未登录用户重定向到登录页面
      router.push('/login');
    }
  }, [isAuthenticated, currentUser, userRole, router]);

  // 返回空白页面，等待重定向
  return null;
}
