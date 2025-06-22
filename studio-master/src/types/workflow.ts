import type { Node, Edge } from 'reactflow';

export interface WorkflowDefinition {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowCreate {
  name: string;
  definition: WorkflowDefinition;
  status?: 'Active' | 'Paused' | 'Draft';
  is_template?: boolean;
}

export interface WorkflowUpdate {
  name?: string;
  definition?: WorkflowDefinition;
  status?: 'Active' | 'Paused' | 'Draft';
  is_template?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  is_template: boolean;
  created_at: string;
  updated_at: string;
  definition: WorkflowDefinition;
} 