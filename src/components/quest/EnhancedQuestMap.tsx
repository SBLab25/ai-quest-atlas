import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { Camera, TreePine, Building, TestTube, Users, MapPin, Target, Layers, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  completed?: boolean;
}

interface QuestRoute {
  id: string;
  name: string;
  questIds: string[];
  color: string;
}

interface TeamMemberLocation { id: string; username?: string | null; avatar_url?: string | null; lat: number; lng: number; team_id?: string; }

interface EnhancedQuestMapProps {
  quests: Quest[];
  userLocation: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
  showHeatmap?: boolean;
  showClusters?: boolean;
  filters?: {
    types: string[];
    difficulties: number[];
    maxDistance: number | null;
    showCompleted: boolean;
  };
  routes?: QuestRoute[];
  teamMembers?: TeamMemberLocation[];
}

// Custom quest type icons
const getQuestIcon = (type: string, difficulty: number) => {
  const colors = {
    photography: '#9b87f5',
    nature: '#22c55e',
    history: '#f59e0b',
    science: '#3b82f6',
    community: '#ec4899',
  };
  
  const color = colors[type as keyof typeof colors] || '#6E59A5';
  const size = difficulty <= 2 ? 32 : difficulty <= 4 ? 36 : 40;
  
  const IconComponent = {
    photography: Camera,
    nature: TreePine,
    history: Building,
    science: TestTube,
    community: Users,
  }[type] || MapPin;

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.9"/>
      <circle cx="12" cy="12" r="8" fill="white" opacity="0.3"/>
    </svg>
  `;

  return L.divIcon({
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${svgIcon}
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
            ${type === 'photography' ? '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' :
              type === 'nature' ? '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>' :
              type === 'history' ? '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/>' :
              type === 'science' ? '<path d="M9 2v18M15 2v18M5 10h14M5 14h14"/>' :
              '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"/>'}
          </svg>
        </div>
      </div>
    `,
    className: 'custom-quest-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// User location icon
const userLocationIcon = L.divIcon({
  html: `
    <style>
      @keyframes pulse { 0%,100%{ transform: scale(1); opacity:.3 } 50%{ transform: scale(1.2); opacity:.1 } }
    </style>
    <div style="position: relative;">
      <div style="width: 20px; height: 20px; background: hsl(var(--primary)); border: 3px solid hsl(var(--background)); border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
      <div style="position: absolute; top: -5px; left: -5px; width: 30px; height: 30px; background: hsl(var(--primary)); opacity: 0.3; border-radius: 50%; animation: pulse 2s infinite;"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Team member icon
const teamMemberIcon = L.divIcon({
  html: `
    <div style="position: relative;">
      <div style="width: 18px; height: 18px; background: hsl(var(--secondary)); border: 2px solid hsl(var(--background)); border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
    </div>
  `,
  className: 'team-location-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Map controller components
function MapController({ 
  center, 
  userLocation, 
  showHeatmap, 
  showClusters, 
  quests, 
  filters 
}: {
  center: [number, number];
  userLocation: { lat: number; lng: number } | null;
  showHeatmap: boolean;
  showClusters: boolean;
  quests: Quest[];
  filters: any;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  // Update map center when user location changes
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  // Force map to invalidate size and refresh tiles
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  // Setup marker clustering
  useEffect(() => {
    if (!showClusters) {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      return;
    }

    const markers = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 10) size = 'large';
        else if (count > 5) size = 'medium';

        return L.divIcon({
          html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(40, 40, true),
        });
      },
    });

    // Filter and add markers to cluster
    const filteredQuests = quests.filter((quest) => {
      if (filters.types.length > 0 && !filters.types.includes(quest.quest_type)) return false;
      if (filters.difficulties.length > 0 && !filters.difficulties.includes(quest.difficulty)) return false;
      if (!filters.showCompleted && quest.completed) return false;
      return true;
    });

    filteredQuests.forEach((quest) => {
      if (quest.latitude && quest.longitude) {
        const marker = L.marker([quest.latitude, quest.longitude], {
          icon: getQuestIcon(quest.quest_type, quest.difficulty),
        });
        markers.addLayer(marker);
      }
    });

    map.addLayer(markers);
    clusterGroupRef.current = markers;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [showClusters, quests, filters, map]);

  // Setup heatmap
  useEffect(() => {
    if (!showHeatmap) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    // Filter quests based on user location and maxDistance
    const heatData = quests
      .filter((q) => q.latitude && q.longitude)
      .filter((q) => {
        // If no user location, show all quests
        if (!userLocation) return true;
        
        // If no maxDistance filter, show all quests
        if (!filters?.maxDistance) return true;
        
        // Calculate distance and filter
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          q.latitude!,
          q.longitude!
        );
        return distance <= filters.maxDistance;
      })
      .map((q) => {
        // Add intensity based on quest difficulty
        const intensity = 0.5 + (q.difficulty / 10);
        return [q.latitude!, q.longitude!, intensity] as [number, number, number];
      });

    if (heatData.length > 0) {
      const heatLayer = (L as any).heatLayer(heatData, {
        radius: 50,
        blur: 35,
        minOpacity: 0.4,
        maxZoom: 18,
        max: 1.0,
        gradient: {
          0.0: '#4285F4',
          0.2: '#34A853',
          0.4: '#FBBC04',
          0.6: '#EA4335',
          0.8: '#C5221F',
          1.0: '#8B0000',
        },
      });

      map.addLayer(heatLayer);
      heatLayerRef.current = heatLayer;
      
      // Log for debugging
      console.log('Heatmap added with', heatData.length, 'points');
    } else {
      console.log('No heat data to display');
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [showHeatmap, quests, map, filters, userLocation]);

  return null;
};

export const EnhancedQuestMap: React.FC<EnhancedQuestMapProps> = ({
  quests,
  userLocation,
  onRequestLocation,
  showHeatmap = false,
  showClusters = true,
  filters = {
    types: [],
    difficulties: [],
    maxDistance: null,
    showCompleted: true,
  },
  routes = [],
  teamMembers = [],
}) => {
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [zoom, setZoom] = useState(13);

  // Calculate map center based on quests or user location
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    } else if (quests.length > 0) {
      const questsWithCoords = quests.filter((q) => q.latitude && q.longitude);
      if (questsWithCoords.length > 0) {
        const avgLat =
          questsWithCoords.reduce((sum, q) => sum + q.latitude!, 0) / questsWithCoords.length;
        const avgLng =
          questsWithCoords.reduce((sum, q) => sum + q.longitude!, 0) / questsWithCoords.length;
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [userLocation, quests]);

  // Filter quests based on filters
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (!quest.latitude || !quest.longitude) return false;
      if (filters.types.length > 0 && !filters.types.includes(quest.quest_type)) return false;
      if (filters.difficulties.length > 0 && !filters.difficulties.includes(quest.difficulty))
        return false;
      if (!filters.showCompleted && quest.completed) return false;

      // Distance filter
      if (filters.maxDistance && userLocation) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          quest.latitude,
          quest.longitude
        );
        if (distance > filters.maxDistance) return false;
      }

      return true;
    });
  }, [quests, filters, userLocation]);

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setZoom(15);
    } else {
      onRequestLocation();
    }
  };


  return (
    <div className="relative h-full w-full">
      <style>{`
        .cluster-marker {
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--background));
          border-radius: 50%;
          color: hsl(var(--primary-foreground));
          display: flex; align-items: center; justify-content: center; font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .cluster-small { width: 30px; height: 30px; font-size: 12px; }
        .cluster-medium { width: 40px; height: 40px; font-size: 14px; }
        .cluster-large { width: 50px; height: 50px; font-size: 16px; }
        .leaflet-container { height: 100%; width: 100%; z-index: 1; }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="h-full w-full rounded-lg"
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
        />

        {/* Map controller for clustering and heatmap */}
        <MapController
          center={mapCenter}
          userLocation={userLocation}
          showHeatmap={showHeatmap}
          showClusters={showClusters}
          quests={filteredQuests}
          filters={filters}
        />

        {/* User location marker */}
        {userLocation ? (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
              <Popup>
                <div className="text-center p-1">
                  <p className="font-semibold text-sm">Your Location</p>
                  <p className="text-xs text-muted-foreground">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={50}
              pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--primary))', fillOpacity: 0.1 }}
            />
          </>
        ) : null}

        {/* Team members markers */}
        {teamMembers?.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={teamMemberIcon}>
            <Popup>
              <div className="flex items-center gap-2">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.username || 'Team member'} className="h-6 w-6 rounded-full" />
                ) : null}
                <div>
                  <p className="text-sm font-medium">{m.username || 'Team member'}</p>
                  <p className="text-xs text-muted-foreground">Nearby teammate</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Quest markers (when clustering is off) */}
        {!showClusters
          ? filteredQuests
              .filter((quest) => quest.latitude && quest.longitude)
              .map((quest) => (
                <Marker
                  key={quest.id}
                  position={[quest.latitude!, quest.longitude!]}
                  icon={getQuestIcon(quest.quest_type, quest.difficulty)}
                >
                  <Popup>
                    <div className="p-2 space-y-2 min-w-[180px]">
                      {quest.image_url && (
                        <img
                          src={quest.image_url}
                          alt={quest.title}
                          className="w-full h-24 object-cover rounded"
                        />
                      )}
                      <h3 className="font-semibold text-sm">{quest.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {quest.quest_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {'⭐'.repeat(quest.difficulty)}
                        </span>
                      </div>
                      <button
                        className="w-full text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
                        onClick={() => navigate(`/quest/${quest.id}`)}
                      >
                        View Quest
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))
          : null}

        {/* Quest routes */}
        {routes
          .map((route) => {
            const routeQuests = route.questIds
              .map((id) => filteredQuests.find((q) => q.id === id))
              .filter((q) => q && q.latitude && q.longitude) as Quest[];

            if (routeQuests.length < 2) return null;

            const positions = routeQuests.map((q) => [q.latitude!, q.longitude!] as [number, number]);

            return (
              <Polyline
                key={route.id}
                positions={positions}
                pathOptions={{
                  color: route.color,
                  weight: 4,
                  opacity: 0.7,
                  dashArray: '10, 10',
                }}
              />
            );
          })
          .filter((route): route is JSX.Element => route !== null)}
      </MapContainer>


      {/* Center on user button */}
      <button
        className="absolute bottom-20 right-4 z-[1000] shadow-lg px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
        onClick={centerOnUser}
      >
        <Target className="h-4 w-4" />
        {userLocation ? 'Center on Me' : 'Enable Location'}
      </button>

      {/* Map info overlay */}
      {!userLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-card text-card-foreground rounded-lg shadow-lg p-3 flex items-center gap-2">
          <Navigation2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Enable location for personalized quest discovery</span>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
