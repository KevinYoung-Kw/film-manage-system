'use client';

import React, { useState } from 'react';
import { mockMovies, mockTheaters } from '@/app/lib/mockData';
import { TicketType } from '@/app/lib/types';
import { Plus, X, DollarSign, Calendar, Clock, Film, Tag } from 'lucide-react';

export default function PricingManagementPage() {
  const [showAddTicketTypeModal, setShowAddTicketTypeModal] = useState(false);
  const [showAddPricingStrategyModal, setShowAddPricingStrategyModal] = useState(false);
  const [showEditTicketTypeModal, setShowEditTicketTypeModal] = useState(false);
  const [showEditPricingStrategyModal, setShowEditPricingStrategyModal] = useState(false);
  const [currentTicketType, setCurrentTicketType] = useState<any>(null);
  const [currentPricingStrategy, setCurrentPricingStrategy] = useState<any>(null);
  
  // 模拟票价类型数据
  const [ticketTypes, setTicketTypes] = useState([
    { id: 'type1', name: '普通票', basePrice: 80, description: '标准票价' },
    { id: 'type2', name: '学生票', basePrice: 40, description: '持学生证可享受优惠' },
    { id: 'type3', name: '老人票', basePrice: 40, description: '65岁以上老人优惠票价' },
    { id: 'type4', name: '儿童票', basePrice: 40, description: '12岁以下儿童优惠票价' },
    { id: 'type5', name: 'VIP票', basePrice: 100, description: 'VIP会员专享票价' }
  ]);
  
  // 模拟票价策略数据
  const [pricingStrategies, setPricingStrategies] = useState([
    { 
      id: 'strategy1',
      name: '工作日优惠',
      description: '周一至周五非节假日',
      condition: 'weekday',
      discount: 10,
      applyToTicketTypes: ['type1', 'type2']
    },
    { 
      id: 'strategy2',
      name: '早场优惠',
      description: '12:00前开始的场次',
      condition: 'before-noon',
      discount: 20,
      applyToTicketTypes: ['type1', 'type2', 'type3', 'type4']
    },
    { 
      id: 'strategy3',
      name: '深夜场折扣',
      description: '22:00后开始的场次',
      condition: 'late-night',
      discount: 15,
      applyToTicketTypes: ['type1', 'type5']
    },
    { 
      id: 'strategy4',
      name: '3D电影附加费',
      description: '3D电影需额外收费',
      condition: '3d-movie',
      extraCharge: 10,
      applyToTicketTypes: ['type1', 'type2', 'type3', 'type4', 'type5']
    }
  ]);
  
  // 处理编辑票价类型
  const handleEditTicketType = (type: any) => {
    setCurrentTicketType(type);
    setShowEditTicketTypeModal(true);
  };
  
  // 处理编辑票价策略
  const handleEditPricingStrategy = (strategy: any) => {
    setCurrentPricingStrategy(strategy);
    setShowEditPricingStrategyModal(true);
  };
  
  // 处理删除票价类型
  const handleDeleteTicketType = (typeId: string) => {
    setTicketTypes(prevTypes => prevTypes.filter(type => type.id !== typeId));
  };
  
  // 处理删除票价策略
  const handleDeletePricingStrategy = (strategyId: string) => {
    setPricingStrategies(prevStrategies => prevStrategies.filter(strategy => strategy.id !== strategyId));
  };
  
  // 获取策略应用的票价类型
  const getAppliedTicketTypeNames = (typeIds: string[]) => {
    return typeIds.map(typeId => {
      const ticket = ticketTypes.find(t => t.id === typeId);
      return ticket ? ticket.name : '';
    }).filter(Boolean).join(', ');
  };

  // 保存编辑后的票价类型
  const saveEditedTicketType = (editedType: any) => {
    setTicketTypes(prevTypes => 
      prevTypes.map(type => 
        type.id === editedType.id ? editedType : type
      )
    );
    setShowEditTicketTypeModal(false);
  };

  // 保存编辑后的票价策略
  const saveEditedPricingStrategy = (editedStrategy: any) => {
    setPricingStrategies(prevStrategies => 
      prevStrategies.map(strategy => 
        strategy.id === editedStrategy.id ? editedStrategy : strategy
      )
    );
    setShowEditPricingStrategyModal(false);
  };

  return (
    <div className="p-4">
      {/* 票价类型管理 */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">票价类型</h2>
          <button 
            className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
            onClick={() => setShowAddTicketTypeModal(true)}
          >
            <Plus size={16} className="mr-1" /> 新增
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          {ticketTypes.map((type) => (
            <div key={type.id} className="border-b last:border-b-0 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-1">
                    <Tag size={16} className="text-indigo-600 mr-2" />
                    <h3 className="font-medium">{type.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                  <div className="flex items-center text-sm">
                    <DollarSign size={14} className="text-gray-500 mr-1" />
                    <span className="font-medium text-amber-600">{type.basePrice} 元</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                    onClick={() => handleEditTicketType(type)}
                  >
                    编辑
                  </button>
                  <button 
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    onClick={() => handleDeleteTicketType(type.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 票价策略管理 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">票价策略</h2>
          <button 
            className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
            onClick={() => setShowAddPricingStrategyModal(true)}
          >
            <Plus size={16} className="mr-1" /> 新增
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          {pricingStrategies.map((strategy) => (
            <div key={strategy.id} className="border-b last:border-b-0 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-1">
                    <DollarSign size={16} className="text-indigo-600 mr-2" />
                    <h3 className="font-medium">{strategy.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                  
                  {strategy.discount && (
                    <div className="flex items-center text-sm mb-1">
                      <Clock size={14} className="text-gray-500 mr-1" />
                      <span className="text-green-600">折扣: {strategy.discount}%</span>
                    </div>
                  )}
                  
                  {strategy.extraCharge && (
                    <div className="flex items-center text-sm mb-1">
                      <Clock size={14} className="text-gray-500 mr-1" />
                      <span className="text-amber-600">附加费: +{strategy.extraCharge}元</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <span>适用于：{getAppliedTicketTypeNames(strategy.applyToTicketTypes)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                    onClick={() => handleEditPricingStrategy(strategy)}
                  >
                    编辑
                  </button>
                  <button 
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    onClick={() => handleDeletePricingStrategy(strategy.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* 添加票价类型模态框 */}
      {showAddTicketTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增票价类型</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddTicketTypeModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">票价类型名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：学生票、情侣票" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基础票价</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-2 top-2.5 text-gray-400" />
                    <input 
                      type="number" 
                      className="w-full pl-8 p-2 border rounded-md" 
                      placeholder="输入基础票价"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="描述该票价类型的使用条件等"
                  ></textarea>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowAddTicketTypeModal(false)}
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
      
      {/* 编辑票价类型模态框 */}
      {showEditTicketTypeModal && currentTicketType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">编辑票价类型</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditTicketTypeModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">票价类型名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    defaultValue={currentTicketType.name}
                    onChange={(e) => setCurrentTicketType({...currentTicketType, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基础票价</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-2 top-2.5 text-gray-400" />
                    <input 
                      type="number" 
                      className="w-full pl-8 p-2 border rounded-md" 
                      defaultValue={currentTicketType.basePrice}
                      onChange={(e) => setCurrentTicketType({...currentTicketType, basePrice: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    defaultValue={currentTicketType.description}
                    onChange={(e) => setCurrentTicketType({...currentTicketType, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowEditTicketTypeModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
                    onClick={() => saveEditedTicketType(currentTicketType)}
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* 添加票价策略模态框 */}
      {showAddPricingStrategyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增票价策略</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddPricingStrategyModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：工作日优惠" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略描述</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：周一至周五非节假日" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略条件</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">选择应用条件</option>
                    <option value="weekday">工作日</option>
                    <option value="weekend">周末</option>
                    <option value="holiday">节假日</option>
                    <option value="before-noon">早场 (12:00前)</option>
                    <option value="afternoon">下午场 (12:00-18:00)</option>
                    <option value="evening">晚场 (18:00-22:00)</option>
                    <option value="late-night">深夜场 (22:00后)</option>
                    <option value="3d-movie">3D电影</option>
                    <option value="imax-movie">IMAX电影</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣百分比</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-md" 
                        placeholder="例如：10%" 
                      />
                      <span className="absolute right-3 top-2">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">附加费用</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-2 top-2.5 text-gray-400" />
                      <input 
                        type="number" 
                        className="w-full pl-8 p-2 border rounded-md" 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适用票价类型</label>
                  <div className="p-3 border rounded-md space-y-2">
                    {ticketTypes.map(type => (
                      <div key={type.id} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`type-${type.id}`}
                          className="mr-2" 
                        />
                        <label htmlFor={`type-${type.id}`} className="text-sm">{type.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowAddPricingStrategyModal(false)}
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
      
      {/* 编辑票价策略模态框 */}
      {showEditPricingStrategyModal && currentPricingStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">编辑票价策略</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditPricingStrategyModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    defaultValue={currentPricingStrategy.name}
                    onChange={(e) => setCurrentPricingStrategy({...currentPricingStrategy, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略描述</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    defaultValue={currentPricingStrategy.description}
                    onChange={(e) => setCurrentPricingStrategy({...currentPricingStrategy, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略条件</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    defaultValue={currentPricingStrategy.condition}
                    onChange={(e) => setCurrentPricingStrategy({...currentPricingStrategy, condition: e.target.value})}
                  >
                    <option value="">选择应用条件</option>
                    <option value="weekday">工作日</option>
                    <option value="weekend">周末</option>
                    <option value="holiday">节假日</option>
                    <option value="before-noon">早场 (12:00前)</option>
                    <option value="afternoon">下午场 (12:00-18:00)</option>
                    <option value="evening">晚场 (18:00-22:00)</option>
                    <option value="late-night">深夜场 (22:00后)</option>
                    <option value="3d-movie">3D电影</option>
                    <option value="imax-movie">IMAX电影</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣百分比</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-md" 
                        defaultValue={currentPricingStrategy.discount || ''}
                        onChange={(e) => setCurrentPricingStrategy({
                          ...currentPricingStrategy, 
                          discount: e.target.value ? Number(e.target.value) : undefined
                        })}
                      />
                      <span className="absolute right-3 top-2">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">附加费用</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-2 top-2.5 text-gray-400" />
                      <input 
                        type="number" 
                        className="w-full pl-8 p-2 border rounded-md" 
                        defaultValue={currentPricingStrategy.extraCharge || ''}
                        onChange={(e) => setCurrentPricingStrategy({
                          ...currentPricingStrategy, 
                          extraCharge: e.target.value ? Number(e.target.value) : undefined
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适用票价类型</label>
                  <div className="p-3 border rounded-md space-y-2">
                    {ticketTypes.map(type => {
                      const isChecked = currentPricingStrategy.applyToTicketTypes.includes(type.id);
                      return (
                        <div key={type.id} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`edit-type-${type.id}`}
                            className="mr-2"
                            defaultChecked={isChecked}
                            onChange={(e) => {
                              const newApplyTypes = e.target.checked 
                                ? [...currentPricingStrategy.applyToTicketTypes, type.id]
                                : currentPricingStrategy.applyToTicketTypes.filter((id: string) => id !== type.id);
                              setCurrentPricingStrategy({
                                ...currentPricingStrategy,
                                applyToTicketTypes: newApplyTypes
                              });
                            }}
                          />
                          <label htmlFor={`edit-type-${type.id}`} className="text-sm">{type.name}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowEditPricingStrategyModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md"
                    onClick={() => saveEditedPricingStrategy(currentPricingStrategy)}
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 