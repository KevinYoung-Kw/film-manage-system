'use client';

import React, { useState } from 'react';
import { mockShowtimes, mockMovies, mockTheaters } from '@/app/lib/mockData';
import { Plus, Calendar, Clock, Film, Home, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TicketType } from '@/app/lib/types';

export default function ShowtimesManagementPage() {
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  
  const formatTime = (time: Date) => {
    return format(time, 'HH:mm', { locale: zhCN });
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd', { locale: zhCN });
  };
  
  // 获取电影和影厅信息
  const getMovieTitle = (movieId: string) => {
    const movie = mockMovies.find(m => m.id === movieId);
    return movie ? movie.title : '未知电影';
  };
  
  const getTheaterName = (theaterId: string) => {
    const theater = mockTheaters.find(t => t.id === theaterId);
    return theater ? theater.name : '未知影厅';
  };
  
  // 按时间排序并过滤当前选择日期的场次
  const filteredShowtimes = [...mockShowtimes]
    .filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      return (
        showtimeDate.getFullYear() === date.getFullYear() &&
        showtimeDate.getMonth() === date.getMonth() &&
        showtimeDate.getDate() === date.getDate()
      );
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 删除排片
  const handleDeleteShowtime = (showtimeId: string) => {
    // 在实际应用中，这里会调用API删除排片
    alert(`删除排片 ID: ${showtimeId}`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">排片管理</h1>
        <button 
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="mr-1" /> 新增
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
      {filteredShowtimes.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          {filteredShowtimes.map((showtime) => (
            <div key={showtime.id} className="border-b last:border-b-0 p-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <Film size={16} className="text-indigo-600 mr-2" />
                  <span className="font-medium">{getMovieTitle(showtime.movieId)}</span>
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
                <span>{getTheaterName(showtime.theaterId)}</span>
              </div>
              
              <div className="mt-2 text-sm">
                <span className="text-gray-500">票价: </span>
                <span className="font-medium text-amber-600">{showtime.price.normal}元起</span>
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
              <form className="space-y-4">
                {/* 电影选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择电影</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">请选择电影</option>
                    {mockMovies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title} ({movie.duration}分钟)
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 影厅选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择影厅</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">请选择影厅</option>
                    {mockTheaters.map(theater => (
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
                    defaultValue={formatDate(date)}
                  />
                </div>
                
                {/* 时间选择 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input type="time" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input type="time" className="w-full p-2 border rounded-md" />
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
                        <input type="number" className="w-full pl-8 p-2 border rounded-md" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">学生票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input type="number" className="w-full pl-8 p-2 border rounded-md" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">老人票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input type="number" className="w-full pl-8 p-2 border rounded-md" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">儿童票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input type="number" className="w-full pl-8 p-2 border rounded-md" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm">VIP票:</span>
                      <div className="relative flex-1">
                        <DollarSign size={16} className="absolute left-2 top-2 text-gray-400" />
                        <input type="number" className="w-full pl-8 p-2 border rounded-md" placeholder="0" />
                      </div>
                    </div>
                  </div>
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
    </div>
  );
} 