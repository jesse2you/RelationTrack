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
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company updated successfully" });
      setCompanyDialog({ open: false, mode: "create", data: null });
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
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated successfully" });
      setContactDialog({ open: false, mode: "create", data: null });
    },
  });

  // Delete mutations
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "Company deleted" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const deleteCommMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/communications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Communication deleted" });
    },
  });

  const deleteResearchMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/research/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({ title: "Research deleted" });
    },
  });

  // Handle company form
  const handleCompanySubmit = () => {
    if (companyDialog.mode === "create") {
      createCompanyMutation.mutate(companyForm);
    } else if (companyDialog.data) {
      updateCompanyMutation.mutate({ id: companyDialog.data.id, ...companyForm });
    }
  };

  // Handle contact form
  const handleContactSubmit = () => {
    if (contactDialog.mode === "create") {
      createContactMutation.mutate({ ...contactForm, companyId: contactForm.companyId || null });
    } else if (contactDialog.data) {
      updateContactMutation.mutate({ id: contactDialog.data.id, ...contactForm, companyId: contactForm.companyId || null });
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

        {/* Projects, Communications, Research tabs - simplified for now */}
        <TabsContent value="projects">
          <p className="text-muted-foreground">Projects list - forms coming next</p>
        </TabsContent>
        <TabsContent value="communications">
          <p className="text-muted-foreground">Communications list - forms coming next</p>
        </TabsContent>
        <TabsContent value="research">
          <p className="text-muted-foreground">Research list - forms coming next</p>
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
    </div>
  );
}
