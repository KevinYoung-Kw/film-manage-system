import supabase from './supabaseClient';

// 测试Supabase连接
export const testSupabaseConnection = async () => {
  try {
    // 尝试查询版本信息
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      return { 
        success: false, 
        message: `Supabase连接错误: ${error.message}`, 
        error 
      };
    }
    
    return { 
      success: true, 
      message: '成功连接到Supabase', 
      data,
      jwt_status: await checkJwtSecret()
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `执行测试查询时出错: ${error.message}`, 
      error 
    };
  }
};

// 通过URL测试Supabase REST API
export const testUrl = async (url: string) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!apiKey) {
      return { 
        success: false, 
        message: '未配置Supabase匿名密钥' 
      };
    }
    
    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const data = await response.json();
    
    return { 
      success: response.ok, 
      message: response.ok ? 'URL测试成功' : `URL测试失败: ${response.statusText}`,
      status: response.status,
      data
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `访问URL时出错: ${error.message}`, 
      error 
    };
  }
};

// 检查JWT密钥状态
export const checkJwtSecret = async () => {
  try {
    // 尝试使用RPC函数检查JWT密钥
    const { data, error } = await supabase.rpc('check_jwt_secret');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return {
          configured: false,
          message: 'check_jwt_secret函数不存在'
        };
      }
      
      if (error.message.includes('JWT')) {
        return {
          configured: false,
          message: 'JWT密钥未配置或无效',
          error: error.message
        };
      }
      
      return {
        configured: false,
        message: `检查JWT密钥失败: ${error.message}`,
        error
      };
    }
    
    return {
      configured: true,
      message: 'JWT密钥已正确配置',
      data
    };
  } catch (error: any) {
    return {
      configured: false,
      message: `检查JWT密钥时出错: ${error.message}`,
      error
    };
  }
}; 