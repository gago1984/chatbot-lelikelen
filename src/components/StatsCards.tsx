import { useEffect, useState } from "react";
import { Package, Calendar, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const StatsCards = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    completedServices: 0,
    upcomingEvents: 0,
    totalQuantity: 0,
    avgAttendance: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [inventoryRes, upcomingRes, completedRes] = await Promise.all([
        supabase.from("inventory_items").select("*"),
        supabase
          .from("service_schedule")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0]),
        supabase
          .from("service_schedule")
          .select("*")
          .eq("status", "completed")
          .not("attendance", "is", null),
      ]);

      const inventory = inventoryRes.data || [];
      const totalQty = inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
      const completed = completedRes.data || [];
      const avgAttendance = completed.length > 0
        ? Math.round(completed.reduce((sum, s) => sum + (s.attendance || 0), 0) / completed.length)
        : 0;

      setStats({
        totalItems: inventory.length,
        completedServices: completed.length,
        upcomingEvents: upcomingRes.data?.length || 0,
        totalQuantity: totalQty,
        avgAttendance,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Services Completed",
      value: stats.completedServices,
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Upcoming Services",
      value: stats.upcomingEvents,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Avg. Attendance",
      value: stats.avgAttendance,
      subtitle: "people per service",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="transition-all hover:shadow-md border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
