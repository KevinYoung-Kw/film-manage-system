'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, User, ShiftType } from '@/app/lib/types';
import { Plus, Check, X, UserRound, CalendarDays, Edit, Ban, Calendar } from 'lucide-react';
import { UserService } from '@/app/lib/services/userService';
import { ScheduleService } from '@/app/lib/services/scheduleService';

// 扩展接口用于编辑表单的状态
interface ExtendedUser extends User {
  phone?: string;
}

// 创建用户的参数
interface CreateUserParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

// 更新用户的参数
interface UpdateUserParams {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  isActive?: boolean;
}

export default function StaffManagementPage() {
  const [staffFilter, setStaffFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<User | null>(null);
  const [editedStaff, setEditedStaff] = useState<ExtendedUser | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStaffData, setNewStaffData] = useState<CreateUserParams>({
    name: '',
    email: '',
    phone: '',
    role: UserRole.STAFF,
    password: ''
  });
  
  // 加载员工数据
  const loadStaffData = async () => {
    setIsLoading(true);
    try {
      const users = await UserService.getAllUsers();
      setStaffList(users.filter(user => user.role !== UserRole.CUSTOMER));
    } catch (error) {
      console.error('加载员工数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadStaffData();
  }, []);

  // 筛选管理员和售票员
  const filteredStaffList = staffList.filter(user => {
    if (staffFilter === 'all') return user.role !== UserRole.CUSTOMER;
    if (staffFilter === 'admin') return user.role === UserRole.ADMIN;
    if (staffFilter === 'staff') return user.role === UserRole.STAFF;
    return false;
  });

  // 处理打开编辑模态框
  const handleEditStaff = (staff: User) => {
    setCurrentStaff(staff);
    // 创建一个扩展的用户对象，包含额外可能需要的字段
    setEditedStaff({...staff, phone: ''});
    setShowEditModal(true);
  };

  // 处理排班管理
  const handleScheduleManagement = (staff: User) => {
    setCurrentStaff(staff);
    setShowScheduleModal(true);
  };

  // 处理停用账号
  const handleDisableAccount = (staff: User) => {
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
  
  // 处理添加员工信息变化
  const handleNewStaffInputChange = (field: string, value: any) => {
    setNewStaffData({
      ...newStaffData,
      [field]: value
    });
  };
  
  // 处理编辑员工信息变化
  const handleEditStaffInputChange = (field: string, value: any) => {
    if (editedStaff) {
      setEditedStaff({
        ...editedStaff,
        [field]: value
      });
    }
  };
  
  // 处理添加员工
  const handleAddStaff = async () => {
    setIsLoading(true);
    try {
      await UserService.createUser({
        name: newStaffData.name,
        email: newStaffData.email,
        role: newStaffData.role,
        password: newStaffData.password
      });
      
      setShowAddModal(false);
      handleSaveSuccess();
      loadStaffData();
      
      // 重置表单
      setNewStaffData({
        name: '',
        email: '',
        phone: '',
        role: UserRole.STAFF,
        password: ''
      });
    } catch (error) {
      console.error('添加员工失败:', error);
      alert('添加员工失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理更新员工
  const handleUpdateStaff = async () => {
    if (!currentStaff || !editedStaff) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateUserParams = {
        name: editedStaff.name,
        email: editedStaff.email,
        role: editedStaff.role
      };
      
      // 如果有电话号码，添加到更新数据中
      if (editedStaff.phone) {
        updateData.phone = editedStaff.phone;
      }
      
      await UserService.updateUser(currentStaff.id, updateData);
      
      setShowEditModal(false);
      handleSaveSuccess();
      loadStaffData();
    } catch (error) {
      console.error('更新员工信息失败:', error);
      alert('更新员工信息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理停用员工账号
  const handleConfirmDisable = async () => {
    if (!currentStaff) return;
    
    setIsLoading(true);
    try {
      // 这里仅模拟了停用功能，实际可能需要设置用户状态
      const updateData: UpdateUserParams = {
        isActive: false
      };
      
      await UserService.updateUser(currentStaff.id, updateData);
      
      setConfirmDisable(false);
      handleSaveSuccess();
      loadStaffData();
    } catch (error) {
      console.error('停用账号失败:', error);
      alert('停用账号失败，请重试');
    } finally {
      setIsLoading(false);
    }
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
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      )}
      
      {/* 员工列表 */}
      {!isLoading && (
        <div className="grid gap-4">
          {filteredStaffList.length > 0 ? filteredStaffList.map((staff) => (
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
                <span>入职时间: {new Date(staff.createdAt).toLocaleDateString()}</span>
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
          )) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <p className="text-gray-500">没有找到符合条件的员工</p>
            </div>
          )}
        </div>
      )}
      
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="请输入员工姓名" 
                    value={newStaffData.name}
                    onChange={(e) => handleNewStaffInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="请输入员工邮箱" 
                    value={newStaffData.email}
                    onChange={(e) => handleNewStaffInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input 
                    type="tel" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="请输入员工手机号" 
                    value={newStaffData.phone}
                    onChange={(e) => handleNewStaffInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newStaffData.role}
                    onChange={(e) => handleNewStaffInputChange('role', e.target.value)}
                  >
                    <option value={UserRole.STAFF}>售票员</option>
                    <option value={UserRole.ADMIN}>管理员</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                  <input 
                    type="password" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="请设置初始密码" 
                    value={newStaffData.password}
                    onChange={(e) => handleNewStaffInputChange('password', e.target.value)}
                    required
                  />
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
                    onClick={handleAddStaff}
                    disabled={isLoading}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑员工模态框 */}
      {showEditModal && currentStaff && editedStaff && (
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedStaff.name}
                    onChange={(e) => handleEditStaffInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded-md" 
                    value={editedStaff.email}
                    onChange={(e) => handleEditStaffInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input 
                    type="tel" 
                    className="w-full p-2 border rounded-md" 
                    value={editedStaff.phone || ''}
                    onChange={(e) => handleEditStaffInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={editedStaff.role}
                    onChange={(e) => handleEditStaffInputChange('role', e.target.value)}
                  >
                    <option value={UserRole.STAFF}>售票员</option>
                    <option value={UserRole.ADMIN}>管理员</option>
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
                    onClick={handleUpdateStaff}
                    disabled={isLoading}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 停用账号确认框 */}
      {confirmDisable && currentStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-medium text-lg">确认停用账号</h3>
            </div>
            <div className="p-4">
              <p>您确定要停用 <strong>{currentStaff.name}</strong> ({currentStaff.email}) 的账号吗？此操作可能导致该用户无法登录系统。</p>
              <div className="flex gap-2 mt-6">
                <button 
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                  onClick={() => setConfirmDisable(false)}
                >
                  取消
                </button>
                <button 
                  className="flex-1 bg-red-600 text-white py-2 rounded-md"
                  onClick={handleConfirmDisable}
                  disabled={isLoading}
                >
                  {isLoading ? '处理中...' : '确认停用'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 排班管理模态框 */}
      {showScheduleModal && currentStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">{currentStaff.name} 的排班管理</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600">在这里可以管理员工的排班，设置特定日期的工作班次。</p>
              
              {/* 排班表单和列表可以在这里实现 */}
              {/* 这部分可以根据需要与 ScheduleService 集成 */}
              <div className="text-center py-8">
                <p className="text-gray-500">排班功能正在开发中...</p>
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md"
                  onClick={() => setShowScheduleModal(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 