import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useEffect, useState } from 'react';

export default function Offline() {
  const navigate = useNavigate();
  const { getAllCachedQuests } = useOfflineStorage();
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    getAllCachedQuests().then(quests => {
      setCachedCount(quests.length);
    });
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          You're Offline
        </h1>
        
        <p className="text-muted-foreground mb-6">
          No internet connection detected. Don't worry, you can still view cached content!
        </p>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-foreground mb-2">Available Offline:</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ {cachedCount} cached quests</li>
            <li>✓ Your profile information</li>
            <li>✓ Previously viewed content</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button onClick={handleRefresh} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button onClick={() => navigate('/')} className="w-full" variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Tips for reconnecting:</strong>
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1 text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try turning airplane mode off and on</li>
            <li>• Move to an area with better signal</li>
            <li>• Restart your device if problems persist</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
