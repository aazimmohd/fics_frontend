# 🔔 Notification System

## Overview

The FiCX notification system provides real-time notifications for workflow events, task assignments, escalations, and system alerts. Users can see notifications through a bell icon in the app header.

## Features

### 🎯 Core Features
- **Real-time Notifications**: Automatic updates every 30 seconds
- **Priority-based Display**: Color-coded notifications (urgent=red, high=orange, medium=blue, low=gray)
- **Unread Count Badge**: Shows number of unread notifications
- **Mark as Read**: Individual and bulk mark-as-read functionality
- **Responsive Design**: Works on desktop and mobile

### 📱 User Interface
- **Bell Icon**: Located in the app header next to user avatar
- **Notification Popover**: Click bell to see all notifications
- **Priority Indicators**: Visual dots and labels for urgency
- **Time Stamps**: Relative time display (e.g., "2m ago", "1h ago")

## How It Works

### 1. Automatic Notifications
The system automatically creates notifications for:
- **Task Assignments**: When Human Task nodes assign tasks to users
- **Task Escalations**: When tasks become overdue and are escalated
- **Workflow Events**: Workflow completion, failures, etc.

### 2. Real-time Updates
- Notifications are fetched every 30 seconds
- Updates happen in the background
- Unread count updates automatically

### 3. User Actions
- Click bell icon to view notifications
- Click individual notifications to mark as read
- Use "Mark all read" button for bulk actions
- Notifications are archived when deleted

## API Endpoints

### Get Notifications
```http
GET /api/notifications?limit=20
```

### Get Notification Counts
```http
GET /api/notifications/counts
```

### Get Unread Count
```http
GET /api/notifications/unread-count
```

### Mark as Read
```http
PUT /api/notifications/{id}/read
```

### Mark All as Read
```http
PUT /api/notifications/mark-all-read
```

### Archive Notification
```http
DELETE /api/notifications/{id}
```

## Testing

### Test Page
Visit `/test-notifications` to:
- View current notification stats
- Test notification functionality
- See recent notifications
- Mark notifications as read

### Manual Testing
1. **Check Bell Icon**: Look for bell icon in header with notification count
2. **Click Bell**: Open notification popover
3. **Create Test Notifications**: Use test page buttons
4. **Mark as Read**: Click notifications or use bulk actions
5. **Real Workflows**: Create Human Task nodes to see real notifications

## Integration with Workflows

### Human Task Nodes
When a Human Task node is executed:
1. Task is created in the database
2. Notification is automatically created for the assignee
3. User sees notification in bell icon
4. When task times out, escalation notifications are created

### Escalation System
- Tasks have configurable timeouts (default: 2 minutes for testing)
- When timeout is reached, task is escalated
- Backup assignee receives notification
- Escalation notifications are marked as urgent

## Technical Details

### Database Schema
```sql
notifications table:
- id (UUID)
- account_id (UUID)
- user_id (UUID)
- task_id (UUID, optional)
- trigger_run_id (UUID, optional)
- workflow_id (UUID, optional)
- type (enum: task_assigned, task_overdue, etc.)
- title (string)
- message (text)
- status (enum: unread, read, archived)
- priority (enum: low, medium, high, urgent)
- notification_data (JSONB)
- created_at (timestamp)
- updated_at (timestamp)
```

### Frontend Components
- `NotificationBell`: Main component in header
- `TestNotificationsPage`: Testing interface
- React Query for data fetching and caching
- Real-time polling every 30 seconds

### Backend Services
- `NotificationService`: Core notification logic
- Integration with task escalation system
- Automatic notification creation
- API endpoints for CRUD operations

## Configuration

### Timeout Settings
- **Testing**: 1-5 minutes recommended
- **Production**: 30+ minutes recommended
- **Escalation Levels**: Configurable (default: 3 levels)

### Polling Intervals
- **Frontend**: 30 seconds
- **Backend Escalation Check**: Every hour (via Celery Beat)

## Troubleshooting

### Common Issues
1. **No Notifications Showing**: Check authentication and API connectivity
2. **Bell Icon Missing**: Verify component is imported in AppHeader
3. **Notifications Not Updating**: Check React Query configuration
4. **Escalations Not Working**: Ensure Celery Beat is running

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check database for notification records
4. Ensure user authentication is working
5. Test with `/test-notifications` page

## Future Enhancements

### Planned Features
- **Push Notifications**: Browser push notifications
- **Email Integration**: Email notifications for urgent items
- **Custom Filters**: Filter notifications by type/priority
- **Notification Preferences**: User-configurable settings
- **Sound Alerts**: Audio notifications for urgent items
- **Mobile App**: Native mobile notifications

### Performance Optimizations
- **WebSocket Support**: Real-time updates instead of polling
- **Pagination**: Handle large numbers of notifications
- **Caching**: Optimize database queries
- **Batch Operations**: Bulk notification operations 