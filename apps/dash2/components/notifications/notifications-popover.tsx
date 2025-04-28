import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationList } from "./notification-list";
import { NotificationEmpty } from "./notification-empty";
import type { AuditNotification } from "./types";

const Notifications: AuditNotification[] = [
  {
    id: "1",
    time: "2 hours ago",
    read: false,
    type: "audit",
    details: {
      resourceType: "database",
      resourceId: "1",
      action: "CREATE",
      changes: [],
      website: "https://example.com",
      environment: "production",
    },
    title: "Database created",
    description: "A new database was created",
  },
  
]


export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {Notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {Notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {Notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
        </div>
        {Notifications.length > 0 ? (
          <NotificationList notifications={Notifications} />
        ) : (
          <NotificationEmpty />
        )}
      </PopoverContent>
    </Popover>
  );
} 