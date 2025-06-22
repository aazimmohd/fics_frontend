# **App Name**: ZentroFlow

## Core Features:

- Intake Form Builder: Drag-and-drop interface for building client intake forms with various field types (text, email, dropdown, file upload).
- Workflow Builder UI: Visual workflow builder with React Flow, allowing users to connect nodes representing different actions (send email, run SQL, call webhook, delay, condition, assign task, update record).
- AI Workflow Generator: AI-powered tool to generate workflows from text prompts using GPT-4 or Gemini Pro.
- Workflow Execution Engine: Engine that triggers workflows upon form submission, executing steps sequentially and storing run history. Logs node statuses.
- Template Library: Library of prebuilt workflow templates for various industries, which users can import and customize.
- Credential Manager: Secure storage of API keys and database configurations, masked for security.

## Style Guidelines:

- Primary color: Soft lavender (#E6E6FA), conveying a sense of calm and efficiency, aligned with streamlining onboarding processes.
- Background color: Light gray (#F0F0F0), providing a clean and modern backdrop.
- Accent color: Muted purple (#B094D9), drawing the user's eye to important interactive elements.
- Body and headline font: 'Inter' (sans-serif) for a modern, objective feel.
- Use flat, minimalist icons for each node type in the workflow builder.
- Flat 2D modern SaaS design with a clean grid layout, soft shadows, and rounded corners (2xl).
- Subtle animations on form submission and workflow execution to provide feedback to the user.