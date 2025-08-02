import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useSimpleRole';
import { BarChart, Users, Activity, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalQuests: number;
  totalSubmissions: number;
}

export const SimpleAnalytics = () => {
  const { isAdmin, isModerator } = useRole();
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalQuests: 0,
    totalSubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin || isModerator) {
      fetchAnalyticsData();
    }
  }, [isAdmin, isModerator]);

  const fetchAnalyticsData = async () => {
    try {
      const [usersRes, questsRes, submissionsRes] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('Quests').select('id'),
        supabase.from('Submissions').select('id'),
      ]);

      setData({
        totalUsers: usersRes.data?.length || 0,
        totalQuests: questsRes.data?.length || 0,
        totalSubmissions: submissionsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isModerator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You need admin or moderator privileges to access the analytics dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalQuests}</div>
              <p className="text-xs text-muted-foreground">Available quests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">Quest submissions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};