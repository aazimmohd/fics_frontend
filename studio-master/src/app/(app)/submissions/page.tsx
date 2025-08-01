'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, ChevronLeft, ChevronRight, FileText, Calendar, X, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import PrivateRoute from '@/components/PrivateRoute';

// Types for the API responses
interface FormSubmissionListItem {
  id: string;
  submitted_at: string;
  form_name: string;
  has_workflow: boolean;
  submitter_email: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface FormSubmissionListResponse {
  items: FormSubmissionListItem[];
  pagination: PaginationInfo;
}

interface FormSubmissionDetail {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
  form_name: string;
}

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  options?: string;
  isMandatory: boolean;
}

interface FormDefinition {
  id: string;
  name: string;
  definition: {
    fields: FormField[];
  };
}

// API functions
const getFormSubmissions = async (page: number = 1, perPage: number = 20): Promise<FormSubmissionListResponse> => {
  return await api.get(`/form-submissions?page=${page}&per_page=${perPage}`);
};

const getFormSubmissionDetail = async (submissionId: string): Promise<FormSubmissionDetail> => {
  return await api.get(`/form-submissions/${submissionId}`);
};

const getFormDefinition = async (formId: string): Promise<FormDefinition> => {
  return await api.get(`/intake-forms/${formId}`);
};

