import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// 此API路由用于通过直接SQL插入创建测试用户
export async function GET(request: Request) {
  try {
    console.log('开始创建测试用户(使用SQL直接插入)...');
    
    // 创建数据库连接池
    const pool = new Pool({
      connectionString: process.env.SUPABASE_DIRECT_DB_URL,
    });
    
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
    
    // 获取数据库连接
    const client = await pool.connect();
    
    try {
      // 开始事务
      await client.query('BEGIN');
      
      // 为每个用户生成密码哈希并插入数据库
      for (const user of users) {
        try {
          // 生成密码哈希
          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(user.password, salt);
          
          // 查询是否已存在相同email的用户
          const existingUserResult = await client.query(
            'SELECT id, email FROM users WHERE email = $1',
            [user.email]
          );
          
          if (existingUserResult.rows.length > 0) {
            results.push({
              email: user.email,
              success: false,
              message: '用户已存在',
              user: existingUserResult.rows[0]
            });
            continue;
          }
          
          // 插入新用户
          const insertResult = await client.query(
            `INSERT INTO users (id, name, email, password_hash, role, phone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, email, role, name, created_at`,
            [user.id, user.name, user.email, password_hash, user.role, user.phone]
          );
          
          if (insertResult.rows.length > 0) {
            results.push({
              email: user.email,
              success: true,
              message: '用户创建成功',
              user: insertResult.rows[0]
            });
          } else {
            results.push({
              email: user.email,
              success: false,
              message: '创建用户失败: 未返回新用户数据'
            });
          }
        } catch (error: any) {
          results.push({
            email: user.email,
            success: false,
            message: `处理用户出错: ${error.message}`,
            error: error.toString()
          });
        }
      }
      
      // 提交事务
      await client.query('COMMIT');
    } catch (error: any) {
      // 回滚事务
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 释放连接
      client.release();
    }
    
    // 关闭连接池
    await pool.end();
    
    return NextResponse.json({
      success: results.some(r => r.success), // 至少有一个用户创建成功
      message: '直接SQL插入用户完成',
      db_url: process.env.SUPABASE_DIRECT_DB_URL ? '已配置' : '未配置',
      results
    });
  } catch (error: any) {
    console.error('创建测试用户失败:', error);
    return NextResponse.json({ 
      success: false,
      error: `创建测试用户失败: ${error.message}`,
      stack: error.stack,
      db_url: process.env.SUPABASE_DIRECT_DB_URL ? '已配置' : '未配置',
    }, { status: 500 });
  }
} 