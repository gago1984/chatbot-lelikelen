import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  location: string;
  notes: string | null;
  status: string;
}

const ScheduleView = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data } = await supabase
        .from("service_schedule")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date")
        .limit(10);
      
      if (data) setEvents(data);
    };

    fetchSchedule();

    const channel = supabase
      .channel("schedule-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_schedule" },
        () => fetchSchedule()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      completed: "bg-green-500/10 text-green-700 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            {event.notes && (
              <div className="mt-3 text-sm bg-muted/50 rounded-lg p-3 border border-border/50">
                {event.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleView;
