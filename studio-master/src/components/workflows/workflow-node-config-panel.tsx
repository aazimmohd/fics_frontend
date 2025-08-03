'use client';

import type { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { XIcon, Settings2, Plus, Trash2, PlusCircle, GitFork, Mail, Database, Webhook, Timer, UserCheck, FilePenLine } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';
import { isValidEmail } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="h-32 w-full bg-muted animate-pulse rounded-lg" />
});

// Email templates
const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Our Platform', body: 'Dear {{name}},\n\nWelcome to our platform! We\'re excited to have you on board.' },
  { id: 'invoice', name: 'Invoice Notification', subject: 'Your Invoice is Ready', body: 'Dear {{name}},\n\nYour invoice #{{invoice_number}} is ready for review.' },
  { id: 'reminder', name: 'Reminder', subject: 'Reminder: Action Required', body: 'Dear {{name}},\n\nThis is a friendly reminder about your pending action.' },
];

// --- NEW INTERFACE & API CALL ---
interface DbConfig {
  id: string;
  config_name: string;
}
const getDbConfigsForSelect = async (): Promise<DbConfig[]> => {
  const data = await apiRequest('/database-configs');
  return data;
};

interface UserForSelection {
  id: string;
  name: string;
  email: string;
}
const getUsersForSelection = async (): Promise<UserForSelection[]> => {
  const data = await apiRequest('/users/for-selection');
  return data;
};

interface WorkflowNodeConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, newData: Partial<Node['data']>) => void;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}

