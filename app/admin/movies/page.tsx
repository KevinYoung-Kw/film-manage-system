'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, X, Calendar, Clock, Check } from 'lucide-react';
import { MovieStatus } from '@/app/lib/types';
import { useAppContext } from '@/app/lib/context/AppContext';
import Image from 'next/image';
import { defaultImages } from '@/app/lib/mockData';
import { processImageUrl } from '@/app/lib/services/dataService';

export default function MoviesManagementPage() {
  const { movies, addMovie, updateMovie, deleteMovie, refreshData } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editedMovie, setEditedMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    refreshData().then(() => {
      setIsLoading(false);
    });
  }, [refreshData]);
  
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
  const handleSaveEdit = async () => {
    if (!editedMovie || !currentMovie) return;
    
    try {
      setIsLoading(true);
      
      // 确保日期格式正确
      if (editedMovie.releaseDate && typeof editedMovie.releaseDate === 'string') {
        editedMovie.releaseDate = new Date(editedMovie.releaseDate);
      }
      
      // 更新电影信息
      const updated = await updateMovie(currentMovie.id, editedMovie);
      
      if (updated) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowEditModal(false);
        }, 1500);
        
        // 刷新电影列表
        refreshData();
      }
    } catch (error) {
      console.error('保存电影失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除电影
  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('确定要删除此电影吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const success = await deleteMovie(movieId);
      
      if (success) {
        alert('电影已删除');
        refreshData();
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('删除电影失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理添加新电影
  const handleAddNewMovie = async (movieData: any) => {
    try {
      setIsLoading(true);
      
      // 确保日期格式正确
      if (movieData.releaseDate && typeof movieData.releaseDate === 'string') {
        movieData.releaseDate = new Date(movieData.releaseDate);
      }
      
      const newMovie = await addMovie(movieData);
      
      if (newMovie) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowAddModal(false);
        }, 1500);
        
        // 刷新电影列表
        refreshData();
      }
    } catch (error) {
      console.error('添加电影失败:', error);
      alert('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 过滤和添加按钮 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部电影</option>
            <option value="showing">正在上映</option>
            <option value="coming_soon">即将上映</option>
            <option value="off_showing">已下映</option>
          </select>
          <button
            className="px-3 py-2 bg-slate-100 rounded-md text-sm flex items-center"
            onClick={() => setFilter('all')}
          >
            <X className="h-4 w-4 mr-1" />
            清除过滤
          </button>
        </div>
        <button
          className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm flex items-center"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加电影
        </button>
      </div>

      {/* 电影列表 */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-slate-500">加载中...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500">没有找到电影</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-slate-200 rounded-md">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
                  电影
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
                  状态
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
                  上映日期
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
                  时长
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMovies.map((movie) => (
                <tr key={movie.id} className="hover:bg-slate-50">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-14 w-10 flex-shrink-0 mr-3 relative">
                        <Image
                          src={processImageUrl(movie.poster)}
                          alt={movie.title}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {movie.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {movie.genre?.join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movie.status === MovieStatus.SHOWING
                        ? 'bg-green-100 text-green-800'
                        : movie.status === MovieStatus.COMING_SOON
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {movie.status === MovieStatus.SHOWING ? '正在上映' :
                       movie.status === MovieStatus.COMING_SOON ? '即将上映' : '已下映'}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-500">
                    {movie.releaseDate instanceof Date ? 
                      movie.releaseDate.toLocaleDateString() : 
                      new Date(movie.releaseDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-500">
                    {movie.duration} 分钟
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-500">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => handleEditMovie(movie)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteMovie(movie.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 编辑电影模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">编辑电影</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  电影标题
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  原始标题（外语片）
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.originalTitle || ''}
                  onChange={(e) => handleInputChange('originalTitle', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  电影状态
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.status || MovieStatus.COMING_SOON}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value={MovieStatus.COMING_SOON}>即将上映</option>
                  <option value={MovieStatus.SHOWING}>正在上映</option>
                  <option value={MovieStatus.OFF_SHOWING}>已下映</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  上映日期
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.releaseDate instanceof Date 
                    ? editedMovie.releaseDate.toISOString().split('T')[0]
                    : new Date(editedMovie?.releaseDate).toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  时长（分钟）
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.duration || 0}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value, 10))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  导演
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.director || ''}
                  onChange={(e) => handleInputChange('director', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  主演（逗号分隔）
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.actors?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('actors', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  类型（逗号分隔）
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.genre?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('genre', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  评分
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.rating || 0}
                  onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  海报URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={editedMovie?.poster || ''}
                  onChange={(e) => handleInputChange('poster', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  剧情简介
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  value={editedMovie?.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm flex items-center"
                onClick={handleSaveEdit}
                disabled={isLoading || saveSuccess}
              >
                {saveSuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    已保存
                  </>
                ) : isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加电影模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">添加新电影</h2>
            
            {/* 添加新电影的表单，与编辑表单类似，但初始值为空 */}
            <div className="space-y-4">
              {/* 此处可以复制编辑表单的字段，初始值设为空 */}
              {/* ... */}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                onClick={() => handleAddNewMovie({
                  // 添加电影的数据
                  title: '新电影',
                  description: '电影描述',
                  releaseDate: new Date(),
                  duration: 120,
                  director: '导演',
                  actors: ['演员1', '演员2'],
                  genre: ['类型1', '类型2'],
                  poster: defaultImages.moviePoster,
                  status: MovieStatus.COMING_SOON,
                  rating: 0
                })}
                disabled={isLoading || saveSuccess}
              >
                {saveSuccess ? '已添加' : isLoading ? '添加中...' : '添加电影'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 