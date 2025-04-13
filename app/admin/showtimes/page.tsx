'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Film, Home, X, DollarSign, Check } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TicketType, Showtime, Movie, Theater } from '@/app/lib/types';
import { ShowtimeService } from '@/app/lib/services/showtimeService';
import { MovieService } from '@/app/lib/services/movieService';
import { TheaterService } from '@/app/lib/services/theaterService';

export default function ShowtimesManagementPage() {
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 新场次数据
  const [newShowtime, setNewShowtime] = useState({
    movieId: '',
    theaterId: '',
    date: format(date, 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '12:00',
    priceNormal: 50,
    priceStudent: 35,
    priceSenior: 30,
    priceChild: 25,
    priceVIP: 70
  });
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allShowtimes, allMovies, allTheaters] = await Promise.all([
          ShowtimeService.getAllShowtimes(),
          MovieService.getAllMovies(),
          TheaterService.getAllTheaters()
        ]);
        
        setShowtimes(allShowtimes);
        setMovies(allMovies);
        setTheaters(allTheaters);
      } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const formatTime = (time: Date) => {
    return format(time, 'HH:mm', { locale: zhCN });
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd', { locale: zhCN });
  };
  
  // 按时间排序并过滤当前选择日期的场次
  const filteredShowtimes = showtimes
    .filter(showtime => {
      const showtimeDate = showtime.startTime;
      return (
        showtimeDate.getFullYear() === date.getFullYear() &&
        showtimeDate.getMonth() === date.getMonth() &&
        showtimeDate.getDate() === date.getDate()
      );
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 处理删除排片
  const handleDeleteShowtime = async (showtimeId: string) => {
    if (!confirm('确定要删除此场次吗？此操作不可恢复。')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await ShowtimeService.deleteShowtime(showtimeId);
      
      if (success) {
        // 更新本地状态
        setShowtimes(showtimes.filter(s => s.id !== showtimeId));
        alert('场次已删除');
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('删除场次失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理添加新排片
  const handleAddShowtime = async () => {
    if (!newShowtime.movieId || !newShowtime.theaterId) {
      alert('请选择电影和影厅');
      return;
    }
    
    // 创建日期时间
    const startDateTime = new Date(`${newShowtime.date}T${newShowtime.startTime}`);
    const endDateTime = new Date(`${newShowtime.date}T${newShowtime.endTime}`);
    
    // 验证时间
    if (endDateTime <= startDateTime) {
      alert('结束时间必须晚于开始时间');
      return;
    }
    
    setIsLoading(true);
    try {
      const newShowtimeData = {
        movieId: newShowtime.movieId,
        theaterId: newShowtime.theaterId,
        startTime: startDateTime,
        endTime: endDateTime,
        price: {
          [TicketType.NORMAL]: newShowtime.priceNormal,
          [TicketType.STUDENT]: newShowtime.priceStudent,
          [TicketType.SENIOR]: newShowtime.priceSenior,
          [TicketType.CHILD]: newShowtime.priceChild
        }
      };
      
      const result = await ShowtimeService.addShowtime(newShowtimeData);
      
      if (result) {
        // 更新本地状态
        setShowtimes([...showtimes, result]);
        
        // 显示成功提示
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setShowAddModal(false);
        }, 1500);
        
        // 重置表单
        setNewShowtime({
          movieId: '',
          theaterId: '',
          date: format(date, 'yyyy-MM-dd'),
          startTime: '10:00',
          endTime: '12:00',
          priceNormal: 50,
          priceStudent: 35,
          priceSenior: 30,
          priceChild: 25,
          priceVIP: 70
        });
      } else {
        alert('添加失败，请重试');
      }
    } catch (error) {
      console.error('添加场次失败:', error);
      alert('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理表单变化
  const handleInputChange = (field: string, value: any) => {
    setNewShowtime(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">排片管理</h1>
        <button 
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-1" /> 新增排片
        </button>
      </div>
      
      {/* 日期选择 */}
      <div className="bg-white rounded-lg shadow mb-4 p-3">
        <div className="flex items-center mb-2">
          <Calendar size={16} className="text-gray-500 mr-2" />
          <span className="text-gray-700">选择日期</span>
        </div>
        <input 
          type="date" 
          className="w-full p-2 border rounded-md"
          value={format(date, 'yyyy-MM-dd')}
          onChange={(e) => setDate(new Date(e.target.value))}
        />
      </div>
      
      {/* 排片列表 */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-3 text-slate-500">加载中...</p>
        </div>
      ) : filteredShowtimes.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          {filteredShowtimes.map((showtime) => (
            <div key={showtime.id} className="border-b last:border-b-0 p-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <Film size={16} className="text-indigo-600 mr-2" />
                  <span className="font-medium">{showtime.movieTitle}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    编辑
                  </button>
                  <button 
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                    onClick={() => handleDeleteShowtime(showtime.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <Clock size={14} className="mr-1" />
                <span>{formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}</span>
              </div>
              
              <div className="flex items-center text-gray-500 text-sm">
                <Home size={14} className="mr-1" />
                <span>{showtime.theaterName}</span>
              </div>
              
              <div className="mt-2 text-sm">
                <span className="text-gray-500">票价: </span>
                <span className="font-medium text-amber-600">{showtime.price[TicketType.NORMAL]}元起</span>
                <span className="text-gray-400 ml-2">{showtime.availableSeats.filter(seat => seat.available).length} 个座位可用</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">当前日期没有排片</p>
          <button 
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm inline-flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} className="mr-1" /> 添加排片
          </button>
        </div>
      )}

      {/* 添加排片模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-lg">新增排片</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {/* 电影选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择电影</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newShowtime.movieId}
                    onChange={(e) => handleInputChange('movieId', e.target.value)}
                  >
                    <option value="">请选择电影</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title} ({movie.duration}分钟)
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 影厅选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择影厅</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={newShowtime.theaterId}
                    onChange={(e) => handleInputChange('theaterId', e.target.value)}
                  >
                    <option value="">请选择影厅</option>
                    {theaters.map(theater => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name} ({theater.totalSeats}座)
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 日期选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">放映日期</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-md"
                    value={newShowtime.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                
                {/* 时间选择 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input 
                      type="time" 
                      className="w-full p-2 border rounded-md" 
                      value={newShowtime.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input 
                      type="time" 
                      className="w-full p-2 border rounded-md" 
                      value={newShowtime.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* 票价设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">票价设置</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-20 text-sm">普通票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-full pl-8 p-2 border rounded-md" 
                          placeholder="0"
                          value={newShowtime.priceNormal}
                          onChange={(e) => handleInputChange('priceNormal', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">学生票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-full pl-8 p-2 border rounded-md" 
                          placeholder="0"
                          value={newShowtime.priceStudent}
                          onChange={(e) => handleInputChange('priceStudent', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">老人票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-full pl-8 p-2 border rounded-md" 
                          placeholder="0"
                          value={newShowtime.priceSenior}
                          onChange={(e) => handleInputChange('priceSenior', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">儿童票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-full pl-8 p-2 border rounded-md" 
                          placeholder="0"
                          value={newShowtime.priceChild}
                          onChange={(e) => handleInputChange('priceChild', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">VIP票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input 
                          type="number" 
                          className="w-full pl-8 p-2 border rounded-md" 
                          placeholder="0"
                          value={newShowtime.priceVIP}
                          onChange={(e) => handleInputChange('priceVIP', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md"
                    onClick={() => setShowAddModal(false)}
                    disabled={isLoading || saveSuccess}
                  >
                    取消
                  </button>
                  <button 
                    type="button"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-md flex items-center justify-center"
                    onClick={handleAddShowtime}
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
          </div>
        </div>
      )}
    </div>
  );
} 