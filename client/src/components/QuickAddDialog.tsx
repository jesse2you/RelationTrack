import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { InsertContact } from "@shared/schema";

const quickAddSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

type QuickAddFormData = z.infer<typeof quickAddSchema>;

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertContact) => void;
}

export function QuickAddDialog({
  open,
  onOpenChange,
  onSubmit,
}: QuickAddDialogProps) {
  const form = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
    },
  });

  const handleSubmit = (data: QuickAddFormData) => {
    const contactData: InsertContact = {
      name: data.name,
      company: data.company || undefined,
      email: data.email || undefined,
      phone: undefined,
      notes: undefined,
      lastContactDate: undefined,
      nextTouchDate: undefined,
      tags: [],
    };
    onSubmit(contactData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Contact</DialogTitle>
          <DialogDescription>
            Add a contact with just the essentials. You can fill in more details later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Smith"
                      data-testid="input-quick-add-name"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Acme Inc."
                      data-testid="input-quick-add-company"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      data-testid="input-quick-add-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-quick-add-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-quick-add-submit">
                Add Contact
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
