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
import { PlusCircle, Edit3, Trash2, Eye, ArrowLeft, GripVertical, Link as LinkIcon, Loader2 } from "lucide-react";
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';

// --- INTERFACES ---
interface FormFieldItem { 
  id: string; 
  label: string; 
  fieldType: 'text' | 'email' | 'dropdown' | 'file'; 
  options: string; 
  isMandatory: boolean; 
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

const getForms = async (): Promise<IntakeForm[]> => (await axios.get(API_URL)).data;
const getFormById = async (formId: string): Promise<IntakeForm> => (await axios.get(`${API_URL}/${formId}`)).data;
const getWorkflowsForSelection = async (): Promise<WorkflowSelection[]> => (await axios.get(WORKFLOWS_API_URL)).data;
const createIntakeFormAPI = async (formData: IntakeFormCreate): Promise<IntakeForm> => (await axios.post(API_URL, formData)).data;
const updateIntakeFormAPI = async ({ formId, formData }: { formId: string, formData: IntakeFormUpdate }): Promise<IntakeForm> => (await axios.put(`${API_URL}/${formId}`, formData)).data;
const deleteIntakeFormAPI = async (formId: string): Promise<void> => { await axios.delete(`${API_URL}/${formId}`); };

let fieldIdCounter = 0;
const generateFieldId = () => `field_${fieldIdCounter++}`;

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
      // Regenerate field IDs to avoid conflicts with the generateFieldId counter
      const fieldsWithUniqueIds = (editingFormData.definition.fields || []).map(field => ({
        ...field,
        id: generateFieldId()
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

  const handleAddField = () => {
    setFields([
      ...fields,
      { id: generateFieldId(), label: '', fieldType: 'text', options: '', isMandatory: false },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleFieldChange = (id: string, property: keyof FormFieldItem, value: string | boolean | FormFieldItem['fieldType']) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );
  };

  if (viewMode === 'builder') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {editingFormId ? "Edit Intake Form" : "Create New Intake Form"}
          </h1>
          <Button variant="outline" onClick={() => { setViewMode('list'); resetFormBuilderState(); }} className="rounded-lg">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Forms
          </Button>
        </div>

        {isFetchingEditingForm && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Loading form data...</p>
          </div>
        )}

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>Define the name, fields, and link a workflow for your intake form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="formName" className="text-base">Form Name</Label>
              <Input 
                id="formName" 
                placeholder="e.g., Client Onboarding Questionnaire" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 bg-background border-input-border text-base rounded-lg"
              />
            </div>
            
            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Fields</h3>
              {fields.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed rounded-lg border-border bg-accent/30">
                  <p className="text-muted-foreground">
                    No fields added yet. Click "Add Field" to start building your form.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="bg-accent/20 p-4 rounded-lg shadow-md">
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                         <h4 className="font-semibold text-base flex items-center">
                           <GripVertical className="mr-2 h-5 w-5 text-muted-foreground cursor-grab" />
                           Field {index + 1}
                         </h4>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor={`${field.id}-label`} className="text-sm">Field Label</Label>
                          <Input
                            id={`${field.id}-label`}
                            placeholder="e.g., Your Name"
                            value={field.label}
                            onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                            className="bg-background border-input-border rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${field.id}-type`} className="text-sm">Field Type</Label>
                          <Select
                            value={field.fieldType}
                            onValueChange={(value: FormFieldItem['fieldType']) => handleFieldChange(field.id, 'fieldType', value)}
                          >
                            <SelectTrigger id={`${field.id}-type`} className="bg-background border-input-border rounded-lg">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="dropdown">Dropdown</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {field.fieldType === 'dropdown' && (
                        <div className="space-y-1">
                          <Label htmlFor={`${field.id}-options`} className="text-sm">Dropdown Options (comma-separated)</Label>
                          <Input
                            id={`${field.id}-options`}
                            placeholder="e.g., Option 1, Option 2, Option 3"
                            value={field.options}
                            onChange={(e) => handleFieldChange(field.id, 'options', e.target.value)}
                            className="bg-background border-input-border rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id={`${field.id}-mandatory`}
                          checked={field.isMandatory}
                          onCheckedChange={(checked) => handleFieldChange(field.id, 'isMandatory', !!checked)}
                        />
                        <Label htmlFor={`${field.id}-mandatory`} className="text-sm font-normal cursor-pointer">
                          Mandatory Field
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="mt-6 rounded-lg" onClick={handleAddField}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Field
              </Button>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <LinkIcon className="mr-2 h-5 w-5 text-primary" />
                    Link Workflow
                </h3>
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow} disabled={isLoadingWorkflows}>
                    <SelectTrigger className="bg-background border-input-border rounded-lg">
                        <SelectValue placeholder={isLoadingWorkflows ? "Loading workflows..." : "Select a workflow to trigger (Required)"} />
                    </SelectTrigger>
                    <SelectContent>
                        {workflowsForSelection?.map(wf => (
                            <SelectItem key={wf.id} value={wf.id}>
                                {wf.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-2">
                    The selected workflow will be triggered automatically when this form is submitted.
                </p>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button variant="outline" onClick={() => { setViewMode('list'); resetFormBuilderState(); }} className="rounded-lg">Cancel</Button>
            <Button
              onClick={handleSaveForm}
              className="rounded-lg"
              disabled={!formName || fields.length === 0 || !selectedWorkflow || isSaving}
            >
              {isSaving ? (editingFormId ? "Updating..." : "Saving...") : (editingFormId ? "Update Form" : "Save Form")}
            </Button>
          </CardFooter>
        </Card>
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
    

    

    
