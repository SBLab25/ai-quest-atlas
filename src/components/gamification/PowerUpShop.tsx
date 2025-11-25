import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { useGamification, PowerUp } from '@/hooks/useGamification';
import { usePoints } from '@/hooks/usePoints';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getPowerUpIcon,
  getRarityColor,
  getRarityGlow,
  getDurationText,
  getPowerUpCost,
} from '@/utils/powerupUtils';

export const PowerUpShop = () => {
  const { powerUps, refresh } = useGamification();
  const { points, loading: pointsLoading, refetchPoints } = usePoints();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUp | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const userPoints = points?.shopping_points || 0; // Using shopping_points as currency (separate from score)

  // Listen for points updates (from admin crediting or other sources)
  useEffect(() => {
    if (!user) return;

    // Force immediate refresh when component mounts
    refetchPoints();

    const handlePointsUpdate = (e: CustomEvent) => {
      if (e.detail?.userId === user.id) {
        // Points were updated for this user, refresh immediately
        console.log('Points updated event received, refreshing...');
        refetchPoints();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `user_points_${user.id}`) {
        // Points were updated in another tab, refresh
        console.log('Storage change detected, refreshing points...');
        refetchPoints();
      }
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for updates every 3 seconds to catch database changes
    const interval = setInterval(() => {
      refetchPoints();
    }, 3000);

    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, refetchPoints]);

  const handlePurchaseClick = (powerUp: PowerUp) => {
    setSelectedPowerUp(powerUp);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPowerUp || !user) return;
    
    setPurchasing(true);
    try {
      const cost = getPowerUpCost(selectedPowerUp);
      
      // Call the purchase_powerup RPC function
      const { data, error } = await supabase.rpc('purchase_powerup', {
        p_user_id: user.id,
        p_powerup_id: selectedPowerUp.id,
        p_cost: cost,
      });

      if (error) {
        throw error;
      }

      const result = data as { success?: boolean; error?: string } | null;
      if (result?.success) {
        // Refresh points and powerups
        await Promise.all([refetchPoints(), refresh()]);
        
        toast({
          title: "✨ Purchase Successful!",
          description: `${selectedPowerUp.name} has been added to your inventory`,
        });
        
        setSelectedPowerUp(null);
      } else {
        throw new Error(result?.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || error.error || "Failed to purchase power-up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Points Balance */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-2xl font-bold">{userPoints} Points</p>
              <p className="text-xs text-muted-foreground">Earned from completing challenges and quests</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              refetchPoints();
              toast({
                title: "Refreshing...",
                description: "Checking for updated points",
              });
            }}
            className="text-xs"
          >
            🔄 Refresh
          </Button>
        </div>
      </Card>

      {/* Power-Up Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {powerUps.map((powerUp) => {
          const cost = getPowerUpCost(powerUp);
          const canAfford = userPoints >= cost;

          return (
            <Card 
              key={powerUp.id} 
              className={`p-4 transition-all duration-300 ${getRarityGlow(powerUp.rarity)} ${
                !canAfford ? 'opacity-60' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getPowerUpIcon(powerUp.effect_type)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getRarityColor(powerUp.rarity)}
                  >
                    {powerUp.rarity}
                  </Badge>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-lg">{powerUp.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {powerUp.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {getDurationText(powerUp.duration_hours)}
                    </span>
                  </div>
                  {powerUp.multiplier > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effect:</span>
                      <span className="font-medium text-primary">
                        {powerUp.multiplier}x multiplier
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <Button
                  className="w-full"
                  onClick={() => handlePurchaseClick(powerUp)}
                  disabled={!canAfford || purchasing}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Buy for {cost} points
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={!!selectedPowerUp} onOpenChange={() => !purchasing && setSelectedPowerUp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedPowerUp && getPowerUpIcon(selectedPowerUp.effect_type)}
              Confirm Purchase
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to purchase <strong>{selectedPowerUp?.name}</strong> for{' '}
                <strong>{selectedPowerUp && getPowerUpCost(selectedPowerUp)} points</strong>?
              </p>
              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                <p><strong>Effect:</strong> {selectedPowerUp?.description}</p>
                <p><strong>Duration:</strong> {selectedPowerUp && getDurationText(selectedPowerUp.duration_hours)}</p>
                <p><strong>Rarity:</strong> {selectedPowerUp?.rarity}</p>
              </div>
              <p className="text-xs">
                You will have <strong>{userPoints - (selectedPowerUp ? getPowerUpCost(selectedPowerUp) : 0)}</strong> points remaining.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPurchase} disabled={purchasing}>
              {purchasing ? 'Processing...' : 'Purchase'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
