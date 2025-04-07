'use client';

import React, { useState } from 'react';
import { mockTheaters } from '@/app/lib/mockData';
import { Plus, Monitor, Layout, Settings, X, Grid, Save } from 'lucide-react';

export default function TheatersManagementPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSeatLayoutModal, setShowSeatLayoutModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [currentTheater, setCurrentTheater] = useState<any>(null);
  const [seatLayout, setSeatLayout] = useState<Array<Array<string>>>([]);
  
  // 生成座位布局图
  const generateSeatLayout = (theater: any) => {
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
  
  const handleViewSeatLayout = (theater: any) => {
    setCurrentTheater(theater);
    setSeatLayout(generateSeatLayout(theater));
    setShowSeatLayoutModal(true);
  };
  
  const handleManageEquipment = (theater: any) => {
    setCurrentTheater(theater);
    setShowEquipmentModal(true);
  };
  
  const toggleSeatType = (rowIndex: number, colIndex: number) => {
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
      
      {/* 影厅列表 */}
      <div className="grid gap-4">
        {mockTheaters.map((theater) => (
          <div key={theater.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Monitor size={18} className="text-indigo-600 mr-2" />
                  <h3 className="font-medium text-lg">{theater.name}</h3>
                </div>
                <button className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                  编辑
                </button>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <Layout size={16} className="text-gray-500 mr-2" />
                  <span className="text-gray-700">{theater.rows} 排 × {theater.columns} 列</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                  <span className="text-gray-700">总座位: {theater.totalSeats}</span>
                </div>
              </div>
              
              {/* 设备列表 */}
              <div className="mt-3">
                <div className="flex items-center mb-2">
                  <Settings size={14} className="text-gray-500 mr-1" />
                  <span className="text-sm text-gray-700">设备</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {theater.equipment.map((equipment, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {equipment}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 管理按钮 */}
              <div className="mt-4 flex gap-2">
                <button 
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md text-sm"
                  onClick={() => handleViewSeatLayout(theater)}
                >
                  座位布局
                </button>
                <button 
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md text-sm"
                  onClick={() => handleManageEquipment(theater)}
                >
                  设备管理
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 新增影厅模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
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
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">影厅名称</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="例如：1号厅 - IMAX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">排数</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="10" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">列数</label>
                    <input type="number" className="w-full p-2 border rounded-md" placeholder="12" min="1" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备（逗号分隔）</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="IMAX, 杜比全景声" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <div className="mb-4 text-sm text-gray-500">
                点击座位可以更改座位类型，座位将在以下几种类型中循环：普通座位 → VIP座位 → 情侣座 → 无障碍座位 → 空位
              </div>
              
              {/* 座位图例 */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-200 rounded-md mr-1"></div>
                  <span className="text-sm">普通座位</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-indigo-200 rounded-md mr-1"></div>
                  <span className="text-sm">VIP座位</span>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-6 bg-pink-200 rounded-md mr-1"></div>
                  <span className="text-sm">情侣座</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-200 rounded-md mr-1"></div>
                  <span className="text-sm">无障碍座位</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 border border-dashed border-gray-300 rounded-md mr-1"></div>
                  <span className="text-sm">空位</span>
                </div>
              </div>
              
              {/* 银幕 */}
              <div className="w-full h-8 bg-gray-300 mb-8 rounded flex items-center justify-center text-sm text-gray-700">
                银幕
              </div>
              
              {/* 座位布局 */}
              <div className="mb-8 overflow-x-auto">
                <div className="grid gap-2 justify-center" style={{ gridTemplateColumns: `repeat(${currentTheater.columns}, minmax(0, 1fr))` }}>
                  {seatLayout.map((row, rowIndex) => (
                    row.map((seatType, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-6 h-6 rounded-md ${
                          seatType === 'normal' ? 'bg-gray-200' :
                          seatType === 'vip' ? 'bg-indigo-200' :
                          seatType === 'couple' ? 'bg-pink-200' :
                          seatType === 'disabled' ? 'bg-blue-200' :
                          'border border-dashed border-gray-300'
                        } cursor-pointer flex items-center justify-center text-xs`}
                        onClick={() => toggleSeatType(rowIndex, colIndex)}
                      >
                        {rowIndex + 1}-{colIndex + 1}
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md">
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
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">当前设备</label>
                <div className="space-y-2">
                  {currentTheater.equipment.map((equipment: string, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>{equipment}</span>
                      <button className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">添加设备</label>
                <div className="flex">
                  <input type="text" className="flex-1 p-2 border rounded-l-md" placeholder="输入设备名称" />
                  <button className="bg-indigo-600 text-white px-3 py-2 rounded-r-md">
                    添加
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                  onClick={() => setShowEquipmentModal(false)}
                >
                  取消
                </button>
                <button 
                  type="button"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
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