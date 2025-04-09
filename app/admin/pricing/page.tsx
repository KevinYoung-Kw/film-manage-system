'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, DollarSign, Calendar, Clock, Film, Tag } from 'lucide-react';
import { PricingService, TicketTypeModel, PricingStrategyModel } from '@/app/lib/services/pricingService';

export default function PricingManagementPage() {
  const [showAddTicketTypeModal, setShowAddTicketTypeModal] = useState(false);
  const [showAddPricingStrategyModal, setShowAddPricingStrategyModal] = useState(false);
  const [showEditTicketTypeModal, setShowEditTicketTypeModal] = useState(false);
  const [showEditPricingStrategyModal, setShowEditPricingStrategyModal] = useState(false);
  const [currentTicketType, setCurrentTicketType] = useState<TicketTypeModel | null>(null);
  const [currentPricingStrategy, setCurrentPricingStrategy] = useState<PricingStrategyModel | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeModel[]>([]);
  const [pricingStrategies, setPricingStrategies] = useState<PricingStrategyModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newTicketType, setNewTicketType] = useState<Omit<TicketTypeModel, 'id'>>({
    name: '',
    basePrice: 0,
    description: '',
    isActive: true
  });
  const [newPricingStrategy, setNewPricingStrategy] = useState<Omit<PricingStrategyModel, 'id'>>({
    name: '',
    description: '',
    conditionType: 'weekday',
    conditionValue: null,
    discountPercentage: null,
    extraCharge: null,
    isActive: true
  });
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<string[]>([]);
  
  // 加载数据
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 加载票价类型
      const types = await PricingService.getAllTicketTypes();
      setTicketTypes(types);
      
      // 加载票价策略
      const strategies = await PricingService.getAllPricingStrategies();
      setPricingStrategies(strategies);
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  // 处理编辑票价类型
  const handleEditTicketType = (type: TicketTypeModel) => {
    setCurrentTicketType({...type});
    setShowEditTicketTypeModal(true);
  };
  
  // 处理编辑票价策略
  const handleEditPricingStrategy = (strategy: PricingStrategyModel) => {
    setCurrentPricingStrategy({...strategy});
    setShowEditPricingStrategyModal(true);
  };
  
  // 处理删除票价类型
  const handleDeleteTicketType = async (typeId: string) => {
    if (!confirm('确定要删除此票价类型吗？此操作不可恢复。')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await PricingService.deleteTicketType(typeId);
      handleSaveSuccess();
      loadData();
    } catch (error) {
      console.error('删除票价类型失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理删除票价策略
  const handleDeletePricingStrategy = async (strategyId: string) => {
    if (!confirm('确定要删除此票价策略吗？此操作不可恢复。')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await PricingService.deletePricingStrategy(strategyId);
      handleSaveSuccess();
      loadData();
    } catch (error) {
      console.error('删除票价策略失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 获取策略应用的票价类型
  const getAppliedTicketTypeNames = (typeIds: string[]) => {
    return typeIds.map(typeId => {
      const ticket = ticketTypes.find(t => t.id === typeId);
      return ticket ? ticket.name : '';
    }).filter(Boolean).join(', ');
  };

  // 保存编辑后的票价类型
  const saveEditedTicketType = async () => {
    if (!currentTicketType) return;
    
    setIsLoading(true);
    try {
      await PricingService.updateTicketType(currentTicketType.id, currentTicketType);
      setShowEditTicketTypeModal(false);
      handleSaveSuccess();
      loadData();
    } catch (error) {
      console.error('更新票价类型失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存编辑后的票价策略
  const saveEditedPricingStrategy = async () => {
    if (!currentPricingStrategy) return;
    
    setIsLoading(true);
    try {
      await PricingService.updatePricingStrategy(
        currentPricingStrategy.id, 
        currentPricingStrategy
      );
      setShowEditPricingStrategyModal(false);
      handleSaveSuccess();
      loadData();
    } catch (error) {
      console.error('更新票价策略失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 添加新票价类型
  const handleAddTicketType = async () => {
    setIsLoading(true);
    try {
      await PricingService.createTicketType(newTicketType);
      setShowAddTicketTypeModal(false);
      handleSaveSuccess();
      loadData();
      // 重置表单
      setNewTicketType({
        name: '',
        basePrice: 0,
        description: '',
        isActive: true
      });
    } catch (error) {
      console.error('添加票价类型失败:', error);
      alert('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 添加新票价策略
  const handleAddPricingStrategy = async () => {
    setIsLoading(true);
    try {
      await PricingService.createPricingStrategy(newPricingStrategy);
      setShowAddPricingStrategyModal(false);
      handleSaveSuccess();
      loadData();
      // 重置表单
      setNewPricingStrategy({
        name: '',
        description: '',
        conditionType: 'weekday',
        conditionValue: null,
        discountPercentage: null,
        extraCharge: null,
        isActive: true
      });
      setSelectedTicketTypes([]);
    } catch (error) {
      console.error('添加票价策略失败:', error);
      alert('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理保存成功
  const handleSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };
  
  // 处理新票价类型输入变更
  const handleNewTicketTypeChange = (field: string, value: any) => {
    setNewTicketType({
      ...newTicketType,
      [field]: value
    });
  };
  
  // 处理新票价策略输入变更
  const handleNewStrategyChange = (field: string, value: any) => {
    setNewPricingStrategy({
      ...newPricingStrategy,
      [field]: value
    });
  };
  
  // 处理编辑票价类型输入变更
  const handleEditTicketTypeChange = (field: string, value: any) => {
    if (currentTicketType) {
      setCurrentTicketType({
        ...currentTicketType,
        [field]: value
      });
    }
  };
  
  // 处理编辑票价策略输入变更
  const handleEditStrategyChange = (field: string, value: any) => {
    if (currentPricingStrategy) {
      setCurrentPricingStrategy({
        ...currentPricingStrategy,
        [field]: value
      });
    }
  };

  return (
    <div className="p-4">
      {/* 保存成功提示 */}
      {saveSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center z-50">
          <Check size={16} className="mr-2" />
          操作成功
        </div>
      )}
    
      {/* 加载状态 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">处理中...</p>
          </div>
        </div>
      )}
    
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
          {ticketTypes.length > 0 ? (
            ticketTypes.map((type) => (
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
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              暂无票价类型数据
            </div>
          )}
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
          {pricingStrategies.length > 0 ? (
            pricingStrategies.map((strategy) => (
              <div key={strategy.id} className="border-b last:border-b-0 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-1">
                      <DollarSign size={16} className="text-indigo-600 mr-2" />
                      <h3 className="font-medium">{strategy.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                    
                    {strategy.discountPercentage && (
                      <div className="flex items-center text-sm mb-1">
                        <Clock size={14} className="text-gray-500 mr-1" />
                        <span className="text-green-600">折扣: {strategy.discountPercentage}%</span>
                      </div>
                    )}
                    
                    {strategy.extraCharge && (
                      <div className="flex items-center text-sm mb-1">
                        <Clock size={14} className="text-gray-500 mr-1" />
                        <span className="text-amber-600">附加费: +{strategy.extraCharge}元</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      <span>条件类型: {strategy.conditionType}</span>
                      {strategy.conditionValue && <span className="ml-2">条件值: {strategy.conditionValue}</span>}
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
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              暂无票价策略数据
            </div>
          )}
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">票价类型名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：学生票、情侣票" 
                    value={newTicketType.name}
                    onChange={(e) => handleNewTicketTypeChange('name', e.target.value)}
                    required
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
                      value={newTicketType.basePrice}
                      onChange={(e) => handleNewTicketTypeChange('basePrice', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="描述该票价类型的使用条件等"
                    value={newTicketType.description}
                    onChange={(e) => handleNewTicketTypeChange('description', e.target.value)}
                  ></textarea>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    className="mr-2"
                    checked={newTicketType.isActive}
                    onChange={(e) => handleNewTicketTypeChange('isActive', e.target.checked)}
                  />
                  <label htmlFor="isActive" className="text-sm">启用此票价类型</label>
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
                    onClick={handleAddTicketType}
                    disabled={isLoading}
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">票价类型名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={currentTicketType.name}
                    onChange={(e) => handleEditTicketTypeChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">基础票价</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-2 top-2.5 text-gray-400" />
                    <input 
                      type="number" 
                      className="w-full pl-8 p-2 border rounded-md" 
                      value={currentTicketType.basePrice}
                      onChange={(e) => handleEditTicketTypeChange('basePrice', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={currentTicketType.description}
                    onChange={(e) => handleEditTicketTypeChange('description', e.target.value)}
                  ></textarea>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="editIsActive" 
                    className="mr-2"
                    checked={currentTicketType.isActive}
                    onChange={(e) => handleEditTicketTypeChange('isActive', e.target.checked)}
                  />
                  <label htmlFor="editIsActive" className="text-sm">启用此票价类型</label>
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
                    onClick={saveEditedTicketType}
                    disabled={isLoading}
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：工作日优惠" 
                    value={newPricingStrategy.name}
                    onChange={(e) => handleNewStrategyChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略描述</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="例如：周一至周五非节假日" 
                    value={newPricingStrategy.description}
                    onChange={(e) => handleNewStrategyChange('description', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件类型</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newPricingStrategy.conditionType}
                    onChange={(e) => handleNewStrategyChange('conditionType', e.target.value)}
                    required
                  >
                    <option value="weekday">工作日</option>
                    <option value="weekend">周末</option>
                    <option value="time">时间段</option>
                    <option value="movie_type">电影类型</option>
                    <option value="holiday">节假日</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件值</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="根据条件类型填写，如时间范围等" 
                    value={newPricingStrategy.conditionValue || ''}
                    onChange={(e) => handleNewStrategyChange('conditionValue', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣百分比</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-md" 
                        placeholder="例如：10%" 
                        value={newPricingStrategy.discountPercentage || ''}
                        onChange={(e) => handleNewStrategyChange('discountPercentage', e.target.value ? Number(e.target.value) : null)}
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
                        value={newPricingStrategy.extraCharge || ''}
                        onChange={(e) => handleNewStrategyChange('extraCharge', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="strategyIsActive" 
                    className="mr-2"
                    checked={newPricingStrategy.isActive}
                    onChange={(e) => handleNewStrategyChange('isActive', e.target.checked)}
                  />
                  <label htmlFor="strategyIsActive" className="text-sm">启用此票价策略</label>
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
                    onClick={handleAddPricingStrategy}
                    disabled={isLoading}
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={currentPricingStrategy.name}
                    onChange={(e) => handleEditStrategyChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略描述</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={currentPricingStrategy.description}
                    onChange={(e) => handleEditStrategyChange('description', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件类型</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={currentPricingStrategy.conditionType}
                    onChange={(e) => handleEditStrategyChange('conditionType', e.target.value)}
                    required
                  >
                    <option value="weekday">工作日</option>
                    <option value="weekend">周末</option>
                    <option value="time">时间段</option>
                    <option value="movie_type">电影类型</option>
                    <option value="holiday">节假日</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条件值</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="根据条件类型填写，如时间范围等" 
                    value={currentPricingStrategy.conditionValue || ''}
                    onChange={(e) => handleEditStrategyChange('conditionValue', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣百分比</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-md" 
                        value={currentPricingStrategy.discountPercentage || ''}
                        onChange={(e) => handleEditStrategyChange('discountPercentage', e.target.value ? Number(e.target.value) : null)}
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
                        value={currentPricingStrategy.extraCharge || ''}
                        onChange={(e) => handleEditStrategyChange('extraCharge', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="editStrategyIsActive" 
                    className="mr-2"
                    checked={currentPricingStrategy.isActive}
                    onChange={(e) => handleEditStrategyChange('isActive', e.target.checked)}
                  />
                  <label htmlFor="editStrategyIsActive" className="text-sm">启用此票价策略</label>
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
                    onClick={saveEditedPricingStrategy}
                    disabled={isLoading}
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