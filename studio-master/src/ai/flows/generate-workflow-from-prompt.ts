
'use server';

/**
 * @fileOverview AI-powered workflow generator from text prompts.
 *
 * - generateWorkflow - A function that generates a workflow from a text prompt.
 * - GenerateWorkflowInput - The input type for the generateWorkflow function.
 * - GenerateWorkflowOutput - The return type for the generateWorkflow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkflowInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired workflow.'),
});
export type GenerateWorkflowInput = z.infer<typeof GenerateWorkflowInputSchema>;

const GenerateWorkflowOutputSchema = z.object({
  workflowDefinition: z
    .string()
    .describe('The generated workflow definition in JSON format.'),
});
export type GenerateWorkflowOutput = z.infer<typeof GenerateWorkflowOutputSchema>;

export async function generateWorkflow(input: GenerateWorkflowInput): Promise<GenerateWorkflowOutput> {
  return generateWorkflowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkflowPrompt',
  input: {schema: GenerateWorkflowInputSchema},
  output: {schema: GenerateWorkflowOutputSchema},
  prompt: `You are an AI workflow generator. You will generate a workflow definition in JSON format based on the user's text prompt.

  Prompt: {{{prompt}}}
  
  The workflow definition should be a JSON object that can be used by a workflow execution engine.
  It should contain nodes and connections, where each node represents an action and each connection represents the flow of data between actions.
  
  Node types can include:
  - 'input' for starting points (e.g., a generic start, a form submission trigger, a scheduled trigger). If the prompt mentions a form, use 'input' with a label like "Form: [Form Name] Submitted".
  - 'output' for ending points.
  - 'sendEmail' for sending emails.
  - 'runSql' for database operations.
  - 'callWebhook' for API calls.
  - 'delay' for pauses.
  - 'condition' for branching logic.
  - 'assignTask' for human tasks.
  - 'updateRecord' for data modification.
  - 'default' for other generic actions.

  Example for a form-triggered workflow:
  {
    "nodes": [
      {
        "id": "node1",
        "type": "input", // Use 'input' for trigger nodes
        "data": {
          "label": "Form: New Inquiry Submitted" // Be descriptive about the trigger
        }
      },
      {
        "id": "node2",
        "type": "sendEmail",
        "data": {
          "label": "Send Acknowledgement Email",
          "to": "{{form.email}}", // Use placeholders if form data is implied
          "subject": "Inquiry Received",
          "body": "Thank you for your inquiry, we will get back to you soon."
        }
      },
      {
        "id": "node3",
        "type": "assignTask",
        "data": {
          "label": "Assign to Sales Rep",
          "assignee": "sales_team_member_1"
        }
      }
    ],
    "edges": [
      {
        "id": "edge1",
        "source": "node1",
        "target": "node2",
        "type": "smoothstep"
      },
      {
        "id": "edge2",
        "source": "node2",
        "target": "node3",
        "type": "smoothstep"
      }
    ]
  }
  `,
});

const generateWorkflowFlow = ai.defineFlow(
  {
    name: 'generateWorkflowFlow',
    inputSchema: GenerateWorkflowInputSchema,
    outputSchema: GenerateWorkflowOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
