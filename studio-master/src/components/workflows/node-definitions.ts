import type { LucideIcon } from 'lucide-react';
import { Mail, Database, Webhook, Timer, GitFork, UserCheck, FilePenLine, LogIn, LogOut, ChevronsRight, ClipboardPaste, FileSearch, UserRoundCheck } from "lucide-react";

export interface NodeDefinition {
  type: string;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultData?: Record<string, any>;
  isToolNode?: boolean; // To differentiate from input/output/default
}

export const nodeDefinitions: NodeDefinition[] = [
  { type: 'input', label: 'Start Trigger', icon: LogIn, description: "Generic entry point for a workflow (e.g. manual, scheduled).", defaultData: { type: 'input', label: 'Start Trigger' } },
  { type: 'input_form', label: 'Form Submit Trigger', icon: ClipboardPaste, description: "Starts workflow on submission of a linked Intake Form.", defaultData: { type: 'input_form', label: 'Form Submit Trigger' } },
  { type: 'output', label: 'End Event', icon: LogOut, description: "Ends the workflow.", defaultData: { type: 'output', label: 'End Event' } },
  { type: 'default', label: 'Generic Task', icon: ChevronsRight, description: "A generic action or step.", defaultData: { type: 'default', label: 'Generic Task' } },
  { type: 'sendEmail', label: 'Send Email', icon: Mail, description: "Automate email communications.", defaultData: { type: 'sendEmail', label: 'Send Email', to: '', subject: '', body: '' }, isToolNode: true },
  { type: 'runSql', label: 'Run SQL', icon: Database, description: "Execute SQL queries.", defaultData: { type: 'runSql', label: 'Run SQL', connectionId: '', query: '' }, isToolNode: true },
  { type: 'callWebhook', label: 'Call Webhook', icon: Webhook, description: "Integrate via webhooks.", defaultData: { type: 'callWebhook', label: 'Call Webhook', url: '', method: 'GET' }, isToolNode: true },
  { type: 'delay', label: 'Delay', icon: Timer, description: "Introduce timed delays.", defaultData: { type: 'delay', label: 'Delay', duration: 60, unit: 'seconds' }, isToolNode: true },
  { type: 'condition', label: 'Condition', icon: GitFork, description: "Branch workflows based on conditions.", defaultData: { type: 'condition', label: 'Condition Logic', logic: { variable: '', operator: 'contains', value: '' } }, isToolNode: true },
  { type: 'assignTask', label: 'Assign Task', icon: UserCheck, description: "Assign tasks to members.", defaultData: { type: 'assignTask', label: 'Assign Task', assignee: '' }, isToolNode: true },
  { type: 'humanTask', label: 'Human Task', icon: UserRoundCheck, description: "Pauses the workflow and assigns a task to a person.", defaultData: { type: 'humanTask', label: 'Manual Approval Step', assignee: '', taskTitle: 'Please review and approve.' }, isToolNode: true },
  { type: 'updateRecord', label: 'Update Record', icon: FilePenLine, description: "Modify data records.", defaultData: { type: 'updateRecord', label: 'Update Record', fieldsToUpdate: [] }, isToolNode: true },
  { type: 'getFirestoreDocument', label: 'Get Firestore Document', icon: FileSearch, description: "Fetch a document from a Firestore collection.", defaultData: { type: 'getFirestoreDocument', label: 'Get Document', collectionPath: '', documentId: '' }, isToolNode: true },
  { type: 'updateFirestoreDocument', label: 'Update Firestore Document', icon: FilePenLine, description: "Create or update a document in a Firestore collection.", defaultData: { type: 'updateFirestoreDocument', label: 'Update Document', collectionPath: '', documentId: '', fieldsToUpdate: [] }, isToolNode: true },
];

// Helper function to get initial data for a node type
export function getInitialDataForNodeType(nodeType: string, defaultLabel: string): Record<string, any> {
  const definition = nodeDefinitions.find(def => def.type === nodeType);
  if (definition && definition.defaultData) {
    // Return a copy to prevent mutation of the original definition
    return { ...definition.defaultData, label: definition.defaultData.label || defaultLabel };
  }
  // Fallback for nodes that might not be in the definition list
  return { type: nodeType, label: defaultLabel };
}

// Helper to get icon for a node type
export function getIconForNodeType(nodeType: string): LucideIcon | undefined {
    const definition = nodeDefinitions.find(def => def.type === nodeType);
    return definition?.icon;
}
