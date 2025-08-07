import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Globe, Search, Filter, Star, Compass, Target, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  is_active: boolean;
  distance?: number; // Added for calculated distances
}

interface QuestMapProps {
  quests: Quest[];
}

export const QuestMap: React.FC<QuestMapProps> = ({ quests }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyQuests, setNearbyQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [mapView, setMapView] = useState<'satellite' | 'terrain' | 'street'>('terrain');
  const [showDirections, setShowDirections] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      findNearbyQuests();
    }
  }, [userLocation, quests]);

  useEffect(() => {
    filterQuests();
  }, [nearbyQuests, searchTerm, selectedType, selectedDifficulty]);

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
    // Enhanced quest filtering with simulated distances
    const questsWithLocation = quests.filter(quest => 
      quest.location && quest.location.length > 3
    ).map(quest => ({
      ...quest,
      distance: Math.random() * 10 + 0.5 // Simulated distance in km
    })).sort((a, b) => a.distance - b.distance);
    
    setNearbyQuests(questsWithLocation);
  };

  const filterQuests = () => {
    let filtered = nearbyQuests;

    if (searchTerm) {
      filtered = filtered.filter(quest =>
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(quest => quest.quest_type === selectedType);
    }

    if (selectedDifficulty !== 'all') {
      const difficultyNum = parseInt(selectedDifficulty);
      filtered = filtered.filter(quest => quest.difficulty === difficultyNum);
    }

    setFilteredQuests(filtered);
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

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getDirections = (questId: string, location: string) => {
    setShowDirections(questId);
    // In a real app, this would open directions to the quest location
    setTimeout(() => setShowDirections(null), 2000);
  };

  const uniqueTypes = [...new Set(quests.map(quest => quest.quest_type))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Map Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Map Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Interactive Quest Map
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={mapView === 'terrain' ? 'default' : 'outline'}
                  onClick={() => setMapView('terrain')}
                >
                  Terrain
                </Button>
                <Button
                  size="sm"
                  variant={mapView === 'satellite' ? 'default' : 'outline'}
                  onClick={() => setMapView('satellite')}
                >
                  Satellite
                </Button>
                <Button
                  size="sm"
                  variant={mapView === 'street' ? 'default' : 'outline'}
                  onClick={() => setMapView('street')}
                >
                  Street
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Location Status */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
              <Navigation className="h-4 w-4" />
              <span className="text-sm">
                {userLocation 
                  ? `Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : 'Location not detected'
                }
              </span>
              {!userLocation && (
                <Button size="sm" variant="outline" onClick={getCurrentLocation}>
                  <Target className="h-4 w-4 mr-1" />
                  Enable Location
                </Button>
              )}
            </div>

            {/* Enhanced Interactive Map */}
            <div className={`relative h-80 rounded-lg overflow-hidden transition-all duration-300 ${
              mapView === 'terrain' ? 'bg-gradient-to-br from-green-100 via-amber-50 to-green-200' :
              mapView === 'satellite' ? 'bg-gradient-to-br from-gray-800 via-gray-600 to-gray-900' :
              'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300'
            }`}>
              {/* Map Legend */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg z-10">
                <h4 className="font-semibold text-xs mb-2">Quest Types</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Photography</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Nature</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Science</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>History</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span>Community</span>
                  </div>
                </div>
              </div>

              {/* User Location Marker */}
              {userLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute -top-1 -left-1 w-8 h-8 bg-primary/30 rounded-full animate-ping"></div>
                  </div>
                </div>
              )}

              {/* Quest Markers */}
              <div className="absolute top-8 right-8">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                     title="Photography Quest"></div>
              </div>
              <div className="absolute bottom-12 left-12">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                     title="Nature Quest"></div>
              </div>
              <div className="absolute top-20 left-20">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                     title="Science Quest"></div>
              </div>
              <div className="absolute bottom-20 right-20">
                <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                     title="History Quest"></div>
              </div>
              <div className="absolute top-32 right-32">
                <div className="w-4 h-4 bg-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                     title="Community Quest"></div>
              </div>

              {/* Compass */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-full p-2 shadow-lg">
                <Compass className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quest List Sidebar */}
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Quests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quests or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Quests List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Nearby Quests ({filteredQuests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredQuests.length > 0 ? (
                filteredQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1" onClick={() => navigate(`/quest/${quest.id}`)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{quest.title}</h4>
                          <Badge className={`${getQuestTypeColor(quest.quest_type)} text-xs`}>
                            {quest.quest_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          {getDifficultyStars(quest.difficulty)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {quest.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-primary mb-1">
                          ~{quest.distance?.toFixed(1)}km
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            getDirections(quest.id, quest.location);
                          }}
                          className="h-6 px-2"
                          disabled={showDirections === quest.id}
                        >
                          {showDirections === quest.id ? (
                            <span className="text-xs">Opening...</span>
                          ) : (
                            <Route className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || selectedType !== 'all' || selectedDifficulty !== 'all'
                      ? 'No quests match your filters'
                      : 'No quests found nearby. Try enabling location services.'
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};