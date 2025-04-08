'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';
import { UserRole } from '@/app/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, userRole } = useAppContext();
  
  // 表单状态
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 已登录用户自动重定向到相应主页
  useEffect(() => {
    if (isAuthenticated) {
      redirectToRolePage(userRole!);
    }
  }, [isAuthenticated, userRole]);
  
  // 根据用户角色重定向到相应页面
  const redirectToRolePage = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      case UserRole.STAFF:
        router.push('/staff');
        break;
      case UserRole.CUSTOMER:
        router.push('/user');
        break;
      default:
        router.push('/');
    }
  };
  
  // 处理注册提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度必须至少为6个字符');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 默认注册为普通用户
      const user = await register(name, email, password, UserRole.CUSTOMER);
      
      if (user) {
        router.push('/user');
      } else {
        setError('注册失败，请稍后重试');
      }
    } catch (err) {
      setError('注册失败，请稍后重试');
      console.error('注册错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 顶部导航 */}
      <div className="p-4 flex items-center">
        <Link href="/" className="flex items-center text-slate-600">
          <ArrowLeft size={20} />
          <span className="ml-2">返回</span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-4 py-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <Image
                src="/images/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">注册账户</h1>
          <p className="text-slate-500 mt-2">创建新账户，享受电影购票服务</p>
        </div>
        
        {/* 注册表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名输入 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={18} className="text-slate-400" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="您的姓名"
              />
            </div>
          </div>
          
          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          {/* 密码输入 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="至少6个字符"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} className="text-slate-400" />
                ) : (
                  <Eye size={18} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
          
          {/* 确认密码输入 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">确认密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="再次输入密码"
              />
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded border border-red-100">
              {error}
            </div>
          )}
          
          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '注册中...' : '注册账户'}
          </button>
        </form>
        
        {/* 其他选项 */}
        <div className="mt-8 text-center text-sm">
          <span className="text-slate-600">已有账户?</span>
          <Link href="/login" className="ml-1 text-indigo-600 hover:text-indigo-500">
            返回登录
          </Link>
        </div>
      </div>
      
      {/* 页脚 */}
      <div className="py-6 text-center text-xs text-slate-500">
        <p>© 2025 电影票务系统. 保留所有权利。</p>
      </div>
    </div>
  );
} 