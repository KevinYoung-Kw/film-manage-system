'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '@/app/lib/context/AppContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { darkMode, toggleDarkMode } = useAppContext();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-full transition-colors ${
        darkMode 
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      } ${className}`}
      aria-label={darkMode ? '切换至亮色模式' : '切换至暗色模式'}
    >
      {darkMode ? (
        <Sun size={18} className="transition-transform" />
      ) : (
        <Moon size={18} className="transition-transform" />
      )}
    </button>
  );
};

export default ThemeToggle; 