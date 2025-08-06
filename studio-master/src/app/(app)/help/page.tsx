'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search,
  FileText,
  Network,
  ListTodo,
  Settings,
  Users,
  Sparkles,
  Target,
  Zap,
  Play,
  BookOpen,
  MessageCircle,
  Video,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  HelpCircle,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  articles: HelpArticle[];
  featured?: boolean;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToRead: string;
  tags: string[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics and set up your first workflow',
    icon: Target,
    featured: true,
    articles: [
      {
        id: 'welcome-to-ficx',
        title: 'Welcome to FiCX',
        description: 'A comprehensive overview of what FiCX can do for your business',
        difficulty: 'beginner',
        timeToRead: '5 min',
        tags: ['overview', 'introduction']
      },
      {
        id: 'create-first-form',
        title: 'Create Your First Intake Form',
        description: 'Step-by-step guide to building your first client intake form',
        difficulty: 'beginner',
        timeToRead: '10 min',
        tags: ['forms', 'tutorial']
      },
      {
        id: 'build-first-workflow',
        title: 'Build Your First Workflow',
        description: 'Learn how to create automated workflows that trigger on form submissions',
        difficulty: 'beginner',
        timeToRead: '15 min',
        tags: ['workflows', 'automation']
      },
      {
        id: 'invite-team-members',
        title: 'Invite Team Members',
        description: 'Add your team to FiCX and assign appropriate roles',
        difficulty: 'beginner',
        timeToRead: '8 min',
        tags: ['team', 'collaboration']
      }
    ]
  },
  {
    id: 'intake-forms',
    title: 'Intake Forms',
    description: 'Create and manage client intake forms',
    icon: FileText,
    articles: [
      {
        id: 'form-builder-basics',
        title: 'Form Builder Basics',
        description: 'Learn how to use the drag-and-drop form builder',
        difficulty: 'beginner',
        timeToRead: '12 min',
        tags: ['forms', 'builder']
      },
      {
        id: 'field-types',
        title: 'Field Types and Options',
        description: 'Explore all available field types and their configuration options',
        difficulty: 'intermediate',
        timeToRead: '20 min',
        tags: ['forms', 'fields']
      },
      {
        id: 'form-templates',
        title: 'Using Form Templates',
        description: 'Save time with pre-built form templates',
        difficulty: 'beginner',
        timeToRead: '8 min',
        tags: ['templates', 'forms']
      },
      {
        id: 'form-submissions',
        title: 'Managing Form Submissions',
        description: 'View, export, and manage form submissions',
        difficulty: 'intermediate',
        timeToRead: '15 min',
        tags: ['submissions', 'data']
      }
    ]
  },
  {
    id: 'workflows',
    title: 'Workflow Automation',
    description: 'Build and manage automated workflows',
    icon: Network,
    articles: [
      {
        id: 'workflow-basics',
        title: 'Workflow Basics',
        description: 'Understanding workflow concepts and components',
        difficulty: 'beginner',
        timeToRead: '10 min',
        tags: ['workflows', 'basics']
      },
      {
        id: 'node-types',
        title: 'Available Node Types',
        description: 'Learn about all the different actions you can add to workflows',
        difficulty: 'intermediate',
        timeToRead: '25 min',
        tags: ['nodes', 'actions']
      },
      {
        id: 'ai-workflow-generator',
        title: 'AI Workflow Generator',
        description: 'Use AI to generate workflows from text descriptions',
        difficulty: 'beginner',
        timeToRead: '8 min',
        tags: ['ai', 'generator']
      },
      {
        id: 'workflow-templates',
        title: 'Workflow Templates',
        description: 'Use and customize pre-built workflow templates',
        difficulty: 'intermediate',
        timeToRead: '12 min',
        tags: ['templates', 'workflows']
      },
      {
        id: 'workflow-debugging',
        title: 'Debugging Workflows',
        description: 'Troubleshoot and fix workflow issues',
        difficulty: 'advanced',
        timeToRead: '18 min',
        tags: ['debugging', 'troubleshooting']
      }
    ]
  },
  {
    id: 'tasks',
    title: 'Task Management',
    description: 'Assign and track tasks across your team',
    icon: ListTodo,
    articles: [
      {
        id: 'task-basics',
        title: 'Task Management Basics',
        description: 'Create, assign, and track tasks effectively',
        difficulty: 'beginner',
        timeToRead: '10 min',
        tags: ['tasks', 'basics']
      },
      {
        id: 'task-automation',
        title: 'Automating Task Creation',
        description: 'Set up workflows to automatically create tasks',
        difficulty: 'intermediate',
        timeToRead: '15 min',
        tags: ['automation', 'tasks']
      },
      {
        id: 'task-notifications',
        title: 'Task Notifications',
        description: 'Configure notifications for task assignments and updates',
        difficulty: 'intermediate',
        timeToRead: '12 min',
        tags: ['notifications', 'tasks']
      }
    ]
  },
  {
    id: 'team-management',
    title: 'Team Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    articles: [
      {
        id: 'user-roles',
        title: 'User Roles and Permissions',
        description: 'Understand different user roles and their capabilities',
        difficulty: 'intermediate',
        timeToRead: '12 min',
        tags: ['roles', 'permissions']
      },
      {
        id: 'invite-users',
        title: 'Inviting Team Members',
        description: 'Add new users to your FiCX account',
        difficulty: 'beginner',
        timeToRead: '5 min',
        tags: ['users', 'invitations']
      },
      {
        id: 'account-settings',
        title: 'Account Settings',
        description: 'Configure your account preferences and settings',
        difficulty: 'beginner',
        timeToRead: '8 min',
        tags: ['settings', 'account']
      }
    ]
  }
];

const quickActions = [
  {
    title: 'Take the Tutorial',
    description: 'Interactive walkthrough of FiCX features',
    icon: Play,
    href: '/dashboard?tutorial=true',
    color: 'bg-blue-500'
  },
  {
    title: 'Watch Video Guides',
    description: 'Step-by-step video tutorials',
    icon: Video,
    href: '#',
    color: 'bg-green-500'
  },
  {
    title: 'Contact Support',
    description: 'Get help from our support team',
    icon: MessageCircle,
    href: '#',
    color: 'bg-purple-500'
  },
  {
    title: 'Feature Requests',
    description: 'Suggest new features or improvements',
    icon: Lightbulb,
    href: '#',
    color: 'bg-orange-500'
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Help & Support</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Get the most out of FiCX with our comprehensive help resources, tutorials, and support options.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search help articles, tutorials, and guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Featured Section */}
      {filteredSections.filter(s => s.featured).map(section => (
        <Card key={section.id} className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <section.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {section.title}
                  <Badge variant="secondary">Featured</Badge>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {section.articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{article.title}</h3>
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{article.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {article.timeToRead}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        Read
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* All Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">All Help Topics</h2>
        {filteredSections.filter(s => !s.featured).map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {section.articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{article.title}</h3>
                        <Badge className={getDifficultyColor(article.difficulty)}>
                          {article.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{article.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {article.timeToRead}
                        </div>
                        <div className="flex gap-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Still Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help you get the most out of FiCX.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 