// Component for displaying submission data in a readable format
function SubmissionDataDisplay({ data, formFields }: { data: Record<string, any>; formFields?: FormField[] }) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['contact', 'project']));

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Create a map of field IDs to labels and categorize fields
  const fieldLabelMap = new Map<string, string>();
  const fieldCategories = new Map<string, string>();
  
  if (formFields) {
    formFields.forEach(field => {
      fieldLabelMap.set(field.id, field.label);
      
      // Categorize fields based on their labels or IDs
      const label = field.label.toLowerCase();
      if (label.includes('contact') || label.includes('email') || label.includes('phone') || label.includes('person')) {
        fieldCategories.set(field.id, 'contact');
      } else if (label.includes('project') || label.includes('problem') || label.includes('pitch') || label.includes('scope')) {
        fieldCategories.set(field.id, 'project');
      } else if (label.includes('budget') || label.includes('cost') || label.includes('timeline') || label.includes('deadline')) {
        fieldCategories.set(field.id, 'budget');
      } else if (label.includes('team') || label.includes('stakeholder') || label.includes('decision')) {
        fieldCategories.set(field.id, 'team');
      } else {
        fieldCategories.set(field.id, 'other');
      }
    });
  }

  // Group fields by category
  const groupedFields = new Map<string, Array<[string, any]>>();
  const categories = ['contact', 'project', 'budget', 'team', 'other'];
  
  categories.forEach(cat => groupedFields.set(cat, []));
  
  Object.entries(data).forEach(([key, value]) => {
    const category = fieldCategories.get(key) || 'other';
    groupedFields.get(category)!.push([key, value]);
  });

  // Filter out empty categories
  const nonEmptyCategories = categories.filter(cat => groupedFields.get(cat)!.length > 0);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getCategoryInfo = (category: string) => {
    const info = {
      contact: { title: 'Contact Information', icon: '👤', color: 'bg-blue-50 border-blue-200' },
      project: { title: 'Project Details', icon: '📋', color: 'bg-green-50 border-green-200' },
      budget: { title: 'Budget & Timeline', icon: '💰', color: 'bg-yellow-50 border-yellow-200' },
      team: { title: 'Team & Stakeholders', icon: '👥', color: 'bg-purple-50 border-purple-200' },
      other: { title: 'Additional Information', icon: '📝', color: 'bg-gray-50 border-gray-200' }
    };
    return info[category as keyof typeof info] || info.other;
  };

  const renderField = (key: string, value: any) => {
    const fieldLabel = fieldLabelMap.get(key) || key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm mb-1">{fieldLabel}</h4>
          <div className="text-gray-700 text-sm">
            {typeof value === 'object' && value !== null ? (
              <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-20 whitespace-pre-wrap">
                {formatValue(value)}
              </pre>
            ) : (
              <p className="leading-relaxed">{formatValue(value)}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get fields to display based on active tab
  const getFieldsToDisplay = () => {
    if (activeTab === 'all') {
      return Object.entries(data);
    } else {
      return groupedFields.get(activeTab) || [];
    }
  };

  const fieldsToDisplay = getFieldsToDisplay();

  return (
    <div className="h-full flex flex-col">
      {/* Tabs for different views */}
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Fields ({Object.keys(data).length})
        </button>
        {nonEmptyCategories.map(category => {
          const count = groupedFields.get(category)!.length;
          const info = getCategoryInfo(category);
          return (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === category 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {info.icon} {info.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'all' ? (
          // All fields view - grouped sections
          <div className="space-y-4 pb-4">
            {nonEmptyCategories.map(category => {
              const fields = groupedFields.get(category)!;
              const info = getCategoryInfo(category);
              const isExpanded = expandedSections.has(category);
              
              return (
                <div key={category} className={`border rounded-lg ${info.color}`}>
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium text-gray-900">{info.title}</span>
                      <Badge variant="secondary" className="ml-2">{fields.length} fields</Badge>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 text-gray-500 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {fields.map(([key, value]) => renderField(key, value))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Category view - simple list of fields for that category
          <div className="space-y-3 pb-4">
            {fieldsToDisplay.map(([key, value]) => renderField(key, value))}
          </div>
        )}
      </div>
    </div>
  );
}

// Modal component for submission details
function SubmissionDetailModal({ submissionId, isOpen, onOpenChange }: { 
  submissionId: string | null; 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { data: submissionDetail, isLoading: isLoadingSubmission, isError: isSubmissionError } = useQuery<FormSubmissionDetail, Error>({
    queryKey: ['formSubmissionDetail', submissionId],
    queryFn: () => getFormSubmissionDetail(submissionId!),
    enabled: !!submissionId && isOpen,
  });

  const { data: formDefinition, isLoading: isLoadingForm } = useQuery<FormDefinition, Error>({
    queryKey: ['formDefinition', submissionDetail?.form_id],
    queryFn: () => getFormDefinition(submissionDetail!.form_id),
    enabled: !!submissionDetail?.form_id && isOpen,
  });

  const isLoading = isLoadingSubmission || isLoadingForm;
  const isError = isSubmissionError;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%]">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">Submission Details</DialogTitle>
              <DialogDescription className="mt-1">
                {submissionDetail && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {submissionDetail.form_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(submissionDetail.submitted_at).toLocaleDateString()} at {new Date(submissionDetail.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12 flex-1">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading submission details...</p>
            </div>
          </div>
        )}
        
        {isError && (
          <div className="flex items-center justify-center py-12 flex-1">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">Failed to load submission details. Please try again.</p>
            </div>
          </div>
        )}
        
        {submissionDetail && (
          <div className="flex-1 overflow-hidden p-6 pt-0">
            <SubmissionDataDisplay 
              data={submissionDetail.data} 
              formFields={formDefinition?.definition.fields}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Main submissions page component
function SubmissionsPageContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const perPage = 20;

  const { data: submissions, isLoading, isError, error } = useQuery<FormSubmissionListResponse, Error>({
    queryKey: ['formSubmissions', currentPage],
    queryFn: () => getFormSubmissions(currentPage, perPage),
  });

  const handleViewDetails = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = submissions ? currentPage < submissions.pagination.total_pages : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading submissions...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Failed to load submissions</p>
            <p className="text-sm mt-2">{error?.message || 'An error occurred while fetching submissions.'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Form Submissions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all form submissions from your intake forms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            {submissions && (
              <>
                Showing {Math.min((currentPage - 1) * perPage + 1, submissions.pagination.total)} to{' '}
                {Math.min(currentPage * perPage, submissions.pagination.total)} of {submissions.pagination.total} submissions
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Submitter Email</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.items.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.form_name}
                      </TableCell>
                      <TableCell>
                        {submission.submitter_email ? (
                          <span className="text-sm">{submission.submitter_email}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No email</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.has_workflow ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            ✓ Linked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            No Workflow
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(submission.submitted_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(submission.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {submissions.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {submissions.pagination.total_pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!canGoPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!canGoNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No submissions found</p>
              <p className="text-sm mt-2">Submissions will appear here once users start submitting your intake forms.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submissionId={selectedSubmissionId}
        isOpen={isDetailModalOpen}
        onOpenChange={(open) => {
          setIsDetailModalOpen(open);
          if (!open) {
            setSelectedSubmissionId(null);
          }
        }}
      />
    </div>
  );
}

// Protected page wrapper
export default function SubmissionsPage() {
  return (
    <PrivateRoute requiredPermissions={['form_submissions:read']}>
      <SubmissionsPageContent />
    </PrivateRoute>
  );
} 