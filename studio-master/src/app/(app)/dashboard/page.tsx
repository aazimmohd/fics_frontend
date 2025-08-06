"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  FileText,
  Workflow,
  Activity,
  ArrowRight,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Play,
  Pause,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useTutorial } from "@/hooks/use-tutorial";
import { TutorialOverlay } from "@/components/shared/tutorial-overlay";
import { WelcomeBanner } from "@/components/shared/welcome-banner";
import { ContextualTooltip, TOOLTIP_CONTENT } from "@/components/shared/contextual-tooltip";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const { stats, quickActions, loading, refreshing, refresh, lastUpdated } = useDashboardData(30000);
  const { 
    isTutorialVisible, 
    onboardingData, 
    startTutorial, 
    closeTutorial, 
    completeTutorial,
    hasCompletedOnboarding,
    hasCompletedTutorial
  } = useTutorial();

  const handleRefresh = () => {
    refresh();
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Completed':
      case 'Success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
      case 'In Progress':
      case 'Running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'pending':
      case 'Pending':
      case 'Waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner for new users */}
      {hasCompletedOnboarding() && !hasCompletedTutorial() && onboardingData && (
        <WelcomeBanner
          onboardingData={onboardingData}
          onDismiss={() => {}}
          onStartTutorial={startTutorial}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between dashboard-header">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your workflow automation platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/workflows" passHref>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <ContextualTooltip
          content={TOOLTIP_CONTENT.QUICK_ACTIONS}
          elementId="dashboard-quick-actions"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card key={index} className="shadow-lg rounded-lg border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{action.description}</p>
                      <Link href={action.link}>
                        <Button variant="outline" size="sm" className="w-full">
                          Take Action
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ContextualTooltip>
      )}

      {/* Key Metrics */}
      <ContextualTooltip
        content={TOOLTIP_CONTENT.DASHBOARD_METRICS}
        elementId="dashboard-metrics"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg rounded-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
                <Workflow className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.metrics.active_workflows.value || 0}</p>
                                   <div className="flex items-center gap-1 mt-1">
                     {(stats?.metrics.active_workflows.change || 0) > 0 ? (
                       <TrendingUp className="h-3 w-3 text-green-500" />
                     ) : (
                       <TrendingDown className="h-3 w-3 text-red-500" />
                     )}
                     <p className="text-xs text-muted-foreground">
                       +{stats?.metrics.active_workflows.change || 0} this week
                     </p>
                   </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        <Card className="shadow-lg rounded-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Forms Submitted</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.metrics.forms_submitted.value || 0}</p>
                                 <div className="flex items-center gap-1 mt-1">
                   {(stats?.metrics.forms_submitted.change || 0) > 0 ? (
                     <TrendingUp className="h-3 w-3 text-green-500" />
                   ) : (
                     <TrendingDown className="h-3 w-3 text-red-500" />
                   )}
                   <p className="text-xs text-muted-foreground">
                     {(stats?.metrics.forms_submitted.change || 0) > 0 ? '+' : ''}{stats?.metrics.forms_submitted.change || 0}% from last month
                   </p>
                 </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.metrics.tasks_pending.value || 0}</p>
                                 <div className="flex items-center gap-1 mt-1">
                   {(stats?.metrics.tasks_pending.overdue || 0) > 0 && (
                     <AlertCircle className="h-3 w-3 text-red-500" />
                   )}
                   <p className="text-xs text-muted-foreground">
                     {stats?.metrics.tasks_pending.overdue || 0} overdue
                   </p>
                 </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.metrics.total_users || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active team members</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </ContextualTooltip>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Form submissions and workflow runs over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.weekly_chart_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#10B981" name="Submissions" />
                  <Bar dataKey="workflow_runs" fill="#3B82F6" name="Workflow Runs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Performance */}
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Workflow Performance
            </CardTitle>
            <CardDescription>Success vs failure rates in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Successful Runs</span>
                </div>
                <span className="font-semibold">{stats?.metrics.recent_activity.successful_runs || 0}</span>
              </div>
              <Progress 
                value={stats?.metrics.recent_activity.successful_runs || 0} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Failed Runs</span>
                </div>
                <span className="font-semibold">{stats?.metrics.recent_activity.failed_runs || 0}</span>
              </div>
              <Progress 
                value={stats?.metrics.recent_activity.failed_runs || 0} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Total Runs (24h)</span>
                <span className="font-semibold text-lg">{stats?.metrics.recent_activity.runs_24h || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest workflow runs, form submissions, and task updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recent_activities.length ? (
                             stats.recent_activities.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isVisible={isTutorialVisible}
        onClose={closeTutorial}
        onComplete={completeTutorial}
        onboardingData={onboardingData}
      />
    </div>
  );
}
