"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, Clock, Archive, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  task_id?: string;
  trigger_run_id?: string;
  workflow_id?: string;
}

interface NotificationCounts {
  total: number;
  unread: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-50/50',
        borderColor: 'border-red-200/50',
        textColor: 'text-red-600',
        icon: AlertTriangle,
        label: 'Urgent'
      };
    case 'high':
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50/50',
        borderColor: 'border-orange-200/50',
        textColor: 'text-orange-600',
        icon: AlertTriangle,
        label: 'High'
      };
    case 'medium':
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50/50',
        borderColor: 'border-blue-200/50',
        textColor: 'text-blue-600',
        icon: Info,
        label: 'Medium'
      };
    case 'low':
      return {
        color: 'bg-gray-400',
        bgColor: 'bg-gray-50/50',
        borderColor: 'border-gray-200/50',
        textColor: 'text-gray-600',
        icon: Info,
        label: 'Low'
      };
    default:
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50/50',
        borderColor: 'border-blue-200/50',
        textColor: 'text-blue-600',
        icon: Info,
        label: 'Medium'
      };
  }
};

const getNotificationIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'task_assigned':
      return CheckCircle;
    case 'task_escalated':
      return AlertTriangle;
    case 'workflow_completed':
      return CheckCircle;
    case 'workflow_failed':
      return AlertTriangle;
    default:
      return Info;
  }
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications?limit=20'),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Fetch notification counts
  const { data: counts } = useQuery<NotificationCounts>({
    queryKey: ['notification-counts'],
    queryFn: () => apiRequest('/notifications/counts'),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('/notifications/mark-all-read', {
        method: 'PUT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.task_id) {
      // Navigate to tasks page with taskId parameter
      router.push(`/tasks?taskId=${notification.task_id}`);
    } else if (notification.trigger_run_id) {
      // Navigate to specific trigger run
      router.push(`/trigger-runs/${notification.trigger_run_id}`);
    } else if (notification.workflow_id) {
      // Navigate to workflows page with workflowId parameter
      router.push(`/workflows?workflowId=${notification.workflow_id}`);
    }

    // Close the notification popover
    setIsOpen(false);
  };

  const unreadCount = counts?.unread || 0;
  const hasUnread = unreadCount > 0;

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => n.status === 'unread')
    : notifications;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full transition-all duration-200",
            "hover:bg-gray-100/80 hover:scale-105",
            hasUnread && "text-blue-600"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl notification-slide-in" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
                <p className="text-xs text-gray-500">
                  {hasUnread ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full px-3 py-1.5 h-7"
              >
                Mark all read
              </Button>
            )}
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-1 px-4 pb-3">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={cn(
                "text-xs rounded-full px-3 py-1.5 h-7 transition-all duration-200",
                filter === 'all' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={cn(
                "text-xs rounded-full px-3 py-1.5 h-7 transition-all duration-200",
                filter === 'unread' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Unread
            </Button>
          </div>
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center notification-fade-in">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3 shadow-sm animate-pulse">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center notification-fade-in">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredNotifications.map((notification, index) => {
                const animationDelay = `${index * 30}ms`;
                const priorityConfig = getPriorityConfig(notification.priority);
                const NotificationIcon = getNotificationIcon(notification.type);
                const isUnread = notification.status === 'unread';
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative p-3 rounded-xl transition-all duration-200 cursor-pointer notification-fade-in",
                      isUnread 
                        ? "bg-blue-50/80 hover:bg-blue-100/80" 
                        : "bg-white hover:bg-gray-50/80",
                      "hover:scale-[1.01] hover:shadow-sm"
                    )}
                    style={{ animationDelay }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread Indicator */}
                    {isUnread && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                    )}
                    
                    {/* Notification Content */}
                    <div className="flex items-start gap-3 pl-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        isUnread ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        <NotificationIcon className={cn(
                          "h-4 w-4",
                          isUnread ? "text-blue-600" : "text-gray-600"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            priorityConfig.color
                          )} />
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <h5 className={cn(
                          "font-medium text-sm mb-1 line-clamp-1",
                          isUnread ? "text-gray-900" : "text-gray-800"
                        )}>
                          {notification.title}
                        </h5>
                        
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className={cn(
                      "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    )}>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="h-6 w-6 p-0 rounded-full bg-white/80 hover:bg-white shadow-sm"
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-3 rounded-b-2xl">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {counts?.urgent || 0}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  {counts?.high || 0}
                </span>
              </div>
              <span className="text-xs">
                {formatTime(new Date().toISOString())}
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 