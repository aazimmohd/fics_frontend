'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  account_id: string;
  roles: { id: string; name: string; description: string }[];
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface InviteUserForm {
  email: string;
  full_name: string;
  password?: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteFormData, setInviteFormData] = useState<InviteUserForm>({
    email: '',
    full_name: '',
    password: '',
  });

  // Use environment variable for API base URL with fallback for development
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const { data: users, isLoading, error } = useQuery<User[]>({ 
    queryKey: ['users'], 
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  const { data: roles } = useQuery<Role[]>({ 
    queryKey: ['roles'], 
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      return response.json();
    }
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (newUser: InviteUserForm) => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to invite user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User Invited',
        description: 'New user has been successfully invited.',
      });
      setIsInviteModalOpen(false);
      setInviteFormData({ email: '', full_name: '', password: '' });
    },
    onError: (err) => {
      toast({
        title: 'Failed to invite user',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/roles/${roleName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to assign role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Role Assigned',
        description: 'Role has been successfully assigned to the user.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Failed to assign role',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/roles/${roleName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to remove role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Role Removed',
        description: 'Role has been successfully removed from the user.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Failed to remove role',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteUserMutation.mutate(inviteFormData);
  };

  const handleRoleToggle = (roleName: string, isChecked: boolean) => {
    if (!selectedUser) return;
    
    if (isChecked) {
      assignRoleMutation.mutate({ userId: selectedUser.id, roleName });
    } else {
      removeRoleMutation.mutate({ userId: selectedUser.id, roleName });
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  if (!hasPermission('users:manage')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to manage users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">User Management</CardTitle>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Invite User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Enter the details for the new user you want to invite.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invite-full-name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="invite-full-name"
                  value={inviteFormData.full_name}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, full_name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invite-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invite-password" className="text-right">
                  Password
                </Label>
                <Input
                  id="invite-password"
                  type="password"
                  value={inviteFormData.password}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, password: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={inviteUserMutation.isPending}>
                {inviteUserMutation.isPending ? 'Inviting...' : 'Invite User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      {/* Role Edit Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              Manage roles for {selectedUser?.full_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roles?.map((role) => {
              const userHasRole = selectedUser?.roles.some(userRole => userRole.name === role.name) || false;
              return (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.id}
                    checked={userHasRole}
                    onCheckedChange={(checked) => 
                      handleRoleToggle(role.name, checked as boolean)
                    }
                    disabled={assignRoleMutation.isPending || removeRoleMutation.isPending}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={role.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      <CardContent>
        {isLoading ? (
          <div>Loading users...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error.message}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.roles.map(role => role.name).join(', ')}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => openRoleModal(user)}
                    >
                      Edit Roles
                    </Button>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}