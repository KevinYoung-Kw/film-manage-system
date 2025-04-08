'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Monitor, Layout, Settings, X, Grid, Save, Check, Wand2 } from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';
import { Theater } from '@/app/lib/types';
import { TheaterService } from '@/app/lib/services/dataService';

export default function TheatersManagementPage() {
  const { theaters, updateTheater, updateTheaterLayout, addTheater } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSeatLayoutModal, setShowSeatLayoutModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [currentTheater, setCurrentTheater] = useState<Theater | null>(null);
  const [seatLayout, setSeatLayout] = useState<Array<Array<string>>>([]);
  const [editMode, setEditMode] = useState<'single' | 'batch'>('single');
  const [selectedSeatType, setSelectedSeatType] = useState<string>('normal');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [equipments, setEquipments] = useState<Array<any>>([]);
  const [showEquipmentDetailModal, setShowEquipmentDetailModal] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<any>(null);
  
  // 新影厅表单数据
  const [newTheater, setNewTheater] = useState({
    name: '',
    rows: 8,
    columns: 10,
    equipment: ''
  });
  
  // 处理新影厅表单变化
  const handleNewTheaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTheater({
      ...newTheater,
      [name]: name === 'rows' || name === 'columns' ? parseInt(value) || 0 : value
    });
  };
  
  // 保存新影厅
  const handleSaveNewTheater = async () => {
    if (!newTheater.name) {
      alert('请输入影厅名称');
      return;
    }
    
    if (newTheater.rows <= 0 || newTheater.columns <= 0) {
      alert('排数和座位数必须大于0');
      return;
    }
    
    // 处理设备输入，以逗号分隔
    const equipmentList = newTheater.equipment
      ? newTheater.equipment.split(',').map(item => item.trim()).filter(Boolean)
      : [];
    
    try {
      // 调用 AppContext 方法添加影厅
      await addTheater({
        name: newTheater.name,
        rows: newTheater.rows,
        columns: newTheater.columns,
        totalSeats: newTheater.rows * newTheater.columns, // 计算总座位数
        equipment: equipmentList
      });
      
      // 重置表单并关闭模态框
      setNewTheater({
        name: '',
        rows: 8,
        columns: 10,
        equipment: ''
      });
      
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setShowAddModal(false);
      }, 1500);
    } catch (error) {
      console.error('添加影厅失败:', error);
    }
  };
  
  // 座位类型配置
  const seatTypes = [
    { id: 'normal', label: '普通座位', color: 'bg-gray-200' },
    { id: 'vip', label: 'VIP座位', color: 'bg-indigo-200' },
    { id: 'couple', label: '情侣座', color: 'bg-pink-200' },
    { id: 'disabled', label: '无障碍座位', color: 'bg-blue-200' },
    { id: 'empty', label: '空位', color: 'border border-dashed border-gray-300' }
  ];
  
  // 生成座位布局图
  const generateSeatLayout = (theater: Theater) => {
    const layout: Array<Array<string>> = [];
    
    for (let row = 0; row < theater.rows; row++) {
      const rowSeats: string[] = [];
      for (let col = 0; col < theater.columns; col++) {
        // 简单逻辑：边角座位设为走道，中间为普通座位
        if ((row === 0 && col === 0) || (row === theater.rows - 1 && col === theater.columns - 1)) {
          rowSeats.push('empty');
        } else if (row === Math.floor(theater.rows / 2)) {
          rowSeats.push('vip');
        } else {
          rowSeats.push('normal');
        }
      }
      layout.push(rowSeats);
    }
    
    return layout;
  };
  
  const handleViewSeatLayout = async (theater: Theater) => {
    setCurrentTheater(theater);
    
    try {
      // 先尝试从服务层获取保存的座位布局
      const savedLayout = await TheaterService.getSeatLayoutTypes(theater.id);
      
      if (savedLayout && savedLayout.length > 0) {
        // 使用已保存的布局
        setSeatLayout(savedLayout);
      } else {
        // 没有保存过布局，使用生成的默认布局
        setSeatLayout(generateSeatLayout(theater));
      }
      
      setShowSeatLayoutModal(true);
    } catch (error) {
      console.error('获取座位布局失败:', error);
      // 出错时使用默认生成的布局
      setSeatLayout(generateSeatLayout(theater));
      setShowSeatLayoutModal(true);
    }
  };
  
  const handleManageEquipment = (theater: Theater) => {
    setCurrentTheater(theater);
    
    // 转换设备数据格式
    const equipmentList = theater.equipment.map((name: string, index: number) => ({
      id: index + 1,
      name,
      model: `型号-${Math.floor(Math.random() * 1000)}`,
      status: Math.random() > 0.2 ? '正常' : '需维修',
      lastMaintenance: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0], // 随机生成过去的维护日期
      nextMaintenance: new Date(Date.now() + Math.random() * 10000000000).toISOString().split('T')[0], // 随机生成将来的维护日期
      description: `${name}设备描述信息`
    }));
    
    setEquipments(equipmentList);
    setShowEquipmentModal(true);
  };
  
  // 处理显示设备详情
  const handleShowEquipmentDetail = (equipment: any) => {
    setCurrentEquipment(equipment);
    setShowEquipmentDetailModal(true);
  };
  
  // 处理添加新设备
  const handleAddEquipment = () => {
    const newEquipment = {
      id: equipments.length + 1,
      name: '',
      model: '',
      status: '正常',
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + 7776000000).toISOString().split('T')[0], // 90天后
      description: ''
    };
    
    setEquipments([...equipments, newEquipment]);
  };
  
  // 处理删除设备
  const handleRemoveEquipment = (id: number) => {
    setEquipments(equipments.filter(equipment => equipment.id !== id));
  };
  
  // 处理设备状态更改
  const handleEquipmentStatusChange = (id: number, newStatus: string) => {
    setEquipments(equipments.map(equipment => 
      equipment.id === id ? {...equipment, status: newStatus} : equipment
    ));
  };
  
  // 保存设备信息
  const handleSaveEquipment = async () => {
    if (!currentTheater) return;
    
    // 提取设备名称
    const equipmentNames = equipments.map(equipment => equipment.name).filter(Boolean);
    
    // 使用 updateTheater 更新影厅设备信息
    try {
      await updateTheater(currentTheater.id, {
        equipment: equipmentNames
      });
      
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setShowEquipmentModal(false);
      }, 1500);
    } catch (error) {
      console.error('保存设备信息失败:', error);
    }
  };
  
  // 处理单个座位类型切换
  const toggleSeatType = (rowIndex: number, colIndex: number) => {
    if (editMode === 'batch') {
      // 批量编辑模式下，设置为选中的类型
      const newLayout = [...seatLayout];
      newLayout[rowIndex][colIndex] = selectedSeatType;
      setSeatLayout(newLayout);
      return;
    }
    
    // 单个编辑模式下，循环切换座位类型
    const newLayout = [...seatLayout];
    const currentType = newLayout[rowIndex][colIndex];
    let newType: string;
    
    // 循环切换座位类型：normal -> vip -> couple -> disabled -> empty -> normal
    switch (currentType) {
      case 'normal': newType = 'vip'; break;
      case 'vip': newType = 'couple'; break;
      case 'couple': newType = 'disabled'; break;
      case 'disabled': newType = 'empty'; break;
      case 'empty': newType = 'normal'; break;
      default: newType = 'normal';
    }
    
    newLayout[rowIndex][colIndex] = newType;
    setSeatLayout(newLayout);
  };
  
  // 鼠标按下事件处理
  const handleMouseDown = (rowIndex: number, colIndex: number) => {
    if (editMode !== 'batch') return;
    
    setIsDrawing(true);
    toggleSeatType(rowIndex, colIndex);
  };
  
  // 鼠标移动事件处理
  const handleMouseOver = (rowIndex: number, colIndex: number) => {
    if (!isDrawing || editMode !== 'batch') return;
    
    toggleSeatType(rowIndex, colIndex);
  };
  
  // 鼠标松开事件处理
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  // 批量设置座位
  const handleBatchUpdate = (type: string) => {
    const newLayout = seatLayout.map(row => 
      row.map(() => type)
    );
    setSeatLayout(newLayout);
  };
  
  // 保存座位布局
  const handleSaveSeatLayout = async () => {
    if (!currentTheater) return;
    
    // 计算座位总数（不包括空位）
    let totalSeats = 0;
    seatLayout.forEach(row => {
      row.forEach(type => {
        if (type !== 'empty') totalSeats++;
      });
    });
    
    try {
      // 先更新行列数
      await updateTheaterLayout(currentTheater.id, seatLayout.length, seatLayout[0]?.length || 0);
      
      // 然后调用服务层方法保存详细的座位布局信息
      await TheaterService.updateSeatLayoutTypes(currentTheater.id, seatLayout);
      
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSeatLayoutModal(false);
      }, 1500);
    } catch (error) {
      console.error('保存座位布局失败:', error);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">影厅管理</h1>
        <button 
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-1" /> 新增
        </button>
      </div>
      
      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center z-50">
          <Check size={16} className="mr-2" />
          保存成功
        </div>
      )}
      
      {/* 影厅列表 */}
      <div className="grid gap-4">
        {theaters.map(theater => (
          <div key={theater.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg">{theater.name}</h3>
                <div className="flex space-x-2">
                  <button 
                    className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center"
                    onClick={() => handleViewSeatLayout(theater)}
                  >
                    <Layout size={16} className="mr-1" />
                    <span className="text-xs">座位布局</span>
                  </button>
                  <button 
                    className="p-1 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 flex items-center"
                    onClick={() => handleManageEquipment(theater)}
                  >
                    <Monitor size={16} className="mr-1" />
                    <span className="text-xs">设备管理</span>
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex justify-between text-gray-500 mb-1">
                  <span>总座位数: {theater.totalSeats}</span>
                  <span>{theater.rows} 排 × {theater.columns} 列</span>
                </div>
                <div className="flex items-center mt-2">
                  <Settings size={14} className="text-gray-400 mr-2" />
                  <div className="flex flex-wrap gap-1">
                    {theater.equipment.map((equipment, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 新增影厅模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增影厅</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveNewTheater(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">影厅名称</label>
                  <input 
                    type="text" 
                    name="name"
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如: 1号厅 - IMAX" 
                    value={newTheater.name}
                    onChange={handleNewTheaterChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">排数</label>
                  <input 
                    type="number" 
                    name="rows"
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如: 10" 
                    value={newTheater.rows}
                    onChange={handleNewTheaterChange}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">每排座位数</label>
                  <input 
                    type="number" 
                    name="columns"
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如: 12" 
                    value={newTheater.columns}
                    onChange={handleNewTheaterChange}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备</label>
                  <input 
                    type="text" 
                    name="equipment"
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如: IMAX, 杜比全景声 (用逗号分隔)" 
                    value={newTheater.equipment}
                    onChange={handleNewTheaterChange}
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
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 座位布局模态框 */}
      {showSeatLayoutModal && currentTheater && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
             onMouseUp={handleMouseUp}>
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">{currentTheater.name} - 座位布局</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowSeatLayoutModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* 编辑模式切换 */}
              <div className="mb-4 flex justify-between items-center border-b pb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">编辑模式:</span>
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${editMode === 'single' ? 'bg-white shadow' : 'text-gray-600'}`}
                      onClick={() => setEditMode('single')}
                    >
                      单个编辑
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${editMode === 'batch' ? 'bg-white shadow' : 'text-gray-600'}`}
                      onClick={() => setEditMode('batch')}
                    >
                      批量编辑
                    </button>
                  </div>
                </div>
                
                {/* 批量操作按钮 */}
                <div className="flex space-x-2">
                  <button 
                    className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center text-xs"
                    onClick={() => handleBatchUpdate('normal')}
                  >
                    <Wand2 size={14} className="mr-1" /> 全部普通
                  </button>
                  <button 
                    className="p-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 flex items-center text-xs"
                    onClick={() => handleBatchUpdate('empty')}
                  >
                    <Wand2 size={14} className="mr-1" /> 全部清空
                  </button>
                </div>
              </div>
              
              {/* 座位类型选择器 - 仅在批量编辑模式显示 */}
              {editMode === 'batch' && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium mb-2">选择座位类型:</div>
                  <div className="flex flex-wrap gap-2">
                    {seatTypes.map(type => (
                      <button
                        key={type.id}
                        className={`flex items-center px-3 py-1 rounded-md ${
                          selectedSeatType === type.id 
                            ? 'ring-2 ring-indigo-500 bg-white' 
                            : 'bg-white'
                        }`}
                        onClick={() => setSelectedSeatType(type.id)}
                      >
                        <div className={`w-4 h-4 rounded-sm mr-2 ${type.color}`}></div>
                        <span className="text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    提示: {editMode === 'batch' ? '选择座位类型后，点击或拖动鼠标来绘制座位' : '点击座位循环切换座位类型'}
                  </div>
                </div>
              )}
              
              {/* 座位图例 */}
              {editMode === 'single' && (
                <div className="mb-4 text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium mb-2">座位类型说明:</div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm bg-gray-200 mr-2"></div>
                      <span className="text-xs">普通座位</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm bg-indigo-200 mr-2"></div>
                      <span className="text-xs">VIP座位</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm bg-pink-200 mr-2"></div>
                      <span className="text-xs">情侣座</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm bg-blue-200 mr-2"></div>
                      <span className="text-xs">无障碍座位</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm border border-dashed border-gray-300 mr-2"></div>
                      <span className="text-xs">空位</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    提示: 点击座位可以循环切换座位类型
                  </div>
                </div>
              )}
              
              {/* 座位布局 */}
              <div className="mb-8 overflow-x-auto bg-gray-50 p-4 rounded-md">
                <div className="w-full h-6 bg-slate-200 rounded-md mb-6 flex items-center justify-center text-sm text-slate-600">
                  屏幕
                </div>
                <div className="grid gap-2 justify-center" style={{ gridTemplateColumns: `repeat(${currentTheater.columns}, minmax(0, 1fr))` }}>
                  {seatLayout.map((row, rowIndex) => (
                    row.map((seatType, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-8 h-8 rounded-md ${
                          seatType === 'normal' ? 'bg-gray-200' :
                          seatType === 'vip' ? 'bg-indigo-200' :
                          seatType === 'couple' ? 'bg-pink-200' :
                          seatType === 'disabled' ? 'bg-blue-200' :
                          'border border-dashed border-gray-300'
                        } cursor-pointer flex items-center justify-center text-xs select-none`}
                        onClick={() => toggleSeatType(rowIndex, colIndex)}
                        onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                        onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                      >
                        {rowIndex + 1}-{colIndex + 1}
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md"
                  onClick={handleSaveSeatLayout}
                >
                  <Save size={16} className="mr-2" /> 保存布局
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 设备管理模态框 */}
      {showEquipmentModal && currentTheater && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">{currentTheater.name} - 设备管理</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEquipmentModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h4 className="font-medium">设备列表</h4>
                <button 
                  className="flex items-center bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-sm"
                  onClick={handleAddEquipment}
                >
                  <Plus size={14} className="mr-1" /> 添加设备
                </button>
              </div>
              
              {/* 设备列表表格 */}
              <div className="overflow-x-auto bg-white rounded-lg shadow mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备名称</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上次维护</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下次维护</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipments.map((equipment) => (
                      <tr key={equipment.id}>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{equipment.model}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <select 
                            className={`text-xs rounded-full px-2 py-1 ${
                              equipment.status === '正常' ? 'bg-green-100 text-green-800' : 
                              equipment.status === '需维修' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}
                            value={equipment.status}
                            onChange={(e) => handleEquipmentStatusChange(equipment.id, e.target.value)}
                          >
                            <option value="正常">正常</option>
                            <option value="需维修">需维修</option>
                            <option value="维修中">维修中</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {equipment.lastMaintenance}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {equipment.nextMaintenance}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              onClick={() => handleShowEquipmentDetail(equipment)}
                            >
                              详情
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemoveEquipment(equipment.id)}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                  onClick={() => setShowEquipmentModal(false)}
                >
                  取消
                </button>
                <button 
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                  onClick={handleSaveEquipment}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 设备详情模态框 */}
      {showEquipmentDetailModal && currentEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">设备详情</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEquipmentDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={currentEquipment.name}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备型号</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={currentEquipment.model}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备状态</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={currentEquipment.status}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, status: e.target.value})}
                  >
                    <option value="正常">正常</option>
                    <option value="需维修">需维修</option>
                    <option value="维修中">维修中</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上次维护日期</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-md"
                    value={currentEquipment.lastMaintenance}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, lastMaintenance: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">下次维护日期</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-md"
                    value={currentEquipment.nextMaintenance}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, nextMaintenance: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备描述</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    value={currentEquipment.description}
                    onChange={(e) => setCurrentEquipment({...currentEquipment, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
                    onClick={() => setShowEquipmentDetailModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                    onClick={() => {
                      // 更新设备信息
                      setEquipments(equipments.map(equip => 
                        equip.id === currentEquipment.id ? currentEquipment : equip
                      ));
                      setShowEquipmentDetailModal(false);
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 