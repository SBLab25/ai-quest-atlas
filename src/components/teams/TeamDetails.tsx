import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamChat } from "./TeamChat";
import { TeamChallenges } from "./TeamChallenges";
import { Users, MessageSquare, Trophy, LogOut } from "lucide-react";

interface TeamMember {
  user_id: string;
  role: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    total_points: number;
  };
}

interface TeamDetailsProps {
  team: {
    id: string;
    name: string;
    description: string;
    leader_id: string;
    max_members: number;
  };
  members: TeamMember[];
  currentUserId: string;
  onLeave: () => void;
}

export const TeamDetails = ({
  team,
  members,
  currentUserId,
  onLeave,
}: TeamDetailsProps) => {
  const [activeTab, setActiveTab] = useState("members");
  const isLeader = team.leader_id === currentUserId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{team.name}</CardTitle>
            {team.description && (
              <p className="text-muted-foreground mt-2">{team.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {members.length} / {team.max_members} members
              </Badge>
              {isLeader && (
                <Badge variant="default">Team Leader</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={onLeave}>
            <LogOut className="h-4 w-4 mr-2" />
            Leave Team
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4 mt-4">
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.total_points || 0} points
                      </p>
                    </div>
                  </div>
                  <Badge variant={member.role === "leader" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <TeamChat teamId={team.id} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-4">
            <TeamChallenges teamId={team.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
