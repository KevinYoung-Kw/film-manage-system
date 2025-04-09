'use client';

import { useState, useEffect } from 'react';
import { testSupabaseConnection, testUrl } from '../lib/services/testSupabase';
import { supabaseAdmin } from '../lib/services/supabaseClient';

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [url, setUrl] = useState('https://hlfmexcsldkcymxlmcfu.supabase.co/rest/v1/movies?select=id,title&limit=1');
  const [moviesResult, setMoviesResult] = useState<any>(null);
  const [moviesLoading, setMoviesLoading] = useState(false);
  
  const handleTest = async () => {
    setLoading(true);
    try {
      const result = await testSupabaseConnection();
      setResult(result);
    } catch (error) {
      setResult({ success: false, message: String(error), error });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlTest = async () => {
    setUrlLoading(true);
    try {
      const result = await testUrl(url);
      setUrlResult(result);
    } catch (error) {
      setUrlResult({ success: false, message: String(error), error });
    } finally {
      setUrlLoading(false);
    }
  };
  
  const handleMoviesTest = async () => {
    setMoviesLoading(true);
    try {
      // 使用管理员客户端尝试绕过行级安全策略
      const { data, error } = await supabaseAdmin
        .from('movies')
        .select('id, title')
        .limit(5);
      
      if (error) {
        setMoviesResult({ 
          success: false, 
          message: `获取电影列表失败: ${error.message}`,
          error 
        });
      } else {
        setMoviesResult({ 
          success: true, 
          message: '成功获取电影列表',
          data
        });
      }
    } catch (error: any) {
      setMoviesResult({ 
        success: false, 
        message: `异常: ${error.message || '未知错误'}`,
        error
      });
    } finally {
      setMoviesLoading(false);
    }
  };

  useEffect(() => {
    handleTest();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase 连接测试</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Supabase 客户端测试</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleTest}
          disabled={loading}
        >
          {loading ? '测试中...' : '测试连接'}
        </button>

        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">{result.success ? '✅ 成功' : '❌ 失败'}</p>
            <p className="mb-2">{result.message}</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">电影列表测试 (绕过RLS)</h2>
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleMoviesTest}
          disabled={moviesLoading}
        >
          {moviesLoading ? '获取中...' : '获取电影列表'}
        </button>

        {moviesResult && (
          <div className={`p-4 rounded ${moviesResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">{moviesResult.success ? '✅ 成功' : '❌ 失败'}</p>
            <p className="mb-2">{moviesResult.message}</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(moviesResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">直接 URL 测试</h2>
        <div className="mb-4">
          <label className="block mb-2">测试 URL:</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4"
          onClick={handleUrlTest}
          disabled={urlLoading}
        >
          {urlLoading ? '请求中...' : '测试 URL'}
        </button>

        {urlResult && (
          <div className={`p-4 rounded ${urlResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">{urlResult.success ? '✅ 成功' : '❌ 失败'}</p>
            <p className="mb-2">{urlResult.message}</p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
              {JSON.stringify(urlResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 