import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/app/lib/services/supabaseClient';

// 此API路由用于调试密码匹配问题
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  if (!email || !password) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  try {
    console.log(`调试API: 尝试查询用户 ${email}`);
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`Supabase Key前10个字符: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)}...`);
    
    // 1. 查询用户
    const { data: user, error, status, statusText } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('调试API: 查询用户失败:', error, status, statusText);
      
      // 尝试不使用single()查询，看看是否有多条记录
      const { data: multiUsers, error: multiError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
        
      if (multiError) {
        console.error('调试API: 尝试多条查询也失败:', multiError);
        return NextResponse.json({ 
          error: `查询用户失败: ${error.message}`,
          detail: error,
          status,
          statusText
        }, { status: 500 });
      }
      
      console.log(`调试API: 找到 ${multiUsers?.length || 0} 条匹配的用户记录`);
      
      if (multiUsers && multiUsers.length > 0) {
        return NextResponse.json({ 
          error: `存在多个用户记录`,
          count: multiUsers.length,
          users: multiUsers.map(u => ({ id: u.id, email: u.email }))
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: `未找到用户: ${error.message}`,
        detail: error 
      }, { status: 404 });
    }

    if (!user) {
      console.error('调试API: 未找到用户');
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    console.log(`调试API: 成功查询到用户 ${user.id}, 角色 ${user.role}`);

    // 2. 测试密码匹配
    console.log('调试API: 尝试验证密码:', {
      inputPasswordLength: password.length,
      dbPasswordHashLength: user.password_hash?.length || 0
    });
    
    if (!user.password_hash) {
      console.error('调试API: 用户没有设置密码哈希');
      return NextResponse.json({ error: '用户没有设置密码' }, { status: 400 });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('调试API: 密码验证结果:', passwordMatch);

    // 3. 返回详细信息（仅用于调试）
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        password_hash_length: user.password_hash?.length || 0,
      },
      test: {
        input_password: password,
        password_match: passwordMatch
      }
    });
  } catch (error: any) {
    console.error('调试API: 未处理的异常:', error);
    return NextResponse.json({ 
      error: `调试失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 