import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/app/lib/services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// 此API路由用于创建测试用户
export async function GET(request: Request) {
  try {
    console.log('开始创建测试用户...');
    
    // 准备测试用户数据
    const users = [
      {
        id: uuidv4(),
        name: '系统管理员',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        phone: '13800000000'
      },
      {
        id: uuidv4(),
        name: '售票员1',
        email: 'staff1@example.com',
        password: 'staff123',
        role: 'staff',
        phone: '13800000001'
      },
      {
        id: uuidv4(),
        name: '用户1',
        email: 'customer1@example.com',
        password: 'customer123',
        role: 'customer',
        phone: '13800000002'
      }
    ];
    
    // 结果数组
    const results = [];
    
    // 为每个用户生成密码哈希并插入数据库
    for (const user of users) {
      try {
        // 生成密码哈希
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(user.password, salt);
        
        // 查询是否已存在相同email的用户
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', user.email)
          .maybeSingle();
        
        if (queryError) {
          results.push({
            email: user.email,
            success: false,
            message: `查询用户失败: ${queryError.message}`,
            error: queryError
          });
          continue;
        }
        
        // 如果用户已存在
        if (existingUser) {
          results.push({
            email: user.email,
            success: false,
            message: '用户已存在',
            user: { id: existingUser.id, email: existingUser.email }
          });
          continue;
        }
        
        // 插入新用户
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              name: user.name,
              email: user.email,
              password_hash,
              role: user.role,
              phone: user.phone
            }
          ])
          .select('id, email, role, name, created_at')
          .single();
        
        if (insertError) {
          results.push({
            email: user.email,
            success: false,
            message: `创建用户失败: ${insertError.message}`,
            error: insertError
          });
          continue;
        }
        
        results.push({
          email: user.email,
          success: true,
          message: '用户创建成功',
          user: newUser
        });
      } catch (error: any) {
        results.push({
          email: user.email,
          success: false,
          message: `处理用户出错: ${error.message}`,
          error: error.toString()
        });
      }
    }
    
    return NextResponse.json({
      success: results.some(r => r.success), // 至少有一个用户创建成功
      message: '测试用户创建完成',
      results
    });
  } catch (error: any) {
    console.error('创建测试用户失败:', error);
    return NextResponse.json({ 
      success: false,
      error: `创建测试用户失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 