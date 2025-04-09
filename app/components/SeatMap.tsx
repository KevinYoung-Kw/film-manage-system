'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { Seat } from '../lib/types';

interface SeatMapProps {
  seats: Seat[];
  rows: number;
  columns: number;
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  maxSelectableSeats?: number;
  disabled?: boolean;
}

const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  rows,
  columns,
  selectedSeats,
  onSeatSelect,
  maxSelectableSeats = 4,
  disabled = false
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const getSeatInfoById = (row: number, col: number): Seat | undefined => {
    return seats.find(s => s.row === row && s.column === col);
  };

  // 获取座位样式
  const getSeatClass = (seat: Seat | undefined): string => {
    if (!seat) return 'invisible'; // 座位不存在
    
    // 基础样式
    const baseClass = 'w-8 h-8 sm:w-10 sm:h-10 rounded-t-md flex items-center justify-center text-xs cursor-pointer transition-colors m-0.5 relative';
    
    // 悬停状态
    const isHovered = hoveredSeat === seat.id;
    
    // 座位类型样式
    let typeClass = '';
    switch (seat.type) {
      case 'normal':
        typeClass = 'bg-slate-100 hover:bg-slate-200 text-slate-700';
        break;
      case 'vip':
        typeClass = 'bg-amber-100 hover:bg-amber-200 text-amber-700';
        break;
      case 'couple':
        typeClass = 'bg-pink-100 hover:bg-pink-200 text-pink-700';
        break;
      case 'disabled':
        typeClass = 'bg-blue-100 hover:bg-blue-200 text-blue-700';
        break;
    }
    
    // 全局禁用状态
    if (disabled) {
      return `${baseClass} bg-slate-200 text-slate-400 cursor-not-allowed opacity-50`;
    }
    
    // 选中或不可用状态
    if (!seat.available) {
      return `${baseClass} bg-slate-300 text-slate-500 cursor-not-allowed opacity-50`;
    } else if (selectedSeats.includes(seat.id)) {
      return `${baseClass} bg-indigo-600 text-white cursor-pointer`;
    } else if (selectedSeats.length >= maxSelectableSeats) {
      // 已达到最大可选数量，其他座位变灰
      return `${baseClass} ${typeClass} opacity-50 cursor-not-allowed`;
    }
    
    return `${baseClass} ${typeClass} ${isHovered ? 'ring-2 ring-indigo-300' : ''}`;
  };

  const handleSeatClick = (seat: Seat | undefined) => {
    if (disabled || !seat || !seat.available) return;
    if (selectedSeats.includes(seat.id)) {
      onSeatSelect(seat.id); // 取消选中
    } else if (selectedSeats.length < maxSelectableSeats) {
      onSeatSelect(seat.id); // 选中
    }
  };

  // 生成字母标识 (A, B, C...)
  const getRowLabel = (rowIndex: number): string => {
    return String.fromCharCode(65 + rowIndex - 1);
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-3xl h-6 bg-slate-200 rounded-md flex items-center justify-center text-sm text-slate-600">
          屏幕
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          {Array.from({ length: rows }, (_, rowIndex) => rowIndex + 1).map(row => (
            <div key={`row-${row}`} className="flex items-center">
              <div className="w-6 h-8 sm:w-8 sm:h-10 flex items-center justify-center text-xs text-slate-500">
                {getRowLabel(row)}
              </div>
              {Array.from({ length: columns }, (_, colIndex) => colIndex + 1).map(col => {
                const seat = getSeatInfoById(row, col);
                return (
                  <div
                    key={`seat-${row}-${col}`}
                    className={getSeatClass(seat)}
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => seat && setHoveredSeat(seat.id)}
                    onMouseLeave={() => setHoveredSeat(null)}
                  >
                    {seat && <span>{col}</span>}
                    {seat && seat.type !== 'normal' && (
                      <span className="absolute -bottom-1 left-0 right-0 text-center text-[8px]">
                        {seat.type === 'vip' && 'VIP'}
                        {seat.type === 'couple' && '情侣'}
                        {seat.type === 'disabled' && '无障碍'}
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="w-6 h-8 sm:w-8 sm:h-10 flex items-center justify-center text-xs text-slate-500">
                {getRowLabel(row)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center mt-8 flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-100 rounded mr-2"></div>
          <span className="text-xs text-slate-600">普通座</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-amber-100 rounded mr-2"></div>
          <span className="text-xs text-slate-600">VIP座</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-pink-100 rounded mr-2"></div>
          <span className="text-xs text-slate-600">情侣座</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
          <span className="text-xs text-slate-600">无障碍座</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-300 rounded mr-2 opacity-50"></div>
          <span className="text-xs text-slate-600">已售</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
          <span className="text-xs text-slate-600">已选</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap; 