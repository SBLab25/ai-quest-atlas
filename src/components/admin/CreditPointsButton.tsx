import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { creditUserPoints } from '@/utils/creditUserPoints';
import { Coins } from 'lucide-react';

export const CreditPointsButton = () => {
  const [username, setUsername] = useState('Sovan Bhakta');
  const [points, setPoints] = useState('1000');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCredit = async () => {
    const pointsNum = parseInt(points);
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(pointsNum) || pointsNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid points amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await creditUserPoints(username, pointsNum);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to credit points",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <CardTitle>Credit User Points</CardTitle>
        </div>
        <CardDescription>
          Manually credit points to a user for testing purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username or Full Name</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username or full name"
          />
          <p className="text-xs text-muted-foreground">
            Search by username or full name (e.g., "Sovan Bhakta")
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="points">Points to Credit</Label>
          <Input
            id="points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Enter points amount"
          />
        </div>
        <Button 
          onClick={handleCredit} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Crediting..." : "Credit Points"}
        </Button>
      </CardContent>
    </Card>
  );
};
