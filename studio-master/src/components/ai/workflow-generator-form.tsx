
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateWorkflow, type GenerateWorkflowInput } from '@/ai/flows/generate-workflow-from-prompt';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  prompt: z.string().min(10, { message: 'Prompt must be at least 10 characters long.' }),
});

export function WorkflowGeneratorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    try {
      const input: GenerateWorkflowInput = { prompt: values.prompt };
      const result = await generateWorkflow(input);
      
      if (result.workflowDefinition) {
        try {
          // Validate JSON structure before saving
          const parsedForValidation = JSON.parse(result.workflowDefinition);
          if (!parsedForValidation.nodes || !parsedForValidation.edges || !Array.isArray(parsedForValidation.nodes) || !Array.isArray(parsedForValidation.edges)) {
              throw new Error("Generated JSON is not a valid workflow structure (missing nodes/edges or they are not arrays).");
          }
          sessionStorage.setItem('aiGeneratedWorkflow', result.workflowDefinition);
          toast({
            title: "Workflow Generated Successfully",
            description: "Redirecting to the workflow builder...",
          });
          router.push('/workflows?fromAI=true');
        } catch (parseError) {
            const parseErrorMessage = parseError instanceof Error ? parseError.message : "AI generated invalid JSON for the workflow.";
            setError(parseErrorMessage);
            toast({
              title: "Error Processing Generated Workflow",
              description: parseErrorMessage,
              variant: "destructive",
            });
        }
      } else {
        throw new Error("AI did not return a workflow definition.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during workflow generation.';
      setError(errorMessage);
      console.error(err);
      toast({
        title: "Error Generating Workflow",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Workflow Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the workflow you want to create (e.g., 'When a new user signs up, send them a welcome email, wait 3 days, then send a follow-up email with resources.')"
                    rows={5}
                    {...field}
                    className="bg-background border-input-border text-base rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="lg" className="rounded-lg">
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Generate Workflow
          </Button>
        </form>
      </Form>

      {error && (
        <Card className="border-destructive shadow-lg rounded-lg mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Generation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
