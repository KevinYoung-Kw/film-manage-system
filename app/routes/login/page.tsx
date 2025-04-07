'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { UserRole, User as UserType } from '@/app/lib/types';
import { mockUsers } from '@/app/lib/mockData';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // 简单的模拟登录逻辑
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      
      if (!user || password !== '123456') { // 简单的密码验证
        setError('邮箱或密码错误');
        setLoading(false);
        return;
      }
      
      // 登录成功，根据用户角色跳转到不同的页面
      setLoading(false);
      
      // 模拟存储用户信息到 localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // 根据用户角色跳转
      if (user.role === UserRole.ADMIN) {
        router.push('/admin');
      } else if (user.role === UserRole.STAFF) {
        router.push('/staff');
      } else {
        router.push('/');
      }
    }, 1000);
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto p-4">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <Image
                src="/images/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">电影票务系统</h1>
          <p className="text-slate-500 mt-2">登录您的账号以继续</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              电子邮箱
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入您的电子邮箱"
                className="w-full py-2 px-4 pl-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入您的密码"
                className="w-full py-2 px-4 pl-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm py-2">{error}</div>
          )}
          
          <div className="flex justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
              <span className="ml-2 text-slate-700">记住我</span>
            </label>
            <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
              忘记密码？
            </Link>
          </div>
          
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={loading}
          >
            登录
          </Button>
        </form>
        
        <div className="mt-6 text-sm text-center">
          <span className="text-slate-600">还没有账号？</span>
          <Link href="/register" className="ml-1 text-indigo-600 hover:text-indigo-500">
            立即注册
          </Link>
        </div>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">或使用以下账号登录</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-3">
            <button className="flex justify-center items-center py-2 rounded-md border border-slate-300 hover:bg-slate-50">
              <span className="text-slate-600 font-semibold text-sm">观众</span>
            </button>
            <button className="flex justify-center items-center py-2 rounded-md border border-slate-300 hover:bg-slate-50">
              <span className="text-slate-600 font-semibold text-sm">售票员</span>
            </button>
            <button className="flex justify-center items-center py-2 rounded-md border border-slate-300 hover:bg-slate-50">
              <span className="text-slate-600 font-semibold text-sm">管理员</span>
            </button>
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-xs text-slate-500">
        <p>© 2024 电影票务系统. 保留所有权利。</p>
      </footer>
    </div>
  );
} 