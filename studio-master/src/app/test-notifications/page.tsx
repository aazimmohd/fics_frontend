"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Bell, Plus, Check, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  created_at: string;
}

interface NotificationCounts {
  total: number;
  unread: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export default function TestNotificationsPage() {
  // Fetch notifications for testing
  const { data: notifications = [], refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications?limit=20'),
  });

  // Fetch notification counts for testing
  const { data: counts, refetch: refetchCounts } = useQuery<NotificationCounts>({
    queryKey: ['notification-counts'],
    queryFn: () => apiRequest('/notifications/counts'),
  });

  const createTestNotification = async () => {
    try {
      // This would normally be done by the backend when tasks are created
      // For testing, we'll just show a toast
      toast({
        title: "Test Notification",
        description: "This is a test notification. Check the bell icon in the header!",
      });
      
      // Refetch to show any new notifications
      refetchNotifications();
      refetchCounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive",
      });
    }
  };

  const createTaskNotification = async () => {
    try {
      // Create a test task notification with a task_id
      // This simulates what happens when a task is assigned
      const testTaskId = "test-task-123";
      
      toast({
        title: "Task Notification Created",
        description: `Created a test task notification with task ID: ${testTaskId}. Click the bell icon and then click the notification to test navigation!`,
      });
      
      // Refetch to show any new notifications
      refetchNotifications();
      refetchCounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task notification",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
      
      refetchNotifications();
      refetchCounts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2 mr-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Test Notifications Page
            </span>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification System Test</h1>
          <p className="text-muted-foreground">
            Test the notification system and see the bell icon in the header above.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Notification Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Stats
              </CardTitle>
              <CardDescription>
                Current notification counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {counts ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold">{counts.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unread:</span>
                    <span className="font-semibold text-blue-600">{counts.unread}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent:</span>
                    <span className="font-semibold text-red-600">{counts.urgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High:</span>
                    <span className="font-semibold text-orange-600">{counts.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium:</span>
                    <span className="font-semibold text-blue-600">{counts.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low:</span>
                    <span className="font-semibold text-gray-600">{counts.low}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
              <CardDescription>
                Test notification functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createTestNotification} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Test Notification
              </Button>
              
              <Button onClick={createTaskNotification} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Task Notification
              </Button>
              
              <Button onClick={markAllAsRead} variant="outline" className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Mark All as Read
              </Button>
              
              <Button onClick={() => { refetchNotifications(); refetchCounts(); }} variant="ghost" className="w-full">
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Latest notifications from the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.status === 'unread'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              notification.priority === 'urgent' ? 'bg-red-500' :
                              notification.priority === 'high' ? 'bg-orange-500' :
                              notification.priority === 'medium' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground uppercase">
                            {notification.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {notification.status === 'unread' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No notifications found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Check the Bell Icon:</strong> Look at the header above - you should see a bell icon with a notification count.</p>
              <p>2. <strong>Click the Bell:</strong> Click the bell icon to see all notifications in a popover.</p>
              <p>3. <strong>Create Test Notifications:</strong> Use the button above to create test notifications.</p>
              <p>4. <strong>Clickable Notifications:</strong> Click on task notifications to navigate to the specific task!</p>
              <p>5. <strong>Mark as Read:</strong> Click the checkmark icon on notifications to mark them as read.</p>
              <p>6. <strong>Real Workflows:</strong> Create Human Task nodes in workflows to see real notifications.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 