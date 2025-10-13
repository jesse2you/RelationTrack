import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Briefcase, 
  MessageSquare, 
  FileSearch,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company, Contact, Project, Communication, Research } from "@shared/schema";

export default function CRM() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("companies");

  // Companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Communications
  const { data: communications = [], isLoading: loadingCommunications } = useQuery<Communication[]>({
    queryKey: ["/api/communications"],
  });

  // Research
  const { data: research = [], isLoading: loadingResearch } = useQuery<Research[]>({
    queryKey: ["/api/research"],
  });

  // Delete mutations
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company deleted successfully" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted successfully" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted successfully" });
    },
  });

  const deleteCommunicationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/communications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communication deleted successfully" });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/research/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({ title: "Research deleted successfully" });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
            CRM Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your companies, contacts, projects, and communications
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="companies" data-testid="tab-companies">
            <Building2 className="w-4 h-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">
            <Briefcase className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="communications" data-testid="tab-communications">
            <MessageSquare className="w-4 h-4 mr-2" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="research" data-testid="tab-research">
            <FileSearch className="w-4 h-4 mr-2" />
            Research
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Companies ({companies.length})</h2>
            <Button data-testid="button-add-company">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingCompanies ? (
              <p className="text-muted-foreground">Loading companies...</p>
            ) : companies.length === 0 ? (
              <p className="text-muted-foreground">No companies yet. Create your first one!</p>
            ) : (
              companies.map((company) => (
                <Card key={company.id} data-testid={`card-company-${company.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{company.companyName}</span>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" data-testid={`button-edit-company-${company.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCompanyMutation.mutate(company.id)}
                          data-testid={`button-delete-company-${company.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    {company.industry && (
                      <CardDescription>{company.industry}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {company.website && (
                      <p className="text-sm text-muted-foreground truncate">
                        🌐 {company.website}
                      </p>
                    )}
                    {company.city && (
                      <p className="text-sm text-muted-foreground">
                        📍 {company.city}{company.state ? `, ${company.state}` : ''}
                      </p>
                    )}
                    {company.size && (
                      <p className="text-sm text-muted-foreground">
                        Size: {company.size}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contacts ({contacts.length})</h2>
            <Button data-testid="button-add-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingContacts ? (
              <p className="text-muted-foreground">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-muted-foreground">No contacts yet. Create your first one!</p>
            ) : (
              contacts.map((contact) => {
                const company = companies.find(c => c.id === contact.companyId);
                return (
                  <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">
                          {contact.firstName} {contact.lastName}
                        </span>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" data-testid={`button-edit-contact-${contact.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteContactMutation.mutate(contact.id)}
                            data-testid={`button-delete-contact-${contact.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      {contact.jobTitle && (
                        <CardDescription>{contact.jobTitle}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {company && (
                        <p className="text-sm font-medium text-muted-foreground">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {company.companyName}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 inline mr-1" />
                          {contact.phone}
                        </p>
                      )}
                      {contact.status && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {contact.status}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
            <Button data-testid="button-add-project">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingProjects ? (
              <p className="text-muted-foreground">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground">No projects yet. Create your first one!</p>
            ) : (
              projects.map((project) => {
                const contact = contacts.find(c => c.id === project.contactId);
                const company = companies.find(c => c.id === project.companyId);
                return (
                  <Card key={project.id} data-testid={`card-project-${project.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{project.projectName}</span>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" data-testid={`button-edit-project-${project.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      {project.category && (
                        <CardDescription>{project.category}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {company && (
                        <p className="text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {company.companyName}
                        </p>
                      )}
                      {contact && (
                        <p className="text-sm text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {contact.firstName} {contact.lastName}
                        </p>
                      )}
                      {project.startDate && (
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {project.status && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {project.status}
                          </span>
                        )}
                        {project.priority && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-accent/10 text-accent-foreground">
                            {project.priority}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Communications ({communications.length})</h2>
            <Button data-testid="button-add-communication">
              <Plus className="w-4 h-4 mr-2" />
              Log Communication
            </Button>
          </div>

          <div className="space-y-4">
            {loadingCommunications ? (
              <p className="text-muted-foreground">Loading communications...</p>
            ) : communications.length === 0 ? (
              <p className="text-muted-foreground">No communications logged yet. Add your first one!</p>
            ) : (
              communications.map((comm) => {
                const contact = contacts.find(c => c.id === comm.contactId);
                const project = projects.find(p => p.id === comm.projectId);
                return (
                  <Card key={comm.id} data-testid={`card-communication-${comm.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium px-2 py-1 rounded-full bg-secondary">
                            {comm.communicationType}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {comm.direction === 'inbound' ? '📥' : '📤'} {comm.direction}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" data-testid={`button-edit-communication-${comm.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCommunicationMutation.mutate(comm.id)}
                            data-testid={`button-delete-communication-${comm.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      {comm.subject && (
                        <CardDescription className="font-medium">{comm.subject}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contact && (
                        <p className="text-sm text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {contact.firstName} {contact.lastName}
                        </p>
                      )}
                      {project && (
                        <p className="text-sm text-muted-foreground">
                          <Briefcase className="w-3 h-3 inline mr-1" />
                          {project.projectName}
                        </p>
                      )}
                      {comm.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {comm.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(comm.communicationDate).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Research ({research.length})</h2>
            <Button data-testid="button-add-research">
              <Plus className="w-4 h-4 mr-2" />
              Add Research
            </Button>
          </div>

          <div className="space-y-4">
            {loadingResearch ? (
              <p className="text-muted-foreground">Loading research...</p>
            ) : research.length === 0 ? (
              <p className="text-muted-foreground">No research notes yet. Create your first one!</p>
            ) : (
              research.map((item) => {
                const contact = contacts.find(c => c.id === item.contactId);
                const company = companies.find(c => c.id === item.companyId);
                const project = projects.find(p => p.id === item.projectId);
                return (
                  <Card key={item.id} data-testid={`card-research-${item.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{item.title}</span>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" data-testid={`button-edit-research-${item.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteResearchMutation.mutate(item.id)}
                            data-testid={`button-delete-research-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      {item.researchType && (
                        <CardDescription>{item.researchType}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      {company && (
                        <p className="text-sm text-muted-foreground">
                          <Building2 className="w-3 h-3 inline mr-1" />
                          {company.companyName}
                        </p>
                      )}
                      {contact && (
                        <p className="text-sm text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {contact.firstName} {contact.lastName}
                        </p>
                      )}
                      {project && (
                        <p className="text-sm text-muted-foreground">
                          <Briefcase className="w-3 h-3 inline mr-1" />
                          {project.projectName}
                        </p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="inline-block px-2 py-1 text-xs rounded-full bg-accent/10 text-accent-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
