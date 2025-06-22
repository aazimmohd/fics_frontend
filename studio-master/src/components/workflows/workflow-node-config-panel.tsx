'use client';

import type { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XIcon, Settings2, Plus, Trash2, PlusCircle, GitFork, Mail, Database, Webhook, Timer, UserCheck, FilePenLine } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';
import { isValidEmail } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
  const { data } = await axios.get('http://127.0.0.1:8000/api/database-configs');
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
      } else if (node.type === 'condition' && !initialData.logic) {
        initialData.logic = { variable: '', operator: 'contains', value: '' };
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

  const handleLogicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, logic: { ...prev.logic, [name]: value } } : null);
  };

  const handleLogicSelectChange = (value: string) => {
    setFormData((prev: Node['data'] | null) => prev ? { ...prev, logic: { ...prev.logic, operator: value } } : null);
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
                <div><Label className="text-sm font-medium">Database Connection</Label><Select onValueChange={(v) => handleSelectChange('connectionNickname', v)} value={formData.connectionNickname || ''}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{dbConfigs?.map(c => <SelectItem key={c.id} value={c.config_name}>{c.config_name}</SelectItem>)}</SelectContent></Select></div>
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
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">The workflow will proceed based on whether this condition is true or false.</p>
                <div>
                  <Label htmlFor="logicVariable" className="text-sm font-medium">Variable</Label>
                  <Input name="variable" value={formData.logic?.variable || ''} onChange={handleLogicChange} placeholder="e.g., {{form.status}}" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="logicOperator" className="text-sm font-medium">Operator</Label>
                  <Select value={formData.logic?.operator || 'contains'} onValueChange={handleLogicSelectChange}>
                    <SelectTrigger id="logicOperator" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_contains">Does Not Contain</SelectItem>
                      <SelectItem value="not_equals">Does Not Equal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="logicValue" className="text-sm font-medium">Value</Label>
                  <Input name="value" value={formData.logic?.value || ''} onChange={handleLogicChange} placeholder="Value to compare against" className="mt-1" />
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