export function WorkflowNodeConfigPanel({ node, onClose, onUpdateNodeData }: WorkflowNodeConfigPanelProps) {
  const [formData, setFormData] = useState<Node['data'] | null>(null);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const { toast } = useToast();

  // NEW: Fetch database connections for the dropdown
  const { data: dbConfigs, isLoading: isLoadingConfigs } = useQuery<DbConfig[], Error>({
    queryKey: ['dbConfigsForSelect'],
    queryFn: getDbConfigsForSelect,
    // Only fetch when the panel is open and the node is a type that needs it
    enabled: !!node && (node.type === 'runSql' || node.type === 'updateRecord'),
  });

  // NEW: Fetch users for the dropdown
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<UserForSelection[], Error>({
    queryKey: ['usersForSelection'],
    queryFn: getUsersForSelection,
    // Only fetch when the panel is open and the node is a humanTask
    enabled: !!node && node.type === 'humanTask',
    retry: 1
  });

  useEffect(() => {
    if (node) {
      // Initialize with default values if they don't exist
      const initialData = { ...node.data };
      if (node.type === 'delay') {
        initialData.duration = initialData.duration || 60;
        initialData.unit = initialData.unit || 'seconds';
      } else if (node.type === 'sendEmail') {
        initialData.cc = initialData.cc || [];
        initialData.bcc = initialData.bcc || [];
      } else if (node.type === 'updateRecord' && !initialData.fieldsToUpdate) {
        initialData.fieldsToUpdate = [{ column: '', value: '' }]; // Start with one empty field
      } else if (node.type === 'condition') {
        // Migrate from old logic structure to new conditions structure if needed
        if (initialData.logic) {
          console.log('Migrating condition node from old logic structure to new conditions structure');
          initialData.conditions = {
            if: { 
              variable: initialData.logic.variable || '', 
              operator: initialData.logic.operator || 'equals', 
              value: initialData.logic.value || '' 
            },
            elseif: [],
            else: { enabled: false }
          };
          // Remove the old logic structure
          delete initialData.logic;
        } else if (!initialData.conditions) {
          // Initialize new condition node
          initialData.conditions = {
            if: { variable: '', operator: 'equals', value: '' },
            elseif: [],
            else: { enabled: false }
          };
        } else {
          // Fix existing condition nodes that might have empty operators
          if (initialData.conditions.if && !initialData.conditions.if.operator) {
            initialData.conditions.if.operator = 'equals';
          }
          // Fix elseif conditions that might have empty operators
          if (initialData.conditions.elseif) {
            initialData.conditions.elseif = initialData.conditions.elseif.map((condition: any) => ({
              ...condition,
              operator: condition.operator || 'equals'
            }));
          }
        }
      }
      // NEW: Initialization for Firestore nodes
      if (node.type === 'getFirestoreDocument' && !initialData.firestore) {
        initialData.firestore = { collectionPath: '', documentId: '' };
      }
      if (node.type === 'updateFirestoreDocument' && !initialData.firestore) {
        initialData.firestore = { collectionPath: '', documentId: '', fieldsToUpdate: [] };
      }
      setFormData(initialData);
    } else {
      setFormData(null);
    }
  }, [node]);

  if (!node || !formData) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, [name]: value } : null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, [name]: value } : null);
  };

  const handleRichTextChange = (content: string) => {
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, body: content } : null);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData((prev: Node['data'] | null) => prev ? {
        ...prev,
        subject: template.subject,
        body: template.body
      } : null);
    }
  };

  const handleEmailListChange = (type: 'cc' | 'bcc', index: number, value: string) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const list = [...(prev[type] || [])];
      list[index] = value;
      return { ...prev, [type]: list };
    });
  };

  const addEmailToList = (type: 'cc' | 'bcc') => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const list = [...(prev[type] || [])];
      list.push('');
      return { ...prev, [type]: list };
    });
  };

  const removeEmailFromList = (type: 'cc' | 'bcc', index: number) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const list = [...(prev[type] || [])];
      list.splice(index, 1);
      return { ...prev, [type]: list };
    });
  };

  const validateEmails = () => {
    const emails = [
      formData.to,
      ...(formData.cc || []),
      ...(formData.bcc || [])
    ].filter(Boolean);

    const invalidEmails = emails.filter(email => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email Addresses",
        description: `Please check these email addresses: ${invalidEmails.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData) {
      onUpdateNodeData(node.id, formData);
    }
    toast({ title: "Node Updated", description: "Changes have been applied." });
  };

  // --- NEW: Handlers for the dynamic list of fields ---
  const handleFieldArrayChange = (index: number, field: 'column' | 'value', value: string) => {
    if (!formData?.fieldsToUpdate) return;
    const newFields = [...formData.fieldsToUpdate];
    newFields[index][field] = value;
    setFormData({ ...formData, fieldsToUpdate: newFields });
  };

  const addFieldToUpdate = () => {
    if (!formData) return;
    const newFields = [...(formData.fieldsToUpdate || []), { column: '', value: '' }];
    setFormData({ ...formData, fieldsToUpdate: newFields });
  };

  const removeFieldToUpdate = (index: number) => {
    if (!formData?.fieldsToUpdate) return;
    const newFields = formData.fieldsToUpdate.filter((_: {column: string; value: string}, i: number) => i !== index);
    setFormData({ ...formData, fieldsToUpdate: newFields });
  };



  // Enhanced condition node handlers
  const handleConditionChange = (conditionType: 'if', field: string, value: string) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const conditions = prev.conditions || { 
        if: { variable: '', operator: 'equals', value: '' }, 
        elseif: [], 
        else: { enabled: false } 
      };
      return {
        ...prev,
        conditions: {
          ...conditions,
          [conditionType]: {
            ...conditions[conditionType],
            [field]: value
          }
        }
      };
    });
  };

  const handleElseIfConditionChange = (index: number, field: string, value: string) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const conditions = prev.conditions || { 
        if: { variable: '', operator: 'equals', value: '' }, 
        elseif: [], 
        else: { enabled: false } 
      };
      const newElseIf = [...(conditions.elseif || [])];
      newElseIf[index] = { ...newElseIf[index], [field]: value };
      return {
        ...prev,
        conditions: {
          ...conditions,
          elseif: newElseIf
        }
      };
    });
  };

  const addElseIfCondition = () => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const conditions = prev.conditions || { 
        if: { variable: '', operator: 'equals', value: '' }, 
        elseif: [], 
        else: { enabled: false } 
      };
      const newElseIf = [...(conditions.elseif || []), { variable: '', operator: 'equals', value: '' }];
      return {
        ...prev,
        conditions: {
          ...conditions,
          elseif: newElseIf
        }
      };
    });
  };

  const removeElseIfCondition = (index: number) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const conditions = prev.conditions || { 
        if: { variable: '', operator: 'equals', value: '' }, 
        elseif: [], 
        else: { enabled: false } 
      };
      const newElseIf = [...(conditions.elseif || [])];
      newElseIf.splice(index, 1);
      return {
        ...prev,
        conditions: {
          ...conditions,
          elseif: newElseIf
        }
      };
    });
  };

  const toggleElseCondition = (enabled: boolean) => {
    setFormData((prev: Node['data'] | null) => {
      if (!prev) return null;
      const conditions = prev.conditions || { if: {}, elseif: [], else: { enabled: false } };
      return {
        ...prev,
        conditions: {
          ...conditions,
          else: { enabled }
        }
      };
    });
  };

  // --- NEW: Handlers for nested/complex state ---
  const handleNestedInputChange = (objectName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, [objectName]: { ...prev[objectName], [name]: value } } : null);
  };

  const handleNestedSelectChange = (objectName: string, fieldName: string, value: string) => {
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, [objectName]: { ...prev[objectName], [fieldName]: value } } : null);
  };

  // Special handlers for Firestore nested arrays
  const handleFirestoreFieldArrayChange = (index: number, field: 'key' | 'value', value: string) => {
    if (!formData?.firestore?.fieldsToUpdate) return;
    const newFields = [...formData.firestore.fieldsToUpdate];
    newFields[index][field] = value;
    setFormData({ 
      ...formData, 
      firestore: { 
        ...formData.firestore, 
        fieldsToUpdate: newFields 
      } 
    });
  };

  const addFirestoreField = () => {
    if (!formData?.firestore) return;
    const newFields = [...(formData.firestore.fieldsToUpdate || []), { key: '', value: '' }];
    setFormData({ 
      ...formData, 
      firestore: { 
        ...formData.firestore, 
        fieldsToUpdate: newFields 
      } 
    });
  };

  const removeFirestoreField = (index: number) => {
    if (!formData?.firestore?.fieldsToUpdate) return;
    const newFields = formData.firestore.fieldsToUpdate.filter((_: any, i: number) => i !== index);
    setFormData({ 
      ...formData, 
      firestore: { 
        ...formData.firestore, 
        fieldsToUpdate: newFields 
      } 
    });
  };

  return (
    <div className="w-96 bg-card border-l border-border p-4 space-y-4 flex flex-col h-full shadow-xl flex-shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center text-foreground">
          <Settings2 className="mr-2 h-5 w-5 text-primary" />
          Configure: {formData.label || node.type}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-foreground">
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-grow flex flex-col overflow-y-auto">
        <div className="flex-grow space-y-4">
          <div>
            <Label htmlFor="nodeIdConfig" className="text-xs text-muted-foreground">Node ID</Label>
            <Input id="nodeIdConfig" value={node.id} readOnly disabled className="mt-1 bg-muted/30 border-muted/50 cursor-not-allowed rounded-lg text-sm" />
          </div>
          <div>
            <Label htmlFor="nodeTypeConfig" className="text-xs text-muted-foreground">Node Type</Label>
            <Input id="nodeTypeConfig" value={node.type || 'N/A'} readOnly disabled className="mt-1 bg-muted/30 border-muted/50 cursor-not-allowed rounded-lg text-sm" />
          </div>
          <div>
            <Label htmlFor="nodeLabelConfig" className="text-sm font-medium">Label</Label>
            <Input
              id="nodeLabelConfig"
              name="label"
              value={formData.label || ''}
              onChange={handleInputChange}
              className="mt-1 bg-background border-input-border rounded-lg text-sm"
              placeholder="Enter node label"
            />
          </div>

          <div className="pt-3 mt-3 border-t border-border">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Type Specific Settings</h3>
            {node.type === 'sendEmail' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailTemplateConfig" className="text-sm font-medium">Template</Label>
                  <Select
                    value=""
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger id="emailTemplateConfig" className="mt-1 text-sm rounded-lg bg-background border-input-border">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emailToConfig" className="text-sm font-medium">To</Label>
                  <p className="text-xs text-muted-foreground mt-1">You can use variables like {"{{form.email}}"}</p>
                  <Input
                    id="emailToConfig"
                    name="to"
                    value={formData.to || ''}
                    onChange={handleInputChange}
                    placeholder="recipient@example.com"
                    className="mt-1 text-sm rounded-lg bg-background border-input-border"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">CC</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCC(!showCC)}
                      className="text-xs"
                    >
                      {showCC ? 'Hide' : 'Show'} CC
                    </Button>
                  </div>
                  {showCC && (
                    <div className="space-y-2 mt-2">
                      {(formData.cc || []).map((email: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => handleEmailListChange('cc', index, e.target.value)}
                            placeholder="cc@example.com"
                            className="text-sm rounded-lg bg-background border-input-border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmailFromList('cc', index)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEmailToList('cc')}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add CC
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">BCC</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBCC(!showBCC)}
                      className="text-xs"
                    >
                      {showBCC ? 'Hide' : 'Show'} BCC
                    </Button>
                  </div>
                  {showBCC && (
                    <div className="space-y-2 mt-2">
                      {(formData.bcc || []).map((email: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => handleEmailListChange('bcc', index, e.target.value)}
                            placeholder="bcc@example.com"
                            className="text-sm rounded-lg bg-background border-input-border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmailFromList('bcc', index)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addEmailToList('bcc')}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add BCC
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="emailSubjectConfig" className="text-sm font-medium">Subject</Label>
                  <Input
                    id="emailSubjectConfig"
                    name="subject"
                    value={formData.subject || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Your Invoice is Ready"
                    className="mt-1 text-sm rounded-lg bg-background border-input-border"
                  />
                </div>
                <div>
                  <Label htmlFor="emailBodyConfig" className="text-sm font-medium">Body</Label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={formData.body || ''}
                      onChange={handleRichTextChange}
                      placeholder="Write your email content here..."
                    />
                  </div>
                </div>
              </div>
            )}
            {node.type === 'delay' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="delayDurationConfig" className="text-sm font-medium">Duration</Label>
                  <Input 
                    type="number" 
                    id="delayDurationConfig" 
                    name="duration" 
                    value={formData.duration || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 5" 
                    className="mt-1 text-sm rounded-lg bg-background border-input-border" 
                  />
                </div>
                <div>
                  <Label htmlFor="delayUnitConfig" className="text-sm font-medium">Unit</Label>
                  <Select
                    value={formData.unit || 'seconds'}
                    onValueChange={(value) => handleSelectChange('unit', value)}
                  >
                    <SelectTrigger id="delayUnitConfig" className="mt-1 text-sm rounded-lg bg-background border-input-border">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
             {node.type === 'runSql' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sqlConnectionNickname" className="text-sm font-medium">Database Connection</Label>
                  <Select
                    value={formData.connectionNickname || ''}
                    onValueChange={(value) => handleSelectChange('connectionNickname', value)}
                    disabled={isLoadingConfigs}
                  >
                    <SelectTrigger id="sqlConnectionNickname" className="mt-1">
                      <SelectValue placeholder={isLoadingConfigs ? "Loading connections..." : "Select a connection"} />
                    </SelectTrigger>
                    <SelectContent>
                      {dbConfigs?.map((config) => (
                        <SelectItem key={config.id} value={config.config_name}>
                          {config.config_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sqlQueryConfig" className="text-sm font-medium">SQL Query</Label>
                  <Textarea
                    id="sqlQueryConfig"
                    name="query"
                    value={formData.query || ''}
                    onChange={handleInputChange}
                    placeholder="SELECT * FROM users;"
                    rows={6}
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
            )}
            {node.type === 'updateRecord' && (
              <div className="space-y-4">
                <div><Label className="text-sm font-medium">Database Connection</Label><Select onValueChange={(v) => handleSelectChange('connectionNickname', v)} value={formData.connectionNickname || ''}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{dbConfigs?.filter(c => c.config_name && c.config_name.trim() !== '').map(c => <SelectItem key={c.id} value={c.config_name}>{c.config_name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-sm font-medium">Table Name</Label><Input name="tableName" value={formData.tableName || ''} onChange={handleInputChange} placeholder="e.g., public.users" /></div>
                <div className="pt-2"><h4 className="text-xs font-semibold uppercase text-muted-foreground">Record Matching (WHERE)</h4><div className="grid grid-cols-2 gap-2 mt-2"><div><Label className="text-sm">Look-up Column</Label><Input name="lookupColumn" value={formData.lookupColumn || ''} onChange={handleInputChange} placeholder="e.g., id" /></div><div><Label className="text-sm">Look-up Value</Label><Input name="lookupValue" value={formData.lookupValue || ''} onChange={handleInputChange} placeholder="e.g., {{form.user_id}}" /></div></div></div>
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Fields to Update (SET)</h4>
                  <div className="space-y-2 mt-2 border-l-2 pl-3 ml-1">
                    {formData.fieldsToUpdate && formData.fieldsToUpdate.length > 0 ? (
                      formData.fieldsToUpdate.map((field: {column: string; value: string}, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-background">
                          <div className="flex-grow space-y-1">
                              <Input placeholder="Column Name" value={field.column} onChange={(e) => handleFieldArrayChange(index, 'column', e.target.value)} className="text-sm h-8" />
                              <Input placeholder="New Value or {{variable}}" value={field.value} onChange={(e) => handleFieldArrayChange(index, 'value', e.target.value)} className="text-sm h-8" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeFieldToUpdate(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2 italic">No fields to update.</p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addFieldToUpdate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </div>
            )}
            {node.type === 'condition' && (
              <div className="space-y-6">
                {/* IF Condition */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <Label className="text-sm font-semibold text-blue-700">IF Condition</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Variable</Label>
                      <Input 
                        placeholder="e.g., {{form.email}}" 
                        value={formData.conditions?.if?.variable || ''} 
                        onChange={(e) => handleConditionChange('if', 'variable', e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Operator</Label>
                      <Select 
                        value={formData.conditions?.if?.operator || 'equals'} 
                        onValueChange={(value) => handleConditionChange('if', 'operator', value)}
                      >
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="not_contains">Not Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                          <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
                          <SelectItem value="less_than_or_equal">Less Than or Equal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input 
                        placeholder="e.g., aazim.m91@gmail.com" 
                        value={formData.conditions?.if?.value || ''} 
                        onChange={(e) => handleConditionChange('if', 'value', e.target.value)}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* ELSE IF Conditions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-orange-700">ELSE IF Conditions</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addElseIfCondition}
                      className="text-xs h-7"
                    >
                      <PlusCircle className="mr-1 h-3 w-3" />
                      Add ELSE IF
                    </Button>
                  </div>
                  
                  {formData.conditions?.elseif?.map((condition: any, index: number) => (
                    <div key={index} className="p-4 border border-orange-200 rounded-lg bg-orange-50/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <Label className="text-sm font-semibold text-orange-700">ELSE IF {index + 1}</Label>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeElseIfCondition(index)}
                          className="text-xs h-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Variable</Label>
                          <Input 
                            placeholder="e.g., {{form.email}}" 
                            value={condition.variable || ''} 
                            onChange={(e) => handleElseIfConditionChange(index, 'variable', e.target.value)}
                            className="text-sm h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Operator</Label>
                          <Select 
                            value={condition.operator || 'equals'} 
                            onValueChange={(value) => handleElseIfConditionChange(index, 'operator', value)}
                          >
                            <SelectTrigger className="text-sm h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="not_equals">Not Equals</SelectItem>
                              <SelectItem value="not_contains">Not Contains</SelectItem>
                              <SelectItem value="greater_than">Greater Than</SelectItem>
                              <SelectItem value="less_than">Less Than</SelectItem>
                              <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
                              <SelectItem value="less_than_or_equal">Less Than or Equal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Value</Label>
                          <Input 
                            placeholder="e.g., warcode91@gmail.com" 
                            value={condition.value || ''} 
                            onChange={(e) => handleElseIfConditionChange(index, 'value', e.target.value)}
                            className="text-sm h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ELSE Condition */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <Label className="text-sm font-semibold text-gray-700">ELSE (Default Path)</Label>
                    </div>
                    <Switch 
                      checked={formData.conditions?.else?.enabled || false}
                      onCheckedChange={toggleElseCondition}
                    />
                  </div>
                  {formData.conditions?.else?.enabled && (
                    <p className="text-xs text-muted-foreground mt-2">
                      When no conditions match, the workflow will follow this path.
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h5 className="text-xs font-medium text-foreground mb-2">Logic Summary</h5>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>• IF: {formData.conditions?.if?.variable || 'not set'} {formData.conditions?.if?.operator || 'equals'} "{formData.conditions?.if?.value || 'not set'}"</div>
                    {formData.conditions?.elseif?.map((condition: any, index: number) => (
                      <div key={index}>• ELSE IF: {condition.variable || 'not set'} {condition.operator || 'equals'} "{condition.value || 'not set'}"</div>
                    ))}
                    {formData.conditions?.else?.enabled && (
                      <div>• ELSE: Default path (when no conditions match)</div>
                    )}
                  </div>
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    💡 <strong>Note:</strong> Make sure your variable names match exactly with your form field names (case-sensitive). 
                    For example, if your form field is &quot;email&quot;, use &quot;form.email&quot; not &quot;form.Email&quot;.
                  </div>
                  
                  {/* Output Count */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Output Paths:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-primary">
                          {1 + (formData.conditions?.elseif?.length || 0) + (formData.conditions?.else?.enabled ? 1 : 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">paths</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Each condition will create a separate output path in your workflow.
                    </p>
                  </div>
                </div>

                {/* How it works */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-xs font-medium text-blue-700 mb-2">How it works</h5>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>1. Check IF condition first</div>
                    <div>2. If IF doesn't match, check ELSE IF conditions in order</div>
                    <div>3. If no conditions match and ELSE is enabled, take ELSE path</div>
                    <div>4. Each path creates a separate output in your workflow</div>
                  </div>
                </div>
              </div>
            )}
            {node.type === 'humanTask' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitleConfig" className="text-sm font-medium">Task Title</Label>
                  <Input
                    id="taskTitleConfig"
                    name="taskTitle"
                    value={formData.taskTitle || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Review and approve request"
                    className="mt-1 text-sm rounded-lg bg-background border-input-border"
                  />
                </div>
                <div>
                  <Label htmlFor="assigneeConfig" className="text-sm font-medium">Assignee</Label>
                  <p className="text-xs text-muted-foreground mt-1">Select a user from your organization</p>
                  <Select
                    value={formData.assigneeId || 'none'}
                    onValueChange={(value) => setFormData((prev: Node['data'] | null) => prev ? { ...prev, assigneeId: value === 'none' ? null : value } : null)}
                    disabled={isLoadingUsers}
                  >
                    <SelectTrigger id="assigneeConfig" className="mt-1 text-sm rounded-lg bg-background border-input-border">
                      <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select assignee"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No assignee (unassigned)</SelectItem>
                      {isLoadingUsers && <SelectItem value="loading" disabled>Loading users...</SelectItem>}
                      {usersError && <SelectItem value="error" disabled>Error loading users</SelectItem>}
                      {users?.map((user: UserForSelection) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* System-in-the-loop Configuration */}
                <div className="pt-3 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">System-in-the-Loop Settings</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="timeoutMinutesConfig" className="text-sm font-medium">Timeout (Minutes)</Label>
                      <p className="text-xs text-muted-foreground mt-1">Minutes before task is considered overdue (1-10080 minutes)</p>
                      <Input
                        id="timeoutMinutesConfig"
                        name="timeoutMinutes"
                        type="number"
                        min="1"
                        max="10080"
                        value={formData.timeoutMinutes || 2}
                        onChange={handleInputChange}
                        placeholder="2"
                        className="mt-1 text-sm rounded-lg bg-background border-input-border"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        💡 For testing: 1-5 minutes. For production: 30+ minutes recommended.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="backupAssigneeConfig" className="text-sm font-medium">Backup Assignee</Label>
                      <p className="text-xs text-muted-foreground mt-1">Select a backup user for automatic reassignment</p>
                      <Select
                        value={formData.backupAssigneeId || 'none'}
                        onValueChange={(value) => setFormData((prev: Node['data'] | null) => prev ? { ...prev, backupAssigneeId: value === 'none' ? null : value } : null)}
                        disabled={isLoadingUsers}
                      >
                        <SelectTrigger id="backupAssigneeConfig" className="mt-1 text-sm rounded-lg bg-background border-input-border">
                          <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select backup assignee"} />
                        </SelectTrigger>
                                                                    <SelectContent>
                          <SelectItem value="none">No backup assignee</SelectItem>
                          {isLoadingUsers && <SelectItem value="loading" disabled>Loading users...</SelectItem>}
                          {usersError && <SelectItem value="error" disabled>Error loading users</SelectItem>}
                          {users?.map((user: UserForSelection) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="escalationEnabledConfig" className="text-sm font-medium">Enable Escalation</Label>
                      <Select
                        value={formData.escalationEnabled ? 'true' : 'false'}
                        onValueChange={(value) => setFormData((prev: Node['data'] | null) => prev ? { ...prev, escalationEnabled: value === 'true' } : null)}
                      >
                        <SelectTrigger id="escalationEnabledConfig" className="mt-1 text-sm rounded-lg bg-background border-input-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled</SelectItem>
                          <SelectItem value="false">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="maxEscalationsConfig" className="text-sm font-medium">Max Escalations</Label>
                      <p className="text-xs text-muted-foreground mt-1">Maximum number of escalation attempts</p>
                      <Input
                        id="maxEscalationsConfig"
                        name="maxEscalations"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.maxEscalations || 3}
                        onChange={handleInputChange}
                        placeholder="3"
                        className="mt-1 text-sm rounded-lg bg-background border-input-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {node.type === 'getFirestoreDocument' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Collection Path</Label>
                  <Input 
                    name="collectionPath" 
                    value={formData.firestore?.collectionPath || ''} 
                    onChange={(e) => handleNestedInputChange('firestore', e)} 
                    placeholder="e.g., users" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Document ID</Label>
                  <Input 
                    name="documentId" 
                    value={formData.firestore?.documentId || ''} 
                    onChange={(e) => handleNestedInputChange('firestore', e)} 
                    placeholder="e.g., {{form.user_id}}" 
                  />
                </div>
              </div>
            )}
            {node.type === 'updateFirestoreDocument' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Collection Path</Label>
                  <Input 
                    name="collectionPath" 
                    value={formData.firestore?.collectionPath || ''} 
                    onChange={(e) => handleNestedInputChange('firestore', e)} 
                    placeholder="e.g., tickets" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Document ID</Label>
                  <Input 
                    name="documentId" 
                    value={formData.firestore?.documentId || ''} 
                    onChange={(e) => handleNestedInputChange('firestore', e)} 
                    placeholder="e.g., {{form.ticket_id}}" 
                  />
                </div>
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Fields to Update</h4>
                  <div className="space-y-2 mt-2 border-l-2 pl-3 ml-1">
                    {formData.firestore?.fieldsToUpdate?.map((field: {key: string; value: string}, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-background">
                        <div className="flex-grow space-y-1">
                          <Input 
                            placeholder="Field Key" 
                            value={field.key} 
                            onChange={(e) => handleFirestoreFieldArrayChange(index, 'key', e.target.value)} 
                          />
                          <Input 
                            placeholder="New Value" 
                            value={field.value} 
                            onChange={(e) => handleFirestoreFieldArrayChange(index, 'value', e.target.value)} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeFirestoreField(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={addFirestoreField}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />Add Field
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {!(node.type === 'sendEmail' || node.type === 'delay' || node.type === 'runSql' || node.type === 'updateRecord' || node.type === 'input' || node.type === 'output' || node.type === 'default') && (
                <p className="text-xs text-muted-foreground italic">No specific configurations available for this node type yet.</p>
            )}
            {(node.type === 'input' || node.type === 'output' || node.type === 'default') && !formData.to && !formData.duration && !formData.query && (
                 <p className="text-xs text-muted-foreground italic">This node type has no specific settings beyond its label.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t mt-auto">
          <Button
            type="submit"
            className="w-full rounded-lg"
          >
            Apply Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

