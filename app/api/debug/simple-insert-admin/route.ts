import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/app/lib/services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// 此API仅创建单个管理员用户，可通过REST API调用
export async function GET(request: Request) {
  try {
    console.log('开始创建管理员用户...');
    
    // 生成ID
    const userId = uuidv4();
    
    // 使用bcrypt对密码进行哈希
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // 进行用户创建 REST API 调用
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify({
        id: userId,
        name: '系统管理员',
        email: 'admin@example.com',
        password_hash,
        role: 'admin',
        phone: '13800000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({
        success: false,
        message: '创建用户失败',
        status: response.status,
        error: errorData
      });
    }
    
    // 尝试获取用户详情
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, name, created_at')
      .eq('email', 'admin@example.com')
      .single();
    
    return NextResponse.json({
      success: true,
      message: '管理员用户创建成功',
      user: user || { id: userId, email: 'admin@example.com' },
      error: error || null
    });
  } catch (error: any) {
    console.error('创建管理员用户失败:', error);
    return NextResponse.json({ 
      success: false,
      error: `创建用户失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 