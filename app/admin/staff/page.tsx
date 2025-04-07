'use client';

import React, { useState } from 'react';
import { mockUsers } from '@/app/lib/mockData';
import { UserRole } from '@/app/lib/types';
import { Plus, Check, X, UserRound, CalendarDays } from 'lucide-react';

export default function StaffManagementPage() {
  const [staffFilter, setStaffFilter] = useState<'all' | 'admin' | 'staff'>('all');
  
  // 筛选管理员和售票员
  const staffList = mockUsers.filter(user => {
    if (staffFilter === 'all') return user.role !== UserRole.CUSTOMER;
    if (staffFilter === 'admin') return user.role === UserRole.ADMIN;
    if (staffFilter === 'staff') return user.role === UserRole.STAFF;
    return false;
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">员工管理</h1>
        <button className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">
          <Plus size={16} className="mr-1" /> 新增员工
        </button>
      </div>
      
      {/* 筛选选项 */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setStaffFilter('all')}
          className={`py-2 px-3 rounded-md text-sm flex-1 ${
            staffFilter === 'all' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700'
          }`}
        >
          全部
        </button>
        <button 
          onClick={() => setStaffFilter('admin')}
          className={`py-2 px-3 rounded-md text-sm flex-1 ${
            staffFilter === 'admin' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700'
          }`}
        >
          管理员
        </button>
        <button 
          onClick={() => setStaffFilter('staff')}
          className={`py-2 px-3 rounded-md text-sm flex-1 ${
            staffFilter === 'staff' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700'
          }`}
        >
          售票员
        </button>
      </div>
      
      {/* 员工列表 */}
      <div className="grid gap-4">
        {staffList.map((staff) => (
          <div key={staff.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-3">
                  <UserRound size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">{staff.name}</h3>
                  <p className="text-sm text-gray-500">{staff.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                staff.role === UserRole.ADMIN 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {staff.role === UserRole.ADMIN ? '管理员' : '售票员'}
              </span>
            </div>
            
            <div className="flex items-center mt-3 text-sm text-gray-500">
              <CalendarDays size={14} className="mr-1" />
              <span>入职时间: {staff.createdAt.toLocaleDateString()}</span>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-indigo-100 text-indigo-700 py-2 rounded-md text-sm">
                编辑信息
              </button>
              <button className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md text-sm">
                排班管理
              </button>
              <button className="flex-1 bg-red-100 text-red-700 py-2 rounded-md text-sm">
                停用账号
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 