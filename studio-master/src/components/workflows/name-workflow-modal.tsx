"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NameWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string; // Optional, for "Rename" later or if a name was started
  isLoading?: boolean; // Optional, to show loading state on save button
}

export function NameWorkflowModal({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  isLoading = false,
}: NameWorkflowModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    // Reset name when modal opens with a new initialName or becomes visible
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      // Consider closing the modal from the parent component after successful save
    } else {
      // Optionally, you could add more sophisticated error handling here
      alert("Workflow name cannot be empty.");
    }
  };

  console.log("NameWorkflowModal rendering with isOpen:", isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialName ? "Rename Workflow" : "Save Your Workflow"}</DialogTitle>
          <DialogDescription>
            Please enter a name for your workflow. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="workflow-name" className="text-right">
              Name
            </Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., New Client Onboarding"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? "Saving..." : "Save Workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
