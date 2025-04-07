'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { staffRoutes } from '@/app/lib/utils/navigation';

export default function StaffPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace(staffRoutes.sell);
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
      <p className="ml-3 text-slate-600">正在跳转...</p>
    </div>
  );
} 