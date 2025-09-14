import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recalculateAllUserPoints } from '@/utils/recalculateUserPoints';

export const RecalculateAllPoints: React.FC = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const handleRecalculateAll = async () => {
    try {
      setIsRecalculating(true);
      await recalculateAllUserPoints();
      
      toast({
        title: 'Success',
        description: 'All user points have been recalculated successfully.',
      });
    } catch (error) {
      console.error('Error recalculating all user points:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate user points.',
        variant: 'destructive',
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Points Recalculation
        </CardTitle>
        <CardDescription>
          Recalculate points for all users based on their historical activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>This will recalculate points for all users based on:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Daily visits: +1 point per active day + bonus points for engagement</li>
              <li>Quest completions: +10 points per approved submission</li>
              <li>Exercise quota: +5 points per active day (minimum) + engagement bonus</li>
              <li>Streak bonuses: +10 for 10+ days, +50 for 30+ days</li>
              <li>Activity bonus: Extra points based on total submission volume</li>
            </ul>
            <p className="mt-2 text-xs text-yellow-600">
              <strong>Note:</strong> The new system is more generous and rewards user engagement better.
            </p>
          </div>
          
          <Button 
            onClick={handleRecalculateAll}
            disabled={isRecalculating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate All User Points'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};