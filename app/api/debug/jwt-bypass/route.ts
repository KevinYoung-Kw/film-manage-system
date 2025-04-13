import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = '25uquG8Im6X5cGGHIlFY7pZxoXjqRB9dGLERMltl2cJzxPPEzhoYo5b0y43Mfj/0J8Q5VRsDtQXuDKeaZueNWg==';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'admin@example.com';
  const role = searchParams.get('role') || 'admin';
  const user_id = searchParams.get('user_id') || uuidv4();

  try {
    console.log(`调试API: 生成JWT令牌`, { email, role, user_id });
    
    // 创建JWT令牌有效期为7天
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (3600 * 24 * 7); // 7天后过期
    
    // 创建JWT负载
    const payload = {
      role: role,
      iss: 'supabase',
      sub: user_id,
      email: email,
      exp: exp,
      iat: now,
      nbf: now
    };
    
    // 签名JWT
    const token = jwt.sign(payload, JWT_SECRET);
    
    // 创建刷新令牌 (30天有效)
    const refreshToken = jwt.sign(
      { 
        sub: user_id,
        refresh: true,
        exp: now + (3600 * 24 * 30) // 30天刷新令牌
      }, 
      JWT_SECRET
    );
    
    // 返回令牌信息
    return NextResponse.json({
      success: true,
      access_token: token,
      refresh_token: refreshToken,
      expires_at: new Date(exp * 1000).toISOString(),
      user: {
        id: user_id,
        email: email,
        role: role
      },
      payload
    });
  } catch (error: any) {
    console.error('调试API: JWT生成失败:', error);
    return NextResponse.json({ 
      error: `JWT生成失败: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 