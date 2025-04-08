'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Filter, X, Calendar, Clock, Check } from 'lucide-react';
import { mockMovies } from '@/app/lib/mockData';
import { MovieStatus } from '@/app/lib/types';

export default function MoviesManagementPage() {
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<any>(null);
  const [movies, setMovies] = useState(mockMovies);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editedMovie, setEditedMovie] = useState<any>(null);
  
  // 过滤电影列表
  const filteredMovies = movies.filter(movie => {
    if (filter === 'all') return true;
    if (filter === 'showing' && movie.status === MovieStatus.SHOWING) return true;
    if (filter === 'coming_soon' && movie.status === MovieStatus.COMING_SOON) return true;
    if (filter === 'off_showing' && movie.status === MovieStatus.OFF_SHOWING) return true;
    return false;
  });

  // 处理编辑电影
  const handleEditMovie = (movie: any) => {
    setCurrentMovie(movie);
    setEditedMovie({...movie}); // 创建副本以便编辑
    setShowEditModal(true);
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: any) => {
    setEditedMovie((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理多值字段的变化（如genre, actors）
  const handleArrayInputChange = (field: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setEditedMovie((prev: any) => ({
      ...prev,
      [field]: array
    }));
  };

  // 处理保存编辑
  const handleSaveEdit = () => {
    // 更新电影数据
    setMovies(prevMovies => 
      prevMovies.map(movie => 
        movie.id === editedMovie.id ? editedMovie : movie
      )
    );
    
    // 显示成功消息
    setSaveSuccess(true);
    
    // 3秒后关闭成功消息
    setTimeout(() => {
      setSaveSuccess(false);
      setShowEditModal(false);
    }, 1500);
  };

  // 处理删除电影
  const handleDeleteMovie = (movieId: string) => {
    if (confirm('确定要删除这部电影吗？')) {
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">电影管理</h1>
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

      {/* 过滤选项 */}
      <div className="flex items-center mb-4 bg-white rounded-lg shadow p-2">
        <Filter size={16} className="text-gray-500 mr-2" />
        <select 
          className="bg-transparent flex-1 outline-none text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部电影</option>
          <option value="showing">正在上映</option>
          <option value="coming_soon">即将上映</option>
          <option value="off_showing">已下映</option>
        </select>
      </div>

      {/* 电影列表 */}
      <div className="grid gap-4">
        {filteredMovies.map(movie => (
          <div key={movie.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex">
              <div className="w-1/3">
                <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
              </div>
              <div className="w-2/3 p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{movie.title}</h3>
                  <div className="flex space-x-1">
                    <button 
                      className="p-1 text-gray-500 hover:text-indigo-600"
                      onClick={() => handleEditMovie(movie)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="p-1 text-gray-500 hover:text-red-600"
                      onClick={() => handleDeleteMovie(movie.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <p>{movie.director} | {movie.duration}分钟</p>
                  <p className="mt-1">{movie.genre.join('/')}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    movie.status === MovieStatus.SHOWING ? 'bg-green-100 text-green-800' : 
                    movie.status === MovieStatus.COMING_SOON ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {movie.status === MovieStatus.SHOWING ? '正在上映' : 
                     movie.status === MovieStatus.COMING_SOON ? '即将上映' : 
                     '已下映'}
                  </span>
                  <span className="text-amber-500 font-medium">{movie.rating} 分</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 添加电影模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增电影</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影名称</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="输入电影名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">海报URL</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="输入海报图片URL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">导演</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="输入导演姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主演</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="输入主演，用逗号分隔" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
                  <input type="number" className="w-full p-2 border rounded-md" placeholder="输入电影时长" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上映日期</label>
                  <div className="relative">
                    <input type="date" className="w-full p-2 border rounded-md" />
                    <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影类型</label>
                  <input type="text" className="w-full p-2 border rounded-md" placeholder="输入电影类型，用逗号分隔" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影状态</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="showing">正在上映</option>
                    <option value="coming_soon">即将上映</option>
                    <option value="off_showing">已下映</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影简介</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="输入电影简介"
                  ></textarea>
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

      {/* 编辑电影模态框 */}
      {showEditModal && editedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">编辑电影</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影名称</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">海报URL</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.poster}
                    onChange={(e) => handleInputChange('poster', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">导演</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.director}
                    onChange={(e) => handleInputChange('director', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主演</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.actors.join(', ')}
                    onChange={(e) => handleArrayInputChange('actors', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时长（分钟）</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上映日期</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full p-2 border rounded-md" 
                      value={editedMovie.releaseDate ? 
                        new Date(editedMovie.releaseDate).toISOString().split('T')[0] : 
                        ''
                      }
                      onChange={(e) => handleInputChange('releaseDate', new Date(e.target.value))}
                    />
                    <Calendar size={16} className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影类型</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.genre.join(', ')}
                    onChange={(e) => handleArrayInputChange('genre', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影状态</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={editedMovie.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="showing">正在上映</option>
                    <option value="coming_soon">即将上映</option>
                    <option value="off_showing">已下映</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full p-2 border rounded-md" 
                    value={editedMovie.rating}
                    onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电影简介</label>
                  <textarea 
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    value={editedMovie.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  ></textarea>
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
                    onClick={handleSaveEdit}
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