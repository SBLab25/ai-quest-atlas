import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualScroll } from '@/components/ui/virtual-scroll';
import { MapPin, Navigation, Star, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  image_url?: string;
  completed?: boolean;
}

interface QuestSidebarProps {
  quests: Quest[];
  userLocation: { lat: number; lng: number } | null;
  onNavigateToQuest: (quest: Quest) => void;
}

const getQuestTypeColor = (type: string) => {
  const colors = {
    photography: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    nature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    history: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    science: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    community: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  };
  return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground';
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const QuestSidebar: React.FC<QuestSidebarProps> = ({
  quests,
  userLocation,
  onNavigateToQuest,
}) => {
  const navigate = useNavigate();

  // Sort quests by distance if user location is available
  const sortedQuests = useMemo(() => {
    if (!userLocation) return quests;

    return [...quests]
      .map((quest) => {
        if (quest.latitude && quest.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            quest.latitude,
            quest.longitude
          );
          return { ...quest, distance };
        }
        return quest;
      })
      .sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance;
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      });
  }, [quests, userLocation]);

  const openDirections = (quest: Quest) => {
    if (quest.latitude && quest.longitude) {
      // Open in Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${quest.latitude},${quest.longitude}`;
      window.open(url, '_blank');
    }
  };

  const renderQuest = (quest: Quest, index: number) => (
    <Card
      key={quest.id}
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/quest/${quest.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Quest image */}
          {quest.image_url && (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={quest.image_url}
                alt={quest.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
            </div>
          )}

          {/* Quest info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {quest.title}
              </h3>
              {quest.distance !== undefined && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {quest.distance.toFixed(1)} km
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getQuestTypeColor(quest.quest_type)} text-xs`}>
                {quest.quest_type}
              </Badge>
              <div className="flex items-center">
                {Array.from({ length: quest.difficulty }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{quest.location}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/quest/${quest.id}`);
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
              
              {quest.latitude && quest.longitude && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDirections(quest);
                  }}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Navigate
                </Button>
              )}

              {quest.completed && (
                <Badge variant="outline" className="text-xs ml-auto">
                  ✓ Completed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Nearby Quests
            <Badge variant="secondary" className="ml-auto">
              {sortedQuests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {sortedQuests.length > 0 ? (
            <div className="h-full px-4 pb-4">
              <VirtualScroll
                items={sortedQuests}
                height={600}
                itemHeight={140}
                renderItem={renderQuest}
                overscan={3}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No quests found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters or enable location services
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
