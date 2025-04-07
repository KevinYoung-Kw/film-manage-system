'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/admin/movies');
  }, [router]);
  
  return <div className="flex items-center justify-center h-screen">正在跳转...</div>;
} 