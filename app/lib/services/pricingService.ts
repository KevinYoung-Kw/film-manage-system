import supabase from './supabaseClient';

export interface TicketTypeModel {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  isActive: boolean;
}

export interface PricingStrategyModel {
  id: string;
  name: string;
  description: string;
  conditionType: string;
  conditionValue: string | null;
  discountPercentage?: number | null;
  extraCharge?: number | null;
  isActive: boolean;
}

/**
 * 票价服务 - 处理票价类型和票价策略
 */
export const PricingService = {
  /**
   * 获取所有票价类型
   * @returns 票价类型列表
   */
  getAllTicketTypes: async (): Promise<TicketTypeModel[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .order('base_price', { ascending: false });

      if (error) {
        throw new Error('获取票价类型失败: ' + error.message);
      }

      return data.map(type => ({
        id: type.id,
        name: type.name,
        basePrice: type.base_price,
        description: type.description || '',
        isActive: type.is_active
      }));
    } catch (error) {
      console.error('获取票价类型失败:', error);
      throw error;
    }
  },

  /**
   * 获取票价类型详情
   * @param id 票价类型ID
   * @returns 票价类型详情
   */
  getTicketTypeById: async (id: string): Promise<TicketTypeModel | null> => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取票价类型详情失败:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        basePrice: data.base_price,
        description: data.description || '',
        isActive: data.is_active
      };
    } catch (error) {
      console.error('获取票价类型详情失败:', error);
      return null;
    }
  },

  /**
   * 创建票价类型
   * @param ticketType 票价类型信息
   * @returns 创建的票价类型
   */
  createTicketType: async (ticketType: Omit<TicketTypeModel, 'id'>): Promise<TicketTypeModel | null> => {
    try {
      const { data, error } = await supabase
        .from('ticket_types')
        .insert([{
          name: ticketType.name,
          base_price: ticketType.basePrice,
          description: ticketType.description,
          is_active: ticketType.isActive
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建票价类型失败: ' + error.message);
      }

      return {
        id: data.id,
        name: data.name,
        basePrice: data.base_price,
        description: data.description || '',
        isActive: data.is_active
      };
    } catch (error) {
      console.error('创建票价类型失败:', error);
      throw error;
    }
  },

  /**
   * 更新票价类型
   * @param id 票价类型ID
   * @param ticketType 更新的票价类型信息
   * @returns 更新后的票价类型
   */
  updateTicketType: async (id: string, ticketType: Partial<TicketTypeModel>): Promise<TicketTypeModel | null> => {
    try {
      const updateData: any = {};
      if (ticketType.name !== undefined) updateData.name = ticketType.name;
      if (ticketType.basePrice !== undefined) updateData.base_price = ticketType.basePrice;
      if (ticketType.description !== undefined) updateData.description = ticketType.description;
      if (ticketType.isActive !== undefined) updateData.is_active = ticketType.isActive;

      const { data, error } = await supabase
        .from('ticket_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('更新票价类型失败: ' + error.message);
      }

      return {
        id: data.id,
        name: data.name,
        basePrice: data.base_price,
        description: data.description || '',
        isActive: data.is_active
      };
    } catch (error) {
      console.error('更新票价类型失败:', error);
      throw error;
    }
  },

  /**
   * 删除票价类型
   * @param id 票价类型ID
   * @returns 是否成功
   */
  deleteTicketType: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ticket_types')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('删除票价类型失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除票价类型失败:', error);
      throw error;
    }
  },

  /**
   * 获取所有票价策略
   * @returns 票价策略列表
   */
  getAllPricingStrategies: async (): Promise<PricingStrategyModel[]> => {
    try {
      const { data, error } = await supabase
        .from('pricing_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('获取票价策略失败: ' + error.message);
      }

      return data.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        description: strategy.description || '',
        conditionType: strategy.condition_type,
        conditionValue: strategy.condition_value,
        discountPercentage: strategy.discount_percentage,
        extraCharge: strategy.extra_charge,
        isActive: strategy.is_active
      }));
    } catch (error) {
      console.error('获取票价策略失败:', error);
      throw error;
    }
  },

  /**
   * 获取票价策略详情
   * @param id 票价策略ID
   * @returns 票价策略详情
   */
  getPricingStrategyById: async (id: string): Promise<PricingStrategyModel | null> => {
    try {
      const { data, error } = await supabase
        .from('pricing_strategies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取票价策略详情失败:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        conditionType: data.condition_type,
        conditionValue: data.condition_value,
        discountPercentage: data.discount_percentage,
        extraCharge: data.extra_charge,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('获取票价策略详情失败:', error);
      return null;
    }
  },

  /**
   * 创建票价策略
   * @param strategy 票价策略信息
   * @returns 创建的票价策略
   */
  createPricingStrategy: async (strategy: Omit<PricingStrategyModel, 'id'>): Promise<PricingStrategyModel | null> => {
    try {
      const { data, error } = await supabase
        .from('pricing_strategies')
        .insert([{
          name: strategy.name,
          description: strategy.description,
          condition_type: strategy.conditionType,
          condition_value: strategy.conditionValue,
          discount_percentage: strategy.discountPercentage,
          extra_charge: strategy.extraCharge,
          is_active: strategy.isActive
        }])
        .select()
        .single();

      if (error) {
        throw new Error('创建票价策略失败: ' + error.message);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        conditionType: data.condition_type,
        conditionValue: data.condition_value,
        discountPercentage: data.discount_percentage,
        extraCharge: data.extra_charge,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('创建票价策略失败:', error);
      throw error;
    }
  },

  /**
   * 更新票价策略
   * @param id 票价策略ID
   * @param strategy 更新的票价策略信息
   * @returns 更新后的票价策略
   */
  updatePricingStrategy: async (id: string, strategy: Partial<PricingStrategyModel>): Promise<PricingStrategyModel | null> => {
    try {
      const updateData: any = {};
      if (strategy.name !== undefined) updateData.name = strategy.name;
      if (strategy.description !== undefined) updateData.description = strategy.description;
      if (strategy.conditionType !== undefined) updateData.condition_type = strategy.conditionType;
      if (strategy.conditionValue !== undefined) updateData.condition_value = strategy.conditionValue;
      if (strategy.discountPercentage !== undefined) updateData.discount_percentage = strategy.discountPercentage;
      if (strategy.extraCharge !== undefined) updateData.extra_charge = strategy.extraCharge;
      if (strategy.isActive !== undefined) updateData.is_active = strategy.isActive;

      const { data, error } = await supabase
        .from('pricing_strategies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('更新票价策略失败: ' + error.message);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        conditionType: data.condition_type,
        conditionValue: data.condition_value,
        discountPercentage: data.discount_percentage,
        extraCharge: data.extra_charge,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('更新票价策略失败:', error);
      throw error;
    }
  },

  /**
   * 删除票价策略
   * @param id 票价策略ID
   * @returns 是否成功
   */
  deletePricingStrategy: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pricing_strategies')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('删除票价策略失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除票价策略失败:', error);
      throw error;
    }
  },

  /**
   * 获取票务类型的所有关联定价策略
   * @param ticketTypeId 票务类型ID
   * @returns 定价策略ID列表
   */
  getTicketTypePricingStrategies: async (ticketTypeId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_type_pricing_strategies')
        .select('pricing_strategy_id')
        .eq('ticket_type_id', ticketTypeId);

      if (error) {
        throw new Error('获取票务类型关联定价策略失败: ' + error.message);
      }

      return data.map(item => item.pricing_strategy_id);
    } catch (error) {
      console.error('获取票务类型关联定价策略失败:', error);
      throw error;
    }
  },

  /**
   * 获取定价策略关联的所有票务类型
   * @param pricingStrategyId 定价策略ID
   * @returns 票务类型ID列表
   */
  getPricingStrategyTicketTypes: async (pricingStrategyId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_type_pricing_strategies')
        .select('ticket_type_id')
        .eq('pricing_strategy_id', pricingStrategyId);

      if (error) {
        throw new Error('获取定价策略关联票务类型失败: ' + error.message);
      }

      return data.map(item => item.ticket_type_id);
    } catch (error) {
      console.error('获取定价策略关联票务类型失败:', error);
      throw error;
    }
  },

  /**
   * 关联票务类型和定价策略
   * @param ticketTypeId 票务类型ID
   * @param pricingStrategyId 定价策略ID
   * @returns 是否成功
   */
  associateTicketTypeWithPricingStrategy: async (ticketTypeId: string, pricingStrategyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ticket_type_pricing_strategies')
        .insert([{
          ticket_type_id: ticketTypeId,
          pricing_strategy_id: pricingStrategyId
        }]);

      if (error) {
        throw new Error('关联票务类型和定价策略失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('关联票务类型和定价策略失败:', error);
      throw error;
    }
  },

  /**
   * 取消票务类型和定价策略的关联
   * @param ticketTypeId 票务类型ID
   * @param pricingStrategyId 定价策略ID
   * @returns 是否成功
   */
  disassociateTicketTypeFromPricingStrategy: async (ticketTypeId: string, pricingStrategyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ticket_type_pricing_strategies')
        .delete()
        .eq('ticket_type_id', ticketTypeId)
        .eq('pricing_strategy_id', pricingStrategyId);

      if (error) {
        throw new Error('取消票务类型和定价策略关联失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('取消票务类型和定价策略关联失败:', error);
      throw error;
    }
  },

  /**
   * 批量关联票务类型和定价策略
   * @param ticketTypeId 票务类型ID
   * @param pricingStrategyIds 定价策略ID列表
   * @returns 是否成功
   */
  updateTicketTypePricingStrategies: async (ticketTypeId: string, pricingStrategyIds: string[]): Promise<boolean> => {
    try {
      // 首先删除所有现有关联
      const { error: deleteError } = await supabase
        .from('ticket_type_pricing_strategies')
        .delete()
        .eq('ticket_type_id', ticketTypeId);

      if (deleteError) {
        throw new Error('删除现有关联失败: ' + deleteError.message);
      }

      // 如果没有新的策略需要关联，直接返回成功
      if (pricingStrategyIds.length === 0) {
        return true;
      }

      // 创建新的关联
      const insertData = pricingStrategyIds.map(strategyId => ({
        ticket_type_id: ticketTypeId,
        pricing_strategy_id: strategyId
      }));

      const { error: insertError } = await supabase
        .from('ticket_type_pricing_strategies')
        .insert(insertData);

      if (insertError) {
        throw new Error('创建新关联失败: ' + insertError.message);
      }

      return true;
    } catch (error) {
      console.error('更新票务类型关联定价策略失败:', error);
      throw error;
    }
  },

  /**
   * 批量关联定价策略和票务类型
   * @param pricingStrategyId 定价策略ID
   * @param ticketTypeIds 票务类型ID列表
   * @returns 是否成功
   */
  updatePricingStrategyTicketTypes: async (pricingStrategyId: string, ticketTypeIds: string[]): Promise<boolean> => {
    try {
      // 首先删除所有现有关联
      const { error: deleteError } = await supabase
        .from('ticket_type_pricing_strategies')
        .delete()
        .eq('pricing_strategy_id', pricingStrategyId);

      if (deleteError) {
        throw new Error('删除现有关联失败: ' + deleteError.message);
      }

      // 如果没有新的票务类型需要关联，直接返回成功
      if (ticketTypeIds.length === 0) {
        return true;
      }

      // 创建新的关联
      const insertData = ticketTypeIds.map(typeId => ({
        ticket_type_id: typeId,
        pricing_strategy_id: pricingStrategyId
      }));

      const { error: insertError } = await supabase
        .from('ticket_type_pricing_strategies')
        .insert(insertData);

      if (insertError) {
        throw new Error('创建新关联失败: ' + insertError.message);
      }

      return true;
    } catch (error) {
      console.error('更新定价策略关联票务类型失败:', error);
      throw error;
    }
  }
}; 