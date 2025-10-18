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
  attendance: number | null;
}

const ScheduleView = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<ScheduleEvent[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const [upcomingRes, pastRes] = await Promise.all([
        supabase
          .from("service_schedule")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date")
          .limit(10),
        supabase
          .from("service_schedule")
          .select("*")
          .eq("status", "completed")
          .not("attendance", "is", null)
          .order("date", { ascending: false })
          .limit(5),
      ]);
      
      if (upcomingRes.data) setUpcomingEvents(upcomingRes.data);
      if (pastRes.data) setPastEvents(pastRes.data);
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
    <div className="space-y-6">
      {/* Past Services Section */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recent Completed Services
          </h3>
          {pastEvents.map((event) => (
            <Card key={event.id} className="transition-all hover:shadow-lg border-green-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Calendar className="w-5 h-5 text-green-700" />
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
                {event.attendance && (
                  <div className="mt-3 flex items-center gap-2 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                      <span className="text-2xl font-bold">{event.attendance}</span>
                      <span>people attended</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Services Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Services
        </h3>
        {upcomingEvents.map((event) => (
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
        {upcomingEvents.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming events scheduled</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
