'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Bell, Moon, Globe, Shield, LogOut, ChevronRight, Users, DollarSign, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/lib/context/AppContext';
import { useRouter } from 'next/navigation';
import { UserService } from '@/app/lib/services/userService';
import { AuthService } from '@/app/lib/services/authService';

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { darkMode, toggleDarkMode, currentUser, logout } = useAppContext(); 
  const [language, setLanguage] = useState('中文');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 处理退出登录
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="p-4 text-center">加载中...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Settings size={24} className="text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold">系统设置</h1>
      </div>
      
      {/* 账户信息 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium mb-4">账户信息</h2>
        <div className="flex items-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl font-medium text-gray-600">{currentUser.name[0]}</span>
          </div>
          <div>
            <h3 className="font-medium">{currentUser.name}</h3>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
            <p className="text-xs text-gray-400 mt-1">管理员账户</p>
          </div>
        </div>
      </div>
      
      {/* 管理功能入口 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium mb-4">系统管理</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/staff" className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-600 p-4 rounded-lg">
            <Users size={24} className="mb-2" />
            <span className="text-sm">员工管理</span>
          </Link>
          
          <Link href="/admin/stats" className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 p-4 rounded-lg">
            <BarChart2 size={24} className="mb-2" />
            <span className="text-sm">数据统计</span>
          </Link>
          
          <Link href="/admin/pricing" className="flex flex-col items-center justify-center bg-green-50 text-green-600 p-4 rounded-lg">
            <DollarSign size={24} className="mb-2" />
            <span className="text-sm">票价设置</span>
          </Link>
          
          <Link href="/admin/theaters" className="flex flex-col items-center justify-center bg-amber-50 text-amber-600 p-4 rounded-lg">
            <Settings size={24} className="mb-2" />
            <span className="text-sm">影厅配置</span>
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium mb-4">应用设置</h2>
        
        <div className="space-y-4">
          {/* 通知设置 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell size={18} className="text-gray-500 mr-3" />
              <span>通知提醒</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          {/* 深色模式 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Moon size={18} className="text-gray-500 mr-3" />
              <span>深色模式</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          {/* 语言设置 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe size={18} className="text-gray-500 mr-3" />
              <span>语言</span>
            </div>
            <div className="flex items-center text-gray-500">
              <span className="mr-2">{language}</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* 系统安全 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium mb-4">系统安全</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <Shield size={18} className="text-gray-500 mr-3" />
              <span>修改密码</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>隐私设置</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* 系统信息 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-medium mb-2">系统信息</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p>版本：v1.0.0</p>
          <p>构建时间：2025-05-01</p>
        </div>
      </div>
      
      {/* 退出登录 */}
      <button 
        className="w-full bg-red-50 text-red-600 rounded-lg p-4 flex items-center justify-center"
        onClick={handleLogout}
        disabled={isLoading}
      >
        <LogOut size={18} className="mr-2" />
        <span>{isLoading ? '退出中...' : '退出登录'}</span>
      </button>
    </div>
  );
} 