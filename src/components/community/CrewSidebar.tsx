import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Users, PlusCircle, LogIn, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CrewSidebarProps {
  onSearchChange?: (text: string) => void;
}

interface Crew {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  max_members: number;
  created_at: string;
  member_count?: number;
}

export default function CrewSidebar({ onSearchChange }: CrewSidebarProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem("crewSidebar") === "open");
  const [query, setQuery] = useState("");
  const [crewOpen, setCrewOpen] = useState(true);
  const [myCrews, setMyCrews] = useState<Crew[]>([]);
  const [availableCrews, setAvailableCrews] = useState<Crew[]>([]);
  const [recentCrews, setRecentCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCrewName, setNewCrewName] = useState("");
  const [newCrewDesc, setNewCrewDesc] = useState("");

  useEffect(() => {
    localStorage.setItem("crewSidebar", isOpen ? "open" : "closed");
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    loadCrews();
  }, [user]);

  const loadCrews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: allCrews, error: crewsError } = await (supabase as any)
        .from('crews')
        .select(`*, crew_members(count)`) as any;
      if (crewsError) throw crewsError;

      const { data: memberships, error: membershipError } = await (supabase as any)
        .from('crew_members')
        .select(`crew_id, joined_at, crews(*)`)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });
      if (membershipError) throw membershipError;

      const userCrewIds = new Set(memberships?.map((m: any) => m.crew_id) || []);
      const withCounts: Crew[] = (allCrews || []).map((t: any) => ({
        ...t,
        member_count: Array.isArray(t.crew_members) ? t.crew_members.length : 0,
      }));

      setMyCrews(withCounts.filter((t) => userCrewIds.has(t.id)));
      setAvailableCrews(withCounts.filter((t) => !userCrewIds.has(t.id) && (t.member_count || 0) < t.max_members));
      setRecentCrews((memberships || []).map((m: any) => ({ ...m.crews, member_count: undefined })));
    } catch (err) {
      console.error('Error loading crews', err);
      toast({ title: 'Error', description: 'Failed to load crews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrew = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create a crew', variant: 'destructive' });
      return;
    }
    if (!newCrewName.trim()) return;
    setCreating(true);
    try {
      const { data: crew, error } = await (supabase as any)
        .from('crews')
        .insert({ name: newCrewName.trim(), description: newCrewDesc || null, leader_id: user.id, max_members: 6 })
        .select()
        .single();
      if (error) throw error;
      const { error: memberError } = await (supabase as any)
        .from('crew_members')
        .insert({ crew_id: crew.id, user_id: user.id, role: 'leader' });
      if (memberError) throw memberError;
      setNewCrewName("");
      setNewCrewDesc("");
      toast({ title: 'Crew created', description: `Welcome to "${crew.name}"` });
      await loadCrews();
    } catch (err) {
      console.error('Error creating crew', err);
      toast({ title: 'Error', description: 'Could not create crew', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinCrew = async (crewId: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to join a crew', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await (supabase as any)
        .from('crew_members')
        .insert({ crew_id: crewId, user_id: user.id, role: 'member' });
      if (error) throw error;
      toast({ title: 'Joined crew' });
      await loadCrews();
    } catch (err) {
      console.error('Error joining crew', err);
      toast({ title: 'Error', description: 'Could not join crew', variant: 'destructive' });
    }
  };

  const handleLeaveCrew = async (crewId: string) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from('crew_members')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Left crew' });
      await loadCrews();
    } catch (err) {
      console.error('Error leaving crew', err);
      toast({ title: 'Error', description: 'Could not leave crew', variant: 'destructive' });
    }
  };

  const discoverFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return availableCrews.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 10);
  }, [availableCrews, query]);

  const myFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return myCrews.filter((c) => c.name.toLowerCase().includes(q));
  }, [myCrews, query]);

  return (
    <div className="fixed left-8 top-0 z-40 h-screen flex items-start">
      {/* Thin line and toggle button (Reddit-like) */}
      <div className="relative h-full">
        <div className="h-full w-px bg-border/60" />
        <Button
          aria-label={isOpen ? "Collapse crew sidebar" : "Expand crew sidebar"}
          variant="secondary"
          size="icon"
          onClick={() => setIsOpen((v) => !v)}
          className="absolute -right-4 top-24 h-8 w-8 rounded-full border border-border/60 bg-background/95 shadow-md backdrop-blur hover:scale-105 transition"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sliding panel */}
      <div
        className={
          "ml-2 h-[90vh] mt-4 rounded-xl border border-border/60 bg-card/95 backdrop-blur shadow-lg overflow-hidden w-80 transition-transform duration-300 will-change-transform " +
          (isOpen ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+0.5rem)] opacity-0")
        }
      >
        {/* Content wrapper */}
        <div className={"h-full flex flex-col " + (isOpen ? "p-3" : "p-0")}>
          {/* Search */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crews"
                className="pl-8"
              />
              {onSearchChange && (
                <input type="hidden" value={query} onChange={() => {}} />
              )}
            </div>
          </div>

          {/* Crew Section */}
          <Card className="p-3 flex-1 overflow-auto">
            <button
              type="button"
              onClick={() => setCrewOpen((v) => !v)}
              className="w-full flex items-center justify-between"
              aria-expanded={crewOpen}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Crew</span>
              </div>
              <span className="text-xs text-muted-foreground">{crewOpen ? "Hide" : "Show"}</span>
            </button>

            {crewOpen && (
              <div className="mt-3 space-y-3">
                {/* Create */}
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Create a crew</div>
                  <Input placeholder="Crew name" value={newCrewName} onChange={(e) => setNewCrewName(e.target.value)} />
                  <Input placeholder="Description (optional)" value={newCrewDesc} onChange={(e) => setNewCrewDesc(e.target.value)} />
                  <Button size="sm" className="w-full justify-center" onClick={handleCreateCrew} disabled={creating || !newCrewName.trim()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {creating ? 'Creating...' : 'Create crew'}
                  </Button>
                </div>

                {/* My crews */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">My crews</div>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {loading ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : myFiltered.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No crews yet</div>
                    ) : (
                      myFiltered.map((c) => (
                        <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted">
                          <div className="truncate text-sm">{c.name}</div>
                          <Button size="sm" variant="ghost" onClick={() => handleLeaveCrew(c.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Discover crews */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Discover crews</div>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {loading ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : discoverFiltered.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No matching crews</div>
                    ) : (
                      discoverFiltered.map((c) => (
                        <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted">
                          <div className="truncate text-sm">{c.name}</div>
                          <Button size="sm" variant="outline" onClick={() => handleJoinCrew(c.id)}>
                            <LogIn className="h-4 w-4 mr-1" /> Join
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent crews */}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recent crews</div>
                  <div className="space-y-1 max-h-32 overflow-auto pr-1">
                    {(recentCrews || []).slice(0, 8).map((c) => (
                      <div key={c.id} className="px-2 py-1 rounded text-sm hover:bg-muted truncate">{c.name}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


