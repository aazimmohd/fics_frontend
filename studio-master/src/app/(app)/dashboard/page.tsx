
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <Link href="/workflows" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            New Workflow
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Active Workflows</CardTitle>
            <CardDescription>Overview of currently running workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Forms Submitted</CardTitle>
            <CardDescription>Total intake forms processed this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">157</p>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Tasks Pending</CardTitle>
            <CardDescription>Manual tasks requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">8</p>
            <Link href="/tasks" className="text-sm text-primary hover:underline">View tasks</Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest workflow runs and form submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <p className="font-medium">New Client Onboarding Workflow <span className="font-semibold text-primary">(Completed)</span></p>
                <p className="text-sm text-muted-foreground">Triggered by "John Doe" form submission</p>
              </div>
              <span className="text-sm text-muted-foreground">2 min ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <p className="font-medium">Monthly Report Generation <span className="italic text-muted-foreground">(In Progress)</span></p>
                <p className="text-sm text-muted-foreground">Scheduled task</p>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </li>
            <li className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div>
                <p className="font-medium">Intake Form "Service Inquiry" Submitted</p>
                <p className="text-sm text-muted-foreground">Submitted by Jane Smith</p>
              </div>
              <span className="text-sm text-muted-foreground">3 hours ago</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
