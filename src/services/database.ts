import { supabase, TABLES, DatabaseAgent, DatabaseUser, DatabaseBattle, DatabaseBattleLog, DatabaseTransaction, DatabaseLiquidityStake, DatabaseLiquidityPool, DatabaseRoundStats } from '../lib/supabase';
import { Agent } from '../types';

// ==================== Agent 服务 ====================
export const AgentService = {
  // 获取所有 Agents
  async getAllAgents(): Promise<DatabaseAgent[]> {
    const { data, error } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // 获取用户的 Agents
  async getUserAgents(ownerId: string): Promise<DatabaseAgent[]> {
    const { data, error } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // 获取系统 Agents
  async getSystemAgents(limit: number = 1000): Promise<DatabaseAgent[]> {
    const { data, error } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .eq('is_player', false)
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  // 创建 Agent
  async createAgent(agent: Partial<DatabaseAgent>): Promise<DatabaseAgent> {
    const { data, error } = await supabase
      .from(TABLES.AGENTS)
      .insert(agent)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 更新 Agent
  async updateAgent(id: string, updates: Partial<DatabaseAgent>): Promise<DatabaseAgent> {
    const { data, error } = await supabase
      .from(TABLES.AGENTS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 批量更新 Agents
  async batchUpdateAgents(agents: { id: string; [key: string]: any }[]): Promise<void> {
    const updates = agents.map(agent => ({
      ...agent,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(TABLES.AGENTS)
      .upsert(updates);
    
    if (error) throw error;
  },

  // 删除 Agent
  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.AGENTS)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== User 服务 ====================
export const UserService = {
  // 获取或创建用户（以用户名为唯一标识）
  async getOrCreateUser(userData: Partial<DatabaseUser>): Promise<DatabaseUser> {
    // 优先使用用户名作为唯一标识
    if (userData.username) {
      const { data: existingUser, error: queryError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('username', userData.username)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      if (existingUser) {
        // 更新登录信息，保留原有数据
        const { data: updatedUser, error: updateError } = await supabase
          .from(TABLES.USERS)
          .update({
            wallet_address: userData.wallet_address || existingUser.wallet_address,
            avatar: userData.avatar || existingUser.avatar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return updatedUser;
      }
    }

    // 创建新用户
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        ...userData,
        balance: userData.balance || 10000,
        total_profit: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 通过用户名获取用户
  async getUserByUsername(username: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  },

  // 更新用户余额
  async updateBalance(userId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ 
        balance: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // 获取用户信息
  async getUserById(userId: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // 通过地址获取用户
  async getUserByAddress(address: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('wallet_address', address)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // 创建用户（如果已存在则返回现有用户）
  async createUser(userData: Partial<DatabaseUser>): Promise<DatabaseUser> {
    // 先检查是否已存在
    if (userData.wallet_address) {
      const existing = await this.getUserByAddress(userData.wallet_address);
      if (existing) {
        return existing;
      }
    }
    
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== Battle 服务 ====================
export const BattleService = {
  // 创建战斗记录
  async createBattle(battle: Partial<DatabaseBattle>): Promise<DatabaseBattle> {
    const { data, error } = await supabase
      .from(TABLES.BATTLES)
      .insert(battle)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新战斗结果
  async endBattle(battleId: string, winnerId: string, totalPrize: number): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BATTLES)
      .update({
        winner_id: winnerId,
        ended_at: new Date().toISOString(),
        total_prize: totalPrize,
      })
      .eq('id', battleId);

    if (error) throw error;
  },

  // 获取最近的战斗
  async getRecentBattles(limit: number = 10): Promise<DatabaseBattle[]> {
    const { data, error } = await supabase
      .from(TABLES.BATTLES)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // 添加战斗日志
  async addBattleLog(log: Partial<DatabaseBattleLog>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BATTLE_LOGS)
      .insert(log);

    if (error) throw error;
  },

  // 获取战斗日志
  async getBattleLogs(battleId: string): Promise<DatabaseBattleLog[]> {
    const { data, error } = await supabase
      .from(TABLES.BATTLE_LOGS)
      .select('*')
      .eq('battle_id', battleId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

// ==================== Transaction 服务 ====================
export const TransactionService = {
  // 创建交易记录
  async createTransaction(transaction: Partial<DatabaseTransaction>): Promise<DatabaseTransaction> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新交易状态
  async updateTransactionStatus(
    transactionId: string, 
    status: 'pending' | 'completed' | 'failed',
    txHash?: string
  ): Promise<void> {
    const updates: any = { status };
    if (txHash) updates.tx_hash = txHash;

    const { error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update(updates)
      .eq('id', transactionId);

    if (error) throw error;
  },

  // 获取用户的交易记录
  async getUserTransactions(userId: string, limit: number = 50): Promise<DatabaseTransaction[]> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// ==================== Liquidity 服务 ====================
export const LiquidityService = {
  // 获取流动性池状态
  async getLiquidityPool(): Promise<DatabaseLiquidityPool | null> {
    const { data, error } = await supabase
      .from(TABLES.LIQUIDITY_POOL)
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching liquidity pool:', error);
      return null;
    }
    return data;
  },

  // 更新流动性池
  async updateLiquidityPool(updates: Partial<DatabaseLiquidityPool>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.LIQUIDITY_POOL)
      .upsert({
        id: 1,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // 创建质押记录
  async createStake(stake: Partial<DatabaseLiquidityStake>): Promise<DatabaseLiquidityStake> {
    console.log('[LiquidityService] Creating stake:', stake);
    const { data, error } = await supabase
      .from(TABLES.LIQUIDITY_STAKES)
      .insert(stake)
      .select()
      .single();

    if (error) {
      console.error('[LiquidityService] Create stake error:', error);
      throw error;
    }
    console.log('[LiquidityService] Stake created:', data);
    return data;
  },

  // 获取用户的活跃质押
  async getUserActiveStakes(userAddress: string): Promise<DatabaseLiquidityStake[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LIQUIDITY_STAKES)
        .select('*')
        .eq('user_address', userAddress)
        .eq('status', 'active')
        .order('staked_at', { ascending: false });

      if (error) {
        console.error('[LiquidityService] getUserActiveStakes error:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[LiquidityService] getUserActiveStakes exception:', err);
      return [];
    }
  },

  // 获取用户的所有质押（包括已解押）
  async getUserAllStakes(userAddress: string): Promise<DatabaseLiquidityStake[]> {
    const { data, error } = await supabase
      .from(TABLES.LIQUIDITY_STAKES)
      .select('*')
      .eq('user_address', userAddress)
      .order('staked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 更新质押记录
  async updateStake(stakeId: string, updates: Partial<DatabaseLiquidityStake>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.LIQUIDITY_STAKES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stakeId);

    if (error) throw error;
  },

  // 解押（更新状态为unstaked）
  async unstake(stakeId: string, feeEarnings: number): Promise<void> {
    const { error } = await supabase
      .from(TABLES.LIQUIDITY_STAKES)
      .update({
        status: 'unstaked',
        total_fee_earnings: feeEarnings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stakeId);

    if (error) throw error;
  },

  // 获取所有活跃质押
  async getAllActiveStakes(): Promise<DatabaseLiquidityStake[]> {
    const { data, error } = await supabase
      .from(TABLES.LIQUIDITY_STAKES)
      .select('*')
      .eq('status', 'active')
      .order('staked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ==================== Round Stats 服务 ====================
export const RoundStatsService = {
  // 创建轮次统计
  async createRoundStats(stats: Partial<DatabaseRoundStats>): Promise<DatabaseRoundStats> {
    const { data, error } = await supabase
      .from(TABLES.ROUND_STATS)
      .insert(stats)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 获取所有轮次统计
  async getAllRoundStats(limit: number = 100): Promise<DatabaseRoundStats[]> {
    const { data, error } = await supabase
      .from(TABLES.ROUND_STATS)
      .select('*')
      .order('round_number', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // 获取最新轮次
  async getLatestRound(): Promise<DatabaseRoundStats | null> {
    const { data, error } = await supabase
      .from(TABLES.ROUND_STATS)
      .select('*')
      .order('round_number', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },

  // 获取总TVL历史
  async getTVLHistory(limit: number = 50): Promise<{ round_number: number; total_value_locked: number; created_at: string }[]> {
    const { data, error } = await supabase
      .from(TABLES.ROUND_STATS)
      .select('round_number, total_value_locked, created_at')
      .order('round_number', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// ==================== Realtime 订阅 ====================
export const RealtimeService = {
  // 订阅 Agents 变化
  subscribeToAgents(callback: (payload: any) => void) {
    return supabase
      .channel('agents_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.AGENTS },
        callback
      )
      .subscribe();
  },

  // 订阅战斗日志
  subscribeToBattleLogs(callback: (payload: any) => void) {
    return supabase
      .channel('battle_logs_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLES.BATTLE_LOGS },
        callback
      )
      .subscribe();
  },

  // 订阅用户余额变化
  subscribeToUserBalance(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_balance_${userId}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: TABLES.USERS,
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};

// ==================== 数据转换工具 ====================
export const DataTransformers = {
  // 将前端 Agent 转换为数据库格式
  toDatabaseAgent(agent: Agent, ownerId: string): Partial<DatabaseAgent> {
    const now = new Date().toISOString();
    return {
      id: agent.id,
      owner_id: ownerId,
      name: agent.name,
      nft_id: agent.nftId,
      color: agent.color,
      image: agent.image,
      attack: agent.attack,
      defense: agent.defense,
      speed: agent.speed,
      crit_rate: agent.critRate,
      crit_damage: agent.critDamage,
      evasion: agent.evasion,
      accuracy: agent.accuracy,
      luck: agent.luck,
      hp: agent.hp,
      max_hp: agent.maxHp,
      balance: agent.balance,
      wins: agent.wins,
      losses: agent.losses,
      kills: agent.kills,
      deaths: agent.deaths,
      total_battles: agent.totalBattles,
      win_rate: agent.winRate,
      total_earnings: agent.totalEarnings,
      total_losses: agent.totalLosses,
      net_profit: agent.netProfit,
      avg_damage_dealt: agent.avgDamageDealt,
      avg_damage_taken: agent.avgDamageTaken,
      max_kill_streak: agent.maxKillStreak,
      current_kill_streak: agent.currentKillStreak,
      tournament_wins: agent.tournamentWins,
      tournament_top3: agent.tournamentTop3,
      status: agent.status,
      is_player: agent.isPlayer,
      rarity: agent.rarity,
      created_at: now,
      updated_at: now,
    };
  },

  // 将数据库 Agent 转换为前端格式
  toFrontendAgent(dbAgent: DatabaseAgent): Agent {
    return {
      id: dbAgent.id,
      name: dbAgent.name,
      nftId: dbAgent.nft_id,
      color: dbAgent.color,
      image: dbAgent.image,
      attack: dbAgent.attack,
      defense: dbAgent.defense,
      speed: dbAgent.speed,
      critRate: dbAgent.crit_rate,
      critDamage: dbAgent.crit_damage,
      evasion: dbAgent.evasion,
      accuracy: dbAgent.accuracy,
      luck: dbAgent.luck,
      totalStats: dbAgent.attack + dbAgent.defense + dbAgent.speed + dbAgent.crit_rate + dbAgent.crit_damage + dbAgent.evasion + dbAgent.accuracy + dbAgent.luck,
      rarity: dbAgent.rarity || 'common',
      hp: dbAgent.hp,
      maxHp: dbAgent.max_hp,
      balance: dbAgent.balance,
      wins: dbAgent.wins,
      losses: dbAgent.losses,
      kills: dbAgent.kills,
      deaths: dbAgent.deaths,
      totalBattles: dbAgent.total_battles,
      winRate: dbAgent.win_rate,
      totalEarnings: dbAgent.total_earnings,
      totalLosses: dbAgent.total_losses,
      netProfit: dbAgent.net_profit,
      avgDamageDealt: dbAgent.avg_damage_dealt,
      avgDamageTaken: dbAgent.avg_damage_taken,
      maxKillStreak: dbAgent.max_kill_streak,
      currentKillStreak: dbAgent.current_kill_streak,
      tournamentWins: dbAgent.tournament_wins,
      tournamentTop3: dbAgent.tournament_top3,
      battleHistory: [], // 需要单独查询
      status: dbAgent.status,
      isPlayer: dbAgent.is_player,
      pixelStyle: 0,
      createdAt: new Date(dbAgent.created_at).getTime(),
    };
  },
};
