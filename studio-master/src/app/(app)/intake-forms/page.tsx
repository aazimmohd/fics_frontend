'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Edit3, Trash2, Eye, ArrowLeft, GripVertical, Loader2, FileText, Mail, Upload, ChevronDown, Calendar, Phone, Star, Hash, Globe, CheckSquare, Radio, Type, ExternalLink, Share2, Plus, CheckCircle, XCircle, Search, Filter, MoreVertical, TrendingUp, Users, Clock, Zap, Copy, Download } from "lucide-react";
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { api, shareForm, ShareFormRequest, ShareFormResponse } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import PrivateRoute from '@/components/PrivateRoute';

// --- INTERFACES ---
interface FormFieldItem { 
  id: string; 
  label: string; 
  fieldType: 'text' | 'email' | 'dropdown' | 'file' | 'date' | 'phone' | 'number' | 'url' | 'checkbox' | 'radio' | 'textarea' | 'rating'; 
  options: string; 
  isMandatory: boolean; 
}

// Field type definitions
interface FieldType {
  id: FormFieldItem['fieldType'];
  label: string;
  icon: any;
}

interface IntakeForm { 
  id: string; 
  name: string; 
  submission_count: number; 
  updated_at: string; 
  linked_workflow_id: string | null; 
  definition: { fields: FormFieldItem[] }; 
}

interface IntakeFormCreate { 
  name: string; 
  definition: { fields: FormFieldItem[]; }; 
  linked_workflow_id: string | null; 
}

interface IntakeFormUpdate extends Partial<IntakeFormCreate> {}

interface WorkflowSelection { 
  id: string; 
  name: string; 
}

// --- API CALLS ---
const API_URL = 'http://127.0.0.1:8000/api/intake-forms';
const WORKFLOWS_API_URL = 'http://127.0.0.1:8000/api/workflows';

const getForms = async (): Promise<IntakeForm[]> => {
  const { api } = await import('@/lib/api');
  return await api.get('/intake-forms');
};

