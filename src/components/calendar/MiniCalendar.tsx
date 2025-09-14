import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuestCalendar } from "@/hooks/useQuestCalendar";

export const MiniCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { isQuestCompletionDate, getQuestCountForDate, loading } = useQuestCalendar();

  // Mock upcoming events
  const upcomingEvents = [
    {
      date: "Today",
      title: "Daily Quest Reset",
      time: "12:00 AM",
      type: "system"
    },
    {
      date: "Tomorrow",
      title: "Weekly Challenge",
      time: "6:00 PM", 
      type: "challenge"
    },
    {
      date: "Friday",
      title: "Community Event",
      time: "8:00 PM",
      type: "community"
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "system": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "challenge": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "community": return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <Card className="bg-gradient-to-br from-background to-accent/5 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className={cn("w-full p-0 pointer-events-auto")}
            modifiers={{
              questCompleted: (day) => !loading && isQuestCompletionDate(day)
            }}
            modifiersClassNames={{
              questCompleted: "relative bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-semibold after:content-[''] after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-green-500 after:rounded-full"
            }}
            classNames={{
              months: "space-y-0",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-accent rounded-md",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
              row: "flex w-full mt-1",
              cell: "text-center text-xs p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-medium",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
            }}
          />
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Quest completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events Card */}
      <Card className="bg-gradient-to-br from-background to-secondary/5 border-secondary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-secondary" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{event.title}</span>
                    <Badge variant="secondary" className={cn("text-xs", getEventTypeColor(event.type))}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};