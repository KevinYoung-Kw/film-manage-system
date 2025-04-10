import { NextResponse } from 'next/server';
import { AuthService } from '@/app/lib/services/authService';

// 此API路由用于测试注册功能
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || '测试用户';
  const email = searchParams.get('email') || 'test@example.com';
  const password = searchParams.get('password') || 'test123';

  try {
    console.log(`调试API: 尝试注册用户 ${email}`);
    
    // 使用AuthService注册用户
    const user = await AuthService.register(name, email, password);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '注册失败但未抛出错误'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '用户注册成功',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('调试API: 注册失败:', error);
    return NextResponse.json({ 
      success: false,
      message: error.message || '注册失败',
      error: error.toString()
    }, { status: 500 });
  }
} 