const getFormById = async (formId: string): Promise<IntakeForm> => {
  const response = await axios.get(`${API_URL}/${formId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
  return response.data;
};

const getWorkflowsForSelection = async (): Promise<WorkflowSelection[]> => {
  const response = await axios.get(WORKFLOWS_API_URL, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
  return response.data;
};

const createIntakeFormAPI = async (formData: IntakeFormCreate): Promise<IntakeForm> => {
  const response = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  });
  return response.data;
};

const updateIntakeFormAPI = async ({ formId, formData }: { formId: string, formData: IntakeFormUpdate }): Promise<IntakeForm> => {
  const response = await axios.put(`${API_URL}/${formId}`, formData, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  });
  return response.data;
};
const deleteIntakeFormAPI = async (formId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${formId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
};

let fieldIdCounter = 0;
const generateFieldId = (fieldType?: string, label?: string) => {
  // If we have a field type, use semantic names
  if (fieldType) {
    switch (fieldType) {
      case 'email':
        return 'email';
      case 'text':
        // Use label-based name for text fields if available
        if (label) {
          return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }
        return 'text_field';
      case 'dropdown':
        if (label) {
          return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }
        return 'dropdown_field';
      case 'file':
        return 'file_upload';
      default:
        return `field_${fieldIdCounter++}`;
    }
  }
  // Fallback to generic naming
  return `field_${fieldIdCounter++}`;
};

// Form Templates
interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: Omit<FormFieldItem, 'id'>[];
}

const formTemplates: FormTemplate[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Perfect for general inquiries and customer support',
    fields: [
      { label: 'Full Name', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Email Address', fieldType: 'email', options: '', isMandatory: true },
      { label: 'Phone Number', fieldType: 'phone', options: '', isMandatory: false },
      { label: 'Subject', fieldType: 'dropdown', options: 'General Inquiry, Support Request, Sales Question, Feedback', isMandatory: true },
      { label: 'Message', fieldType: 'textarea', options: '', isMandatory: true },
    ]
  },
  {
    id: 'lead',
    name: 'Lead Generation',
    description: 'Capture qualified leads for your sales team',
    fields: [
      { label: 'Company Name', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Contact Person', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Business Email', fieldType: 'email', options: '', isMandatory: true },
      { label: 'Company Size', fieldType: 'dropdown', options: '1-10 employees, 11-50 employees, 51-200 employees, 200+ employees', isMandatory: true },
      { label: 'Budget Range', fieldType: 'dropdown', options: 'Under $10k, $10k-$50k, $50k-$100k, $100k+', isMandatory: false },
      { label: 'Timeline', fieldType: 'dropdown', options: 'Immediate, Within 1 month, 1-3 months, 3+ months', isMandatory: false },
    ]
  },
  {
    id: 'event',
    name: 'Event Registration',
    description: 'Registration form for events and workshops',
    fields: [
      { label: 'Attendee Name', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Email', fieldType: 'email', options: '', isMandatory: true },
      { label: 'Phone', fieldType: 'phone', options: '', isMandatory: true },
      { label: 'Organization', fieldType: 'text', options: '', isMandatory: false },
      { label: 'Ticket Type', fieldType: 'radio', options: 'Early Bird, Regular, VIP, Student', isMandatory: true },
      { label: 'Dietary Restrictions', fieldType: 'checkbox', options: 'Vegetarian, Vegan, Gluten-free, Dairy-free, None', isMandatory: false },
    ]
  },
  {
    id: 'project-initiation',
    name: 'Project Initiation Questionnaire',
    description: 'Comprehensive questionnaire for new project onboarding and requirements gathering',
    fields: [
      // Contact Information
      { label: 'Contact Email', fieldType: 'email', options: '', isMandatory: true },
      { label: 'Contact Person', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Date', fieldType: 'date', options: '', isMandatory: true },
      
      // Section 1: Project Overview & Vision
      { label: 'Project Name', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Project Elevator Pitch (1-2 sentences)', fieldType: 'textarea', options: '', isMandatory: true },
      { label: 'The Problem (What specific problem is this project solving for your business or users?)', fieldType: 'textarea', options: '', isMandatory: true },
      
      // Section 2: Business & User Goals
      { label: 'Primary Business Objective (increase market share, create new revenue stream, improve efficiency)', fieldType: 'textarea', options: '', isMandatory: true },
      { label: 'Target Audience (Who are the primary users of this product? Describe their role, technical skill level, and any known challenges)', fieldType: 'textarea', options: '', isMandatory: true },
      { label: 'User Types (Are there different user roles, e.g., Admin, Standard User, Guest? List them)', fieldType: 'textarea', options: '', isMandatory: false },
      
      // Section 3: Scope & Features
      { label: 'Must-Have Features (Core features essential for the first launch)', fieldType: 'textarea', options: '', isMandatory: true },
      { label: 'Should-Have Features (Features that are important but could be added in a later phase)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Nice-to-Have Features (Features that would be great but are not critical)', fieldType: 'textarea', options: '', isMandatory: false },
      
      // Section 4: Design & User Experience
      { label: 'Branding Guidelines (Do you have existing brand colors, fonts, and logos? Please provide them or a link to your style guide)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Design Inspiration (Please provide links to any websites or apps you like, and briefly explain what you like about them)', fieldType: 'textarea', options: '', isMandatory: false },
      
      // Section 5: Technical Details
      { label: 'New or Existing System?', fieldType: 'radio', options: 'Brand-new system, Enhancement to existing system', isMandatory: true },
      { label: 'Technology Preferences (If brand new: Do you have any preference or requirement for the technology to be used? If not, we will propose the best stack for the job. If existing: involves existing system, please answer the following)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'System Access (How can we access the source code such as Git repository and any development/staging environments?)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Technology Stack (What languages, frameworks, databases, and servers does the current system use? Please include versions if known)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Existing Documentation (What technical or user documentation is available? e.g., architecture diagrams, API docs)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Current Pain Points (What are the biggest known issues, bugs, or performance problems with the current system?)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Integrations (Does the system need to connect with any third-party software, e.g., Salesforce, Stripe, social media platforms?)', fieldType: 'radio', options: 'Yes, No', isMandatory: true },
      { label: 'Integration Details (If yes, please specify which systems)', fieldType: 'textarea', options: '', isMandatory: false },
      { label: 'Security & Compliance (Are there any specific security or compliance standards to adhere to?)', fieldType: 'radio', options: 'Yes, No', isMandatory: true },
      { label: 'Security Requirements (If yes, please specify)', fieldType: 'textarea', options: '', isMandatory: false },
      
      // Section 6: Project Management
      { label: 'Primary Point of Contact (Who will be our main day-to-day contact from your team? Please provide name and email)', fieldType: 'text', options: '', isMandatory: true },
      { label: 'Final Decision Maker (Who has the final authority on project decisions regarding scope, budget, and timeline?)', fieldType: 'text', options: '', isMandatory: true },
      
      // Additional Information
      { label: 'Additional Comments or Requirements', fieldType: 'textarea', options: '', isMandatory: false },
    ]
  },
];

// Field type definitions
const fieldTypes: FieldType[] = [
  { id: 'text', label: 'Text Input', icon: Type },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'textarea', label: 'Long Text', icon: FileText },
  { id: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { id: 'radio', label: 'Radio Button', icon: Radio },
  { id: 'file', label: 'File Upload', icon: Upload },
  { id: 'date', label: 'Date Picker', icon: Calendar },
  { id: 'phone', label: 'Phone Number', icon: Phone },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'url', label: 'Website URL', icon: Globe },
  { id: 'rating', label: 'Star Rating', icon: Star },
];

export default function IntakeFormsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-workflow' | 'without-workflow'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'submissions' | 'updated'>('updated');
  const queryClient = useQueryClient();

  // --- BUILDER STATE ---
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [formToDelete, setFormToDelete] = useState<IntakeForm | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [formToShare, setFormToShare] = useState<IntakeForm | null>(null);
  const [shareEmails, setShareEmails] = useState<string>('');
  const [shareSubject, setShareSubject] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [includeFormLink, setIncludeFormLink] = useState<boolean>(true);

  // --- DATA FETCHING (QUERIES) ---
  const { data: forms, isLoading: isLoadingForms, isError, error } = useQuery<IntakeForm[], Error>({ 
    queryKey: ['intakeForms'], 
    queryFn: getForms 
  });
  
  const { data: workflowsForSelection, isLoading: isLoadingWorkflows } = useQuery<WorkflowSelection[], Error>({ 
    queryKey: ['workflowsForSelection'], 
    queryFn: getWorkflowsForSelection, 
    enabled: viewMode === 'builder' 
  });
  
  const { data: editingFormData, isFetching: isFetchingEditingForm } = useQuery<IntakeForm, Error>({
    queryKey: ['intakeForm', editingFormId],
    queryFn: () => getFormById(editingFormId!),
    enabled: !!editingFormId, // Only run this query if editingFormId is not null
  });

  // Filter and sort forms
  const filteredAndSortedForms = forms ? forms
    .filter(form => {
      const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'with-workflow' && form.linked_workflow_id) ||
        (filterStatus === 'without-workflow' && !form.linked_workflow_id);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'submissions':
          return b.submission_count - a.submission_count;
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    }) : [];

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: createIntakeFormAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setViewMode('list');
      resetFormBuilderState();
      toast({
        title: "Success",
        description: "Form created successfully!",
      });
    },
    onError: (error: AxiosError) => {
      toast({
        title: "Error",
        description: (error.response?.data as any)?.detail || "Failed to create form",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateIntakeFormAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setViewMode('list');
      resetFormBuilderState();
      toast({
        title: "Success",
        description: "Form updated successfully!",
      });
    },
    onError: (error: AxiosError) => {
      toast({
        title: "Error",
        description: (error.response?.data as any)?.detail || "Failed to update form",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIntakeFormAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setFormToDelete(null);
      toast({
        title: "Success",
        description: "Form deleted successfully!",
      });
    },
    onError: (error: AxiosError) => {
      toast({
        title: "Error",
        description: (error.response?.data as any)?.detail || "Failed to delete form",
        variant: "destructive",
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ formId, shareData }: { formId: string; shareData: ShareFormRequest }) => 
      shareForm(formId, shareData),
    onSuccess: (response: ShareFormResponse) => {
      setIsShareModalOpen(false);
      setFormToShare(null);
      resetShareForm();
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
      } else {
        toast({
          title: "Partial Success",
          description: response.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to share form",
        variant: "destructive",
      });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // --- LOGIC & HANDLERS ---
  useEffect(() => {
    if (editingFormData) {
      setFormName(editingFormData.name);
      // Regenerate field IDs using semantic names
      const fieldsWithUniqueIds = (editingFormData.definition.fields || []).map(field => ({
        ...field,
        id: generateFieldId(field.fieldType, field.label)
      }));
      setFields(fieldsWithUniqueIds);
      setSelectedWorkflow(editingFormData.linked_workflow_id || 'none');
    }
  }, [editingFormData]);

  const resetFormBuilderState = () => {
    setFormName('');
    setFields([]);
    setSelectedWorkflow('none');
    setEditingFormId(null);
  };

  const resetShareForm = () => {
    setShareEmails('');
    setShareSubject('');
    setShareMessage('');
    setIncludeFormLink(true);
  };

  const handleEditClick = (form: IntakeForm) => {
    setEditingFormId(form.id);
    setViewMode('builder');
    // Reset field counter to ensure unique IDs when editing
    fieldIdCounter = 0;
  };

  const handleSaveForm = () => {
    const payload = { 
      name: formName, 
      definition: { fields }, 
      linked_workflow_id: selectedWorkflow === "none" || !selectedWorkflow ? null : selectedWorkflow 
    };
    
    if (editingFormId) {
      updateMutation.mutate({ formId: editingFormId, formData: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddField = (fieldType: FormFieldItem['fieldType'] = 'text') => {
    setFields([
      ...fields,
      { id: generateFieldId(fieldType, ''), label: '', fieldType, options: '', isMandatory: false },
    ]);
  };

  const handleLoadTemplate = (template: FormTemplate) => {
    setFormName(template.name);
    const templateFields = template.fields.map(field => ({
      ...field,
      id: generateFieldId(field.fieldType, field.label)
    }));
    setFields(templateFields);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleFieldChange = (id: string, property: keyof FormFieldItem, value: string | boolean | FormFieldItem['fieldType']) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, [property]: value };
          // Regenerate ID if field type or label changed
          if (property === 'fieldType' || property === 'label') {
            updatedField.id = generateFieldId(
              property === 'fieldType' ? value as string : field.fieldType,
              property === 'label' ? value as string : field.label
            );
          }
          return updatedField;
        }
        return field;
      })
    );
  };

  const handleShareClick = (form: IntakeForm) => {
    setFormToShare(form);
    setIsShareModalOpen(true);
  };

  if (viewMode === 'builder') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Enhanced Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {editingFormId ? "Edit Intake Form" : "Create New Intake Form"}
                </h1>
                <p className="text-slate-600 mt-1">
                  {editingFormId ? "Modify your form and update workflows" : "Build forms that capture leads and trigger automated workflows"}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setViewMode('list'); resetFormBuilderState(); }}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Forms
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-800">Form Builder Progress</h4>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  {(() => {
                    const steps = [
                      { done: !!formName, label: 'Name' },
                      { done: fields.length > 0, label: 'Fields' },
                      { done: !!selectedWorkflow, label: 'Workflow' }
                    ];
                    const completed = steps.filter(s => s.done).length;
                    return `${completed}/3 completed`;
                  })()}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {[
                { done: !!formName, label: 'Form Name', icon: FileText },
                { done: fields.length > 0, label: 'Add Fields', icon: Plus },
                { done: !!selectedWorkflow, label: 'Link Workflow', icon: Zap }
              ].map((step, index) => (
                <div key={index} className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.done 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      step.done ? 'text-blue-700' : 'text-slate-500'
                    }`}>{step.label}</span>
                  </div>
                  <div className={`h-2 rounded-full transition-all duration-500 ${
                    step.done 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm' 
                      : 'bg-slate-200'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isFetchingEditingForm && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Loading form data...</p>
          </div>
        )}

        {/* Main Content: 2-column layout */}
        <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto">
          {/* Left Sidebar - Field Types */}
          <div className="w-96 border-r border-slate-200 bg-white overflow-y-auto shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-slate-800 flex items-center gap-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                Add Fields
              </h3>
              
              {/* Templates */}
              {fields.length === 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Start Templates</h4>
                  <div className="space-y-2">
                    {formTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all duration-200 text-sm group"
                      >
                        <div className="font-medium text-slate-900 group-hover:text-blue-900">{template.name}</div>
                        <div className="text-slate-600 mt-1 group-hover:text-blue-700">{template.description}</div>
                        <div className="text-slate-500 mt-1 text-xs">{template.fields.length} fields</div>
                      </button>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              {/* Field Types */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Field Types</h4>
                <div className="grid grid-cols-1 gap-2">
                  {fieldTypes.map((fieldType) => (
                    <Button
                      key={fieldType.id}
                      variant="outline"
                      onClick={() => handleAddField(fieldType.id)}
                      className="flex items-center gap-3 h-auto p-3 text-left justify-start border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-sm transition-all duration-200 group"
                    >
                      <fieldType.icon className="h-4 w-4 text-slate-600 group-hover:text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{fieldType.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Form Configuration */}
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-8 space-y-8">
              {/* Form Name */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <Label htmlFor="formName" className="text-slate-800 font-semibold text-base">Form Name</Label>
                <Input 
                  id="formName" 
                  placeholder="e.g., Client Onboarding Questionnaire" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 border-slate-200 focus:border-blue-400 focus:ring-blue-200 text-lg"
                />
                <p className="text-sm text-slate-500 mt-2">Give your form a descriptive name that users will see</p>
              </div>

              {/* Form Fields */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                      Form Fields
                    </h3>
                    <p className="text-slate-600 mt-1">Configure the fields users will fill out</p>
                  </div>
                  
                  {fields.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFields([]);
                        setFormName('');
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
                
                {fields.length === 0 && (
                  <div className="text-center border-2 border-dashed border-slate-300 rounded-xl p-12 bg-gradient-to-br from-slate-50 to-blue-50">
                    <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                      <PlusCircle className="h-10 w-10 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-slate-800 mb-3">No fields added yet</h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">Use the sidebar to add your first field. You can choose from various field types or use a template to get started quickly.</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Start by adding a field from the sidebar</span>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {fields.map((field, index) => {
                    const fieldTypeConfig = fieldTypes.find(type => type.id === field.fieldType) || fieldTypes[0];
                    return (
                      <Card key={field.id} className="border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <GripVertical className="h-5 w-5 text-slate-400 cursor-grab hover:text-slate-600 transition-colors" />
                              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <fieldTypeConfig.icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 text-lg">
                                  {fieldTypeConfig.label} {index + 1}
                                </h4>
                                <p className="text-sm text-slate-500">Field configuration</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveField(field.id)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <Label htmlFor={`${field.id}-label`} className="text-slate-700 font-medium">Field Label</Label>
                                <Input
                                  id={`${field.id}-label`}
                                  placeholder="e.g., Full Name"
                                  value={field.label}
                                  onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                  className="mt-2 border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                                />
                                <p className="text-xs text-slate-500 mt-1">This is what users will see as the field label</p>
                              </div>

                              <div>
                                <Label htmlFor={`${field.id}-type`} className="text-slate-700 font-medium">Field Type</Label>
                                <Select value={field.fieldType} onValueChange={(value: FormFieldItem['fieldType']) => handleFieldChange(field.id, 'fieldType', value)}>
                                  <SelectTrigger className="mt-2 border-slate-200 focus:border-blue-400 focus:ring-blue-200">
                                    <SelectValue placeholder="Select field type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        <div className="flex items-center gap-2">
                                          <type.icon className="h-4 w-4" />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500 mt-1">Choose the type of input for this field</p>
                              </div>
                            </div>

                            {(field.fieldType === 'dropdown' || field.fieldType === 'radio' || field.fieldType === 'checkbox') && (
                              <div>
                                <Label htmlFor={`${field.id}-options`} className="text-slate-700 font-medium">Options (comma-separated)</Label>
                                <Input
                                  id={`${field.id}-options`}
                                  placeholder="e.g., Small, Medium, Large"
                                  value={field.options}
                                  onChange={(e) => handleFieldChange(field.id, 'options', e.target.value)}
                                  className="mt-2 border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                                />
                                <p className="text-xs text-slate-500 mt-1">Enter options separated by commas</p>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <Checkbox
                                id={`${field.id}-mandatory`}
                                checked={field.isMandatory}
                                onCheckedChange={(checked) => handleFieldChange(field.id, 'isMandatory', !!checked)}
                                className="border-slate-300"
                              />
                              <Label htmlFor={`${field.id}-mandatory`} className="text-sm font-medium text-slate-700">
                                Required Field
                              </Label>
                              <Badge variant={field.isMandatory ? "default" : "secondary"} className="ml-auto">
                                {field.isMandatory ? "Required" : "Optional"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Workflow Integration */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    Connect to Workflow
                  </h3>
                  <p className="text-slate-600 mt-1">Optionally choose a workflow to trigger when users submit this form</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-700 font-medium">Workflow (Optional)</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow} disabled={isLoadingWorkflows}>
                      <SelectTrigger className="mt-2 border-slate-200 focus:border-purple-300 focus:ring-purple-200">
                        <SelectValue placeholder={isLoadingWorkflows ? "Loading workflows..." : "Select a workflow (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No workflow</SelectItem>
                        {workflowsForSelection?.map(wf => (
                          <SelectItem key={wf.id} value={wf.id}>
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-purple-600" />
                              {wf.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Choose a workflow to automate actions when the form is submitted</p>
                  </div>
                  
                  {selectedWorkflow && selectedWorkflow !== "none" ? (
                    <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Workflow Connected</p>
                        <p className="text-emerald-700">When users submit this form, the selected workflow will start automatically with the form data as input.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-start gap-3">
                      <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="font-medium">No Workflow Selected</p>
                        <p className="text-slate-700">Form submissions will be saved but no automation will trigger. You can add a workflow later.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => { setViewMode('list'); resetFormBuilderState(); }}
                    className="border-slate-300 text-slate-600 hover:bg-slate-50 px-6"
                  >
                    Cancel
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                      {!formName && <span className="text-red-500">• Form name required</span>}
                      {formName && fields.length === 0 && <span className="text-red-500">• At least one field required</span>}
                      {formName && fields.length > 0 && <span className="text-emerald-500">✓ Ready to save</span>}
                    </div>
                    <Button
                      onClick={handleSaveForm}
                      disabled={!formName || fields.length === 0 || isSaving}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 px-8 py-3"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {editingFormId ? "Updating..." : "Saving..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {editingFormId ? "Update Form" : "Create Form"}
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Intake Forms
              </h1>
              <p className="text-slate-600 mt-1">
                Create and manage forms to capture leads and automate workflows
              </p>
            </div>
            <Button 
              onClick={() => setViewMode('builder')} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Form
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {forms && forms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Forms</p>
                    <p className="text-2xl font-bold text-blue-900">{forms.length}</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <FileText className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Total Submissions</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {forms.reduce((sum, form) => sum + form.submission_count, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-200 rounded-full">
                    <TrendingUp className="h-6 w-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Active Workflows</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {forms.filter(f => f.linked_workflow_id).length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Zap className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Recent Activity</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {forms.filter(f => {
                        const daysSinceUpdate = (Date.now() - new Date(f.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                        return daysSinceUpdate <= 7;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-full">
                    <Clock className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search forms by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-48 border-slate-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="with-workflow">With Workflow</SelectItem>
                  <SelectItem value="without-workflow">Without Workflow</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40 border-slate-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="submissions">Most Submissions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Handle Loading State */}
        {isLoadingForms && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Loading your forms...</p>
              <p className="text-slate-500 text-sm mt-2">This will just take a moment</p>
            </div>
          </div>
        )}

        {/* Handle Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-medium">Error loading forms</p>
              <p className="text-red-600 text-sm mt-1">{error?.message || 'Unknown error occurred'}</p>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Forms Grid */}
        {filteredAndSortedForms.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedForms.map((form) => (
              <Card key={form.id} className="group hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-blue-300 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {form.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={form.linked_workflow_id ? "default" : "secondary"}
                          className={form.linked_workflow_id ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600"}
                        >
                          {form.linked_workflow_id ? (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              Workflow Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              No Workflow
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600">
                        <Users className="h-4 w-4 mr-2" />
                        Submissions
                      </div>
                      <span className="font-semibold text-slate-900">{form.submission_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Last Modified
                      </div>
                      <span className="text-slate-700">
                        {new Date(form.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Fields
                      </div>
                      <span className="text-slate-700">
                        {form.definition?.fields?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                      onClick={() => window.open(`/form/${form.id}`, '_blank')}
                    >
                      <Eye className="mr-1 h-4 w-4" /> Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-700 hover:text-green-700"
                      onClick={() => handleShareClick(form)}
                    >
                      <Share2 className="mr-1 h-4 w-4" /> Share
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      onClick={() => handleEditClick(form)}
                    >
                      <Edit3 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700"
                      onClick={() => setFormToDelete(form)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced Empty State */}
        {forms && forms.length === 0 && (
          <Card className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 border-dashed border-2 border-slate-300">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No forms created yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Get started by creating your first intake form. You can choose from templates or build from scratch.
              </p>
              <Button 
                onClick={() => setViewMode('builder')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {forms && forms.length > 0 && filteredAndSortedForms.length === 0 && (
          <Card className="text-center py-16 bg-gradient-to-br from-slate-50 to-orange-50 border-dashed border-2 border-slate-300">
            <CardContent>
              <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Search className="h-12 w-12 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No forms found</h3>
              <p className="text-slate-600 mb-6">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDeleteDialog
        isOpen={!!formToDelete}
        onClose={() => setFormToDelete(null)}
        onConfirm={() => {
          if (formToDelete) {
            deleteMutation.mutate(formToDelete.id);
          }
        }}
        title={`Delete "${formToDelete?.name}"?`}
        description="This will permanently delete the form and all its submissions. This action cannot be undone."
      />

      {/* Share Form Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Form
            </DialogTitle>
            <DialogDescription>
              Send this form to recipients via email with a professional template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="emails">Recipient Emails</Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses separated by commas (e.g., john@example.com, jane@example.com)"
                value={shareEmails}
                onChange={(e) => setShareEmails(e.target.value)}
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can enter multiple email addresses separated by commas.
              </p>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={shareSubject}
                onChange={(e) => setShareSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to include in the email..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-link"
                checked={includeFormLink}
                onCheckedChange={(checked) => setIncludeFormLink(checked as boolean)}
              />
              <Label htmlFor="include-link">Include form link in email</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsShareModalOpen(false);
                resetShareForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!shareEmails.trim()) {
                  toast({
                    title: "Error",
                    description: "Please enter at least one email address",
                    variant: "destructive",
                  });
                  return;
                }

                const emails = shareEmails.split(',').map(email => email.trim()).filter(email => email);
                
                shareMutation.mutate({
                  formId: formToShare!.id,
                  shareData: {
                    recipient_emails: emails,
                    subject: shareSubject,
                    message: shareMessage,
                    include_form_link: includeFormLink,
                  }
                });
              }}
              disabled={shareMutation.isPending || !shareEmails.trim()}
            >
              {shareMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    

    

    
