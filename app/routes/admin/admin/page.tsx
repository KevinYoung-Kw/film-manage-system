import React from 'react';
import MobileLayout from '@/app/components/layout/MobileLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import Link from 'next/link';
import { Film, Calendar, Settings, BarChart3, Users, Theater } from 'lucide-react';

export default function AdminPage() {
  return (
    <MobileLayout title="影院管理" userRole="admin">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">影院管理系统</h1>
        
        <p className="text-slate-500 mb-6">
          欢迎使用影院管理系统，您可以通过以下功能管理影院、电影和排期等。
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/movies" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <Film className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-sm font-medium">电影管理</span>
                <span className="text-xs text-slate-500 mt-1">上映/下架</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/showtimes" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium">排片管理</span>
                <span className="text-xs text-slate-500 mt-1">场次/票价</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/theaters" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <Theater className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">影厅管理</span>
                <span className="text-xs text-slate-500 mt-1">设置/维护</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/staff" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">员工管理</span>
                <span className="text-xs text-slate-500 mt-1">权限/排班</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/stats" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium">数据统计</span>
                <span className="text-xs text-slate-500 mt-1">销售/分析</span>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="p-3">
            <CardContent>
              <Link href="/admin/settings" className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <Settings className="h-6 w-6 text-slate-600" />
                </div>
                <span className="text-sm font-medium">系统设置</span>
                <span className="text-xs text-slate-500 mt-1">配置/参数</span>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <h2 className="text-amber-800 font-semibold mb-2">管理提示</h2>
          <p className="text-amber-700 text-sm">
            当前系统正在开发中，以上功能为预览版本，部分功能可能尚未完全实现。
          </p>
        </div>
      </div>
    </MobileLayout>
  );
} 