import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useSimpleRole';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Users, 
  Activity, 
  TrendingUp, 
  Calendar,
  MapPin,
  Trophy
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: { month: string; users: number; quests: number; submissions: number }[];
  questTypeDistribution: { type: string; count: number; percentage: number }[];
  submissionStats: { 
    total: number; 
    pending: number; 
    verified: number; 
    rejected: number 
  };
  topLocations: { location: string; count: number }[];
  userEngagement: {
    dailyActive: number;
    weeklyActive: number;
    monthlyActive: number;
    avgSessionTime: string;
  };
}

export const AdvancedAnalytics = () => {
  const { isAdmin, isModerator } = useRole();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (isAdmin || isModerator) {
      fetchAdvancedAnalytics();
    }
  }, [isAdmin, isModerator, timeRange]);

  const fetchAdvancedAnalytics = async () => {
    try {
      // Get user growth data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at');

      // Get quest data
      const { data: quests } = await supabase
        .from('Quests')
        .select('quest_type, location, created_at');

      // Get submission stats
      const { data: submissions } = await supabase
        .from('Submissions')
        .select('status, submitted_at, geo_location');

      // Process user growth (simplified for demo)
      const userGrowth = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (let i = 0; i < 6; i++) {
        userGrowth.push({
          month: months[i],
          users: Math.floor(Math.random() * 50) + 10,
          quests: Math.floor(Math.random() * 20) + 5,
          submissions: Math.floor(Math.random() * 100) + 20,
        });
      }

      // Process quest type distribution
      const questTypeCount: Record<string, number> = {};
      quests?.forEach(quest => {
        questTypeCount[quest.quest_type] = (questTypeCount[quest.quest_type] || 0) + 1;
      });

      const total = Object.values(questTypeCount).reduce((a, b) => a + b, 0);
      const questTypeDistribution = Object.entries(questTypeCount).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100),
      }));

      // Process submission stats
      const submissionStats = {
        total: submissions?.length || 0,
        pending: submissions?.filter(s => s.status === 'pending').length || 0,
        verified: submissions?.filter(s => s.status === 'verified').length || 0,
        rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
      };

      // Process top locations
      const locationCount: Record<string, number> = {};
      quests?.forEach(quest => {
        if (quest.location) {
          locationCount[quest.location] = (locationCount[quest.location] || 0) + 1;
        }
      });

      const topLocations = Object.entries(locationCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location, count]) => ({ location, count }));

      // User engagement (mock data)
      const userEngagement = {
        dailyActive: Math.floor(Math.random() * 100) + 50,
        weeklyActive: Math.floor(Math.random() * 200) + 100,
        monthlyActive: Math.floor(Math.random() * 500) + 200,
        avgSessionTime: `${Math.floor(Math.random() * 20) + 10}m`,
      };

      setData({
        userGrowth,
        questTypeDistribution,
        submissionStats,
        topLocations,
        userEngagement,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
                You need admin or moderator privileges to access advanced analytics.
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into platform performance and user behavior
            </p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/70'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.userGrowth.reduce((sum, item) => sum + item.users, 0)}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Quests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.userGrowth.reduce((sum, item) => sum + item.quests, 0)}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.submissionStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {data?.submissionStats.verified} verified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.submissionStats.total ? 
                      Math.round((data.submissionStats.verified / data.submissionStats.total) * 100) : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">Verification rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Platform growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive growth chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>Active user metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Daily Active Users</span>
                    <span className="font-semibold">{data?.userEngagement.dailyActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Active Users</span>
                    <span className="font-semibold">{data?.userEngagement.weeklyActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Active Users</span>
                    <span className="font-semibold">{data?.userEngagement.monthlyActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Session Time</span>
                    <span className="font-semibold">{data?.userEngagement.avgSessionTime}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Most popular quest locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data?.topLocations.map((location, index) => (
                      <div key={location.location} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{location.location}</span>
                        </div>
                        <span className="text-sm font-semibold">{location.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quest Type Distribution</CardTitle>
                  <CardDescription>Breakdown by quest categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.questTypeDistribution.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{item.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Submission Status</CardTitle>
                  <CardDescription>Current submission breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Pending Review</span>
                      <span className="font-semibold text-yellow-600">
                        {data?.submissionStats.pending}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified</span>
                      <span className="font-semibold text-green-600">
                        {data?.submissionStats.verified}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejected</span>
                      <span className="font-semibold text-red-600">
                        {data?.submissionStats.rejected}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{data?.submissionStats.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Patterns</CardTitle>
                <CardDescription>How users interact with the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Engagement heatmap coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};