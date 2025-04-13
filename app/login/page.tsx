'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, UserRound, Shield, Film, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';
import { UserRole } from '@/app/lib/types';
import { AuthService } from '@/app/lib/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, userRole, isAuthenticated } = useAppContext();
  
  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailedError, setDetailedError] = useState<any>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  
  // 已登录用户自动重定向到相应主页
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      redirectToRolePage(userRole!);
    }
  }, [isAuthenticated, currentUser, userRole]);
  
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
  
  // 处理登录提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setDetailedError(null);
    setShowDetailedError(false);
    
    try {
      // 首先测试查询
      const testResult = await AuthService.testUserQuery(email);
      console.log('用户查询测试结果:', testResult);
      
      if (!testResult.success || testResult.count === 0) {
        setDetailedError({
          message: '用户查询测试失败',
          details: testResult
        });
        throw new Error('用户不存在或查询失败');
      }

      const user = await login(email, password);
      
      if (user) {
        redirectToRolePage(user.role);
      } else {
        setError('邮箱或密码错误');
        setDetailedError({
          message: '登录失败，但没有抛出错误',
          email: email
        });
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后重试');
      setDetailedError({
        message: '登录过程中发生错误',
        error: err.toString(),
        stack: err.stack
      });
      console.error('登录错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 快速登录选项
  const demoAccounts = [
    { email: 'admin@example.com', password: 'admin123', role: UserRole.ADMIN, icon: Shield, label: '管理员', color: 'indigo' },
    { email: 'staff1@example.com', password: 'staff123', role: UserRole.STAFF, icon: Film, label: '售票员', color: 'green' },
    { email: 'customer1@example.com', password: 'customer123', role: UserRole.CUSTOMER, icon: UserRound, label: '观众', color: 'blue' }
  ];
  
  // 使用演示账户登录
  const loginWithDemoAccount = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    
    console.log('尝试使用演示账户登录:', {
      email: account.email,
      password: account.password
    });
    
    setIsLoading(true);
    setError('');
    setDetailedError(null);
    setShowDetailedError(false);
    
    try {
      // 首先测试查询
      const testResult = await AuthService.testUserQuery(account.email);
      console.log('演示账户查询测试结果:', testResult);
      
      if (!testResult.success || testResult.count === 0) {
        setDetailedError({
          message: '演示账户查询测试失败',
          details: testResult
        });
        throw new Error('演示账户不存在或查询失败');
      }

      console.log('开始调用登录函数...');
      const user = await login(account.email, account.password);
      console.log('登录函数返回结果:', user);
      
      if (user) {
        redirectToRolePage(user.role);
      } else {
        setError('演示账户登录失败');
        setDetailedError({
          message: '演示账户登录失败，但没有抛出错误',
          email: account.email
        });
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后重试');
      setDetailedError({
        message: '演示账户登录过程中发生错误',
        error: err.toString(),
        stack: err.stack
      });
      console.error('演示账户登录错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 顶部空间 */}
      <div className="p-4"></div>
      
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
          <h1 className="text-2xl font-bold text-slate-800">欢迎使用</h1>
          <p className="text-slate-500 mt-2">登录电影票务系统</p>
        </div>
        
        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
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
          
          {/* 错误提示 */}
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded border border-red-100">
              <div className="flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{error}</p>
                  {detailedError && (
                    <button 
                      onClick={() => setShowDetailedError(!showDetailedError)}
                      className="text-xs underline mt-1"
                    >
                      {showDetailedError ? '隐藏详情' : '显示详情'}
                    </button>
                  )}
                </div>
              </div>
              
              {showDetailedError && detailedError && (
                <pre className="mt-2 p-2 bg-white text-xs overflow-auto max-h-40 rounded border border-red-200">
                  {JSON.stringify(detailedError, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
          
          {/* 演示账户快速登录 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 text-slate-500">快速登录演示账户</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              {demoAccounts.map((account) => {
                const IconComponent = account.icon;
                
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => loginWithDemoAccount(account)}
                    disabled={isLoading}
                    className={`bg-${account.color}-100 text-${account.color}-700 hover:bg-${account.color}-200 flex flex-col items-center justify-center p-3 rounded-md transition-colors`}
                  >
                    <IconComponent size={24} />
                    <span className="mt-1 text-xs">{account.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
        
        {/* 其他选项 */}
        <div className="mt-8 text-center text-sm">
          <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
            忘记密码?
          </Link>
          <span className="mx-2 text-slate-300">|</span>
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
            注册新账户
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