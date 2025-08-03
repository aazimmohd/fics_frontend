import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getQuickActions, DashboardStats, QuickAction } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  quickActions: QuickAction[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useDashboardData(autoRefreshInterval = 30000): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      }

      const [statsData, actionsData] = await Promise.all([
        getDashboardStats(),
        getQuickActions()
      ]);

      setStats(statsData);
      setQuickActions(actionsData.quick_actions);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      if (!isRefresh) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData(true);
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefreshInterval]);

  return {
    stats,
    quickActions,
    loading,
    refreshing,
    error,
    refresh,
    lastUpdated,
  };
} 