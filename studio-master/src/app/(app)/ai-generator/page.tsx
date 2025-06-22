
import { WorkflowGeneratorForm } from '@/components/ai/workflow-generator-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AIGeneratorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Workflow Generator</h1>
        <p className="text-muted-foreground">
          Describe your desired workflow in plain text, and let our AI craft a JSON definition for you. 
          This can be used as a starting point for the visual workflow builder.
        </p>
      </div>

      <WorkflowGeneratorForm />

      <Card className="mt-8 bg-accent/30 border-accent shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>How it Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Write a Prompt:</strong> Clearly describe the steps, conditions, and actions of your workflow. For example, you could start with "When a 'New Client Inquiry' form is submitted..." or "On the first of every month...".</p>
          <p><strong>2. Generate:</strong> Our AI (powered by Google's Gemini Pro) will interpret your prompt and generate a structured JSON output representing the workflow.</p>
          <p><strong>3. Review & Use:</strong> Copy the generated JSON or (in a future update) directly import it into the visual workflow builder for further customization and to link specific forms or set up schedules.</p>
          <p className="text-xs text-muted-foreground mt-2">
            The AI aims to provide a valid workflow structure. Complex prompts might require iteration or manual adjustment. For form-triggered workflows, you'll link the specific form in the visual builder.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
