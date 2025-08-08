'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Clock, Mail, Building, User } from 'lucide-react';

interface BetaEnrollment {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  use_case: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Invited';
  notes: string | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function BetaManagementPage() {
  const [enrollments, setEnrollments] = useState<BetaEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<BetaEnrollment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (!hasPermission('beta:manage')) {
      setError('You do not have permission to access this page.');
      return;
    }
    fetchEnrollments();
  }, [hasPermission]);

  // Use environment variable for API base URL with fallback for development
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchEnrollments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/beta-enrollment/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const data = await response.json();
      setEnrollments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEnrollment) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/beta-enrollment/enrollments/${selectedEnrollment.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: approvalNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve enrollment');
      }

      setIsApprovalDialogOpen(false);
      setApprovalNotes('');
      setSelectedEnrollment(null);
      fetchEnrollments(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEnrollment) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/beta-enrollment/enrollments/${selectedEnrollment.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: rejectionNotes }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject enrollment');
      }

      setIsRejectionDialogOpen(false);
      setRejectionNotes('');
      setSelectedEnrollment(null);
      fetchEnrollments(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'Approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'Invited':
        return <Badge variant="outline"><Mail className="w-3 h-3 mr-1" />Invited</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasPermission('beta:manage')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Loading beta enrollments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Beta Management</h1>
        <p className="text-gray-600 mt-2">Review and manage beta enrollment requests</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Beta Enrollment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No beta enrollment requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Use Case</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{enrollment.full_name}</div>
                          <div className="text-sm text-gray-500">{enrollment.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.company ? (
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4 text-gray-500" />
                          <span>{enrollment.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={enrollment.use_case || ''}>
                        {enrollment.use_case || <span className="text-gray-400">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell>{formatDate(enrollment.created_at)}</TableCell>
                    <TableCell>
                      {enrollment.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedEnrollment(enrollment)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Beta Access</DialogTitle>
                                <DialogDescription>
                                  Approve beta access for {selectedEnrollment?.full_name} ({selectedEnrollment?.email})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="approval-notes">Notes (optional)</Label>
                                  <Textarea
                                    id="approval-notes"
                                    placeholder="Add any notes about this approval..."
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleApprove} disabled={isProcessing}>
                                  {isProcessing ? 'Approving...' : 'Approve'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedEnrollment(enrollment)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Beta Access</DialogTitle>
                                <DialogDescription>
                                  Reject beta access for {selectedEnrollment?.full_name} ({selectedEnrollment?.email})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection-notes">Reason for rejection</Label>
                                  <Textarea
                                    id="rejection-notes"
                                    placeholder="Please provide a reason for rejection..."
                                    value={rejectionNotes}
                                    onChange={(e) => setRejectionNotes(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                                  {isProcessing ? 'Rejecting...' : 'Reject'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      {enrollment.status === 'Invited' && (
                        <div className="text-sm text-gray-500">
                          Invited {enrollment.invited_at && formatDate(enrollment.invited_at)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 