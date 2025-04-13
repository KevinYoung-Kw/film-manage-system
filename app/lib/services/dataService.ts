/**
 * 数据处理服务 - 处理数据格式转换、处理等通用功能
 */

/**
 * 处理图片URL
 * 1. 如果是相对路径，转换为绝对路径
 * 2. 如果是Supabase存储路径，添加域名
 * 3. 如果已经是完整URL，直接返回
 * 
 * @param url 原始URL
 * @returns 处理后的URL
 */
export const processImageUrl = (url: string): string => {
  // 如果URL为空，返回默认图片
  if (!url) return '/images/default-poster.jpg';
  
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果是Supabase存储路径
  if (url.startsWith('storage/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    return `${supabaseUrl}/${url}`;
  }
  
  // 如果是相对路径，转换为绝对路径
  // 这里假设相对路径是相对于/public目录
  return `/${url.replace(/^\//, '')}`;
};

/**
 * 格式化金额
 * @param amount 金额
 * @param currency 货币符号
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (amount: number, currency: string = '¥'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * 格式化日期时间
 * @param date 日期对象
 * @param format 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string => {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 格式化日期部分
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // 格式化时间部分
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // 根据格式返回
  switch (format) {
    case 'date':
      return dateStr;
    case 'time':
      return timeStr;
    case 'datetime':
    default:
      return `${dateStr} ${timeStr}`;
  }
};

/**
 * 截断文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * 生成分页参数
 * @param page 当前页码
 * @param pageSize 每页条数
 * @returns 分页参数
 */
export const getPaginationParams = (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

/**
 * 处理API响应错误
 * @param error 错误对象
 * @returns 格式化的错误信息
 */
export const handleApiError = (error: any): { message: string; status?: number } => {
  // Supabase 错误
  if (error?.code && error?.message) {
    return {
      message: error.message,
      status: error.code === 'PGRST116' ? 404 : 500  // PGRST116 是 "Not Found" 错误
    };
  }
  
  // HTTP 错误
  if (error?.status) {
    return {
      message: error.statusText || '请求失败',
      status: error.status
    };
  }
  
  // 一般错误
  return {
    message: error?.message || '发生未知错误',
    status: 500
  };
}; 