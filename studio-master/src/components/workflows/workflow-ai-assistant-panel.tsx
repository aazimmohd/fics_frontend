
'use client';

import React, { useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XIcon, Sparkles, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { editWorkflowWithAI, EditWorkflowInput } from '@/ai/flows/edit-workflow-with-ai-flow';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

interface WorkflowAIAssistantPanelProps {
  currentNodes: Node[];
  currentEdges: Edge[];
  onClose: () => void;
  onApplyAIChanges: (newNodes: Node[], newEdges: Edge[], explanation: string) => void;
  isVisible: boolean;
}

export function WorkflowAIAssistantPanel({
  currentNodes,
  currentEdges,
  onClose,
  onApplyAIChanges,
  isVisible,
}: WorkflowAIAssistantPanelProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const { toast } = useToast();

  const handleSubmitPrompt = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!userPrompt.trim()) return;

    setIsLoading(true);
    const currentWorkflow = { nodes: currentNodes, edges: currentEdges };
    const currentWorkflowJSON = JSON.stringify(currentWorkflow);

    setChatHistory(prev => [...prev, {id: Date.now().toString(), type: 'user', text: userPrompt}]);

    try {
      const input: EditWorkflowInput = { userPrompt, currentWorkflowJSON };
      const result = await editWorkflowWithAI(input);

      if (result.updatedWorkflowJSON && result.aiExplanation) {
        const parsedWorkflow = JSON.parse(result.updatedWorkflowJSON);
        if (parsedWorkflow.nodes && parsedWorkflow.edges) {
          onApplyAIChanges(parsedWorkflow.nodes, parsedWorkflow.edges, result.aiExplanation);
          setChatHistory(prev => [...prev, {id: (Date.now()+1).toString(), type: 'ai', text: result.aiExplanation}]);
        } else {
          throw new Error("AI response missing nodes or edges in updatedWorkflowJSON.");
        }
      } else {
        throw new Error("AI response was incomplete.");
      }
      setUserPrompt(''); // Clear input after successful submission
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while editing with AI.";
      console.error("Error editing workflow with AI:", error);
      toast({
        title: "AI Editing Error",
        description: errorMessage,
        variant: "destructive",
      });
      setChatHistory(prev => [...prev, {id: (Date.now()+1).toString(), type: 'ai', text: `Error: ${errorMessage}`}]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitPrompt();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-96 bg-card border-l border-border p-4 space-y-4 flex flex-col h-full shadow-xl flex-shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center text-foreground">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          AI Workflow Assistant
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-foreground">
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-grow p-1 mb-2 border-b border-border">
        <div className="space-y-3 pr-2">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-2.5 rounded-lg max-w-[85%] text-sm ${
                msg.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
           {chatHistory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Describe the changes you want to make to your workflow. For example: "Add an email node after the start trigger" or "Change the label of node '1' to 'Client Inquiry Form'".
            </p>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmitPrompt} className="space-y-3">
        <div>
          <Label htmlFor="aiPrompt" className="text-sm font-medium sr-only">Your instruction</Label>
          <Textarea
            id="aiPrompt"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="e.g., 'Add a delay node for 5 minutes'..."
            rows={3}
            className="bg-background border-input-border rounded-lg text-sm"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full rounded-lg" disabled={isLoading || !userPrompt.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send to AI
        </Button>
      </form>
    </div>
  );
}
