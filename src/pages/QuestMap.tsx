import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuestMap } from "@/components/quest/QuestMap";
import { TopNavbar } from "@/components/navigation/TopNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-4">
            Quest Map
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover exciting quests in your area and plan your next adventure.
          </p>
        </div>

        {/* Interactive Quest Map */}
        {loading ? (
          <Card className="h-96 bg-gradient-to-br from-background to-accent/5">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground text-lg">Loading quest locations...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-2xl border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Interactive Quest Map
              </CardTitle>
              <CardDescription>
                Explore {quests.length} active quests in your area. Click on markers to view details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <QuestMap quests={quests} />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default QuestMapPage;