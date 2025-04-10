import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// 此API路由用于初始化测试数据库
export async function GET(request: Request) {
  try {
    console.log('开始初始化测试数据库...');
    
    // 获取SQL文件
    let sqlScript;
    try {
      const filePath = path.join(process.cwd(), 'supabase', 'migrations', 'DATABASE_RESET.sql');
      sqlScript = await fs.readFile(filePath, 'utf8');
      console.log(`已读取SQL文件，大小: ${sqlScript.length} 字节`);
    } catch (fileError: any) {
      return NextResponse.json({ 
        success: false,
        message: '无法读取SQL文件',
        error: fileError.message
      }, { status: 500 });
    }
    
    // 获取函数文件
    let functionScript, rpcScript;
    try {
      const functionPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_session_function.sql');
      const rpcPath = path.join(process.cwd(), 'supabase', 'migrations', 'enable_rpc_functions.sql');
      
      functionScript = await fs.readFile(functionPath, 'utf8');
      rpcScript = await fs.readFile(rpcPath, 'utf8');
      
      console.log(`已读取函数SQL文件，大小: ${functionScript.length} 字节`);
      console.log(`已读取RPC权限SQL文件，大小: ${rpcScript.length} 字节`);
    } catch (fileError: any) {
      console.warn('无法读取辅助SQL文件:', fileError.message);
    }
    
    // 创建数据库连接池
    if (!process.env.SUPABASE_DIRECT_DB_URL) {
      return NextResponse.json({ 
        success: false,
        message: '未配置SUPABASE_DIRECT_DB_URL环境变量',
        expectedFormat: 'postgresql://<user>:<password>@<host>:<port>/<database>'
      }, { status: 500 });
    }
    
    const pool = new Pool({
      connectionString: process.env.SUPABASE_DIRECT_DB_URL,
    });
    
    // 获取数据库连接
    const client = await pool.connect();
    
    try {
      console.log('开始执行SQL脚本...');
      
      // 执行主要SQL脚本
      await client.query(sqlScript);
      console.log('主数据库重置SQL脚本执行完成');
      
      // 执行函数SQL脚本
      if (functionScript) {
        await client.query(functionScript);
        console.log('会话函数SQL脚本执行完成');
      }
      
      // 执行RPC权限SQL脚本
      if (rpcScript) {
        await client.query(rpcScript);
        console.log('RPC权限SQL脚本执行完成');
      }
      
      return NextResponse.json({
        success: true,
        message: '测试数据库初始化成功',
        schemas: ['users', 'movies', 'theaters', 'showtimes', 'tickets', 'orders']
      });
    } catch (error: any) {
      console.error('执行SQL失败:', error);
      return NextResponse.json({ 
        success: false,
        message: `初始化数据库失败: ${error.message}`,
        error: error.toString()
      }, { status: 500 });
    } finally {
      // 释放连接
      client.release();
      
      // 关闭连接池
      await pool.end();
    }
  } catch (error: any) {
    console.error('初始化测试数据库失败:', error);
    return NextResponse.json({ 
      success: false,
      error: `初始化数据库失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 