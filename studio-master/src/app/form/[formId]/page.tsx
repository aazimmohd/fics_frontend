'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// --- INTERFACES & API ---

interface FormField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'dropdown' | 'textarea';
  options?: string;
  isMandatory: boolean;
}

interface IntakeForm {
  id: string;
  name: string;
  definition: {
    fields: FormField[];
  };
}

interface FormSubmission {
  formId: string;
  formData: Record<string, any>;
}

const API_URL = 'http://127.0.0.1:8000/api';

const getFormDefinition = async (formId: string): Promise<IntakeForm> => {
  const { data } = await axios.get(`${API_URL}/intake-forms/${formId}`);
  return data;
};

const submitFormData = async ({ formId, formData }: FormSubmission) => {
  const { data } = await axios.post(`${API_URL}/intake-forms/${formId}/submissions`, { data: formData });
  return data;
};

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { toast } = useToast();

  const { data: form, isLoading, isError } = useQuery<IntakeForm, Error>({
    queryKey: ['publicForm', formId],
    queryFn: () => getFormDefinition(formId),
    enabled: !!formId,
  });

  const { control, handleSubmit } = useForm();

  const mutation = useMutation<any, Error, FormSubmission>({
    mutationFn: submitFormData,
    onSuccess: () => {
      toast({ title: "Success!", description: "Your form has been submitted." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not submit your form." });
    },
  });

  const onSubmit = (data: Record<string, any>) => {
    mutation.mutate({ formId, formData: data });
  };

  if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (isError || !form) return <div className="flex h-screen w-full items-center justify-center"><p>Form not found or an error occurred.</p></div>;

  if (mutation.isSuccess) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Thank You!</CardTitle>
                    <CardDescription>Your submission for "{form.name}" has been received.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{form.name}</CardTitle>
          <CardDescription>Please fill out the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {form.definition.fields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id}>{field.label} {field.isMandatory && <span className="text-destructive">*</span>}</Label>
                <Controller
                  name={field.id} // ✅ FIXED: Use unique field.id instead of transformed label
                  control={control}
                  rules={{ required: field.isMandatory }}
                  render={({ field: controllerField }) => {
                    switch (field.fieldType) {
                      case 'textarea':
                        return <Textarea id={field.id} {...controllerField} value={controllerField.value ?? ''} className="mt-1" />;
                      case 'dropdown':
                        return (
                          <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                            <SelectTrigger id={field.id} className="mt-1"><SelectValue placeholder={`Select a ${field.label}`} /></SelectTrigger>
                            <SelectContent>
                              {field.options?.split(',').map(opt => <SelectItem key={opt.trim()} value={opt.trim()}>{opt.trim()}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        );
                      case 'email':
                          return <Input id={field.id} type="email" {...controllerField} value={controllerField.value ?? ''} className="mt-1" />;
                      default:
                        return <Input id={field.id} type="text" {...controllerField} value={controllerField.value ?? ''} className="mt-1" />;
                    }
                  }}
                />
              </div>
            ))}
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 