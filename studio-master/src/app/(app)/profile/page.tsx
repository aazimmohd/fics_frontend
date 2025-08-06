'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Users,
  Building,
  Eye,
  EyeOff,
  Crown,
  Star,
  Zap,
  CheckCircle,
  Settings,
  Activity,
  Award,
  Briefcase,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import PrivateRoute from '@/components/PrivateRoute';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  account_id: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: Array<{
      name: string;
      description: string;
    }>;
  }>;
  created_at: string;
}

function ProfilePageContent() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const getUserInitials = (name: string | undefined) => {
    if (!name) return "FX";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/auth/me');
      setProfileData(data);
      setEditedName(data.full_name || '');
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSave = async () => {
    if (!profileData) return;
    
    try {
      setIsLoading(true);
      await apiRequest(`/users/users/${profileData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editedName,
        }),
      });
      
      setProfileData(prev => prev ? { ...prev, full_name: editedName } : null);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(profileData?.full_name || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleVariant = (roleName: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'admin': 'destructive',
      'manager': 'default',
      'user': 'secondary',
      'viewer': 'outline',
    };
    return variants[roleName.toLowerCase()] || 'secondary';
  };

  if (isLoading && !profileData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 rounded w-1/4 mx-auto"></div>
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="h-96 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-48 bg-slate-200 rounded-lg"></div>
                  <div className="h-64 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const totalPermissions = profileData.roles.flatMap(role => role.permissions).length;
  const isAdmin = profileData.roles.some(role => role.name.toLowerCase() === 'admin');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-semibold text-slate-900 mb-3">Profile</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="mb-8">
                    <Avatar className="h-24 w-24 mx-auto mb-6 ring-2 ring-slate-100">
                      <AvatarImage src="https://placehold.co/200x200.png" alt="Profile Picture" />
                      <AvatarFallback className="text-lg font-medium bg-slate-100 text-slate-700">
                        {getUserInitials(profileData.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          placeholder="Enter your full name"
                          className="text-center font-medium border-slate-200 focus:border-slate-400"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-slate-900 hover:bg-slate-800"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="border-slate-200 hover:border-slate-300"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">
                          {profileData.full_name || 'No name set'}
                        </h2>
                        <p className="text-slate-600 mb-4 flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4" />
                          {profileData.email}
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsEditing(true)}
                          className="gap-2 border-slate-200 hover:border-slate-300"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator className="my-8" />

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium">Member since</p>
                        <p className="text-sm font-medium text-slate-900">{formatDate(profileData.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Building className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium">Account ID</p>
                        <p className="font-mono text-xs font-medium text-slate-900">{profileData.account_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-medium">Permissions</p>
                        <p className="text-sm font-medium text-slate-900">{totalPermissions} total</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-slate-600" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Your basic account details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user-id" className="text-sm font-medium text-slate-700">User ID</Label>
                      <Input
                        id="user-id"
                        value={profileData.id}
                        readOnly
                        className="bg-slate-50 border-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          value={profileData.email}
                          readOnly
                          className="pl-10 bg-slate-50 border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Roles & Permissions */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-slate-600" />
                    Roles & Permissions
                  </CardTitle>
                  <CardDescription>
                    Your assigned roles and access permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-3 block">Assigned Roles</Label>
                      <div className="flex flex-wrap gap-3">
                        {profileData.roles.map((role) => (
                          <Badge 
                            key={role.id} 
                            variant={getRoleVariant(role.name)}
                            className="px-3 py-1.5 text-sm"
                          >
                            <Users className="h-3 w-3 mr-1.5" />
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-medium text-slate-700">Permissions</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPermissions(!showPermissions)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {showPermissions ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {showPermissions && (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {profileData.roles.flatMap(role => 
                            role.permissions.map(permission => (
                              <div 
                                key={`${role.id}-${permission.name}`}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                              >
                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                <div>
                                  <span className="text-sm font-medium text-slate-900">{permission.name}</span>
                                  <p className="text-xs text-slate-500 mt-0.5">{permission.description}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {!showPermissions && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                              <Activity className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {totalPermissions} Total Permissions
                              </p>
                              <p className="text-xs text-slate-500">
                                Across {profileData.roles.length} role{profileData.roles.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PrivateRoute>
      <ProfilePageContent />
    </PrivateRoute>
  );
} 