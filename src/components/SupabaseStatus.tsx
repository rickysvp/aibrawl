import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
}

const SupabaseStatus: React.FC = () => {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const requiredTables = [
    'users',
    'agents',
    'liquidity_stakes',
    'liquidity_pool',
    'round_stats',
    'battles',
    'transactions'
  ];

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    const results: TableStatus[] = [];
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          results.push({
            name: tableName,
            exists: false,
            error: error.message
          });
        } else {
          results.push({
            name: tableName,
            exists: true
          });
        }
      } catch (err: any) {
        results.push({
          name: tableName,
          exists: false,
          error: err.message
        });
      }
    }
    
    setTables(results);
    setLoading(false);
  };

  const allTablesExist = tables.every(t => t.exists);
  const missingTables = tables.filter(t => !t.exists);

  if (loading) {
    return (
      <div className="p-4 bg-void-panel/50 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 text-white/60">
          <Database className="w-5 h-5 animate-pulse" />
          <span>检查 Supabase 数据库状态...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-void-panel/50 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-luxury-purple" />
          <span className="font-semibold text-white">Supabase 数据库状态</span>
        </div>
        {allTablesExist ? (
          <span className="flex items-center gap-1 text-luxury-green text-sm">
            <CheckCircle className="w-4 h-4" />
            所有表已就绪
          </span>
        ) : (
          <span className="flex items-center gap-1 text-luxury-rose text-sm">
            <XCircle className="w-4 h-4" />
            缺少 {missingTables.length} 个表
          </span>
        )}
      </div>

      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.name}
            className={`flex items-center justify-between p-2 rounded ${
              table.exists ? 'bg-luxury-green/10' : 'bg-luxury-rose/10'
            }`}
          >
            <span className="text-sm text-white/80">{table.name}</span>
            {table.exists ? (
              <CheckCircle className="w-4 h-4 text-luxury-green" />
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-luxury-rose">{table.error || '表不存在'}</span>
                <XCircle className="w-4 h-4 text-luxury-rose" />
              </div>
            )}
          </div>
        ))}
      </div>

      {!allTablesExist && (
        <div className="mt-4 p-3 bg-luxury-amber/10 rounded border border-luxury-amber/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-luxury-amber flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/80">
              <p className="font-medium text-luxury-amber mb-1">数据库表未创建</p>
              <p>请在 Supabase 控制台执行 SQL 创建表。查看 SUPABASE_SETUP_GUIDE.md 获取详细步骤。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseStatus;
