import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  getRarityColor,
  getPowerUpIconEmoji,
  getTimeRemaining,
  getDurationText,
} from '@/utils/powerupUtils';

export const PowerUpInventory = () => {
  const { userPowerUps, activatePowerUp, getActivePowerUps } = useGamification();
  const { toast } = useToast();
  const activePowerUps = getActivePowerUps();

  const handleActivate = async (powerUpId: string, powerUpName: string) => {
    const success = await activatePowerUp(powerUpId);
    if (success) {
      toast({
        title: "⚡ Power-Up Activated!",
        description: `${powerUpName} is now active`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to activate power-up",
        variant: "destructive",
      });
    }
  };

  if (userPowerUps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No power-ups yet!</p>
        <p className="text-sm">Complete challenges and events to earn power-ups</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Power-Ups */}
      {activePowerUps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active</h4>
          <div className="grid gap-3">
            {activePowerUps.map(up => up.powerups && (
              <motion.div
                key={up.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 animate-pulse-slow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getPowerUpIconEmoji(up.powerups.effect_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{up.powerups.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {up.powerups.description}
                        </p>
                      </div>
                    </div>
                    {up.expires_at && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeRemaining(up.expires_at, false)}
                      </Badge>
                    )}
                  </div>
                </Card>
                {/* Aura effect */}
                <div className="absolute inset-0 bg-primary/5 blur-xl rounded-lg -z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Power-Ups */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">
          Available ({userPowerUps.filter(up => !up.is_active).length})
        </h4>
        <div className="grid gap-3">
          {userPowerUps
            .filter(up => !up.is_active)
            .map(up => up.powerups && (
              <Card key={up.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getPowerUpIconEmoji(up.powerups.effect_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{up.powerups.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={getRarityColor(up.powerups.rarity)}
                        >
                          {up.powerups.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {up.powerups.description}
                      </p>
                      {up.powerups.duration_hours > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {getDurationText(up.powerups.duration_hours)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleActivate(up.id, up.powerups!.name)}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
