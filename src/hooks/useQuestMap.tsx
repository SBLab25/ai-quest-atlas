import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: number;
  location: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
}

interface CompletedQuest {
  quest_id: string;
}

interface QuestWithCompletion extends Quest {
  completed?: boolean;
}

export const useQuestMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileLocation, setProfileLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const {
    location: userLocation,
    requestLocationPermission,
    loading: locationLoading,
  } = useLocationPermission();

  // Fetch user's profile location from Supabase (same as Profile page uses)
  useEffect(() => {
    const fetchProfileLocation = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // If profile has saved location, use it
        if (data?.latitude && data?.longitude) {
          setProfileLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          console.log('Using profile location from database:', data.latitude, data.longitude);
        }
      } catch (error) {
        console.error('Error fetching profile location:', error);
        // If profile location not available, location will fallback to geolocation
      }
    };

    fetchProfileLocation();
  }, [user?.id]);

  const [quests, setQuests] = useState<QuestWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  // Fetch quests - refetch when location changes to update quest positions
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);

        // Fetch all active quests
        const { data: questsData, error: questsError } = await supabase
          .from('Quests')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (questsError) throw questsError;

        // Fetch user's completed quests if logged in (temporarily disabled until table schema confirmed)
        let completedQuestIds: string[] = [];
        // TODO: Re-enable once QuestSubmissions table is confirmed in database schema
        /*
        if (user) {
          try {
            const { data: completedData } = await supabase
              .from('QuestSubmissions')
              .select('quest_id')
              .eq('user_id', user.id)
              .eq('verification_status', 'approved');

            if (completedData) {
              completedQuestIds = completedData.map((item: any) => item.quest_id);
            }
          } catch (err) {
            console.log('Could not fetch completed quests:', err);
          }
        }
        */

        // Get user location for positioning quests nearby
        const userLat = profileLocation?.latitude || (userLocation?.latitude);
        const userLng = profileLocation?.longitude || (userLocation?.longitude);

        // Parse location strings to coordinates (if they contain lat/lng)
        const questsWithCoords = (questsData || []).map((quest, index) => {
          const completed = completedQuestIds.includes(quest.id);
          
          let latitude: number | undefined;
          let longitude: number | undefined;

          // First, check if quest already has coordinates in database
          const questWithCoords = quest as any;
          if (questWithCoords.latitude && questWithCoords.longitude) {
            latitude = questWithCoords.latitude;
            longitude = questWithCoords.longitude;
          } else if (userLat && userLng) {
            // Generate quests near user's location for heat map visualization
            // Spread quests in a radius around user location (0.5km to 10km away)
            const hash = quest.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const angle = (hash % 360) * (Math.PI / 180); // Random angle in radians
            const distance = 0.5 + ((hash % 100) / 10); // Distance in km (0.5km to 10km)
            
            // Convert distance to degrees (approximately 1km = 0.009 degrees)
            const latOffset = (distance * Math.cos(angle)) * 0.009;
            const lngOffset = (distance * Math.sin(angle)) * 0.009;
            
            latitude = userLat + latOffset;
            longitude = userLng + lngOffset;
          } else {
            // Fallback: if no user location, use a default location
            const hash = quest.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            latitude = 40.7128 + (hash % 100) / 1000 - 0.05;
            longitude = -74.006 + (hash % 100) / 1000 - 0.05;
          }

          return {
            ...quest,
            latitude,
            longitude,
            completed,
          };
        });

        setQuests(questsWithCoords);
      } catch (error) {
        console.error('Error fetching quests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quests. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('quest-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Quests' },
        () => {
          fetchQuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, profileLocation, userLocation]);

  // Toggle filters
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleDifficulty = (difficulty: number) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty]
    );
  };

  // Filtered quests
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(quest.quest_type)) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(quest.difficulty)) {
        return false;
      }

      // Completion filter
      if (!showCompleted && quest.completed) {
        return false;
      }

      // Distance filter - use profile location if available, otherwise geolocation
      const locationForDistance = profileLocation || (userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null);
      if (maxDistance && locationForDistance && quest.latitude && quest.longitude) {
        const distance = calculateDistance(
          locationForDistance.latitude,
          locationForDistance.longitude,
          quest.latitude,
          quest.longitude
        );
        if (distance > maxDistance) {
          return false;
        }
      }

      return true;
    });
  }, [quests, selectedTypes, selectedDifficulties, showCompleted, maxDistance, profileLocation, userLocation]);

  // Quest counts
  const questCounts = useMemo(() => {
    const byType: Record<string, number> = {};
    quests.forEach((quest) => {
      byType[quest.quest_type] = (byType[quest.quest_type] || 0) + 1;
    });

    return {
      total: quests.length,
      filtered: filteredQuests.length,
      byType,
    };
  }, [quests, filteredQuests]);

  // Use profile location if available, otherwise fallback to geolocation
  const finalUserLocation = profileLocation 
    ? { lat: profileLocation.latitude, lng: profileLocation.longitude }
    : (userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null);

  return {
    quests: filteredQuests,
    allQuests: quests,
    loading: loading || locationLoading,
    userLocation: finalUserLocation,
    requestLocation: requestLocationPermission,
    showHeatmap,
    setShowHeatmap,
    showClusters,
    setShowClusters,
    selectedTypes,
    toggleType,
    selectedDifficulties,
    toggleDifficulty,
    maxDistance,
    setMaxDistance,
    showCompleted,
    setShowCompleted,
    questCounts,
  };
};

// Helper function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
}
