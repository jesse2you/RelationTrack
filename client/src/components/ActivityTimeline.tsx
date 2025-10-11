import { type Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Clock, Edit, Phone, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "contact":
        return <Phone className="h-4 w-4" />;
      case "update":
        return <Edit className="h-4 w-4" />;
      case "created":
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3" data-testid={`activity-${activity.id}`}>
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                {activity.notes && (
                  <p className="text-sm text-muted-foreground">{activity.notes}</p>
                )}
                <p className="text-xs text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
