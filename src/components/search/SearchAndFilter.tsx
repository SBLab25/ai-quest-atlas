import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, X, MapPin, Star } from 'lucide-react';

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

interface SearchAndFilterProps {
  quests: Quest[];
  onFilteredQuests: (quests: Quest[]) => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ quests, onFilteredQuests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([1, 5]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'difficulty' | 'alphabetical'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique quest types and locations
  const questTypes = useMemo(() => {
    const types = [...new Set(quests.map(quest => quest.quest_type).filter(Boolean))];
    return types.sort();
  }, [quests]);

  const locations = useMemo(() => {
    const locs = [...new Set(quests.map(quest => quest.location).filter(Boolean))];
    return locs.sort();
  }, [quests]);

  // Filter and sort quests
  const filteredQuests = useMemo(() => {
    let filtered = quests.filter(quest => {
      const matchesSearch = searchTerm === '' || 
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || quest.quest_type === selectedType;
      
      const matchesDifficulty = quest.difficulty >= difficultyRange[0] && quest.difficulty <= difficultyRange[1];
      
      const matchesLocation = selectedLocation === 'all' || quest.location === selectedLocation;

      return matchesSearch && matchesType && matchesDifficulty && matchesLocation && quest.is_active;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [quests, searchTerm, selectedType, difficultyRange, selectedLocation, sortBy]);

  useEffect(() => {
    onFilteredQuests(filteredQuests);
  }, [filteredQuests, onFilteredQuests]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setDifficultyRange([1, 5]);
    setSelectedLocation('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm !== '' || selectedType !== 'all' || 
    difficultyRange[0] !== 1 || difficultyRange[1] !== 5 || 
    selectedLocation !== 'all' || sortBy !== 'newest';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Quests</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Quest Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Quest Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {questTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Range Filter */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Difficulty Range</label>
                <div className="px-2">
                  <Slider
                    value={difficultyRange}
                    onValueChange={(value) => setDifficultyRange(value as [number, number])}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {Array.from({ length: difficultyRange[0] }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current text-yellow-400" />
                    ))}
                  </span>
                  <span>to</span>
                  <span className="flex items-center gap-1">
                    {Array.from({ length: difficultyRange[1] }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current text-yellow-400" />
                    ))}
                  </span>
                </div>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="difficulty">Difficulty (Low to High)</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchTerm}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSearchTerm('')}
              />
            </Badge>
          )}
          {selectedType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {selectedType}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedType('all')}
              />
            </Badge>
          )}
          {(difficultyRange[0] !== 1 || difficultyRange[1] !== 5) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Difficulty: {difficultyRange[0]}-{difficultyRange[1]}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setDifficultyRange([1, 5])}
              />
            </Badge>
          )}
          {selectedLocation !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedLocation}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setSelectedLocation('all')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredQuests.length} quest{filteredQuests.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
};