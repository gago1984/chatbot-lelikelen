import { useEffect, useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
}

const InventoryView = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const { data } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      
      if (data) setItems(data);
    };

    fetchInventory();

    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      grains: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      fresh: "bg-green-500/10 text-green-700 border-green-500/20",
      canned: "bg-red-500/10 text-red-700 border-red-500/20",
      oils: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isLowStock = item.quantity <= item.low_stock_threshold;
        return (
          <Card key={item.id} className={`transition-all hover:shadow-lg ${isLowStock ? 'border-destructive/50' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {item.name}
                </span>
                {isLowStock && (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline" className={getCategoryColor(item.category)}>
                {item.category}
              </Badge>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className={`text-2xl font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low threshold:</span>
                  <span>{item.low_stock_threshold} {item.unit}</span>
                </div>
              </div>
              {isLowStock && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2 border border-destructive/20">
                  ⚠️ Running low on stock - consider ordering more
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InventoryView;
