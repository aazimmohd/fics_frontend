'use client';

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Edit3, Trash2, Eye, ArrowLeft, GripVertical, Loader2, FileText, Mail, Upload, ChevronDown, Calendar, Phone, Star, Hash, Globe, CheckSquare, Radio, Type } from "lucide-react";
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';

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
  const queryClient = useQueryClient();

  // --- BUILDER STATE ---
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [formToDelete, setFormToDelete] = useState<IntakeForm | null>(null);

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

  // --- DATA MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: createIntakeFormAPI,
    onSuccess: () => {
      console.log("Form Created");
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setViewMode('list');
      resetFormBuilderState();
    },
    onError: (error: AxiosError) => {
      console.error("Error Creating Form:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateIntakeFormAPI,
    onSuccess: () => {
      console.log("Form Updated");
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setViewMode('list');
      resetFormBuilderState();
    },
    onError: (error: AxiosError) => {
      console.error("Error Updating Form:", error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIntakeFormAPI,
    onSuccess: () => {
      console.log("Form Deleted");
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      setFormToDelete(null);
    },
    onError: (error: AxiosError) => {
      console.error("Error Deleting Form:", error);
      setFormToDelete(null);
    }
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
      setSelectedWorkflow(editingFormData.linked_workflow_id || '');
    }
  }, [editingFormData]);

  const resetFormBuilderState = () => {
    setEditingFormId(null);
    setFormName('');
    setFields([]);
    setSelectedWorkflow('');
    fieldIdCounter = 0;
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
      linked_workflow_id: selectedWorkflow || null 
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

  if (viewMode === 'builder') {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingFormId ? "Edit Intake Form" : "Create New Intake Form"}
            </h1>
            <p className="text-gray-600 mt-1">
              {editingFormId ? "Modify your form and update workflows" : "Build forms that capture leads and trigger automated workflows"}
            </p>
          </div>
          <Button variant="outline" onClick={() => { setViewMode('list'); resetFormBuilderState(); }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">Progress</h4>
            <span className="text-sm text-slate-600 bg-white px-2 py-1 rounded-full">
              {(() => {
                const steps = [
                  { done: !!formName, label: 'Name' },
                  { done: fields.length > 0, label: 'Fields' },
                  { done: !!selectedWorkflow, label: 'Workflow' }
                ];
                const completed = steps.filter(s => s.done).length;
                return `${completed}/3 completed`;
              })()}
            </span>
          </div>
          <div className="flex gap-3">
            {[
              { done: !!formName, label: 'Form Name' },
              { done: fields.length > 0, label: 'Add Fields' },
              { done: !!selectedWorkflow, label: 'Link Workflow' }
            ].map((step, index) => (
              <div key={index} className="flex-1">
                <div className={`h-2 rounded-full transition-all duration-500 ${
                  step.done 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm' 
                    : 'bg-slate-200'
                }`}></div>
                <span className={`text-xs font-medium mt-2 block transition-colors duration-300 ${
                  step.done ? 'text-blue-700' : 'text-slate-500'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {isFetchingEditingForm && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Loading form data...</p>
          </div>
        )}

        {/* Main Content: 2-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Field Types */}
          <div className="w-80 border-r bg-gradient-to-b from-slate-50 to-white overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Form Name */}
              <div>
                <Label htmlFor="formName" className="text-slate-700 font-medium">Form Name</Label>
                <Input 
                  id="formName" 
                  placeholder="e.g., Client Onboarding Questionnaire" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                />
              </div>

              {/* Form Fields */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Form Fields
                    </h3>
                    <p className="text-sm text-slate-600">Configure the fields users will fill out</p>
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
                  <div className="text-center border-2 border-dashed border-slate-300 rounded-lg p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                    <PlusCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h4 className="font-medium text-slate-700 mb-2">No fields added yet</h4>
                    <p className="text-slate-500 mb-4">Use the sidebar to add your first field</p>
                  </div>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const fieldTypeConfig = fieldTypes.find(type => type.id === field.fieldType) || fieldTypes[0];
                    return (
                      <Card key={field.id} className="border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-slate-400 cursor-grab hover:text-slate-600" />
                              <div className="p-1.5 bg-blue-50 rounded-md">
                                <fieldTypeConfig.icon className="h-4 w-4 text-blue-600" />
                              </div>
                              <h4 className="font-medium text-slate-800">
                                {fieldTypeConfig.label} {index + 1}
                              </h4>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveField(field.id)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`${field.id}-label`}>Field Label</Label>
                                <Input
                                  id={`${field.id}-label`}
                                  placeholder="e.g., Full Name"
                                  value={field.label}
                                  onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`${field.id}-type`}>Field Type</Label>
                                <Select value={field.fieldType} onValueChange={(value: FormFieldItem['fieldType']) => handleFieldChange(field.id, 'fieldType', value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select field type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {(field.fieldType === 'dropdown' || field.fieldType === 'radio' || field.fieldType === 'checkbox') && (
                              <div>
                                <Label htmlFor={`${field.id}-options`}>Options (comma-separated)</Label>
                                <Input
                                  id={`${field.id}-options`}
                                  placeholder="e.g., Small, Medium, Large"
                                  value={field.options}
                                  onChange={(e) => handleFieldChange(field.id, 'options', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${field.id}-mandatory`}
                                checked={field.isMandatory}
                                onCheckedChange={(checked) => handleFieldChange(field.id, 'isMandatory', !!checked)}
                              />
                              <Label htmlFor={`${field.id}-mandatory`} className="text-sm">
                                Required Field
                              </Label>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Workflow Integration */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Connect to Workflow
                  </h3>
                  <p className="text-sm text-slate-600">Choose which workflow will be triggered when users submit this form</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-700">Workflow</Label>
                    <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow} disabled={isLoadingWorkflows}>
                      <SelectTrigger className="mt-1 border-slate-200 focus:border-purple-300 focus:ring-purple-200">
                        <SelectValue placeholder={isLoadingWorkflows ? "Loading workflows..." : "Select a workflow (Required)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {workflowsForSelection?.map(wf => (
                          <SelectItem key={wf.id} value={wf.id}>
                            {wf.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedWorkflow && (
                    <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                      When users submit this form, the selected workflow will start automatically with the form data as input.
                    </div>
                  )}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-between pt-6 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={() => { setViewMode('list'); resetFormBuilderState(); }}
                  className="border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveForm}
                  disabled={!formName || fields.length === 0 || !selectedWorkflow || isSaving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingFormId ? "Updating..." : "Saving..."}
                    </div>
                  ) : (
                    editingFormId ? "Update Form" : "Create Form"
                  )}
                </Button>
              </div>
            </div>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Intake Forms</h1>
        <Button onClick={() => setViewMode('builder')} className="rounded-lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Form
        </Button>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold font-headline">Existing Forms</h2>
        
        {/* Handle Loading State */}
        {isLoadingForms && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Loading forms...</p>
          </div>
        )}

        {/* Handle Error State */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                Error loading forms: {error?.message || 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Render data from API call */}
        {forms && forms.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle>{form.name}</CardTitle>
                  <CardDescription>
                    Submissions: {form.submission_count} | Last Modified: {new Date(form.updated_at).toLocaleDateString()}
                  </CardDescription>
                  <CardDescription className="text-xs mt-1 text-primary">
                    Linked Workflow: {form.linked_workflow_id ? 'Yes' : 'None'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    <Eye className="mr-1 h-4 w-4" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-lg"
                    onClick={() => handleEditClick(form)}
                  >
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-lg"
                    onClick={() => setFormToDelete(form)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Handle Empty State from API */}
        {forms && forms.length === 0 && (
           <Card className="shadow-md rounded-lg">
             <CardContent className="pt-6">
               <p className="text-muted-foreground text-center py-8">
                 No intake forms created yet. Click "Create New Form" to get started.
               </p>
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
    </div>
  );
}
    

    

    
