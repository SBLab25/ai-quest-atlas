import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CreateUserWallets = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; withWallets: number; withoutWallets: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ walletsCreated: number; errors: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWalletStats = async () => {
    try {
      // Get all profiles with wallet_address field
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('wallet_address');

      if (error) {
        throw error;
      }

      const total = profiles?.length || 0;
      const withWallets = profiles?.filter((p: any) => {
        const wallet = p?.wallet_address;
        return wallet && String(wallet).trim() !== '';
      }).length || 0;
      const withoutWallets = total - withWallets;

      setStats({
        total,
        withWallets,
        withoutWallets,
      });
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      // Set default stats on error to prevent UI breakage
      setStats({
        total: 0,
        withWallets: 0,
        withoutWallets: 0,
      });
    }
  };

  const handleCreateWallets = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Starting...",
        description: "Creating wallets for users without wallet addresses...",
      });

      // Call the edge function with authorization header
      const { data, error } = await supabase.functions.invoke('create-user-wallets-batch', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Function error:', error);
        // Provide more helpful error messages
        if (error.message?.includes('Failed to send a request') || error.message?.includes('fetch')) {
          throw new Error('Edge function not found or not deployed. Please deploy the create-user-wallets-batch function.');
        }
        throw error;
      }

      if (data?.success) {
        const result = {
          walletsCreated: data.walletsCreated || 0,
          errors: data.errors || 0,
          message: data.message || 'Wallets created successfully',
        };
        setLastResult(result);
        
        toast({
          title: "Success! ✅",
          description: result.message,
        });
        // Refresh stats
        await fetchWalletStats();
        
        // Show detailed results if there were errors
        if (data.errors > 0 && data.errorDetails) {
          console.warn('Some wallets failed to create:', data.errorDetails);
          toast({
            title: "Partial Success",
            description: `${result.walletsCreated} wallets created, but ${result.errors} failed. Check console for details.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data?.error || "Failed to create wallets",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating wallets:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create wallets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchWalletStats().catch((error) => {
      console.error('Failed to fetch wallet stats on mount:', error);
      setError('Failed to load wallet statistics');
    });
  }, []);

  // Show error state if component fails to load
  if (error && !stats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Create User Wallets</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => {
            setError(null);
            fetchWalletStats();
          }} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Always render the component - it should be visible
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Create User Wallets</CardTitle>
        </div>
        <CardDescription>
          Create blockchain wallets for users who don't have one yet. This is required for NFT badge minting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats ? (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Total Users:</strong> {stats.total}</p>
                <p><strong>Users with Wallets:</strong> {stats.withWallets}</p>
                <p><strong>Users without Wallets:</strong> {stats.withoutWallets}</p>
                {lastResult && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Last run: {lastResult.walletsCreated} created, {lastResult.errors} errors
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription>
              <p>Loading wallet statistics...</p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This will create Optimism Sepolia wallets for all users who don't have a wallet address yet.
            The process will handle up to 100 users at a time. If there are more, you may need to run it multiple times.
          </p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Private keys are encrypted and stored securely. Users don't need to manage these wallets manually.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleCreateWallets} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Creating Wallets..." : "Create Wallets for All Users"}
          </Button>
          <Button 
            onClick={fetchWalletStats} 
            disabled={loading}
            variant="outline"
          >
            Refresh Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

