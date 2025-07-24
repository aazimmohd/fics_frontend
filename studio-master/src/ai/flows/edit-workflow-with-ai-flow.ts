
'use server';
/**
 * @fileOverview AI-powered workflow editor.
 *
 * - editWorkflowWithAI - A function that modifies a workflow based on a text prompt.
 * - EditWorkflowInput - The input type for the editWorkflowWithAI function.
 * - EditWorkflowOutput - The return type for the editWorkflowWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditWorkflowInputSchema = z.object({
  userPrompt: z.string().describe('The user_s instruction for modifying the workflow.'),
  currentWorkflowJSON: z.string().describe('The current workflow definition (nodes and edges) as a JSON string.'),
});
export type EditWorkflowInput = z.infer<typeof EditWorkflowInputSchema>;

const EditWorkflowOutputSchema = z.object({
  updatedWorkflowJSON: z.string().describe('The modified workflow definition (nodes and edges) as a JSON string.'),
  aiExplanation: z.string().describe('A brief explanation of the changes made by the AI.'),
});
export type EditWorkflowOutput = z.infer<typeof EditWorkflowOutputSchema>;

export async function editWorkflowWithAI(input: EditWorkflowInput): Promise<EditWorkflowOutput> {
  return editWorkflowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editWorkflowPrompt',
  input: {schema: EditWorkflowInputSchema},
  output: {schema: EditWorkflowOutputSchema},
  prompt: `You are an AI assistant that helps users modify a visual workflow. The workflow is defined by a JSON object containing 'nodes' and 'edges', compatible with React Flow.

Current Workflow:
\`\`\`json
{{{currentWorkflowJSON}}}
\`\`\`

User Request: "{{{userPrompt}}}"

Based on the user's request, please modify the current workflow.
Your response MUST be a JSON object containing two keys:
1.  \`updatedWorkflowJSON\`: A JSON string representing the complete, modified workflow (nodes and edges).
    Ensure all node and edge properties (IDs, types, positions, data, sourcePosition, targetPosition, styles, markerEnd, animated status) are correctly maintained or updated.
    If adding new nodes, ensure their \`position\` is reasonable (e.g., x: Math.random() * 400, y: Math.random() * 400, or relative to connected nodes if specified). Generate new unique IDs for new nodes (e.g., "ai_node_<timestamp_or_random>").
    If adding new edges, ensure \`source\` and \`target\` IDs are valid and refer to existing or newly created nodes. Generate new unique IDs for new edges (e.g., "ai_edge_<timestamp_or_random>").
    All node types must be one of: 'input', 'input_form', 'output', 'sendEmail', 'runSql', 'callWebhook', 'delay', 'condition', 'assignTask', 'humanTask', 'updateRecord', 'default'.
    
    IMPORTANT NODE TYPE USAGE:
    - Use 'assignTask' for simple task assignments that don't pause the workflow (workflow continues immediately)
    - Use 'humanTask' for human tasks that PAUSE the workflow until completed (e.g., manual approval, review required, human validation)
    
    Node 'sourcePosition' and 'targetPosition' should generally be 'right' and 'left' respectively for a left-to-right flow, but can be 'top' or 'bottom' if appropriate.
    Edges should generally have \`animated: true\`, \`markerEnd: { type: "ArrowClosed", color: "hsl(var(--primary))" }\`, and \`style: { stroke: "hsl(var(--primary))", strokeWidth: 2 }\` unless specified otherwise.
    Node styling guidelines:
    - 'input' or 'input_form' types: \`background: 'hsl(var(--primary))'\`, \`color: 'hsl(var(--primary-foreground))'\`, \`border: '1px solid hsl(var(--primary))'\`.
    - 'output' type: \`background: 'hsl(var(--destructive))'\`, \`color: 'hsl(var(--destructive-foreground))'\`, \`border: '1px solid hsl(var(--destructive))'\`.
    - Other types (default, sendEmail, etc.): \`background: 'hsl(var(--card))'\`, \`color: 'hsl(var(--card-foreground))'\`, \`border: '1px solid hsl(var(--border))'\`.
    - All nodes should have: \`borderRadius: 'var(--radius)'\`, \`boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'\`, \`width: 200\`.
    Preserve existing styles unless explicitly asked to change them, but ensure new nodes follow these guidelines. The 'padding' style property for nodes should NOT be set, as padding is handled by the node's internal component.

2.  \`aiExplanation\`: A brief, user-friendly explanation of the changes you made (e.g., "Added a 'Send Email' node after 'Form Submit' and connected them.").

Example of a node's style object within the \`updatedWorkflowJSON\` string:
\`\`\`json
// For an 'input' node:
{
  "id": "1",
  "type": "input",
  "data": { "label": "Start Trigger" },
  "position": { "x": 50, "y": 150 },
  "sourcePosition": "right",
  "targetPosition": "left",
  "style": {
    "background": "hsl(var(--primary))",
    "color": "hsl(var(--primary-foreground))",
    "border": "1px solid hsl(var(--primary))",
    "borderRadius": "var(--radius)",
    "boxShadow": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "width": 200
  }
}
// For a default/tool node:
{
  "id": "node_abc",
  "type": "sendEmail",
  "data": { "label": "Send Welcome Email" },
  "position": { "x": 250, "y": 150 },
  "sourcePosition": "right",
  "targetPosition": "left",
  "style": {
    "background": "hsl(var(--card))",
    "color": "hsl(var(--card-foreground))",
    "border": "1px solid hsl(var(--border))",
    "borderRadius": "var(--radius)",
    "boxShadow": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "width": 200
  }
}
\`\`\`
Do not add any other text outside of this JSON object in your response. If the user's request is too vague or impossible to fulfill given the current workflow, explain why in the \`aiExplanation\` and return the original \`currentWorkflowJSON\` as \`updatedWorkflowJSON\`.
`,
});

const editWorkflowFlow = ai.defineFlow(
  {
    name: 'editWorkflowFlow',
    inputSchema: EditWorkflowInputSchema,
    outputSchema: EditWorkflowOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI did not return an output for workflow editing.");
    }
    try {
      const parsedOutput = output; 
      if (typeof parsedOutput.updatedWorkflowJSON !== 'string' || typeof parsedOutput.aiExplanation !== 'string') {
        throw new Error("AI output is missing required fields or has incorrect types.");
      }
      JSON.parse(parsedOutput.updatedWorkflowJSON);
    } catch (e) {
      console.error("AI returned invalid JSON or structure:", e);
      return {
        updatedWorkflowJSON: input.currentWorkflowJSON, 
        aiExplanation: `I encountered an issue processing your request. The AI returned an invalid response structure. Original error: ${e instanceof Error ? e.message : String(e)}`
      };
    }
    return output;
  }
);
