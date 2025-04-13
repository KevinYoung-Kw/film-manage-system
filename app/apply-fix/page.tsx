'use client'

import { useEffect, useState } from 'react';
import supabase, { supabaseAdmin } from '../lib/services/supabaseClient';

export default function ApplyFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const applyFix = async () => {
    setLoading(true);
    try {
      // 测试当前状态
      const testQuery = await supabase
        .from('users')
        .select('id, name, email')
        .limit(1);
        
      if (testQuery.error) {
        setResult({ 
          success: false, 
          message: `当前状态：无法查询 users 表: ${testQuery.error.message}`,
          error: testQuery.error
        });
        
        // 如果发生了无限递归错误，提供更彻底的修复脚本
        if (testQuery.error.message && testQuery.error.message.includes('infinite recursion')) {
          // 提供更彻底的修复脚本
          const completeFixScript = `
-- 更彻底的修复方案：解决users表策略的无限递归问题

-- 1. 首先禁用Row Level Security，以确保我们可以执行修复
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有与users表相关的策略
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS policy_users_select ON users;
DROP POLICY IF EXISTS policy_users_update ON users;
DROP POLICY IF EXISTS policy_users_insert ON users;
DROP POLICY IF EXISTS policy_users_delete ON users;

-- 3. 优化用户角色判断函数，避免递归查询
-- 使用auth.jwt()而不是查询users表
CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS TEXT AS $$
DECLARE
  _role TEXT;
BEGIN
  BEGIN
    -- 尝试从JWT获取角色
    _role := nullif(current_setting('request.jwt.claims', true)::json->>'role', '');
    RETURN _role;
  EXCEPTION WHEN OTHERS THEN
    -- 如果获取失败，返回null
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建优化版本的角色检查函数
CREATE OR REPLACE FUNCTION public.is_admin_safe() RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_auth_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff_safe() RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_auth_role() IN ('admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 修复原有函数
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_staff_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 重新启用Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. 创建新的、简化的RLS策略
-- SELECT: 用户可以查看自己的信息，管理员可以查看所有用户，员工可以查看其他员工
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    is_admin_safe() OR 
    (is_staff_safe() AND role = 'staff')
  );

-- UPDATE: 用户可以更新自己的信息，管理员可以更新所有用户信息
CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    is_admin_safe()
  );

-- INSERT: 只有管理员可以添加用户
CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (
    is_admin_safe()
  );

-- DELETE: 只有管理员可以删除用户
CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (
    is_admin_safe()
  );`;
          
          setResult((prev: any) => ({
            ...prev,
            manualFix: true,
            fixScript: completeFixScript
          }));
        }
      } else {
        setResult({ 
          success: true, 
          message: '用户表查询成功，无需修复',
          data: testQuery.data
        });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: `异常: ${error.message || '未知错误'}`,
        error
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFixScript = () => {
    if (!result?.fixScript) return;
    
    const element = document.createElement('a');
    const file = new Blob([result.fixScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'fix_policy_recursion.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">应用 Supabase 策略修复</h1>
      
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded">
        <h2 className="font-semibold text-amber-800">使用说明</h2>
        <ol className="list-decimal ml-5 mt-2 text-amber-800">
          <li>点击"检测问题"按钮，系统将检查是否存在无限递归问题</li>
          <li>如果检测到问题，将生成修复脚本</li>
          <li>点击"下载修复脚本"，将脚本保存到本地</li>
          <li>登录到 Supabase Studio，选择 SQL 编辑器</li>
          <li>粘贴并执行下载的 SQL 脚本</li>
          <li>刷新页面，再次点击"检测问题"确认是否修复成功</li>
        </ol>
      </div>
      
      <button
        onClick={applyFix}
        disabled={loading}
        className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
      >
        {loading ? '执行中...' : '检测问题'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">
            检测结果: {result.success ? '✅ 成功' : '❌ 失败'}
          </h2>
          <p className="mt-2">{result.message}</p>
          
          {result.error && (
            <pre className="mt-2 p-2 bg-red-50 text-red-800 rounded overflow-auto text-sm">
              {JSON.stringify(result.error, null, 2)}
            </pre>
          )}
          
          {result.data && (
            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
          
          {result.manualFix && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-red-600">
                需要手动修复无限递归问题
              </h3>
              <p>请下载SQL修复脚本并在Supabase Studio的SQL编辑器中执行：</p>
              
              <button
                onClick={downloadFixScript}
                className="mt-2 px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
              >
                下载修复脚本
              </button>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold text-blue-800">修复说明</h4>
                <p className="mt-1 text-blue-800">此脚本将：</p>
                <ol className="list-decimal ml-5 mt-1 text-blue-800 text-sm">
                  <li>暂时禁用 users 表的 RLS</li>
                  <li>删除所有可能导致递归的策略</li>
                  <li>创建一个安全的角色判断函数</li>
                  <li>重新建立正确的安全策略</li>
                  <li>重新启用 RLS</li>
                </ol>
              </div>
              
              <pre className="mt-4 p-2 bg-gray-50 rounded overflow-auto text-xs h-64 overflow-y-auto">
                {result.fixScript}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 