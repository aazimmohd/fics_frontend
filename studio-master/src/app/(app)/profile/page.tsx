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
  EyeOff
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

  const getRoleColors = (roleName: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800 border-red-200',
      'manager': 'bg-blue-100 text-blue-800 border-blue-200',
      'user': 'bg-green-100 text-green-800 border-green-200',
      'viewer': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[roleName.toLowerCase()] || 'bg-purple-100 text-purple-800 border-purple-200';
  };

  if (isLoading && !profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="text-gray-600 mt-2">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mb-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-gray-100">
                    <AvatarImage src="https://placehold.co/200x200.png" alt="Profile Picture" />
                    <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getUserInitials(profileData.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your full name"
                        className="text-center font-semibold"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {profileData.full_name || 'No name set'}
                      </h2>
                      <p className="text-gray-600 text-sm mb-3">{profileData.email}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <p className="text-gray-600">Member since</p>
                      <p className="font-medium">{formatDate(profileData.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div className="text-left">
                      <p className="text-gray-600">Account ID</p>
                      <p className="font-medium font-mono text-xs">{profileData.account_id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your basic account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="user-id" className="text-sm font-medium text-gray-700">User ID</Label>
                    <Input
                      id="user-id"
                      value={profileData.id}
                      readOnly
                      className="mt-1 bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        value={profileData.email}
                        readOnly
                        className="mt-1 pl-10 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles & Permissions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Roles & Permissions
                </CardTitle>
                <CardDescription>
                  Your assigned roles and access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Assigned Roles</Label>
                    <div className="flex flex-wrap gap-2">
                      {profileData.roles.map((role) => (
                        <Badge 
                          key={role.id} 
                          variant="secondary" 
                          className={`${getRoleColors(role.name)} px-3 py-1`}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPermissions(!showPermissions)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {showPermissions ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show All
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showPermissions && (
                      <div className="grid gap-2 md:grid-cols-2">
                        {profileData.roles.flatMap(role => 
                          role.permissions.map(permission => (
                            <div 
                              key={`${role.id}-${permission.name}`}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm"
                            >
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">{permission.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    
                    {!showPermissions && (
                      <p className="text-sm text-gray-600">
                        You have {profileData.roles.flatMap(role => role.permissions).length} permissions across {profileData.roles.length} role(s)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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