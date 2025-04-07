'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Film, Users, Settings, User, UserRound, Shield } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center max-w-md mx-auto p-4 bg-slate-50">
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
        <h1 className="text-3xl font-bold text-slate-800">电影票务系统</h1>
        <p className="text-slate-500 mt-4 mb-2">演示选择</p>
        <p className="text-xs text-slate-400 mb-8">请选择要演示的角色类型</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">用户（观众）</h2>
          <p className="text-sm text-slate-600 mb-3">浏览电影、购票、查看订单</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigateTo('/login')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <User size={18} />
              <span>登录界面</span>
            </button>
            <button 
              onClick={() => navigateTo('/user')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <UserRound size={18} />
              <span>直接进入</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">员工（售票员）</h2>
          <p className="text-sm text-slate-600 mb-3">售票、检票、订单管理</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigateTo('/login')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              <User size={18} />
              <span>登录界面</span>
            </button>
            <button 
              onClick={() => navigateTo('/staff')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Film size={18} />
              <span>直接进入</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">管理员</h2>
          <p className="text-sm text-slate-600 mb-3">电影管理、排片管理、影厅管理、员工管理、票价设置</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigateTo('/login')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
            >
              <User size={18} />
              <span>登录界面</span>
            </button>
            <button 
              onClick={() => navigateTo('/admin')}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Shield size={18} />
              <span>直接进入</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 mb-2">系统演示说明</p>
        <p className="text-xs text-slate-400">点击"登录界面"进入登录页面，点击"直接进入"跳过登录直接访问对应角色的界面</p>
      </div>
      
      <footer className="mt-12 text-center text-xs text-slate-500">
        <p>© 2025 电影票务系统. 保留所有权利。</p>
      </footer>
    </div>
  );
}
