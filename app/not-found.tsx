'use client'

import Link from 'next/link'
import Button from '@/app/components/ui/Button'
import { useEffect } from 'react'

export default function NotFound() {
  useEffect(() => {
    // 页面加载时可以添加一些分析或日志记录
    console.log('用户访问了404页面')
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-md px-4 py-8 text-center">
        <h1 className="text-9xl font-extrabold text-gray-700">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-800">页面未找到</h2>
        <p className="mt-2 text-gray-600">
          抱歉，您尝试访问的页面不存在或已被移除。
        </p>
        <div className="mt-6">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">
              回到首页
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 