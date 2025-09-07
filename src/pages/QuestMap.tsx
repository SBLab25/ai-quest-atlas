import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { QuestMap } from "@/components/quest/QuestMap";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ProfileDropdown } from "@/components/navigation/ProfileDropdown";
import { StreakDisplay } from "@/components/streak/StreakDisplay";

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  is_active: boolean;
  created_at: string;
}

const QuestMapPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const { data, error } = await supabase
          .from("Quests")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setQuests(data || []);
      } catch (error) {
        console.error("Error fetching quests:", error);
        toast({
          title: "Error",
          description: "Failed to load quests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [toast]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold">Quest Map & Nearby Adventures</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <h2 className="text-lg font-semibold">Welcome back!</h2>
                  <p className="text-sm text-muted-foreground">Explore quests near you</p>
                </div>
                <NotificationCenter />
                <StreakDisplay />
                <ProfileDropdown />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {/* Hero Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Quest Map & Nearby Adventures</h1>
                <p className="text-muted-foreground">
                  Discover exciting quests in your area and plan your next adventure.
                </p>
              </div>

              {/* Quest Map */}
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <QuestMap quests={quests} />
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default QuestMapPage;