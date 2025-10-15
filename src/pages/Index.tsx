import { useState } from "react";
import { Heart, MessageCircle, Package, Calendar } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import InventoryView from "@/components/InventoryView";
import ScheduleView from "@/components/ScheduleView";
import StatsCards from "@/components/StatsCards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Community Care Coordinator
              </h1>
              <p className="text-sm text-muted-foreground">Serving those in need, together</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <StatsCards />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryView />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <ScheduleView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
