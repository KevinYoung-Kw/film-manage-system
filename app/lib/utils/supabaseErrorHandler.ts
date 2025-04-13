/**
 * Supabase 错误处理工具
 * 
 * 这个文件提供了一些辅助函数来处理 Supabase 请求中的常见错误
 * 包括网络错误、超时错误和 API 错误
 */

// 错误类型定义
type SupabaseError = {
  message?: string;
  code?: string;
  statusCode?: number;
  status?: number;
  name?: string;
};

// 重试选项接口
interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (error: SupabaseError, attempt: number, delayMs: number) => void;
}

// 检查是否是网络错误
export const isNetworkError = (error: SupabaseError): boolean => {
  return !!(
    error.message?.includes('Failed to fetch') || 
    error.message?.includes('Network Error') ||
    error.message?.includes('network request failed') ||
    error instanceof TypeError && error.message?.includes('fetch')
  );
};

// 检查是否是超时错误
export const isTimeoutError = (error: SupabaseError): boolean => {
  return !!(
    error.name === 'AbortError' ||
    error.message?.includes('timeout') ||
    error.message?.includes('Timeout') ||
    error.message?.includes('aborted')
  );
};

// 检查是否是 Supabase API 错误
export const isSupabaseApiError = (error: SupabaseError): boolean => {
  return !!(
    error.code === '500' ||
    error.statusCode === 500 ||
    error.status === 500 ||
    error.message?.includes('500')
  );
};

// 延迟函数
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 带重试的 Supabase 请求函数
export const retrySupabaseRequest = async <T>(
  requestFn: () => Promise<T>, 
  options: RetryOptions = {}
): Promise<T> => {
  const { 
    maxRetries = 3, 
    initialDelayMs = 1000, 
    backoffFactor = 2,
    onRetry = null
  } = options;
  
  let lastError: any = null;
  let delayMs = initialDelayMs;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 尝试请求
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // 如果这是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 根据错误类型决定是否重试
      const shouldRetry = 
        isNetworkError(error) || 
        isTimeoutError(error) || 
        isSupabaseApiError(error);
      
      if (!shouldRetry) {
        throw error; // 不需要重试的错误直接抛出
      }
      
      // 调用重试回调
      if (onRetry) {
        onRetry(error, attempt + 1, delayMs);
      }
      
      // 等待指定时间后重试
      await delay(delayMs);
      
      // 增加下次重试的延迟时间
      delayMs *= backoffFactor;
    }
  }
  
  // 如果所有重试都失败了，抛出最后一个错误
  throw lastError;
}; 