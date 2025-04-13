import supabase from './supabaseClient';

/**
 * 使用凭据登录并设置用户元数据
 * 这个强化版本确保角色信息被正确设置到auth.user_metadata
 * 
 * @param email 用户邮箱
 * @param role 用户角色 ('admin', 'staff', 'customer')
 * @param userId 用户ID (数据库中的)
 * @returns 登录是否成功
 */
export const enhancedSignInWithCredentials = async (
  email: string, 
  role: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log('使用增强版Auth登录:', { email, role, userId });
    
    // 1. 尝试使用密码登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'film-system-token-' + userId.substring(0, 8)
    });

    // 2. 如果登录失败，尝试注册新用户
    if (error) {
      console.log('登录失败，尝试创建用户...', error);
      
      // 创建新用户
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: 'film-system-token-' + userId.substring(0, 8),
        options: {
          data: {
            role: role,
            user_db_id: userId,
            name: email.split('@')[0]
          }
        }
      });

      if (signUpError) {
        console.error('创建用户失败:', signUpError);
        throw signUpError;
      }

      if (!signUpData?.user) {
        console.error('创建用户成功但未返回用户对象');
        return false;
      }
      
      console.log('新用户创建并登录成功', signUpData.user);
      
      // 3. 保存会话信息到localStorage
      saveSessionToLocalStorage(userId, email, role);
      
      return true;
    }

    // 4. 登录成功后，确保元数据包含正确的角色和用户ID
    if (data.user) {
      // 检查metadata是否包含正确的角色信息
      const needUpdate = 
        data.user.user_metadata?.role !== role || 
        data.user.user_metadata?.user_db_id !== userId;
      
      if (needUpdate) {
        console.log('需要更新用户元数据', { 
          currentRole: data.user.user_metadata?.role, 
          newRole: role,
          userId
        });
        
        // 更新用户元数据，确保角色信息正确
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            role: role,
            user_db_id: userId,
            name: data.user.user_metadata?.name || email.split('@')[0]
          }
        });
        
        if (updateError) {
          console.warn('更新用户元数据失败:', updateError);
        } else {
          console.log('用户元数据已更新');
        }
      }
    }

    // 5. 保存会话信息到localStorage
    saveSessionToLocalStorage(userId, email, role);
    
    console.log('Supabase Auth登录成功');
    return true;
  } catch (error) {
    console.error('登录过程发生错误:', error);
    return false;
  }
};

/**
 * 保存会话信息到localStorage
 */
const saveSessionToLocalStorage = (userId: string, email: string, role: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('session', JSON.stringify({
      user_id: userId,
      email: email,
      role: role
    }));
  }
};

export default enhancedSignInWithCredentials; 