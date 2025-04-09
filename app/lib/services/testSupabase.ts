import supabase from './supabaseClient';

/**
 * 测试 Supabase 连接
 * 尝试从 movies 表中获取一条记录，验证连接是否正常
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}> => {
  try {
    console.log('测试 Supabase 连接...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('API Key 长度:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);

    const { data, error } = await supabase
      .from('movies')
      .select('id, title')
      .limit(1);

    if (error) {
      console.error('Supabase 连接测试失败 - API 错误:', error);
      return {
        success: false,
        message: `API 错误: ${error.message || '未知错误'}`,
        error
      };
    }

    if (Array.isArray(data) && data.length > 0) {
      console.log('Supabase 连接测试成功:', data);
      return {
        success: true,
        message: '连接成功',
        data
      };
    } else {
      console.warn('Supabase 连接测试成功，但未返回数据');
      return {
        success: true,
        message: '连接成功，但未返回数据',
        data
      };
    }
  } catch (error: any) {
    console.error('Supabase 连接测试失败 - 异常:', error);
    return {
      success: false,
      message: `异常: ${error.message || '未知错误'}`,
      error
    };
  }
};

// 导出测试 URL 函数
export const testUrl = async (url: string): Promise<{
  success: boolean;
  message: string;
  status?: number;
  error?: any;
}> => {
  try {
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    return {
      success: response.ok,
      message: `状态: ${response.status} ${response.statusText}`,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      message: `请求失败: ${error.message || '未知错误'}`,
      error
    };
  }
}; 