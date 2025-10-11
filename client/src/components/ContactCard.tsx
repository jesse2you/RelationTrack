import { useState } from "react";
import { type Contact, type Activity } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Check, Clock } from "lucide-react";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import { ActivityTimeline } from "./ActivityTimeline";

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onMarkContacted: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function ContactCard({ contact, onEdit, onDelete, onMarkContacted, isSelected = false, onSelect }: ContactCardProps) {
  const [timelineOpen, setTimelineOpen] = useState(false);

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/contacts", contact.id, "activities"],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${contact.id}/activities`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    enabled: timelineOpen,
  });
  const getStatusColor = () => {
    if (!contact.lastContactDate) {
      return "border-l-chart-3"; // Amber for never contacted
    }
    
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceContact < 7) {
      return "border-l-chart-2"; // Green for recent
    } else if (daysSinceContact < 30) {
      return "border-l-chart-3"; // Amber for moderate
    } else {
      return "border-l-chart-5"; // Red for overdue
    }
  };

  const isDueToday = contact.nextTouchDate && isToday(new Date(contact.nextTouchDate));
  const isOverdue = contact.nextTouchDate && isPast(new Date(contact.nextTouchDate)) && !isToday(new Date(contact.nextTouchDate));

  const getTagColor = (tag: string) => {
    const lowerTag = tag.toLowerCase();
    if (lowerTag === "work") return "bg-chart-1/10 text-chart-1 border-chart-1/20";
    if (lowerTag === "personal") return "bg-chart-4/10 text-chart-4 border-chart-4/20";
    if (lowerTag === "networking") return "bg-chart-2/10 text-chart-2 border-chart-2/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className={`border-l-4 ${getStatusColor()} hover-elevate transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`} data-testid={`card-contact-${contact.id}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onSelect && (
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
                data-testid={`checkbox-select-${contact.id}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base truncate" data-testid={`text-contact-name-${contact.id}`}>
                {contact.name}
              </h3>
              {contact.company && (
                <p className="text-sm text-muted-foreground truncate" data-testid={`text-company-${contact.id}`}>
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(contact)}
              data-testid={`button-edit-${contact.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(contact.id)}
              data-testid={`button-delete-${contact.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {contact.email && (
            <p className="text-sm text-foreground truncate" data-testid={`text-email-${contact.id}`}>
              {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="text-sm text-foreground truncate" data-testid={`text-phone-${contact.id}`}>
              {contact.phone}
            </p>
          )}
          {contact.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-notes-${contact.id}`}>
              {contact.notes}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">Last contact:</span>
            <span className="text-foreground" data-testid={`text-last-contact-${contact.id}`}>
              {contact.lastContactDate
                ? formatDistanceToNow(new Date(contact.lastContactDate), { addSuffix: true })
                : "Never"}
            </span>
          </div>
          
          {contact.nextTouchDate && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">Next touch:</span>
              <span 
                className={`${isDueToday ? 'text-chart-3 font-semibold' : isOverdue ? 'text-chart-5 font-semibold' : 'text-foreground'}`}
                data-testid={`text-next-touch-${contact.id}`}
              >
                {formatDistanceToNow(new Date(contact.nextTouchDate), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" data-testid={`tags-${contact.id}`}>
            {contact.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className={`rounded-full px-3 py-1 text-xs border ${getTagColor(tag)}`}
                data-testid={`badge-tag-${tag}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onMarkContacted(contact.id)}
            data-testid={`button-contacted-${contact.id}`}
          >
            <Check className="h-4 w-4 mr-2" />
            Contacted Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimelineOpen(true)}
            data-testid={`button-timeline-${contact.id}`}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Timeline - {contact.name}</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading timeline...</p>
            </div>
          ) : (
            <ActivityTimeline activities={activities} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
