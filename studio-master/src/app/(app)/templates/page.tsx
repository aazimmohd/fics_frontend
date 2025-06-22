import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud, Eye } from "lucide-react";
import Image from "next/image";

const mockTemplates = [
  { 
    id: "1", 
    name: "Client Onboarding - SaaS", 
    description: "A comprehensive workflow for onboarding new SaaS clients, including welcome emails, setup guidance, and follow-ups.",
    category: "SaaS",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "technology abstract"
  },
  { 
    id: "2", 
    name: "E-commerce Order Fulfillment", 
    description: "Streamlines order processing, from payment confirmation to shipping notification and review requests.",
    category: "E-commerce",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "online shopping"
  },
  { 
    id: "3", 
    name: "Real Estate Lead Nurturing", 
    description: "Automated follow-up sequence for new real estate leads, including property suggestions and appointment scheduling.",
    category: "Real Estate",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern houses"
  },
  {
    id: "4",
    name: "Software Bug Report Handling",
    description: "Workflow to manage incoming bug reports, assign to developers, and notify reporters of status updates.",
    category: "Software Development",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "coding computer"
  },
  {
    id: "5",
    name: "New Employee Onboarding",
    description: "Standardized process for HR to onboard new hires, including document collection, system access, and initial training.",
    category: "Human Resources",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "office team"
  },
  {
    id: "6",
    name: "Content Marketing Approval",
    description: "A multi-step approval workflow for blog posts, social media content, and other marketing materials.",
    category: "Marketing",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "creative ideas"
  }
];

export default function TemplatesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Template Library</h1>
        <p className="text-muted-foreground">
          Browse pre-built workflow templates for various industries. Import and customize them to fit your needs.
        </p>
      </div>

      <div className="grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {mockTemplates.map((template) => (
          <Card key={template.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
            <CardHeader>
              <div className="aspect-[3/2] w-full relative rounded-t-lg overflow-hidden mb-4">
                <Image 
                  src={template.imageUrl} 
                  alt={template.name} 
                  layout="fill" 
                  objectFit="cover" 
                  data-ai-hint={template.aiHint}
                />
              </div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription className="text-xs text-primary">{template.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" className="rounded-lg">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button size="sm" className="rounded-lg">
                <DownloadCloud className="mr-2 h-4 w-4" />
                Import Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
