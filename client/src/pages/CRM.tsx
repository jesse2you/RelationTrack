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
  const [activeTab, setActiveTab] = useState("contacts"); // Start on contacts for test

  // Dialog states
  const [companyDialog, setCompanyDialog] = useState({ open: false, mode: "create" as "create" | "edit", data: null as Company | null });
  const [contactDialog, setContactDialog] = useState({ open: false, mode: "create" as "create" | "edit", data: null as Contact | null });
  const [projectDialog, setProjectDialog] = useState({ open: false, mode: "create" as "create" | "edit", data: null as Project | null });
  const [commDialog, setCommDialog] = useState({ open: false, mode: "create" as "create" | "edit", data: null as Communication | null });
  const [researchDialog, setResearchDialog] = useState({ open: false, mode: "create" as "create" | "edit", data: null as Research | null });

  // Form states
  const [companyForm, setCompanyForm] = useState({
    companyName: "", website: "", industry: "", size: "", address: "", city: "", state: "", country: "", notes: ""
  });
  const [contactForm, setContactForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", jobTitle: "", department: "", 
    companyId: "", status: "active", customerType: "", notes: ""
  });
  const [projectForm, setProjectForm] = useState({
    projectName: "", description: "", category: "", status: "planning", priority: "medium", 
    contactId: "", companyId: ""
  });
  const [commForm, setCommForm] = useState({
    contactId: "", projectId: "", communicationType: "email", direction: "outbound", 
    subject: "", content: ""
  });
  const [researchForm, setResearchForm] = useState({
    title: "", summary: "", researchType: "", contactId: "", companyId: "", projectId: ""
  });

  // Fetch data
  const { data: companies = [] } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: contacts = [] } = useQuery<Contact[]>({ queryKey: ["/api/contacts"] });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: communications = [] } = useQuery<Communication[]>({ queryKey: ["/api/communications"] });
  const { data: research = [] } = useQuery<Research[]>({ queryKey: ["/api/research"] });

  // Company mutations
  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company created successfully" });
      setCompanyDialog({ open: false, mode: "create", data: null });
      setCompanyForm({ companyName: "", website: "", industry: "", size: "", address: "", city: "", state: "", country: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed to create company", variant: "destructive" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company updated successfully" });
      setCompanyDialog({ open: false, mode: "create", data: null });
    },
    onError: () => {
      toast({ title: "Failed to update company", variant: "destructive" });
    },
  });

  // Contact mutations
  const createContactMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact created successfully" });
      setContactDialog({ open: false, mode: "create", data: null });
      setContactForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", department: "", companyId: "", status: "active", customerType: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed to create contact", variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated successfully" });
      setContactDialog({ open: false, mode: "create", data: null });
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete company", variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete contact", variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const deleteCommMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/communications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communication deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete communication", variant: "destructive" });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/research/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({ title: "Research deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete research", variant: "destructive" });
    },
  });

  // Project mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project created successfully" });
      setProjectDialog({ open: false, mode: "create", data: null });
      setProjectForm({ projectName: "", description: "", category: "", status: "planning", priority: "medium", contactId: "", companyId: "" });
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project updated successfully" });
      setProjectDialog({ open: false, mode: "create", data: null });
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  // Communication mutations
  const createCommMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/communications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communication logged successfully" });
      setCommDialog({ open: false, mode: "create", data: null });
      setCommForm({ contactId: "", projectId: "", communicationType: "email", direction: "outbound", subject: "", content: "" });
    },
    onError: () => {
      toast({ title: "Failed to log communication", variant: "destructive" });
    },
  });

  const updateCommMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/communications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communication updated successfully" });
      setCommDialog({ open: false, mode: "create", data: null });
    },
    onError: () => {
      toast({ title: "Failed to update communication", variant: "destructive" });
    },
  });

  // Research mutations
  const createResearchMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/research", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({ title: "Research created successfully" });
      setResearchDialog({ open: false, mode: "create", data: null });
      setResearchForm({ title: "", summary: "", researchType: "", contactId: "", companyId: "", projectId: "" });
    },
    onError: () => {
      toast({ title: "Failed to create research", variant: "destructive" });
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/research/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({ title: "Research updated successfully" });
      setResearchDialog({ open: false, mode: "create", data: null });
    },
    onError: () => {
      toast({ title: "Failed to update research", variant: "destructive" });
    },
  });

  // Handle company form
  const handleCompanySubmit = () => {
    if (!companyForm.companyName.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    if (companyDialog.mode === "create") {
      createCompanyMutation.mutate(companyForm);
    } else if (companyDialog.data) {
      updateCompanyMutation.mutate({ id: companyDialog.data.id, ...companyForm });
    }
  };

  // Handle contact form
  const handleContactSubmit = () => {
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) {
      toast({ title: "First and last name are required", variant: "destructive" });
      return;
    }
    if (contactDialog.mode === "create") {
      createContactMutation.mutate({ ...contactForm, companyId: contactForm.companyId || null });
    } else if (contactDialog.data) {
      updateContactMutation.mutate({ id: contactDialog.data.id, ...contactForm, companyId: contactForm.companyId || null });
    }
  };

  // Handle project form
  const handleProjectSubmit = () => {
    if (!projectForm.projectName.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    const data = {
      ...projectForm,
      contactId: projectForm.contactId || null,
      companyId: projectForm.companyId || null
    };
    if (projectDialog.mode === "create") {
      createProjectMutation.mutate(data);
    } else if (projectDialog.data) {
      updateProjectMutation.mutate({ id: projectDialog.data.id, ...data });
    }
  };

  // Handle communication form
  const handleCommSubmit = () => {
    if (!commForm.contactId) {
      toast({ title: "Contact is required", variant: "destructive" });
      return;
    }
    if (!commForm.content.trim()) {
      toast({ title: "Communication content is required", variant: "destructive" });
      return;
    }
    const data = {
      ...commForm,
      contactId: commForm.contactId || null,
      projectId: commForm.projectId || null
    };
    if (commDialog.mode === "create") {
      createCommMutation.mutate(data);
    } else if (commDialog.data) {
      updateCommMutation.mutate({ id: commDialog.data.id, ...data });
    }
  };

  // Handle research form
  const handleResearchSubmit = () => {
    if (!researchForm.title.trim() || !researchForm.summary.trim()) {
      toast({ title: "Title and summary are required", variant: "destructive" });
      return;
    }
    const data = {
      ...researchForm,
      contactId: researchForm.contactId || null,
      companyId: researchForm.companyId || null,
      projectId: researchForm.projectId || null
    };
    if (researchDialog.mode === "create") {
      createResearchMutation.mutate(data);
    } else if (researchDialog.data) {
      updateResearchMutation.mutate({ id: researchDialog.data.id, ...data });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
            CRM Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage companies, contacts, projects, and communications
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
            <Button 
              onClick={() => {
                setCompanyForm({ companyName: "", website: "", industry: "", size: "", address: "", city: "", state: "", country: "", notes: "" });
                setCompanyDialog({ open: true, mode: "create", data: null });
              }}
              data-testid="button-add-company"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card key={company.id} data-testid={`card-company-${company.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{company.companyName}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          setCompanyForm({
                            companyName: company.companyName,
                            website: company.website || "",
                            industry: company.industry || "",
                            size: company.size || "",
                            address: company.address || "",
                            city: company.city || "",
                            state: company.state || "",
                            country: company.country || "",
                            notes: company.notes || ""
                          });
                          setCompanyDialog({ open: true, mode: "edit", data: company });
                        }}
                        data-testid={`button-edit-company-${company.id}`}
                      >
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
                  {company.industry && <CardDescription>{company.industry}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2">
                  {company.website && <p className="text-sm text-muted-foreground truncate">🌐 {company.website}</p>}
                  {company.city && <p className="text-sm text-muted-foreground">📍 {company.city}{company.state ? `, ${company.state}` : ''}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Contacts ({contacts.length})</h2>
            <Button 
              onClick={() => {
                setContactForm({ firstName: "", lastName: "", email: "", phone: "", jobTitle: "", department: "", companyId: "", status: "active", customerType: "", notes: "" });
                setContactDialog({ open: true, mode: "create", data: null });
              }}
              data-testid="button-add-contact"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => {
              const company = companies.find(c => c.id === contact.companyId);
              return (
                <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{contact.firstName} {contact.lastName}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            setContactForm({
                              firstName: contact.firstName,
                              lastName: contact.lastName,
                              email: contact.email || "",
                              phone: contact.phone || "",
                              jobTitle: contact.jobTitle || "",
                              department: contact.department || "",
                              companyId: contact.companyId || "",
                              status: contact.status || "active",
                              customerType: contact.customerType || "",
                              notes: contact.notes || ""
                            });
                            setContactDialog({ open: true, mode: "edit", data: contact });
                          }}
                          data-testid={`button-edit-contact-${contact.id}`}
                        >
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
                    {contact.jobTitle && <CardDescription>{contact.jobTitle}</CardDescription>}
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
            <Button 
              onClick={() => {
                setProjectForm({ projectName: "", description: "", category: "", status: "planning", priority: "medium", contactId: "", companyId: "" });
                setProjectDialog({ open: true, mode: "create", data: null });
              }}
              data-testid="button-add-project"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} data-testid={`card-project-${project.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{project.projectName}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          setProjectForm({
                            projectName: project.projectName,
                            description: project.description || "",
                            category: project.category || "",
                            status: project.status || "planning",
                            priority: project.priority || "medium",
                            contactId: project.contactId || "",
                            companyId: project.companyId || ""
                          });
                          setProjectDialog({ open: true, mode: "edit", data: project });
                        }}
                        data-testid={`button-edit-project-${project.id}`}
                      >
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
                  <CardDescription>{project.status} • {project.priority}</CardDescription>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Communications ({communications.length})</h2>
            <Button 
              onClick={() => {
                setCommForm({ contactId: "", projectId: "", communicationType: "email", direction: "outbound", subject: "", content: "" });
                setCommDialog({ open: true, mode: "create", data: null });
              }}
              data-testid="button-add-communication"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Communication
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communications.map((comm) => {
              const contact = contacts.find(c => c.id === comm.contactId);
              return (
                <Card key={comm.id} data-testid={`card-communication-${comm.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{comm.communicationType}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            setCommForm({
                              contactId: comm.contactId || "",
                              projectId: comm.projectId || "",
                              communicationType: comm.communicationType,
                              direction: comm.direction,
                              subject: comm.subject || "",
                              content: comm.content || ""
                            });
                            setCommDialog({ open: true, mode: "edit", data: comm });
                          }}
                          data-testid={`button-edit-communication-${comm.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCommMutation.mutate(comm.id)}
                          data-testid={`button-delete-communication-${comm.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'} • {comm.direction}</CardDescription>
                  </CardHeader>
                  {comm.subject && (
                    <CardContent>
                      <p className="text-sm font-medium">{comm.subject}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Research ({research.length})</h2>
            <Button 
              onClick={() => {
                setResearchForm({ title: "", summary: "", researchType: "", contactId: "", companyId: "", projectId: "" });
                setResearchDialog({ open: true, mode: "create", data: null });
              }}
              data-testid="button-add-research"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Research
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {research.map((item) => (
              <Card key={item.id} data-testid={`card-research-${item.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{item.title}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          setResearchForm({
                            title: item.title,
                            summary: item.summary,
                            researchType: item.researchType || "",
                            contactId: item.contactId || "",
                            companyId: item.companyId || "",
                            projectId: item.projectId || ""
                          });
                          setResearchDialog({ open: true, mode: "edit", data: item });
                        }}
                        data-testid={`button-edit-research-${item.id}`}
                      >
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
                  {item.researchType && <CardDescription>{item.researchType}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Company Dialog */}
      <Dialog open={companyDialog.open} onOpenChange={(open) => setCompanyDialog({ ...companyDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{companyDialog.mode === "create" ? "Add Company" : "Edit Company"}</DialogTitle>
            <DialogDescription>
              {companyDialog.mode === "create" ? "Create a new company record" : "Update company information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                data-testid="input-company-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                data-testid="input-website"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  data-testid="input-industry"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="size">Size</Label>
                <Select 
                  value={companyForm.size} 
                  onValueChange={(value) => setCompanyForm({ ...companyForm, size: value })}
                >
                  <SelectTrigger data-testid="select-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50)</SelectItem>
                    <SelectItem value="medium">Medium (51-250)</SelectItem>
                    <SelectItem value="large">Large (251-1000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                data-testid="input-city"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={companyForm.notes}
                onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialog({ open: false, mode: "create", data: null })}>
              Cancel
            </Button>
            <Button onClick={handleCompanySubmit} data-testid="button-save-company">
              {companyDialog.mode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialog.open} onOpenChange={(open) => setContactDialog({ ...contactDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{contactDialog.mode === "create" ? "Add Contact" : "Edit Contact"}</DialogTitle>
            <DialogDescription>
              {contactDialog.mode === "create" ? "Create a new contact" : "Update contact information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Select 
                value={contactForm.companyId || "none"} 
                onValueChange={(value) => setContactForm({ ...contactForm, companyId: value === "none" ? "" : value })}
              >
                <SelectTrigger data-testid="select-company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={contactForm.jobTitle}
                  onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
                  data-testid="input-job-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={contactForm.status} 
                  onValueChange={(value) => setContactForm({ ...contactForm, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                data-testid="input-contact-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialog({ open: false, mode: "create", data: null })}>
              Cancel
            </Button>
            <Button onClick={handleContactSubmit} data-testid="button-save-contact">
              {contactDialog.mode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projectDialog.open} onOpenChange={(open) => setProjectDialog({ ...projectDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{projectDialog.mode === "create" ? "Add Project" : "Edit Project"}</DialogTitle>
            <DialogDescription>{projectDialog.mode === "create" ? "Create a new project" : "Update project information"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={projectForm.projectName}
                onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                data-testid="input-project-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="projectCompany">Company</Label>
                <Select 
                  value={projectForm.companyId || "none"} 
                  onValueChange={(value) => setProjectForm({ ...projectForm, companyId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-project-company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={projectForm.priority} 
                  onValueChange={(value) => setProjectForm({ ...projectForm, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialog({ open: false, mode: "create", data: null })}>Cancel</Button>
            <Button onClick={handleProjectSubmit} data-testid="button-save-project">
              {projectDialog.mode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={commDialog.open} onOpenChange={(open) => setCommDialog({ ...commDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{commDialog.mode === "create" ? "Log Communication" : "Edit Communication"}</DialogTitle>
            <DialogDescription>{commDialog.mode === "create" ? "Record a communication with a contact" : "Update communication details"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="commContact">Contact *</Label>
              <Select 
                value={commForm.contactId || "none"} 
                onValueChange={(value) => setCommForm({ ...commForm, contactId: value === "none" ? "" : value })}
              >
                <SelectTrigger data-testid="select-comm-contact">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select contact</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commType">Type *</Label>
                <Select 
                  value={commForm.communicationType} 
                  onValueChange={(value) => setCommForm({ ...commForm, communicationType: value })}
                >
                  <SelectTrigger data-testid="select-comm-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="direction">Direction *</Label>
                <Select 
                  value={commForm.direction} 
                  onValueChange={(value) => setCommForm({ ...commForm, direction: value })}
                >
                  <SelectTrigger data-testid="select-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={commForm.subject}
                onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                data-testid="input-comm-subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Notes</Label>
              <Textarea
                id="content"
                value={commForm.content}
                onChange={(e) => setCommForm({ ...commForm, content: e.target.value })}
                data-testid="input-comm-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommDialog({ open: false, mode: "create", data: null })}>Cancel</Button>
            <Button onClick={handleCommSubmit} data-testid="button-save-communication">
              {commDialog.mode === "create" ? "Log" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Research Dialog */}
      <Dialog open={researchDialog.open} onOpenChange={(open) => setResearchDialog({ ...researchDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{researchDialog.mode === "create" ? "Add Research" : "Edit Research"}</DialogTitle>
            <DialogDescription>{researchDialog.mode === "create" ? "Save research findings and insights" : "Update research information"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="researchTitle">Title *</Label>
              <Input
                id="researchTitle"
                value={researchForm.title}
                onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })}
                data-testid="input-research-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="researchSummary">Summary *</Label>
              <Textarea
                id="researchSummary"
                value={researchForm.summary}
                onChange={(e) => setResearchForm({ ...researchForm, summary: e.target.value })}
                data-testid="input-research-summary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="researchType">Type</Label>
                <Select 
                  value={researchForm.researchType || "none"} 
                  onValueChange={(value) => setResearchForm({ ...researchForm, researchType: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-research-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="competitor">Competitor</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="researchCompany">Company</Label>
                <Select 
                  value={researchForm.companyId || "none"} 
                  onValueChange={(value) => setResearchForm({ ...researchForm, companyId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-research-company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResearchDialog({ open: false, mode: "create", data: null })}>Cancel</Button>
            <Button onClick={handleResearchSubmit} data-testid="button-save-research">
              {researchDialog.mode === "create" ? "Save" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
