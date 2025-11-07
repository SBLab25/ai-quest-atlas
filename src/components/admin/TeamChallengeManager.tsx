import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

interface Quest {
  id: string;
  title: string;
}

interface Badge {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  quest_id: string | null;
  required_completions: number;
  end_date: string | null;
  reward_points: number;
  reward_badge_id: string | null;
  is_active: boolean;
}

export const TeamChallengeManager = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quest_id: "",
    required_completions: 5,
    end_date: "",
    reward_points: 0,
    reward_badge_id: "",
    is_active: true,
  });

  useEffect(() => {
    fetchChallenges();
    fetchQuests();
    fetchBadges();
  }, []);

  const fetchChallenges = async () => {
    const { data, error } = await (supabase as any)
      .from("team_challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenges:", error);
    } else {
      setChallenges((data || []) as Challenge[]);
    }
  };

  const fetchQuests = async () => {
    const { data, error } = await supabase
      .from("Quests")
      .select("id, title")
      .order("title");

    if (error) {
      console.error("Error fetching quests:", error);
    } else {
      setQuests(data || []);
    }
  };

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from("Badges")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching badges:", error);
    } else {
      setBadges(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const challengeData = {
      ...formData,
      quest_id: formData.quest_id || null,
      reward_badge_id: formData.reward_badge_id || null,
      end_date: formData.end_date || null,
    };

    try {
      if (editingChallenge) {
        const { error } = await (supabase as any)
          .from("team_challenges")
          .update(challengeData)
          .eq("id", editingChallenge.id);

        if (error) throw error;
        toast.success("Challenge updated!");
      } else {
        const { error } = await (supabase as any)
          .from("team_challenges")
          .insert(challengeData);

        if (error) throw error;
        toast.success("Challenge created!");
      }

      resetForm();
      fetchChallenges();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Failed to save challenge");
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      quest_id: challenge.quest_id || "",
      required_completions: challenge.required_completions,
      end_date: challenge.end_date || "",
      reward_points: challenge.reward_points,
      reward_badge_id: challenge.reward_badge_id || "",
      is_active: challenge.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      const { error } = await (supabase as any)
        .from("team_challenges")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Challenge deleted!");
      fetchChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("Failed to delete challenge");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      quest_id: "",
      required_completions: 5,
      end_date: "",
      reward_points: 0,
      reward_badge_id: "",
      is_active: true,
    });
    setEditingChallenge(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Challenges</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Challenge Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="quest">Quest (Optional)</Label>
                <Select
                  value={formData.quest_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, quest_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a quest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific quest</SelectItem>
                    {quests.map((quest) => (
                      <SelectItem key={quest.id} value={quest.id}>
                        {quest.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="completions">Required Completions</Label>
                <Input
                  id="completions"
                  type="number"
                  min="1"
                  value={formData.required_completions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      required_completions: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="points">Reward Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.reward_points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reward_points: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="badge">Reward Badge (Optional)</Label>
                <Select
                  value={formData.reward_badge_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, reward_badge_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No badge reward</SelectItem>
                    {badges.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        {badge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingChallenge ? "Update" : "Create"} Challenge
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{challenge.title}</CardTitle>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {challenge.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(challenge)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(challenge.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Required:</span>{" "}
                  {challenge.required_completions} completions
                </div>
                <div>
                  <span className="text-muted-foreground">Reward:</span>{" "}
                  {challenge.reward_points} points
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {challenge.is_active ? "Active" : "Inactive"}
                </div>
                {challenge.end_date && (
                  <div>
                    <span className="text-muted-foreground">Ends:</span>{" "}
                    {new Date(challenge.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
