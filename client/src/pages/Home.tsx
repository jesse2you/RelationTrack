import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Contact, type InsertContact } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { ContactCard } from "@/components/ContactCard";
import { ContactDialog } from "@/components/ContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Users, CalendarClock, Search, X, Download, FileJson, FileText } from "lucide-react";
import { isToday, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "due">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: searchQuery ? ["/api/contacts/search", searchQuery] : ["/api/contacts"],
    queryFn: searchQuery
      ? async () => {
          const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`);
          if (!response.ok) throw new Error("Failed to search contacts");
          return response.json();
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return await apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "/api/contacts" || 
                              (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/contacts/search")
      });
      setDialogOpen(false);
      setEditingContact(null);
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertContact }) => {
      return await apiRequest("PATCH", `/api/contacts/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/contacts" || 
                 (Array.isArray(query.queryKey) && key === "/api/contacts/search") ||
                 (Array.isArray(query.queryKey) && query.queryKey[1] === variables.id && query.queryKey[2] === "activities");
        }
      });
      setDialogOpen(false);
      setEditingContact(null);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contacts/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === "/api/contacts" || 
                              (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/contacts/search")
      });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
  });

  const markContactedMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/contacts/${id}/contacted`, undefined);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "/api/contacts" || 
                 (Array.isArray(query.queryKey) && key === "/api/contacts/search") ||
                 (Array.isArray(query.queryKey) && query.queryKey[1] === id && query.queryKey[2] === "activities");
        }
      });
      toast({
        title: "Success",
        description: "Contact marked as contacted today",
      });
    },
  });

  const handleSubmit = (data: InsertContact) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    const link = document.createElement("a");
    link.href = `/api/contacts/export/${format}`;
    link.download = `contacts-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Started",
      description: `Your contacts are being exported as ${format.toUpperCase()}`,
    });
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingContact(null);
    setDialogOpen(false);
    setTimeout(() => setDialogOpen(true), 0);
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(contacts.flatMap((c) => c.tags || []))
  ).sort();

  // Filter contacts (only apply filters when not searching)
  const filteredContacts = searchQuery ? contacts : contacts.filter((contact) => {
    // Filter by view mode
    if (viewMode === "due") {
      const hasDueDate = contact.nextTouchDate && 
        (isToday(new Date(contact.nextTouchDate)) || 
         isPast(new Date(contact.nextTouchDate)));
      if (!hasDueDate) return false;
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      const hasSelectedTag = selectedTags.some(tag => 
        contact.tags?.includes(tag)
      );
      if (!hasSelectedTag) return false;
    }

    return true;
  });

  const dueCount = contacts.filter(c => 
    c.nextTouchDate && (isToday(new Date(c.nextTouchDate)) || isPast(new Date(c.nextTouchDate)))
  ).length;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold" data-testid="text-app-title">Personal CRM</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-export">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("csv")} data-testid="button-export-csv">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")} data-testid="button-export-json">
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddNew} data-testid="button-add-contact">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Search
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9"
                    data-testid="input-search"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      data-testid="button-clear-search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* View Toggle */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  View
                </h2>
                <div className="space-y-1">
                  <Button
                    variant={viewMode === "all" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setViewMode("all")}
                    data-testid="button-view-all"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    All Contacts
                    <span className="ml-auto text-xs text-muted-foreground">
                      {contacts.length}
                    </span>
                  </Button>
                  <Button
                    variant={viewMode === "due" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setViewMode("due")}
                    data-testid="button-view-due"
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Due Today
                    {dueCount > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-chart-3 text-xs font-semibold text-white">
                        {dueCount}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Filter by Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => toggleTag(tag)}
                        data-testid={`button-filter-tag-${tag}`}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      data-testid="button-clear-filters"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-card animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2" data-testid="text-empty-state">
                  {viewMode === "due" && contacts.length > 0
                    ? "No contacts due today"
                    : selectedTags.length > 0
                    ? "No contacts match filters"
                    : "No contacts yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {viewMode === "due" && contacts.length > 0
                    ? "All caught up! No follow-ups scheduled for today."
                    : selectedTags.length > 0
                    ? "Try adjusting your tag filters to see more contacts."
                    : "Start building your network by adding your first contact."}
                </p>
                {contacts.length === 0 && (
                  <Button onClick={handleAddNew} size="lg" data-testid="button-add-first-contact">
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Contact
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMarkContacted={markContactedMutation.mutate}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        contact={editingContact}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
