import React from 'react';
import { TopNavbar } from '@/components/navigation/TopNavbar';
import { EnhancedQuestMap } from '@/components/quest/EnhancedQuestMap';
import { QuestMapControls } from '@/components/quest/QuestMapControls';
import { QuestSidebar } from '@/components/quest/QuestSidebar';
import { useQuestMap } from '@/hooks/useQuestMap';
import { useTeamLocations } from '@/hooks/useTeamLocations';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { MapIcon } from '@/components/ui/map-icon';

const QuestMapPage = () => {
  const {
    quests,
    loading,
    userLocation,
    requestLocation,
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
  } = useQuestMap();

  const { members: teamMembers, loading: teamLoading } = useTeamLocations();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <TopNavbar />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-[600px] w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-[600px] w-full rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <TopNavbar />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <MapIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Quest Map
            </h1>
          </div>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Discover {questCounts.filtered} exciting quests near you. Use filters to find your perfect
            adventure.
          </p>
        </div>

        {/* Map and Controls Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            <QuestMapControls
              showHeatmap={showHeatmap}
              onToggleHeatmap={setShowHeatmap}
              showClusters={showClusters}
              onToggleClusters={setShowClusters}
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              selectedDifficulties={selectedDifficulties}
              onToggleDifficulty={toggleDifficulty}
              maxDistance={maxDistance}
              onDistanceChange={setMaxDistance}
              showCompleted={showCompleted}
              onToggleCompleted={setShowCompleted}
              questCounts={questCounts}
            />
          </div>

          {/* Center Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-2xl border-primary/10 h-[700px]">
              <CardContent className="p-0 h-full">
                <EnhancedQuestMap
                  quests={quests}
                  userLocation={userLocation}
                  onRequestLocation={requestLocation}
                  showHeatmap={showHeatmap}
                  showClusters={showClusters}
                  filters={{
                    types: selectedTypes,
                    difficulties: selectedDifficulties,
                    maxDistance,
                    showCompleted,
                  }}
                  teamMembers={teamMembers}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Quest List */}
          <div className="lg:col-span-1 h-[700px]">
            <QuestSidebar
              quests={quests}
              userLocation={userLocation}
              onNavigateToQuest={(quest) => {
                console.log('Navigate to quest:', quest);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuestMapPage;