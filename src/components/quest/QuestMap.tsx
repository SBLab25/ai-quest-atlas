import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  is_active: boolean;
}

interface QuestMapProps {
  quests: Quest[];
}

export const QuestMap: React.FC<QuestMapProps> = ({ quests }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyQuests, setNearbyQuests] = useState<Quest[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      findNearbyQuests();
    }
  }, [userLocation, quests]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const findNearbyQuests = () => {
    // For demonstration - in a real app, you'd parse quest locations and calculate distances
    const questsWithLocation = quests.filter(quest => 
      quest.location && quest.location.length > 3
    );
    setNearbyQuests(questsWithLocation.slice(0, 5));
  };

  const getQuestTypeColor = (type: string) => {
    const colors = {
      photography: "bg-purple-100 text-purple-800",
      nature: "bg-green-100 text-green-800",
      history: "bg-amber-100 text-amber-800",
      science: "bg-blue-100 text-blue-800",
      community: "bg-pink-100 text-pink-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Quest Map & Nearby Adventures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Navigation className="h-4 w-4" />
          <span className="text-sm">
            {userLocation 
              ? `Location detected: ${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}`
              : 'Location not available'
            }
          </span>
          {!userLocation && (
            <Button size="sm" variant="outline" onClick={getCurrentLocation}>
              Get Location
            </Button>
          )}
        </div>

        {/* Interactive Map Placeholder */}
        <div className="relative h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Interactive map coming soon</p>
              <p className="text-sm text-muted-foreground">
                Will show quest locations and navigation
              </p>
            </div>
          </div>
          
          {/* Sample map pins */}
          <div className="absolute top-4 left-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute bottom-8 right-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Nearby Quests */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Nearby Quests
          </h3>
          <div className="space-y-2">
            {nearbyQuests.length > 0 ? (
              nearbyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/quest/${quest.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{quest.title}</h4>
                      <Badge className={`${getQuestTypeColor(quest.quest_type)} text-xs`}>
                        {quest.quest_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {quest.location}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.floor(Math.random() * 5 + 1)}km
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No quests found nearby. Try enabling location services.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};