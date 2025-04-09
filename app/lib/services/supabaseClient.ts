import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase; 