'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, X, Calendar, Clock, Check } from 'lucide-react';
import { MovieStatus, Movie } from '@/app/lib/types';
import Image from 'next/image';
import { processImageUrl } from '@/app/lib/services/dataService';
import { MovieService } from '@/app/lib/services/movieService';
import { AuthService } from '@/app/lib/services/authService';

// 添加用户角色验证函数
const verifyAdminAccess = async () => {
  try {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff')) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('验证用户权限失败:', error);
    return false;
  }
};

// 默认图片URL
const DEFAULT_POSTER_URL = 'https://via.placeholder.com/300x450?text=No+Poster';

export default function MoviesManagementPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editedMovie, setEditedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // 刷新数据
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 验证用户权限
      const hasAccess = await verifyAdminAccess();
      if (!hasAccess) {
        setAuthError('您没有权限访问此页面');
        setIsLoading(false);
        return;
      }

      const moviesData = await MovieService.getAllMovies();
      setMovies(moviesData);
      setAuthError(null);
    } catch (error) {
      console.error('加载电影数据失败:', error);
      
      if (error instanceof Error && error.name === 'AuthorizationError') {
        setAuthError('权限错误：' + error.message);
      } else {
        alert('加载电影失败，请刷新页面重试');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshData();
  }, []);
  
  // 过滤电影列表
  const filteredMovies = movies.filter(movie => {
    if (filter === 'all') return true;
    if (filter === 'showing' && movie.status === MovieStatus.SHOWING) return true;
    if (filter === 'coming_soon' && movie.status === MovieStatus.COMING_SOON) return true;
    if (filter === 'off_showing' && movie.status === MovieStatus.OFF_SHOWING) return true;
    return false;
  });

  // 处理编辑电影
  const handleEditMovie = (movie: Movie) => {
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
      
      // 再次验证用户权限
      const hasAccess = await verifyAdminAccess();
      if (!hasAccess) {
        setAuthError('您没有权限执行此操作');
        return;
      }
      
      // 确保日期格式正确
      if (editedMovie.releaseDate && typeof editedMovie.releaseDate === 'string') {
        editedMovie.releaseDate = new Date(editedMovie.releaseDate);
      }
      
      // 更新电影信息
      const updated = await MovieService.updateMovie(currentMovie.id, editedMovie);
      
      if (updated) {
        setSaveSuccess(true);
        setAuthError(null);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowEditModal(false);
        }, 1500);
        
        // 刷新电影列表
        refreshData();
      }
    } catch (error) {
      console.error('保存电影失败:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AuthorizationError') {
          setAuthError('权限错误：' + error.message);
        } else {
          alert('保存失败：' + error.message);
        }
      } else {
        alert('保存失败，请重试');
      }
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
      
      // 再次验证用户权限
      const hasAccess = await verifyAdminAccess();
      if (!hasAccess) {
        setAuthError('您没有权限执行此操作');
        return;
      }
      
      const success = await MovieService.deleteMovie(movieId);
      
      if (success) {
        alert('电影已删除');
        setAuthError(null);
        refreshData();
      }
    } catch (error) {
      console.error('删除电影失败:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AuthorizationError') {
          setAuthError('权限错误：您需要管理员权限才能删除电影');
        } else {
          alert('删除失败：' + error.message);
        }
      } else {
        alert('删除失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理添加新电影
  const handleAddNewMovie = async (movieData: Omit<Movie, 'id'>) => {
    try {
      setIsLoading(true);
      
      // 再次验证用户权限
      const hasAccess = await verifyAdminAccess();
      if (!hasAccess) {
        setAuthError('您没有权限执行此操作');
        return;
      }
      
      // 确保日期格式正确
      if (movieData.releaseDate && typeof movieData.releaseDate === 'string') {
        movieData.releaseDate = new Date(movieData.releaseDate);
      }
      
      const newMovie = await MovieService.addMovie(movieData);
      
      if (newMovie) {
        setSaveSuccess(true);
        setAuthError(null);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowAddModal(false);
        }, 1500);
        
        // 刷新电影列表
        refreshData();
      }
    } catch (error) {
      console.error('添加电影失败:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AuthorizationError') {
          setAuthError('权限错误：' + error.message);
        } else {
          alert('添加失败：' + error.message);
        }
      } else {
        alert('添加失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化一个新电影表单
  const handleInitNewMovie = () => {
    const defaultMovie: Omit<Movie, 'id'> = {
      title: '',
      originalTitle: '',
      description: '',
      duration: 120,
      director: '',
      releaseDate: new Date(),
      actors: ['演员1', '演员2'],
      genre: ['类型1', '类型2'],
      poster: DEFAULT_POSTER_URL,
      status: MovieStatus.COMING_SOON,
      rating: 0
    };
    setEditedMovie(defaultMovie as any);
    setShowAddModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 权限错误提示 */}
      {authError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">权限错误</p>
          <p>{authError}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
            onClick={() => {
              // 尝试刷新会话
              AuthService.initSession().then(user => {
                if (user) {
                  setAuthError(null);
                  refreshData();
                } else {
                  // 如果刷新会话失败，提示用户重新登录
                  alert('请重新登录以获取正确权限');
                  // 可以在这里添加重定向到登录页面的逻辑
                }
              });
            }}
          >
            刷新会话
          </button>
        </div>
      )}

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
                          src={processImageUrl(movie.webpPoster || movie.poster) || DEFAULT_POSTER_URL}
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
                    : editedMovie?.releaseDate 
                      ? new Date(editedMovie.releaseDate).toISOString().split('T')[0]
                      : ''}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  电影标题
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="输入电影标题"
                  defaultValue="新电影"
                  id="new-movie-title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  原始标题（外语片）
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="输入原始标题"
                  id="new-movie-original-title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  电影状态
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={MovieStatus.COMING_SOON}
                  id="new-movie-status"
                >
                  <option value={MovieStatus.COMING_SOON}>即将上映</option>
                  <option value={MovieStatus.SHOWING}>正在上映</option>
                  <option value={MovieStatus.OFF_SHOWING}>已下映</option>
                </select>
              </div>
              
              {/* 其他表单字段可以类似添加 */}
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
                  title: '新电影',
                  description: '电影描述',
                  releaseDate: new Date(),
                  duration: 120,
                  director: '导演',
                  actors: ['演员1', '演员2'],
                  genre: ['类型1', '类型2'],
                  poster: DEFAULT_POSTER_URL,
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