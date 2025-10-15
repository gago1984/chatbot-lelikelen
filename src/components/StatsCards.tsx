import { useEffect, useState } from "react";
import { Package, Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const StatsCards = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    upcomingEvents: 0,
    totalQuantity: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [inventoryRes, scheduleRes] = await Promise.all([
        supabase.from("inventory_items").select("*"),
        supabase
          .from("service_schedule")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0]),
      ]);

      const inventory = inventoryRes.data || [];
      const lowStock = inventory.filter(
        (item) => item.quantity <= item.low_stock_threshold
      ).length;
      const totalQty = inventory.reduce((sum, item) => sum + Number(item.quantity), 0);

      setStats({
        totalItems: inventory.length,
        lowStockItems: lowStock,
        upcomingEvents: scheduleRes.data?.length || 0,
        totalQuantity: totalQty,
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
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Upcoming Services",
      value: stats.upcomingEvents,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Stock (kg)",
      value: Math.round(stats.totalQuantity),
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
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
