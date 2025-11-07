import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Layers,
  MapPin,
  Flame,
  Filter,
  Camera,
  TreePine,
  Building,
  TestTube,
  Users,
  Star,
} from 'lucide-react';

interface QuestMapControlsProps {
  showHeatmap: boolean;
  onToggleHeatmap: (show: boolean) => void;
  showClusters: boolean;
  onToggleClusters: (show: boolean) => void;
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  selectedDifficulties: number[];
  onToggleDifficulty: (difficulty: number) => void;
  maxDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  showCompleted: boolean;
  onToggleCompleted: (show: boolean) => void;
  questCounts: {
    total: number;
    filtered: number;
    byType: Record<string, number>;
  };
}

const questTypes = [
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-purple-500' },
  { id: 'nature', name: 'Nature', icon: TreePine, color: 'bg-green-500' },
  { id: 'history', name: 'History', icon: Building, color: 'bg-amber-500' },
  { id: 'science', name: 'Science', icon: TestTube, color: 'bg-blue-500' },
  { id: 'community', name: 'Community', icon: Users, color: 'bg-pink-500' },
];

export const QuestMapControls: React.FC<QuestMapControlsProps> = ({
  showHeatmap,
  onToggleHeatmap,
  showClusters,
  onToggleClusters,
  selectedTypes,
  onToggleType,
  selectedDifficulties,
  onToggleDifficulty,
  maxDistance,
  onDistanceChange,
  showCompleted,
  onToggleCompleted,
  questCounts,
}) => {
  return (
    <div className="space-y-4">
      {/* Map Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Map Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="clusters" className="text-sm">
                Cluster Markers
              </Label>
            </div>
            <Switch id="clusters" checked={showClusters} onCheckedChange={onToggleClusters} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="heatmap" className="text-sm">
                Show Heatmap
              </Label>
            </div>
            <Switch id="heatmap" checked={showHeatmap} onCheckedChange={onToggleHeatmap} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="completed" className="text-sm">
              Show Completed
            </Label>
            <Switch id="completed" checked={showCompleted} onCheckedChange={onToggleCompleted} />
          </div>
        </CardContent>
      </Card>

      {/* Quest Type Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Quest Types
            <Badge variant="secondary" className="ml-auto text-xs">
              {questCounts.filtered} of {questCounts.total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {questTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            const count = questCounts.byType[type.id] || 0;

            return (
              <Button
                key={type.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onToggleType(type.id)}
                disabled={count === 0}
              >
                <div className={`w-3 h-3 rounded-full ${type.color} mr-2`} />
                <Icon className="h-4 w-4 mr-2" />
                {type.name}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {count}
                </Badge>
              </Button>
            );
          })}

          {selectedTypes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => selectedTypes.forEach(onToggleType)}
            >
              Clear Type Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Difficulty Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Difficulty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((diff) => {
            const isSelected = selectedDifficulties.includes(diff);
            return (
              <Button
                key={diff}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onToggleDifficulty(diff)}
              >
                <div className="flex items-center">
                  {Array.from({ length: diff }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-current"
                      style={{ color: isSelected ? 'currentColor' : '#fbbf24' }}
                    />
                  ))}
                </div>
                <span className="ml-auto text-xs">{diff} Star{diff > 1 ? 's' : ''}</span>
              </Button>
            );
          })}

          {selectedDifficulties.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => selectedDifficulties.forEach(onToggleDifficulty)}
            >
              Clear Difficulty Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Distance Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Distance Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Max Distance</span>
              <span className="font-medium">
                {maxDistance ? `${maxDistance} km` : 'Unlimited'}
              </span>
            </div>
            <Slider
              value={[maxDistance || 50]}
              onValueChange={([value]) => onDistanceChange(value === 50 ? null : value)}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {maxDistance && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onDistanceChange(null)}
            >
              Show All Distances
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
