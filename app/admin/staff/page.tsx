'use client';

import React, { useState } from 'react';
import { mockUsers } from '@/app/lib/mockData';
import { UserRole } from '@/app/lib/types';
import { Plus, Check, X, UserRound, CalendarDays, Edit, Ban, Calendar } from 'lucide-react';

export default function StaffManagementPage() {
  const [staffFilter, setStaffFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 筛选管理员和售票员
  const staffList = mockUsers.filter(user => {
    if (staffFilter === 'all') return user.role !== UserRole.CUSTOMER;
    if (staffFilter === 'admin') return user.role === UserRole.ADMIN;
    if (staffFilter === 'staff') return user.role === UserRole.STAFF;
    return false;
  });

  // 处理打开编辑模态框
  const handleEditStaff = (staff: any) => {
    setCurrentStaff(staff);
    setShowEditModal(true);
  };

  // 处理排班管理
  const handleScheduleManagement = (staff: any) => {
    setCurrentStaff(staff);
    setShowScheduleModal(true);
  };

  // 处理停用账号
  const handleDisableAccount = (staff: any) => {
    setCurrentStaff(staff);
    setConfirmDisable(true);
  };

  // 处理保存成功
  const handleSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">员工管理</h1>
        <button 
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-1" /> 新增员工
        </button>
      </div>
      
      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center z-50">
          <Check size={16} className="mr-2" />
          操作成功
        </div>
      )}
      
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
              <button 
                className="flex-1 bg-indigo-100 text-indigo-700 py-2 rounded-md text-sm flex items-center justify-center"
                onClick={() => handleEditStaff(staff)}
              >
                <Edit size={14} className="mr-1" /> 编辑信息
              </button>
              {staff.role === UserRole.STAFF && (
                <button 
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md text-sm flex items-center justify-center"
                  onClick={() => handleScheduleManagement(staff)}
                >
                  <Calendar size={14} className="mr-1" /> 排班管理
                </button>
              )}
              <button 
                className="flex-1 bg-red-100 text-red-700 py-2 rounded-md text-sm flex items-center justify-center"
                onClick={() => handleDisableAccount(staff)}
              >
                <Ban size={14} className="mr-1" /> 停用账号
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* 新增员工模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增员工</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="请输入员工姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input type="email" className="w-full p-2 border rounded-md" placeholder="请输入员工邮箱" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input type="tel" className="w-full p-2 border rounded-md" placeholder="请输入员工手机号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="staff">售票员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                  <input type="password" className="w-full p-2 border rounded-md" placeholder="请设置初始密码" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowAddModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
                    onClick={() => {
                      setShowAddModal(false);
                      handleSaveSuccess();
                    }}
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑员工模态框 */}
      {showEditModal && currentStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">编辑员工信息</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    defaultValue={currentStaff.name} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded-md" 
                    defaultValue={currentStaff.email} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input 
                    type="tel" 
                    className="w-full p-2 border rounded-md" 
                    defaultValue={currentStaff.phone || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    defaultValue={currentStaff.role === UserRole.ADMIN ? 'admin' : 'staff'}
                  >
                    <option value="staff">售票员</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowEditModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
                    onClick={() => {
                      setShowEditModal(false);
                      handleSaveSuccess();
                    }}
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 确认停用账号模态框 */}
      {confirmDisable && currentStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-medium text-lg">确认停用账号</h3>
            </div>
            <div className="p-4">
              <p className="mb-4">您确定要停用 <span className="font-medium">{currentStaff.name}</span> 的账号吗？停用后该员工将无法登录系统。</p>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                  onClick={() => setConfirmDisable(false)}
                >
                  取消
                </button>
                <button 
                  type="button"
                  className="flex-1 bg-red-600 text-white py-2 rounded-md"
                  onClick={() => {
                    setConfirmDisable(false);
                    handleSaveSuccess();
                  }}
                >
                  确认停用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 排班管理模态框 */}
      {showScheduleModal && currentStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">{currentStaff.name} - 排班管理</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">本周排班</h4>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
                
                {/* 排班表格 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">班次</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作时间</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.from({ length: 7 }).map((_, index) => {
                        const date = new Date();
                        date.setDate(date.getDate() + index);
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {date.toLocaleDateString()} ({['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index % 3 === 0 ? '早班' : index % 3 === 1 ? '中班' : '晚班'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index % 3 === 0 ? '09:00 - 13:00' : index % 3 === 1 ? '13:00 - 18:00' : '18:00 - 22:00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2">
                                <option value="scheduled">已排班</option>
                                <option value="unscheduled">取消排班</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  onClick={() => setShowScheduleModal(false)}
                >
                  取消
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                  onClick={() => {
                    setShowScheduleModal(false);
                    handleSaveSuccess();
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 